export type FieldTag = 'INPUT' | 'TEXTAREA' | 'SELECT';
export type FieldType = 'text' | 'textarea' | 'select-one' | 'date' | 'checkbox';

export interface VisibleField {
  label: string;
  tag: FieldTag;
  type: FieldType;
  name: string;
  required: boolean;
  options?: string[];
  groupLabel?: string; // for checkbox groups
}

export interface RawField {
  tag: string;
  type?: string;
  name?: string;
  id?: string;
  for?: string;
  text?: string;
  visible?: boolean;
}

export interface TopicContact {
  website?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export type Destination =
  | { kind: 'form' }
  | {
      kind: 'external';
      url: string;
      agency: string;
      warning?: string;
      ctaLabel?: string;
    }
  | {
      kind: 'email';
      address: string;
      ctaLabel?: string;
      subjectTemplate?: string;
    };

export type Intent = 'report' | 'permit' | 'records' | 'contact';

export type Jurisdiction =
  | 'city'
  | 'county'
  | 'state'
  | 'federal'
  | 'regional'
  | 'utility'
  | 'special-district'
  | 'tribal';

export type Subject =
  | 'property'
  | 'street'
  | 'vehicle'
  | 'noise'
  | 'animal'
  | 'water'
  | 'tree'
  | 'business'
  | 'event'
  | 'homeless'
  | 'fire-safety'
  | 'police'
  | 'accessibility'
  | 'construction'
  | 'environmental'
  | 'parks'
  | 'transit'
  | 'court'
  | 'people-records';

export type Journey =
  | 'building-a-home'
  | 'opening-a-restaurant'
  | 'hosting-a-block-party'
  | 'just-moved-here'
  | 'dealing-with-a-neighbor'
  | 'recovering-from-a-crash'
  | 'starting-a-business';

export interface TopicFacets {
  intent: Intent;
  subjects: Subject[];
  journeys: Journey[];
  jurisdiction: Jurisdiction;
}

export interface Topic {
  topicId: string;
  name: string;
  description: string;
  visibleFields: VisibleField[];
  rawFields?: RawField[];
  contact?: TopicContact;
  destination?: Destination; // defaults to { kind: 'form' }
  facets?: TopicFacets;
}

// ── Get Involved ──────────────────────────────────────────────────────
export type Commitment =
  | 'one-time'
  | 'recurring-monthly'
  | 'recurring-quarterly'
  | 'annual-event'
  | 'term-based'
  | 'flexible';

export type Skill =
  | 'outdoors'
  | 'construction'
  | 'budget-finance'
  | 'writing'
  | 'teaching'
  | 'public-speaking'
  | 'data-tech'
  | 'event-planning'
  | 'hospitality'
  | 'legal'
  | 'planning-design'
  | 'emergency-response'
  | 'medical'
  | 'language'
  | 'arts'
  | 'no-experience-needed';

export type Interest =
  | 'environment'
  | 'arts-culture'
  | 'youth'
  | 'seniors'
  | 'animals'
  | 'housing-homelessness'
  | 'public-safety'
  | 'transportation'
  | 'parks-recreation'
  | 'history'
  | 'disability-access'
  | 'immigrants-language-access'
  | 'government-policy'
  | 'neighborhood';

export type Compensation =
  | 'unpaid'
  | 'stipend'
  | 'hourly-paid'
  | 'salaried'
  | 'expenses-reimbursed'
  | 'benefits-provided'; // e.g. free training, certification, meals

export type Audience =
  | 'new-to-civics'
  | 'veteran-transition'
  | 'military-family'
  | 'new-resident'
  | 'senior'
  | 'student'
  | 'family-friendly'
  | 'retiree'
  | 'professional-development'
  | 'mobility-accessible';

export interface Opportunity {
  id: string;
  name: string;
  sponsor: string;
  description: string;
  skills: Skill[];
  interests: Interest[];
  audiences: Audience[];
  hoursPerYear: { min: number; max: number };
  commitment: Commitment;
  compensation: Compensation;
  jurisdiction: Jurisdiction;
  url: string;
  applyWindow?: string; // e.g. "Apply by May 15" or "Rolling"
}

export interface Group {
  groupName: string;
  items: Topic[];
}

export interface Catalog {
  source: string;
  capturedAt: string;
  groups: Group[];
}
