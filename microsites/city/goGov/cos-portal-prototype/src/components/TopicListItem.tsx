import type { Jurisdiction, Topic } from '../types';
import { JURISDICTION_SHORT } from '../data/facets';

interface Props {
  topic: Topic & { group?: string };
  onPickTopic: (topicId: string) => void;
  subtitle?: string;
}

const JURISDICTION_COLORS: Record<Jurisdiction, string> = {
  city: 'bg-blue-100 text-blue-900 border-blue-300',
  county: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  state: 'bg-purple-100 text-purple-900 border-purple-300',
  federal: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  regional: 'bg-amber-100 text-amber-900 border-amber-300',
  utility: 'bg-orange-100 text-orange-900 border-orange-300',
  'special-district': 'bg-pink-100 text-pink-900 border-pink-300',
  tribal: 'bg-rose-100 text-rose-900 border-rose-300',
};

export function TopicListItem({ topic, onPickTopic, subtitle }: Props) {
  const d = topic.destination ?? { kind: 'form' as const };
  const destBadge =
    d.kind === 'external' ? 'External' : d.kind === 'email' ? 'Email' : 'Form';
  const jurisdiction = topic.facets?.jurisdiction ?? 'city';

  return (
    <li className="rounded-md border border-slate-200 bg-white hover:border-blue-700">
      <button
        type="button"
        onClick={() => onPickTopic(topic.topicId)}
        className="w-full text-left p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-medium text-slate-900">{topic.name}</span>
          <span className="flex-none flex items-center gap-1">
            <span
              className={[
                'rounded-full border px-2 py-0.5 text-xs font-medium',
                JURISDICTION_COLORS[jurisdiction],
              ].join(' ')}
              aria-label={`Jurisdiction: ${JURISDICTION_SHORT[jurisdiction]}`}
            >
              {JURISDICTION_SHORT[jurisdiction]}
            </span>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs',
                d.kind === 'external'
                  ? 'bg-amber-100 text-amber-900'
                  : d.kind === 'email'
                    ? 'bg-teal-100 text-teal-900'
                    : 'bg-slate-100 text-slate-800',
              ].join(' ')}
            >
              {destBadge}
            </span>
          </span>
        </div>
        {subtitle && <p className="text-xs text-slate-700 mt-1">{subtitle}</p>}
        {!subtitle && topic.group && (
          <p className="text-xs text-slate-600 mt-1">{topic.group}</p>
        )}
      </button>
    </li>
  );
}
