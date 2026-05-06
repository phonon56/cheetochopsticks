#!/usr/bin/env node
// Pikes Peak Regional EOP DVersion build — config + delegate.
// Run:  node microsites/shared/PikesPeakEmergencyManagement/dversion/build.mjs
//
// Source of truth: ../pikes-peak-regional-eop.html (a self-contained HTML
// page, not an Eleventy .njk fragment — the strip patterns peel off the
// document-level wrappers so the partial body is only the EOP content).

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

buildDversion({
  src: resolve(HERE, '..', 'pikes-peak-regional-eop.html'),
  outDir: resolve(HERE, 'dist'),
  previewDir: resolve(HERE, 'preview'),
  ns: 'cc-pikes-peak-eop',
  fileBase: 'pikes-peak-eop',
  prettyName: 'Pikes Peak Regional Emergency Operations Plan',
  hostNav: 'Office of Emergency Management',
  hostHeadline: 'Pikes Peak Regional EOP (Drupal-hosted)',
  // The source is a complete HTML document; strip the page-level
  // chrome (DOCTYPE, html, head, body wrappers) and the skip link
  // — Drupal's outer theme owns all of that. <style> and <script>
  // blocks are extracted by the shared transform before these patterns
  // run, so removing the entire <head> doesn't lose any CSS or JS.
  stripPatterns: [
    /<!DOCTYPE[^>]*>/i,
    /<html[^>]*>/i,
    /<head>[\s\S]*?<\/head>/i,
    /<body[^>]*>/i,
    /<\/body>/i,
    /<\/html>/i,
    /<a[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>/i,
  ],
  // Source loads Fraunces (display) + Source Sans 3 (body) via Google
  // Fonts in its <head>. Mirror them in the preview harness so themed
  // mode renders with real fonts; the production Drupal library YAML
  // should load these too (or rely on whatever the host theme provides).
  previewFontHrefs: [
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Source+Sans+3:wght@400;500;600;700&display=swap',
  ],
});
