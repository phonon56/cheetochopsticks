import { useMemo, useState, type ReactNode } from 'react';
import {
  RESOURCES,
  NEED_CHIPS,
  CAT_COLOR,
  ALL_CATEGORIES,
  expandQuery,
  scoreMatch,
  type Resource,
} from '../data/helpingHands';

interface Props {
  onPickMode?: (mode: 'involved') => void;
}

type ViewMode = 'cards' | 'rows';
type SpeedFilter = '' | '3' | '4' | '5';

const STORAGE_KEY = 'gogov-help-view';

function loadView(): ViewMode {
  if (typeof window === 'undefined') return 'cards';
  const s = window.localStorage.getItem(STORAGE_KEY);
  return s === 'rows' ? 'rows' : 'cards';
}

function dotString(s: number): string {
  return '●'.repeat(s) + '○'.repeat(5 - s);
}

function catColor(c: string): string {
  return CAT_COLOR[c] ?? '#8a7d68';
}

export function GetHelp({ onPickMode }: Props) {
  const [need, setNeed] = useState('');
  const [category, setCategory] = useState<string>('');
  const [minSpeed, setMinSpeed] = useState<SpeedFilter>('');
  const [view, setViewState] = useState<ViewMode>(() => loadView());

  function setView(v: ViewMode) {
    setViewState(v);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, v);
      } catch {
        /* ignore */
      }
    }
  }

  const { list, usingNeed } = useMemo(() => {
    let out = RESOURCES.slice();
    let usingNeed = false;
    if (need.trim()) {
      const tokens = expandQuery(need);
      const scored = out
        .map((r) => ({ r, score: scoreMatch(r, tokens) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      out = scored.map((x) => x.r);
      usingNeed = scored.length > 0;
      if (!usingNeed) out = [];
    }
    if (category) out = out.filter((r) => r.c.includes(category));
    if (minSpeed) out = out.filter((r) => r.s >= Number(minSpeed));
    if (!usingNeed) {
      out.sort((a, b) => b.s - a.s || a.n.localeCompare(b.n));
    }
    return { list: out, usingNeed };
  }, [need, category, minSpeed]);

  const showClear = Boolean(need || category || minSpeed);

  function clearAll() {
    setNeed('');
    setCategory('');
    setMinSpeed('');
  }

  return (
    <section aria-labelledby="help-heading" className="space-y-6 max-w-4xl">
      <EmergencyBanner />

      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink mb-1">
          <span aria-hidden="true" className="inline-flex gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#c61f6e' }} />
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#0074c8' }} />
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#00943a' }} />
          </span>
          Get help
        </p>
        <h1
          id="help-heading"
          tabIndex={-1}
          className="font-serif text-[2.4rem] leading-[1.1] font-semibold tracking-tight text-ink focus:outline-none"
        >
          What do you really need?
        </h1>
        <p id="help-lede" className="text-[16px] text-ink-secondary leading-relaxed max-w-2xl">
          Tell us what's going on in plain English — we'll find the right help, fastest first.
          Directory of {RESOURCES.length} local and national resources.
        </p>
      </div>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="rounded-2xl border border-line bg-surface shadow-sm p-6 md:p-7 space-y-4"
        aria-label="Find help by need"
      >
        <div>
          <label htmlFor="help-need" className="block text-sm font-semibold text-ink mb-1.5">
            Describe what you need
          </label>
          <input
            id="help-need"
            type="text"
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            aria-describedby="help-lede"
            placeholder="e.g. “my kids are hungry”, “I need a place to sleep”"
            className="w-full rounded-lg border border-line-stronger bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-meta focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none min-h-11"
          />
        </div>

        <ul role="list" className="flex flex-wrap gap-2" aria-label="Common needs">
          {NEED_CHIPS.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => setNeed(c)}
                className="rounded-full border border-line-stronger bg-surface px-3.5 py-2 text-sm text-ink-strong hover:border-brand-ink hover:text-brand-ink min-h-11 transition-colors"
              >
                {c}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="help-cat" className="sr-only">
            Filter by category
          </label>
          <select
            id="help-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-line-stronger bg-surface px-3 py-2.5 text-sm focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none min-h-11"
          >
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label htmlFor="help-speed" className="sr-only">
            Filter by speed of help
          </label>
          <select
            id="help-speed"
            value={minSpeed}
            onChange={(e) => setMinSpeed(e.target.value as SpeedFilter)}
            className="rounded-lg border border-line-stronger bg-surface px-3 py-2.5 text-sm focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none min-h-11"
          >
            <option value="">Any speed</option>
            <option value="5">{dotString(5)} 24/7</option>
            <option value="4">{dotString(4)}+ walk-in</option>
            <option value="3">{dotString(3)}+ phone</option>
          </select>
          {showClear && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-line-stronger bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink-strong hover:bg-surface-muted min-h-11"
            >
              Clear
            </button>
          )}
          <span className="flex-1" />
          <ViewToggle view={view} onChange={setView} />
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line border-l-4 border-l-info bg-surface p-4 shadow-sm">
        <p className="text-sm text-ink-secondary">
          Want to help others instead of getting help?
        </p>
        <button
          type="button"
          onClick={() => onPickMode?.('involved')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-stronger bg-surface px-3.5 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-ink hover:border-brand-ink hover:text-white min-h-11 transition-colors"
        >
          Volunteer instead <span aria-hidden="true">→</span>
        </button>
      </div>

      <p id="help-count" aria-live="polite" className="text-sm text-ink-secondary">
        {list.length} resource{list.length === 1 ? '' : 's'}
        {usingNeed ? ' — fastest help first' : ''}.
      </p>

      <ResourceGrid list={list} view={view} />

      {list.length > 80 && (
        <p className="text-xs text-ink-meta">
          Showing 80 of {list.length} — narrow with a category or speed.
        </p>
      )}

      <DataDisclosure />
    </section>
  );
}

function EmergencyBanner() {
  return (
    <div
      role="region"
      aria-label="Emergency and crisis lines"
      className="rounded-xl border border-line border-l-4 border-l-danger bg-danger-surface p-4 shadow-sm text-sm text-danger-ink"
    >
      <p className="font-semibold mb-1">
        <span aria-hidden="true" className="mr-1.5">⚠</span>
        Immediate danger or crisis?
      </p>
      <p className="text-danger-ink/90 leading-relaxed">
        Call <BannerLink href="tel:911" label="911" /> for life-threatening emergencies.
        Suicide or mental-health crisis: <BannerLink href="tel:988" label="988" />.
        To find any help, dial <BannerLink href="tel:211" label="211" />.
        Domestic violence: <BannerLink href="tel:7196333819" label="TESSA 719-633-3819" />.
      </p>
    </div>
  );
}

function BannerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="font-semibold text-danger-ink underline underline-offset-2 decoration-2"
    >
      {label}
    </a>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const options: Array<{ id: ViewMode; label: string; icon: ReactNode }> = [
    { id: 'cards', label: 'Cards', icon: <CardsIcon /> },
    { id: 'rows', label: 'Rows', icon: <RowsIcon /> },
  ];
  return (
    <div role="group" aria-label="Display style" className="inline-flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = view === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold min-h-11 transition-colors',
              active
                ? 'border-brand-ink bg-brand-surface text-brand-ink'
                : 'border-line-stronger bg-surface text-ink-strong hover:border-brand-ink hover:text-brand-ink',
            ].join(' ')}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CardsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.75" y="1.75" width="5" height="5" rx="1" />
      <rect x="9.25" y="1.75" width="5" height="5" rx="1" />
      <rect x="1.75" y="9.25" width="5" height="5" rx="1" />
      <rect x="9.25" y="9.25" width="5" height="5" rx="1" />
    </svg>
  );
}

function RowsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="3" cy="4" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="3" cy="8" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="0.85" fill="currentColor" stroke="none" />
      <path d="M6.25 4h7.5M6.25 8h7.5M6.25 12h7.5" />
    </svg>
  );
}

function ResourceGrid({ list, view }: { list: Resource[]; view: ViewMode }) {
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-secondary shadow-sm">
        Nothing matched. Try a different word, clear filters, or call{' '}
        <a href="tel:211" className="text-brand-ink font-semibold underline underline-offset-2">
          211
        </a>{' '}
        — they will help you find help.
      </div>
    );
  }
  const items = list.slice(0, 80);
  if (view === 'rows') {
    return (
      <ul role="list" className="space-y-2">
        {items.map((r, i) => (
          <ResourceRow key={`${r.n}-${i}`} r={r} />
        ))}
      </ul>
    );
  }
  return (
    <ul
      role="list"
      className="grid gap-4 sm:grid-cols-2"
    >
      {items.map((r, i) => (
        <ResourceCard key={`${r.n}-${i}`} r={r} />
      ))}
    </ul>
  );
}

function ResourceCard({ r }: { r: Resource }) {
  const primaryCat = r.c[0] ?? '';
  return (
    <li className="rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md p-4 space-y-2">
      <ResourceHead r={r} primaryCat={primaryCat} />
      <h3 className="font-semibold text-ink text-base">{r.n}</h3>
      <p className="text-sm text-ink-secondary leading-relaxed">{r.d}</p>
      <ResourceFields r={r} />
      {r.a && <p className="text-xs text-ink-meta">{r.a}</p>}
      <ResourceCats cats={r.c} />
    </li>
  );
}

function ResourceRow({ r }: { r: Resource }) {
  const primaryCat = r.c[0] ?? '';
  return (
    <li className="rounded-xl border border-line bg-surface shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4">
      <ResourceHead r={r} primaryCat={primaryCat} />
      <h3 className="font-semibold text-ink mt-1">{r.n}</h3>
      <p className="text-sm text-ink-secondary mt-0.5">{r.d}</p>
      <ResourceFields r={r} />
    </li>
  );
}

function ResourceHead({ r, primaryCat }: { r: Resource; primaryCat: string }) {
  const speedTone =
    r.s >= 4 ? 'text-success-ink' : r.s >= 3 ? 'text-ink-strong' : 'text-ink-meta';
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: catColor(primaryCat) }}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-meta">
          {primaryCat}
        </span>
        {r.tf && (
          <span
            className="rounded-full border border-danger bg-danger-surface text-danger-ink text-xs font-semibold px-2 py-0.5"
            aria-label="Open 24/7"
          >
            24/7
          </span>
        )}
        {r.v === false && (
          <span
            title="Listing not yet verified — please confirm details when you call"
            className="rounded-full border border-warning bg-warning-surface text-warning-ink text-xs font-semibold px-2 py-0.5"
          >
            Unverified
          </span>
        )}
      </div>
      <span
        className={`font-mono text-xs whitespace-nowrap ${speedTone}`}
        aria-label={`Speed of help: ${r.s} of 5`}
      >
        {dotString(r.s)}
      </span>
    </div>
  );
}

function ResourceFields({ r }: { r: Resource }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-2">
      {r.p && (
        <a
          href={`tel:${r.p.replace(/[^0-9]/g, '')}`}
          className="font-semibold text-brand-ink underline underline-offset-2"
        >
          {r.p}
        </a>
      )}
      {r.p2 && (
        <a
          href={`tel:${r.p2.replace(/[^0-9]/g, '')}`}
          className="text-brand-ink underline underline-offset-2"
        >
          {r.p2}
        </a>
      )}
      {r.w && (
        <a
          href={r.w}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-ink underline underline-offset-2"
        >
          Website <span aria-hidden="true">↗</span>
        </a>
      )}
      {r.h && <span className="text-ink-meta">{r.h}</span>}
    </div>
  );
}

function ResourceCats({ cats }: { cats: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {cats.map((c) => (
        <span
          key={c}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-2 py-0.5 text-xs text-ink-secondary"
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: catColor(c) }}
          />
          {c}
        </span>
      ))}
    </div>
  );
}

function DataDisclosure() {
  return (
    <details className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-secondary shadow-sm">
      <summary className="cursor-pointer font-semibold text-ink">
        About this directory
      </summary>
      <p className="mt-2 leading-relaxed">
        Sourced from the City of Colorado Springs Helping Hands Directory plus a curated set
        of national hotlines. Resources marked <strong>Unverified</strong> are pending phone
        confirmation — call before relying on hours and eligibility. For any need we don't
        cover, dial <a href="tel:211" className="text-brand-ink font-semibold underline underline-offset-2">211</a> — they will route you.
      </p>
    </details>
  );
}
