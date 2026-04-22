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

export interface Group {
  groupName: string;
  items: Topic[];
}

export interface Catalog {
  source: string;
  capturedAt: string;
  groups: Group[];
}
