"""
Ingest Colorado Springs Police Department records from the CSPD Socrata
data hub.

Source: CSPD Data Hub (Socrata)
  https://policedata.coloradosprings.gov

Socrata exposes each dataset as a JSON REST endpoint:
  https://policedata.coloradosprings.gov/resource/{dataset_id}.json

This command pulls one dataset, paginates through it (1000 rows per page,
Socrata's max for unauthenticated requests), and upserts each row as a
Record. Rows with lat/lng are point-in-polygon-joined to a Parcel via the
Parcel.geometry field.

USAGE
-----
    # Smoke test — fetch one row and dump its raw fields so you can confirm
    # the FIELD_MAP below matches the actual dataset schema:
    python manage.py ingest_cspd_socrata --print-attributes

    # Pull first 100 rows, don't write:
    python manage.py ingest_cspd_socrata --limit 100 --dry-run

    # Full sync (uses the configured dataset):
    python manage.py ingest_cspd_socrata

CONFIGURATION
-------------
Two env vars (or pass on the CLI):

  SOCRATA_DATASET_URL   Full JSON endpoint, e.g.
                        https://policedata.coloradosprings.gov/resource/{id}.json
  SOCRATA_APP_TOKEN     Optional. Free at https://opendata.socrata.com/profile/app_tokens
                        Without one you're rate-limited (~1k requests/hour).

Find dataset IDs by browsing https://policedata.coloradosprings.gov/browse —
each dataset has an ID like "bc88-hemr" in its URL. The .json endpoint is
.../resource/{id}.json (NOT the views URL).

PREREQUISITE
------------
This command attaches each Record to a Parcel via spatial join. Run
`ingest_epc_parcels` FIRST so there are parcels to join against. Rows that
don't fall inside any parcel are skipped (counted as 'skipped' on the
IngestRun).
"""
from __future__ import annotations

import json
import logging
import os
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any, Iterable

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from parcels.models import Parcel
from records.ingest_base import hash_payload, ingest_run
from records.models import Record

logger = logging.getLogger(__name__)

SOURCE_NAME = "cspd_socrata"
DEFAULT_DATASET_URL = os.environ.get("SOCRATA_DATASET_URL", "")
APP_TOKEN = os.environ.get("SOCRATA_APP_TOKEN", "")
PAGE_SIZE = 1000
REQUEST_TIMEOUT = 60

# Socrata field-name mapping. Most CSPD incident-style datasets share a
# similar shape; tweak per dataset after running --print-attributes.
# Each value is a list of candidate field names tried in order.
FIELD_MAP: dict[str, list[str]] = {
    "source_id":   ["case_number", "incident_number", "event_id",
                    "id_number", "id", ":id"],
    "title":       ["call_type", "nature_of_call", "incident_type",
                    "offense", "title", "description"],
    "description": ["narrative", "summary", "details", "description"],
    "occurred_at": ["call_date", "incident_date", "date_occurred",
                    "occurred_at", "report_date", "datetime"],
    "address":     ["location", "address", "block_address", "street_address"],
    "status":      ["disposition", "status", "case_status"],
    "department":  ["division", "agency", "responding_unit"],
}

# Socrata datasets often expose location as either:
#   row['point'] = {'type': 'Point', 'coordinates': [lng, lat]}
#   row['latitude'], row['longitude']
LATITUDE_FIELDS  = ["latitude", "lat", "y_coord"]
LONGITUDE_FIELDS = ["longitude", "long", "lng", "x_coord"]
POINT_FIELDS     = ["point", "location_point", "geocoded_column"]

# Map raw Socrata status/disposition values -> our STATUSES choices.
STATUS_MAP = {
    # add real mappings once you see actual values via --print-attributes
    "active":      "open",
    "open":        "open",
    "closed":      "closed",
    "cleared":     "closed",
    "in progress": "in_progress",
    "completed":   "completed",
    "denied":      "denied",
}


class Command(BaseCommand):
    help = "Ingest CSPD records from the Colorado Springs Socrata data hub."

    def add_arguments(self, parser):
        parser.add_argument("--url", default=None,
                            help="Override SOCRATA_DATASET_URL for this run.")
        parser.add_argument("--limit", type=int, default=None,
                            help="Stop after N rows (smoke test).")
        parser.add_argument("--dry-run", action="store_true",
                            help="Parse, don't write.")
        parser.add_argument("--print-attributes", action="store_true",
                            help="Fetch one row, dump raw field names/values.")
        parser.add_argument("--record-type", default="request",
                            help="Record.record_type to use for ingested rows. "
                                 "Default 'request' (Service Request).")

    def handle(self, *args, **opts):
        url = opts["url"] or DEFAULT_DATASET_URL
        if not url:
            raise CommandError(
                "No SOCRATA_DATASET_URL configured. Set the env var, pass --url, "
                "or browse https://policedata.coloradosprings.gov/browse to pick "
                "a dataset (its .json endpoint is the value to use)."
            )

        if opts["print_attributes"]:
            self._print_sample_attributes(url)
            return

        if Parcel.objects.count() == 0:
            self.stdout.write(self.style.WARNING(
                "No parcels in DB — every row will be skipped. "
                "Run `ingest_epc_parcels` first."
            ))

        record_type = opts["record_type"]
        limit = opts["limit"]
        dry_run = opts["dry_run"]

        with ingest_run(SOURCE_NAME, notes=f"url={url}") as run:
            for i, row in enumerate(self._iter_rows(url, limit=limit)):
                try:
                    outcome = self._upsert(
                        row, record_type=record_type, dry_run=dry_run,
                    )
                except Exception as exc:
                    logger.warning("Row %d failed: %s", i, exc)
                    run.records_failed += 1
                    continue

                if outcome == "created":
                    run.records_created += 1
                elif outcome == "updated":
                    run.records_updated += 1
                else:
                    run.records_skipped += 1

                if (i + 1) % 500 == 0:
                    self.stdout.write(
                        f"  ... {i + 1} processed | "
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

    # ── HTTP layer ────────────────────────────────────────────────────────

    def _iter_rows(
        self, url: str, limit: int | None = None
    ) -> Iterable[dict[str, Any]]:
        offset = 0
        emitted = 0
        while True:
            page_size = PAGE_SIZE if limit is None else min(PAGE_SIZE, limit - emitted)
            if page_size <= 0:
                return

            params = {"$limit": page_size, "$offset": offset, "$order": ":id"}
            qs = urllib.parse.urlencode(params)
            sep = "&" if "?" in url else "?"
            full_url = f"{url}{sep}{qs}"

            self.stdout.write(f"GET {full_url[:120]}...")
            req = urllib.request.Request(full_url)
            if APP_TOKEN:
                req.add_header("X-App-Token", APP_TOKEN)

            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                rows = json.loads(resp.read())

            if not rows:
                return
            for row in rows:
                yield row
                emitted += 1
                if limit is not None and emitted >= limit:
                    return
            if len(rows) < page_size:
                return
            offset += len(rows)

    def _print_sample_attributes(self, url: str):
        params = {"$limit": 1}
        sep = "&" if "?" in url else "?"
        full_url = f"{url}{sep}{urllib.parse.urlencode(params)}"
        self.stdout.write(f"Fetching one row from:\n  {full_url}\n")
        req = urllib.request.Request(full_url)
        if APP_TOKEN:
            req.add_header("X-App-Token", APP_TOKEN)
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            rows = json.loads(resp.read())
        if not rows:
            self.stdout.write(self.style.WARNING("No rows returned."))
            return
        row = rows[0]
        self.stdout.write(self.style.SUCCESS("Sample row:"))
        for k in sorted(row):
            v_str = repr(row[k])[:80]
            self.stdout.write(f"  {k:30s} = {v_str}")
        self.stdout.write(
            "\nUpdate FIELD_MAP, LATITUDE_FIELDS, LONGITUDE_FIELDS, "
            "and STATUS_MAP in this command to match."
        )

    # ── Transform & save ─────────────────────────────────────────────────

    def _upsert(
        self, row: dict, *, record_type: str, dry_run: bool,
    ) -> str:
        source_id = self._first(row, FIELD_MAP["source_id"])
        if not source_id:
            raise ValueError("no source_id field matched")
        source_id = str(source_id).strip()

        new_hash = hash_payload(row)

        # Skip unchanged rows without touching the DB beyond a single SELECT.
        existing = Record.objects.filter(
            source_system=SOURCE_NAME, source_id=source_id
        ).only("id", "source_hash").first()
        if existing and existing.source_hash == new_hash and not dry_run:
            return "skipped"

        # Spatial join — required to attach to a Parcel.
        point = self._extract_point(row)
        if point is None:
            return "skipped"
        parcel = (
            Parcel.objects.filter(geometry__intersects=point)
            .only("id").first()
        )
        if parcel is None:
            return "skipped"

        title = (self._first(row, FIELD_MAP["title"]) or "Untitled").strip()
        description = (self._first(row, FIELD_MAP["description"]) or "").strip()
        address = (self._first(row, FIELD_MAP["address"]) or "").strip()
        department = (self._first(row, FIELD_MAP["department"]) or "").strip()
        occurred_at = self._parse_datetime(self._first(row, FIELD_MAP["occurred_at"]))
        status = self._map_status(self._first(row, FIELD_MAP["status"]))

        defaults = {
            "parcel": parcel,
            "record_type": record_type,
            "title": title[:512],
            "description": description,
            "owner_department": department[:128],
            "status": status,
            "source_url": "",
            "source_hash": new_hash,
            "last_synced_at": timezone.now(),
            "point_location": point,
        }
        if occurred_at is not None:
            defaults["occurred_at"] = occurred_at

        if dry_run:
            return "would-write" if not existing else "would-update"

        with transaction.atomic():
            obj, created = Record.objects.update_or_create(
                source_system=SOURCE_NAME, source_id=source_id,
                defaults={
                    **defaults,
                    # record_id is unique-required; if creating, mint one
                    # from source. If updating, leave whatever's there.
                    "record_id": (existing and existing.record_id)
                                 or f"{SOURCE_NAME}:{source_id}",
                },
            )
        return "created" if created else "updated"

    # ── Field helpers ────────────────────────────────────────────────────

    @staticmethod
    def _first(row: dict, keys: list[str]) -> Any:
        for k in keys:
            v = row.get(k)
            if v not in (None, ""):
                return v
        return None

    def _extract_point(self, row: dict) -> Point | None:
        # Try GeoJSON-like point fields first
        for k in POINT_FIELDS:
            v = row.get(k)
            if isinstance(v, dict) and v.get("type") == "Point":
                coords = v.get("coordinates")
                if coords and len(coords) == 2:
                    lng, lat = coords
                    return Point(float(lng), float(lat), srid=4326)
        # Then explicit lat/lng fields
        lat = self._first(row, LATITUDE_FIELDS)
        lng = self._first(row, LONGITUDE_FIELDS)
        if lat is not None and lng is not None:
            try:
                return Point(float(lng), float(lat), srid=4326)
            except (TypeError, ValueError):
                return None
        return None

    @staticmethod
    def _parse_datetime(v: Any) -> datetime | None:
        if not v:
            return None
        if isinstance(v, datetime):
            return v if v.tzinfo else timezone.make_aware(v)
        try:
            dt = parse_datetime(str(v))
        except (TypeError, ValueError):
            return None
        if dt and not dt.tzinfo:
            dt = timezone.make_aware(dt)
        return dt

    @staticmethod
    def _map_status(raw: Any) -> str:
        if raw is None:
            return "open"
        return STATUS_MAP.get(str(raw).strip().lower(), "open")
