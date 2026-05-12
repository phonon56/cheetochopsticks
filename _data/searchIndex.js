// _data/searchIndex.js — Eleventy global data.
//
// Walks every .njk/.md template under the project root, lifts the title /
// description / permalink from front-matter, infers a jurisdiction tier
// from the file path, and emits a flat array of search records exposed
// to templates as {{ searchIndex }}.
//
// The homepage embeds this array inline (via {{ searchIndex | dump | safe }})
// and the search UI does client-side filtering — fast, predictable, no
// API call, no Worker round-trip. ~100 records is small enough that a
// plain Array.filter beats any indexing library for this scale.
//
// Tier inference:
//   microsites/state/*            → state (Colorado)
//   microsites/national/* | FBI/* → national (Federal)
//   microsites/privatesector/*    → national (Private sector)
//   microsites/county/*           → local (El Paso County)
//   microsites/city/*             → local (Colorado Springs)
//   microsites/downtown/*         → local (Downtown districts)
//   microsites/specialdistricts/* → local (Special districts)
//   microsites/shared/*           → local (Regional / cross-jurisdiction)
//   everything else               → excluded from search

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const SKIP_DIRS = new Set([
  '.git', '_site', '_includes', '_data', 'node_modules',
  '.claude', '.github', 'shared', 'worker', 'pages',
  'federated', 'IGA_agreement'
]);

function walk(dir, out = []) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    let stat;
    try { stat = statSync(path); } catch { continue; }
    if (stat.isDirectory()) {
      walk(path, out);
    } else if (name.endsWith('.njk') || name.endsWith('.md') || name.endsWith('.html')) {
      out.push(path);
    }
  }
  return out;
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 4);
  if (end < 0) return null;
  const block = content.slice(4, end);
  const data = {};
  for (const raw of block.split('\n')) {
    const m = raw.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    // Strip surrounding quotes
    val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    // Decode common Unicode escapes from JSON-dumped front-matter
    val = val.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    data[m[1]] = val;
  }
  return data;
}

/* Parse <title> and <meta name="description"> from a plain HTML file
   that has no front-matter. Derive the permalink from the file path
   relative to the repo root. Used for BOCC docs, the infrastructure
   pages, the DATP reading room, etc. — pages that ship as-is rather
   than rendered through site.njk. */
function parsePlainHtml(content, absolutePath) {
  const titleM = content.match(/<title>([^<]+)<\/title>/i);
  if (!titleM) return null;
  const title = decodeEntities(titleM[1].trim());
  const descM = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const desc = descM ? decodeEntities(descM[1].trim()) : '';
  const rel = '/' + relative(ROOT, absolutePath).split(sep).join('/');
  return { title, description: desc, permalink: rel };
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ');
}

function tierFor(absolutePath) {
  const rel = relative(ROOT, absolutePath).split(sep);
  if (rel[0] !== 'microsites') return null;
  const j = rel[1];
  switch (j) {
    case 'state':
      return { tier: 'state', scope: 'State of Colorado' };
    case 'national':
      return { tier: 'national', scope: 'Federal' };
    case 'FBI':
      return { tier: 'national', scope: 'Federal · FBI' };
    case 'privatesector':
      return { tier: 'national', scope: 'Private sector' };
    case 'county':
      return { tier: 'local', scope: 'El Paso County' };
    case 'city':
      return { tier: 'local', scope: 'City of Colorado Springs' };
    case 'downtown':
      return { tier: 'local', scope: 'Downtown Colorado Springs' };
    case 'specialdistricts':
      return { tier: 'local', scope: 'Special districts' };
    case 'shared':
      return { tier: 'local', scope: 'Shared · cross-jurisdiction' };
    default:
      return null;
  }
}

const items = [];
const seenUrls = new Set();
for (const file of walk(ROOT)) {
  let content;
  try { content = readFileSync(file, 'utf-8'); } catch { continue; }

  /* Prefer front-matter (njk/md). Fall back to <title>/<meta description>
     for plain .html files that ship as-is (BOCC, infrastructure, DATP, etc.). */
  let record = parseFrontmatter(content);
  if (!record || !record.title || !record.permalink) {
    if (file.endsWith('.html')) {
      record = parsePlainHtml(content, file);
    } else {
      continue;
    }
  }
  if (!record || !record.title || !record.permalink) continue;

  const meta = tierFor(file);
  if (!meta) continue;

  // Skip the search index file itself + duplicates (a .njk that builds to
  // the same .html may be picked up twice if both exist on disk).
  if (record.permalink.includes('search-index')) continue;
  if (seenUrls.has(record.permalink)) continue;
  seenUrls.add(record.permalink);

  items.push({
    title: decodeEntities(record.title),
    desc: decodeEntities(record.description || ''),
    url: record.permalink,
    tier: meta.tier,
    scope: meta.scope,
  });
}

// Sort: state and federal alphabetical inside their tiers; local last (largest)
items.sort((a, b) => {
  const tierOrder = { local: 0, state: 1, national: 2 };
  const t = tierOrder[a.tier] - tierOrder[b.tier];
  if (t !== 0) return t;
  return a.title.localeCompare(b.title);
});

export default items;
