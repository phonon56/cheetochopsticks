import { useMemo, useState } from 'react';
import {
  opportunities,
  SKILL_LABELS,
  INTEREST_LABELS,
  AUDIENCE_LABELS,
  COMMITMENT_LABELS,
  COMPENSATION_LABELS,
} from '../data/opportunities';
import { JurisdictionTag } from './JurisdictionTag';
import type {
  Audience,
  Interest,
  Opportunity,
  Skill,
} from '../types';

type HoursBand = 'any' | 'light' | 'medium' | 'deep';
const HOURS_BANDS: Record<HoursBand, { label: string; max?: number; min?: number }> = {
  any: { label: 'Any amount of time' },
  light: { label: '≤ 20 hr/year (light)', max: 20 },
  medium: { label: '20–60 hr/year (regular)', min: 20, max: 60 },
  deep: { label: '60+ hr/year (deep commitment)', min: 60 },
};

function scoreOpportunity(
  opp: Opportunity,
  picked: {
    skills: Set<Skill>;
    interests: Set<Interest>;
    audiences: Set<Audience>;
  },
): number {
  let score = 0;
  for (const s of opp.skills) if (picked.skills.has(s)) score += 2;
  for (const i of opp.interests) if (picked.interests.has(i)) score += 2;
  for (const a of opp.audiences) if (picked.audiences.has(a)) score += 3;
  // No-experience-needed gets a small universal boost when user didn't pick any skill
  if (picked.skills.size === 0 && opp.skills.includes('no-experience-needed')) score += 1;
  return score;
}

export function GetInvolved() {
  const [skills, setSkills] = useState<Set<Skill>>(new Set());
  const [interests, setInterests] = useState<Set<Interest>>(new Set());
  const [audiences, setAudiences] = useState<Set<Audience>>(new Set());
  const [hoursBand, setHoursBand] = useState<HoursBand>('any');

  const filtered = useMemo(() => {
    const band = HOURS_BANDS[hoursBand];
    const picked = { skills, interests, audiences };
    const list = opportunities
      .filter((o) => {
        if (band.min !== undefined && o.hoursPerYear.max < band.min) return false;
        if (band.max !== undefined && o.hoursPerYear.min > band.max) return false;
        return true;
      })
      .map((o) => ({ o, score: scoreOpportunity(o, picked) }));

    // If user hasn't picked anything, show everything in natural order (no zero-score filter).
    const anyPicked = skills.size + interests.size + audiences.size > 0;
    const shown = anyPicked ? list.filter((x) => x.score > 0) : list;
    shown.sort((a, b) => b.score - a.score || a.o.hoursPerYear.min - b.o.hoursPerYear.min);
    return shown;
  }, [skills, interests, audiences, hoursBand]);

  return (
    <section aria-labelledby="involved-heading" className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 id="involved-heading" className="text-3xl font-semibold text-ink">
          How can you help?
        </h1>
        <p className="text-ink-secondary">
          A single place to find city, county, regional, state, tribal, and
          special-district opportunities. Paid and unpaid, one-time and lifelong. New to
          civics, transitioning out of the military, new to Colorado Springs, or just
          looking to plug in — pick what's true for you.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FilterGroup
          heading="What are you good at?"
          hint="Pick any — or skip if you want no-experience options."
          labels={SKILL_LABELS as Record<string, string>}
          selected={skills as Set<string>}
          onToggle={(k) => {
            const next = new Set(skills);
            if (next.has(k as Skill)) next.delete(k as Skill);
            else next.add(k as Skill);
            setSkills(next);
          }}
        />
        <FilterGroup
          heading="What do you care about?"
          hint="Environment, youth, animals, housing, history…"
          labels={INTEREST_LABELS as Record<string, string>}
          selected={interests as Set<string>}
          onToggle={(k) => {
            const next = new Set(interests);
            if (next.has(k as Interest)) next.delete(k as Interest);
            else next.add(k as Interest);
            setInterests(next);
          }}
        />
        <FilterGroup
          heading="What's true for you?"
          hint="Optional context that helps us match you well."
          labels={AUDIENCE_LABELS as Record<string, string>}
          selected={audiences as Set<string>}
          onToggle={(k) => {
            const next = new Set(audiences);
            if (next.has(k as Audience)) next.delete(k as Audience);
            else next.add(k as Audience);
            setAudiences(next);
          }}
        />
        <fieldset>
          <legend className="text-sm font-medium text-ink mb-2">
            How much time do you have?
          </legend>
          <ul role="list" className="space-y-1">
            {(Object.keys(HOURS_BANDS) as HoursBand[]).map((b) => (
              <li key={b}>
                <label className="flex items-center gap-2 text-sm text-ink-strong min-h-8">
                  <input
                    type="radio"
                    name="hours-band"
                    value={b}
                    checked={hoursBand === b}
                    onChange={() => setHoursBand(b)}
                    className="h-4 w-4"
                  />
                  {HOURS_BANDS[b].label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>

      <div role="status" aria-live="polite" className="text-sm text-ink-secondary">
        {filtered.length === 0
          ? 'No matches with those filters. Loosen one and try again.'
          : `${filtered.length} opportunit${filtered.length === 1 ? 'y' : 'ies'} match.`}
      </div>

      <ul role="list" className="space-y-3">
        {filtered.map(({ o }) => (
          <OpportunityCard key={o.id} opp={o} />
        ))}
      </ul>

      <NotifySignup
        filterSummary={{
          skills: [...skills],
          interests: [...interests],
          audiences: [...audiences],
          hoursBand,
        }}
      />
    </section>
  );
}

function FilterGroup({
  heading,
  hint,
  labels,
  selected,
  onToggle,
}: {
  heading: string;
  hint?: string;
  labels: Record<string, string>;
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{heading}</legend>
      {hint && <p className="text-xs text-ink-meta mt-0.5 mb-2">{hint}</p>}
      <ul role="list" className="flex flex-wrap gap-1.5">
        {Object.entries(labels).map(([k, lbl]) => {
          const active = selected.has(k);
          return (
            <li key={k}>
              <button
                type="button"
                onClick={() => onToggle(k)}
                aria-pressed={active}
                className={[
                  'rounded-full border px-3 py-1 text-xs min-h-8',
                  active
                    ? 'border-brand-hover bg-brand-hover text-white font-medium'
                    : 'border-line-strong bg-surface text-ink-strong hover:bg-surface-muted',
                ].join(' ')}
              >
                {lbl}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">{opp.name}</h3>
          <p className="text-xs text-ink-secondary mt-0.5">{opp.sponsor}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <JurisdictionTag jurisdiction={opp.jurisdiction} />
          <span className="rounded-full border border-line-strong bg-surface-muted px-2 py-0.5 text-xs text-ink-strong">
            {opp.hoursPerYear.min}
            {opp.hoursPerYear.max > opp.hoursPerYear.min ? `–${opp.hoursPerYear.max}` : ''}{' '}
            hr/yr
          </span>
          <span className="rounded-full border border-line-strong bg-surface-muted px-2 py-0.5 text-xs text-ink-strong">
            {COMMITMENT_LABELS[opp.commitment]}
          </span>
          <span
            className={[
              'rounded-full border px-2 py-0.5 text-xs',
              opp.compensation === 'unpaid'
                ? 'border-line-strong bg-surface-muted text-ink-strong'
                : 'border-success bg-success-surface text-success-ink font-medium',
            ].join(' ')}
          >
            {COMPENSATION_LABELS[opp.compensation]}
          </span>
        </div>
      </div>
      <p className="text-sm text-ink-strong">{opp.description}</p>
      {opp.audiences.length > 0 && (
        <p className="text-xs text-ink-meta">
          Good fit for:{' '}
          {opp.audiences.map((a) => AUDIENCE_LABELS[a]).join(' · ')}
        </p>
      )}
      {opp.applyWindow && (
        <p className="text-xs text-ink-meta">
          <span className="font-medium text-ink-strong">When:</span> {opp.applyWindow}
        </p>
      )}
      <div>
        <a
          href={opp.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-brand-hover px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark min-h-8"
        >
          Learn more / apply <span aria-hidden="true">↗</span>
        </a>
      </div>
    </li>
  );
}

function NotifySignup({
  filterSummary,
}: {
  filterSummary: {
    skills: Skill[];
    interests: Interest[];
    audiences: Audience[];
    hoursBand: HoursBand;
  };
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const existing = safeParse(localStorage.getItem('cos-notify-subscriptions'));
    existing.push({
      email,
      filters: filterSummary,
      savedAt: new Date().toISOString(),
    });
    try {
      localStorage.setItem('cos-notify-subscriptions', JSON.stringify(existing));
    } catch {
      /* storage quota — ignore in prototype */
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-success bg-success-surface p-4"
      >
        <p className="text-sm font-semibold text-success-ink">Got it.</p>
        <p className="text-sm text-success-ink mt-1">
          We saved your preferences locally (prototype). In production, {email} would be
          added to a City notification list and emailed when new opportunities match
          your filters.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-line-strong bg-surface-muted p-4 space-y-2"
    >
      <p className="text-sm font-semibold text-ink">
        Want to hear when new opportunities match?
      </p>
      <p className="text-xs text-ink-secondary">
        Save your current filters and leave an email. You'll be notified when new
        matching opportunities are added.
      </p>
      <div className="flex flex-wrap gap-2">
        <label htmlFor="notify-email" className="sr-only">
          Email address
        </label>
        <input
          id="notify-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 min-w-48 rounded-md border border-line-stronger px-3 py-2 text-sm focus:border-brand-ink min-h-11"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-hover px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark min-h-11"
        >
          Notify me
        </button>
      </div>
      <p className="text-xs text-ink-meta">
        Prototype — nothing is actually sent. We save your filters to browser storage
        so the behavior is visible.
      </p>
    </form>
  );
}

function safeParse(raw: string | null): Array<unknown> {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
