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
      className="space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-meta px-1">
        Browse by topic
      </p>
      <div>
        <label htmlFor="topic-search" className="sr-only">
          Search topics
        </label>
        <input
          id="topic-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (pothole, noise, CORA…)"
          className="w-full rounded-lg border border-line-stronger bg-surface px-3 py-2 text-sm focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none min-h-11"
        />
      </div>

      <div>
        {searching ? (
          <ul role="list" className="space-y-1">
            {results.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-ink-meta">
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
          <ul role="list" className="space-y-1">
            {catalog.groups.map((g) => {
              const isOpen = openGroup === g.groupName;
              return (
                <li key={g.groupName}>
                  <button
                    type="button"
                    data-nav-item
                    aria-expanded={isOpen}
                    aria-controls={`group-${slug(g.groupName)}`}
                    onClick={() => setOpenGroup(isOpen ? null : g.groupName)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-strong hover:bg-surface-muted min-h-11"
                  >
                    <span>{g.groupName}</span>
                    <span className="flex items-center gap-2 text-xs text-ink-meta font-normal">
                      <span>{g.items.length}</span>
                      <span aria-hidden className={isOpen ? 'rotate-180 inline-block' : 'inline-block'}>
                        ▾
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <ul id={`group-${slug(g.groupName)}`} role="list" className="space-y-1 pl-2 pt-1 pb-1">
                      {g.items.map((t) => (
                        <TopicRow
                          key={t.topicId}
                          topic={t}
                          selected={t.topicId === selectedId}
                          onSelect={onSelect}
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
  groupLabel,
}: {
  topic: Topic;
  selected: boolean;
  onSelect: (id: string) => void;
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
          'w-full flex items-center justify-between gap-3 text-left text-sm py-2.5 pr-3 min-h-11 rounded-lg',
          selected
            ? 'bg-surface-muted text-brand-ink font-semibold border-l-[3px] border-brand-ink pl-[calc(0.75rem-3px)]'
            : 'text-ink-strong hover:bg-surface-muted pl-3',
        ].join(' ')}
      >
        <span className="flex-1">
          {topic.name}
          {groupLabel && (
            <span className="block text-xs text-ink-meta mt-0.5 font-normal">{groupLabel}</span>
          )}
        </span>
        {needsLocation && (
          <>
            <span className="sr-only">Location required</span>
            <span aria-hidden="true" className="text-xs text-ink-meta">
              📍
            </span>
          </>
        )}
      </button>
    </li>
  );
}
