# PPROEM — DVersion (Drupal / WordPress partials)

Two pages share this DVersion folder, both targeting the same Drupal or
WordPress site:

| `fileBase` | Source | What it is |
| --- | --- | --- |
| `pikes-peak-eop` | `../pikes-peak-regional-eop.html` | The 2026 regional Emergency Operations Plan — long-form policy doc with TOC, 14 sections, appendix. |
| `pproem-alerts` | `../pproem-alerts.html` | Live regional alerts dashboard with a Leaflet map, zone status table, address search, subscribe modal. |

Each builds an HTML partial, scoped CSS, scoped JS, and a self-contained
preview harness. Identical isolation strategy for both: CSS wrapped in
`@scope (.cc-<name>)`, JS wrapped in IIFE with `document.*` proxied to the
partial root. Drop in, attach the assets, done.

## Files

```
dversion/
  build.mjs                          ← multi-page transform (run after editing either source)
  dist/
    pikes-peak-eop.{html,css,js}     ← EOP partial
    pproem-alerts.{html,css,js}      ← Alerts partial
  preview/
    pikes-peak-eop.html              ← EOP preview harness
    pproem-alerts.html               ← Alerts preview harness
```

The sources live one directory up:
- `../pikes-peak-regional-eop.html`
- `../pproem-alerts.html`

Both are complete HTML documents (not Eleventy `.njk` body fragments), so
the build's `stripPatterns` peel off DOCTYPE / `<html>` / `<head>` /
`<body>` wrappers and the inline skip link.

> **Alerts page note** — the alerts source loads Leaflet (`leaflet.css` +
> `leaflet.js`) from unpkg in its `<head>`. Those tags are stripped along
> with the rest of `<head>`. Whichever CMS hosts the partial must load
> Leaflet alongside (CSS before `pproem-alerts.css`, JS before
> `pproem-alerts.js`). The preview harness loads Leaflet's stylesheet via
> `previewFontHrefs`, but Leaflet's JS isn't loaded in preview, so the
> map shows as a gray panel there — the partial works correctly in
> production once Leaflet is available.

---

## Drupal integration (no module required)

1. **Place the assets** under your theme — e.g.
   `themes/custom/<your-theme>/microsites/pproem/`. Copy the four
   `pikes-peak-eop.{css,js}` and `pproem-alerts.{css,js}` files over.

2. **Declare a library** in your theme's `*.libraries.yml`:
   ```yaml
   pikes-peak-eop:
     version: 1.x
     css:
       theme:
         microsites/pproem/pikes-peak-eop.css: {}
     js:
       microsites/pproem/pikes-peak-eop.js: { defer: true }

   pproem-alerts:
     version: 1.x
     css:
       theme:
         'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css':
           { type: external, minified: true }
         microsites/pproem/pproem-alerts.css: {}
     js:
       'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js':
         { type: external, minified: true, attributes: { defer: true } }
       microsites/pproem/pproem-alerts.js: { defer: true }
   ```

3. **Create a Custom Block per page**, switch the body field to **Source**
   / **Full HTML**, and paste the contents of the corresponding
   `<name>.html`.

4. **Attach the library** to the block — easiest via a preprocess hook in
   your theme's `.theme` file:
   ```php
   function YOURTHEME_preprocess_block(&$variables) {
     $id = $variables['elements']['#id'] ?? '';
     if ($id === 'pikes_peak_eop_block') {
       $variables['#attached']['library'][] = 'YOURTHEME/pikes-peak-eop';
     } elseif ($id === 'pproem_alerts_block') {
       $variables['#attached']['library'][] = 'YOURTHEME/pproem-alerts';
     }
   }
   ```
   Or attach at the page level for the route that renders each block.

That's the whole integration. No custom module, no Twig template, no
Drupal form API.

---

## WordPress integration (works as-is, no plugin required)

Same `dist/` artifacts, different chrome. The HTML partial is just a
`<div class="cc-…">` wrapper around plain HTML — WordPress will render it
in any block or shortcode that allows raw HTML.

### 1. Place the assets

Copy the CSS and JS into your child theme. Recommended layout:

```
wp-content/themes/<your-child-theme>/
  assets/
    pproem/
      pikes-peak-eop.css
      pikes-peak-eop.js
      pproem-alerts.css
      pproem-alerts.js
```

### 2. Enqueue the assets in `functions.php`

Only enqueue on pages that actually host the partial — slug-match against
the page or post you'll embed it in:

```php
<?php
add_action( 'wp_enqueue_scripts', function () {
  $base = get_stylesheet_directory_uri() . '/assets/pproem';

  // EOP — long-form plan page.
  if ( is_page( 'pikes-peak-regional-eop' ) ) {
    wp_enqueue_style(
      'pikes-peak-eop',
      $base . '/pikes-peak-eop.css',
      [],
      '1.0.0'
    );
    wp_enqueue_script(
      'pikes-peak-eop',
      $base . '/pikes-peak-eop.js',
      [],
      '1.0.0',
      true   // load in footer
    );
  }

  // Alerts — Leaflet-backed dashboard. Leaflet must load BEFORE the
  // partial's JS, so it's enqueued first with no dependency.
  if ( is_page( 'pproem-current-alerts' ) ) {
    wp_enqueue_style(
      'leaflet',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      [],
      '1.9.4'
    );
    wp_enqueue_style(
      'pproem-alerts',
      $base . '/pproem-alerts.css',
      [ 'leaflet' ],
      '1.0.0'
    );
    wp_enqueue_script(
      'leaflet',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      [],
      '1.9.4',
      true
    );
    wp_enqueue_script(
      'pproem-alerts',
      $base . '/pproem-alerts.js',
      [ 'leaflet' ],
      '1.0.0',
      true
    );
  }
} );
```

Adjust the page slugs (`pikes-peak-regional-eop`, `pproem-current-alerts`)
to match what you create in WordPress, or swap `is_page()` for whatever
match makes sense (custom post type, template name, body class).

### 3. Insert the partial HTML

WordPress accepts the partial HTML in any of three ways depending on what
editor your site uses:

#### Option A — Gutenberg / block editor (default since WP 5.0)

1. Edit the page → click **+ Add block** → search **Custom HTML**.
2. Paste the entire contents of `pproem-alerts.html` (or
   `pikes-peak-eop.html`) into the block.
3. Save / Update.

The block editor leaves the markup verbatim; class attributes, IDs, and
inline `onclick`s all survive. Don't paste into a regular **Paragraph** or
**Classic** block — those run the content through `wpautop()` which adds
spurious `<p>` tags and breaks the layout.

#### Option B — Classic editor

Switch the editor to the **Text** tab (HTML view, not Visual), paste the
partial there, and **Update**. WordPress's `wpautop` filter is suppressed
for content that's already wrapped in block-level elements — the partial's
top-level `<div class="cc-…">` qualifies, so paragraph wrapping won't be
applied. (If you see `<p>` tags creeping in around the markup, drop
`remove_filter( 'the_content', 'wpautop' );` in your `functions.php` for
the page in question.)

#### Option C — WPBakery Page Builder ("Visual Composer")

WPBakery treats raw HTML as a first-class element. Two clean ways to
embed:

**C1. Raw HTML element (recommended)**

1. Edit the page → **Backend Editor** (or **Frontend Editor**).
2. Click **+ Add Element** → search **Raw HTML**.
3. Paste the entire contents of `pproem-alerts.html` into the **Raw HTML
   content** field.
4. **Save changes** → **Update**.

WPBakery base64-encodes the Raw HTML body in the page's `vc_raw_html`
shortcode, so quotes, newlines, and inline `<style>`/`<script>` tags
inside the partial all survive untouched.

**C2. Direct shortcode (advanced)**

If you're scripting page setup, the equivalent shortcode is:

```text
[vc_row][vc_column][vc_raw_html]<base64 of partial HTML>[/vc_raw_html][/vc_column][/vc_row]
```

Generate the base64 from the partial:

```sh
base64 -w 0 dist/pproem-alerts.html
```

Wrap with `[vc_raw_html]…[/vc_raw_html]` and the row/column shortcodes
above. Insert into a post via the WP REST API or a CLI import.

> **WPBakery custom CSS / JS fields** — WPBakery Premium also exposes
> per-page **Custom CSS** and **Custom JS** fields under the page
> settings gear. You can paste the contents of the `.css` and `.js`
> files there instead of enqueueing them in `functions.php`. We
> recommend the `wp_enqueue_*` route — it's cacheable, version-busted,
> and survives WPBakery export/import roundtrips.

### 4. Verify

After publishing, view the page logged out (or in an incognito window)
and confirm:

- The `cc-pikes-peak-eop` (or `cc-pproem-alerts`) class is present on the
  outer div in **View Source**.
- The CSS file is in the `<head>` (search for `pproem` in the head HTML).
- For alerts: the map renders with markers, not a gray panel.
- Browser console is clean — no `ReferenceError` for inline handlers
  (`openSubscribe`, `switchTab`, `demoSearch`, etc.).

If the page editor stripped any inline `onclick` attributes, see "Editor
strips attributes" below.

### Common WordPress gotchas

- **Editor strips inline handlers.** Some security plugins (Wordfence,
  iThemes Security) and some themes filter `onclick=` attributes out of
  saved content. If buttons in the alerts page do nothing, check the
  saved markup in **View Source** — if `onclick` is missing, either
  whitelist the page in the plugin, or replace inline handlers with
  `data-action="openSubscribe"` and add a small `addEventListener` block
  to bind them. Easiest: use the WPBakery Raw HTML element (Option C1)
  which bypasses the editor's filter.
- **CDN / cache plugins.** WP Super Cache, W3 Total Cache, and similar
  may serve a stale version of the page after you swap in a new build.
  Purge the cache after each `node build.mjs` deploy.
- **Theme `wpautop` filter.** If you see extra `<p>` and `<br>` tags
  inside the partial, the theme is running `wpautop` over the saved
  content. Either use Gutenberg's Custom HTML block (which suppresses
  it) or `remove_filter( 'the_content', 'wpautop' );` for the slug.
- **CSP / inline-script blockers.** If the host site sends a strict
  Content-Security-Policy without `'unsafe-inline'`, the inline `<script>`
  inside the partial will be blocked. Either relax CSP for these pages,
  or enqueue `pproem-alerts.js` (which is already external) and remove
  the inline `<script>` tag from the partial body.

---

## Default vs. themed mode (Drupal and WordPress alike)

The root element is `<div class="cc-pikes-peak-eop">` (or
`cc-pproem-alerts`). Out of the box it **inherits the host site's
typography and color** — the partial only contributes layout, structure,
and component styling.

To use the source page's editorial palette and typography (Fraunces /
IBM Plex Sans / Source Sans 3), add the `--themed` modifier:

```html
<div class="cc-pikes-peak-eop cc-pikes-peak-eop--themed">
  …
</div>
```

In themed mode, also load the matching Google Fonts:

- **EOP:** `Fraunces` + `Source Sans 3` —
  `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Source+Sans+3:wght@400;500;600;700&display=swap`
- **Alerts:** `Fraunces` + `IBM Plex Sans` + `IBM Plex Mono` —
  `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap`

Add via the same library YAML (Drupal) or `wp_enqueue_style` call
(WordPress) you used for the page CSS.

---

## How the isolation works

- **CSS:** the whole stylesheet is wrapped in `@scope (.cc-…) { … }`.
  Universal selectors, bare element selectors (`h1`, `a`, `table`), and
  resets only match descendants of the partial root, so they cannot bleed
  into the host theme's `<body>`, navbar, or unrelated regions. `:root`
  custom properties from the source are promoted to `.cc-… { … }` and
  hoisted *outside* `@scope` so they actually set custom properties on
  the partial root.
- **JS:** the whole script is wrapped in an IIFE rooted at the
  `.cc-…` element. `document.getElementById`,
  `document.querySelector`, and `document.querySelectorAll` are
  intercepted by a `Proxy` and resolve against the partial root, so IDs
  like `#main-content`, `#zone-status`, `#subscribe-modal` cannot collide
  with other elements on the host page.
- **Inline handlers:** functions referenced from `onclick=`, `onsubmit=`,
  `onload=`, etc. are auto-detected and explicitly published to `window`
  inside the IIFE so HTML attribute scope can find them. The alerts page
  exposes 7 (`openSubscribe`, `closeSubscribe`, `handleSubscribe`,
  `handleSearch`, `demoSearch`, `switchTab`, `focusZone`); the EOP page
  exposes 0 (it uses `addEventListener` for everything except
  `window.print()`).
- **HTML:** the `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers and
  the skip link are stripped — the host theme provides those. The page
  body, including its own topbar / masthead / TOC / sections / footer /
  back-to-top button, is preserved.

## Things to review with the web dev

1. **The `Print` button** in the EOP topbar calls `window.print()`. Any
   print module (Drupal print, WP Print Button) may want to intercept
   this, or it can stay as a plain browser print trigger.
2. **Skip link.** Stripped from each partial because the host theme
   should already provide one for the whole page. The main content
   landmark (`<main id="main-content">` / `<div class="…-main">`) is
   preserved so any global skip link the theme provides can target it.
3. **Browser support.** CSS `@scope` is supported in Chrome 118+,
   Edge 118+, Safari 17.4+, Firefox 128+. If the host site has to support
   older browsers, we can add a PostCSS scope-polyfill step to the build.
4. **Leaflet version pinning** (alerts only). The build pins Leaflet
   1.9.4 with SRI hashes. If you need a different version, update the
   `previewFontHrefs` in `build.mjs` (CSS) and the YAML / `wp_enqueue_*`
   call (JS) to match.
5. **Heading levels.** Both partials include their own `<h1>`. If the
   host page already renders a page-title `<h1>`, you'll have two on the
   page — either hide the host title for these pages or change the
   partial's `<h1>` to `<h2>` after pasting.

## Re-running the build

After editing either source:

```sh
node microsites/shared/PikesPeakEmergencyManagement/dversion/build.mjs
```

Both partials regenerate. The HTML pages remain the source of truth; the
DVersion is always derived — never hand-edit anything in `dist/`.
