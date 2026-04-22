import type { Jurisdiction } from '../types';

/**
 * "What's being built" — projects, hearings, bond work, metro-district filings,
 * annexations. Illustrative-first catalog modeled on the data shapes that live
 * feeds (Capital Improvement Program, Planning hearings calendar, BoCC
 * filings) would provide.
 */

export type ProjectKind =
  | 'capital-improvement'
  | 'bond-project'
  | 'public-hearing'
  | 'metro-district'
  | 'annexation'
  | 'transportation-plan';

export type ProjectStatus =
  | 'upcoming'
  | 'planning'
  | 'design'
  | 'construction'
  | 'under-review'
  | 'completed';

export type ProjectEntryStatus = 'verified' | 'snapshot' | 'illustrative';

export interface Project {
  id: string;
  kind: ProjectKind;
  name: string;
  description: string;
  sponsor: string;
  jurisdiction: Jurisdiction;
  status: ProjectStatus;
  entryStatus: ProjectEntryStatus;
  location?: string; // neighborhood, corridor, or address hint
  timeline?: string; // short phrase like "2026 Q3 – 2027 Q2"
  budget?: string; // "$4.2M" or similar
  fundingSource?: string; // "2C bond", "Parks Sales Tax"
  url?: string;
  hearingDate?: string; // ISO-ish date string for hearings
  asOf?: string;
}

export const projects: Project[] = [
  // ── CITY · Capital Improvement Program (illustrative) ────────────────
  {
    id: 'cip-union-blvd',
    kind: 'capital-improvement',
    name: 'Union Boulevard Corridor Improvements',
    sponsor: 'City Public Works',
    jurisdiction: 'city',
    status: 'construction',
    entryStatus: 'illustrative',
    description:
      'Roadway reconstruction, signal upgrades, and multi-modal improvements along Union Blvd between Austin Bluffs and Maizeland. Expect lane restrictions during active phases.',
    location: 'Union Blvd — Austin Bluffs to Maizeland',
    timeline: '2025 Q2 – 2027 Q1',
    budget: '$18.4M',
    fundingSource: '2C bond + federal match',
    url: 'https://coloradosprings.gov/public-works',
  },
  {
    id: 'cip-city-auditorium',
    kind: 'capital-improvement',
    name: 'City Auditorium Rehabilitation',
    sponsor: 'City Cultural Services',
    jurisdiction: 'city',
    status: 'design',
    entryStatus: 'illustrative',
    description:
      'Preservation-focused rehabilitation of the 1923 City Auditorium — structural, HVAC, accessibility upgrades.',
    location: '221 E Kiowa St',
    timeline: '2026 Q3 – 2028 Q1',
    budget: '$12M',
    fundingSource: 'Lodgers & Auto Rental Tax + private match',
  },
  {
    id: 'cip-park-amenity-refresh',
    kind: 'capital-improvement',
    name: 'Neighborhood Park Amenity Refresh (multi-site)',
    sponsor: 'City Parks',
    jurisdiction: 'city',
    status: 'construction',
    entryStatus: 'illustrative',
    description:
      'Playground replacement, restroom upgrades, and accessibility retrofits across 6 neighborhood parks on a rolling schedule.',
    location: 'Citywide — 6 parks',
    timeline: '2026 through 2027',
    budget: '$4.2M',
    fundingSource: 'Parks Sales Tax (TOPS)',
    url: 'https://parks.coloradosprings.gov',
  },

  // ── CITY · Bond projects ─────────────────────────────────────────────
  {
    id: 'bond-2c-roads',
    kind: 'bond-project',
    name: '2C Roads Program (2026–2030)',
    sponsor: 'City Public Works',
    jurisdiction: 'city',
    status: 'construction',
    entryStatus: 'snapshot',
    description:
      'Voter-approved sales-tax extension funding accelerated road reconstruction. Current cycle covers ~60 centerline miles of repaving plus targeted reconstruction corridors.',
    timeline: '2026 – 2030',
    budget: '$568M (5-year program)',
    fundingSource: '2C sales tax (extended by voters)',
    url: 'https://coloradosprings.gov/2c',
  },
  {
    id: 'bond-stormwater-program',
    kind: 'bond-project',
    name: 'Stormwater Capital Program',
    sponsor: 'Stormwater Enterprise',
    jurisdiction: 'city',
    status: 'construction',
    entryStatus: 'illustrative',
    description:
      'Rolling capital program for stormwater infrastructure — channel restoration, detention, outfall repair — driven by the IGA with Pueblo County.',
    timeline: 'Rolling',
    budget: '$460M+ (2016–2035 commitment)',
    fundingSource: 'Stormwater Enterprise fee',
    url: 'https://coloradosprings.gov/stormwater-enterprise',
  },

  // ── CITY · Public hearings (illustrative calendar) ───────────────────
  {
    id: 'hearing-downtown-rezone',
    kind: 'public-hearing',
    name: 'Downtown rezoning — 400 block of Nevada',
    sponsor: 'City Planning Commission',
    jurisdiction: 'city',
    status: 'upcoming',
    entryStatus: 'illustrative',
    description:
      'Proposed rezoning from MX-M to MX-L to allow a 12-story mixed-use building. Neighborhood input period runs 30 days.',
    location: 'Downtown — 400 block N Nevada',
    hearingDate: 'Upcoming — check Planning Commission calendar',
    url: 'https://coloradosprings.gov/planning-and-development',
  },
  {
    id: 'hearing-eastside-annexation',
    kind: 'annexation',
    name: 'Eastside annexation — Peyton area',
    sponsor: 'City Council',
    jurisdiction: 'city',
    status: 'under-review',
    entryStatus: 'illustrative',
    description:
      'Proposed annexation of ~140 unincorporated acres into the City. Will trigger utility service extension and rezoning. Council vote after Planning Commission review.',
    location: 'East Colorado Springs — unincorporated boundary',
    hearingDate: 'Upcoming — City Council',
  },
  {
    id: 'hearing-variance-hillside',
    kind: 'public-hearing',
    name: 'Variance request — hillside setback',
    sponsor: 'Board of Zoning Appeals',
    jurisdiction: 'city',
    status: 'upcoming',
    entryStatus: 'illustrative',
    description:
      'Homeowner variance request to reduce hillside overlay setback by 8 feet. Neighborhood comment accepted at hearing.',
    hearingDate: 'Upcoming — check BZA calendar',
    url: 'https://coloradosprings.gov/planning-and-development',
  },

  // ── COUNTY ──────────────────────────────────────────────────────────
  {
    id: 'county-powers-extension',
    kind: 'capital-improvement',
    name: 'Powers Blvd Extension (Pikes Peak RTA)',
    sponsor: 'Pikes Peak Rural Transportation Authority',
    jurisdiction: 'regional',
    status: 'planning',
    entryStatus: 'illustrative',
    description:
      'Long-planned northern extension of Powers Blvd from Voyager to I-25. Environmental clearance and design coordination ongoing.',
    location: 'Powers Blvd — Voyager to I-25',
    timeline: '2026 – 2030+',
    fundingSource: 'PPRTA + state + federal',
    url: 'https://www.ppacg.org',
  },
  {
    id: 'county-judicial-center',
    kind: 'capital-improvement',
    name: 'El Paso County Judicial Center expansion',
    sponsor: 'El Paso County',
    jurisdiction: 'county',
    status: 'design',
    entryStatus: 'illustrative',
    description:
      'Expansion of courtrooms, security infrastructure, and pretrial services space to meet 4th Judicial District demand.',
    location: '270 S Tejon St',
    timeline: '2026 Q4 – 2028',
    budget: 'TBD',
  },

  // ── Metro district filings (illustrative) ───────────────────────────
  {
    id: 'metro-district-cresthill',
    kind: 'metro-district',
    name: 'Cresthill Metro District — formation filing',
    sponsor: 'Developer (via El Paso County)',
    jurisdiction: 'special-district',
    status: 'under-review',
    entryStatus: 'illustrative',
    description:
      'Proposed metro district for a new subdivision north of Powers. Tile flags the filing so residents can review service plans before BoCC review.',
    location: 'Northeast unincorporated',
    url: '/microsites/shared/epc_district_audit_dashboard.html',
    hearingDate: 'Upcoming — BoCC review',
  },
  {
    id: 'metro-district-woodmen-hills',
    kind: 'metro-district',
    name: 'Woodmen Hills — service-plan modification',
    sponsor: 'El Paso County',
    jurisdiction: 'special-district',
    status: 'under-review',
    entryStatus: 'illustrative',
    description:
      'Amendment to an existing metro-district service plan. Audit dashboard surfaces material changes.',
    url: '/microsites/shared/epc_district_audit_dashboard.html',
  },

  // ── State / regional transportation planning ────────────────────────
  {
    id: 'cdot-i25-gap',
    kind: 'transportation-plan',
    name: 'I-25 South Gap corridor (continued phases)',
    sponsor: 'Colorado Department of Transportation',
    jurisdiction: 'state',
    status: 'construction',
    entryStatus: 'snapshot',
    description:
      'Ongoing CDOT corridor improvements on I-25 between Monument and Castle Rock — the route most Colorado Springs commuters take north.',
    location: 'I-25 — Monument to Castle Rock',
    url: 'https://www.codot.gov',
  },
  {
    id: 'cdot-regional-plan',
    kind: 'transportation-plan',
    name: 'Regional Transportation Plan — public input',
    sponsor: 'Pikes Peak Area Council of Governments (PPACG)',
    jurisdiction: 'regional',
    status: 'upcoming',
    entryStatus: 'illustrative',
    description:
      'Multi-year regional plan coordinating highway, transit, bike, and pedestrian investment across the Pikes Peak region. Open comment windows scheduled ahead of adoption.',
    url: 'https://www.ppacg.org',
  },
];

export const KIND_LABELS: Record<ProjectKind, string> = {
  'capital-improvement': 'Capital Improvement',
  'bond-project': 'Bond project',
  'public-hearing': 'Public hearing',
  'metro-district': 'Metro district filing',
  annexation: 'Annexation',
  'transportation-plan': 'Transportation plan',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  upcoming: 'Upcoming',
  planning: 'Planning',
  design: 'Design',
  construction: 'Construction',
  'under-review': 'Under review',
  completed: 'Completed',
};

export const ENTRY_STATUS_LABELS: Record<ProjectEntryStatus, string> = {
  verified: 'Verified',
  snapshot: 'Snapshot',
  illustrative: 'Prototype value',
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-900 border-blue-300',
  planning: 'bg-slate-100 text-slate-900 border-slate-300',
  design: 'bg-purple-100 text-purple-900 border-purple-300',
  construction: 'bg-amber-100 text-amber-900 border-amber-300',
  'under-review': 'bg-teal-100 text-teal-900 border-teal-300',
  completed: 'bg-green-100 text-green-900 border-green-300',
};
