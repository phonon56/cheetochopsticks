#!/usr/bin/env node
// Forestry DVersion build — config + delegate.
// Run:  node microsites/city/forestry/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

buildDversion({
  src: resolve(HERE, '..', 'trees-of-colorado-springs.njk'),
  outDir: resolve(HERE, 'dist'),
  previewDir: resolve(HERE, 'preview'),
  ns: 'cc-forestry',
  fileBase: 'forestry',
  prettyName: 'Trees for Colorado Springs',
  hostNav: 'Forestry Division',
  hostHeadline: 'Tree Reference (Drupal-hosted)',
  // Source has its own page header and forestry-specific footer that
  // Drupal's theme would replace; remove them from the partial.
  stripPatterns: [
    /<!-- =+\s*Site header[\s\S]*?<\/header>/,
    /<!-- =+\s*Forestry-specific contact footer[\s\S]*?<\/footer>/,
  ],
});
