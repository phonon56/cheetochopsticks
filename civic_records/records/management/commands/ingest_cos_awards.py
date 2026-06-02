"""
Ingest City of Colorado Springs contract awards.

Source: https://coloradosprings.gov/procurement-services/page/contract-award-information
        (single 6-column HTML table; ~76 awards, oldest at the bottom)

Lifecycle linkage — the meaningful idea here:
  Each award row has an RFP/IFB Number. That number is the same identifier
  used in /solicitations. We use it to link an Award Record back to its
  originating Solicitation Record via `connected_records` (M2M). This is
  what makes Projects useful — over time a single procurement effort
  shows up as: solicitation issued → solicitation closed → award made →
  contract started, all queryable as one timeline.

Most awards predate our /solicitations snapshot (closed before we ingested),
so the connected_records hit rate will be low at first. As the system runs
nightly for a few months, the linkage rate climbs.

USAGE
-----
    python manage.py ingest_cos_awards --limit 5 --dry-run
    python manage.py ingest_cos_awards
"""
from __future__ import annotations

import logging
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Iterable

import urllib.request
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date

from projects.linkers import find_best_project
from records.ingest_base import hash_payload, ingest_run
from records.models import Record

logger = logging.getLogger(__name__)

SOURCE_NAME = "cos_awards"
DEFAULT_BASE = "https://coloradosprings.gov"
INDEX_PATH = "/procurement-services/page/contract-award-information"
REQUEST_TIMEOUT = 30
USER_AGENT = "civic-records-ingest/1.0"

DOLLAR_RE = re.compile(r"\$?\s*([\d,]+(?:\.\d{2})?)")


class Command(BaseCommand):
    help = "Ingest awarded contracts from coloradosprings.gov."

    def add_arguments(self, parser):
        parser.add_argument("--base", default=DEFAULT_BASE)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        base = opts["base"].rstrip("/")
        limit = opts["limit"]
        dry_run = opts["dry_run"]

        with ingest_run(SOURCE_NAME, notes=f"base={base}") as run:
            rows = list(self._iter_awards(base, limit=limit))
            self.stdout.write(f"Found {len(rows)} award row(s).")

            for i, row in enumerate(rows, 1):
                try:
                    outcome, linked = self._upsert(
                        base=base, row=row, dry_run=dry_run,
                    )
                except Exception as exc:
                    logger.warning("Row failed (%s): %s",
                                   row.get("rfp_number"), exc)
                    run.records_failed += 1
                    continue

                if outcome == "created":
                    run.records_created += 1
                elif outcome == "updated":
                    run.records_updated += 1
                else:
                    run.records_skipped += 1

                if linked:
                    self.stdout.write(f"  ↳ linked award {row['rfp_number']} "
                                      f"to existing solicitation Record")

                if i % 25 == 0:
                    self.stdout.write(
                        f"  ... {i}/{len(rows)} | "
                        f"created={run.records_created} "
                        f"updated={run.records_updated} "
                        f"skipped={run.records_skipped} "
                        f"failed={run.records_failed}"
                    )

            verb = "Would have written" if dry_run else "Wrote"
            self.stdout.write(self.style.SUCCESS(
                f"{verb}: created={run.records_created} "
                f"updated={run.records_updated} "
                f"skipped={run.records_skipped} "
                f"failed={run.records_failed}"
            ))

    # ── HTTP / parse layer ────────────────────────────────────────────────

    def _iter_awards(self, base: str, *, limit: int | None) -> Iterable[dict]:
        url = f"{base}{INDEX_PATH}"
        self.stdout.write(f"GET {url}")
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            soup = BeautifulSoup(resp.read(), "html.parser")

        table = soup.find("table")
        if not table:
            return
        rows = table.find_all("tr")[1:]  # skip header

        emitted = 0
        for tr in rows:
            cells = [td.get_text(" ", strip=True) for td in tr.find_all(["td", "th"])]
            if len(cells) < 5:
                continue
            yield {
                "rfp_number":  cells[0],
                "project_name": cells[1],
                "contractor":   cells[2],
                "amount_str":   cells[3],
                "start_date_str": cells[4],
                "notes":        cells[5] if len(cells) > 5 else "",
                "page_url":     f"{base}{INDEX_PATH}",
            }
            emitted += 1
            if limit is not None and emitted >= limit:
                return

    # ── Save ─────────────────────────────────────────────────────────────

    def _upsert(self, *, base: str, row: dict, dry_run: bool) -> tuple[str, bool]:
        rfp = row["rfp_number"]
        new_hash = hash_payload(row)

        existing = Record.objects.filter(
            source_system=SOURCE_NAME, source_id=rfp,
        ).only("id", "record_id", "source_hash").first()
        if existing and existing.source_hash == new_hash and not dry_run:
            return "skipped", False

        amount = self._parse_amount(row["amount_str"])
        occurred = self._parse_date(row["start_date_str"])

        # Title structure: "{project_name} — awarded to {contractor}"
        title = f"{row['project_name']} — awarded to {row['contractor']}"

        desc_lines = [
            f"RFP/IFB number: {rfp}",
            f"Awarded contractor: {row['contractor']}",
            f"Awarded amount: {row['amount_str']}",
            f"Contract start: {row['start_date_str']}",
        ]
        if row.get("notes"):
            desc_lines.append(f"Notes: {row['notes']}")
        description = "\n".join(desc_lines)

        # Project link via shared layered linker
        project = find_best_project(row["project_name"] + "\n" + description)

        defaults = {
            "parcel": None,  # awards rarely parcel-keyed
            "project": project,
            "record_type": "award",
            "status": "completed",
            "title": title[:512],
            "description": description,
            "owner_department": "City Procurement",
            "source_url": row["page_url"],
            "source_hash": new_hash,
            "last_synced_at": timezone.now(),
            "occurred_at": occurred,
        }

        if dry_run:
            return ("would-write" if not existing else "would-update"), False

        with transaction.atomic():
            obj, created = Record.objects.update_or_create(
                source_system=SOURCE_NAME, source_id=rfp,
                defaults={
                    **defaults,
                    "record_id": (existing and existing.record_id)
                                 or f"{SOURCE_NAME}:{rfp}",
                },
            )
            # Lifecycle link: any other Record that shares this source_id
            # (typically the originating Solicitation Record from
            # cos_solicitations) gets connected via the M2M.
            siblings = Record.objects.filter(source_id=rfp).exclude(id=obj.id)
            linked = siblings.exists()
            if linked:
                obj.connected_records.add(*siblings)

        return ("created" if created else "updated"), linked

    # ── Helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _parse_amount(s: str) -> Decimal | None:
        if not s:
            return None
        m = DOLLAR_RE.search(s)
        if not m:
            return None
        try:
            return Decimal(m.group(1).replace(",", ""))
        except InvalidOperation:
            return None

    @staticmethod
    def _parse_date(s: str):
        """Parse strings like 'February 1, 2026' or '6/29/2023' or 'Upon contract execution'."""
        if not s:
            return None
        s = s.strip()
        for fmt in ("%B %d, %Y", "%b %d, %Y", "%m/%d/%Y", "%Y-%m-%d"):
            try:
                d = datetime.strptime(s, fmt)
                return timezone.make_aware(d)
            except ValueError:
                continue
        return None  # "Upon contract execution" and similar are unparsable

