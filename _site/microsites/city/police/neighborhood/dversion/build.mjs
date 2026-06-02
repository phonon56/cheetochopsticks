#!/usr/bin/env node
// CSPD neighborhood DVersion build — config + delegate.
// Five partials share this dversion/ folder. They're a related cluster
// of CSPD crash-data and blotter accessibility pages.
// Run:  node microsites/city/police/neighborhood/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const SERIF_AUDIT_FONTS = [
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=JetBrains+Mono:wght@400;500;600&display=swap',
];

const pages = [
  {
    src: resolve(HERE, '..', 'audit-bjpt-tkzq.njk'),
    ns: 'cc-cspd-audit',
    fileBase: 'cspd-audit-bjpt',
    prettyName: 'CSPD Crash Data — Accessibility & Quality Audit',
    hostNav: 'CSPD · Audit',
    hostHeadline: 'CSPD Audit (Drupal-hosted)',
    previewFontHrefs: SERIF_AUDIT_FONTS,
  },
  {
    src: resolve(HERE, '..', 'audit-memo-12C-consolidated.njk'),
    ns: 'cc-cspd-audit-memo',
    fileBase: 'cspd-audit-memo',
    prettyName: 'CSPD Crash Data — Consolidated Audit Memo',
    hostNav: 'CSPD · Audit memo',
    hostHeadline: 'CSPD Consolidated Audit Memo (Drupal-hosted)',
    previewFontHrefs: SERIF_AUDIT_FONTS,
  },
  {
    src: resolve(HERE, '..', 'chart_snippet-cspdblotter-weekly.njk'),
    ns: 'cc-cspd-blotter-chart',
    fileBase: 'cspd-blotter-weekly',
    prettyName: 'CSPD Weekly Blotter Chart Snippet',
    hostNav: 'CSPD · Weekly blotter',
    hostHeadline: 'CSPD Weekly Blotter Chart (Drupal-hosted)',
  },
  {
    src: resolve(HERE, '..', 'cspd_five_questions.njk'),
    ns: 'cc-cspd-questions',
    fileBase: 'cspd-five-questions',
    prettyName: 'CSPD — What residents actually ask',
    hostNav: 'CSPD · Resident questions',
    hostHeadline: 'CSPD Five Questions (Drupal-hosted)',
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    ],
  },
  {
    src: resolve(HERE, '..', 'fatality_register_bjpt-tkzq.njk'),
    ns: 'cc-cspd-fatality',
    fileBase: 'cspd-fatality-register',
    prettyName: 'CSPD Fatality Register',
    hostNav: 'CSPD · Fatality register',
    hostHeadline: 'CSPD Fatality Register (Drupal-hosted)',
    previewFontHrefs: SERIF_AUDIT_FONTS,
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
