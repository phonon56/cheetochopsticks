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

/* SKIP_PATHS are matched against the path relative to ROOT, not the
   bare directory name. That distinction matters: top-level "shared/"
   is the static-assets folder (logo, etc.) and we want to skip it,
   but "microsites/shared/" is the cross-jurisdictional microsite
   namespace and we very much want to index it. Path-based matching
   keeps the two cases separate. */
const SKIP_PATHS = new Set([
  '_site', '_includes', '_data', 'node_modules', 'worker', 'pages',
  'federated', 'IGA_agreement',
  'shared',              // top-level static assets (logo.svg, etc.)
]);

function walk(dir, out = []) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const path = join(dir, name);
    const rel  = relative(ROOT, path);
    if (SKIP_PATHS.has(rel)) continue;
    let stat;
    try { stat = statSync(path); } catch { continue; }
    if (stat.isDirectory()) {
      walk(path, out);
    } else if (
      name.endsWith('.njk') ||
      name.endsWith('.md') ||
      name.endsWith('.html') ||
      name.endsWith('.pdf') ||
      name.endsWith('.docx') ||
      name.endsWith('.xlsx')
    ) {
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
  /* Use a backreference so the regex closes on the same quote it opened
     on — without that, apostrophes inside the description (doesn't, etc.)
     truncate the captured text prematurely. */
  const descM = content.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i);
  const desc = descM ? decodeEntities(descM[2].trim()) : '';
  const rel = '/' + relative(ROOT, absolutePath).split(sep).join('/');
  return { title, description: desc, permalink: rel };
}

/* Synthesize a record for binary documents (.pdf/.docx/.xlsx) using
   the filename and folder context. We can't read inside the binary,
   so the title comes from "Filename_With_Underscores.pdf" →
   "Filename With Underscores" and the description names the folder
   path + the file type so a query like "schools food" still matches
   via the path-tokens corpus on the search side. */
function parseBinary(absolutePath) {
  const rel = relative(ROOT, absolutePath).split(sep);
  const filename = rel[rel.length - 1];
  const stem = filename.replace(/\.(pdf|docx|xlsx)$/i, '');
  const ext = filename.toLowerCase().split('.').pop().toUpperCase();
  /* Replace underscores/dashes with spaces and split camelCase. */
  const title = stem
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  /* Surface the folder path (without the leading "microsites") in the
     description so it shows useful context in the result card. */
  const folder = rel.slice(1, -1).join(' / ');
  return {
    title: title + ' (' + ext + ')',
    description: ext + ' document · ' + folder,
    permalink: '/' + rel.join('/'),
  };
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
  const isBinary = /\.(pdf|docx|xlsx)$/i.test(file);

  /* Skip the UTF-8 read for binaries — we only need the filename. */
  let record;
  if (isBinary) {
    record = parseBinary(file);
  } else {
    let content;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    record = parseFrontmatter(content);
    if (!record || !record.title || !record.permalink) {
      if (file.endsWith('.html')) {
        record = parsePlainHtml(content, file);
      } else {
        continue;
      }
    }
  }
  if (!record || !record.title || !record.permalink) continue;

  const meta = tierFor(file);
  if (!meta) continue;

  // Skip the search index file itself + duplicates (a .njk that builds to
  // the same .html may be picked up twice if both exist on disk).
  if (record.permalink.includes('search-index')) continue;
  // Skip developer preview/build artifacts — dversion/preview/ pages and
  // any /dist/ output that mirror real microsites for tooling reasons.
  if (/\/dversion\/preview\//.test(record.permalink)) continue;
  if (/\/dversion\/dist\//.test(record.permalink)) continue;
  if (seenUrls.has(record.permalink)) continue;
  seenUrls.add(record.permalink);

  /* Add path tokens (file/folder names) to the searchable corpus so a
     query like "roads" matches /Roads/ and "parcel" matches the
     parcel_lookup.html filename, even when the title/description don't
     happen to contain those words. Strips file extensions and breaks
     names on slashes/underscores/dashes/camelCase. */
  const pathTokens = record.permalink
    .replace(/\.(html|njk|md)$/, '')
    .split(/[\/_\-]+/)
    .map(s => s.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .filter(s => s && !/^microsites$/i.test(s))
    .join(' ');

  items.push({
    title: decodeEntities(record.title),
    desc: decodeEntities(record.description || ''),
    url: record.permalink,
    tier: meta.tier,
    scope: meta.scope,
    path: pathTokens, /* searchable, not displayed */
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
