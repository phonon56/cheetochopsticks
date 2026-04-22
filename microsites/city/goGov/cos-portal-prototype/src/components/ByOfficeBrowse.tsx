import { useState } from 'react';
import { catalog } from '../data';
import { TopicListItem } from './TopicListItem';

interface Props {
  onPickTopic: (topicId: string) => void;
}

export function ByOfficeBrowse({ onPickTopic }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(
    catalog.groups[0]?.groupName ?? null,
  );

  return (
    <section aria-labelledby="by-office-heading" className="space-y-3 max-w-3xl">
      <div>
        <h2 id="by-office-heading" className="text-xl font-semibold text-slate-900">
          Browse by office
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          All {catalog.groups.reduce((n, g) => n + g.items.length, 0)} topics grouped by
          the office that handles them.
        </p>
      </div>
      <ul role="list" className="space-y-2">
        {catalog.groups.map((g) => {
          const isOpen = openGroup === g.groupName;
          const slug = g.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return (
            <li key={g.groupName} className="rounded-md border border-slate-200 bg-white">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : g.groupName)}
                  aria-expanded={isOpen}
                  aria-controls={`office-${slug}`}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left min-h-11"
                >
                  <span className="font-medium text-slate-900">{g.groupName}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <span>{g.items.length} topics</span>
                    <span aria-hidden="true" className={isOpen ? 'rotate-180 inline-block' : 'inline-block'}>
                      ▾
                    </span>
                  </span>
                </button>
              </h3>
              {isOpen && (
                <ul id={`office-${slug}`} role="list" className="p-2 pt-0 space-y-1">
                  {g.items.map((t) => (
                    <TopicListItem
                      key={t.topicId}
                      topic={t}
                      onPickTopic={onPickTopic}
                      subtitle={t.description ? t.description.slice(0, 120) : undefined}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
