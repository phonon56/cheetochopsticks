import { useRef, useState, type KeyboardEvent } from 'react';
import { PlainLanguageSearch } from './PlainLanguageSearch';
import { ByIntentBrowse } from './ByIntentBrowse';
import { ByOfficeBrowse } from './ByOfficeBrowse';
import { JourneysBrowse } from './JourneysBrowse';

interface Props {
  onPickTopic: (topicId: string) => void;
}

type TabId = 'ask' | 'intent' | 'office' | 'journeys';

const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: 'ask', label: 'Ask', hint: "Describe it in your own words" },
  { id: 'intent', label: 'By intent', hint: 'Report, permit, records, contact' },
  { id: 'office', label: 'By office', hint: 'Browse all 12 departments' },
  { id: 'journeys', label: 'Journeys', hint: 'Multi-step scenarios' },
];

export function HomeTabs({ onPickTopic }: Props) {
  const [active, setActive] = useState<TabId>('ask');
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    ask: null,
    intent: null,
    office: null,
    journeys: null,
  });

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const idx = TABS.findIndex((t) => t.id === active);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    const tab = TABS[next];
    setActive(tab.id);
    tabRefs.current[tab.id]?.focus();
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="How to find what you need"
        className="flex flex-wrap gap-1 border-b border-line"
      >
        {TABS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={onKeyDown}
              className={[
                'inline-flex flex-col items-start gap-0 px-4 py-3 text-sm border-b-2 -mb-px min-h-11',
                selected
                  ? 'border-brand-ink text-brand-ink font-semibold'
                  : 'border-transparent text-ink-strong hover:text-brand-ink hover:border-line-stronger',
              ].join(' ')}
            >
              <span>{t.label}</span>
              <span className="text-xs font-normal text-ink-meta">{t.hint}</span>
            </button>
          );
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="focus:outline-none"
        >
          {t.id === 'ask' && <PlainLanguageSearch onPickTopic={onPickTopic} />}
          {t.id === 'intent' && <ByIntentBrowse onPickTopic={onPickTopic} />}
          {t.id === 'office' && <ByOfficeBrowse onPickTopic={onPickTopic} />}
          {t.id === 'journeys' && <JourneysBrowse onPickTopic={onPickTopic} />}
        </div>
      ))}
    </div>
  );
}
