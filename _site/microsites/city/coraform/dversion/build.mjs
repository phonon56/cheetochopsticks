#!/usr/bin/env node
// CORA form bundle DVersion build — config + delegate.
// Two partials share one dversion/ folder because they're shipped
// together as the Drupal Webform replacement bundle.
// Run:  node microsites/city/coraform/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const pages = [
  {
    src: resolve(HERE, '..', 'cos-cora-form.njk'),
    ns: 'cc-cora-form',
    fileBase: 'cora-form',
    prettyName: 'CORA — Request a City Record',
    hostNav: 'CORA',
    hostHeadline: 'Request a City Record (Drupal-hosted)',
  },
  {
    src: resolve(HERE, '..', 'cos-cora-implementation-guide.njk'),
    ns: 'cc-cora-guide',
    fileBase: 'cora-guide',
    prettyName: 'CORA Form — Implementation Guide',
    hostNav: 'CORA · Implementation guide',
    hostHeadline: 'CORA Implementation Guide (Drupal-hosted)',
  },
];

for (const p of pages) {
  buildDversion({
    ...p,
    outDir: resolve(HERE, 'dist'),
    previewDir: resolve(HERE, 'preview'),
    previewName: p.fileBase + '.html',
  });
}
