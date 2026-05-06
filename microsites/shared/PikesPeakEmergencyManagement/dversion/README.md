# Pikes Peak Regional EOP — DVersion (Drupal partial)

A Drupal-droppable build of the Pikes Peak Regional Emergency Operations Plan
(adopted January 2026 by El Paso County and the City of Colorado Springs).
Self-contained: namespaced HTML, scoped CSS, scoped JS — drop in, attach the
library, done.

## Files

```
dversion/
  build.mjs                    ← transform script (run after editing the source)
  dist/
    pikes-peak-eop.html        ← the partial — paste into a Custom Block
    pikes-peak-eop.css         ← scoped styles (uses CSS @scope)
    pikes-peak-eop.js          ← scoped behavior (back-to-top, TOC scroll-spy)
  preview/
    index.html                 ← self-contained preview harness
```

The source of truth lives one directory up:
`../pikes-peak-regional-eop.html`. Edits to that page flow into this partial
via `node build.mjs`. Unlike the other DVersion sources in this repo, this
one is a complete HTML document (not a `.njk` body fragment) — the build
config peels off the document-level wrappers (DOCTYPE, `<html>`, `<head>`,
`<body>`, skip link) so the partial body is only the EOP content.

## Drupal integration (no module required)

1. **Place the assets** under your theme — e.g.
   `themes/custom/<your-theme>/microsites/pikes-peak-eop/`. Copy
   `pikes-peak-eop.css` and `pikes-peak-eop.js` over.
2. **Declare a library** in your theme's `*.libraries.yml`:
   ```yaml
   pikes-peak-eop:
     version: 1.x
     css:
       theme:
         microsites/pikes-peak-eop/pikes-peak-eop.css: {}
     js:
       microsites/pikes-peak-eop/pikes-peak-eop.js: { defer: true }
   ```
3. **Create a Custom Block**, switch the body field to **Source** /
   **Full HTML**, and paste the contents of `pikes-peak-eop.html`. Place the
   block on the page (or pages) that should host the plan.
4. **Attach the library** to the block — easiest via a preprocess hook
   in your theme's `.theme` file:
   ```php
   function YOURTHEME_preprocess_block(&$variables) {
     if (($variables['elements']['#id'] ?? '') === 'pikes_peak_eop_block') {
       $variables['#attached']['library'][] = 'YOURTHEME/pikes-peak-eop';
     }
   }
   ```
   Or attach it at the page level for the route that renders this block.

That's the whole integration. No custom module, no Twig template, no Drupal
form API.

## Default vs. themed mode

The root element is `<div class="cc-pikes-peak-eop">`. Out of the box it
**inherits the host site's typography and color** — the partial only
contributes layout, structure, and component styling. This keeps the plan
feeling like part of the Drupal site.

To use the editorial palette (paper background, Fraunces display + Source
Sans 3 body, navy + rust + gold accents) the source page was designed with,
add the `--themed` modifier:

```html
<div class="cc-pikes-peak-eop cc-pikes-peak-eop--themed">
  …
</div>
```

If you go themed, load the Google Fonts the source page uses. Add to your
theme's `*.libraries.yml` under the same library:

```yaml
    css:
      theme:
        microsites/pikes-peak-eop/pikes-peak-eop.css: {}
        'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Source+Sans+3:wght@400;500;600;700&display=swap':
          { type: external, minified: true }
```

## How the isolation works

- **CSS:** the whole stylesheet is wrapped in `@scope (.cc-pikes-peak-eop) { … }`.
  Universal selectors, bare element selectors (`h1`, `a`, `table`), and
  resets only match descendants of the partial root, so they cannot bleed
  into Drupal's `<body>`, navbar, or unrelated regions. `:root` custom
  properties from the source are promoted to `.cc-pikes-peak-eop { … }` and
  hoisted *outside* `@scope` so they actually set custom properties on the
  partial root.
- **JS:** the whole script is wrapped in an IIFE rooted at the
  `.cc-pikes-peak-eop` element. `document.getElementById`,
  `document.querySelector`, and `document.querySelectorAll` are intercepted
  by a `Proxy` and resolve against the partial root, so IDs like
  `#main-content`, `#contacts`, `#esfs`, `#risk-table` cannot collide with
  other elements on the Drupal page.
- **HTML:** the `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers and
  the skip link are stripped — Drupal's outer theme provides those. The
  topbar, masthead, table of contents, all 14 sections, the appendix, the
  page footer ("About this plan" / "Contact" / "Accessibility"), and the
  back-to-top button stay.

## Things to review with the web dev

1. **The `Print` button** in the topbar calls `window.print()`. Drupal's
   print module (if installed) may want to intercept this — or it can stay
   as a plain browser print trigger.
2. **The skip link** is stripped from this partial because Drupal's outer
   theme should already provide one for the whole page. The main content
   landmark (`<main id="main-content">`) is preserved so any global skip
   link the theme provides can target it.
3. **Browser support:** CSS `@scope` is supported in Chrome 118+,
   Edge 118+, Safari 17.4+, Firefox 128+. If you need older browsers,
   we can add a PostCSS scope-polyfill step to the build.
4. **Font loading:** in default (un-themed) mode the partial inherits the
   host typography — no extra fonts needed. Only load Fraunces / Source
   Sans 3 if you opt into `--themed`.

## Accessibility & responsiveness

The build preserves the source page's accessibility and responsive behavior
verbatim — only the document-level wrappers and the skip link were stripped
(Drupal's theme replaces those):

- All ARIA attributes, `role` values, `sr-only` utilities, focus-visible
  outlines, `aria-labelledby`, `aria-current="location"` on the active
  TOC link, `aria-describedby`, and `prefers-reduced-motion` overrides
  survive intact.
- The responsive breakpoints (`@media (min-width: 640px)`,
  `@media (min-width: 720px)`, `@media (min-width: 960px)`) all transfer
  through `@scope` unchanged — the layout reflows the same way.
- The print stylesheet (hides topbar, TOC, footer; expands content;
  appends URLs after links) is preserved and still keyed to `@media print`.
- The back-to-top button's 48 × 48 px touch target is preserved.

One thing the Drupal dev should decide: the partial includes a
`<h1>Pikes Peak Regional Emergency Operations Plan</h1>` in the masthead.
If your Drupal node template already renders a page-title `<h1>`, you'll
have two on the page. Either hide the node title for pages hosting this
block, or change the masthead `<h1>` to `<h2>` in `pikes-peak-eop.html`
after pasting (the source CSS targets `.masthead h1`, so add a mirror
`.masthead h2 { … }` rule if you go that route).

## Re-running the build

After any edit to `../pikes-peak-regional-eop.html`:

```sh
node microsites/shared/PikesPeakEmergencyManagement/dversion/build.mjs
```

The HTML page remains the source of truth. The DVersion is always derived
— never hand-edit anything in `dist/`.
