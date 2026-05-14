import { useEffect, useRef, useState } from 'react';
import { routeWithFallback, type RouterMatch, type RouterResult } from '../data/router-client';
import { topicsById } from '../data';
import { resolveJurisdictionsForZip } from '../data/notifications';
import { JURISDICTION_LABELS } from '../data/facets';
import type { Destination, Topic } from '../types';

// Minimal type for Cloudflare Turnstile's globally-injected object.
// The full API is documented at https://developers.cloudflare.com/turnstile/.
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          appearance?: 'always' | 'execute' | 'interaction-only';
          'refresh-expired'?: 'auto' | 'manual' | 'never';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface Props {
  onPickTopic: (topicId: string) => void;
}

const EXAMPLES = [
  "My neighbor's grass is three feet tall.",
  'I want to add a deck to the back of my house.',
  'I want to run a 5K through Old Colorado City on a Saturday morning.',
  "I'm opening a small coffee shop and need to know what licenses I need.",
  'I need aggregate crime data from the police who cover 80915.',
  "There's a pothole on my street that hasn't been fixed in two weeks.",
];

const MAX = 500;
const DEBOUNCE_MS = 450;
// Poll for window.turnstile up to 5 seconds before giving up. The script tag
// in index.html loads async; usually it's ready by the time React mounts.
const TURNSTILE_POLL_MS = 100;
const TURNSTILE_POLL_TRIES = 50;

export function PlainLanguageSearch({ onPickTopic }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<RouterResult>({
    primary: null,
    alternates: [],
    engine: 'keyword-only',
  });
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  // Turnstile widget state. siteKey is fetched from /api/turnstile-config so
  // wrangler.jsonc is the single source of truth. The widget renders only
  // after we have a real key — otherwise the LLM endpoint would 403 every
  // request and the page would do extra round-trips for nothing.
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // One-time: fetch the site key, wait for the Turnstile script, render the
  // widget. The script tag in index.html sets window.turnstile asynchronously.
  useEffect(() => {
    let cancelled = false;
    let pollHandle: number | undefined;

    (async () => {
      // 1. Get the site key from the worker.
      let siteKey = '';
      let devMode = false;
      try {
        const res = await fetch('/api/turnstile-config');
        if (res.ok) {
          const data = await res.json();
          siteKey = typeof data?.siteKey === 'string' ? data.siteKey : '';
          devMode = data?.devMode === true;
        }
      } catch {
        // Fall through — siteKey stays empty, we'll degrade to keyword-only.
      }
      if (cancelled) return;

      if (devMode) {
        // Local wrangler dev — the worker accepts requests without a Turnstile
        // token. Skip the widget entirely so the dev UX doesn't gate on a
        // network round-trip to siteverify.
        setTurnstileToken('dev-mode-no-token');
        setTurnstileReady(true);
        return;
      }

      if (!siteKey || siteKey.startsWith('0x4AAAAAAAREPLACE_ME')) {
        // Worker hasn't been configured with a real Turnstile site key yet —
        // graceful degradation, the LLM endpoint won't be called and the
        // keyword matcher takes over.
        setTurnstileError('Turnstile not configured on the worker');
        return;
      }

      // 2. Wait for the Turnstile script to load.
      let tries = 0;
      const poll = () => {
        if (cancelled) return;
        if (window.turnstile && turnstileContainerRef.current) {
          // 3. Render the widget.
          const id = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            theme: 'auto',
            appearance: 'interaction-only',
            'refresh-expired': 'auto',
            callback: (token: string) => {
              if (cancelled) return;
              setTurnstileToken(token);
              setTurnstileReady(true);
              setTurnstileError(null);
            },
            'expired-callback': () => {
              if (cancelled) return;
              setTurnstileToken(undefined);
            },
            'error-callback': () => {
              if (cancelled) return;
              setTurnstileError('Turnstile widget error');
            },
          });
          turnstileWidgetIdRef.current = id;
          return;
        }
        tries += 1;
        if (tries >= TURNSTILE_POLL_TRIES) {
          setTurnstileError('Turnstile script failed to load');
          return;
        }
        pollHandle = window.setTimeout(poll, TURNSTILE_POLL_MS);
      };
      poll();
    })();

    return () => {
      cancelled = true;
      if (pollHandle !== undefined) clearTimeout(pollHandle);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetIdRef.current); } catch { /* ignore */ }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, []);

  // Debounced router call. Fires DEBOUNCE_MS after the latest keystroke. The
  // requestIdRef guards against stale responses landing after a newer query
  // started. When turnstileToken is undefined, routeWithFallback skips the
  // network call entirely and returns local keyword results immediately.
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setResult({ primary: null, alternates: [], engine: 'keyword-only' });
      setLoading(false);
      return;
    }

    const id = ++requestIdRef.current;
    const controller = new AbortController();
    setLoading(true);

    const handle = window.setTimeout(() => {
      routeWithFallback(trimmed, { turnstileToken, signal: controller.signal })
        .then((r) => {
          if (requestIdRef.current !== id) return; // stale
          setResult(r);
          setLoading(false);
          // Turnstile tokens are single-use. Once we've spent one on a real
          // worker call, reset the widget for a fresh token so the NEXT query
          // isn't gated on the LLM falling back to keyword.
          const usedToken = r.engine === 'workers-ai'
            || r.engine === 'rate-limited'
            || r.engine === 'turnstile-failed';
          if (usedToken && turnstileWidgetIdRef.current && window.turnstile) {
            setTurnstileToken(undefined);
            try { window.turnstile.reset(turnstileWidgetIdRef.current); } catch { /* ignore */ }
          }
        })
        .catch(() => {
          if (requestIdRef.current !== id) return;
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [text, turnstileToken]);

  return (
    <section aria-labelledby="plain-language-heading" className="max-w-2xl space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-600">
          Plain-language routing
        </p>
        <h1 id="plain-language-heading" className="text-3xl font-semibold text-slate-900">
          Tell us what you need.
        </h1>
        <p className="text-slate-700">
          Describe your situation in your own words — you don't need to know which
          department handles it.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="plain-language-input" className="text-sm font-medium text-slate-900">
            Your situation <span className="sr-only">(optional)</span>
          </label>
          <span aria-live="polite" className="text-xs text-slate-600">
            {text.length} / {MAX}
          </span>
        </div>
        <textarea
          id="plain-language-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={4}
          placeholder="e.g. 'My neighbor's grass is three feet tall.' — or — 'I want to close Tejon Street for a street fair on June 15.'"
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm focus:border-blue-700"
        />
        <p className="mt-1 text-xs text-slate-600">
          Addresses, dates, and what you're trying to accomplish all help.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-900 mb-2">Or try one of these</p>
        <ul role="list" className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => setText(ex)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 min-h-8"
              >
                {ex.length > 40 ? ex.slice(0, 38) + '…' : ex}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Turnstile widget. appearance="interaction-only" keeps it hidden until
          Cloudflare wants a challenge, so most users never see it. */}
      <div
        ref={turnstileContainerRef}
        aria-hidden={!turnstileReady}
        className="my-2"
      />

      <EngineStatus
        engine={result.engine}
        loading={loading}
        turnstileError={turnstileError}
      />

      {result.extractedZip && (
        <ZipContext zip={result.extractedZip} />
      )}

      {result.primary && (
        <RouteResultCard
          primary={result.primary}
          alternates={result.alternates}
          onPickTopic={onPickTopic}
        />
      )}

      {text.trim().length > 4 && !result.primary && (
        <div className="rounded-md border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">We couldn't confidently match that.</p>
          <p className="mt-1">
            Browse the topic menu on the left, or call the general City line at{' '}
            <a href="tel:+17193855169" className="underline">
              (719) 385-5169
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
}

function ZipContext({ zip }: { zip: string }) {
  const jurisdictions = resolveJurisdictionsForZip(zip);
  if (jurisdictions.length === 0) return null;
  const hasCity = jurisdictions.includes('city');
  const hasCounty = jurisdictions.includes('county');
  return (
    <div
      role="note"
      aria-live="polite"
      className="rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-800"
    >
      <p>
        <span className="font-medium">We saw {zip} in your question.</span>{' '}
        That zip is in: {jurisdictions.map((j) => JURISDICTION_LABELS[j]).join(' · ')}.
      </p>
      {hasCity && hasCounty && (
        <p className="mt-1 text-xs text-slate-700">
          Most of this zip is handled by City of Colorado Springs agencies. Small unincorporated
          slivers fall under El Paso County — if you need the unincorporated side, add a street
          address and we'll narrow further.
        </p>
      )}
    </div>
  );
}

function RouteResultCard({
  primary,
  alternates,
  onPickTopic,
}: {
  primary: RouterMatch;
  alternates: RouterMatch[];
  onPickTopic: (id: string) => void;
}) {
  const topic = topicsById.get(primary.topicId);
  if (!topic) return null;

  return (
    <div
      role="region"
      aria-label="Suggested destination"
      aria-live="polite"
      className="rounded-lg border border-blue-700 bg-blue-50 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-900">
            Suggested destination · {confidenceLabel(primary.confidence)}
          </p>
          <h2 className="text-lg font-semibold text-blue-950 mt-1">{topic.name}</h2>
          <p className="text-sm text-blue-900 mt-1">{primary.reason}</p>
        </div>
      </div>

      {primary.warning && (
        <p className="rounded-md border border-amber-400 bg-amber-50 p-2 text-xs text-amber-900">
          ⚠ {primary.warning}
        </p>
      )}

      <DestinationCta topic={topic} onPickTopic={onPickTopic} />

      {alternates.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-900 font-medium">
            Not quite right? Show {alternates.length} alternative
            {alternates.length === 1 ? '' : 's'}
          </summary>
          <ul role="list" className="mt-2 space-y-2">
            {alternates.map((alt) => {
              const altTopic = topicsById.get(alt.topicId);
              if (!altTopic) return null;
              return (
                <li
                  key={alt.topicId}
                  className="rounded-md border border-slate-300 bg-white p-3"
                >
                  <p className="text-sm font-medium text-slate-900">{altTopic.name}</p>
                  <p className="text-xs text-slate-700 mt-0.5">{alt.reason}</p>
                  <div className="mt-2">
                    <DestinationCta topic={altTopic} onPickTopic={onPickTopic} compact />
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}

function DestinationCta({
  topic,
  onPickTopic,
  compact,
}: {
  topic: Topic;
  onPickTopic: (id: string) => void;
  compact?: boolean;
}) {
  const d: Destination = topic.destination ?? { kind: 'form' };
  const base = compact
    ? 'inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 min-h-8'
    : 'inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 min-h-11';

  if (d.kind === 'external') {
    return (
      <a href={d.url} target="_blank" rel="noreferrer" className={base}>
        {d.ctaLabel ?? `Continue to ${d.agency}`} <span aria-hidden="true">↗</span>
      </a>
    );
  }
  if (d.kind === 'email') {
    const subject = d.subjectTemplate ? `?subject=${encodeURIComponent(d.subjectTemplate)}` : '';
    return (
      <a href={`mailto:${d.address}${subject}`} className={base}>
        {d.ctaLabel ?? `Email ${d.address}`}
      </a>
    );
  }
  return (
    <button type="button" onClick={() => onPickTopic(topic.topicId)} className={base}>
      Open this form →
    </button>
  );
}

function confidenceLabel(c: RouterMatch['confidence']) {
  if (c === 'high') return 'strong match';
  if (c === 'medium') return 'likely match';
  return 'possible match';
}

// Small badge under the textarea telling the user which routing engine
// produced the result. Useful during prototype rollout for spotting when the
// LLM is failing back to keyword. Mostly informational; the keyword fallback
// is good enough to ship alone, so degraded states aren't a UI emergency.
function EngineStatus({
  engine,
  loading,
  turnstileError,
}: {
  engine: RouterResult['engine'];
  loading: boolean;
  turnstileError: string | null;
}) {
  if (loading) {
    return (
      <p className="text-xs text-slate-600" aria-live="polite">
        Routing…
      </p>
    );
  }
  if (turnstileError) {
    return (
      <p className="text-xs text-amber-800" role="status">
        Using local matcher only — {turnstileError}.
      </p>
    );
  }
  if (engine === 'keyword-only') return null;

  const label =
    engine === 'workers-ai' ? 'Routed by Workers AI (Llama 3.3)' :
    engine === 'keyword-fallback' ? 'Routed by the local keyword matcher (LLM unavailable)' :
    engine === 'rate-limited' ? 'You\'re going a bit fast — falling back to keyword routing' :
    engine === 'turnstile-failed' ? 'Couldn\'t verify the page — falling back to keyword routing' :
    null;

  if (!label) return null;
  const tone =
    engine === 'workers-ai' ? 'text-emerald-800' :
    engine === 'keyword-fallback' ? 'text-slate-600' :
    'text-amber-800';

  return (
    <p className={`text-xs ${tone}`} role="status" aria-live="polite">
      {label}
    </p>
  );
}
