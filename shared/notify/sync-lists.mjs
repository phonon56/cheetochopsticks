#!/usr/bin/env node
// sync-lists.mjs — walk microsites/**/ and create matching Listmonk lists.
// Idempotent: only creates lists that don't exist. Safe to re-run.
//
// Usage:
//   LISTMONK_URL=https://listmonk.example.gov \
//   LISTMONK_USER=admin LISTMONK_PASS=... \
//   node shared/notify/sync-lists.mjs [--dry-run]
//
// Topic naming convention (dotted internally, dashed for Listmonk):
//   microsites/county/sheriff  →  topic: gov.county.sheriff
//                              →  Listmonk list name: "gov-county-sheriff"
// Subscribing to a parent (e.g. gov.county) means the WP/Worker layer
// fans out to every gov.county.* leaf at subscribe time.

import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..');
const MICROSITES = join(ROOT, 'microsites');
const DRY_RUN = process.argv.includes('--dry-run');

const { LISTMONK_URL, LISTMONK_USER, LISTMONK_PASS } = process.env;
if (!DRY_RUN && (!LISTMONK_URL || !LISTMONK_USER || !LISTMONK_PASS)) {
  console.error('Set LISTMONK_URL, LISTMONK_USER, LISTMONK_PASS (or pass --dry-run).');
  process.exit(1);
}

const auth = 'Basic ' + Buffer.from(`${LISTMONK_USER}:${LISTMONK_PASS}`).toString('base64');

// Folders we don't treat as jurisdictions/agencies.
const SKIP = new Set(['shared', '.DS_Store']);

async function discoverTopics() {
  const topics = new Set();
  const jurisdictions = await readdir(MICROSITES, { withFileTypes: true });
  for (const j of jurisdictions) {
    if (!j.isDirectory() || SKIP.has(j.name)) continue;
    topics.add(`gov.${j.name}`); // parent
    const agencies = await readdir(join(MICROSITES, j.name), { withFileTypes: true });
    for (const a of agencies) {
      if (!a.isDirectory() || SKIP.has(a.name)) continue;
      topics.add(`gov.${j.name}.${a.name}`);
    }
  }
  return [...topics].sort();
}

const topicToListName = (t) => t.replaceAll('.', '-').toLowerCase();

async function listmonk(method, path, body) {
  const res = await fetch(`${LISTMONK_URL}${path}`, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function fetchExistingLists() {
  // Listmonk paginates; pull all pages.
  const all = new Map(); // name → id
  let page = 1;
  while (true) {
    const { data } = await listmonk('GET', `/api/lists?page=${page}&per_page=100`);
    for (const l of data.results) all.set(l.name, l.id);
    if (data.results.length < 100) break;
    page++;
  }
  return all;
}

const topics = await discoverTopics();
console.log(`Discovered ${topics.length} topics from microsites/:`);
for (const t of topics) console.log(`  ${t}  →  ${topicToListName(t)}`);

if (DRY_RUN) { console.log('\n--dry-run: no changes made.'); process.exit(0); }

const existing = await fetchExistingLists();
let created = 0, skipped = 0;
for (const topic of topics) {
  const name = topicToListName(topic);
  if (existing.has(name)) { skipped++; continue; }
  await listmonk('POST', '/api/lists', {
    name,
    type: 'public',          // citizens can self-subscribe
    optin: 'double',         // legally clean: confirmation email required
    tags: ['gov', ...topic.split('.').slice(1)],
    description: `Auto-generated from cheetochopsticks/microsites for topic ${topic}`,
  });
  console.log(`  + created ${name}`);
  created++;
}
console.log(`\nDone. created=${created} skipped=${skipped} total=${topics.length}`);
