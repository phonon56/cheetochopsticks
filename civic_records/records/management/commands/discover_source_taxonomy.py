"""
Profile the native taxonomy of records ingested from a given source.

Two modes:

  --native   Print frequency distributions of record_type, status, and
             owner_department within the source. No API calls. Free.

  --llm      Sample N records and ask Claude to (a) suggest which
             TopicTag slugs apply, (b) flag any patterns that don't fit
             the existing taxonomy. Costs a few cents.

USAGE
-----
    python manage.py discover_source_taxonomy cspd_socrata
    python manage.py discover_source_taxonomy epc_parcels --native --top 20
    python manage.py discover_source_taxonomy cspd_socrata --llm --sample 30

This is meta-work: run it once per new source to understand the source's
intrinsic vocabulary, then update FIELD_MAP / STATUS_MAP / record_type
defaults in the corresponding ingest command.
"""
from __future__ import annotations

import json
import logging
from collections import Counter
from random import sample as random_sample
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count

from records.llm_client import LLMUnavailable, call_json, DEFAULT_MODEL
from records.models import Record, TopicTag

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Profile a source's taxonomy: native distributions + optional LLM mapping."

    def add_arguments(self, parser):
        parser.add_argument("source",
                            help="source_system value to profile (e.g., cspd_socrata).")
        parser.add_argument("--native", action="store_true",
                            help="Native distributions only (default if no flag given).")
        parser.add_argument("--llm", action="store_true",
                            help="Also call LLM for taxonomy mapping suggestions.")
        parser.add_argument("--top", type=int, default=15,
                            help="Top N values to show per native facet (default 15).")
        parser.add_argument("--sample", type=int, default=20,
                            help="Records sampled for LLM mode (default 20).")
        parser.add_argument("--model", default=DEFAULT_MODEL,
                            help=f"LLM model (default {DEFAULT_MODEL}).")

    def handle(self, *args, **opts):
        source = opts["source"]
        qs = Record.objects.filter(source_system=source)
        total = qs.count()
        if total == 0:
            raise CommandError(
                f"No records found with source_system='{source}'. "
                f"Have you run an ingest command yet?"
            )

        self.stdout.write(self.style.SUCCESS(
            f"\nSource: {source}  |  {total:,} total records\n"
        ))

        # Native distributions are always shown
        self._print_distribution(qs, "record_type", opts["top"])
        self._print_distribution(qs, "status", opts["top"])
        self._print_distribution(qs, "owner_department", opts["top"])

        existing_tag_dist = (
            qs.filter(topic_tags__isnull=False)
            .values("topic_tags__slug")
            .annotate(n=Count("id"))
            .order_by("-n")[:opts["top"]]
        )
        if existing_tag_dist:
            self.stdout.write(self.style.MIGRATE_HEADING("\nTopic tags already assigned:"))
            for row in existing_tag_dist:
                self.stdout.write(f"  {row['topic_tags__slug']:25s} {row['n']:>6,}")

        if opts["llm"]:
            self._llm_mapping(qs, sample_size=opts["sample"], model=opts["model"])
        else:
            self.stdout.write(self.style.WARNING(
                "\n(Pass --llm to also get Claude's taxonomy mapping suggestions.)"
            ))

    def _print_distribution(self, qs, field: str, top: int):
        rows = (
            qs.exclude(**{f"{field}__in": ["", None]})
            .values(field).annotate(n=Count("id"))
            .order_by("-n")[:top]
        )
        if not rows:
            return
        self.stdout.write(self.style.MIGRATE_HEADING(f"\nTop {field} values:"))
        width = max(len(str(r[field])) for r in rows)
        for r in rows:
            self.stdout.write(f"  {str(r[field]):{width}s}  {r['n']:>6,}")

    # ── LLM mapping mode ────────────────────────────────────────────────

    def _llm_mapping(self, qs, *, sample_size: int, model: str):
        candidates = list(qs.only(
            "id", "record_id", "title", "description",
            "record_type", "status", "owner_department",
        ))
        n = min(sample_size, len(candidates))
        sample = random_sample(candidates, n) if n < len(candidates) else candidates

        allowed_tags = list(TopicTag.objects.all())
        if not allowed_tags:
            self.stdout.write(self.style.ERROR(
                "No TopicTags exist. Seed the taxonomy first."
            ))
            return

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\nAsking {model} to map {n} sampled records..."
        ))

        try:
            result = call_json(
                system=_DISCOVERY_SYSTEM_PROMPT.format(
                    tag_lines="\n".join(
                        f"- {t.slug} — {t.description or t.label}" for t in allowed_tags
                    )
                ),
                user=_format_records_for_discovery(sample),
                model=model, purpose="taxonomy_discover",
                max_tokens=2048,
            )
        except LLMUnavailable as exc:
            self.stdout.write(self.style.ERROR(str(exc)))
            return
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"LLM call failed: {exc}"))
            return

        # Tally suggested tags across the sample to surface dominant themes.
        tally: Counter[str] = Counter()
        for row in result.get("mappings", []):
            for slug in row.get("topic_tag_slugs", []):
                tally[slug] += 1

        if tally:
            self.stdout.write(self.style.MIGRATE_HEADING(
                "\nLLM-suggested tag distribution across sample:"
            ))
            for slug, n in tally.most_common():
                marker = "  " if slug in {t.slug for t in allowed_tags} else " ⚠"
                self.stdout.write(f"{marker} {slug:25s} {n:>4} records")
            self.stdout.write(
                "\n(⚠ marks tags suggested but NOT in the closed taxonomy — "
                "add them only after deliberation.)"
            )

        gaps = result.get("gaps") or []
        if gaps:
            self.stdout.write(self.style.MIGRATE_HEADING(
                "\nLLM observations on coverage gaps:"
            ))
            for note in gaps:
                self.stdout.write(f"  • {note}")


_DISCOVERY_SYSTEM_PROMPT = """\
You analyze samples of civic records to evaluate how well a closed
taxonomy fits them. Return JSON with two keys:

1. mappings: array of {{record_id, topic_tag_slugs}} — for each input
   record, suggest 0-3 tag slugs from the closed taxonomy below. Prefer
   nothing over wrong.

2. gaps: array of short strings, each describing a category of records
   that didn't fit the taxonomy well. Be specific. Limit 5 entries.
   Empty array if the taxonomy covers everything.

CLOSED TAXONOMY:
{tag_lines}

Return ONLY a JSON object. No preamble, no fences."""


def _format_records_for_discovery(records: list[Record]) -> str:
    lines = []
    for r in records:
        lines.append(f"--- record_id: {r.record_id}")
        lines.append(f"type: {r.get_record_type_display()}  status: {r.get_status_display()}")
        lines.append(f"title: {r.title}")
        if r.description:
            lines.append(f"description: {r.description[:400]}")
        if r.owner_department:
            lines.append(f"department: {r.owner_department}")
        lines.append("")
    return "\n".join(lines)
