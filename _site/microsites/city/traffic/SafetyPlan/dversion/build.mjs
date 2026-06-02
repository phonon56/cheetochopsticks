#!/usr/bin/env node
// Traffic SafetyPlan DVersion build — config + delegate.
// Three partials share this dversion/ folder. They cluster around the
// Vision Zero / safety-plan dashboards (signal-timing, traffic hub,
// red-light camera data).
// Run:  node microsites/city/traffic/SafetyPlan/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const pages = [
  {
    src: resolve(HERE, '..', 'cos-signal-timing-action.njk'),
    ns: 'cc-signal-timing',
    fileBase: 'cos-signal-timing',
    prettyName: 'Signal Timing Action Dashboard',
    hostNav: 'Traffic · Signal timing',
    hostHeadline: 'Signal Timing Action Dashboard (Drupal-hosted)',
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap',
    ],
  },
  {
    src: resolve(HERE, '..', 'cos-traffic-hub.njk'),
    ns: 'cc-traffic-hub',
    fileBase: 'cos-traffic-hub',
    prettyName: 'Colorado Springs Traffic Safety Intelligence Hub',
    hostNav: 'Traffic · Hub',
    hostHeadline: 'Traffic Safety Intelligence Hub (Drupal-hosted)',
  },
  {
    src: resolve(HERE, '..', 'red-light-data.njk'),
    ns: 'cc-red-light',
    fileBase: 'red-light-data',
    prettyName: 'Red-light Camera Data — Colorado Springs PD',
    hostNav: 'Traffic · Red-light data',
    hostHeadline: 'Red-light Camera Data (Drupal-hosted)',
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Source+Sans+3:wght@400;500;600&display=swap',
    ],
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
