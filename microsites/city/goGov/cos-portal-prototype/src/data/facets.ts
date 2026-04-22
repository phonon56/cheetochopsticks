import type { Intent, Journey, Jurisdiction, Subject, Topic, TopicFacets } from '../types';

/**
 * Facet inference: every topic carries an intent (one of 4), subjects (flat
 * tags, any), and journeys (curated multi-topic walkthroughs, any).
 *
 * Approach:
 *  1. Start from a group-level default (coarse but safe).
 *  2. Override intent when the topic name contains strong signals
 *     ("Complaint", "CORA", "Permit", "General Contact", etc.).
 *  3. Add subject tags by scanning the topic name + group for keywords.
 *  4. Layer on hand-authored overrides by topicId for anything the
 *     heuristics get wrong or for journey anchoring.
 */

interface GroupDefault {
  intent: Intent;
  subjects: Subject[];
}

const GROUP_DEFAULTS: Record<string, GroupDefault> = {
  'Accessibility and Language Access': { intent: 'contact', subjects: ['accessibility'] },
  'Contact A City Department': { intent: 'contact', subjects: [] },
  'Fire Department': { intent: 'contact', subjects: ['fire-safety'] },
  'Neighborhood Services/Code Enforcement': { intent: 'report', subjects: ['property'] },
  'Noise Complaint': { intent: 'report', subjects: ['noise'] },
  'Other Requests': { intent: 'report', subjects: [] },
  'Parks, Recreation and Cultural Services': { intent: 'contact', subjects: ['parks'] },
  Police: { intent: 'report', subjects: ['police'] },
  'Roads and Sidewalks': { intent: 'report', subjects: ['street'] },
  Trees: { intent: 'report', subjects: ['tree'] },
  'Water & Stormwater': { intent: 'report', subjects: ['water'] },
  'Colorado Open Records Act Requests (CORA)': { intent: 'records', subjects: [] },
  'Permits, Licenses & Records': { intent: 'permit', subjects: [] },
};

const DEFAULT: GroupDefault = { intent: 'contact', subjects: [] };

// Name-based intent overrides (strongest signals first)
const INTENT_NAME_RULES: Array<{ match: RegExp; intent: Intent }> = [
  { match: /\bCORA\b|Records Request|Open Records/i, intent: 'records' },
  { match: /\bPermit\b|\bLicense\b|\bApplication\b/i, intent: 'permit' },
  { match: /Complaint|Violation|Report|Damage|Dumping|Enforcement|Hazard|Complaints/i, intent: 'report' },
  { match: /\bGeneral Contact\b|\bGeneral Questions\b|\bInformation\b|\bInquiries\b|Compliment/i, intent: 'contact' },
];

// Subject inference from topic name + group name
const SUBJECT_NAME_RULES: Array<{ match: RegExp; add: Subject[] }> = [
  { match: /pothole|street|road|sidewalk|curb|pedestrian|crosswalk|repaving|snow.*street|deceased animal/i, add: ['street'] },
  { match: /sidewalk|pedestrian curb|ADA parking/i, add: ['property', 'street'] },
  { match: /vehicle|car|parking|tow|license plate|motor/i, add: ['vehicle'] },
  { match: /animal|barking dog|pet/i, add: ['animal'] },
  { match: /noise/i, add: ['noise'] },
  { match: /water|storm|flood|spill|pond|sprinkler|drainage/i, add: ['water'] },
  { match: /tree|limb|forestry/i, add: ['tree'] },
  { match: /business|procurement|contracting|vendor|licens/i, add: ['business'] },
  { match: /event|race|parade|special event/i, add: ['event'] },
  { match: /homeless|camp/i, add: ['homeless'] },
  { match: /fire|hazmat|sprinkler|alarm|suppression/i, add: ['fire-safety'] },
  { match: /police|CSPD|crash|incident report|body cam|arrest/i, add: ['police'] },
  { match: /ADA|accessibility|Title VI|language/i, add: ['accessibility'] },
  { match: /transit|bus|Mountain Metro|MMT|scooter/i, add: ['transit'] },
  { match: /court|citation|violation/i, add: ['court'] },
  { match: /graffiti|illegal dumping|abandoned vehicle|short-term rental|STR|nuisance|zoning|code/i, add: ['property'] },
  { match: /airport|aviation/i, add: [] }, // airport has its own agency; no generic subject
  { match: /construction|grading|erosion|stormwater management/i, add: ['construction'] },
  { match: /planning|subdivision|plat|land use|annexation/i, add: ['construction'] },
  { match: /park|trail|recreation|garden of the gods|Pikes Peak/i, add: ['parks'] },
  { match: /records|background check|clearance letter|crash report/i, add: ['people-records'] },
];

/**
 * Per-topic overrides for places the heuristics are wrong or for journey
 * anchoring. Keyed by topicId (GovOutreach classificationId OR extension id).
 * Values here *replace* any inferred facets.
 */
const OVERRIDES: Record<string, Partial<TopicFacets>> = {
  // ── Building a home journey ──
  'permit-pprbd': {
    intent: 'permit',
    subjects: ['property', 'construction'],
    journeys: ['building-a-home', 'opening-a-restaurant'],
  },
  '61763': {
    // Permit to plant a tree in City right-of-way
    intent: 'permit',
    subjects: ['tree', 'property'],
    journeys: ['building-a-home'],
  },
  'permit-planning': {
    intent: 'permit',
    subjects: ['construction', 'property'],
    journeys: ['building-a-home', 'opening-a-restaurant'],
  },
  'permit-stormwater': {
    intent: 'permit',
    subjects: ['water', 'construction'],
    journeys: ['building-a-home'],
  },
  'permit-infrastructure': {
    intent: 'permit',
    subjects: ['construction', 'street'],
    journeys: ['building-a-home'],
  },

  // ── Opening a restaurant ──
  'permit-business-licensing': {
    intent: 'permit',
    subjects: ['business'],
    journeys: ['opening-a-restaurant', 'starting-a-business'],
  },
  'permit-fire-commercial': {
    intent: 'permit',
    subjects: ['fire-safety', 'business'],
    journeys: ['opening-a-restaurant'],
  },

  // ── Hosting a block party ──
  'permit-public-works': {
    intent: 'permit',
    subjects: ['street', 'event'],
    journeys: ['hosting-a-block-party'],
  },
  '61754': {
    // Noise Complaint — surface as an FYI in the block party journey ("keep it legal")
    intent: 'report',
    subjects: ['noise'],
    journeys: ['hosting-a-block-party', 'dealing-with-a-neighbor'],
  },

  // ── Dealing with a neighbor ──
  '61750': {
    // Neighborhood Services
    intent: 'report',
    subjects: ['property'],
    journeys: ['dealing-with-a-neighbor'],
  },
  '61634': {
    // Barking Dog
    intent: 'report',
    subjects: ['animal', 'noise'],
    journeys: ['dealing-with-a-neighbor'],
  },
  '63474': {
    // Abandoned Vehicles
    intent: 'report',
    subjects: ['vehicle', 'property'],
    journeys: ['dealing-with-a-neighbor'],
  },
  '61730': {
    // Graffiti
    intent: 'report',
    subjects: ['property'],
    journeys: ['dealing-with-a-neighbor'],
  },

  // ── Just moved here ──
  '61642': {
    // City Clerk — voter registration, elections
    intent: 'contact',
    subjects: [],
    journeys: ['just-moved-here'],
  },
  '61747': {
    // Mountain Metro Transit
    intent: 'contact',
    subjects: ['transit'],
    journeys: ['just-moved-here'],
  },
  '61724': {
    // General City Contact
    intent: 'contact',
    subjects: [],
    journeys: ['just-moved-here'],
  },

  // ── Recovering from a crash ──
  'permit-police-records': {
    intent: 'permit', // technically an order/pay — keep as permit bucket for now
    subjects: ['people-records', 'vehicle', 'police'],
    journeys: ['recovering-from-a-crash'],
  },
  'cora-police-records': {
    intent: 'records',
    subjects: ['people-records', 'police'],
    journeys: ['recovering-from-a-crash'],
  },

  // ── Starting a business (broader than restaurant) ──
  '61710': {
    // Economic Development
    intent: 'contact',
    subjects: ['business'],
    journeys: ['starting-a-business'],
  },

  // ── Bucketing fixes ──
  '61722': {
    // Fraud / Waste / Abuse — records-ish but primarily a report
    intent: 'report',
    subjects: [],
    journeys: [],
  },
  '61510': {
    // 2C Question/Concern — 2C is a ballot measure; informational
    intent: 'contact',
    subjects: ['street'],
    journeys: [],
  },
};

function inferJurisdiction(topic: Topic, groupName: string): Jurisdiction {
  // Explicit overrides by topicId
  if (topic.topicId === 'permit-pprbd') return 'regional';
  if (topic.topicId === 'cora-utilities') return 'utility';

  // By group
  if (groupName.startsWith('El Paso County')) return 'county';
  if (groupName.startsWith('State of Colorado')) return 'state';
  if (groupName.startsWith('Federal')) return 'federal';

  // Text hints as a fallback
  const h = `${topic.name} ${groupName}`;
  if (/\bCSU\b|Colorado Springs Utilities/i.test(h)) return 'utility';
  if (/\bPPRBD\b|Pikes Peak Regional Building/i.test(h)) return 'regional';
  if (/\bEl Paso County\b/i.test(h)) return 'county';

  // Default: City of Colorado Springs
  return 'city';
}

export function inferFacets(topic: Topic, groupName: string): TopicFacets {
  const override = OVERRIDES[topic.topicId];

  const def = GROUP_DEFAULTS[groupName] ?? DEFAULT;
  let intent: Intent = def.intent;
  const subjects = new Set<Subject>(def.subjects);

  const haystack = `${topic.name} ${groupName}`;
  for (const rule of INTENT_NAME_RULES) {
    if (rule.match.test(haystack)) {
      intent = rule.intent;
      break;
    }
  }
  for (const rule of SUBJECT_NAME_RULES) {
    if (rule.match.test(haystack)) {
      for (const s of rule.add) subjects.add(s);
    }
  }

  return {
    intent: (override?.intent as Intent) ?? intent,
    subjects: override?.subjects ?? [...subjects],
    journeys: override?.journeys ?? [],
    jurisdiction:
      (override as Partial<TopicFacets> | undefined)?.jurisdiction ??
      inferJurisdiction(topic, groupName),
  };
}

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  city: 'City of Colorado Springs',
  county: 'El Paso County',
  state: 'State of Colorado',
  federal: 'Federal',
  regional: 'Regional agency',
  utility: 'Utility',
  'special-district': 'Special district',
  tribal: 'Tribal',
};

export const JURISDICTION_SHORT: Record<Jurisdiction, string> = {
  city: 'City',
  county: 'County',
  state: 'State',
  federal: 'Federal',
  regional: 'Regional',
  utility: 'Utility',
  'special-district': 'District',
  tribal: 'Tribal',
};

export const INTENT_LABELS: Record<Intent, string> = {
  report: 'Report a problem',
  permit: 'Get a permit or license',
  records: 'Request records',
  contact: 'Contact a department',
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  property: 'Property & neighborhood',
  street: 'Streets & sidewalks',
  vehicle: 'Vehicles & parking',
  noise: 'Noise',
  animal: 'Animals',
  water: 'Water & drainage',
  tree: 'Trees',
  business: 'Business',
  event: 'Events',
  homeless: 'Homelessness',
  'fire-safety': 'Fire & life safety',
  police: 'Police',
  accessibility: 'Accessibility (ADA)',
  construction: 'Construction & development',
  environmental: 'Environmental',
  parks: 'Parks & recreation',
  transit: 'Transit',
  court: 'Courts',
  'people-records': 'Personal records',
};

export const JOURNEY_LABELS: Record<Journey, string> = {
  'building-a-home': 'Building a home',
  'opening-a-restaurant': 'Opening a restaurant',
  'hosting-a-block-party': 'Hosting a block party',
  'just-moved-here': 'Just moved here',
  'dealing-with-a-neighbor': 'Dealing with a neighbor',
  'recovering-from-a-crash': 'Recovering from a crash',
  'starting-a-business': 'Starting a business',
};
