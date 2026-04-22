import { useMemo, useState } from 'react';
import { allTopics, getTopicsByIntent } from '../data';
import { INTENT_LABELS, SUBJECT_LABELS } from '../data/facets';
import type { Intent, Subject, Topic } from '../types';
import { TopicListItem } from './TopicListItem';

interface Props {
  onPickTopic: (topicId: string) => void;
}

const INTENT_DESCRIPTIONS: Record<Intent, string> = {
  report: 'Something is broken, loud, illegal, or causing a problem.',
  permit: 'Starting a project, event, or business that needs city approval.',
  records: 'Request a document, record, or public information.',
  contact: "Ask a question, give feedback, or reach a specific office.",
};

export function ByIntentBrowse({ onPickTopic }: Props) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  // subjects available under the chosen intent
  const availableSubjects = useMemo(() => {
    if (!intent) return [] as Subject[];
    const set = new Set<Subject>();
    for (const t of getTopicsByIntent(intent)) {
      for (const s of t.facets?.subjects ?? []) set.add(s);
    }
    return [...set].sort((a, b) => SUBJECT_LABELS[a].localeCompare(SUBJECT_LABELS[b]));
  }, [intent]);

  const visibleTopics = useMemo<Array<Topic & { group: string }>>(() => {
    if (!intent) return [];
    const list = getTopicsByIntent(intent);
    if (!subject) return list;
    return list.filter((t) => t.facets?.subjects.includes(subject));
  }, [intent, subject]);

  if (!intent) {
    return (
      <section aria-labelledby="by-intent-heading" className="space-y-4 max-w-3xl">
        <div>
          <h2 id="by-intent-heading" className="text-xl font-semibold text-slate-900">
            What do you want to do?
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            Pick the intent that fits best — you can change it anytime.
          </p>
        </div>
        <ul role="list" className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(INTENT_LABELS) as Intent[]).map((i) => {
            const count = getTopicsByIntent(i).length;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setIntent(i)}
                  className="w-full text-left rounded-lg border border-slate-300 bg-white p-4 hover:border-blue-700 hover:bg-blue-50 min-h-24"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {INTENT_LABELS[i]}{' '}
                    <span className="text-xs font-normal text-slate-600">
                      ({count})
                    </span>
                  </p>
                  <p className="text-sm text-slate-700 mt-1">{INTENT_DESCRIPTIONS[i]}</p>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-slate-600">
          Catalog covers {allTopics.length} topics across {new Set(allTopics.map((t) => t.group)).size}{' '}
          offices.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="by-intent-heading" className="space-y-4 max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-sm">
        <button
          type="button"
          onClick={() => {
            setIntent(null);
            setSubject(null);
          }}
          className="text-blue-700 underline"
        >
          ← All intents
        </button>
      </nav>
      <div>
        <h2 id="by-intent-heading" className="text-xl font-semibold text-slate-900">
          {INTENT_LABELS[intent]}
        </h2>
        <p className="text-sm text-slate-700 mt-1">{INTENT_DESCRIPTIONS[intent]}</p>
      </div>

      {availableSubjects.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-900 mb-2">Filter by subject</p>
          <ul role="list" className="flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                onClick={() => setSubject(null)}
                aria-pressed={subject === null}
                className={chipClass(subject === null)}
              >
                All ({getTopicsByIntent(intent).length})
              </button>
            </li>
            {availableSubjects.map((s) => {
              const count = getTopicsByIntent(intent).filter((t) =>
                t.facets?.subjects.includes(s),
              ).length;
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setSubject(s)}
                    aria-pressed={subject === s}
                    className={chipClass(subject === s)}
                  >
                    {SUBJECT_LABELS[s]} ({count})
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul role="list" className="space-y-2">
        {visibleTopics.map((t) => (
          <TopicListItem key={t.topicId} topic={t} onPickTopic={onPickTopic} />
        ))}
      </ul>
    </section>
  );
}

function chipClass(active: boolean) {
  return [
    'rounded-full border px-3 py-1 text-sm min-h-8',
    active
      ? 'border-blue-700 bg-blue-700 text-white font-medium'
      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  ].join(' ');
}
