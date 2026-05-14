"""
Ingest currently-open City of Colorado Springs solicitations (RFPs/IFBs).

Source: https://coloradosprings.gov/solicitations  (HTML table)

Each table row points at a PDF (the solicitation document itself). For
each row we:
  1. Create a Record (record_type='solicitation', status='open')
  2. Download the PDF and extract text
  3. Run loose regex over the text to surface due date, dollar amount,
     and NIGP code into the description (and into source_hash so the
     record updates if the PDF changes)
  4. Try to fuzzy-link to an existing Project by title overlap

USAGE
-----
    # Smoke test, no PDF downloads
    python manage.py ingest_cos_solicitations --no-pdfs --dry-run

    # Real ingest with PDF parsing (~26 small PDFs, polite 0.5s delay)
    python manage.py ingest_cos_solicitations

    # Skip PDF download but still create/update Record skeletons
    python manage.py ingest_cos_solicitations --no-pdfs

NOTES
-----
- The /solicitations page only shows currently-OPEN items. Closed/awarded
  items are pulled separately by ingest_cos_awards.
- IMPORTANT: the "PDF URLs" in the table are actually Drupal *wrapper
  pages*, not PDF binaries. The real RFP PDFs live on BidNet Direct
  (rocky-mtn-purchasing). PDF parsing is therefore OFF by default —
  fetching those wrapper pages just consumes HTTP for no useful payload.
  Re-enable with --pdfs once a BidNet connector exposes the real binaries.
- Project linking via fuzzy title match still works — bridge / road /
  facility-named RFPs reliably find their parent Project.
"""
from __future__ import annotations

import io
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

from projects.linkers import find_best_project
from records.ingest_base import hash_payload, ingest_run
from records.models import Record
from records.parcel_match import find_parcel

logger = logging.getLogger(__name__)

SOURCE_NAME = "cos_solicitations"
DEFAULT_BASE = "https://coloradosprings.gov"
INDEX_PATH = "/solicitations"
REQUEST_TIMEOUT = 30
USER_AGENT = "civic-records-ingest/1.0"

# Loose regex over PDF text. These deliberately under-match rather than
# over-match — we'd rather extract nothing than extract garbage.
DUE_DATE_RE = re.compile(
    r"(?:Due\s*Date|Submittal\s*Deadline|Bids?\s*Due|Proposal\s*Due|Closing\s*Date|Response\s*Due)"
    r"[:\s]*"
    r"([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}/\d{1,2}/\d{4})",
    re.IGNORECASE,
)

# Cost pattern is gated by a label so we don't capture random dollar amounts.
COST_RE = re.compile(
    r"(?:Estimated\s*Cost|Project\s*Value|Budget|Total\s*Estimate|Estimated\s*Value|Engineer'?s?\s*Estimate)"
    r"[:\s]+\$\s*([\d,]+(?:\.\d{2})?)",
    re.IGNORECASE,
)

NIGP_RE = re.compile(
    r"(?:NIGP|Commodity\s*Code)\s*[#:]?\s*(\d{2,3}-?\d{2,3}(?:-?\d{2})?)",
    re.IGNORECASE,
)

CONTACT_EMAIL_RE = re.compile(
    r"\b([A-Za-z0-9._-]+@coloradosprings\.gov)\b"
)


class Command(BaseCommand):
    help = "Ingest open RFP/IFB solicitations from coloradosprings.gov."

    def add_arguments(self, parser):
        parser.add_argument("--base", default=DEFAULT_BASE)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--pdfs", action="store_true",
                            help="Attempt PDF download/parse. Off by default — "
                                 "the linked URLs are Drupal wrapper pages, "
                                 "not real PDFs. Useful when BidNet is wired up.")
        parser.add_argument("--delay", type=float, default=0.5,
                            help="Seconds between PDF fetches (default 0.5).")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        base = opts["base"].rstrip("/")
        limit = opts["limit"]
        skip_pdfs = not opts["pdfs"]
        delay = opts["delay"]
        dry_run = opts["dry_run"]

        with ingest_run(SOURCE_NAME, notes=f"base={base} pdfs={not skip_pdfs}") as run:
            rows = list(self._iter_solicitations(base, limit=limit))
            self.stdout.write(f"Found {len(rows)} solicitation row(s).")

            for i, row in enumerate(rows, 1):
                pdf_text = ""
                if not skip_pdfs and row["pdf_url"]:
                    try:
                        pdf_text = self._fetch_pdf_text(row["pdf_url"])
                    except Exception as exc:
                        logger.warning("PDF fetch failed (%s): %s",
                                       row["solicitation_id"], exc)
                    if delay:
                        time.sleep(delay)

                try:
                    outcome = self._upsert(row, pdf_text=pdf_text, dry_run=dry_run)
                except Exception as exc:
                    logger.warning("Upsert failed (%s): %s",
                                   row["solicitation_id"], exc)
                    run.records_failed += 1
                    continue

                if outcome == "created":
                    run.records_created += 1
                elif outcome == "updated":
                    run.records_updated += 1
                else:
                    run.records_skipped += 1

                if i % 10 == 0:
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

    def _get(self, url: str) -> bytes:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return resp.read()

    def _iter_solicitations(self, base: str, *, limit: int | None) -> Iterable[dict]:
        url = f"{base}{INDEX_PATH}"
        self.stdout.write(f"GET {url}")
        soup = BeautifulSoup(self._get(url), "html.parser")

        emitted = 0
        # Each row: <tr><td>{title}</td><td><a href="{pdf}">{ID}</a></td></tr>
        for tr in soup.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            title = tds[0].get_text(" ", strip=True)
            link = tds[1].find("a", href=True)
            if not title or not link:
                continue
            sol_id = link.get_text(strip=True)
            href = link["href"]
            pdf_url = urllib.parse.urljoin(base, href)
            yield {
                "solicitation_id": sol_id,
                "title": title,
                "pdf_url": pdf_url,
            }
            emitted += 1
            if limit is not None and emitted >= limit:
                return

    def _fetch_pdf_text(self, url: str) -> str:
        from pypdf import PdfReader
        from pypdf.errors import PdfReadError
        data = self._get(url)
        try:
            reader = PdfReader(io.BytesIO(data))
            pages = []
            # Cap at first 8 pages — most RFPs put the boilerplate
            # (cover page, due date, scope) up front; later pages are
            # specs and don't help our extraction.
            for page in reader.pages[:8]:
                pages.append(page.extract_text() or "")
            return "\n".join(pages)
        except PdfReadError as exc:
            logger.info("Unreadable PDF at %s: %s", url, exc)
            return ""

    # ── Save ─────────────────────────────────────────────────────────────

    def _upsert(self, row: dict, *, pdf_text: str, dry_run: bool) -> str:
        sol_id = row["solicitation_id"]
        new_hash = hash_payload({
            "row": row,
            "pdf_text_hash": hash_payload(pdf_text) if pdf_text else "",
        })

        existing = Record.objects.filter(
            source_system=SOURCE_NAME, source_id=sol_id,
        ).only("id", "record_id", "source_hash").first()
        if existing and existing.source_hash == new_hash and not dry_run:
            return "skipped"

        # Extract structured fields from PDF text. None is acceptable.
        due_date = self._first_match(DUE_DATE_RE, pdf_text)
        cost     = self._first_match(COST_RE, pdf_text)
        nigp     = self._first_match(NIGP_RE, pdf_text)
        contact  = self._first_match(CONTACT_EMAIL_RE, pdf_text)

        # Build a human-readable description from extracted fields + first
        # non-trivial paragraph of the PDF. We always include a BidNet
        # pointer because the real submittal info lives there.
        desc_lines = [
            f"Solicitation ID: {sol_id}",
            "Submittals & full RFP detail: Rocky Mountain E-Purchasing "
            "(BidNet Direct) — https://www.bidnetdirect.com/colorado/"
            "city-of-colorado-springs/solicitations/open-bids?target=search",
        ]
        if due_date: desc_lines.append(f"Due date: {due_date}")
        if cost:     desc_lines.append(f"Estimated cost: ${cost}")
        if nigp:     desc_lines.append(f"NIGP code: {nigp}")
        if contact:  desc_lines.append(f"Contact: {contact}")
        if pdf_text:
            # Take the first paragraph that's at least 80 chars and doesn't
            # look like a header (mostly punctuation/numbers).
            for para in pdf_text.split("\n\n"):
                clean = para.strip()
                if len(clean) >= 80 and sum(c.isalpha() for c in clean) > 50:
                    desc_lines.append("")
                    desc_lines.append(clean[:1500])
                    break
        description = "\n".join(desc_lines)

        # Best-effort parcel match (rare for RFPs but free to try)
        parcel = find_parcel(row["title"] + "\n" + description)

        # Layered project match — slug substring → title substring →
        # key-token overlap. Shared with ingest_cos_awards and the
        # relink_projects backfill command.
        project = find_best_project(row["title"] + "\n" + description)

        defaults = {
            "parcel": parcel,
            "project": project,
            "record_type": "solicitation",
            "status": "open",
            "title": row["title"][:512],
            "description": description,
            "owner_department": "City Procurement",
            "source_url": row["pdf_url"],
            "source_hash": new_hash,
            "last_synced_at": timezone.now(),
        }
        if dry_run:
            return "would-write" if not existing else "would-update"

        with transaction.atomic():
            obj, created = Record.objects.update_or_create(
                source_system=SOURCE_NAME, source_id=sol_id,
                defaults={
                    **defaults,
                    "record_id": (existing and existing.record_id)
                                 or f"{SOURCE_NAME}:{sol_id}",
                },
            )
        return "created" if created else "updated"

    @staticmethod
    def _first_match(rx: re.Pattern, text: str) -> str:
        if not text:
            return ""
        m = rx.search(text)
        return m.group(1).strip() if m else ""

