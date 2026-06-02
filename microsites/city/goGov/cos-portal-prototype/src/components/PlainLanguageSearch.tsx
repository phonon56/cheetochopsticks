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
          // Turnstile tokens are single-use. Reset the widget after ANY response
          // that means we sent a token to the worker — including 503 (AI down)
          // and other keyword-fallback paths where siteverify already consumed
          // the token. The only no-token case is engine='keyword-only', which
          // fires when turnstileToken was undefined and routeWithFallback short-
          // circuited locally without a fetch.
          const sentToken = r.engine !== 'keyword-only';
          if (sentToken && turnstileWidgetIdRef.current && window.turnstile) {
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
    <section aria-labelledby="plain-language-heading" className="max-w-2xl space-y-6">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink mb-3">
          <span aria-hidden="true" className="inline-flex gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#00943a' }} />
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#0074c8' }} />
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#fea30b' }} />
          </span>
          Contact the City
        </p>
        <h1
          id="plain-language-heading"
          tabIndex={-1}
          className="font-serif text-[2.7rem] leading-[1.1] font-semibold tracking-tight text-ink focus:outline-none"
        >
          What do you need to get done today?
        </h1>
        <p className="mt-4 text-[16px] text-ink-secondary leading-relaxed max-w-xl">
          Describe it in your own words. We'll route you to the right department — or show
          you exactly who to contact.
        </p>
      </div>

      <div>
        <div className="flex items-start justify-between mb-1.5">
          <label htmlFor="plain-language-input" className="text-sm font-semibold text-ink">
            Your situation <span className="sr-only">(optional)</span>
          </label>
          <span aria-live="polite" className="text-xs text-ink-meta">
            {text.length} / {MAX}
          </span>
        </div>
        <textarea
          id="plain-language-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={4}
          placeholder="e.g. 'My neighbor's grass is three feet tall.' — or — 'I want to close Tejon Street for a street fair on June 15.'"
          className="w-full rounded-lg border border-line-stronger bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-meta focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-ink-meta">
          Addresses, dates, and what you're trying to accomplish all help.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink mb-2">Or try one of these</p>
        <ul role="list" className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => setText(ex)}
                className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm text-ink-strong hover:border-brand-ink hover:text-brand-ink min-h-8"
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
        <div className="flex gap-3 rounded-xl border border-line border-l-4 border-l-warning bg-warning-surface p-4 shadow-sm">
          <span className="text-warning shrink-0 mt-0.5" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          </span>
          <div>
            <p className="font-semibold text-warning-ink">We couldn't confidently match that.</p>
            <p className="mt-0.5 text-sm text-warning-ink/90">
              Browse the topic menu on the left, or call the general City line at{' '}
              <a href="tel:+17193855169" className="underline">
                (719) 385-5169
              </a>
              .
            </p>
          </div>
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
      className="flex gap-3 rounded-xl border border-line border-l-4 border-l-info bg-surface p-4 shadow-sm"
    >
      <span className="text-info shrink-0 mt-0.5" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
      </span>
      <div>
        <p className="text-sm text-ink-strong">
          <span className="font-semibold text-info-ink">We saw {zip} in your question.</span>{' '}
          That zip is in: {jurisdictions.map((j) => JURISDICTION_LABELS[j]).join(' · ')}.
        </p>
        {hasCity && hasCounty && (
          <p className="mt-1 text-xs text-ink-secondary">
            Most of this zip is handled by City of Colorado Springs agencies. Small unincorporated
            slivers fall under El Paso County — if you need the unincorporated side, add a street
            address and we'll narrow further.
          </p>
        )}
      </div>
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
      className="rounded-xl border border-line border-l-4 border-l-brand bg-brand-surface p-5 shadow-sm space-y-3"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">
          Suggested destination · {confidenceLabel(primary.confidence)}
        </p>
        <h2 className="font-serif text-lg font-semibold text-brand-ink mt-1.5">{topic.name}</h2>
        <p className="text-sm text-brand-ink mt-1 leading-relaxed">{primary.reason}</p>
      </div>

      {primary.warning && (
        <div className="flex gap-2 rounded-lg border border-line border-l-4 border-l-warning bg-warning-surface p-3 text-xs text-warning-ink">
          <span className="shrink-0" aria-hidden="true">⚠</span>
          <p>{primary.warning}</p>
        </div>
      )}

      <DestinationCta topic={topic} onPickTopic={onPickTopic} />

      {alternates.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-brand-ink font-semibold">
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
                  className="rounded-lg border border-line-strong bg-surface p-3 shadow-sm"
                >
                  <p className="text-sm font-semibold text-ink">{altTopic.name}</p>
                  <p className="text-xs text-ink-secondary mt-0.5">{alt.reason}</p>
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
    ? 'inline-flex items-center gap-2 rounded-lg bg-brand-hover px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark min-h-8'
    : 'inline-flex items-center gap-2 rounded-lg bg-brand-hover px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark min-h-11';

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
      <p className="text-xs text-ink-meta" aria-live="polite">
        Routing…
      </p>
    );
  }
  if (turnstileError) {
    return (
      <p className="text-xs text-warning-ink" role="status">
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
    engine === 'workers-ai' ? 'text-success-ink' :
    engine === 'keyword-fallback' ? 'text-ink-meta' :
    'text-warning-ink';

  return (
    <p className={`text-xs ${tone}`} role="status" aria-live="polite">
      {label}
    </p>
  );
}
