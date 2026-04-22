#!/usr/bin/env node --experimental-strip-types
import raw from '../src/data/classifications.json' with { type: 'json' };
import { mergeExtensions } from '../src/data/extensions.ts';
import { inferFacets } from '../src/data/facets.ts';

const normalized = raw.groups.map((g) => ({ ...g, items: g.items.map((t) => ({ ...t })) }));
const extended = mergeExtensions(normalized).map((g) => ({
  ...g,
  items: g.items.map((t) => ({
    ...t,
    facets: t.facets ?? inferFacets(t, g.groupName),
  })),
}));
const all = extended.flatMap((g) => g.items.map((t) => ({ ...t, group: g.groupName })));

const intents = {};
const subjects = {};
const journeys = {};
const untagged = [];

for (const t of all) {
  const f = t.facets;
  intents[f.intent] = (intents[f.intent] ?? 0) + 1;
  for (const s of f.subjects) subjects[s] = (subjects[s] ?? 0) + 1;
  for (const j of f.journeys) journeys[j] = (journeys[j] ?? 0) + 1;
  if (f.subjects.length === 0) untagged.push({ id: t.topicId, name: t.name, group: t.group, intent: f.intent });
}

console.log('total topics:', all.length);
console.log('\nintents:', intents);
console.log('\nsubjects:', subjects);
console.log('\njourneys:', journeys);
console.log('\ntopics with no subject tags (' + untagged.length + '):');
for (const u of untagged.slice(0, 30)) console.log('  ', u.id.padEnd(28), '|', u.intent.padEnd(8), '|', u.name, '(' + u.group + ')');
if (untagged.length > 30) console.log('  … and', untagged.length - 30, 'more');
