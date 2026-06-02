"""
Generate plain_summary + topic_tags for ingested records using Claude.

Selection rules (in order):
  1. Records with no enriched_at AND a non-empty title/description
  2. Records where source_hash changed since last enrichment (re-enrich)
  3. Skip if already enriched and source_hash hasn't changed

USAGE
-----
    # Smoke test: 5 records, dry run (no API call, no DB writes)
    python manage.py enrich_records --limit 5 --dry-run

    # Real enrichment, capped at 100 records
    python manage.py enrich_records --limit 100

    # Re-enrich everything from a specific source
    python manage.py enrich_records --source cspd_socrata --force

    # Stop if estimated spend exceeds $X
    python manage.py enrich_records --max-cost 1.00

REQUIRES
--------
ANTHROPIC_API_KEY env var. See https://console.anthropic.com.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import F, Q
from django.utils import timezone

from records.llm_client import LLMUnavailable, call_json, DEFAULT_MODEL
from records.models import LLMCallLog, Record, TopicTag

logger = logging.getLogger(__name__)


def build_system_prompt(allowed_tags: list[TopicTag]) -> str:
    tag_lines = "\n".join(
        f"- {t.slug} — {t.description or t.label}"
        for t in allowed_tags
    )
    return f"""\
You classify civic records for the Civic Records project covering \
Colorado Springs and El Paso County. For each record you receive, return \
JSON with exactly two keys:

1. plain_summary: One or two plain sentences (under 40 words). Audience: \
residents who don't know government jargon or acronyms. Lead with what's \
actually happening. No hedging, no "this record describes...", no \
"according to the document". State the action and who's affected.

2. topic_tag_slugs: Array of 1 to 3 slugs from the CLOSED TAXONOMY below. \
Pick only what genuinely applies. An empty array [] is acceptable when \
nothing fits — better than forcing a wrong tag.

CLOSED TAXONOMY — use ONLY these slugs (anything else will be discarded):

{tag_lines}

Return ONLY a JSON object. No preamble, no code fences, no explanation.
Example: {{"plain_summary": "...", "topic_tag_slugs": ["housing", "zoning"]}}"""


def build_user_prompt(record: Record) -> str:
    parts = [
        f"Source: {record.source_system or 'manual'}",
        f"Type: {record.get_record_type_display()}",
        f"Status: {record.get_status_display()}",
        f"Title: {record.title}",
    ]
    if record.description:
        # Truncate huge descriptions — first ~2000 chars is plenty for context
        parts.append(f"Description: {record.description[:2000]}")
    if record.owner_department:
        parts.append(f"Owning department: {record.owner_department}")
    if record.parcel and record.parcel.address:
        parts.append(f"Parcel address: {record.parcel.address}")
    return "\n".join(parts)


class Command(BaseCommand):
    help = "Enrich Records with plain_summary + topic_tags via Claude."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=50,
                            help="Max records to process this run (default 50).")
        parser.add_argument("--source", default=None,
                            help="Restrict to records from this source_system.")
        parser.add_argument("--force", action="store_true",
                            help="Re-enrich even if enriched_at is set.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Pick candidates and show prompts; no API calls.")
        parser.add_argument("--model", default=DEFAULT_MODEL,
                            help=f"Model name (default {DEFAULT_MODEL}).")
        parser.add_argument("--max-cost", type=float, default=None,
                            help="Stop if estimated total spend exceeds this USD.")

    def handle(self, *args, **opts):
        limit = opts["limit"]
        source = opts["source"]
        force = opts["force"]
        dry_run = opts["dry_run"]
        model = opts["model"]
        max_cost = Decimal(str(opts["max_cost"])) if opts["max_cost"] else None

        candidates = self._candidates(source=source, force=force)[:limit]
        total = len(candidates)

        if total == 0:
            self.stdout.write(self.style.SUCCESS(
                "No records need enrichment. (Use --force to re-enrich.)"
            ))
            return

        self.stdout.write(f"Selected {total} record(s) to enrich.")

        allowed_tags = list(TopicTag.objects.all())
        if not allowed_tags:
            self.stdout.write(self.style.ERROR(
                "No TopicTags exist. Run migrations to seed the taxonomy."
            ))
            return

        slug_to_tag = {t.slug: t for t in allowed_tags}
        system_prompt = build_system_prompt(allowed_tags)

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no API calls."))
            self.stdout.write("\n--- SYSTEM PROMPT ---\n" + system_prompt + "\n")
            for r in candidates[:3]:
                self.stdout.write(f"\n--- USER PROMPT (record_id={r.record_id}) ---")
                self.stdout.write(build_user_prompt(r))
            self.stdout.write(f"\n... and {max(0, total - 3)} more.")
            return

        ok, failed, skipped_unknown_tags = 0, 0, 0
        for i, record in enumerate(candidates, 1):
            if max_cost is not None:
                spent = self._spent_today(model)
                if spent >= max_cost:
                    self.stdout.write(self.style.WARNING(
                        f"Stopping: estimated spend today ${spent:.4f} "
                        f">= cap ${max_cost:.4f}"
                    ))
                    break

            try:
                result = call_json(
                    system=system_prompt,
                    user=build_user_prompt(record),
                    model=model, purpose="enrich", record=record,
                )
            except LLMUnavailable as exc:
                self.stdout.write(self.style.ERROR(str(exc)))
                return
            except Exception as exc:
                logger.warning("Enrich failed for %s: %s", record.record_id, exc)
                failed += 1
                continue

            summary = (result.get("plain_summary") or "").strip()
            tag_slugs = result.get("topic_tag_slugs") or []

            valid_tags = []
            for slug in tag_slugs:
                tag = slug_to_tag.get(slug)
                if tag:
                    valid_tags.append(tag)
                else:
                    skipped_unknown_tags += 1

            record.plain_summary = summary[:5000]  # keep things sane
            record.enriched_at = timezone.now()
            record.save(update_fields=["plain_summary", "enriched_at"])
            if valid_tags:
                record.topic_tags.set(valid_tags)
            ok += 1

            if i % 10 == 0:
                self.stdout.write(
                    f"  ... {i}/{total} | spent so far: "
                    f"${self._spent_today(model):.4f}"
                )

        self.stdout.write(self.style.SUCCESS(
            f"Enriched {ok}, failed {failed}, "
            f"discarded-unknown-tags {skipped_unknown_tags}. "
            f"Estimated total spend today: ${self._spent_today(model):.4f}"
        ))

    @staticmethod
    def _candidates(*, source: str | None, force: bool):
        qs = Record.objects.filter(
            ~Q(title="") & ~Q(title__isnull=True)
        )
        if source:
            qs = qs.filter(source_system=source)
        if not force:
            # Need enrichment if never enriched, OR source_hash has changed
            # since last enrichment (using updated_at as proxy).
            qs = qs.filter(
                Q(enriched_at__isnull=True)
                | Q(enriched_at__lt=F("updated_at"))
            )
        return qs.select_related("parcel").order_by("-updated_at")

    @staticmethod
    def _spent_today(model: str) -> Decimal:
        from django.utils.timezone import localdate
        agg = LLMCallLog.objects.filter(
            created_at__date=localdate(), model=model,
        ).values_list("cost_usd", flat=True)
        return sum((c for c in agg if c is not None), Decimal("0"))
