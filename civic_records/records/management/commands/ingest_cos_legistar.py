"""
Ingest Colorado Springs City Council meeting items from the Legistar
public InSite API.

Source: Granicus Legistar
  https://webapi.legistar.com/v1/coloradosprings/

Legistar exposes a JSON REST API — much cleaner than the AgendaSuite
HTML scrape needed for the County. Endpoints used:

  /v1/coloradosprings/Bodies         List meeting bodies (City Council, etc.)
  /v1/coloradosprings/Events         List meetings (Events). Supports OData
                                     $filter to scope by date range.
  /v1/coloradosprings/Events/{id}/EventItems   Agenda items for a meeting

USAGE
-----
    python manage.py ingest_cos_legistar --since 2026-01-01 --limit 50 --dry-run
    python manage.py ingest_cos_legistar --since 2026-01-01

    # Bodies only (no meeting/item data; useful first run to see structure)
    python manage.py ingest_cos_legistar --list-bodies

CONFIGURATION
-------------
Defaults to the 'coloradosprings' Legistar tenant. Override via
LEGISTAR_CLIENT env var if needed (e.g., another Granicus subdomain).

NOTES
-----
- Each EventItem becomes one Record (record_type='meeting_item').
- We try to extract a parcel reference from the item title/text. Items
  with no parcel match are still saved (parcel=null) so they appear in
  jurisdictional views and become re-matchable later.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any, Iterable

from django.contrib.gis.geos import Point  # noqa: F401  (future use)
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from records.ingest_base import hash_payload, ingest_run
from records.models import Record
from records.parcel_match import find_parcel

logger = logging.getLogger(__name__)

SOURCE_NAME = "cos_legistar"
CLIENT = os.environ.get("LEGISTAR_CLIENT", "coloradosprings")
BASE_URL = f"https://webapi.legistar.com/v1/{CLIENT}"
REQUEST_TIMEOUT = 60
PAGE_SIZE = 1000  # Legistar default cap

# Map Legistar's matter status / event-item type to our STATUSES.
STATUS_MAP = {
    "passed":      "completed",
    "approved":    "completed",
    "adopted":     "completed",
    "failed":      "denied",
    "denied":      "denied",
    "withdrawn":   "withdrawn",
    "tabled":      "scheduled",
    "postponed":   "scheduled",
    "filed":       "closed",
    "received":    "closed",
}


class Command(BaseCommand):
    help = "Ingest Colorado Springs City Council meeting items from Legistar."

    def add_arguments(self, parser):
        parser.add_argument("--since", default=None,
                            help="Only events on/after this date (YYYY-MM-DD).")
        parser.add_argument("--limit", type=int, default=None,
                            help="Stop after N events (smoke test).")
        parser.add_argument("--dry-run", action="store_true",
                            help="Parse but don't write.")
        parser.add_argument("--list-bodies", action="store_true",
                            help="Print available meeting bodies and exit.")

    def handle(self, *args, **opts):
        if opts["list_bodies"]:
            self._list_bodies()
            return

        since = opts["since"]
        limit = opts["limit"]
        dry_run = opts["dry_run"]

        with ingest_run(SOURCE_NAME, notes=f"client={CLIENT} since={since}") as run:
            for i, event in enumerate(self._iter_events(since=since, limit=limit)):
                event_id = event.get("EventId")
                self.stdout.write(
                    f"Event {event_id}: {event.get('EventBodyName')} "
                    f"@ {event.get('EventDate', '')[:10]}"
                )
                items = self._fetch_event_items(event_id)
                for item in items:
                    try:
                        outcome = self._upsert_item(
                            event=event, item=item, dry_run=dry_run,
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

    # ── HTTP layer ────────────────────────────────────────────────────────

    def _list_bodies(self):
        url = f"{BASE_URL}/Bodies?$top=200"
        with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as resp:
            bodies = json.loads(resp.read())
        self.stdout.write(self.style.SUCCESS(
            f"\n{len(bodies)} meeting bodies in '{CLIENT}' Legistar tenant:\n"
        ))
        for b in sorted(bodies, key=lambda x: (not x.get("BodyActiveFlag"), x.get("BodyName", ""))):
            active = "active" if b.get("BodyActiveFlag") else "inactive"
            self.stdout.write(
                f"  [{b['BodyId']:>4}] {b.get('BodyName', '?'):50s} ({active})"
            )

    def _iter_events(
        self, *, since: str | None, limit: int | None,
    ) -> Iterable[dict[str, Any]]:
        params: dict[str, Any] = {"$top": PAGE_SIZE, "$orderby": "EventDate desc"}
        if since:
            # Validate the date — fail fast on typos
            datetime.strptime(since, "%Y-%m-%d")
            params["$filter"] = f"EventDate ge datetime'{since}'"

        skip = 0
        emitted = 0
        while True:
            params["$skip"] = skip
            url = f"{BASE_URL}/Events?{urllib.parse.urlencode(params)}"
            self.stdout.write(f"GET {url[:120]}...")
            with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as resp:
                events = json.loads(resp.read())
            if not events:
                return
            for ev in events:
                yield ev
                emitted += 1
                if limit is not None and emitted >= limit:
                    return
            if len(events) < PAGE_SIZE:
                return
            skip += len(events)

    def _fetch_event_items(self, event_id: int) -> list[dict[str, Any]]:
        url = f"{BASE_URL}/Events/{event_id}/EventItems?AgendaNote=1&MinutesNote=1"
        try:
            with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as resp:
                return json.loads(resp.read())
        except Exception as exc:
            logger.warning("Failed to fetch items for event %s: %s", event_id, exc)
            return []

    # ── Transform & save ─────────────────────────────────────────────────

    def _upsert_item(
        self, *, event: dict, item: dict, dry_run: bool,
    ) -> str:
        item_id = item.get("EventItemId")
        if not item_id:
            raise ValueError("no EventItemId on item payload")
        source_id = str(item_id)
        new_hash = hash_payload({"event": event, "item": item})

        existing = Record.objects.filter(
            source_system=SOURCE_NAME, source_id=source_id,
        ).only("id", "record_id", "source_hash").first()
        if existing and existing.source_hash == new_hash and not dry_run:
            return "skipped"

        # Title fall-through: Legistar has many optional title-ish fields
        # depending on the agenda type. Try richest first; sequence number
        # is the last resort and gets a friendlier label.
        title = ""
        for k in ("EventItemTitle", "EventItemMatterName",
                  "EventItemActionText"):
            v = item.get(k)
            if v and str(v).strip():
                title = str(v).strip()
                break
        if not title:
            seq = item.get("EventItemAgendaSequence")
            title = f"Agenda position {seq}" if seq else "Untitled agenda item"

        # EventItemTitle is the short summary; EventItemMatterAttachments often
        # contains a longer staff memo description.
        body_parts = []
        for k in ("EventItemActionText", "EventItemActionMovedBy",
                  "EventItemActionSecondedBy"):
            v = item.get(k)
            if v:
                body_parts.append(f"{k}: {v}")
        body_parts.append(json.dumps({
            "matter_id":  item.get("EventItemMatterId"),
            "matter_name": item.get("EventItemMatterName"),
            "matter_status": item.get("EventItemMatterStatus"),
            "matter_type":   item.get("EventItemMatterType"),
        }, indent=2))
        description = "\n".join(p for p in body_parts if p)

        # Try to extract a parcel from the title + description
        parcel = find_parcel(f"{title}\n{description}")

        occurred_at = self._parse_dt(event.get("EventDate"), event.get("EventTime"))
        status = STATUS_MAP.get(
            (item.get("EventItemMatterStatus") or "").lower().strip(),
            "scheduled",
        )

        defaults = {
            "parcel": parcel,
            "record_type": "meeting_item",
            "title": title[:512],
            "description": description,
            "owner_department": (event.get("EventBodyName") or "")[:128],
            "status": status,
            "source_url": event.get("EventInSiteURL", "") or "",
            "source_hash": new_hash,
            "last_synced_at": timezone.now(),
            "occurred_at": occurred_at,
        }
        if dry_run:
            return "would-write" if not existing else "would-update"

        with transaction.atomic():
            obj, created = Record.objects.update_or_create(
                source_system=SOURCE_NAME, source_id=source_id,
                defaults={
                    **defaults,
                    "record_id": (existing and existing.record_id)
                                 or f"{SOURCE_NAME}:{source_id}",
                },
            )
        return "created" if created else "updated"

    @staticmethod
    def _parse_dt(date_str, time_str):
        if not date_str:
            return None
        try:
            dt = parse_datetime(date_str.replace("T00:00:00", "T00:00:00+00:00"))
        except (TypeError, ValueError):
            return None
        if dt and not dt.tzinfo:
            dt = timezone.make_aware(dt)
        return dt
