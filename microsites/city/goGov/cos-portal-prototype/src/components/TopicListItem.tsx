import type { Topic } from '../types';

interface Props {
  topic: Topic & { group?: string };
  onPickTopic: (topicId: string) => void;
  subtitle?: string;
}

export function TopicListItem({ topic, onPickTopic, subtitle }: Props) {
  const d = topic.destination ?? { kind: 'form' as const };
  const badge =
    d.kind === 'external' ? 'External' : d.kind === 'email' ? 'Email' : 'Form';

  return (
    <li className="rounded-md border border-slate-200 bg-white hover:border-blue-700">
      <button
        type="button"
        onClick={() => onPickTopic(topic.topicId)}
        className="w-full text-left p-3"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-900">{topic.name}</span>
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
            {badge}
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
