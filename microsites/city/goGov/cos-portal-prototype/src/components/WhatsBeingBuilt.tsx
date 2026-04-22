import { useMemo, useState } from 'react';
import {
  ENTRY_STATUS_LABELS,
  KIND_LABELS,
  projects,
  STATUS_COLORS,
  STATUS_LABELS,
  type Project,
  type ProjectEntryStatus,
  type ProjectKind,
  type ProjectStatus,
} from '../data/whatsBeingBuilt';
import { JURISDICTION_SHORT } from '../data/facets';
import type { Jurisdiction } from '../types';

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

const ENTRY_STATUS_COLORS: Record<ProjectEntryStatus, string> = {
  verified: 'bg-green-100 text-green-900 border-green-300',
  snapshot: 'bg-blue-100 text-blue-900 border-blue-300',
  illustrative: 'bg-amber-100 text-amber-900 border-amber-300',
};

export function WhatsBeingBuilt() {
  const [kindFilter, setKindFilter] = useState<ProjectKind | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const kinds = useMemo(
    () => Array.from(new Set(projects.map((p) => p.kind))),
    [],
  );
  const statuses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status))),
    [],
  );

  const filtered = projects.filter(
    (p) =>
      (kindFilter === 'all' || p.kind === kindFilter) &&
      (statusFilter === 'all' || p.status === statusFilter),
  );

  return (
    <section aria-labelledby="wbb-heading" className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-600">Future state</p>
        <h1 id="wbb-heading" className="text-3xl font-semibold text-slate-900">
          What's being built.
        </h1>
        <p className="text-slate-700">
          Capital projects, bond programs, public hearings, metro-district filings, and
          annexations that will shape the region. Most entries today are prototype values
          showing the data shape a production build would pull from Capital Improvement
          Program feeds, the Planning hearings calendar, and the Board of County
          Commissioners agenda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium text-slate-900 mb-1">Kind</legend>
          <ul role="list" className="flex flex-wrap gap-1.5">
            <FilterChip
              active={kindFilter === 'all'}
              onClick={() => setKindFilter('all')}
              label={`All (${projects.length})`}
            />
            {kinds.map((k) => (
              <FilterChip
                key={k}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
                label={`${KIND_LABELS[k]} (${projects.filter((p) => p.kind === k).length})`}
              />
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium text-slate-900 mb-1">Status</legend>
          <ul role="list" className="flex flex-wrap gap-1.5">
            <FilterChip
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              label="All statuses"
            />
            {statuses.map((s) => (
              <FilterChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                label={STATUS_LABELS[s]}
              />
            ))}
          </ul>
        </fieldset>
      </div>

      <div role="status" aria-live="polite" className="text-sm text-slate-700">
        Showing {filtered.length} of {projects.length} projects.
      </div>

      <ul role="list" className="space-y-3">
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </ul>

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900 mb-1">Why this page exists</p>
        <p>
          Most residents never see the pipeline of what's coming — roads being rebuilt, metro
          districts being formed, rezonings being approved, annexations being weighed. The
          pipeline exists in 12 different agency calendars and 6 different websites. One
          consolidated view makes meaningful public comment possible.
        </p>
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={[
          'rounded-full border px-3 py-1 text-xs min-h-8',
          active
            ? 'border-blue-700 bg-blue-700 text-white font-medium'
            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        ].join(' ')}
      >
        {label}
      </button>
    </li>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-60">
          <p className="text-xs uppercase tracking-wide text-slate-600">
            {KIND_LABELS[project.kind]}
          </p>
          <h2 className="text-base font-semibold text-slate-900 mt-0.5">
            {project.name}
          </h2>
          <p className="text-xs text-slate-700 mt-0.5">{project.sponsor}</p>
        </div>
        <div className="flex flex-wrap gap-1 items-start">
          <span
            className={[
              'rounded-full border px-2 py-0.5 text-xs font-medium',
              STATUS_COLORS[project.status],
            ].join(' ')}
          >
            {STATUS_LABELS[project.status]}
          </span>
          <span
            className={[
              'rounded-full border px-2 py-0.5 text-xs',
              JURISDICTION_COLORS[project.jurisdiction],
            ].join(' ')}
          >
            {JURISDICTION_SHORT[project.jurisdiction]}
          </span>
          <span
            className={[
              'rounded-full border px-2 py-0.5 text-xs',
              ENTRY_STATUS_COLORS[project.entryStatus],
            ].join(' ')}
          >
            {ENTRY_STATUS_LABELS[project.entryStatus]}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-800">{project.description}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-slate-700">
        {project.location && (
          <>
            <dt className="font-medium text-slate-900">Location</dt>
            <dd>{project.location}</dd>
          </>
        )}
        {project.timeline && (
          <>
            <dt className="font-medium text-slate-900">Timeline</dt>
            <dd>{project.timeline}</dd>
          </>
        )}
        {project.hearingDate && (
          <>
            <dt className="font-medium text-slate-900">Hearing</dt>
            <dd>{project.hearingDate}</dd>
          </>
        )}
        {project.budget && (
          <>
            <dt className="font-medium text-slate-900">Budget</dt>
            <dd>{project.budget}</dd>
          </>
        )}
        {project.fundingSource && (
          <>
            <dt className="font-medium text-slate-900">Funding</dt>
            <dd>{project.fundingSource}</dd>
          </>
        )}
      </dl>

      {project.url && (
        <div>
          <a
            href={project.url}
            target={project.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 min-h-8"
          >
            Project page {project.url.startsWith('http') ? <span aria-hidden="true">↗</span> : null}
          </a>
        </div>
      )}
    </li>
  );
}
