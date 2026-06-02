#!/usr/bin/env node
// CSPD requests DVersion build — config + delegate.
// Four partials share this dversion/ folder. They cluster around the
// CSPD records-request and field-entry redesigns.
// Run:  node microsites/city/police/requests/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const pages = [
  {
    src: resolve(HERE, '..', 'cos-portal-redesign.njk'),
    ns: 'cc-portal-redesign',
    fileBase: 'cos-portal-redesign',
    prettyName: 'COS Portal Redesign',
    hostNav: 'COS · Portal redesign',
    hostHeadline: 'COS Portal Redesign (Drupal-hosted)',
    // Fonts loaded via @import in source — already hoisted by build.
  },
  {
    src: resolve(HERE, '..', 'cospd_records_page_redesign.njk'),
    ns: 'cc-cspd-records-redesign',
    fileBase: 'cspd-records-redesign',
    prettyName: 'CSPD Records — Page Redesign',
    hostNav: 'CSPD · Records redesign',
    hostHeadline: 'CSPD Records Redesign (Drupal-hosted)',
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Source+Sans+3:wght@400;500;600&display=swap',
    ],
  },
  {
    src: resolve(HERE, '..', 'cspd-field-entry-prototype.njk'),
    ns: 'cc-cspd-field-prototype',
    fileBase: 'cspd-field-entry-prototype',
    prettyName: 'CSPD Field Entry — Crash Report Prototype',
    hostNav: 'CSPD · Field entry prototype',
    hostHeadline: 'CSPD Field Entry Prototype (Drupal-hosted)',
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&display=swap',
    ],
  },
  {
    src: resolve(HERE, '..', 'cspd-field-entry.njk'),
    ns: 'cc-cspd-field-entry',
    fileBase: 'cspd-field-entry',
    prettyName: 'CSPD Field Entry v8 — Drag-Drop & Lightbox',
    hostNav: 'CSPD · Field entry',
    hostHeadline: 'CSPD Field Entry v8 (Drupal-hosted)',
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700&family=JetBrains+Mono:wght@400;500&display=swap',
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
