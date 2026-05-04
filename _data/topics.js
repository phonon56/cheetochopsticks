// _data/topics.js — Eleventy global data.
// Walks microsites/{jurisdiction}/{agency}/ and exports the topic tree
// so the preferences page can render checkboxes without hardcoding the list.
//
// Topic name format mirrors shared/notify/sync-lists.mjs:
//   gov.{jurisdiction}.{agency}
//
// Available in any template as {{ topics }}.

import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MICROSITES = join(HERE, '..', 'microsites');
const SKIP_JURISDICTIONS = new Set(['shared']);
const SKIP_FILES = new Set(['.DS_Store']);

// Light-touch humanization for display labels. Falls back to the raw folder
// name for acronyms / mixed case (CSPD, FBI, BOCC, CDPHE) — those read fine
// as-is. Everything else gets title-cased and camelCase split.
function humanize(name) {
  if (/^[A-Z0-9_-]+$/.test(name)) return name;          // pure acronym: CSPD, DOJ
  if (/[A-Z]/.test(name) && /[a-z]/.test(name)) {       // mixed: LorsonRanch
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function listDirs(path) {
  try {
    return readdirSync(path)
      .filter((n) => !SKIP_FILES.has(n))
      .filter((n) => statSync(join(path, n)).isDirectory());
  } catch { return []; }
}

const groups = [];
for (const j of listDirs(MICROSITES).sort()) {
  if (SKIP_JURISDICTIONS.has(j)) continue;
  const agencies = [];
  for (const a of listDirs(join(MICROSITES, j)).sort()) {
    agencies.push({
      topic: `gov.${j}.${a}`,
      slug: a,
      label: humanize(a),
    });
  }
  if (agencies.length) groups.push({
    jurisdiction: j,
    label: humanize(j),
    agencies,
  });
}

export default groups;
