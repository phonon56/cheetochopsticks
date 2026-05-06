#!/usr/bin/env node
// CitizenConnect DVersion build — config + delegate.
// Run:  node microsites/city/CitizenConnect/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

buildDversion({
  src: resolve(HERE, '..', 'city-permits-licenses-records.njk'),
  outDir: resolve(HERE, 'dist'),
  previewDir: resolve(HERE, 'preview'),
  ns: 'cc-citizenconnect',
  fileBase: 'citizenconnect',
  prettyName: 'CitizenConnect — permits, licenses & records',
  hostNav: 'CitizenConnect',
  hostHeadline: 'Permits, Licenses &amp; Records (Drupal-hosted)',
  // Source has no inline header or footer (the Eleventy site.njk
  // layout supplies those), so nothing to strip from the body.
});
