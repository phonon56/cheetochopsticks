import { routeRequest, type RouteResult } from './keywords';

/**
 * Client wrapper for the plain-language router.
 *
 * The Worker at /api/route runs Claude against the full topic catalog.
 * If it's reachable and returns a usable result, we show that.
 * Otherwise we fall back to the local keyword matcher with zero user
 * friction — the fallback has been good enough to ship alone for the
 * last week, so it's fine as a backstop.
 */

export type RouteEngine = 'claude' | 'keyword-fallback' | 'keyword-only';

export interface RouterMatch {
  topicId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  /** Preserved from the keyword matcher's per-entry warning when fallback triggers. */
  warning?: string;
  /** Present only on keyword matches — shows the numeric score for debug. */
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

interface ClaudeResponse {
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
}

const ROUTE_ENDPOINT = '/api/route';
const TIMEOUT_MS = 8_000;

/**
 * Tries Claude first; falls back to the local keyword matcher on any
 * failure. Returns quickly in local-only mode when the fetch is not
 * reachable (dev server without the Worker running).
 */
export async function routeWithFallback(
  query: string,
  opts: { signal?: AbortSignal } = {},
): Promise<RouterResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { primary: null, alternates: [], engine: 'keyword-only' };
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
      body: JSON.stringify({ query: trimmed }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return mapKeyword(routeRequest(trimmed), 'keyword-fallback');
    }

    const data = (await res.json()) as ClaudeResponse;
    return {
      primary: data.primary,
      alternates: data.alternates ?? [],
      extractedZip: data.extractedZip ?? undefined,
      engine: 'claude',
      reasoning: data.reasoning,
    };
  } catch {
    return mapKeyword(routeRequest(trimmed), 'keyword-fallback');
  }
}

function mapKeyword(
  result: RouteResult,
  engine: RouteEngine,
): RouterResult {
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
