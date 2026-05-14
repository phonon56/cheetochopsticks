"""
Layered Project linker.

Given a chunk of text (typically a Record's title + description), find the
best matching Project. Uses a sequence of matchers from highest- to
lowest-confidence; the first one that fires wins.

Strategies, in order:
  1. Slug substring     — "wootenroadbridge" appearing in text matches /wootenroadbridge
  2. Title substring    — full project title appearing in text
  3. Key-token overlap  — the project's distinctive tokens (excluding
                          generic words like "Project", "Improvements")
                          appearing in text. Requires either 2+ overlaps
                          OR 1 distinctive (>= 8-char) token.

Avoiding false positives is more important than maximizing matches —
linking a record to the wrong project is worse than leaving it unlinked.

LLM-assisted linking is implemented separately as an opt-in fall-through
in the relink_projects management command.
"""
from __future__ import annotations

import re
from typing import Iterable

from projects.models import Project

# Words that appear in many project titles or many record bodies —
# not useful for matching alone. Anything here is excluded from a project's
# key-token set. Includes:
#  - Generic project nouns (project, improvements, plan)
#  - Generic infrastructure types (road, bridge, park, creek, trail)
#  - Place words common to most records in our Colorado Springs corpus
#    (colorado, springs, pikes, county, city) — these would otherwise
#    cause every random "State of Colorado" mention to false-link.
GENERIC_PROJECT_WORDS = {
    # Project / process nouns
    "project", "projects", "improvements", "improvement", "plan", "plans",
    "master", "rehabilitation", "rehab", "restoration", "construction",
    "phase", "phases", "study", "ordinance", "update", "scrub",
    "services", "service", "system", "program", "replacement",
    "extension", "expansion", "renewal", "modernization", "design",
    "report", "review", "assessment",
    # Common short words
    "the", "and", "for", "of", "to", "in", "on", "at", "by", "with",
    "from", "into", "onto", "between", "over", "under", "through",
    # Generic infrastructure types
    "park", "parks", "road", "roads", "street", "streets",
    "avenue", "boulevard", "drive", "lane", "way", "trail", "trails",
    "bridge", "bridges", "creek", "river", "channel", "intersection",
    "corridor", "facility", "facilities", "building", "buildings",
    # Civic/municipal generic
    "city", "county", "department", "office",
    # Local geography that appears in most records (Colorado Springs corpus)
    "colorado", "springs", "rocky", "mountain", "pikes", "peak",
    "elpaso", "el", "paso",
}

# CamelCase or kebab/snake split — turn slug "WootenRoadBridge" or
# "wooten-road-bridge" or "wooten_road_bridge" into ['wooten', 'road', 'bridge'].
_SLUG_SPLIT_RE = re.compile(r"[A-Z][a-z]+|[a-z]+|\d+")


def slug_to_tokens(slug: str) -> list[str]:
    """Split a project slug into lowercase tokens, however it's cased."""
    parts = re.split(r"[-_]", slug)
    out: list[str] = []
    for p in parts:
        for sub in _SLUG_SPLIT_RE.findall(p):
            out.append(sub.lower())
    return out


def key_tokens(project: Project) -> set[str]:
    """
    Project's distinctive tokens for matching. Combines slug + title,
    drops generic words and short fragments. >=4 chars from titles,
    >=3 chars from slugs (slug tokens are deliberately rarer).
    """
    tokens: set[str] = set()
    for t in slug_to_tokens(project.slug):
        if t not in GENERIC_PROJECT_WORDS and len(t) >= 3:
            tokens.add(t)
    for t in re.findall(r"[a-z]+", (project.title or "").lower()):
        if t not in GENERIC_PROJECT_WORDS and len(t) >= 4:
            tokens.add(t)
    return tokens


def find_best_project(
    text: str,
    *,
    projects: Iterable[Project] | None = None,
) -> Project | None:
    """
    Return the most likely Project match for `text`, or None.

    Pass `projects` to reuse a pre-loaded queryset across many calls
    (e.g., when looping over thousands of records).
    """
    if not text:
        return None

    if projects is None:
        projects = list(Project.objects.only("id", "slug", "title"))
    projects = list(projects)

    text_lower = text.lower()

    # 1. Slug substring — most precise; project slugs are short, unique,
    #    distinctive strings. If "wootenroadbridge" appears verbatim we
    #    are very confident.
    for p in projects:
        if len(p.slug) >= 6 and p.slug.lower() in text_lower:
            return p

    # 2. Project title substring — high confidence when the full title
    #    (or a long prefix) shows up in the text.
    for p in projects:
        title_l = (p.title or "").lower()
        if len(title_l) >= 12 and title_l in text_lower:
            return p

    # 3. Key-token overlap — for cases where text references the project
    #    using its distinctive tokens (e.g., "Marksheffel" alone).
    #    Conservative: REQUIRE 2+ unique overlaps OR a single very long
    #    (>=12 chars) proper-noun token. False positives are worse than
    #    misses, so the bar is high.
    text_tokens = set(re.findall(r"[a-z]{3,}", text_lower))
    scores: list[tuple[Project, int, set[str]]] = []
    for p in projects:
        ktokens = key_tokens(p)
        if not ktokens:
            continue
        overlap = ktokens & text_tokens
        if not overlap:
            continue
        # Score: each overlap = 2, longer tokens add bonuses.
        score = (
            len(overlap) * 2
            + sum(1 for t in overlap if len(t) >= 8)
            + sum(2 for t in overlap if len(t) >= 12)
        )
        # Acceptance criteria:
        #   (a) 2+ unique overlaps  → enough joint signal, OR
        #   (b) a single >=12-char token → "Marksheffel"-class proper noun
        accepted = (
            len(overlap) >= 2
            or any(len(t) >= 12 for t in overlap)
        )
        if accepted:
            scores.append((p, score, overlap))

    if not scores:
        return None

    # Sort by score desc; require winner beats runner-up by margin to
    # avoid linking when two projects look equally likely.
    scores.sort(key=lambda x: x[1], reverse=True)
    winner, winner_score, _ = scores[0]
    if len(scores) >= 2:
        runner_up_score = scores[1][1]
        # Winner must lead by 2+ points to count as a confident pick.
        # Otherwise the match is ambiguous → no link.
        if winner_score - runner_up_score < 2:
            return None
    return winner
