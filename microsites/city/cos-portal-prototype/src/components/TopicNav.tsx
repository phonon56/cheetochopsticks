import { useMemo, useRef, useState, type KeyboardEvent } from 'react';

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
import { catalog, searchTopics, topicRequiresLocation } from '../data';
import type { Topic } from '../types';

interface Props {
  selectedId: string | null;
  onSelect: (topicId: string) => void;
}

export function TopicNav({ selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(
    catalog.groups[0]?.groupName ?? null,
  );
  const navRef = useRef<HTMLElement>(null);

  const results = useMemo(() => searchTopics(query), [query]);
  const searching = query.trim().length > 0;

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    const key = e.key;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return;
    const root = navRef.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-nav-item]'),
    );
    if (!items.length) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = items.findIndex((el) => el === current);
    e.preventDefault();
    let nextIdx = idx;
    if (key === 'ArrowDown') nextIdx = idx < 0 ? 0 : Math.min(idx + 1, items.length - 1);
    else if (key === 'ArrowUp') nextIdx = idx <= 0 ? 0 : idx - 1;
    else if (key === 'Home') nextIdx = 0;
    else if (key === 'End') nextIdx = items.length - 1;
    items[nextIdx]?.focus();
  }

  return (
    <nav
      ref={navRef}
      onKeyDown={handleKeyDown}
      aria-label="Service topics"
      className="h-full flex flex-col border-r border-slate-200 bg-white"
    >
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">
          City of Colorado Springs
        </h1>
        <p className="text-sm text-slate-600">Report an issue or contact a department</p>
      </div>
      <div className="p-3 border-b border-slate-200">
        <label htmlFor="topic-search" className="sr-only">
          Search topics
        </label>
        <input
          id="topic-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (pothole, noise, CORA…)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <ul role="list" className="py-2">
            {results.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">
                No topics match “{query}”.
              </li>
            )}
            {results.map((t) => (
              <TopicRow
                key={t.topicId}
                topic={t}
                groupLabel={t.group}
                selected={t.topicId === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ) : (
          <ul role="list">
            {catalog.groups.map((g) => {
              const isOpen = openGroup === g.groupName;
              return (
                <li key={g.groupName} className="border-b border-slate-100">
                  <button
                    type="button"
                    data-nav-item
                    aria-expanded={isOpen}
                    aria-controls={`group-${slug(g.groupName)}`}
                    onClick={() => setOpenGroup(isOpen ? null : g.groupName)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 min-h-11"
                  >
                    <span>{g.groupName}</span>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{g.items.length}</span>
                      <span aria-hidden className={isOpen ? 'rotate-180' : ''}>
                        ▾
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <ul id={`group-${slug(g.groupName)}`} role="list" className="pb-2">
                      {g.items.map((t) => (
                        <TopicRow
                          key={t.topicId}
                          topic={t}
                          selected={t.topicId === selectedId}
                          onSelect={onSelect}
                          indent
                        />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}

function TopicRow({
  topic,
  selected,
  onSelect,
  indent,
  groupLabel,
}: {
  topic: Topic;
  selected: boolean;
  onSelect: (id: string) => void;
  indent?: boolean;
  groupLabel?: string;
}) {
  const needsLocation = topicRequiresLocation(topic);
  return (
    <li>
      <button
        type="button"
        data-nav-item
        onClick={() => onSelect(topic.topicId)}
        aria-current={selected ? 'true' : undefined}
        className={[
          'w-full flex items-center justify-between gap-3 text-left text-sm py-2 min-h-11',
          indent ? 'pl-8 pr-4' : 'px-4',
          selected
            ? 'bg-blue-50 text-blue-900 font-medium'
            : 'text-slate-800 hover:bg-slate-50',
        ].join(' ')}
      >
        <span className="flex-1">
          {topic.name}
          {groupLabel && (
            <span className="block text-xs text-slate-500 mt-0.5">{groupLabel}</span>
          )}
        </span>
        {needsLocation && (
          <span
            aria-label="Location required"
            title="Location required"
            className="text-xs text-slate-400"
          >
            📍
          </span>
        )}
      </button>
    </li>
  );
}
