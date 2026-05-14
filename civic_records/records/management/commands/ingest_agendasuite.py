"""
Ingest meeting agenda items from a Tyler iCompass / AgendaSuite tenant.

Default tenant: 'elpaso' (El Paso County BOCC + commissions).

Source: AgendaSuite
  https://www.agendasuite.org/iip/{tenant}/

AgendaSuite is server-rendered HTML — no public API. We scrape:

  /iip/{tenant}/meeting/list                  meeting index
  /iip/{tenant}/meeting/details/{meeting_id}  one meeting page
                                              (lists agenda items inline)

Each agenda item becomes a Record. We try to extract a parcel reference
from item text (EPC items usually carry an explicit "Parcel No. XXXX"
or street address); items with no match are saved with parcel=null.

USAGE
-----
    python manage.py ingest_agendasuite --limit 5 --dry-run
    python manage.py ingest_agendasuite --tenant elpaso
    python manage.py ingest_agendasuite --since 2026-01-01

CONFIGURATION
-------------
Override the tenant via --tenant or AGENDASUITE_TENANT env var.
Other AgendaSuite-hosted entities (special districts, other counties)
should work identically with their own slug.
"""
from __future__ import annotations

import logging
import os
import re
import urllib.parse
import urllib.request
from datetime import date, datetime
from typing import Iterable

from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date

from records.ingest_base import hash_payload, ingest_run
from records.models import Record
from records.parcel_match import find_parcel

logger = logging.getLogger(__name__)

SOURCE_NAME_PREFIX = "agendasuite"
DEFAULT_TENANT = os.environ.get("AGENDASUITE_TENANT", "elpaso")
BASE = "https://www.agendasuite.org"
REQUEST_TIMEOUT = 60

# Each link in the meeting list looks like:
#   <a href="/iip/elpaso/meeting/details/2702">Board of County Commissioners</a>
MEETING_LINK_RE = re.compile(r"^/iip/[^/]+/meeting/details/(\d+)$")

# Each agenda item detail link:
#   <a href="/iip/elpaso/agendaitem/details/9150">...</a>
ITEM_LINK_RE = re.compile(r"^/iip/[^/]+/agendaitem/details/(\d+)$")

# Date strings appear like "05/14/2026 at 9:00 AM" in meeting headers.
DATE_RE = re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})")


class Command(BaseCommand):
    help = "Ingest agenda items from an AgendaSuite (Tyler iCompass) tenant."

    def add_arguments(self, parser):
        parser.add_argument("--tenant", default=DEFAULT_TENANT,
                            help=f"AgendaSuite tenant slug (default '{DEFAULT_TENANT}').")
        parser.add_argument("--since", default=None,
                            help="Only meetings on/after this date (YYYY-MM-DD).")
        parser.add_argument("--limit", type=int, default=None,
                            help="Stop after N meetings.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Parse but don't write.")

    def handle(self, *args, **opts):
        tenant = opts["tenant"]
        since = parse_date(opts["since"]) if opts["since"] else None
        limit = opts["limit"]
        dry_run = opts["dry_run"]

        source = f"{SOURCE_NAME_PREFIX}_{tenant}"

        with ingest_run(source, notes=f"tenant={tenant} since={since}") as run:
            for i, meeting in enumerate(self._iter_meetings(tenant, since=since, limit=limit)):
                meeting_url = f"{BASE}/iip/{tenant}/meeting/details/{meeting['id']}"
                self.stdout.write(
                    f"Meeting {meeting['id']}: {meeting.get('label', '?')} "
                    f"@ {meeting.get('date', '?')}"
                )
                items = list(self._iter_meeting_items(meeting_url))
                for item in items:
                    try:
                        outcome = self._upsert_item(
                            source=source, tenant=tenant,
                            meeting=meeting, meeting_url=meeting_url,
                            item=item, dry_run=dry_run,
                        )
                    except Exception as exc:
                        logger.warning("Item failed: %s", exc)
                        run.records_failed += 1
                        continue
                    if outcome == "created":
                        run.records_created += 1
                    elif outcome == "updated":
                        run.records_updated += 1
                    else:
                        run.records_skipped += 1

            verb = "Would have written" if dry_run else "Wrote"
            self.stdout.write(self.style.SUCCESS(
                f"{verb}: created={run.records_created} "
                f"updated={run.records_updated} "
                f"skipped={run.records_skipped} "
                f"failed={run.records_failed}"
            ))

    # ── HTTP / parse layer ────────────────────────────────────────────────

    def _get(self, url: str) -> BeautifulSoup:
        req = urllib.request.Request(
            url, headers={"User-Agent": "civic-records-ingest/1.0"},
        )
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return BeautifulSoup(resp.read(), "html.parser")

    def _iter_meetings(
        self, tenant: str, *, since: date | None, limit: int | None,
    ) -> Iterable[dict]:
        """
        Meetings are in a <table>. Each <tr> has cells:
          [type, code-and-number, date, time, body_name, action_links]
        We find the link via MEETING_LINK_RE, then climb to its <tr>
        and pull body name + date from the surrounding cells.
        """
        url = f"{BASE}/iip/{tenant}/meeting/list"
        self.stdout.write(f"GET {url}")
        soup = self._get(url)

        seen: set[int] = set()
        emitted = 0
        for a in soup.find_all("a", href=True):
            m = MEETING_LINK_RE.match(a["href"])
            if not m:
                continue
            meeting_id = int(m.group(1))
            if meeting_id in seen:
                continue
            seen.add(meeting_id)

            tr = a.find_parent("tr")
            cells = [td.get_text(" ", strip=True) for td in tr.find_all("td")] if tr else []

            # Cells we care about (defensive about index drift):
            #  cells[1] = "BOCLU - 9/2026"  (board code + meeting #)
            #  cells[2] = "05/14/2026"
            #  cells[3] = "9:00 AM"
            #  cells[4] = "Board of County Commissioners (Land Use)"
            board_code   = cells[1] if len(cells) > 1 else ""
            date_text    = cells[2] if len(cells) > 2 else ""
            time_text    = cells[3] if len(cells) > 3 else ""
            body_name    = cells[4] if len(cells) > 4 else ""
            row_text     = " ".join(cells)

            meeting_date = self._extract_date(date_text or row_text)
            if since and meeting_date and meeting_date < since:
                continue

            yield {
                "id": meeting_id,
                "label": body_name or board_code or "Unknown body",
                "date": meeting_date.isoformat() if meeting_date else None,
                "time": time_text,
                "code": board_code,
                "row_text": row_text,
            }
            emitted += 1
            if limit is not None and emitted >= limit:
                return

    # Item numbers like "6.a." or "12.b.iv." that prefix the descriptive title.
    ITEM_NUM_PREFIX_RE = re.compile(r"^\s*\d+\.[a-z]\.(?:[ivx]+\.)?\s*", re.IGNORECASE)

    def _iter_meeting_items(self, meeting_url: str) -> Iterable[dict]:
        """
        Walk up the DOM from each item link until we find an ancestor with
        substantive text (>= MIN_ITEM_TEXT). That's the agenda item body.
        The immediate parent is usually just the item number ('261/2026').
        """
        MIN_ITEM_TEXT = 80
        soup = self._get(meeting_url)
        for a in soup.find_all("a", href=True):
            m = ITEM_LINK_RE.match(a["href"])
            if not m:
                continue
            item_id = int(m.group(1))
            item_number = a.parent.get_text(" ", strip=True) if a.parent else ""

            # Find the smallest ancestor with substantive text
            body_text = ""
            cur = a.parent
            for _ in range(6):
                if cur is None or cur.name in ("body", "html"):
                    break
                cur = cur.parent
                if cur is None:
                    break
                text = cur.get_text(" ", strip=True)
                if len(text) >= MIN_ITEM_TEXT:
                    body_text = text
                    break

            # Title: strip the "6.a." prefix, then take everything up to the
            # first explanatory marker (" - A request by", " - A petition",
            # ". The property", etc.) so we keep ACTION - PROJECT NAME but
            # drop the long narrative. Cap at 240 chars as backstop.
            stripped = self.ITEM_NUM_PREFIX_RE.sub("", body_text).strip()
            title_candidate = stripped
            for marker in (" - A request", " - A petition", " - Request",
                           ". The property", ". A request", " by ", "."):
                idx = title_candidate.find(marker)
                if 20 < idx < 240:
                    title_candidate = title_candidate[:idx].rstrip(" -.")
                    break
            title_candidate = title_candidate[:240].strip()
            if not title_candidate:
                title_candidate = f"Agenda item {item_number}"

            yield {
                "id": item_id,
                "item_number": item_number,
                "title_hint": title_candidate[:240],
                "raw_text": body_text,
            }

    @staticmethod
    def _extract_date(text: str) -> date | None:
        m = DATE_RE.search(text)
        if not m:
            return None
        try:
            return date(int(m.group(3)), int(m.group(1)), int(m.group(2)))
        except ValueError:
            return None

    # ── Save ─────────────────────────────────────────────────────────────

    def _upsert_item(
        self, *, source: str, tenant: str,
        meeting: dict, meeting_url: str, item: dict, dry_run: bool,
    ) -> str:
        source_id = str(item["id"])
        new_hash = hash_payload({"meeting": meeting, "item": item})

        existing = Record.objects.filter(
            source_system=source, source_id=source_id,
        ).only("id", "record_id", "source_hash").first()
        if existing and existing.source_hash == new_hash and not dry_run:
            return "skipped"

        title = (item.get("title_hint") or item.get("raw_text", "")[:80] or "Untitled").strip()
        description = item.get("raw_text", "").strip()
        parcel = find_parcel(description) or find_parcel(title)

        occurred_at = None
        if meeting.get("date"):
            d = parse_date(meeting["date"])
            if d:
                occurred_at = timezone.make_aware(datetime.combine(d, datetime.min.time()))

        defaults = {
            "parcel": parcel,
            "record_type": "meeting_item",
            "title": title[:512],
            "description": description,
            "owner_department": (meeting.get("label") or "")[:128],
            "status": "completed",
            "source_url": f"{BASE}/iip/{tenant}/agendaitem/details/{source_id}",
            "source_hash": new_hash,
            "last_synced_at": timezone.now(),
            "occurred_at": occurred_at,
        }
        if dry_run:
            return "would-write" if not existing else "would-update"

        with transaction.atomic():
            obj, created = Record.objects.update_or_create(
                source_system=source, source_id=source_id,
                defaults={
                    **defaults,
                    "record_id": (existing and existing.record_id)
                                 or f"{source}:{source_id}",
                },
            )
        return "created" if created else "updated"
