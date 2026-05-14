"""
Enrich Parcel rows with owner + valuation data scraped from the El Paso
County Assessor's public Spatialest portal.

WHY THIS EXISTS
---------------
The EPC parcels MapServer (used by ingest_epc_parcels) returns geometry
and parcel_id only — no owner, no value, no year built. That data lives
in the per-parcel Spatialest pages at:

    https://property.spatialest.com/co/elpaso/#/property/{parcel_id}

There is no documented public REST API for Spatialest, so we drive a
headless Chromium via Playwright, wait for the SPA to render, and parse
the rendered DOM. This is intentionally slow (default 1 req/sec) and
caches aggressively (skip parcels assessed within the last 90 days).

LONG-TERM PATH
--------------
Scraping is brittle. The cleaner solution is to email asrweb@elpasoco.com
and request a data sharing agreement / direct extract from the Assessor's
office — they will share bulk CSV/Excel exports under a DSA. Use this
command for the bootstrap and for spot-updates; replace with a feed once
the DSA is in place.

USAGE
-----
    # Smoke test against 5 parcels
    python manage.py enrich_epc_assessor --limit 5

    # Re-scrape everything regardless of cache age
    python manage.py enrich_epc_assessor --force

    # Crawl gently (1 req every 3s) when running unattended
    python manage.py enrich_epc_assessor --delay 3.0

OPTIONS
-------
    --limit N        Stop after N parcels.
    --delay SECONDS  Seconds between parcel fetches (default 1.0).
    --force          Re-scrape parcels even if last_assessed_at is fresh.
    --max-age-days N Treat parcels assessed within N days as fresh (default 90).
    --parcel-id ID   Scrape a single parcel by ID (debugging).
    --headed         Run with a visible browser (debugging).
"""
from __future__ import annotations

import logging
import re
import time
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from typing import Any, Iterable

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from parcels.models import Parcel
from records.ingest_base import ingest_run

SOURCE_NAME = "epc_assessor"

logger = logging.getLogger(__name__)

PROPERTY_URL = "https://property.spatialest.com/co/elpaso/#/property/{parcel_id}"

# How long to wait for the SPA to render expected content before giving up
# on a parcel and logging a skip.
RENDER_TIMEOUT_MS = 10_000

# A short list of label-text fragments we expect to appear once the SPA has
# rendered. Wait for any one of them, then start extraction.
RENDER_MARKERS = ["Owner", "Parcel", "Market Value", "Assessed Value"]

# Field label patterns. Each entry is (model_field, [regex_patterns]).
# The patterns are matched case-insensitively against the rendered page
# text. Order matters — first match wins. Kept generous because Spatialest
# tweaks layout/wording over time.
#
# Each pattern is expected to capture the value in group 1.
FIELD_PATTERNS: dict[str, list[str]] = {
    "owner_name": [
        r"Owner(?:\s*Name)?\s*[:\n]\s*([^\n]+)",
        r"Owner of Record\s*[:\n]\s*([^\n]+)",
    ],
    "owner_mailing_address": [
        r"Mailing\s*Address\s*[:\n]\s*([^\n]+(?:\n[^\n:]+){0,2})",
        r"Owner\s*Address\s*[:\n]\s*([^\n]+(?:\n[^\n:]+){0,2})",
    ],
    "market_value": [
        r"Total\s*Market\s*Value\s*[:\n]\s*\$?\s*([\d,]+(?:\.\d+)?)",
        r"Market\s*Value\s*[:\n]\s*\$?\s*([\d,]+(?:\.\d+)?)",
        r"Actual\s*Value\s*[:\n]\s*\$?\s*([\d,]+(?:\.\d+)?)",
    ],
    "assessed_value": [
        r"Total\s*Assessed\s*Value\s*[:\n]\s*\$?\s*([\d,]+(?:\.\d+)?)",
        r"Assessed\s*Value\s*[:\n]\s*\$?\s*([\d,]+(?:\.\d+)?)",
    ],
    "year_built": [
        r"Year\s*Built\s*[:\n]\s*(\d{4})",
    ],
    "property_class": [
        r"Property\s*Class\s*[:\n]\s*([^\n]+)",
        r"Property\s*Type\s*[:\n]\s*([^\n]+)",
        r"Class(?:ification)?\s*[:\n]\s*([^\n]+)",
    ],
}


class Command(BaseCommand):
    help = (
        "Scrape owner + valuation data from the EPC Spatialest portal and "
        "write it back to existing Parcel rows. Skips parcels enriched "
        "within the last 90 days unless --force is passed."
    )

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--delay", type=float, default=1.0)
        parser.add_argument("--force", action="store_true")
        parser.add_argument("--max-age-days", type=int, default=90)
        parser.add_argument("--parcel-id", default=None)
        parser.add_argument("--headed", action="store_true")

    def handle(self, *args, **opts):
        try:
            from playwright.sync_api import (  # noqa: WPS433 (local import)
                sync_playwright,
                TimeoutError as PWTimeout,
            )
        except ImportError as exc:
            self.stderr.write(self.style.ERROR(
                "playwright is not installed. Run:\n"
                "  pip install playwright && python -m playwright install chromium"
            ))
            raise SystemExit(1) from exc

        delay = float(opts["delay"])
        force = bool(opts["force"])
        limit = opts["limit"]
        max_age = timedelta(days=int(opts["max_age_days"]))
        single_id = opts["parcel_id"]
        headed = bool(opts["headed"])

        # Materialize the queryset upfront — slicing + iterator() + count()
        # interact awkwardly, and the working set here is small (hundreds,
        # not millions). Saves us from repeated re-evaluation, too.
        parcels = list(self._select_parcels(single_id, force, max_age, limit))
        total = len(parcels)
        if total == 0:
            self.stdout.write("Nothing to enrich (use --force to re-scrape).")
            return

        self.stdout.write(
            f"Enriching up to {total} parcel(s) "
            f"(delay={delay}s, force={force}, max_age={max_age.days}d)"
        )

        notes = (
            f"delay={delay} force={force} max_age_days={max_age.days} "
            f"limit={limit} parcel_id={single_id or ''}"
        )

        with ingest_run(SOURCE_NAME, notes=notes) as run, sync_playwright() as pw:
            browser = pw.chromium.launch(headless=not headed)
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (civic_records enrich_epc_assessor; "
                    "contact: asrweb@elpasoco.com for DSA)"
                ),
                viewport={"width": 1280, "height": 900},
            )
            page = context.new_page()

            try:
                for parcel in parcels:
                    try:
                        outcome = self._scrape_one(page, parcel, PWTimeout)
                    except Exception as exc:
                        logger.warning(
                            "enrich_epc_assessor: %s failed: %s",
                            parcel.parcel_id, exc,
                        )
                        run.records_failed += 1
                    else:
                        if outcome == "updated":
                            run.records_updated += 1
                        else:
                            run.records_skipped += 1
                    time.sleep(delay)
            finally:
                context.close()
                browser.close()

            self.stdout.write(self.style.SUCCESS(
                f"Done: updated={run.records_updated} "
                f"skipped={run.records_skipped} "
                f"failed={run.records_failed}"
            ))

    # ── Selection ──────────────────────────────────────────────────────────

    def _select_parcels(self, single_id, force, max_age, limit):
        qs = Parcel.objects.all().order_by("parcel_id")
        if single_id:
            return qs.filter(parcel_id=single_id)

        if not force:
            cutoff = timezone.now() - max_age
            qs = qs.filter(
                models_filter_fresh(cutoff)
            )

        if limit:
            qs = qs[:limit]
        return qs

    # ── Scrape one parcel ──────────────────────────────────────────────────

    def _scrape_one(self, page, parcel: Parcel, PWTimeout) -> str:
        url = PROPERTY_URL.format(parcel_id=parcel.parcel_id)
        self.stdout.write(f"  -> {parcel.parcel_id}")

        page.goto(url, wait_until="domcontentloaded", timeout=RENDER_TIMEOUT_MS * 2)

        # SPA hydration: wait for one of the known label fragments to appear.
        # If none does within RENDER_TIMEOUT_MS, treat the page as unrendered
        # and skip — most likely the parcel page layout changed or the parcel
        # 404'd inside the SPA.
        marker_re = "|".join(re.escape(m) for m in RENDER_MARKERS)
        try:
            page.locator(f"text=/{marker_re}/i").first.wait_for(
                state="visible", timeout=RENDER_TIMEOUT_MS,
            )
        except PWTimeout:
            logger.warning(
                "enrich_epc_assessor: %s did not render any expected label "
                "within %dms — skipping", parcel.parcel_id, RENDER_TIMEOUT_MS,
            )
            return "skipped"

        # One more beat for any late-rendering value cells.
        try:
            page.wait_for_load_state("networkidle", timeout=3_000)
        except PWTimeout:
            pass

        text = page.inner_text("body")
        extracted = self._parse_fields(text)

        if not extracted:
            logger.warning(
                "enrich_epc_assessor: %s rendered but no fields matched — "
                "selectors may need updating", parcel.parcel_id,
            )
            return "skipped"

        with transaction.atomic():
            for field, value in extracted.items():
                setattr(parcel, field, value)
            parcel.last_assessed_at = timezone.now()
            parcel.save(update_fields=[*extracted.keys(), "last_assessed_at", "updated_at"])

        return "updated"

    # ── Parsing ────────────────────────────────────────────────────────────

    def _parse_fields(self, text: str) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for field, patterns in FIELD_PATTERNS.items():
            raw = _first_match(text, patterns)
            if raw is None:
                continue
            coerced = _coerce(field, raw)
            if coerced is None:
                continue
            out[field] = coerced
        return out


# ── Helpers ────────────────────────────────────────────────────────────────

def models_filter_fresh(cutoff):
    """
    Return a Q expression that matches parcels needing re-scrape: never
    assessed, OR assessed before `cutoff`.
    """
    from django.db.models import Q
    return Q(last_assessed_at__isnull=True) | Q(last_assessed_at__lt=cutoff)


def _first_match(text: str, patterns: Iterable[str]) -> str | None:
    for pat in patterns:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def _coerce(field: str, raw: str) -> Any:
    if field in {"market_value", "assessed_value"}:
        try:
            return Decimal(raw.replace(",", "")).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError):
            return None
    if field == "year_built":
        try:
            year = int(raw)
        except ValueError:
            return None
        # Sanity: ignore obvious garbage.
        if 1700 <= year <= timezone.now().year + 1:
            return year
        return None
    if field == "owner_mailing_address":
        # Collapse internal whitespace, keep newlines as ", ".
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        joined = ", ".join(lines)
        return joined[:256]
    # owner_name, property_class — trim, cap length.
    return raw.strip()[:256]
