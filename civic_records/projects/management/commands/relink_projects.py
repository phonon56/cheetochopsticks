"""
Backfill Record→Project FKs by re-running the layered linker against
existing records.

Two modes:

  default        — only consider records where project IS NULL. Cheap
                   and safe; never overwrites a manual link.
  --re-link      — consider every record and replace existing links
                   when a higher-confidence match is found. Use after
                   tightening the matcher logic.

  --llm          — fall through to a Claude API call for records the
                   token-based matchers couldn't resolve. Costs ~$0.001
                   per LLM call (uses Haiku 4.5 with prompt caching).

USAGE
-----
    python manage.py relink_projects --dry-run
    python manage.py relink_projects --source cos_awards --limit 20
    python manage.py relink_projects                         # all unlinked
    python manage.py relink_projects --llm --max-cost 1.00   # try LLM on long-tail

The LLM path requires ANTHROPIC_API_KEY (already used by enrich_records).
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Q

from projects.linkers import find_best_project
from projects.models import Project
from records.models import Record

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Backfill Record→Project links via the layered linker."

    def add_arguments(self, parser):
        parser.add_argument("--source", default=None,
                            help="Restrict to records from this source_system.")
        parser.add_argument("--limit", type=int, default=None,
                            help="Stop after N records.")
        parser.add_argument("--re-link", action="store_true",
                            help="Re-evaluate already-linked records too.")
        parser.add_argument("--llm", action="store_true",
                            help="Use Claude as a fall-through for unmatched records.")
        parser.add_argument("--max-cost", type=float, default=1.00,
                            help="USD cap for LLM calls (default $1.00).")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        source = opts["source"]
        limit = opts["limit"]
        relink = opts["re_link"]
        use_llm = opts["llm"]
        max_cost = Decimal(str(opts["max_cost"]))
        dry_run = opts["dry_run"]

        qs = Record.objects.select_related("project")
        if source:
            qs = qs.filter(source_system=source)
        if not relink:
            qs = qs.filter(project__isnull=True)
        if limit:
            qs = qs[:limit]

        candidates = list(qs)
        if not candidates:
            self.stdout.write(self.style.SUCCESS(
                "No candidate records to relink."
            ))
            return

        # Pre-load all projects once. Token-based matching is in-memory
        # after this; no DB hit per record.
        projects = list(Project.objects.only("id", "slug", "title"))
        self.stdout.write(
            f"Considering {len(candidates)} records against {len(projects)} projects."
        )

        token_linked   = 0
        llm_linked     = 0
        relinked_to_new = 0
        unchanged      = 0
        no_match       = []

        for r in candidates:
            text = " ".join(filter(None, [r.title, r.description]))
            match = find_best_project(text, projects=projects)

            if match is None:
                no_match.append(r)
                continue

            if r.project_id == match.id:
                unchanged += 1
                continue

            if r.project_id is None:
                token_linked += 1
            else:
                relinked_to_new += 1

            if not dry_run:
                r.project = match
                r.save(update_fields=["project"])

        # Optional LLM fall-through
        llm_failed = 0
        if use_llm and no_match:
            llm_linked, llm_failed = self._llm_fallthrough(
                no_match, projects, max_cost=max_cost, dry_run=dry_run,
            )

        verb = "Would link" if dry_run else "Linked"
        still_unmatched = len(no_match) - llm_linked - llm_failed
        self.stdout.write(self.style.SUCCESS(
            f"\n{verb}: {token_linked} via tokens"
            f"{f' + {llm_linked} via LLM' if use_llm else ''}"
            f" | {relinked_to_new} re-linked to a different project"
            f" | {unchanged} unchanged"
            f" | {still_unmatched} no match"
        ))

    # ── LLM fall-through ─────────────────────────────────────────────────

    def _llm_fallthrough(
        self, records: list[Record], projects: list[Project],
        *, max_cost: Decimal, dry_run: bool,
    ) -> tuple[int, int]:
        try:
            from records.llm_client import LLMUnavailable, call_json
        except ImportError:
            self.stdout.write(self.style.ERROR("llm_client not available."))
            return 0, len(records)

        # Build a compact catalog of projects for the prompt. Each line
        # is `slug | title (truncated)` so the model picks by slug.
        catalog_lines = "\n".join(
            f"{p.slug} | {p.title[:80]}" for p in projects
        )
        system = (
            "You match civic records to projects. Below is the closed "
            "catalog of project slugs. For each record, return the slug of "
            "the BEST matching project, or null if none clearly applies.\n"
            "Be conservative — null is correct when the record is a generic "
            "purchase, ceremonial item, or doesn't reference a specific "
            "capital project.\n\n"
            f"PROJECT CATALOG (slug | title):\n{catalog_lines}\n\n"
            "Return JSON: {\"slug\": \"<slug>\" or null, \"reason\": \"<short>\"}. "
            "No preamble."
        )

        slug_to_proj = {p.slug: p for p in projects}
        linked = 0
        failed = 0

        from records.models import LLMCallLog
        from django.utils.timezone import localdate

        def _spent_today() -> Decimal:
            agg = LLMCallLog.objects.filter(
                created_at__date=localdate(), purpose="other",
            ).values_list("cost_usd", flat=True)
            return sum((c for c in agg if c is not None), Decimal("0"))

        for r in records:
            if _spent_today() >= max_cost:
                self.stdout.write(self.style.WARNING(
                    f"Stopping LLM fall-through: cost cap ${max_cost} reached."
                ))
                break

            user = (
                f"Record title: {r.title}\n"
                f"Record type: {r.get_record_type_display()}\n"
                f"Source: {r.source_system}\n"
                f"Description: {(r.description or '')[:1500]}"
            )
            try:
                result = call_json(
                    system=system, user=user,
                    purpose="other", record=r, max_tokens=256,
                )
            except LLMUnavailable as exc:
                self.stdout.write(self.style.ERROR(str(exc)))
                return linked, failed
            except Exception as exc:
                logger.warning("LLM call failed for %s: %s", r.record_id, exc)
                failed += 1
                continue

            slug = result.get("slug")
            if not slug or slug not in slug_to_proj:
                continue
            if not dry_run:
                r.project = slug_to_proj[slug]
                r.save(update_fields=["project"])
            linked += 1

        return linked, failed
