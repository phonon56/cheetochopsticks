#!/usr/bin/env node
// PPROEM DVersion build — config + delegate.
// Two partials share this dversion/ folder:
//   1. pikes-peak-regional-eop  — the regional EOP document
//   2. pproem-alerts            — the live regional alerts dashboard (Leaflet map)
//
// Both sources are self-contained HTML documents (not Eleventy .njk
// fragments), so each entry's strip patterns peel off the document-level
// wrappers to leave only the partial body.
//
// Run:  node microsites/shared/PikesPeakEmergencyManagement/dversion/build.mjs

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

// Strip patterns are identical for both pages: peel off document-level
// chrome (DOCTYPE, <html>, <head>, <body> wrappers) and the inline skip
// link. The shared transform extracts <style> and <script> blocks BEFORE
// these patterns run, so removing the entire <head> doesn't lose CSS or JS.
const documentWrapperStrips = [
  /<!DOCTYPE[^>]*>/i,
  /<html[^>]*>/i,
  /<head>[\s\S]*?<\/head>/i,
  /<body[^>]*>/i,
  /<\/body>/i,
  /<\/html>/i,
  /<a[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>/i,
];

const pages = [
  {
    src: resolve(HERE, '..', 'pikes-peak-regional-eop.html'),
    ns: 'cc-pikes-peak-eop',
    fileBase: 'pikes-peak-eop',
    prettyName: 'Pikes Peak Regional Emergency Operations Plan',
    hostNav: 'Office of Emergency Management',
    hostHeadline: 'Pikes Peak Regional EOP (Drupal-hosted)',
    stripPatterns: documentWrapperStrips,
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Source+Sans+3:wght@400;500;600;700&display=swap',
    ],
  },
  {
    src: resolve(HERE, '..', 'pproem-alerts.html'),
    ns: 'cc-pproem-alerts',
    fileBase: 'pproem-alerts',
    prettyName: 'PPROEM Current Alerts',
    hostNav: 'Office of Emergency Management',
    hostHeadline: 'PPROEM Current Alerts (Drupal-hosted)',
    // Document wrappers + the page's own brand-bar header and bottom
    // footer. Drupal/WordPress hosts already provide site nav and
    // footer; rendering the page's own chrome would stack two headers
    // and double up the "Alerts" CTA.
    stripPatterns: [
      ...documentWrapperStrips,
      /<header class="topbar">[\s\S]*?<\/header>/,
      /<footer class="footer">[\s\S]*?<\/footer>/,
    ],
    // The alerts page also loads Leaflet (CSS + JS) from unpkg in its
    // <head>. Those tags are stripped along with the rest of <head>
    // — the production Drupal library YAML must add them back, e.g.
    //   pproem-alerts:
    //     css:
    //       theme:
    //         microsites/pproem-alerts/pproem-alerts.css: {}
    //         'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css':
    //           { type: external, minified: true }
    //     js:
    //       'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js':
    //         { type: external, minified: true }
    //       microsites/pproem-alerts/pproem-alerts.js: { defer: true }
    // The preview harness loads Leaflet inline below — see preview note.
    previewFontHrefs: [
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      // Leaflet's stylesheet — needed for map controls and marker icons
      // to render. The CSS is hoisted alongside fonts; the JS goes via
      // previewExtraScripts below.
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    ],
    previewExtraScripts: [
      // Leaflet's JS must load before the partial's IIFE so `L.map(…)`
      // resolves. SRI hash + crossorigin match the production Drupal /
      // WordPress library configuration documented in dversion/README.md.
      {
        src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        attrs: {
          integrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
          crossorigin: '',
        },
      },
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
