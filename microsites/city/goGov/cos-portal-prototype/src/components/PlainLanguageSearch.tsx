import { useMemo, useState } from 'react';
import { routeRequest, type RouteMatch } from '../data/keywords';
import { topicsById } from '../data';
import { resolveJurisdictionsForZip } from '../data/notifications';
import { JURISDICTION_LABELS } from '../data/facets';
import type { Destination, Topic } from '../types';

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

export function PlainLanguageSearch({ onPickTopic }: Props) {
  const [text, setText] = useState('');
  const result = useMemo(() => routeRequest(text), [text]);

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
  primary: RouteMatch;
  alternates: RouteMatch[];
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

function confidenceLabel(c: RouteMatch['confidence']) {
  if (c === 'high') return 'strong match';
  if (c === 'medium') return 'likely match';
  return 'possible match';
}
