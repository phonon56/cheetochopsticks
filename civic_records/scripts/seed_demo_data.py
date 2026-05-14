"""
Seed the database with a small set of demo parcels and records, including
9805 Federal Drive in Colorado Springs and a sample Cimarron Hills parcel,
plus a small set of records that demonstrate the parcel-keyed pattern.

Run this from inside the web container:
    docker compose exec web python scripts/seed_demo_data.py

It's idempotent — running it twice won't duplicate data.
"""
import os
import sys
import django

# Bootstrap Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.gis.geos import Polygon, Point  # noqa: E402
from django.utils import timezone  # noqa: E402
from datetime import timedelta  # noqa: E402

from parcels.models import Parcel, CouncilDistrict  # noqa: E402
from records.models import Record, RecordHistory  # noqa: E402


def make_square_polygon(lon, lat, size_deg=0.0005):
    """Return a small square polygon centered on (lon, lat) for demo display."""
    half = size_deg / 2
    return Polygon((
        (lon - half, lat - half),
        (lon + half, lat - half),
        (lon + half, lat + half),
        (lon - half, lat + half),
        (lon - half, lat - half),
    ), srid=4326)


def seed():
    print("Seeding demo data...")

    # --- Districts ---
    casey, _ = CouncilDistrict.objects.update_or_create(
        district_type="city_council", number="2",
        defaults={
            "name": "Northern Colorado Springs",
            "representative": "Ken Casey",
        }
    )
    geitner, _ = CouncilDistrict.objects.update_or_create(
        district_type="bocc", number="2",
        defaults={
            "name": "East Side / Cimarron Hills / Falcon / Calhan",
            "representative": "Carrie Geitner",
        }
    )
    williams, _ = CouncilDistrict.objects.update_or_create(
        district_type="bocc", number="1",
        defaults={
            "name": "Northern El Paso County",
            "representative": "Holly Williams",
        }
    )

    # --- Parcels ---
    # 9805 Federal Drive — InterQuest, City of Colorado Springs, District 2
    federal, _ = Parcel.objects.update_or_create(
        parcel_id="6207103015",  # illustrative — replace with real APN
        defaults={
            "address": "9805 Federal Drive",
            "city": "Colorado Springs",
            "state": "CO",
            "zip_code": "80921",
            "jurisdiction": "city",
            "council_district": casey,
            "geometry": make_square_polygon(-104.81710, 38.95890),
            "zoning": "PUD (InterQuest North)",
            "acres": 1.85,
        }
    )

    # 1826 Wooten Rd — unincorporated Cimarron Hills
    wooten, _ = Parcel.objects.update_or_create(
        parcel_id="5421203009",
        defaults={
            "address": "1826 Wooten Road",
            "city": "Colorado Springs",
            "state": "CO",
            "zip_code": "80915",
            "jurisdiction": "county",
            "council_district": geitner,
            "geometry": make_square_polygon(-104.71240, 38.84030),
            "zoning": "R-1 (County)",
            "acres": 0.23,
        }
    )

    # A Lorson Ranch parcel — example of cross-cutting development project
    lorson, _ = Parcel.objects.update_or_create(
        parcel_id="6401303008",
        defaults={
            "address": "Lorson Ranch (representative parcel)",
            "city": "Colorado Springs",
            "state": "CO",
            "zip_code": "80925",
            "jurisdiction": "shared",
            "geometry": make_square_polygon(-104.66020, 38.74180),
            "zoning": "PUD",
            "acres": 4.5,
        }
    )

    print(f"  Parcels: {Parcel.objects.count()}")

    # --- Records on 9805 Federal Drive ---
    now = timezone.now()

    r1, _ = Record.objects.update_or_create(
        record_id="GoCOS-2026-104872",
        defaults={
            "parcel": federal,
            "record_type": "request",
            "title": "Pothole reported on Federal Drive near InterQuest Pkwy",
            "description": (
                "Driver-reported pothole in the southbound lane. "
                "Approximately 6 inches across, 2 inches deep."
            ),
            "status": "completed",
            "owner_department": "Public Works — Operations & Maintenance",
            "source_system": "GoCOS",
            "source_url": "https://coloradosprings.gov/gocos",
            "plain_summary": (
                "A driver reported a pothole on Federal Drive. The City's "
                "pothole crew patched it three days later."
            ),
            "occurred_at": now - timedelta(days=21),
        }
    )
    if not r1.history.exists():
        RecordHistory.objects.create(
            record=r1, from_status="", to_status="open",
            changed_at=now - timedelta(days=21),
            changed_by="GoCOS auto-intake"
        )
        RecordHistory.objects.create(
            record=r1, from_status="open", to_status="in_progress",
            changed_at=now - timedelta(days=20),
            changed_by="Dispatcher — Public Works",
            note="Assigned to pothole crew."
        )
        RecordHistory.objects.create(
            record=r1, from_status="in_progress", to_status="completed",
            changed_at=now - timedelta(days=18),
            changed_by="Crew lead",
            note="Pothole patched. Single dispatch."
        )

    r2, _ = Record.objects.update_or_create(
        record_id="2C-2026-PLAN-Federal",
        defaults={
            "parcel": federal,
            "record_type": "project",
            "title": "Federal Drive NOT included in 2026 2C paving list",
            "description": (
                "The published 2026 2C Paving List prioritizes Circle Drive, "
                "Union Boulevard, Palmer Park Boulevard, Chelton Road and "
                "other arterials. Federal Drive in InterQuest is not on the "
                "list for this year and will be maintained via routine "
                "pothole-repair operations between paving cycles."
            ),
            "status": "scheduled",
            "owner_department": "Public Works — 2C Program",
            "source_system": "2C Paving List 2026 (PDF)",
            "source_url": "https://coloradosprings.gov/document/2026-2c-paving-list.pdf",
            "plain_summary": (
                "Federal Drive is not being repaved in 2026 under the 2C "
                "program. Maintenance happens via the regular pothole-repair "
                "workflow."
            ),
            "occurred_at": now - timedelta(days=120),
        }
    )

    r3, _ = Record.objects.update_or_create(
        record_id="BOE-CC-2026-04-22-Item-7",
        defaults={
            "parcel": federal,
            "record_type": "meeting_item",
            "title": "City Council briefing — 2C Q1 2026 operational update",
            "description": (
                "Q1 2026 update on the 2C Road Improvements program. "
                "Materials cite 33% reduction in pothole complaints since "
                "2C inception and 1,900+ lane miles repaved to date."
            ),
            "status": "completed",
            "owner_department": "City Council",
            "source_system": "BoardDocs",
            "plain_summary": (
                "City Council heard a quarterly update on the road-paving "
                "program. The City reported fewer pothole complaints and "
                "more lane miles repaved."
            ),
            "occurred_at": now - timedelta(days=22),
        }
    )

    # Cross-link the two Federal Drive records
    r1.connected_records.add(r2)
    r2.connected_records.add(r3)

    # --- Records on Wooten Road (county example) ---
    r4, _ = Record.objects.update_or_create(
        record_id="EPC-PW-2026-08812",
        defaults={
            "parcel": wooten,
            "record_type": "request",
            "title": "Republic Drive pothole repair — single dispatch",
            "description": (
                "El Paso County Public Works crew dispatched to repair one "
                "pothole. Observer noted multiple additional defects on the "
                "same segment that were not addressed."
            ),
            "status": "completed",
            "owner_department": "El Paso County Public Works",
            "source_system": "Citizen Connect",
            "plain_summary": (
                "A county crew fixed one pothole on Republic Drive but "
                "did not address other nearby potholes on the same trip."
            ),
            "occurred_at": now - timedelta(days=1),
        }
    )

    # --- Records on Lorson Ranch (cross-cutting development) ---
    Record.objects.update_or_create(
        record_id="PPRBD-PERMIT-2025-44215",
        defaults={
            "parcel": lorson,
            "record_type": "permit",
            "title": "Residential development phase — Lorson Ranch",
            "description": "Phase grading and infrastructure permit.",
            "status": "completed",
            "owner_department": "Pikes Peak Regional Building Department",
            "source_system": "PPRBD",
            "occurred_at": now - timedelta(days=200),
        }
    )

    Record.objects.update_or_create(
        record_id="EPC-FIN-2026-MILL-LEVY",
        defaults={
            "parcel": lorson,
            "record_type": "financial",
            "title": "2026 mill levy schedule — applicable taxing districts",
            "description": (
                "Combined mill levy of overlapping districts (county, "
                "school, fire, metro district)."
            ),
            "status": "completed",
            "owner_department": "El Paso County Assessor",
            "source_system": "Assessor",
            "plain_summary": (
                "Property tax rate for Lorson Ranch in 2026, totaled across "
                "all the taxing districts that apply to this address."
            ),
            "occurred_at": now - timedelta(days=140),
        }
    )

    print(f"  Records: {Record.objects.count()}")
    print(f"  History entries: {RecordHistory.objects.count()}")
    print("Done. Visit /parcel/6207103015/ for the Federal Drive example.")


if __name__ == "__main__":
    seed()
