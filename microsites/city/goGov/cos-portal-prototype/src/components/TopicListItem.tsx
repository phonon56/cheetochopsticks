import type { Topic } from '../types';
import { JurisdictionTag } from './JurisdictionTag';

interface Props {
  topic: Topic & { group?: string };
  onPickTopic: (topicId: string) => void;
  subtitle?: string;
}

export function TopicListItem({ topic, onPickTopic, subtitle }: Props) {
  const d = topic.destination ?? { kind: 'form' as const };
  const destBadge =
    d.kind === 'external' ? 'External' : d.kind === 'email' ? 'Email' : 'Form';
  const jurisdiction = topic.facets?.jurisdiction ?? 'city';

  return (
    <li className="rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:border-brand-ink hover:shadow-md">
      <button
        type="button"
        onClick={() => onPickTopic(topic.topicId)}
        className="w-full text-left p-4 min-h-24"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <JurisdictionTag jurisdiction={jurisdiction} />
          <span className="rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-xs text-ink-meta">
            {destBadge}
          </span>
        </div>
        <p className="font-semibold text-ink">{topic.name}</p>
        {subtitle && <p className="text-xs text-ink-meta mt-0.5">{subtitle}</p>}
        {!subtitle && topic.group && (
          <p className="text-xs text-ink-meta mt-0.5">{topic.group}</p>
        )}
      </button>
    </li>
  );
}
