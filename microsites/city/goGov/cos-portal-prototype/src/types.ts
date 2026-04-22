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

export interface Topic {
  topicId: string;
  name: string;
  description: string;
  visibleFields: VisibleField[];
  rawFields?: RawField[];
  contact?: TopicContact;
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
