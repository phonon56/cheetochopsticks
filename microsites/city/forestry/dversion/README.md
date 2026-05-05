# Forestry — DVersion (Drupal partial)

A Drupal-droppable build of the Trees for Colorado Springs reference page.
Replaces the existing per-tree static pages with one filterable, searchable
catalog. Self-contained: namespaced HTML, scoped CSS, scoped JS — drop in,
attach the library, done.

## Files

```
dversion/
  build.mjs                  ← transform script (run after editing the source)
  dist/
    forestry.html            ← the partial — paste into a Custom Block
    forestry.css             ← scoped styles (uses CSS @scope)
    forestry.js              ← scoped behavior (filters, modal, recommend form)
```

The source of truth lives one directory up:
`../trees-of-colorado-springs.njk`. Edits to the Eleventy Labs version flow
into this partial via `node build.mjs`.

## Drupal integration (no module required)

1. **Place the assets** under your theme — e.g.
   `themes/custom/<your-theme>/microsites/forestry/`. Copy `forestry.css`
   and `forestry.js` over.
2. **Declare a library** in your theme's `*.libraries.yml`:
   ```yaml
   forestry:
     version: 1.x
     css:
       theme:
         microsites/forestry/forestry.css: {}
     js:
       microsites/forestry/forestry.js: { defer: true }
   ```
3. **Create a Custom Block**, switch the body field to **Source** /
   **Full HTML**, and paste the contents of `forestry.html`. Place the
   block on the page (or pages) that should host the catalog.
4. **Attach the library** to the block — easiest via a preprocess hook
   in your theme's `.theme` file:
   ```php
   function YOURTHEME_preprocess_block(&$variables) {
     if (($variables['elements']['#id'] ?? '') === 'forestry_block') {
       $variables['#attached']['library'][] = 'YOURTHEME/forestry';
     }
   }
   ```
   Or, if you prefer, attach it at the page level for the route that
   renders this block.

That's the whole integration. No custom module, no Twig template, no Drupal
form API.

## Default vs. themed mode

The root element is `<div class="cc-forestry">`. Out of the box it
**inherits the host site's typography and color** — the partial only
contributes layout, structure, and component styling. This keeps the
catalog feeling like part of the Drupal site.

To use the cheetochopsticks / Tree City USA palette and Fraunces /
Public Sans typography, add the `--themed` modifier:

```html
<div class="cc-forestry cc-forestry--themed">
  …
</div>
```

(You can also flip individual variables — e.g. `--forest-deep`, `--paper`,
`--ink` — by adding rules to your theme that target `.cc-forestry`.)

If you go themed, you may want to load the Google Fonts the source page
uses. Add to your theme's `*.libraries.yml` under the same library:

```yaml
    css:
      theme:
        microsites/forestry/forestry.css: {}
        'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,500&family=Public+Sans:wght@300;400;500;600;700&display=swap':
          { type: external, minified: true }
```

## How the isolation works

- **CSS:** the whole stylesheet is wrapped in `@scope (.cc-forestry) { … }`.
  Universal selectors (`*`), bare element selectors (`h1`, `a`), and
  resets only match descendants of the partial root, so they cannot
  bleed into Drupal's `<body>`, navbar, or unrelated regions.
  `:root` custom properties from the source are promoted to
  `.cc-forestry { … }` so they're scope-local — Drupal's own design
  tokens stay untouched.
- **JS:** the whole script is wrapped in an IIFE rooted at the
  `.cc-forestry` element. `document.getElementById`,
  `document.querySelector`, and `document.querySelectorAll` are
  intercepted by a `Proxy` and resolve against the partial root, so
  IDs like `#search`, `#grid`, and `#modal` cannot collide with other
  elements on the Drupal page. The four functions referenced by inline
  `onclick` / `onsubmit` attributes (`openModal`, `closeModal`,
  `submitRec`, `copyRecToClipboard`) are explicitly published to
  `window` so HTML attribute scope can find them.
- **HTML:** the site header, breadcrumb, and footer from the Eleventy
  Labs page are stripped — Drupal's theme provides those. The catalog,
  filters, recommend form, modal, subscribe block, and SVG sprite stay.

## Things to review with the web dev

1. **The subscribe CTA links to `/preferences/?topic=gov.city.forestry`.**
   That path is from the Eleventy Labs site. Either map the same path on
   your Drupal site or edit the link in `forestry.html` after pasting.
2. **The recommend form opens a `mailto:` link** to
   `Forestry.OperationsMain@ColoradoSprings.gov`. No backend required.
3. **Browser support:** CSS `@scope` is supported in Chrome 118+,
   Edge 118+, Safari 17.4+, Firefox 128+. If you need to support older
   browsers, run the CSS through a PostCSS scope-polyfill plugin
   instead — we can add that step to the build if needed.
4. **Font loading:** in default (un-themed) mode the partial inherits
   the host typography — no extra fonts needed. Only load Fraunces /
   Public Sans if you opt into `--themed`.

## Re-running the build

After any edit to `../trees-of-colorado-springs.njk`:

```sh
node microsites/city/forestry/dversion/build.mjs
```

The Eleventy Labs version remains the source of truth. The DVersion is
always derived — never hand-edit anything in `dist/`.
