import raw from './data/classifications.json';
import { groupContacts, topicContacts } from './data/contacts';
import type { Catalog, Topic, Group, VisibleField, RawField, TopicContact } from './types';

const rawCatalog = raw as unknown as Catalog;

function normalizeFields(topic: Topic): VisibleField[] {
  const out: VisibleField[] = [];
  const labelById = new Map<string, string>();
  const checkboxGroupByRawName = new Map<string, string>();

  for (const f of (topic.rawFields ?? []) as RawField[]) {
    if (f.tag === 'LABEL' && f.for && f.text) labelById.set(f.for, f.text);
    if (f.tag === 'LEGEND' && f.text) checkboxGroupByRawName.set('__last_legend__', f.text);
  }

  // Second pass on rawFields to attach group legends to checkboxes sharing a name
  let currentLegend: string | undefined;
  for (const f of (topic.rawFields ?? []) as RawField[]) {
    if (f.tag === 'LEGEND' && f.text) currentLegend = f.text;
    if (f.tag === 'INPUT' && f.type === 'checkbox' && f.name) {
      if (!checkboxGroupByRawName.has(f.name)) {
        checkboxGroupByRawName.set(f.name, currentLegend ?? '');
      }
    }
  }

  for (const f of topic.visibleFields) {
    // Fix 1: missing date name -> ObservationDate (only date hidden input seen in this catalog)
    if (f.type === 'date' && !f.name) {
      out.push({ ...f, name: 'ObservationDate', label: f.label || 'Observation Date' });
      continue;
    }

    // Fix 2: checkbox collisions on virtual1[] — expand using rawFields labels
    if (f.type === 'checkbox' && f.name && f.name.endsWith('[]')) {
      // Only expand once per collapsing group
      const already = out.find((x) => x.groupLabel && x.name.startsWith(f.name + '.'));
      if (already) continue;
      const groupLabel = checkboxGroupByRawName.get(f.name) || 'Records requested';
      const boxes = (topic.rawFields ?? []).filter(
        (r) => r.tag === 'INPUT' && r.type === 'checkbox' && r.name === f.name && r.id,
      );
      for (const b of boxes) {
        const lbl = labelById.get(b.id!) ?? b.id!;
        out.push({
          label: lbl,
          tag: 'INPUT',
          type: 'checkbox',
          name: `${f.name}.${b.id}`,
          required: false,
          groupLabel,
        });
      }
      continue;
    }

    out.push(f);
  }
  return out;
}

function resolveContact(groupName: string, topicId: string): TopicContact | undefined {
  const merged: TopicContact = {
    ...(groupContacts[groupName] ?? {}),
    ...(topicContacts[topicId] ?? {}),
  };
  return Object.keys(merged).length ? merged : undefined;
}

export const catalog: Catalog = {
  ...rawCatalog,
  groups: rawCatalog.groups.map((g: Group) => ({
    ...g,
    items: g.items.map((t) => ({
      ...t,
      visibleFields: normalizeFields(t),
      contact: resolveContact(g.groupName, t.topicId),
    })),
  })),
};

export const allTopics: Array<Topic & { group: string }> = catalog.groups.flatMap(
  (g: Group) => g.items.map((t) => ({ ...t, group: g.groupName })),
);

export const topicsById = new Map(allTopics.map((t) => [t.topicId, t]));

export function searchTopics(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allTopics.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
  );
}

export function topicRequiresLocation(t: Topic) {
  return t.visibleFields.some((f) => f.name === 'location');
}
