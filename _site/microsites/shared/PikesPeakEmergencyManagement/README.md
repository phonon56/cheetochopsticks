# Pikes Peak Regional Emergency Operations Plan

Two delivery formats of the same page, sharing identical content, identical visual design, and identical CSS naming conventions:

| Path | Use case |
| --- | --- |
| `pikes-peak-regional-eop.html` | Original draft. Preserved as-is for reference. |
| [`standalone/pikes-peak-regional-eop.html`](standalone/pikes-peak-regional-eop.html) | Single-file deliverable. Open directly in a browser. All CSS and JS inline. Naming aligned with shared system. |
| [`drupal/`](drupal/) | Drupal integration bundle. CSS, JS, Twig, and libraries.yml split into the standard module layout. |

## Naming convention map

The standalone and Drupal versions both use the same class names and tokens. They mirror the conventions in [`shared/css/main.css`](../../../shared/css/main.css) and [`shared/js/main.js`](../../../shared/js/main.js).

### Wrapper

Everything renders inside a single `<div class="eop-page">`. All CSS selectors are scoped under that wrapper, so the page is safe to load alongside any other shared library or theme without collisions.

### Tokens

| Type | Convention | Examples |
| --- | --- | --- |
| Shared, overridden inside `.eop-page` | Same name as in `shared/css/main.css`, redefined locally | `--paper`, `--ink`, `--gold`, `--navy`, `--font-display` |
| Page-specific | `--eop-` prefix | `--eop-rust`, `--eop-pine`, `--eop-rule`, `--eop-muted`, `--eop-paper-2`, `--eop-navy-hi`, `--eop-risk-{negligible,low,moderate,high}`, `--eop-font-body`, `--eop-space-1..9`, `--eop-measure`, `--eop-container` |

This means a developer reading the page sees the familiar `var(--gold)` and `var(--paper)` and gets the editorial palette inside `.eop-page`, while every other page on the site keeps the dark theme's values for those same tokens.

### Class names

BEM, prefixed with `eop-`. State classes use `is-` (matches `shared/js/main.js`).

| Component | Classes |
| --- | --- |
| Wrapper | `.eop-page` |
| Topbar | `.eop-topbar`, `.eop-topbar__inner`, `.eop-topbar__btn` |
| Masthead | `.eop-masthead`, `.eop-masthead__inner`, `.eop-masthead__eyebrow`, `.eop-masthead__lede`, `.eop-masthead__meta` |
| Layout | `.eop-layout` |
| Table of contents | `.eop-toc`, `.eop-toc__title`, `.eop-toc__list`, `.eop-toc__sub` |
| Section block | `.eop-section`, `.eop-section--wide`, `.eop-section__num` |
| Lead paragraph | `.eop-lead` |
| Callout | `.eop-callout`, `.eop-callout__label` |
| Contact card | `.eop-contact-card` |
| Hazard grid | `.eop-hazard-grid` |
| Risk table | `.eop-table-wrap`, `.eop-data-table`, `.eop-risk`, `.eop-risk--{negligible,low,moderate,high}`, `.eop-legend`, `.eop-legend__item`, `.eop-legend__swatch` |
| ESF list | `.eop-esf-list`, `.eop-esf`, `.eop-esf__num`, `.eop-esf__agencies` |
| Phases timeline | `.eop-phases` |
| Policy table | `.eop-policy-table` |
| Glossary | `.eop-glossary` |
| Divider | `.eop-divider` |
| Back-to-top | `.eop-back-to-top` (state: `.is-visible`) |
| Footer | `.eop-footer`, `.eop-footer__inner` |
| Utilities (constraints) | `.eop-measure` |

### Reused from shared

These classes are **not** redefined in the page. The standalone version provides them inline; the Drupal version expects them from `shared/css/main.css`:

- `.skip-link`
- `.sr-only`
- `:focus-visible`

### Active interactions

State is communicated through `.is-visible` and through ARIA attributes (`aria-current="location"` on the active TOC link, `aria-expanded` on the print button context). No bespoke state classes — all standard.

## What's the same across versions

- Visual design (palette, fonts, layout, spacing, typography)
- Class names and BEM modifiers
- Token names
- Behaviors (back-to-top + scroll-spy)
- Accessibility features (skip link, focus rings, scope/aria-labelledby, semantic landmarks, reduced-motion respect, print styles)

## What's different

| Aspect | Standalone | Drupal |
| --- | --- | --- |
| `<html>` / `<head>` / `<body>` | Yes | Skipped — Drupal provides them |
| Meta tags, OG, JSON-LD | Inline | Move to Metatag module or `hook_page_attachments` |
| Skip link & `.sr-only` | Inline (defined locally) | Expected from `shared/css/main.css` |
| CSS | Inline `<style>` block | External `pikes-peak-eop.css` via library |
| JS pattern | Vanilla IIFE | `Drupal.behaviors` + `core/once` |
| Static content | Hard-coded | Twig variables for masthead metadata, contact, signatories |

## Migrating from the original file

The pre-existing `pikes-peak-regional-eop.html` is preserved untouched. To replace its references in the build pipeline (Eleventy or whatever generates `_site/`), point at the standalone version under `standalone/`. The two render identically.
