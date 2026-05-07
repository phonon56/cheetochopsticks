# ADA Remediation Walkthrough — Drupal Integration

A step-by-step guide for integrating the Helping Hands community-resources
partial into a Drupal site **without losing any of the accessibility work**
that's baked into the partial. This document is for the Drupal developer
on the receiving end of the handoff.

The partial as shipped meets WCAG 2.2 Level AA. Drupal can break that
in subtle ways — wrong text format, themes that override focus styles,
admin toolbar clobbering the skip link, etc. This walkthrough covers
the integration steps in the right order and lists the common traps,
so you ship the partial without regressions.

---

## TL;DR

1. Copy `helping-hands.{css,js}` into your custom theme.
2. Declare a library in `*.libraries.yml` and attach it via a
   preprocess hook for the page that hosts the partial.
3. Paste `helping-hands.html` into a Custom Block. **Use the Full HTML
   text format** — restricted formats strip ARIA, inline handlers, and
   the role attributes the partial relies on.
4. Upload `Helping-Hands-Directory.pdf` to the public files folder
   and update the four hrefs in the block body to point at the new URL.
5. Place the block on a page node, route, or template region.
6. Verify with the checklist at the bottom of this document.

---

## Step 1: Library declaration

Create or extend your theme's `*.libraries.yml`:

```yaml
helping-hands:
  version: 1.0.0
  css:
    theme:
      microsites/helping-hands/helping-hands.css: {}
  js:
    microsites/helping-hands/helping-hands.js: { defer: true }
  dependencies:
    - core/drupal
```

**A11y note:** the `defer` flag is important. Without it, the script
runs before the resource grid is in the DOM, the initial `applyFilters()`
call fails silently, and the page renders with `—` resources and no
content. Defer guarantees the script runs after parse but before
`DOMContentLoaded`, which is what we want.

If you want the source page's editorial palette (cream paper +
Fraunces + Public Sans), add the fonts as a separate dependency:

```yaml
helping-hands-fonts:
  version: 1.0.0
  css:
    theme:
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap':
        { type: external, minified: true }
```

…then attach `helping-hands-fonts` alongside `helping-hands` and add
the `cc-helping-hands--themed` class to the root `<div>` in the block
body.

---

## Step 2: Block creation

1. **Structure → Block layout → Custom block library → + Add custom block**
2. **Body field:** click the **Source** button (or switch text format)
   and select **Full HTML**.
3. **Paste the entire contents of `helping-hands.html`** into the body.
4. Save.

### Why Full HTML matters

Drupal's text formats run the body through a filter chain. Restricted
formats strip:

| Stripped | A11y consequence |
| --- | --- |
| `role="search"`, `role="region"`, `role="group"` | Crisis banner becomes anonymous; need-finder loses search-landmark; checkbox/chip group loses its label |
| `aria-label`, `aria-labelledby`, `aria-describedby` | Filters become "select" with no name; results region has no accessible label |
| `aria-live="polite"` | Result-count change is no longer announced to screen readers |
| `aria-pressed`, `aria-current` | Toggle buttons are unstuck — pressed state never announced |
| Inline `onsubmit`, `onclick` | Form Enter-key handler dies; clear-filters button does nothing |
| `<svg>` icon markup | View-toggle buttons render as labels-only; no visual icon |
| `class` attributes | Entire CSS scoping breaks |

Use Full HTML, restricted to admins. If the editors who manage this
block need a less-permissive role, create an "embed-only" text format
that allows everything in the partial but nothing else (use the HTML
filter's whitelist, not the blacklist).

---

## Step 3: Library attachment

Easiest is a preprocess hook in your theme's `.theme` file:

```php
<?php
function YOURTHEME_preprocess_block(&$variables) {
  $id = $variables['elements']['#id'] ?? '';
  if ($id === 'helping_hands_block') {
    $variables['#attached']['library'][] = 'YOURTHEME/helping-hands';
  }
}
```

Or attach at the page level for whatever route renders the page:

```php
function YOURTHEME_preprocess_page(&$variables) {
  $route = \Drupal::routeMatch()->getRouteName();
  if ($route === 'view.community_resources.page') {
    $variables['#attached']['library'][] = 'YOURTHEME/helping-hands';
  }
}
```

Or attach via Layout Builder's settings on the section/component
hosting the block.

---

## Step 4: PDF placement

The partial references `Helping-Hands-Directory.pdf` in four places:
the iframe `src`, the Download button, the "Open in new tab" button,
and the iframe-fallback link.

1. Upload `Helping-Hands-Directory.pdf` (1.36 MB) to
   `sites/default/files/Helping-Hands-Directory.pdf`.
2. In the block body, find/replace the four
   `Helping-Hands-Directory.pdf` references with the absolute path:
   `/sites/default/files/Helping-Hands-Directory.pdf`.

Or, alternative: rename the uploaded PDF to `helping-hands.pdf` and
do the find/replace once. Or set up a redirect from the relative path.

**A11y note:** keep the iframe's `loading="lazy"` attribute. The PDF
is 1.36 MB and lazy-loading prevents it from blocking the main page
paint, which keeps Largest Contentful Paint below the WCAG-friendly
threshold for slower connections.

---

## Step 5: Place the block

Place the block in the region your page template uses. Three common
patterns:

- **As a node body:** create a Page node, leave the body empty,
  configure the page to render this block via Layout Builder.
- **As a custom route:** create a custom route and controller that
  renders the block.
- **In a sidebar / region:** less common, since the partial is full-
  width. If the region is narrow, the partial will be cramped.

---

## Step 6: Verify against the WCAG 2.2 AA checklist

After deployment, run through this list. Each item is something the
partial gets right by default — Drupal can break each one.

### Perceivable

- [ ] **1.1.1 Non-text content.** Every `<svg>` icon has `aria-hidden="true"` (decorative) or sits inside a button with `aria-label`. View Source: search for `<svg` and `aria-`.
- [ ] **1.3.1 Info & relationships.** `<form role="search">` wraps the need finder; `<dl>` is used for the convenience-scoring legend; `<article>` for each resource card.
- [ ] **1.4.3 Contrast (minimum).** All text passes 4.5:1 against its background. **Drupal admin toolbar** can change the visible viewport — confirm contrast in front-end logged-out view.
- [ ] **1.4.10 Reflow.** Page reflows at 320 px width with no two-dimensional scrolling. **Drupal sidebar regions can break this** — render the partial full-width.
- [ ] **1.4.11 Non-text contrast.** Form input borders, focus rings, and the convenience-score dots all pass 3:1. Drupal themes that override `:focus-visible` styles break this — keep the partial's focus rules un-overridden.

### Operable

- [ ] **2.1.1 Keyboard.** All interactive elements reachable by Tab. Type in the need input, press Enter, the form submits without page reload (the `onsubmit` calls `event.preventDefault()` then `applyFilters()`).
- [ ] **2.4.1 Bypass blocks.** Drupal's theme should provide a skip link to `<main id="main-content">`. The partial has its own skip link stripped by the build.
- [ ] **2.4.4 Link purpose.** Every link has descriptive text; no "click here". The crisis-banner phone numbers are read as "Call 911", not "Call this".
- [ ] **2.4.7 Focus visible.** 3px outline on every interactive element. **Drupal themes often re-set this** — verify `:focus-visible` rules in the partial CSS aren't overridden by theme CSS that loads later.
- [ ] **2.4.13 Focus appearance (WCAG 2.2).** 2px+ thickness, 3:1 adjacent contrast. The partial uses 3px navy outline + 2px offset.
- [ ] **2.5.5 Target size (WCAG 2.2).** Buttons and link tap targets are at least 24×24 CSS pixels. Verify the chip buttons and convenience-dot labels don't shrink in narrow viewports.

### Understandable

- [ ] **3.2.2 On input.** Changing the category select doesn't navigate to a new page; same for convenience filter and view toggle. The filter selects use `change` events, not auto-submit.
- [ ] **3.3.2 Labels or instructions.** Every form control has a `<label>`. The need input's label is visually hidden but present in the DOM via the `.visually-hidden` class.

### Robust

- [ ] **4.1.2 Name, role, value.** Toggle buttons have `aria-pressed`; the active one is `aria-pressed="true"`. Filter groups use `role="group"`. The results grid is `role="region"` with `aria-live="polite"`.
- [ ] **4.1.3 Status messages (WCAG 2.1).** Result count changes are announced via `aria-live="polite"`. Verify by typing in the search and listening with NVDA / VoiceOver — you should hear "12 resources" announced when the count changes.

---

## Testing checklist

1. **Automated:** run [axe DevTools](https://www.deque.com/axe/devtools/)
   on the deployed page. Expect zero critical or serious issues. Most
   moderate issues will come from Drupal's own chrome (toolbar, footer)
   not the partial.
2. **Keyboard:** Tab through every interactive element. Confirm visible
   focus, sensible order, and Enter/Space activates buttons.
3. **Screen reader:** read the entire page with NVDA (Windows) or
   VoiceOver (Mac/iOS). Listen specifically for:
   - The crisis banner read as a region with phone numbers
   - The need-finder announced as a search landmark
   - The result count announced when filters change
   - Each resource card announced with name, status, and details
4. **Reflow:** resize browser to 320 px wide. Confirm no horizontal
   scrollbar (other than for the toolbar's filter row, which is
   intentionally horizontal-scrollable).
5. **Reduced motion:** enable Settings → Accessibility → Reduce Motion
   (Mac) or `prefers-reduced-motion` in DevTools rendering panel. The
   page should not introduce animations beyond what already exists
   (none of the partial's interactions animate).
6. **Print:** `Cmd+P` / `Ctrl+P` and verify the print preview shows
   the resource list in a readable format with the convenience dots
   visible.

---

## What to NOT do

- **Don't disable Full HTML for the block body.** Restricted formats
  break the partial.
- **Don't override `:focus-visible` in your theme** to a thinner outline
  than the partial's 3px. WCAG 2.2 SC 2.4.13 requires 2px+.
- **Don't wrap the partial in a Drupal-themed container** that re-applies
  `body`-style rules (background, font-family, color). The `@scope`
  wrapper assumes the partial's `.cc-helping-hands` element is the root
  context for those styles.
- **Don't translate via Drupal's Content Translation** without verifying
  the JS data — the resource array is in the JS, not the HTML body, so
  it's not in the translation pipeline. If you need Spanish/etc., we'd
  need to add a `lang` attribute to each resource entry and render
  conditionally. Talk to the original author first.
- **Don't strip the `loading="lazy"` from the iframe.** It's there for
  performance, which feeds Largest Contentful Paint, which feeds Core
  Web Vitals, which feeds SEO and accessibility scoring.

---

## Common bugs and fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| All resources show but filtering does nothing | JS not loaded; defer attribute missing | Verify `js: { defer: true }` in libraries.yml |
| Search input has no visible label | `.visually-hidden` class stripped | Use Full HTML format for the block body |
| "Clear all filters" button does nothing | `applyFilters` / `clearAllFilters` not on `window` | Verify `helping-hands.js` was copied verbatim — the explicit `window.X = X` lines at the bottom must remain |
| Map of phones unreadable on mobile | Theme's `body { font-family }` overrides the partial in non-themed mode | Either add `cc-helping-hands--themed` modifier, or set the theme's body font to something compatible |
| Iframe shows "Failed to load" | PDF path wrong | Verify the four `Helping-Hands-Directory.pdf` references resolve to the uploaded file |
| Crisis banner not pinned at top | Custom Block placed below other regions | Move the block to the top of its region, or use Layout Builder to anchor it above the page-title |
| Result count doesn't update on filter change | `aria-live` attribute stripped | Use Full HTML format |

---

## When to update this document

If you change the partial's:

- Class names → update the "namespace class" section in `README.md`
- ID names → update the "ID collision" warnings here
- Inline handlers → update the "applyFilters / clearAllFilters" sections
- ARIA attributes → update the WCAG checklist sections
- Required JS dependencies → update `libraries.yml` template

The next handoff is easier when this doc reflects the current state.
