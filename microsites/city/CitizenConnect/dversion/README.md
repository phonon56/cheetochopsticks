# CitizenConnect — DVersion (Drupal partial)

A Drupal-droppable build of the City of Colorado Springs permits, licenses,
and records lookup page. Replaces the existing per-permit static pages with
one filterable, searchable portal. Self-contained: namespaced HTML, scoped
CSS, scoped JS — drop in, attach the library, done.

## Files

```
dversion/
  build.mjs                  ← transform script (run after editing the source)
  dist/
    citizenconnect.html      ← the partial — paste into a Custom Block
    citizenconnect.css       ← scoped styles (uses CSS @scope)
    citizenconnect.js        ← scoped behavior
  preview/
    index.html               ← self-contained demo page (open in any browser)
```

The source of truth lives one directory up:
`../city-permits-licenses-records.njk`. Edits to the Eleventy Labs version
flow into this partial via `node build.mjs`.

## Drupal integration (no module required)

1. **Place the assets** under your theme — e.g.
   `themes/custom/<your-theme>/microsites/citizenconnect/`. Copy
   `citizenconnect.css` and `citizenconnect.js` over.
2. **Declare a library** in your theme's `*.libraries.yml`:
   ```yaml
   citizenconnect:
     version: 1.x
     css:
       theme:
         microsites/citizenconnect/citizenconnect.css: {}
     js:
       microsites/citizenconnect/citizenconnect.js: { defer: true }
   ```
3. **Create a Custom Block**, switch the body field to **Source** /
   **Full HTML**, and paste the contents of `citizenconnect.html`. Place
   the block on the page (or pages) that should host the portal.
4. **Attach the library** via a preprocess hook in your theme's
   `.theme` file:
   ```php
   function YOURTHEME_preprocess_block(&$variables) {
     if (($variables['elements']['#id'] ?? '') === 'citizenconnect_block') {
       $variables['#attached']['library'][] = 'YOURTHEME/citizenconnect';
     }
   }
   ```

That's the whole integration. No custom module, no Twig template, no
Drupal form API.

## Default vs. themed mode

The root element is `<div class="cc-citizenconnect">`. Out of the box it
**inherits the host site's typography and color** — the partial only
contributes layout, structure, and the CitizenConnect navy/gold accents.

To use the cheetochopsticks Inter / Libre Baskerville typography, add the
`--themed` modifier:

```html
<div class="cc-citizenconnect cc-citizenconnect--themed">
  …
</div>
```

The Google Fonts `@import` is hoisted to the top of the stylesheet so the
fonts load whenever the CSS loads. If you don't want Google Fonts, delete
the `@import` line from `citizenconnect.css` after copying it over —
themed mode will fall back to system fonts.

## How the isolation works

- **CSS:** the whole stylesheet is wrapped in
  `@scope (.cc-citizenconnect) { … }`. Universal (`*`), bare-element,
  and reset rules only match descendants of the partial root, so they
  cannot bleed into Drupal's `<body>`, navbar, or unrelated regions.
  `:root` custom properties from the source are promoted to
  `.cc-citizenconnect { … }` so they're scope-local — Drupal's own
  design tokens stay untouched. `@import` statements are hoisted to
  the top of the stylesheet (they cannot live inside `@scope`).
- **JS:** the whole script is wrapped in an IIFE rooted at the
  `.cc-citizenconnect` element. `document.getElementById`,
  `document.querySelector`, and `document.querySelectorAll` are
  intercepted by a `Proxy` and resolve against the partial root, so
  IDs and class selectors cannot collide with other elements on the
  Drupal page.
- **HTML:** the source page has no inline header or footer (the
  Eleventy `site.njk` layout supplied those), so the partial is just
  the portal body wrapped in the namespace root.

## Things to review with the web dev

1. **Browser support:** CSS `@scope` is supported in Chrome 118+,
   Edge 118+, Safari 17.4+, Firefox 128+.
2. **Routes inside the portal** (search-result links, deep-links to
   specific permits) — confirm those map to live URLs on the Drupal
   site after migration.
3. **Custom Block sanitization** — Drupal's "Full HTML" text format
   needs to allow the partial's tags, classes, and inline SVG. Adjust
   the format whitelist if anything renders stripped.

## Accessibility & responsiveness

The build preserves the source page's accessibility and responsive
behavior verbatim — every `aria-*`, `role`, `sr-only` utility, and
focus-visible outline transfers byte-for-byte. The two responsive
`@media` breakpoints and the `prefers-reduced-motion` override all
survive `@scope` wrapping unchanged.

Two notes for the Drupal dev:

- **Heading hierarchy.** The partial's top-level heading is `<h1>` (it
  was the page title in Eleventy Labs). If your Drupal node template
  also renders the page title as `<h1>`, you'll have two on the page.
  Either hide the node title on pages hosting the block, or change the
  partial's `<h1>` to `<h2>` after pasting.

- **Skip-link.** The source CSS contains a `.skip` rule (visually-hidden
  link that becomes visible on focus), but the source markup never
  included the actual `<a class="skip" href="#main">` anchor — so the
  rule is dormant. Drupal's theme should be providing its own skip-link
  in the page chrome.

## Re-running the build

After any edit to `../city-permits-licenses-records.njk`:

```sh
node microsites/city/CitizenConnect/dversion/build.mjs
```

The Eleventy Labs version remains the source of truth. The DVersion is
always derived — never hand-edit anything in `dist/`.
