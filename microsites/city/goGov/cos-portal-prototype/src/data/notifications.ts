import type {
  Audience,
  Interest,
  Jurisdiction,
  Skill,
} from '../types';

/**
 * Unified notification subscription model.
 *
 * Multiple kinds of subscription, multiple delivery channels, one
 * object per sub. LocalStorage is the backing store for the prototype;
 * a production build would POST each sub to a server-side list + tie
 * it to an authenticated resident account.
 *
 * ── FUTURE STATE ─────────────────────────────────────────────────────────
 * Subscriptions become the spine of the portal. Zipcode-driven subs are
 * tied to the PostGIS jurisdiction resolver, so residents subscribe once
 * to "alerts in my jurisdiction" and the system figures out which city /
 * county / district / utility boundaries that means. Dashboard-threshold
 * subs turn the Performance mode into a live early-warning system — the
 * ADA compliance score dropping below 95 can page a resident's inbox.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type DeliveryChannel = 'email' | 'sms' | 'push';

export type SubscriptionKind =
  | {
      kind: 'newsletter';
      cadence: 'weekly' | 'monthly';
    }
  | {
      kind: 'volunteer-match';
      skills: Skill[];
      interests: Interest[];
      audiences: Audience[];
    }
  | {
      kind: 'zipcode-alerts';
      zipcode: string;
      categories: ZipCategory[];
    }
  | {
      kind: 'dashboard-threshold';
      metricId: string;
      trigger: 'any-change' | 'goes-worse' | 'goes-better';
    }
  | {
      kind: 'topic-updates';
      topicId: string; // e.g. "61341" (pothole) — notify on status of my reports or nearby reports
    }
  | {
      kind: 'project-updates';
      projectId: string; // e.g. "cip-union-blvd"
    }
  | {
      kind: 'journey-milestone';
      journey: string; // "building-a-home" etc.
    };

export type ZipCategory =
  | 'emergency'
  | 'road-closures'
  | 'construction'
  | 'public-meetings'
  | 'water-advisories'
  | 'air-quality'
  | 'winter-ops';

export const ZIP_CATEGORY_LABELS: Record<ZipCategory, string> = {
  emergency: 'Emergency alerts (evacuation, severe weather)',
  'road-closures': 'Road closures & detours near my address',
  construction: 'Construction activity near my address',
  'public-meetings': 'Public hearings in my district',
  'water-advisories': 'Water advisories (boil orders, outages)',
  'air-quality': 'Air quality alerts',
  'winter-ops': 'Snow operations & winter parking rules',
};

export interface Subscription {
  id: string;
  createdAt: string;
  email?: string;
  phone?: string;
  channels: DeliveryChannel[];
  spec: SubscriptionKind;
  /**
   * Derived at subscribe time — the jurisdictions (city, county, etc.)
   * implied by the zipcode, so the user can SEE what they'll be
   * subscribed to across before confirming. Production version computes
   * this via PostGIS boundary lookup.
   */
  resolvedJurisdictions?: Jurisdiction[];
}

export const STORAGE_KEY = 'cos-portal-subscriptions';

export function loadSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Subscription[]) : [];
  } catch {
    return [];
  }
}

export function saveSubscriptions(subs: Subscription[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  } catch {
    /* quota or privacy mode — ignore in prototype */
  }
}

/**
 * Simulated jurisdiction resolver. Real one is PostGIS; this is a stub
 * that returns plausible jurisdictions for any 5-digit input so the UX
 * feels real.
 */
export function resolveJurisdictionsForZip(zip: string): Jurisdiction[] {
  const digits = zip.replace(/\D/g, '');
  if (digits.length < 5) return [];
  // Colorado Springs-area zips (80901–80970) resolve city + county + utility + regional.
  const prefix = digits.slice(0, 3);
  if (prefix === '809') {
    return ['city', 'county', 'utility', 'regional', 'special-district', 'state'];
  }
  // Teller County (Woodland Park) — regional only, no city
  if (digits.startsWith('80863') || digits.startsWith('80866')) {
    return ['county', 'regional', 'special-district', 'state'];
  }
  return ['state']; // Unknown — default to state only
}

/**
 * Summarize a SubscriptionKind into a short human sentence for display.
 */
export function summarizeSpec(spec: SubscriptionKind): string {
  switch (spec.kind) {
    case 'newsletter':
      return `City newsletter (${spec.cadence})`;
    case 'volunteer-match':
      return `Volunteer matches · ${spec.skills.length + spec.interests.length + spec.audiences.length} filters`;
    case 'zipcode-alerts':
      return `Zipcode ${spec.zipcode} · ${spec.categories.length} categor${spec.categories.length === 1 ? 'y' : 'ies'}`;
    case 'dashboard-threshold':
      return `Dashboard: ${spec.metricId} — ${spec.trigger}`;
    case 'topic-updates':
      return `Topic updates · #${spec.topicId}`;
    case 'project-updates':
      return `Project updates · ${spec.projectId}`;
    case 'journey-milestone':
      return `Journey milestones · ${spec.journey}`;
  }
}
