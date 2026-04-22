import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

export type Mode =
  | 'do'
  | 'involved'
  | 'now'
  | 'built'
  | 'performance'
  | 'notifications'
  | 'about';

export const MODE_LABELS: Record<Mode, { label: string; hint: string }> = {
  do: { label: 'Do something', hint: 'File, request, contact' },
  involved: { label: 'Get involved', hint: 'Volunteer, serve, help' },
  now: { label: 'Right now', hint: 'Live alerts & status' },
  built: { label: "What's being built", hint: 'Projects & hearings' },
  performance: { label: "How we're doing", hint: 'Receipts & response times' },
  notifications: { label: 'Notifications', hint: 'Manage your subscriptions' },
  about: { label: 'About', hint: 'City, Council, Mayor' },
};

export const MODES: Mode[] = [
  'do',
  'involved',
  'now',
  'built',
  'performance',
  'notifications',
  'about',
];

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeBar({ mode, onChange }: Props) {
  const refs = useRef<Record<Mode, HTMLAnchorElement | null>>({
    do: null,
    involved: null,
    now: null,
    built: null,
    performance: null,
    notifications: null,
    about: null,
  });

  function onKeyDown(e: KeyboardEvent<HTMLAnchorElement>) {
    const idx = MODES.indexOf(mode);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % MODES.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + MODES.length) % MODES.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = MODES.length - 1;
    else return;
    e.preventDefault();
    onChange(MODES[next]);
    refs.current[MODES[next]]?.focus();
  }

  return (
    <nav
      aria-label="Portal sections"
      className="border-b border-slate-300 bg-white"
    >
      <ul role="list" className="flex flex-wrap gap-0">
        {MODES.map((m) => {
          const selected = mode === m;
          const label = MODE_LABELS[m];
          return (
            <li key={m} className="flex-1 min-w-36">
              <a
                ref={(el) => {
                  refs.current[m] = el;
                }}
                href={`?mode=${m}`}
                aria-current={selected ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(m);
                }}
                onKeyDown={onKeyDown}
                tabIndex={selected ? 0 : -1}
                className={[
                  'block px-4 py-3 text-sm border-b-2 -mb-px min-h-11',
                  selected
                    ? 'border-blue-700 bg-blue-50 text-blue-900 font-semibold'
                    : 'border-transparent text-slate-800 hover:bg-slate-50 hover:border-slate-400',
                ].join(' ')}
              >
                <span className="block">{label.label}</span>
                <span className="block text-xs font-normal text-slate-600">
                  {label.hint}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
