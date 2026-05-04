"""
HOME-ARP Webform — Sample webhook receiver
==========================================

A minimal but production-shaped FastAPI service that receives JSON submissions
from the Drupal Webform and:

  1. Verifies a shared-secret header (HMAC-equivalent simple match by default;
     swap for HMAC-SHA256 if your Drupal stack supports it).
  2. Validates the payload against home_arp_submission.schema.json.
  3. Persists the submission to the local filesystem as one JSON file per
     submission, with a sidecar audit log.
  4. Exposes a stub call to your record/ticket system. Replace with the real
     integration when ready.
  5. Exposes a health check at GET /healthz.

Run locally:

    pip install -r requirements.txt
    export HOMEARP_WEBHOOK_SECRET="match-the-value-set-in-Drupal-handler"
    export HOMEARP_STORAGE_DIR="./submissions"
    export HOMEARP_SCHEMA_PATH="../schema/home_arp_submission.schema.json"
    uvicorn app:app --host 127.0.0.1 --port 8080 --reload

Smoke test:

    curl -X POST http://127.0.0.1:8080/webhook/home-arp-comment \\
      -H "Content-Type: application/json" \\
      -H "X-Webform-Source: cos-home-arp-comment" \\
      -H "X-Webform-Secret: match-the-value-set-in-Drupal-handler" \\
      -d @sample-submission.json

This receiver is reference quality. Before deploying, tighten the secret
verification (HMAC), put it behind TLS, set a request body size limit, run
under a non-root user, and front it with the city's standard WAF / rate limit.
"""

import hashlib
import hmac
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
import jsonschema


# ---------------------------------------------------------------------------
# Configuration (12-factor: read from environment)
# ---------------------------------------------------------------------------

WEBHOOK_SECRET = os.environ.get("HOMEARP_WEBHOOK_SECRET", "").strip()
STORAGE_DIR = Path(os.environ.get("HOMEARP_STORAGE_DIR", "./submissions")).resolve()
SCHEMA_PATH = Path(
    os.environ.get(
        "HOMEARP_SCHEMA_PATH",
        str(Path(__file__).resolve().parent.parent / "schema" / "home_arp_submission.schema.json"),
    )
).resolve()
RECORD_SYSTEM_URL = os.environ.get("HOMEARP_RECORD_SYSTEM_URL", "").strip()  # optional
LOG_LEVEL = os.environ.get("HOMEARP_LOG_LEVEL", "INFO").upper()

# Soft-fail on missing secret so dev runs are easy, but log loudly.
if not WEBHOOK_SECRET:
    print(
        "WARNING: HOMEARP_WEBHOOK_SECRET is empty. "
        "All requests will be rejected. Set the env var before deploying.",
        file=sys.stderr,
    )

STORAGE_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("home_arp_webhook")


# ---------------------------------------------------------------------------
# Load the JSON Schema once at startup
# ---------------------------------------------------------------------------

if not SCHEMA_PATH.exists():
    raise SystemExit(
        f"FATAL: schema file not found at {SCHEMA_PATH}. "
        "Set HOMEARP_SCHEMA_PATH to the correct location."
    )

with SCHEMA_PATH.open("r", encoding="utf-8") as f:
    SCHEMA = json.load(f)

jsonschema.Draft202012Validator.check_schema(SCHEMA)
VALIDATOR = jsonschema.Draft202012Validator(SCHEMA)
log.info("Loaded schema from %s", SCHEMA_PATH)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HOME-ARP Webform receiver",
    description="Receives public comment submissions from the City of Colorado Springs HOME-ARP Drupal Webform.",
    version="1.0.0",
)


@app.get("/healthz")
def healthz() -> dict:
    """Liveness/readiness probe. Returns 200 if the schema loaded and storage is writable."""
    storage_ok = os.access(STORAGE_DIR, os.W_OK)
    return {
        "status": "ok" if storage_ok else "degraded",
        "schema_path": str(SCHEMA_PATH),
        "storage_dir": str(STORAGE_DIR),
        "storage_writable": storage_ok,
        "secret_configured": bool(WEBHOOK_SECRET),
        "record_system_configured": bool(RECORD_SYSTEM_URL),
        "now": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/webhook/home-arp-comment", status_code=status.HTTP_202_ACCEPTED)
async def receive_submission(request: Request) -> Response:
    """
    Receive a JSON submission from the Drupal Webform.

    Returns 202 Accepted on successful storage. Returns 400 on schema
    validation failure, 401 on bad secret, 413 on oversized body.
    """
    raw = await _read_body_bounded(request, max_bytes=2 * 1024 * 1024)  # 2 MB cap
    _verify_secret(request)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        log.warning("Rejected submission: invalid JSON (%s)", exc)
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {exc}")

    _validate(payload)

    submission_path = _persist(payload)
    _audit(payload, submission_path)
    _forward_to_record_system(payload)

    return JSONResponse(
        status_code=202,
        content={
            "received": True,
            "submission_id": payload.get("submission_id"),
            "stored_at": str(submission_path.relative_to(STORAGE_DIR.parent))
            if submission_path.is_relative_to(STORAGE_DIR.parent)
            else str(submission_path),
        },
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _read_body_bounded(request: Request, max_bytes: int) -> bytes:
    """Read the request body, rejecting anything over max_bytes."""
    body = b""
    async for chunk in request.stream():
        body += chunk
        if len(body) > max_bytes:
            raise HTTPException(status_code=413, detail="Body too large")
    return body


def _verify_secret(request: Request) -> None:
    """
    Constant-time comparison of the X-Webform-Secret header against the
    configured shared secret.

    For higher assurance, swap this for HMAC-SHA256 over the raw body using
    a per-environment signing key. Drupal can compute the signature in a
    custom remote_post handler subclass or via hook_webform_handler_invoke_alter().
    """
    if not WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Receiver not configured")
    presented = request.headers.get("X-Webform-Secret", "")
    if not hmac.compare_digest(presented, WEBHOOK_SECRET):
        log.warning(
            "Rejected submission from %s: bad or missing X-Webform-Secret",
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(status_code=401, detail="Unauthorized")


def _validate(payload: Any) -> None:
    """Validate the payload against the JSON Schema. Raise 400 on failure."""
    errors = sorted(VALIDATOR.iter_errors(payload), key=lambda e: e.path)
    if errors:
        details = [
            {
                "path": ".".join(str(p) for p in e.absolute_path) or "<root>",
                "message": e.message,
            }
            for e in errors
        ]
        log.warning("Schema validation failed (%d errors)", len(details))
        raise HTTPException(status_code=400, detail={"errors": details})


def _persist(payload: dict) -> Path:
    """Write the submission to disk as one JSON file per submission."""
    sid = payload.get("submission_id", "unknown")
    received_at = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"submission-{received_at}-{sid}.json"
    path = STORAGE_DIR / filename
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    log.info("Stored submission %s at %s", sid, path)
    return path


def _audit(payload: dict, path: Path) -> None:
    """Append a minimal audit log entry. PII redacted."""
    audit_path = STORAGE_DIR / "audit.log"
    entry = {
        "received_at": datetime.now(timezone.utc).isoformat(),
        "submission_id": payload.get("submission_id"),
        "submission_uuid": payload.get("submission_uuid"),
        "langcode": payload.get("langcode"),
        "topics": payload.get("topics"),
        "needs_alternate_format": payload.get("needs_alternate_format"),
        "stored_at": str(path),
        "name_hash": _hash(payload.get("name")),
        "email_hash": _hash(payload.get("email")),
    }
    with audit_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _hash(value: Any) -> str | None:
    if not value:
        return None
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()[:16]


def _forward_to_record_system(payload: dict) -> None:
    """
    Stub for forwarding to the city's record/ticket system.

    Replace this with a real HTTP call (httpx is already installed via
    requirements.txt) to your record system's create-ticket endpoint, with
    the city's standard auth.

    For an "every submission becomes a ticket on the parcel" model, this is
    where the integration with the civic-Jira lives.
    """
    if not RECORD_SYSTEM_URL:
        log.debug("No record system URL configured; skipping forward.")
        return
    # Pseudocode for the real implementation:
    #
    # import httpx
    # async with httpx.AsyncClient(timeout=10) as c:
    #     await c.post(
    #         RECORD_SYSTEM_URL,
    #         json={
    #             "type": "public_comment",
    #             "source_form": payload["webform_id"],
    #             "source_submission_id": payload["submission_id"],
    #             "langcode": payload["langcode"],
    #             "topics": payload.get("topics", []),
    #             "owner_department": "Housing and Homelessness Response",
    #             "needs_accessibility_followup": payload.get("needs_alternate_format", False),
    #             "body": payload["comment"],
    #             "submitter": {
    #                 "name": payload.get("name"),
    #                 "email": payload.get("email"),
    #                 "zip": payload.get("zip"),
    #                 "role": payload.get("submitter_role"),
    #             },
    #         },
    #         headers={"Authorization": f"Bearer {os.environ['RECORD_SYSTEM_TOKEN']}"},
    #     )
    log.info(
        "Would forward submission %s to record system at %s",
        payload.get("submission_id"),
        RECORD_SYSTEM_URL,
    )
