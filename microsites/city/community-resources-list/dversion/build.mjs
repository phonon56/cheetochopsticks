#!/usr/bin/env node
// Helping Hands DVersion build — config + delegate.
// Run:  node microsites/city/community-resources-list/dversion/build.mjs
//
// Source of truth: ../index.html (the standalone Helping Hands page).
// The shared transform extracts the inline <style> and <script> blocks,
// wraps the CSS in @scope (.cc-helping-hands), wraps the JS in an IIFE
// with a document.* Proxy rooted at the partial element, auto-detects
// inline on* handlers (chip clicks, view toggle, clear-filters) and
// exposes them on window. Page-level chrome (skip link, brand header,
// page footer) is stripped — the host CMS provides those.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDversion } from '../../../_dversion-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

buildDversion({
  src: resolve(HERE, '..', 'index.html'),
  outDir: resolve(HERE, 'dist'),
  previewDir: resolve(HERE, 'preview'),
  ns: 'cc-helping-hands',
  fileBase: 'helping-hands',
  prettyName: 'Helping Hands — Community Resources Index',
  hostNav: 'Community Resources',
  hostHeadline: 'Helping Hands (Drupal-hosted)',
  // The source is a complete HTML document; strip document-level
  // wrappers and the page chrome the host CMS owns. Crisis banner
  // and the .hh-page wrapper STAY — those are page content.
  stripPatterns: [
    /<!DOCTYPE[^>]*>/i,
    /<html[^>]*>/i,
    /<head>[\s\S]*?<\/head>/i,
    /<body[^>]*>/i,
    /<\/body>/i,
    /<\/html>/i,
    /<a[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>/i,
    /<header class="site-header">[\s\S]*?<\/header>/,
    /<footer>[\s\S]*?<\/footer>/,
    // The .hh-page wrapper itself is redundant inside the dversion's
    // @scope (.cc-helping-hands) wrapper — strip the opening and the
    // matching closing tag (with its trailing comment).
    /<div class="hh-page">\s*/,
    /<\/div><!--\s*\/\.hh-page\s*-->\s*/,
  ],
  // Source loads Fraunces (display) + Public Sans (body) via Google
  // Fonts in <head>. Mirror them in the preview harness so themed mode
  // renders with real fonts; production Drupal/WordPress hosts must
  // load the same fonts in their library config.
  previewFontHrefs: [
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap',
  ],
});
