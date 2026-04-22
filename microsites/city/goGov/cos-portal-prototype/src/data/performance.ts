/**
 * "How we're doing" — public accountability receipts.
 *
 * This is the CDOT-style Performance surface done native to municipal
 * service. Most civic portals hide these numbers; surfacing them turns the
 * portal into a two-way relationship instead of a one-way inbox.
 *
 * Every receipt carries a `status`:
 *   - 'verified'     — real data from a live source we control or trust.
 *   - 'snapshot'     — real number, but frozen at a point in time.
 *   - 'illustrative' — a placeholder value to model the UI until a live
 *                      feed is wired up. Always shown with a "prototype"
 *                      tag so residents can tell the difference.
 *
 * ── FUTURE STATE ─────────────────────────────────────────────────────────
 * Each receipt should eventually be a live-computed value from:
 *   - the submission database (SLA metrics),
 *   - the CORA log (response times),
 *   - the running axe CI (ADA score),
 *   - departmental dashboards (audits, budget performance).
 * Building the portal as the *measurement instrument itself* means the
 * numbers are defensible because they're produced by the same pipes that
 * accept submissions.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type ReceiptCategory =
  | 'accessibility'
  | 'response-times'
  | 'service-delivery'
  | 'audits-and-reports'
  | 'transparency';

export type ReceiptStatus = 'verified' | 'snapshot' | 'illustrative';

export type ReceiptTrend = 'better' | 'worse' | 'stable' | 'unknown';

export interface Receipt {
  id: string;
  category: ReceiptCategory;
  title: string;
  headline: string; // the big number or short statement
  subhead?: string;
  target?: string; // target or commitment if any
  trend?: ReceiptTrend;
  asOf: string; // e.g. "2026-04-22" or "Q1 2026"
  status: ReceiptStatus;
  source?: { label: string; url: string };
  method?: string; // one-line methodology note
}

export const receipts: Receipt[] = [
  // ── Accessibility ────────────────────────────────────────────────────
  {
    id: 'portal-wcag',
    category: 'accessibility',
    title: 'This portal — WCAG 2.1 AA compliance',
    headline: '0 violations across 10 audited URLs',
    subhead:
      'Automated axe-core audit runs against the welcome page, form variants, destination types, and every mode tab.',
    target: '0 violations, always',
    trend: 'stable',
    asOf: '2026-04-22',
    status: 'verified',
    source: {
      label: 'Audit script (runs in CI)',
      url: 'https://github.com/phonon56/cheetochopsticks/blob/main/microsites/city/goGov/cos-portal-prototype/scripts/axe-audit.mjs',
    },
    method: 'Playwright + @axe-core/playwright at tags wcag2a/wcag2aa/wcag21a/wcag21aa.',
  },
  {
    id: 'gogov-ada-audit',
    category: 'accessibility',
    title: 'Vendor portal (goGov) — ADA audit',
    headline: 'Independent audit published',
    subhead:
      'Full WCAG audit of the current GoOutreach portal used by the City. Findings drove the rebuild prototype you are in.',
    asOf: '2025-Q4',
    status: 'snapshot',
    source: {
      label: 'goGov Accessibility Audit (PDF)',
      url: '/microsites/city/goGov/GOGovAccessibilityAudit.pdf',
    },
    method: 'Manual audit against WCAG 2.1 AA with supporting automated scans.',
  },
  {
    id: 'ada-office-response',
    category: 'accessibility',
    title: 'ADA accommodation requests — response time',
    headline: '≤ 2 business days',
    subhead:
      'Average first-response from the Office of Accessibility to an accommodation request.',
    target: '≤ 2 business days',
    trend: 'stable',
    asOf: 'Illustrative',
    status: 'illustrative',
    source: {
      label: 'Office of Accessibility',
      url: 'https://coloradosprings.gov/accessibility',
    },
    method:
      'Placeholder until the ADA request system exposes a response-time metric.',
  },

  // ── Response times ───────────────────────────────────────────────────
  {
    id: 'cora-response-median',
    category: 'response-times',
    title: 'CORA requests — median response',
    headline: '3 working days',
    subhead:
      'Colorado Open Records Act requires a response within 3 working days; up to 7 additional working days with cause.',
    target: '≤ 3 working days (statutory)',
    trend: 'stable',
    asOf: 'Illustrative — matches statutory commitment',
    status: 'illustrative',
    source: {
      label: 'City Communications — CORA policy',
      url: 'https://coloradosprings.gov/city-communications/page/colorado-open-records-act-cora',
    },
    method:
      'Target is statutory. A live median would pull from the CORA log once exposed as a feed.',
  },
  {
    id: 'cora-fulfillment-rate',
    category: 'response-times',
    title: 'CORA requests — % fulfilled within 3 days',
    headline: '87%',
    subhead:
      'Portion of requests closed (records produced or denial issued) within the 3-working-day window without a 7-day extension.',
    target: '≥ 90%',
    trend: 'better',
    asOf: 'Illustrative',
    status: 'illustrative',
  },
  {
    id: 'ada-parking-enforcement',
    category: 'response-times',
    title: 'Accessible parking enforcement — dispatch time',
    headline: '≤ 45 minutes',
    subhead:
      'Time from a reported accessible-parking violation to an officer arriving on scene (during active enforcement hours).',
    asOf: 'Illustrative',
    status: 'illustrative',
  },

  // ── Service delivery ─────────────────────────────────────────────────
  {
    id: 'pothole-sla',
    category: 'service-delivery',
    title: 'Pothole reports — time to close',
    headline: '14-day median',
    subhead:
      'Median days from report submission to inspection + repair. Public Works publishes targets seasonally.',
    target: '≤ 14 days non-winter; best-effort in winter',
    trend: 'stable',
    asOf: 'Illustrative',
    status: 'illustrative',
    source: {
      label: 'City Public Works',
      url: 'https://coloradosprings.gov/public-works',
    },
  },
  {
    id: 'graffiti-cleanup',
    category: 'service-delivery',
    title: 'Graffiti — time to cleanup',
    headline: '7-day median',
    subhead:
      'Median days from report to removal on City-maintained surfaces.',
    target: '≤ 7 days',
    trend: 'stable',
    asOf: 'Illustrative',
    status: 'illustrative',
  },
  {
    id: 'code-enforcement-first-visit',
    category: 'service-delivery',
    title: 'Code Enforcement — first site visit',
    headline: '5-day median',
    subhead:
      'Days from a Neighborhood Services complaint to initial inspector visit.',
    target: '≤ 5 business days',
    trend: 'stable',
    asOf: 'Illustrative',
    status: 'illustrative',
    source: {
      label: 'Neighborhood Services',
      url: 'https://coloradosprings.gov/neighborhood-services',
    },
  },
  {
    id: 'portal-submissions-week',
    category: 'service-delivery',
    title: 'Portal submissions — last 7 days',
    headline: '0 (prototype)',
    subhead:
      'Total resident submissions through this portal. Will become a real rolling count once backend routing is wired.',
    asOf: '2026-04-22',
    status: 'verified',
    method: 'Measured by the portal itself — zero until backend ships.',
  },

  // ── Audits & reports ─────────────────────────────────────────────────
  {
    id: 'gogov-audit-report',
    category: 'audits-and-reports',
    title: 'goGov Platform Accessibility Audit',
    headline: 'Published — drove this rebuild',
    subhead:
      'Independent audit of the City\'s current service-request portal.',
    asOf: '2025-Q4',
    status: 'snapshot',
    source: {
      label: 'Read the audit (PDF)',
      url: '/microsites/city/goGov/GOGovAccessibilityAudit.pdf',
    },
  },
  {
    id: 'citizen-connect-audit',
    category: 'audits-and-reports',
    title: 'CitizenConnect — ADA technical audit (El Paso County)',
    headline: '1 serious · 3 moderate · 5 minor',
    subhead:
      'Audit of the County resident portal. Paired rebuild proposal published alongside.',
    asOf: '2025-Q4',
    status: 'snapshot',
    source: {
      label: 'Read the report',
      url: '/microsites/county/CitizenConnect/ada_audit_citizenconnect.html',
    },
  },
  {
    id: 'district-audit-dashboard',
    category: 'audits-and-reports',
    title: 'El Paso County — Metro District Audit Dashboard',
    headline: 'Live dashboard',
    subhead:
      'Cross-cutting audit of metro-district compliance across the county. Updated continuously.',
    asOf: 'Rolling',
    status: 'verified',
    source: {
      label: 'Open the dashboard',
      url: '/microsites/shared/epc_district_audit_dashboard.html',
    },
  },

  // ── Transparency ─────────────────────────────────────────────────────
  {
    id: 'city-budget',
    category: 'transparency',
    title: 'City budget',
    headline: 'Adopted annually',
    subhead:
      'Full budget, supplementary appropriations, and historical comparisons published on the City website.',
    asOf: 'Annual',
    status: 'verified',
    source: {
      label: 'coloradosprings.gov/budget',
      url: 'https://coloradosprings.gov/budget',
    },
  },
  {
    id: 'council-meetings',
    category: 'transparency',
    title: 'Council meeting recordings & minutes',
    headline: 'Published every meeting',
    subhead:
      'Live-streamed, with minutes and agendas archived at coloradosprings.gov/council.',
    asOf: 'Every meeting',
    status: 'verified',
    source: {
      label: 'City Council',
      url: 'https://coloradosprings.gov/city-council',
    },
  },
  {
    id: 'boards-applications-pipeline',
    category: 'transparency',
    title: 'Boards & commissions — openings',
    headline: 'Apply anytime',
    subhead:
      'Seat openings published as terms expire. Application goes to all boards simultaneously.',
    asOf: 'Rolling',
    status: 'verified',
    source: {
      label: 'Apply to a board',
      url: 'https://coloradosprings.gov/apply-boards-commissions-committees',
    },
  },
];

export const CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  accessibility: 'Accessibility',
  'response-times': 'Response times',
  'service-delivery': 'Service delivery',
  'audits-and-reports': 'Audits & reports',
  transparency: 'Transparency & open data',
};

export const CATEGORY_ORDER: ReceiptCategory[] = [
  'accessibility',
  'response-times',
  'service-delivery',
  'audits-and-reports',
  'transparency',
];

export const STATUS_LABELS: Record<ReceiptStatus, string> = {
  verified: 'Verified',
  snapshot: 'Snapshot',
  illustrative: 'Prototype value',
};

export const TREND_LABELS: Record<ReceiptTrend, { label: string; sr: string }> = {
  better: { label: '▲', sr: 'improving' },
  worse: { label: '▼', sr: 'getting worse' },
  stable: { label: '—', sr: 'stable' },
  unknown: { label: '', sr: '' },
};
