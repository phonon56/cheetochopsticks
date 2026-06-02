"""
Provider-agnostic LLM client for civic_records.

Designed so the same `call_json(system, user, ...) -> dict` interface
works in three deployment targets without code changes:

  * Local Docker dev  → Cloudflare Workers AI REST API
  * Cloudflare Worker → same REST API (or future native AI binding)
  * Anthropic Claude  → if you have credits and want stronger reasoning

Provider is selected at module load via env var LLM_PROVIDER.
Defaults to 'cloudflare' so the project deploys to Cloudflare without
repurposing.

ENV VARS
--------
LLM_PROVIDER          cloudflare | anthropic        (default: cloudflare)

Cloudflare Workers AI:
  CLOUDFLARE_ACCOUNT_ID    your account ID (https://dash.cloudflare.com)
  CLOUDFLARE_API_TOKEN     scoped to "Workers AI - Read"
  CLOUDFLARE_MODEL         e.g. @cf/meta/llama-3.1-8b-instruct (default)

Anthropic Claude:
  ANTHROPIC_API_KEY        sk-ant-...
  (model defaulted to claude-haiku-4-5 in the call site)

ALL PROVIDERS log every call to LLMCallLog with token counts + USD cost.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.request
from decimal import Decimal
from typing import Any

from records.models import LLMCallLog

logger = logging.getLogger(__name__)

# ── Pricing tables ──────────────────────────────────────────────────────
# All prices are USD per 1M tokens. Cloudflare publishes prices per
# 1k neurons; we approximate at the model level (rough; tune to taste).

CLOUDFLARE_PRICING = {
    # Free tier covers ~10k neurons/day (~2k small-model calls). Beyond,
    # see https://developers.cloudflare.com/workers-ai/platform/pricing/
    # These per-million-token estimates are a rough approximation.
    "@cf/meta/llama-3.1-8b-instruct":          {"input": Decimal("0.10"), "output": Decimal("0.10")},
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {"input": Decimal("0.30"), "output": Decimal("1.20")},
    "@cf/qwen/qwen1.5-14b-chat-awq":           {"input": Decimal("0.20"), "output": Decimal("0.50")},
    "@cf/google/gemma-2-9b-it":                {"input": Decimal("0.10"), "output": Decimal("0.20")},
}

ANTHROPIC_PRICING = {
    "claude-haiku-4-5":  {"input": Decimal("1.00"), "output": Decimal("5.00"),
                          "cache_read": Decimal("0.10"), "cache_write": Decimal("1.25")},
    "claude-sonnet-4-6": {"input": Decimal("3.00"), "output": Decimal("15.00"),
                          "cache_read": Decimal("0.30"), "cache_write": Decimal("3.75")},
}

# ── Provider selection ──────────────────────────────────────────────────

PROVIDER = os.environ.get("LLM_PROVIDER", "cloudflare").lower()

DEFAULT_MODEL = {
    "cloudflare": os.environ.get("CLOUDFLARE_MODEL",
                                 "@cf/meta/llama-3.1-8b-instruct"),
    "anthropic":  "claude-haiku-4-5",
}.get(PROVIDER, "@cf/meta/llama-3.1-8b-instruct")


class LLMUnavailable(RuntimeError):
    """Raised when the configured provider isn't usable (no key, etc)."""


# ── Cloudflare Workers AI ───────────────────────────────────────────────

def _call_cloudflare(*, system, user, model, max_tokens):
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    api_token  = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not account_id or not api_token:
        raise LLMUnavailable(
            "Cloudflare Workers AI not configured. Set CLOUDFLARE_ACCOUNT_ID "
            "and CLOUDFLARE_API_TOKEN. Get a token at "
            "https://dash.cloudflare.com/profile/api-tokens (scope: Workers AI Read)."
        )

    url = (f"https://api.cloudflare.com/client/v4/accounts/"
           f"{account_id}/ai/run/{model}")
    body = json.dumps({
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        "max_tokens": max_tokens,
    }).encode("utf-8")

    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type":  "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read())

    if not payload.get("success", True):
        errors = payload.get("errors", [])
        raise RuntimeError(f"Cloudflare AI error: {errors}")

    result = payload.get("result", {})
    text = (
        result.get("response")
        or (result.get("choices", [{}])[0].get("message", {}).get("content"))
        or ""
    ).strip()

    # Cloudflare returns usage on most models — { "prompt_tokens", "completion_tokens" }
    usage = result.get("usage", {}) or {}
    return text, {
        "input_tokens":  usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
    }


def _cost_cloudflare(model: str, usage: dict) -> Decimal:
    table = CLOUDFLARE_PRICING.get(model)
    if not table:
        return Decimal("0")
    return (
        Decimal(usage.get("input_tokens", 0))  * table["input"]
        + Decimal(usage.get("output_tokens", 0)) * table["output"]
    ) / Decimal("1000000")


# ── Anthropic Claude ────────────────────────────────────────────────────

def _call_anthropic(*, system, user, model, max_tokens, cache_system):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise LLMUnavailable(
            "ANTHROPIC_API_KEY not set. Either add it to your env, or switch "
            "providers via LLM_PROVIDER=cloudflare."
        )
    try:
        from anthropic import Anthropic
    except ImportError as exc:
        raise LLMUnavailable("anthropic SDK not installed") from exc

    client = Anthropic()
    system_blocks = [{"type": "text", "text": system}]
    if cache_system:
        system_blocks[0]["cache_control"] = {"type": "ephemeral"}

    resp = client.messages.create(
        model=model, max_tokens=max_tokens,
        system=system_blocks,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in resp.content
                   if getattr(b, "type", "") == "text").strip()
    usage = (resp.usage.model_dump() if hasattr(resp.usage, "model_dump")
             else dict(resp.usage))
    return text, {
        "input_tokens":         usage.get("input_tokens", 0),
        "output_tokens":        usage.get("output_tokens", 0),
        "cache_read_tokens":    usage.get("cache_read_input_tokens", 0),
        "cache_write_tokens":   usage.get("cache_creation_input_tokens", 0),
    }


def _cost_anthropic(model: str, usage: dict) -> Decimal:
    table = ANTHROPIC_PRICING.get(model)
    if not table:
        return Decimal("0")
    return (
        Decimal(usage.get("input_tokens", 0))         * table["input"]
        + Decimal(usage.get("output_tokens", 0))      * table["output"]
        + Decimal(usage.get("cache_read_tokens", 0))  * table["cache_read"]
        + Decimal(usage.get("cache_write_tokens", 0)) * table["cache_write"]
    ) / Decimal("1000000")


# ── Public interface ────────────────────────────────────────────────────

def call_json(
    *, system: str, user: str, model: str | None = None,
    max_tokens: int = 1024, purpose: str = "other", record=None,
    cache_system: bool = True,
) -> dict[str, Any]:
    """
    Send a single completion request and return the parsed JSON object.
    Logs token usage + cost to LLMCallLog. Raises on parse failure or
    LLMUnavailable if the configured provider isn't reachable.

    `cache_system` is only honored by Anthropic. Cloudflare ignores it
    (no native prompt caching as of writing).
    """
    model = model or DEFAULT_MODEL

    log = LLMCallLog.objects.create(
        purpose=purpose, model=f"{PROVIDER}:{model}", record=record,
    )

    try:
        if PROVIDER == "cloudflare":
            text, usage = _call_cloudflare(
                system=system, user=user, model=model, max_tokens=max_tokens,
            )
            cost = _cost_cloudflare(model, usage)
        elif PROVIDER == "anthropic":
            text, usage = _call_anthropic(
                system=system, user=user, model=model,
                max_tokens=max_tokens, cache_system=cache_system,
            )
            cost = _cost_anthropic(model, usage)
        else:
            raise LLMUnavailable(
                f"Unknown LLM_PROVIDER={PROVIDER!r}. Use 'cloudflare' or 'anthropic'."
            )
    except Exception as exc:
        log.error = f"{exc.__class__.__name__}: {exc}"
        log.save(update_fields=["error"])
        raise

    log.input_tokens       = usage.get("input_tokens", 0)
    log.output_tokens      = usage.get("output_tokens", 0)
    log.cache_read_tokens  = usage.get("cache_read_tokens", 0)
    log.cache_write_tokens = usage.get("cache_write_tokens", 0)
    log.cost_usd           = cost
    log.save(update_fields=[
        "input_tokens", "output_tokens",
        "cache_read_tokens", "cache_write_tokens", "cost_usd",
    ])

    # Strip optional ```json fences some models add
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip("`\n ")

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        log.error = f"JSON parse failed: {exc}\n---\n{text[:500]}"
        log.save(update_fields=["error"])
        raise
