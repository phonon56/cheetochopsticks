// Client contract for the plain-language router Worker.
//
// The Worker at /api/route runs Cloudflare Workers AI (Llama 3.3 70B Instruct)
// against the full topic catalog. If reachable, we show that result; otherwise
// we fall back to the local keyword matcher with zero user friction.
//
// Two protections sit in front of the model on the server side:
//   1. Per-IP rate limit (30 req/min). Returns 429 when exceeded.
//   2. Cloudflare Turnstile token verification. Returns 403 if the token is
//      missing or invalid. The browser must obtain a token from the Turnstile
//      widget on the page and pass it in `turnstileToken`.
//
// Wire-up steps for the consumer (e.g. PlainLanguageSearch.tsx):
//   1. Fetch the public site key from /api/turnstile-config OR hardcode it
//      from wrangler.jsonc's vars.TURNSTILE_SITE_KEY (it's safe to ship).
//   2. Load https://challenges.cloudflare.com/turnstile/v0/api.js (defer).
//   3. Render the widget with `window.turnstile.render(el, { sitekey, callback })`
//      and store the token in component state.
//   4. Call `routeWithFallback(query, { turnstileToken, signal })` whenever
//      the input changes (debounced).
//   5. Render the result; badge with `result.engine` so users see whether
//      they got the LLM answer or the keyword fallback.

import { routeRequest, type RouteResult } from './keywords';

export type RouteEngine =
  | 'workers-ai'        // happy path — Llama returned a structured answer
  | 'keyword-fallback'  // Worker was reachable but errored; we ran keyword locally
  | 'keyword-only'      // No LLM was attempted (e.g. dev or feature disabled)
  | 'rate-limited'      // 429 from Worker; client should slow down
  | 'turnstile-failed'; // 403 from Worker; client should refresh the Turnstile token

export interface RouterMatch {
  topicId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  /** Preserved from the keyword matcher's per-entry warning when fallback triggers. */
  warning?: string;
  /** Present only on keyword matches — numeric score for debug. */
  score?: number;
}

export interface RouterResult {
  primary: RouterMatch | null;
  alternates: RouterMatch[];
  extractedZip?: string;
  engine: RouteEngine;
  /** Dev-only notes explaining the classification path. */
  reasoning?: string;
}

interface WorkersAIResponse {
  primary: {
    topicId: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  } | null;
  alternates: Array<{
    topicId: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  extractedZip: string | null;
  reasoning: string;
  engine?: string;
  error?: string;
}

const ROUTE_ENDPOINT = '/api/route';
const TIMEOUT_MS = 8_000;

interface RouteOptions {
  signal?: AbortSignal;
  /** Cloudflare Turnstile token. Required in production; the Worker rejects
   *  requests without one unless DEV_MODE=1. */
  turnstileToken?: string;
}

/**
 * Tries Workers AI first; falls back to the local keyword matcher on any
 * failure. Returns quickly in local-only mode when the fetch is not
 * reachable (dev server without the Worker running, or before the UI has
 * obtained a Turnstile token).
 */
export async function routeWithFallback(
  query: string,
  opts: RouteOptions = {},
): Promise<RouterResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { primary: null, alternates: [], engine: 'keyword-only' };
  }

  // If the caller hasn't obtained a Turnstile token yet, skip the network
  // call entirely and use the local matcher. Avoids a guaranteed 403 round-
  // trip and lets the first keystrokes feel instant while the Turnstile
  // widget initializes.
  if (!opts.turnstileToken) {
    return mapKeyword(routeRequest(trimmed), 'keyword-only');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    opts.signal?.addEventListener('abort', () => controller.abort(), {
      once: true,
    });

    const res = await fetch(ROUTE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: trimmed, turnstileToken: opts.turnstileToken }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 429) {
      return mapKeyword(routeRequest(trimmed), 'rate-limited');
    }
    if (res.status === 403) {
      return mapKeyword(routeRequest(trimmed), 'turnstile-failed');
    }
    if (!res.ok) {
      return mapKeyword(routeRequest(trimmed), 'keyword-fallback');
    }

    const data = (await res.json()) as WorkersAIResponse;
    return {
      primary: data.primary,
      alternates: data.alternates ?? [],
      extractedZip: data.extractedZip ?? undefined,
      engine: 'workers-ai',
      reasoning: data.reasoning,
    };
  } catch {
    return mapKeyword(routeRequest(trimmed), 'keyword-fallback');
  }
}

function mapKeyword(result: RouteResult, engine: RouteEngine): RouterResult {
  return {
    primary: result.primary
      ? {
          topicId: result.primary.topicId,
          reason: result.primary.reason,
          confidence: result.primary.confidence,
          warning: result.primary.warning,
          score: result.primary.score,
        }
      : null,
    alternates: result.alternates.map((a) => ({
      topicId: a.topicId,
      reason: a.reason,
      confidence: a.confidence,
      warning: a.warning,
      score: a.score,
    })),
    extractedZip: result.extractedZip,
    engine,
  };
}
