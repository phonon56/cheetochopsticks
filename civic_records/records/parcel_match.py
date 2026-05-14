"""
Best-effort parcel matching from free text.

Meeting agenda items rarely come pre-linked to a parcel. They reference
parcels obliquely: a parcel ID embedded in the description, an address,
a project name. This module tries a handful of cheap heuristics in order
and returns the first hit.

Order:
  1. Explicit parcel ID — 10-12 digit numeric token, often prefixed by
     "Parcel No." / "Schedule No." / "PIN". Direct lookup on Parcel.parcel_id.
  2. Street address — "1234 Main St" pattern. Case-insensitive iexact on
     Parcel.address, falling back to startswith.

Returns None if nothing matched. Caller decides whether to skip the record
or persist it parcel-less for later re-matching by the enrichment pass.
"""
from __future__ import annotations

import re
from typing import Optional

from parcels.models import Parcel

# EPC parcel/schedule IDs are typically 10 numeric digits, sometimes with
# spaces or hyphens. Pikes Peak Regional Building Department IDs may differ
# but follow the same general shape.
PARCEL_ID_PATTERN = re.compile(
    r"(?i)\b(?:parcel|schedule|sched|pin|ascn|tax\s+account)\s*(?:no\.?|number|#)?\s*"
    r"(\d{2,4}[-\s]?\d{6,10})\b"
)

# Looser fallback — any 10-digit token surrounded by word boundaries
LOOSE_PARCEL_ID_PATTERN = re.compile(r"\b(\d{10})\b")

# Street address: number + street body. Generous to catch most US-style
# addresses; we'll validate by hitting Parcel.address.
ADDRESS_PATTERN = re.compile(
    r"\b(\d{1,6}\s+[NSEW]?\s*[A-Za-z0-9'.\-]+(?:\s+[A-Za-z0-9'.\-]+){0,4}"
    r"\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|"
    r"Court|Ct|Place|Pl|Way|Loop|Trail|Trl|Parkway|Pkwy|Circle|Cir|Highway|Hwy)\b\.?)",
    re.IGNORECASE,
)


def find_parcel(text: str) -> Optional[Parcel]:
    """Try each heuristic in order; return the first matching Parcel or None."""
    if not text:
        return None

    # Strategy 1: explicit "Parcel No. XXXXX" callouts
    for match in PARCEL_ID_PATTERN.finditer(text):
        candidate = re.sub(r"[\s\-]", "", match.group(1))
        parcel = Parcel.objects.filter(parcel_id=candidate).only("id").first()
        if parcel:
            return parcel

    # Strategy 2: bare 10-digit IDs
    for match in LOOSE_PARCEL_ID_PATTERN.finditer(text):
        candidate = match.group(1)
        parcel = Parcel.objects.filter(parcel_id=candidate).only("id").first()
        if parcel:
            return parcel

    # Strategy 3: street address — try iexact, then startswith
    for match in ADDRESS_PATTERN.finditer(text):
        addr = match.group(1).strip().rstrip(".")
        parcel = (
            Parcel.objects.filter(address__iexact=addr).only("id").first()
            or Parcel.objects.filter(address__istartswith=addr).only("id").first()
        )
        if parcel:
            return parcel

    return None


def extract_parcel_hints(text: str) -> dict[str, list[str]]:
    """
    Extract candidate parcel/address tokens without requiring a DB hit.
    Useful for storing in Record.description so future enrichment passes
    can re-attempt matching after more parcels are ingested.
    """
    if not text:
        return {"parcel_ids": [], "addresses": []}
    parcel_ids = list({
        re.sub(r"[\s\-]", "", m.group(1))
        for m in PARCEL_ID_PATTERN.finditer(text)
    })
    parcel_ids.extend(
        m.group(1) for m in LOOSE_PARCEL_ID_PATTERN.finditer(text)
        if m.group(1) not in parcel_ids
    )
    addresses = list({
        m.group(1).strip().rstrip(".")
        for m in ADDRESS_PATTERN.finditer(text)
    })
    return {"parcel_ids": parcel_ids, "addresses": addresses}
