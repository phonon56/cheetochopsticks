/**
 * Plain-language keyword router.
 *
 * Ports the proven index from city-permits-licenses-records.html and expands
 * it to cover GovOutreach service-request topics and CORA channels.
 *
 * The scorer rewards multi-word phrase matches (higher specificity) and caps
 * the "residential" override so a message mentioning a home AND the word
 * "permit" still routes to PPRBD over a generic Accela Building permit.
 */

export interface KeywordEntry {
  topicId: string;
  keywords: string[];
  reason: string;
  warning?: string;
}

/**
 * topicId can reference either:
 *  - a real GovOutreach classificationId (e.g. "61341" for Pothole)
 *  - an extension id (e.g. "permit-pprbd", "cora-police-records")
 */
export const KEYWORD_INDEX: KeywordEntry[] = [
  // ── Report a problem (GovOutreach service requests) ──
  {
    topicId: '61341',
    keywords: ['pothole', 'potholes', 'hole in the road', 'hole in the street'],
    reason: 'That sounds like a pothole — Roads & Sidewalks handles these through a quick report.',
  },
  {
    topicId: '61787',
    keywords: ['sidewalk', 'cracked sidewalk', 'sidewalk damage', 'broken sidewalk', 'uneven sidewalk'],
    reason: 'Sidewalk damage reports go to Public Works via the service request form.',
  },
  {
    topicId: '61754',
    keywords: ['noise', 'loud', 'party', 'loud music', 'noise complaint', 'bass'],
    reason: 'That\'s a noise complaint — file it through the dedicated form.',
  },
  {
    topicId: '61634',
    keywords: ['barking dog', 'dog barking', 'dogs barking', 'neighbor dog'],
    reason: 'Barking dog reports go to Animal Control.',
  },
  {
    topicId: '61730',
    keywords: ['graffiti', 'tag', 'tagging', 'vandalism'],
    reason: 'Graffiti reports get logged for cleanup.',
  },
  {
    topicId: '61737',
    keywords: ['illegal dumping', 'dumped', 'trash dumped', 'mattress', 'couch', 'refrigerator'],
    reason: 'Illegal dumping reports go to Neighborhood Services / Code Enforcement.',
  },
  {
    topicId: '63474',
    keywords: [
      'abandoned vehicle', 'abandoned vehicles', 'abandoned car', 'abandoned cars',
      'junk car', 'junk cars', 'junk vehicle', 'car on street', 'cars on street',
      'parked on the street', 'parked on street', 'hasn\'t moved', 'has not moved',
      'flat tire', 'no plates', 'expired plates', 'parked forever',
    ],
    reason: 'Abandoned vehicles on City streets — Neighborhood Services handles enforcement.',
  },
  {
    topicId: '61749',
    keywords: [
      'blocking my driveway', 'blocking driveway', 'blocking the driveway',
      'parked in front of', 'parked too close', 'illegally parked',
      'parking complaint', 'parking issue', 'parking problem',
    ],
    reason: 'Neighborhood parking complaints — CSPD handles parking violations on public streets.',
  },
  {
    topicId: '61750',
    keywords: [
      // yard / property nuisance
      'tall grass', 'weeds', 'overgrown', 'mow', 'lawn', 'nuisance',
      'short-term rental', 'str', 'airbnb', 'vrbo', 'blight', 'eyesore',
      'condemned', 'boarded', 'code enforcement', 'zoning violation',
      // neighbor-driven complaints (specific phrases only — plain "neighbor"
      // collides too often with "neighborhood" in unrelated queries)
      'my neighbor', 'next door', 'the neighbor is', 'neighbor is',
      // too-many-vehicles-on-property (COS caps residential parking)
      'cars in driveway', 'cars in the driveway', 'cars in their driveway',
      'cars on lawn', 'cars on the lawn', 'cars on grass',
      'vehicles on property', 'vehicles in driveway', 'too many cars',
      'too many vehicles', 'front yard parking', 'parked on the grass',
      'parked on the lawn', 'junk in yard', 'junk on property',
      'trash in yard', 'inoperable vehicle', 'inoperable vehicles',
    ],
    reason: 'That sounds like a property or neighbor complaint — Neighborhood Services handles code enforcement, including limits on vehicles parked on residential property.',
  },
  {
    topicId: '61721',
    keywords: ['flooding', 'flood', 'water in street', 'standing water', 'drainage'],
    reason: 'Flooding and drainage issues go to Stormwater.',
  },
  {
    topicId: '61706',
    keywords: ['dead animal', 'deceased animal', 'roadkill', 'animal carcass'],
    reason: 'Deceased animals on City streets — Roads & Sidewalks handles removal.',
  },
  {
    topicId: '61789',
    keywords: ['snow removal', 'snow plow', 'unplowed', 'ice on road', 'ice on street'],
    reason: 'Snow removal requests for City streets.',
  },
  {
    topicId: '61736',
    keywords: ['homeless camp', 'illegal camp', 'encampment', 'tents', 'tent camp'],
    reason: 'Illegal homeless camp reports.',
  },
  {
    topicId: '61786',
    keywords: ['scooter', 'scooters', 'lime', 'bird'],
    reason: 'Scooter-share issues route to the scooter complaint form.',
  },
  {
    topicId: '61728',
    keywords: ['tree', 'broken branch', 'dead tree', 'tree service'],
    reason: 'Tree service requests go to City Forestry.',
  },

  // ── Police (non-emergency) ──
  {
    topicId: '61771',
    keywords: ['police non emergency', 'non-emergency police', 'suspicious', 'suspicious person'],
    reason: 'Non-emergency police matter — CSPD non-emergency line.',
    warning: 'For emergencies, call 911.',
  },
  {
    topicId: '61753',
    keywords: ['speeding', 'speeders', 'neighborhood speeding', 'traffic complaint'],
    reason: 'Neighborhood speeding complaints get logged with CSPD.',
  },

  // ── Permits, Licenses & Records (external) ──
  {
    topicId: 'permit-pprbd',
    keywords: ['deck', 'roof', 'roofing', 'water heater', 'hvac', 'furnace', 'air conditioning', 'basement', 'finish basement', 'electrical', 'plumbing', 'mechanical', 'remodel', 'renovation', 'addition', 'residential permit', 'house permit', 'home permit', 'building permit', 'pprbd', 'shed', 'garage', 'kitchen', 'bathroom', 'window', 'door', 'siding', 'insulation', 'solar panel', 'hot tub', 'fence', 'retaining wall', 'patio', 'pergola', 'carport'],
    reason: 'That sounds like a residential building project — PPRBD handles all home permits in the Pikes Peak region.',
    warning: 'PPRBD is a separate agency from the City with its own website (pprbd.org) and its own login.',
  },
  {
    topicId: 'permit-public-works',
    keywords: ['right-of-way', 'right of way', 'row permit', 'traffic control', 'road closure', 'parade', 'race', '5k', '10k', 'marathon', 'block party', 'special event', 'barricade', 'detour', 'street closure', 'street fair'],
    reason: 'Street-use and special-event permits go through Public Works in Accela.',
  },
  {
    topicId: 'permit-business-licensing',
    keywords: ['business license', 'start a business', 'open a business', 'coffee shop', 'restaurant', 'retail', 'store license', 'shop license', 'license renewal', 'vendor', 'food truck', 'mobile vendor', 'contractor license', 'liquor license', 'cannabis', 'marijuana', 'dispensary', 'salon', 'barber', 'tattoo'],
    reason: 'Starting or licensing a business — City Licensing handles this in Accela.',
  },
  {
    topicId: 'permit-police-records',
    keywords: ['crash report', 'accident report', 'background check', 'clearance letter', 'police records', 'arrest record', 'incident report', 'body cam', 'body camera', 'theft report', 'car accident', 'hit and run', 'vin check'],
    reason: 'Police records — order crash reports, background checks, and clearance letters.',
  },
  {
    topicId: 'permit-planning',
    keywords: ['zoning', 'rezone', 'rezoning', 'subdivision', 'plat', 'land use', 'conditional use', 'variance', 'annexation', 'comprehensive plan', 'overlay', 'setback', 'density', 'development', 'commercial development', 'mixed use', 'planned unit'],
    reason: 'Land-use and zoning questions at development scale — Planning handles these.',
  },
  {
    topicId: 'permit-fire-commercial',
    keywords: ['fire permit', 'fire alarm', 'sprinkler', 'sprinkler system', 'hazmat', 'hazardous material', 'commercial kitchen', 'hood suppression', 'fire inspection', 'fire marshal', 'commercial plan review', 'assembly permit', 'pyrotechnics', 'fireworks', 'fire suppression'],
    reason: 'Commercial fire-safety permits — Fire handles alarms, sprinklers, and plan reviews.',
  },
  {
    topicId: 'permit-stormwater',
    keywords: ['stormwater', 'storm water', 'erosion', 'erosion control', 'sediment', 'runoff', 'outfall', 'swmp', 'construction site', 'grading', 'bmp', 'best management practice', 'ms4', 'stormwater management'],
    reason: 'Stormwater compliance — typically for construction sites needing erosion control.',
  },
  {
    topicId: 'permit-infrastructure',
    keywords: ['excavation', 'utility permit', 'csu permit', 'concrete permit', 'infrastructure permit', 'public infrastructure', 'telecom', 'fiber', 'conduit', 'trench', 'boring'],
    reason: 'Infrastructure work in the public right-of-way — not residential.',
  },

  // ── CORA channels ──
  {
    topicId: 'cora-police-records',
    keywords: [
      'cora police', 'police cora',
      'crash report cora', 'incident report cora', 'body camera cora',
      // aggregation / data-request language applied to police
      'police data', 'crime data', 'crime stats', 'crime statistics',
      'police statistics', 'police numbers', 'aggregate police',
      'crime report', 'crime reports', 'police report data',
      'cspd data', 'cspd records', 'cspd statistics', 'cspd',
      'crime', 'crimes', 'crime rate',
      'data from police', 'data from the police', 'data from cspd',
      'how many crimes', 'how many arrests',
    ],
    reason:
      'That sounds like a request for police records or data — CSPD Records fulfills these directly by email.',
  },
  {
    topicId: 'cora-municipal-court',
    keywords: [
      'municipal court cora',
      'court records', 'citation records', 'violation history',
      'municipal court data', 'court statistics',
    ],
    reason: 'Municipal Court records go directly to the court email.',
  },
  {
    topicId: 'cora-utilities',
    keywords: [
      'utilities cora', 'csu cora',
      'electric records', 'water records', 'gas records',
      'utility data', 'csu data',
    ],
    reason: 'Utility records are held by Colorado Springs Utilities (separate enterprise).',
  },
  {
    topicId: '61726',
    keywords: [
      'cora', 'open records', 'records request', 'public records',
      // generic aggregation / data language — routes to general CORA when
      // no specific department is named
      'aggregate data', 'dataset', 'data request', 'open data',
      'statistics', 'how many', 'year over year', 'public data',
    ],
    reason:
      'General records or data request — submit through the City CORA form or start with City Communications.',
  },

  // ── Accessibility ──
  {
    topicId: '61591',
    keywords: ['ada parking', 'handicap parking', 'accessible parking'],
    reason: 'ADA parking enforcement — Office of Accessibility.',
  },
  {
    topicId: '61723',
    keywords: ['ada', 'accessibility', 'wheelchair', 'disability accommodation'],
    reason: 'General ADA / accessibility issue — Office of Accessibility.',
  },
  {
    topicId: '61738',
    keywords: ['language access', 'translation', 'interpreter', 'title vi', 'discrimination'],
    reason: 'Title VI language access — handled by the Office of Accessibility.',
  },
];

/**
 * Residential signals that force PPRBD when the user mentions their own home.
 * Otherwise "permit" + "excavation" could route to the infrastructure Accela
 * module when the user clearly means a deck on their house.
 */
const RESIDENTIAL_SIGNALS = [
  'deck', 'roof', 'basement', 'water heater', 'hvac', 'furnace', 'remodel',
  'addition', 'plumbing', 'electrical', 'solar', 'shed', 'garage', 'patio',
  'fence', 'kitchen', 'bathroom',
];
const HOME_CONTEXT = /\b(house|home|my home|residential|my yard|my house)\b/i;

export interface RouteMatch {
  topicId: string;
  score: number;
  reason: string;
  warning?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RouteResult {
  primary: RouteMatch | null;
  alternates: RouteMatch[];
  /** Five-digit zip extracted from the user's sentence, if present. */
  extractedZip?: string;
}

/**
 * Extracts the first 5-digit zip code from user text. Returns undefined if none.
 * Avoids matching 5-digit sequences that are obviously not zips (e.g. inside
 * a longer 6+ digit number).
 */
export function extractZip(text: string): string | undefined {
  const m = text.match(/(?<!\d)(\d{5})(?!\d)/);
  return m ? m[1] : undefined;
}

/**
 * Aggregation / dataset-request vocabulary. When this is present in the
 * user's question, treat the query as a records-request even if no
 * agency is named — we'd rather surface a CORA path than miss entirely.
 */
const AGGREGATION_SIGNALS = /\b(aggregate|dataset|data request|open data|statistics|how many|year over year|year-over-year|public data|open records|numbers for|crime stats|crime data|police data)\b/i;

/**
 * Residential signals that force PPRBD when the user mentions their own home.
 */

export function routeRequest(userText: string): RouteResult {
  const input = userText.toLowerCase();
  if (!input.trim()) return { primary: null, alternates: [] };

  const extractedZip = extractZip(userText);
  const isAggregationQuery = AGGREGATION_SIGNALS.test(userText);

  const scored: Array<{ entry: KeywordEntry; score: number }> = [];
  for (const entry of KEYWORD_INDEX) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (input.includes(kw.toLowerCase())) {
        score += kw.includes(' ') ? 3 : 1;
      }
    }
    // Aggregation boost: if this is clearly a data/records request, elevate
    // the CORA channels so a police-data question doesn't lose to a
    // police-non-emergency generic match.
    if (isAggregationQuery && entry.topicId.startsWith('cora-')) {
      score += 2;
    }
    if (isAggregationQuery && entry.topicId === '61726') {
      score += 1;
    }
    if (score > 0) scored.push({ entry, score });
  }

  if (!scored.length) {
    return extractedZip ? { primary: null, alternates: [], extractedZip } : { primary: null, alternates: [] };
  }

  scored.sort((a, b) => b.score - a.score);

  // Residential override: prefer PPRBD if user talks about their home AND
  // mentions any residential signal, regardless of what scored highest.
  const mentionsHome = HOME_CONTEXT.test(input);
  const hasResidential = RESIDENTIAL_SIGNALS.some((kw) => input.includes(kw));
  if (mentionsHome && hasResidential) {
    const pprbdIdx = scored.findIndex((s) => s.entry.topicId === 'permit-pprbd');
    if (pprbdIdx > 0) {
      const [pprbd] = scored.splice(pprbdIdx, 1);
      scored.unshift(pprbd);
    }
  }

  const toMatch = (s: { entry: KeywordEntry; score: number }): RouteMatch => ({
    topicId: s.entry.topicId,
    score: s.score,
    reason: s.entry.reason,
    warning: s.entry.warning,
    confidence: s.score >= 4 ? 'high' : s.score >= 2 ? 'medium' : 'low',
  });

  return {
    primary: toMatch(scored[0]),
    alternates: scored.slice(1, 3).map(toMatch),
    extractedZip,
  };
}
