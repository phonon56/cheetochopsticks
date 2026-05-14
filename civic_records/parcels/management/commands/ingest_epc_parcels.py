"""
Ingest El Paso County parcels from the public ArcGIS FeatureServer.

Source: EPC Parcels Open Data (ArcGIS Hub)
  https://opendata-elpasoco.hub.arcgis.com/datasets/0e616418d0824212a90fcc2b9ac7fbf2_0

The dataset is a FeatureServer layer; we paginate through it 1000 features
at a time, upserting each parcel by its assessor schedule number.

USAGE
-----
    python manage.py ingest_epc_parcels                # full sync
    python manage.py ingest_epc_parcels --limit 100    # smoke test (first 100)
    python manage.py ingest_epc_parcels --dry-run      # parse, don't write
    python manage.py ingest_epc_parcels --print-attributes
        # Fetch one record and print its raw attributes so you can verify
        # the FIELD_MAP below matches the real EPC schema.

CONFIGURATION
-------------
Set the FeatureServer URL via env var EPC_PARCELS_FEATURESERVER, OR override
DEFAULT_FEATURESERVER below. To find it: open the dataset page above, click
"I want to use this" -> "View API Resources" -> copy the FeatureServer URL.
It will look like:
  https://services{N}.arcgis.com/{ORG_ID}/arcgis/rest/services/{NAME}/FeatureServer/0

If the field names don't match (different ArcGIS deployments use different
names), update FIELD_MAP. Use --print-attributes to inspect.
"""
from __future__ import annotations

import json
import logging
import os
import sys
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation
from typing import Any, Iterable

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from parcels.models import Parcel
from records.ingest_base import ingest_run

SOURCE_NAME = "epc_parcels"

logger = logging.getLogger(__name__)

DEFAULT_FEATURESERVER = os.environ.get("EPC_PARCELS_FEATURESERVER", "")
PAGE_SIZE = 1000
REQUEST_TIMEOUT = 60

# Map ArcGIS attribute names -> Parcel model fields.
# Defaults below match the EPC HubPublic/Parcels/MapServer/0 schema:
#   PARCEL, OBJECTID, HYPERLINK, Shape.STArea(), Shape.STLength()
# (geometry-only — address/owner/zoning live in the Spatialest assessor
# system at the URL in HYPERLINK, not in this layer).
# Other ArcGIS deployments use different names — run --print-attributes
# and tweak this dict.
FIELD_MAP: dict[str, list[str]] = {
    "parcel_id":  ["PARCEL", "SCHEDNUM", "PARCEL_NO", "PIN", "AccountNo"],
    "address":    ["SITE_ADDR", "SiteAddress", "STREET_ADD", "SitusAddress"],
    "city":       ["SITE_CITY", "SiteCity", "City"],
    "zip_code":   ["SITE_ZIP", "SiteZip", "ZIP"],
    "acres":      ["ACRES", "TOTAL_ACRES", "GIS_ACRES"],
    "zoning":     ["ZONING", "ZONE_CODE", "ZONE"],
}

# If acres isn't in FIELD_MAP, derive from Shape.STArea() (square feet).
SQFT_AREA_FIELD = "Shape.STArea()"
SQFT_PER_ACRE = Decimal("43560")

# If the parcel sits inside a city limit (per attribute or fallback), we
# stamp jurisdiction='city'. Default is 'county'.
CITY_FIELD_HINTS = ["JURISDICT", "CITY_LIMIT", "MUNI", "MUNICIPALITY"]
CITY_VALUES = {"COLORADO SPRINGS", "CITY", "COS", "TRUE", "1", "Y", "YES"}


class Command(BaseCommand):
    help = "Ingest El Paso County parcels from the public ArcGIS FeatureServer."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit", type=int, default=None,
            help="Stop after N features (smoke test).",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Parse but do not write to the database.",
        )
        parser.add_argument(
            "--print-attributes", action="store_true",
            help="Fetch one feature and print its raw attribute keys/values.",
        )
        parser.add_argument(
            "--url", default=None,
            help="Override the FeatureServer URL for this run.",
        )

    def handle(self, *args, **opts):
        url = opts["url"] or DEFAULT_FEATURESERVER
        if not url:
            raise CommandError(
                "No FeatureServer URL configured. Set the EPC_PARCELS_FEATURESERVER "
                "env var, edit DEFAULT_FEATURESERVER in this file, or pass --url. "
                "Find the URL on the ArcGIS Hub dataset page (see module docstring)."
            )
        url = url.rstrip("/")

        if opts["print_attributes"]:
            self._print_sample_attributes(url)
            return

        limit = opts["limit"]
        dry_run = opts["dry_run"]

        with ingest_run(SOURCE_NAME, notes=f"url={url}") as run:
            for i, feature in enumerate(self._iter_features(url, limit=limit)):
                try:
                    outcome = self._upsert(feature, dry_run=dry_run)
                except Exception as exc:
                    logger.warning("Skipping feature %d: %s", i, exc)
                    run.records_failed += 1
                    continue
                if outcome == "created":
                    run.records_created += 1
                elif outcome == "updated":
                    run.records_updated += 1
                else:
                    run.records_skipped += 1

                if (i + 1) % 1000 == 0:
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

    def _iter_features(
        self, base_url: str, limit: int | None = None
    ) -> Iterable[dict[str, Any]]:
        """Paginate the FeatureServer, yielding one GeoJSON feature at a time."""
        offset = 0
        emitted = 0
        while True:
            page_size = PAGE_SIZE if limit is None else min(PAGE_SIZE, limit - emitted)
            if page_size <= 0:
                return

            params = {
                "where": "1=1",
                "outFields": "*",
                "outSR": "4326",
                "f": "geojson",
                "resultOffset": offset,
                "resultRecordCount": page_size,
            }
            qs = urllib.parse.urlencode(params)
            full_url = f"{base_url}/query?{qs}"

            self.stdout.write(f"GET {full_url[:100]}...")
            with urllib.request.urlopen(full_url, timeout=REQUEST_TIMEOUT) as resp:
                payload = json.loads(resp.read())

            features = payload.get("features", [])
            if not features:
                return

            for feat in features:
                yield feat
                emitted += 1
                if limit is not None and emitted >= limit:
                    return

            # ArcGIS sets exceededTransferLimit when there are more pages.
            if not payload.get("exceededTransferLimit") and len(features) < page_size:
                return
            offset += len(features)

    def _print_sample_attributes(self, base_url: str):
        """Pull one feature and dump its raw attributes — for FIELD_MAP tuning."""
        params = {
            "where": "1=1", "outFields": "*", "outSR": "4326",
            "f": "geojson", "resultRecordCount": 1,
        }
        full_url = f"{base_url}/query?{urllib.parse.urlencode(params)}"
        self.stdout.write(f"Fetching one sample feature from:\n  {full_url}\n")
        with urllib.request.urlopen(full_url, timeout=REQUEST_TIMEOUT) as resp:
            payload = json.loads(resp.read())
        features = payload.get("features", [])
        if not features:
            self.stdout.write(self.style.WARNING("No features returned."))
            return
        props = features[0].get("properties", {})
        self.stdout.write(self.style.SUCCESS("Sample attributes:"))
        for k in sorted(props):
            v = props[k]
            v_str = repr(v)[:80]
            self.stdout.write(f"  {k:30s} = {v_str}")
        self.stdout.write(
            "\nUpdate FIELD_MAP in this command to point at the right keys."
        )

    # ── Transform & save ─────────────────────────────────────────────────

    def _upsert(self, feature: dict, *, dry_run: bool) -> str:
        props = feature.get("properties", {}) or {}
        geom_json = feature.get("geometry")

        parcel_id = self._first_value(props, FIELD_MAP["parcel_id"])
        if not parcel_id:
            raise ValueError("no parcel_id field matched")
        parcel_id = str(parcel_id).strip()

        polygon = self._coerce_polygon(geom_json)

        # Acres: prefer an explicit field, fall back to Shape.STArea() / 43560
        acres = self._to_decimal(self._first_value(props, FIELD_MAP["acres"]))
        if acres is None:
            sqft = self._to_decimal(props.get(SQFT_AREA_FIELD))
            if sqft is not None:
                acres = (sqft / SQFT_PER_ACRE).quantize(Decimal("0.0001"))

        defaults = {
            "address":     (self._first_value(props, FIELD_MAP["address"]) or "").strip(),
            "city":        (self._first_value(props, FIELD_MAP["city"]) or "Colorado Springs").strip(),
            "zip_code":    self._normalize_zip(self._first_value(props, FIELD_MAP["zip_code"])),
            "zoning":      (self._first_value(props, FIELD_MAP["zoning"]) or "").strip(),
            "acres":       acres,
            "jurisdiction": self._infer_jurisdiction(props),
        }
        if polygon is not None:
            defaults["geometry"] = polygon

        if dry_run:
            return "would-write"

        with transaction.atomic():
            obj, created = Parcel.objects.update_or_create(
                parcel_id=parcel_id, defaults=defaults
            )
        return "created" if created else "updated"

    @staticmethod
    def _first_value(props: dict, keys: list[str]) -> Any:
        for k in keys:
            v = props.get(k)
            if v not in (None, ""):
                return v
        return None

    @staticmethod
    def _normalize_zip(v: Any) -> str:
        if v in (None, ""):
            return ""
        s = str(v).split("-")[0].strip()  # 80908-1234 -> 80908
        return s[:10]

    @staticmethod
    def _to_decimal(v: Any) -> Decimal | None:
        if v in (None, ""):
            return None
        try:
            return Decimal(str(v)).quantize(Decimal("0.0001"))
        except (InvalidOperation, ValueError):
            return None

    @staticmethod
    def _infer_jurisdiction(props: dict) -> str:
        for hint in CITY_FIELD_HINTS:
            v = props.get(hint)
            if v is None:
                continue
            if str(v).strip().upper() in CITY_VALUES:
                return "city"
        return "county"

    @staticmethod
    def _coerce_polygon(geom_json: dict | None) -> Polygon | None:
        """
        Parcel.geometry is a PolygonField. EPC sometimes returns
        MultiPolygon for split parcels — use the largest ring in that case
        and log a note.
        """
        if not geom_json:
            return None
        geom = GEOSGeometry(json.dumps(geom_json), srid=4326)
        if isinstance(geom, Polygon):
            return geom
        if isinstance(geom, MultiPolygon) and len(geom):
            largest = max(geom, key=lambda p: p.area)
            logger.info("MultiPolygon collapsed to largest ring (%d parts)", len(geom))
            return largest
        return None
