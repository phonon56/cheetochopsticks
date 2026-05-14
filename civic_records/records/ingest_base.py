"""
Shared building blocks for source ingest commands.

The pattern: each ingest opens an IngestRun, increments counters as it
processes rows, and lets the context manager stamp finished_at + status
on exit (failure → 'failed' with traceback, success → 'success' or
'partial' depending on whether any rows failed).

Use:

    with ingest_run("cspd_socrata") as run:
        for row in fetch_rows():
            try:
                created = upsert(row)
                if created:
                    run.records_created += 1
                else:
                    run.records_updated += 1
            except Exception:
                run.records_failed += 1
        run.save()  # persist counters before context exit
"""
from __future__ import annotations

import hashlib
import json
import traceback
from contextlib import contextmanager
from typing import Any

from records.models import IngestRun


@contextmanager
def ingest_run(source: str, notes: str = ""):
    """Open + auto-close an IngestRun. Marks failed on exception."""
    run = IngestRun.objects.create(source=source, notes=notes)
    try:
        yield run
    except Exception as exc:
        run.mark_finished(
            status="failed",
            error=f"{exc.__class__.__name__}: {exc}\n\n{traceback.format_exc()}",
        )
        raise
    else:
        if run.status == "running":
            # Persist counters first, then finalize.
            run.save(update_fields=[
                "records_created", "records_updated",
                "records_skipped", "records_failed", "notes",
            ])
            final_status = "partial" if run.records_failed else "success"
            run.mark_finished(status=final_status)


def hash_payload(payload: Any) -> str:
    """
    Stable SHA-256 of a JSON-serializable payload. Sorts keys and
    drops common volatile fields so re-fetching the same row produces
    the same hash.
    """
    if isinstance(payload, dict):
        cleaned = {k: v for k, v in payload.items()
                   if k not in {":updated_at", ":created_at", ":id"}}
        text = json.dumps(cleaned, sort_keys=True, default=str)
    else:
        text = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
