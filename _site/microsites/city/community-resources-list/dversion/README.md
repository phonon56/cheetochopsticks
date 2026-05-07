# Helping Hands — DVersion (Drupal / WordPress partial)

A drop-in partial of the Helping Hands community-resources index for
Drupal or WordPress hosts. Self-contained: namespaced HTML, scoped CSS,
scoped JS — paste into a Custom Block (Drupal) or Custom HTML / WPBakery
Raw HTML element (WordPress), attach the assets, done.

## Files

```
dversion/
  build.mjs                     ← transform script (run after editing the source)
  REMEDIATION-TUTORIAL.md       ← step-by-step Drupal a11y remediation walkthrough
  dist/
    helping-hands.html          ← the partial — paste into a Custom Block
    helping-hands.css           ← scoped styles (uses CSS @scope)
    helping-hands.js            ← scoped behavior (~200 resources + filter logic)
  preview/
    index.html                  ← self-contained preview harness (open locally)
```

The source of truth is one directory up: [`../index.html`](../index.html).
Edits to the standalone flow into this partial via `node build.mjs`.

## Drupal integration (no module required)

1. **Place the assets** under your theme — e.g.
   `themes/custom/<your-theme>/microsites/helping-hands/`. Copy
   `helping-hands.css` and `helping-hands.js` over.

2. **Declare a library** in your theme's `*.libraries.yml`:
   ```yaml
   helping-hands:
     version: 1.x
     css:
       theme:
         microsites/helping-hands/helping-hands.css: {}
     js:
       microsites/helping-hands/helping-hands.js: { defer: true }
   ```

3. **Create a Custom Block** (Structure → Block layout → Custom block
   library → Add custom block), switch the body field to **Source** /
   **Full HTML**, paste the contents of `helping-hands.html`, save, and
   place the block in a region or page.

4. **Attach the library** to the block via a preprocess hook in your
   theme's `.theme` file:
   ```php
   function YOURTHEME_preprocess_block(&$variables) {
     if (($variables['elements']['#id'] ?? '') === 'helping_hands_block') {
       $variables['#attached']['library'][] = 'YOURTHEME/helping-hands';
     }
   }
   ```

5. **Place the source PDF** at a known URL in your Drupal site
   (typically `sites/default/files/Helping-Hands-Directory.pdf`) and
   either edit the four `Helping-Hands-Directory.pdf` references in the
   pasted HTML to point at that URL, or set up a redirect from the
   relative path.

That's the integration. No custom module, no Twig template, no Drupal
form API.

### Drupal ADA gotchas to know about

- **Body filter strips inline `style=`.** If your text format strips
  inline styles, the embedded SVGs in the view-toggle buttons may lose
  their dimensions. Use **Full HTML** format (admins-only) for the
  block body.
- **Body filter strips `aria-*`.** Some restrictive text formats also
  strip ARIA attributes — fatal for an accessibility-focused page. Use
  Full HTML.
- **Drupal's outer `<header>` and `<footer>` are already rendered** by
  the page template — the partial's own page header/footer are
  stripped by the build (`stripPatterns`). The crisis banner stays
  because it's page content, not chrome.
- **Skip-link is owned by Drupal's theme.** The build strips the
  page's own skip link; Drupal should already provide one targeting
  `<main id="main-content">` (the Drupal default).
- **`#main` ID collision.** The standalone page's results-section
  uses `id="main"`; the build renames it to `id="hh-main"` via the
  partial's `<div class="hh-page">` namespacing. Verify your Drupal
  theme doesn't have a third `#main`. (Drupal core's main-content
  region uses `<main id="main-content">`, not `#main`, so this is
  rarely an issue.)

## WordPress integration (works as-is, no plugin required)

Same `dist/` artifacts, different chrome.

### 1. Place the assets

```
wp-content/themes/<your-child-theme>/
  assets/helping-hands/
    helping-hands.css
    helping-hands.js
```

### 2. Enqueue in `functions.php`

```php
<?php
add_action( 'wp_enqueue_scripts', function () {
  if ( ! is_page( 'community-resources' ) ) {
    return;
  }
  $base = get_stylesheet_directory_uri() . '/assets/helping-hands';
  wp_enqueue_style(  'helping-hands', $base . '/helping-hands.css', [], '1.0.0' );
  wp_enqueue_script( 'helping-hands', $base . '/helping-hands.js',  [], '1.0.0', true );
} );
```

Adjust the page slug or swap `is_page()` for whatever match makes sense.

### 3. Insert the partial HTML

**Gutenberg:** edit page → **Custom HTML** block → paste `helping-hands.html`. Don't paste into a Paragraph or Classic block — `wpautop` will mangle it.

**WPBakery:** edit page → **+ Add Element** → **Raw HTML** → paste `helping-hands.html` → Save. WPBakery base64-encodes Raw HTML so quotes, newlines, and inline event handlers survive intact.

### 4. PDF

Upload `Helping-Hands-Directory.pdf` to the Media Library and update
the four hrefs in the pasted HTML to the WP-served URL (or rename the
uploaded file to match).

### WordPress ADA gotchas

- **Security plugins (Wordfence, iThemes Security) sometimes strip
  `onclick=`** from saved content. The pasted partial has none of these
  — every interactive element binds via `addEventListener` in the JS
  except for the form's `onsubmit="event.preventDefault(); applyFilters();"`.
  If the form re-submits despite that, the security plugin is stripping
  the inline handler. Whitelist the page or disable the rule for it.
- **`wpautop`** can inject `<p>` and `<br>` inside the partial. Custom
  HTML block (Gutenberg) suppresses it; if you must use Classic, drop
  `remove_filter( 'the_content', 'wpautop' )` for this page only.
- **CSP / inline-script blockers.** If your host sends a strict
  `connect-src` or `script-src`, the inline `<style>` and `<script>`
  in the partial will be blocked. Move them out (the dist files are
  already external — use those instead of the partial's inline blocks).

## Default vs. themed mode

Root element is `<div class="cc-helping-hands">`. Out of the box, it
**inherits the host site's typography and color** — the partial only
contributes layout, structure, and component styling.

To use the source's editorial palette (cream paper, Fraunces display,
Public Sans body, forest green and rust accents), add the `--themed`
modifier:

```html
<div class="cc-helping-hands cc-helping-hands--themed">
  …
</div>
```

In themed mode, also load the matching Google Fonts:

```yaml
# Drupal libraries.yml
    css:
      theme:
        microsites/helping-hands/helping-hands.css: {}
        'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap':
          { type: external, minified: true }
```

## How the isolation works

- **CSS:** wrapped in `@scope (.cc-helping-hands) { … }`. Universal
  selectors, bare element selectors (`h1`, `a`, `button`), and resets
  only match descendants of the partial root. `:root` custom properties
  from the source are promoted to `.cc-helping-hands { … }` and hoisted
  outside `@scope` so they actually set custom properties on the root.
- **JS:** wrapped in an IIFE rooted at the partial element. `document.
  getElementById`, `querySelector`, and `querySelectorAll` are intercepted
  by a `Proxy` and resolve against the partial root, so IDs like
  `#needInput`, `#resultsGrid`, `#categoryFilter` cannot collide with
  other elements on the host page.
- **Inline handlers:** `applyFilters` and `clearAllFilters` are
  explicitly published to `window` from inside the IIFE so the form's
  `onsubmit` and the empty-state Clear-filters button can find them.
  (The auto-detect regex only catches the first identifier in chained
  inline handlers; the explicit `window.X = X` catches the rest.)

## Browser support

CSS `@scope` is supported in Chrome 118+, Edge 118+, Safari 17.4+,
Firefox 128+ (mid-2024 onwards). If you need older browsers, run the
CSS through a PostCSS scope-polyfill plugin.

## Re-running the build

After any edit to `../index.html`:

```sh
node microsites/city/community-resources-list/dversion/build.mjs
```

Both partials regenerate. The HTML page remains the source of truth;
the DVersion is always derived — never hand-edit anything in `dist/`.
