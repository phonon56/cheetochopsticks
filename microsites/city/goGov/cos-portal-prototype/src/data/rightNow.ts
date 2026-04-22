/**
 * "Right now" — operational awareness tiles.
 *
 * Tiles surface information that is only useful for hours or days and then
 * goes stale. The live version of this file is a fetcher; today it's a
 * static catalog modeled on the shape of the feeds we'd consume.
 *
 * Same status system as performance receipts:
 *   - 'verified'     — real data pulled from a live source or stable URL.
 *   - 'snapshot'     — real data frozen at a point in time.
 *   - 'illustrative' — prototype placeholder until a feed is wired up.
 *
 * ── FUTURE STATE ─────────────────────────────────────────────────────────
 * Each `locationDependent` tile takes a resident's zip/address and narrows
 * to their jurisdictions (city/county/utility/school district) via a
 * PostGIS boundary lookup. Address resolution lives here because "Right
 * now" is the mode where geography is load-bearing — it's the natural home
 * for the jurisdiction resolver we've wanted since day one.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type TileCategory = 'schedule' | 'alert' | 'status' | 'metric' | 'count';

export type TileSeverity = 'none' | 'info' | 'warning' | 'critical';

export type TileStatus = 'verified' | 'snapshot' | 'illustrative';

export interface Tile {
  id: string;
  title: string;
  category: TileCategory;
  /** Short big-number or big-phrase surface. */
  headline: string;
  subhead?: string;
  /** If true, the tile's content depends on the user's address/zip. */
  locationDependent: boolean;
  /** Is there something right-now-active here? If false, the tile shows a muted "nothing right now" state. */
  active: boolean;
  severity: TileSeverity;
  status: TileStatus;
  asOf: string;
  action?: { label: string; url: string };
}

/**
 * Seasonally, some tiles appear and others disappear. Today we just ship
 * every tile; a live build would filter by season/time of day.
 */
export const tiles: Tile[] = [
  // ── Scheduled civic activity ────────────────────────────────────────
  {
    id: 'council-tonight',
    title: 'City Council tonight',
    category: 'schedule',
    headline: 'Next meeting: check calendar',
    subhead:
      'Live-streamed. Public comment usually available in-person and via written submission.',
    locationDependent: false,
    active: true,
    severity: 'info',
    status: 'verified',
    asOf: 'Live from City Council calendar',
    action: {
      label: 'Agenda & livestream',
      url: 'https://coloradosprings.gov/city-council',
    },
  },
  {
    id: 'boco-meeting',
    title: 'Board of County Commissioners',
    category: 'schedule',
    headline: 'See meeting calendar',
    subhead:
      'Weekly BoCC meetings at the Centennial Hall campus. Public comment accepted.',
    locationDependent: false,
    active: true,
    severity: 'info',
    status: 'verified',
    asOf: 'Live from County calendar',
    action: {
      label: 'BoCC schedule',
      url: 'https://bocc.elpasoco.com',
    },
  },
  {
    id: 'library-today',
    title: 'Today at Pikes Peak Library District',
    category: 'schedule',
    headline: 'Events happening now',
    subhead:
      'Story times, maker events, tutoring drop-ins, lectures — across 14 branches.',
    locationDependent: true,
    active: true,
    severity: 'info',
    status: 'verified',
    asOf: 'Live from PPLD calendar',
    action: {
      label: 'Browse today\'s events',
      url: 'https://ppld.org',
    },
  },
  {
    id: 'public-hearings',
    title: 'Land-use hearings this week',
    category: 'schedule',
    headline: '3 hearings scheduled',
    subhead:
      'Rezonings, subdivision approvals, and variance requests coming before Planning Commission or Council.',
    locationDependent: true,
    active: true,
    severity: 'info',
    status: 'illustrative',
    asOf: 'Would pull from Planning & Development calendar',
    action: {
      label: 'Planning Commission agenda',
      url: 'https://coloradosprings.gov/planning-and-development',
    },
  },

  // ── Active alerts ───────────────────────────────────────────────────
  {
    id: 'emergency-alerts',
    title: 'Emergency alerts',
    category: 'alert',
    headline: 'None active',
    subhead:
      'Active emergency alerts from the Pikes Peak Regional Office of Emergency Management would surface here.',
    locationDependent: true,
    active: false,
    severity: 'none',
    status: 'illustrative',
    asOf: 'Would pull from OEM alert feed',
    action: {
      label: 'Sign up for PPROEM alerts',
      url: 'https://pproem.com',
    },
  },
  {
    id: 'air-quality',
    title: 'Air quality',
    category: 'alert',
    headline: 'Moderate',
    subhead:
      'Front Range AQI. Wildfire smoke impact varies seasonally — tile elevates to Warning / Critical when conditions worsen.',
    locationDependent: true,
    active: true,
    severity: 'info',
    status: 'illustrative',
    asOf: 'Would pull from CDPHE air-quality feed',
    action: {
      label: 'Colorado air quality',
      url: 'https://airquality.colorado.gov',
    },
  },
  {
    id: 'water-advisory',
    title: 'Water advisory',
    category: 'alert',
    headline: 'None active',
    subhead:
      'Boil-water orders or other CSU water advisories. Tile activates and elevates severity when issued.',
    locationDependent: true,
    active: false,
    severity: 'none',
    status: 'illustrative',
    asOf: 'Would pull from Colorado Springs Utilities',
    action: {
      label: 'CSU service updates',
      url: 'https://www.csu.org',
    },
  },

  // ── Operational status ──────────────────────────────────────────────
  {
    id: 'snow-ops',
    title: 'Snow operations',
    category: 'status',
    headline: 'Not active',
    subhead:
      'During snow events: arterial plowing status, residential treatment status, active deicer routes.',
    locationDependent: false,
    active: false,
    severity: 'none',
    status: 'illustrative',
    asOf: 'Would pull from Public Works winter ops dashboard',
    action: {
      label: 'Winter operations info',
      url: 'https://coloradosprings.gov/public-works',
    },
  },
  {
    id: 'trash-recycling',
    title: 'Your trash & recycling day',
    category: 'status',
    headline: 'Enter address above',
    subhead:
      'Next pickup day for your address, including holiday slips. Haulers in Colorado Springs are contracted per address, so schedule varies.',
    locationDependent: true,
    active: true,
    severity: 'info',
    status: 'illustrative',
    asOf: 'Would match address to hauler schedule',
    action: {
      label: 'Residential trash haulers',
      url: 'https://coloradosprings.gov/neighborhood-services',
    },
  },
  {
    id: 'road-closures',
    title: 'Road closures near you',
    category: 'status',
    headline: 'Enter address above',
    subhead:
      'Active closures within ½ mile of your address — construction, events, maintenance.',
    locationDependent: true,
    active: true,
    severity: 'info',
    status: 'illustrative',
    asOf: 'Would join Public Works closures feed + address',
    action: {
      label: 'City-wide construction map',
      url: 'https://coloradosprings.gov/public-works',
    },
  },

  // ── Metrics rolling up from the portal itself ───────────────────────
  {
    id: 'cora-week',
    title: 'CORA requests this week',
    category: 'metric',
    headline: 'Median 2.1 days',
    subhead:
      'Rolling 7-day median time from request received to records produced or denial issued.',
    locationDependent: false,
    active: true,
    severity: 'info',
    status: 'illustrative',
    asOf: 'Would pull from City Communications CORA log',
    action: {
      label: 'About CORA',
      url: 'https://coloradosprings.gov/city-communications/page/colorado-open-records-act-cora',
    },
  },
  {
    id: 'open-requests-nearby',
    title: 'Open service requests nearby',
    category: 'count',
    headline: 'Enter address above',
    subhead:
      'Potholes, graffiti, tree issues, abandoned vehicles within ½ mile that other residents have already reported.',
    locationDependent: true,
    active: true,
    severity: 'info',
    status: 'illustrative',
    asOf: 'Would pull from this portal\'s own submissions database',
  },

  // ── Always-on civic opportunities ───────────────────────────────────
  {
    id: 'boards-open-now',
    title: 'Boards & commissions accepting applications',
    category: 'count',
    headline: 'Apply anytime',
    subhead:
      'Seats open as terms expire. One application goes to every board you mark interest in.',
    locationDependent: false,
    active: true,
    severity: 'info',
    status: 'verified',
    asOf: 'Live link',
    action: {
      label: 'Apply to a board',
      url: 'https://coloradosprings.gov/apply-boards-commissions-committees',
    },
  },
  {
    id: 'volunteer-alerts',
    title: 'Urgent volunteer need',
    category: 'alert',
    headline: 'None flagged',
    subhead:
      'Tile activates when a partner agency flags an urgent need (Red Cross disaster deployment, CERT call-out, wildfire recovery).',
    locationDependent: false,
    active: false,
    severity: 'none',
    status: 'illustrative',
    asOf: 'Would pull from partner-agency feeds',
  },
];

export const CATEGORY_LABELS: Record<TileCategory, string> = {
  schedule: 'Scheduled',
  alert: 'Alerts',
  status: 'Operations',
  metric: 'Metrics',
  count: 'Near you',
};

export const CATEGORY_ORDER: TileCategory[] = [
  'alert',
  'status',
  'schedule',
  'count',
  'metric',
];

export const SEVERITY_COLORS: Record<TileSeverity, string> = {
  none: 'border-slate-200 bg-slate-50',
  info: 'border-blue-300 bg-blue-50',
  warning: 'border-amber-400 bg-amber-50',
  critical: 'border-red-700 bg-red-50',
};

export const STATUS_LABELS: Record<TileStatus, string> = {
  verified: 'Verified',
  snapshot: 'Snapshot',
  illustrative: 'Prototype value',
};
