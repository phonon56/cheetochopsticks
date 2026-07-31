"""
Ingest El Paso County development applications from the EDARP portal.

Source: https://epcdevplanreview.com/Public/ActiveList/

EDARP (El Paso County Development Applications Review Portal) is a custom
ASP.NET MVC application — no API, no JSON feed, no RSS. The ActiveList page
returns ~310 currently-active projects as one large HTML table; per-project
detail lives at /Public/ProjectDetails/{id}.

The cheap path is one GET to ActiveList: gives us project name, file #,
applicant, location, parcel for every active project. That's enough to
populate a Record skeleton on the right parcel. Per-project enrichment
(year, project manager, status detail, project type, created date) needs
one extra GET per project — opt-in via --enrich because it's 310 polite
requests on top of the first one.

USAGE
-----
    # MVP path — one HTTP request, ~310 record skeletons. Safe.
    python manage.py ingest_epc_devplan

    # Full enrichment — adds project manager, year, type, status detail.
    # Polite 0.5s delay between detail requests; ~3 min for 310 projects.
    python manage.py ingest_epc_devplan --enrich

    # Dry run, no DB writes.
    python manage.py ingest_epc_devplan --dry-run

    # Limit to first N rows for smoke testing.
    python manage.py ingest_epc_devplan --limit 5

NOTES
-----
- ActiveList only shows currently-active projects. Closed/withdrawn ones
  fall off when EPC archives them. Records that disappear from ActiveList
  but exist in our DB are NOT auto-closed by this ingester — that's a
  separate reconciliation pass, because "absent from list" can also mean
  "EDARP had a transient blip."
- The parcel column on ActiveList is frequently blank. When present it's a
  10-digit EPC parcel ID; we try direct lookup first, then fall through to
  parcel_match.find_parcel() on the Location text, then persist parcel-less
  if both fail.
- Some rows have multiple parcels on the detail page (e.g. county-access
  applications spanning two lots). For v1 we capture the first; multi-parcel
  handling is enrichment work.
- record_id is `edarp:{file_number}` — File Numbers are stable EDARP IDs
  (e.g. PPR2418, CA262, AL2410). The detail-page ID (197797) is internal
  and shouldn't be the primary key.
"""
from __future__ import annotations

import logging
import re
import time
import urllib.request
from typing import Iterable

from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.db import transaction

from records.ingest_base import hash_payload, ingest_run
from records.models import Record
from records.parcel_match import find_parcel

logger = logging.getLogger(__name__)

SOURCE_NAME = "edarp"
DEFAULT_BASE = "https://epcdevplanreview.com"
ACTIVE_LIST_PATH = "/Public/ActiveList/"
PROJECT_DETAILS_PATH = "/Public/ProjectDetails/{id}"
REQUEST_TIMEOUT = 30
USER_AGENT = "civic-records-ingest/1.0"
ENRICH_DELAY_SECONDS = 0.5

# EDARP shows "Active" for every row on ActiveList. The Status text we'll
# find on detail pages is one of these — map to civic_records' STATUSES.
STATUS_MAP = {
    "active": "in_review",
    "in review": "in_review",
    "pending": "in_review",
    "approved": "completed",
    "closed": "closed",
    "denied": "denied",
    "withdrawn": "withdrawn",
}


def _http_get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_active_list(base: str = DEFAULT_BASE) -> list[dict]:
    """
    GET /Public/ActiveList/ and parse the table into one dict per row.

    Returned dict keys:
      project_id    - the detail-page URL ID (e.g. "197797")
      project_name  - "Humphrey Platte Ave Self Storage"
      file_number   - "PPR2418"
      applicant     - "RMG"
      location      - "WINSLOW DR / COLORADO SPRINGS, CO 80908" or ""
      parcel_id     - "5418000075" or ""
      source_url    - canonical /Public/ProjectDetails/{id} URL
    """
    html = _http_get(base + ACTIVE_LIST_PATH)
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="table-striped")
    if not table:
        raise RuntimeError("EDARP ActiveList: table.table-striped not found — page structure changed?")

    rows = []
    for tr in table.find("tbody").find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) < 5:
            continue
        anchor = tds[0].find("a", href=True)
        if not anchor:
            continue
        # /Public/ProjectDetails/197797 → 197797
        m = re.search(r"/Public/ProjectDetails/(\d+)", anchor["href"])
        project_id = m.group(1) if m else ""
        # Parcel column has a span; the span contents are the 10-digit ID
        parcel_span = tds[4].find("span")
        parcel_id = parcel_span.get_text(strip=True) if parcel_span else ""
        # Location can have a <br/> between street and city; collapse whitespace
        location = re.sub(r"\s+", " ", tds[3].get_text(separator=" ", strip=True))

        rows.append({
            "project_id": project_id,
            "project_name": anchor.get_text(strip=True),
            "file_number": tds[1].get_text(strip=True),
            "applicant": tds[2].get_text(strip=True),
            "location": location,
            "parcel_id": parcel_id,
            "source_url": f"{base}/Public/ProjectDetails/{project_id}" if project_id else "",
        })
    return rows


def fetch_project_details(project_id: str, base: str = DEFAULT_BASE) -> dict:
    """
    GET /Public/ProjectDetails/{id} and pull the labeled fields out of the
    Project Details panel. Returns a flat dict — empty strings for fields
    not present. Robust to label ordering and to extra fields appearing
    later (the detail page is simple definition-list style).
    """
    url = base + PROJECT_DETAILS_PATH.format(id=project_id)
    html = _http_get(url)
    soup = BeautifulSoup(html, "html.parser")

    # The Project Details panel uses a label-then-value pattern. We grab every
    # <strong>/<dt>/<label>-style label and the next sibling text node. Loose
    # enough to survive cosmetic markup changes.
    fields = {}
    # The page renders labels in <dt> within <dl class="dl-horizontal"> in
    # most builds; fall back to label/strong if the panel ever changes.
    for dl in soup.find_all("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        for dt, dd in zip(dts, dds):
            label = dt.get_text(strip=True).lower().replace(" ", "_")
            value = dd.get_text(separator=" ", strip=True)
            if label and value and label not in fields:
                fields[label] = value
    return {
        "file_number": fields.get("file_number", ""),
        "project_name": fields.get("project_name", ""),
        "parcels": fields.get("parcels", ""),
        "applicant": fields.get("applicant", ""),
        "ea_number": fields.get("ea_number", ""),
        "file_prefix": fields.get("file_prefix", ""),
        "year": fields.get("year", ""),
        "project_manager": fields.get("project_manager", ""),
        "status": fields.get("status", ""),
        "created": fields.get("created", ""),
    }


def _resolve_parcel(row: dict):
    """Return a Parcel instance or None. Direct lookup first, then text-match fallback."""
    from parcels.models import Parcel
    if row.get("parcel_id"):
        try:
            return Parcel.objects.get(parcel_id=row["parcel_id"])
        except Parcel.DoesNotExist:
            pass
    # Fallback: try free-text matching on the location field.
    text = " ".join(filter(None, [row.get("location"), row.get("project_name")]))
    return find_parcel(text) if text.strip() else None


def _upsert_record(row: dict, detail: dict, dry_run: bool):
    """
    Upsert a Record from one EDARP row (+ optional detail enrichment).
    Returns the tuple (record_or_none, action) where action is one of
    'created', 'updated', 'skipped'.
    """
    file_number = row["file_number"]
    if not file_number:
        return None, "skipped"

    parcel = _resolve_parcel(row)

    description_parts = []
    if row.get("location"):
        description_parts.append(f"Location: {row['location']}")
    if row.get("applicant"):
        description_parts.append(f"Applicant: {row['applicant']}")
    if detail.get("file_prefix"):
        description_parts.append(f"Type: {detail['file_prefix']}")
    if detail.get("year"):
        description_parts.append(f"Year: {detail['year']}")
    if detail.get("ea_number"):
        description_parts.append(f"EA: {detail['ea_number']}")
    description = "\n".join(description_parts)

    # Status: detail page > ActiveList default. ActiveList by definition is
    # "active" so map to in_review unless detail tells us otherwise.
    raw_status = (detail.get("status") or "active").strip().lower()
    status = STATUS_MAP.get(raw_status, "in_review")

    payload_for_hash = {
        "file_number": file_number,
        "project_name": row["project_name"],
        "applicant": row.get("applicant", ""),
        "location": row.get("location", ""),
        "parcel_id": row.get("parcel_id", ""),
        "status": status,
        "year": detail.get("year", ""),
        "project_manager": detail.get("project_manager", ""),
    }
    new_hash = hash_payload(payload_for_hash)

    record_id = f"edarp:{file_number}"

    if dry_run:
        return None, "dry-run"

    with transaction.atomic():
        record, created = Record.objects.update_or_create(
            source_system=SOURCE_NAME,
            source_id=file_number,
            defaults={
                "record_id": record_id,
                "parcel": parcel,
                "record_type": "permit",
                "title": row["project_name"][:512],
                "description": description,
                "status": status,
                "owner_department": "El Paso County Planning",
                "owner_person": detail.get("project_manager", "")[:128],
                "source_url": row.get("source_url", "")[:1024],
                "source_hash": new_hash,
            },
        )
    return record, ("created" if created else "updated")


class Command(BaseCommand):
    help = "Ingest active development applications from epcdevplanreview.com (EDARP)."

    def add_arguments(self, parser):
        parser.add_argument("--base", default=DEFAULT_BASE,
                            help=f"Base URL (default: {DEFAULT_BASE})")
        parser.add_argument("--enrich", action="store_true",
                            help="Fetch per-project detail pages (one GET per project, polite delay).")
        parser.add_argument("--dry-run", action="store_true",
                            help="Parse and report, don't write to DB.")
        parser.add_argument("--limit", type=int, default=0,
                            help="Process only the first N projects (smoke test).")

    def handle(self, *args, **opts):
        base = opts["base"]
        enrich = opts["enrich"]
        dry_run = opts["dry_run"]
        limit = opts["limit"]

        self.stdout.write(f"Fetching {base}{ACTIVE_LIST_PATH} …")
        try:
            rows = fetch_active_list(base)
        except Exception as err:
            self.stderr.write(self.style.ERROR(f"ActiveList fetch failed: {err}"))
            raise

        self.stdout.write(f"  → {len(rows)} active projects")
        if limit:
            rows = rows[:limit]
            self.stdout.write(f"  → limiting to first {limit}")

        with ingest_run(SOURCE_NAME, notes=f"enrich={enrich} dry_run={dry_run} limit={limit}") as run:
            for i, row in enumerate(rows, start=1):
                detail = {}
                if enrich and row.get("project_id"):
                    try:
                        detail = fetch_project_details(row["project_id"], base)
                        if i < len(rows):
                            time.sleep(ENRICH_DELAY_SECONDS)
                    except Exception as err:
                        logger.warning("EDARP detail fetch failed for %s: %s", row["project_id"], err)
                        run.records_failed += 1
                        continue

                try:
                    _, action = _upsert_record(row, detail, dry_run=dry_run)
                except Exception as err:
                    logger.exception("EDARP upsert failed for %s", row.get("file_number"))
                    self.stderr.write(self.style.ERROR(
                        f"  ✗ {row.get('file_number')}: {err}"
                    ))
                    run.records_failed += 1
                    continue

                if action == "created":
                    run.records_created += 1
                elif action == "updated":
                    run.records_updated += 1
                elif action == "skipped":
                    run.records_skipped += 1

                if i % 25 == 0 or i == len(rows):
                    self.stdout.write(
                        f"  [{i}/{len(rows)}] created={run.records_created} "
                        f"updated={run.records_updated} skipped={run.records_skipped} "
                        f"failed={run.records_failed}"
                    )

        self.stdout.write(self.style.SUCCESS(
            f"EDARP ingest done. created={run.records_created} updated={run.records_updated} "
            f"skipped={run.records_skipped} failed={run.records_failed}"
        ))
