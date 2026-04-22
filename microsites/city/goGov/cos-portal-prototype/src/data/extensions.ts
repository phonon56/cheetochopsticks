import type { Group, Topic } from '../types';

/**
 * Topics that don't live in the GovOutreach scrape but *should* be reachable
 * from the same front door: permit/license destinations in Accela, the
 * separate PPRBD agency, and CORA channels that route by direct email.
 *
 * Sources (2026-04-21):
 * - https://coloradosprings.gov/city-communications/page/colorado-open-records-act-cora
 * - https://coloradosprings.gov/accessibility
 * - city-permits-licenses-records.html (keyword router prototype)
 */

const CORA_COMMON =
  'Colorado Open Records Act request. Response within 3 working days (up to 7 additional days with cause). Fees: $0.25 per printed page; $30/hour research after the first 2 hours. See policy: https://coloradosprings.gov/document/corapolicy-2023-04-192.pdf';

export const extraTopics: Array<Topic & { groupName: string }> = [
  // ── Additional CORA channels (email-only) ──────────────────────────
  {
    groupName: 'Colorado Open Records Act Requests (CORA)',
    topicId: 'cora-police-records',
    name: 'Police Records CORA Request',
    description: `Crash reports, incident reports, body camera footage, and other CSPD records. ${CORA_COMMON}`,
    visibleFields: [],
    destination: {
      kind: 'email',
      address: 'Police.Records@coloradosprings.gov',
      ctaLabel: 'Email CSPD Records',
      subjectTemplate: 'CORA request — Police Records',
    },
    contact: {
      email: 'Police.Records@coloradosprings.gov',
      phone: '(719) 444-7000',
      website: 'https://cspd.coloradosprings.gov',
      notes:
        'For crash/incident reports. Public Information Officer: PIO@coloradosprings.gov',
    },
  },
  {
    groupName: 'Colorado Open Records Act Requests (CORA)',
    topicId: 'cora-municipal-court',
    name: 'Municipal Court Records CORA Request',
    description: `Municipal Court case records, citations, and violation history. ${CORA_COMMON}`,
    visibleFields: [],
    destination: {
      kind: 'email',
      address: 'MunicipalCourtViolations@ColoradoSprings.gov',
      ctaLabel: 'Email Municipal Court',
      subjectTemplate: 'CORA request — Municipal Court',
    },
    contact: {
      email: 'MunicipalCourtViolations@ColoradoSprings.gov',
      phone: '(719) 385-5928',
      website: 'https://coloradosprings.gov/municipal-court',
    },
  },
  {
    groupName: 'Colorado Open Records Act Requests (CORA)',
    topicId: 'cora-utilities',
    name: 'Colorado Springs Utilities Records (CORA)',
    description:
      'Records requests for Colorado Springs Utilities (gas, electric, water, wastewater) are handled by CSU directly, not by the City. Response times and fees are set by CSU policy.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://www.csu.org',
      agency: 'Colorado Springs Utilities',
      warning:
        'Colorado Springs Utilities is a separate enterprise. The City cannot process CSU records requests.',
      ctaLabel: 'Continue to csu.org',
    },
    contact: {
      website: 'https://www.csu.org',
      notes: 'CSU operates independently of City government.',
    },
  },
  {
    groupName: 'Colorado Open Records Act Requests (CORA)',
    topicId: 'cora-general-contact',
    name: 'General CORA Office (Communications)',
    description: `Not sure where to send a CORA request? Start with City Communications and they will route it. ${CORA_COMMON}`,
    visibleFields: [],
    destination: {
      kind: 'email',
      address: 'City.Communications@coloradosprings.gov',
      ctaLabel: 'Email City Communications',
      subjectTemplate: 'CORA request',
    },
    contact: {
      email: 'City.Communications@coloradosprings.gov',
      phone: '(719) 385-5906',
      website:
        'https://coloradosprings.gov/city-communications/page/colorado-open-records-act-cora',
    },
  },

  // ── Permits, Licenses & Records (mostly external — Accela / PPRBD) ──
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-pprbd',
    name: 'Residential Building Permits (PPRBD)',
    description:
      'Decks, roofs, basement finishes, water heaters, HVAC, electrical, plumbing, additions, sheds, fences. Handled by Pikes Peak Regional Building Department — a separate agency from the City.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://www.pprbd.org',
      agency: 'Pikes Peak Regional Building Department',
      warning:
        'PPRBD is a separate agency with its own login. The City portal cannot process residential building permits.',
      ctaLabel: 'Continue to pprbd.org',
    },
    contact: {
      website: 'https://www.pprbd.org',
      phone: '(719) 327-2880',
      notes: 'Separate agency — covers all of the Pikes Peak region.',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-neighborhood-enforcement',
    name: 'Code Enforcement Case Lookup',
    description:
      'Look up existing code-enforcement cases, zoning complaints, nuisance violations. To file a new complaint, use "Neighborhood Services" in the Report a Problem section.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Enforcement',
      agency: 'Accela Citizen Access',
      ctaLabel: 'Open Accela case lookup',
    },
    contact: {
      phone: '(719) 444-7891',
      website: 'https://coloradosprings.gov/neighborhood-services',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-public-works',
    name: 'Right-of-Way, Traffic Control & Special Events',
    description:
      'Right-of-way work, traffic control plans, parades, races, block parties, street closures. Issued by Public Works through Accela.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=PublicWorks',
      agency: 'City Public Works — Accela',
      ctaLabel: 'Apply in Accela',
    },
    contact: {
      website: 'https://coloradosprings.gov/public-works',
      phone: '(719) 385-5918',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-business-licensing',
    name: 'Business License (new, renewal, change)',
    description:
      'City business licenses for retail, restaurants, contractors, salons, vendors, and regulated businesses. Liquor and cannabis licensing is handled separately.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Licensing',
      agency: 'City Licensing — Accela',
      ctaLabel: 'Apply or renew in Accela',
    },
    contact: {
      website: 'https://coloradosprings.gov/sales-tax',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-police-records',
    name: 'Crash Reports, Background Checks, Clearance Letters',
    description:
      'Order a crash report, request a background check, or obtain a clearance letter from the Colorado Springs Police Department.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Police',
      agency: 'CSPD Records — Accela',
      ctaLabel: 'Order in Accela',
    },
    contact: {
      website: 'https://cspd.coloradosprings.gov',
      phone: '(719) 444-7000',
      email: 'Police.Records@coloradosprings.gov',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-planning',
    name: 'Zoning, Subdivision, Land Use (Planning)',
    description:
      'Rezoning, subdivision plats, conditional use, variances, annexation. Commercial and development scale — not home remodels.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Planning',
      agency: 'City Planning — Accela',
      ctaLabel: 'Submit in Accela',
    },
    contact: {
      website: 'https://coloradosprings.gov/planning-and-development',
      phone: '(719) 385-5905',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-fire-commercial',
    name: 'Commercial Fire Permits (alarms, sprinklers, hazmat)',
    description:
      'Commercial plan review, fire alarms, sprinklers, hazardous materials, commercial kitchens, assembly permits.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Fire',
      agency: 'City Fire — Accela',
      ctaLabel: 'Submit in Accela',
    },
    contact: {
      website: 'https://coloradosprings.gov/fire-department',
      phone: '(719) 385-5950',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-stormwater',
    name: 'Stormwater & Erosion Control (construction sites)',
    description:
      'Erosion & sediment control plans, stormwater management plans, outfall compliance. Mostly for active construction sites.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=StormWater',
      agency: 'Stormwater Enterprise — Accela',
      ctaLabel: 'Submit in Accela',
    },
    contact: {
      website: 'https://coloradosprings.gov/stormwater-enterprise',
      phone: '(719) 385-5980',
    },
  },
  {
    groupName: 'Permits, Licenses & Records',
    topicId: 'permit-infrastructure',
    name: 'Infrastructure Permits (excavation, ROW, utilities)',
    description:
      'Concrete, excavation, CSU utility permits, telecom/fiber, trenching, boring — infrastructure work, NOT residential.',
    visibleFields: [],
    destination: {
      kind: 'external',
      url: 'https://aca-prod.accela.com/COSPRINGS/Cap/CapHome.aspx?module=Building',
      agency: 'City Building (infrastructure) — Accela',
      warning:
        'This tab is for infrastructure work only. For residential permits use PPRBD.',
      ctaLabel: 'Submit in Accela',
    },
    contact: {
      website: 'https://coloradosprings.gov/public-works',
    },
  },
];

/**
 * Topic-level description enrichments for existing GovOutreach CORA topics
 * so users see fee schedule + response timeline inline.
 */
export const descriptionOverrides: Record<string, string> = {
  // Contracting / Procurement CORA
  '61696': `Purchasing, bid, and contract records requests. ${CORA_COMMON}`,
  // Fire Department CORA (scrape had a short version; we append fees/SLA)
  '61714': `CORA requests for Property and Environmental Site Assessments. ${CORA_COMMON}`,
  // General CORA Request
  '61726': `General Colorado Open Records Act request for City records. ${CORA_COMMON}`,
  // Neighborhood Services CORA (scrape had a short version)
  '61752': `Colorado Open Records Act requests for the City Neighborhood Services department regarding Code Enforcement and Zoning Violations. ${CORA_COMMON}`,
  // Planning Department CORA
  '61767': `Planning Department records (site plans, rezoning files, variance decisions). ${CORA_COMMON}`,
};

/**
 * Merge extensions into the catalog groups. Extras land at the end of their
 * named group, or as a new group if none exists.
 */
export function mergeExtensions(groups: Group[]): Group[] {
  const byName = new Map<string, Group>();
  for (const g of groups) byName.set(g.groupName, { ...g, items: [...g.items] });

  for (const t of extraTopics) {
    const { groupName, ...rest } = t;
    if (!byName.has(groupName)) {
      byName.set(groupName, { groupName, items: [] });
    }
    byName.get(groupName)!.items.push(rest);
  }

  // Apply description overrides
  for (const g of byName.values()) {
    g.items = g.items.map((t) =>
      descriptionOverrides[t.topicId]
        ? { ...t, description: descriptionOverrides[t.topicId] }
        : t,
    );
  }

  return [...byName.values()];
}
