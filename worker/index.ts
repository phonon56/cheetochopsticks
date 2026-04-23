import { SYSTEM_PROMPT, OUTPUT_SCHEMA } from './prompt';

/**
 * Cloudflare Worker for cheetochopsticks.com.
 *
 * - `/api/route` — POST {query: string} → Claude-based plain-language router.
 *   System prompt (catalog + instructions) is cached on Anthropic's side
 *   via `cache_control: ephemeral`. Client-side fallback to the local
 *   keyword matcher runs on error.
 * - Everything else — delegated to the static-asset binding (the rest of
 *   cheetochopsticks.com).
 *
 * Security: the Anthropic key is a Worker secret (`ANTHROPIC_API_KEY`),
 * never exposed client-side. Rate limiting is a TODO — start by watching
 * the observability dashboard and adding a simple KV-based per-IP gate
 * if we see abuse.
 */

const MODEL = 'claude-haiku-4-5';
const MAX_OUTPUT_TOKENS = 600;
const MAX_QUERY_LENGTH = 600;

interface Env {
  ASSETS: Fetcher;
  ANTHROPIC_API_KEY?: string;
}

interface RouteMatch {
  topicId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

interface RouteResponse {
  primary: RouteMatch | null;
  alternates: RouteMatch[];
  extractedZip: string | null;
  reasoning: string;
  /** Informational — which engine produced this answer. */
  engine: 'claude' | 'keyword-fallback' | 'error';
  /** Rough model cost visibility for the client dashboard later. */
  usage?: {
    inputTokens?: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
    outputTokens?: number;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/route') {
      return handleRoute(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { query?: unknown };
  try {
    body = (await request.json()) as { query?: unknown };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return json({ error: 'Missing "query" in body' }, 400);
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return json(
      { error: `Query too long; max ${MAX_QUERY_LENGTH} characters` },
      413,
    );
  }

  if (!env.ANTHROPIC_API_KEY) {
    // No key configured — tell the client so it falls back cleanly.
    // 503 signals "server can't fulfill right now, try local."
    return json(
      { error: 'ANTHROPIC_API_KEY not configured on Worker' },
      503,
    );
  }

  try {
    const result = await callClaude(query, env.ANTHROPIC_API_KEY);
    return json(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json(
      {
        engine: 'error',
        error: message,
        primary: null,
        alternates: [],
        extractedZip: null,
        reasoning: '',
      },
      502,
    );
  }
}

async function callClaude(query: string, apiKey: string): Promise<RouteResponse> {
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      // System as a single cached text block. Sorted catalog + fixed
      // instructions = stable prefix across every request. Verify via
      // response.usage.cache_read_input_tokens on the second+ call.
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: query }],
      // Structured output — response.content[0].text will be valid JSON
      // matching OUTPUT_SCHEMA.
      output_config: {
        format: {
          type: 'json_schema',
          schema: OUTPUT_SCHEMA,
        },
      },
    }),
  });

  if (!anthropicResponse.ok) {
    const text = await anthropicResponse.text().catch(() => '');
    throw new Error(
      `Anthropic API ${anthropicResponse.status}: ${text.slice(0, 200)}`,
    );
  }

  const data = (await anthropicResponse.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: {
      input_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
      output_tokens?: number;
    };
  };

  const textBlock = data.content?.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('Anthropic response missing text block');
  }

  let parsed: {
    primary: RouteMatch | null;
    alternates: RouteMatch[];
    extractedZip: string | null;
    reasoning: string;
  };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error('Claude returned invalid JSON despite schema guidance');
  }

  return {
    primary: parsed.primary ?? null,
    alternates: Array.isArray(parsed.alternates) ? parsed.alternates : [],
    extractedZip: parsed.extractedZip ?? null,
    reasoning: parsed.reasoning ?? '',
    engine: 'claude',
    usage: data.usage
      ? {
          inputTokens: data.usage.input_tokens,
          cacheReadInputTokens: data.usage.cache_read_input_tokens,
          cacheCreationInputTokens: data.usage.cache_creation_input_tokens,
          outputTokens: data.usage.output_tokens,
        }
      : undefined,
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Public JSON, no secrets; fine to cache the *not-configured* 503
      // briefly so dev doesn't hammer it.
      'cache-control': 'no-store',
    },
  });
}
