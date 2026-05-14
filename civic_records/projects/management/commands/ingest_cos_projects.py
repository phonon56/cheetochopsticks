"""
Ingest City of Colorado Springs capital projects from EngageCOS.

Source: https://coloradosprings.gov/projects (paginated, ?page=0..6)
Detail URLs are at the project slug, e.g. /PowersExtension, /UDCscrub.

Each project becomes a Project row (NOT a Record — projects own multiple
records spanning their lifecycle). Subsequent ingests of solicitations,
awards, and meeting items can FK back to a Project by matching slug or
title fragments.

USAGE
-----
    # Smoke test (first page only, no detail-page fetches)
    python manage.py ingest_cos_projects --limit 5 --no-details --dry-run

    # Index-only (all 7 pages, ~168 rows, ~7 HTTP requests)
    python manage.py ingest_cos_projects --no-details

    # Full sync (~168 rows + ~168 detail-page fetches; ~3 minutes at default delay)
    python manage.py ingest_cos_projects

CONFIGURATION
-------------
No env vars required. Override base URL via --base if EngageCOS moves.
Override per-request delay via --delay (default 0.5s) — be a polite scraper.

NOTES
-----
- Detail-page fetches respect a 0.5s default delay between requests.
- Each card has source_id == its slug.
- description = concatenation of the 'About' tab text.
- status = card-level status string ("In Progress", "Planning Phase", "Complete").
- spatial extent is NOT extracted yet — the embedded maps are iframes
  with varied formats. Worth a follow-up.
"""
from __future__ import annotations

import logging
import re
import time
import urllib.parse
import urllib.request
from typing import Iterable

from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from projects.models import Project
from records.ingest_base import hash_payload, ingest_run

logger = logging.getLogger(__name__)

SOURCE_NAME = "engagecos"
DEFAULT_BASE = "https://coloradosprings.gov"
INDEX_PATH = "/projects"
REQUEST_TIMEOUT = 30
USER_AGENT = "civic-records-ingest/1.0 (+https://civic-records.local)"

# Project slugs are bare /CamelCase or /lowercase paths with no further segments
SLUG_RE = re.compile(r"^/([A-Za-z][A-Za-z0-9_-]+)$")

# Whitelist of EngageCOS status badges. Only treat the last text segment of
# a card as a status if it matches one of these — otherwise the card has
# no badge and the segment is part of the title.
KNOWN_STATUSES = {
    "Complete", "In Progress", "Planning Phase", "Planning",
    "Future", "Upcoming", "On Hold", "Paused",
}


class Command(BaseCommand):
    help = "Ingest Colorado Springs capital projects from EngageCOS."

    def add_arguments(self, parser):
        parser.add_argument("--base", default=DEFAULT_BASE,
                            help=f"Base URL (default {DEFAULT_BASE}).")
        parser.add_argument("--limit", type=int, default=None,
                            help="Stop after N projects total.")
        parser.add_argument("--no-details", action="store_true",
                            help="Index page only — skip per-project detail fetch.")
        parser.add_argument("--delay", type=float, default=0.5,
                            help="Seconds between detail requests (default 0.5).")
        parser.add_argument("--dry-run", action="store_true",
                            help="Parse but don't write.")

    def handle(self, *args, **opts):
        base = opts["base"].rstrip("/")
        limit = opts["limit"]
        skip_details = opts["no_details"]
        delay = opts["delay"]
        dry_run = opts["dry_run"]

        with ingest_run(SOURCE_NAME, notes=f"base={base}") as run:
            cards = list(self._iter_index_cards(base, limit=limit))
            self.stdout.write(f"Found {len(cards)} project card(s).")

            for i, card in enumerate(cards, 1):
                detail = None
                if not skip_details:
                    try:
                        detail = self._fetch_detail(base, card["slug"])
                    except Exception as exc:
                        logger.warning("Detail fetch failed for %s: %s",
                                       card["slug"], exc)
                    if delay:
                        time.sleep(delay)

                try:
                    outcome = self._upsert(
                        base=base, card=card, detail=detail, dry_run=dry_run,
                    )
                except Exception as exc:
                    logger.warning("Upsert failed for %s: %s", card["slug"], exc)
                    run.records_failed += 1
                    continue

                if outcome == "created":
                    run.records_created += 1
                elif outcome == "updated":
                    run.records_updated += 1
                else:
                    run.records_skipped += 1

                if i % 20 == 0:
                    self.stdout.write(
                        f"  ... {i}/{len(cards)} | "
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

    def _get(self, url: str) -> BeautifulSoup:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return BeautifulSoup(resp.read(), "html.parser")

    def _iter_index_cards(
        self, base: str, *, limit: int | None,
    ) -> Iterable[dict]:
        """Walk all index pages until empty or limit reached."""
        emitted = 0
        seen_slugs: set[str] = set()
        page = 0
        while True:
            url = f"{base}{INDEX_PATH}?page={page}"
            self.stdout.write(f"GET {url}")
            soup = self._get(url)
            cards_on_page = list(self._parse_index_cards(soup))
            if not cards_on_page:
                return
            new_on_page = 0
            for card in cards_on_page:
                if card["slug"] in seen_slugs:
                    continue
                seen_slugs.add(card["slug"])
                yield card
                emitted += 1
                new_on_page += 1
                if limit is not None and emitted >= limit:
                    return
            if new_on_page == 0:
                return  # We're seeing only duplicates -> last page wrapping
            page += 1
            if page > 20:  # paranoia stop
                return

    def _parse_index_cards(self, soup: BeautifulSoup) -> Iterable[dict]:
        # Each project teaser is wrapped in this Drupal-emitted card div.
        for card in soup.select("div.node--type-project"):
            link = card.find("a", href=SLUG_RE)
            if not link:
                continue
            m = SLUG_RE.match(link["href"])
            if not m:
                continue
            slug = m.group(1)

            # Card text comes back as "[Engagement] | Title | [Status]".
            # Status badge is optional. Use a whitelist: only accept the
            # last segment as status if it matches a known badge string;
            # otherwise treat all segments as candidate title text.
            segments = [s.strip() for s in card.get_text(" | ", strip=True).split("|")]
            segments = [s for s in segments if s]

            status = ""
            title_segments = segments
            if segments and segments[-1] in KNOWN_STATUSES:
                status = segments[-1]
                title_segments = segments[:-1]

            # Pick the longest non-status segment as the title.
            title = max(title_segments, key=len) if title_segments else slug

            yield {
                "slug": slug,
                "title": title,
                "status": status,
            }

    def _fetch_detail(self, base: str, slug: str) -> dict:
        url = f"{base}/{slug}"
        soup = self._get(url)
        # Best-effort body text extraction. Drupal site wraps content in
        # a node detail wrapper. Fall back to <main> or whole body if needed.
        node = (
            soup.select_one("article.node--type-project")
            or soup.select_one("main")
            or soup
        )
        # Strip nav/footer/script so the description doesn't carry junk.
        for el in node.select("nav, footer, script, style, header"):
            el.decompose()
        description = node.get_text(" ", strip=True)
        # Try to extract some structured-ish fields by label text
        fields = {}
        for label in ("Department", "Status", "Contact", "Cost", "Budget"):
            m = re.search(rf"{label}:\s*([^|\n]{{2,120}})", description)
            if m:
                fields[label.lower()] = m.group(1).strip()

        return {
            "url": url,
            "description": description[:8000],  # cap so we don't store novels
            "fields": fields,
        }

    # ── Save ─────────────────────────────────────────────────────────────

    def _upsert(
        self, *, base: str, card: dict, detail: dict | None, dry_run: bool,
    ) -> str:
        slug = card["slug"]
        new_hash = hash_payload({"card": card, "detail": detail or {}})

        existing = Project.objects.filter(slug=slug).only(
            "id", "source_hash"
        ).first()
        if existing and existing.source_hash == new_hash and not dry_run:
            return "skipped"

        defaults = {
            "title": card["title"][:512],
            "status": (card["status"] or "")[:64],
            "source": SOURCE_NAME,
            "source_id": slug,
            "source_url": (detail or {}).get("url") or f"{base}/{slug}",
            "source_hash": new_hash,
            "last_synced_at": timezone.now(),
        }
        if detail:
            defaults["description"] = detail["description"]
            # If detail page surfaced a clearer status, prefer it
            if "status" in detail.get("fields", {}):
                defaults["status"] = detail["fields"]["status"][:64]

        if dry_run:
            return "would-write" if not existing else "would-update"

        with transaction.atomic():
            obj, created = Project.objects.update_or_create(
                slug=slug, defaults=defaults,
            )
        return "created" if created else "updated"
