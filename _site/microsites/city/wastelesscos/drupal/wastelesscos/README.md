# WastelessCOS — Drupal module

Custom module that renders the WastelessCOS landing page (waste diversion plan,
resource directory, sorting guide) inside the City of Colorado Springs Drupal
site.

This is a Drupal 9 / 10 / 11 conversion of the standalone microsite at
`microsites/city/wastelesscos/wastelesscos.html`. The standalone HTML is the
content source of truth; this module wraps it in idiomatic Drupal so the page
inherits the city theme's header, breadcrumb, footer, and accessibility chrome.

## Install

```bash
# From your Drupal docroot
cp -R path/to/this/wastelesscos modules/custom/
drush en wastelesscos -y
drush cr
```

The page is then served at **/WastelessCOS** (matches the existing URL on
coloradosprings.gov).

## What's inside

| File | Purpose |
| --- | --- |
| `wastelesscos.info.yml` | Module metadata |
| `wastelesscos.routing.yml` | Route for `/WastelessCOS` |
| `wastelesscos.libraries.yml` | CSS + JS asset library, plus external fonts library |
| `wastelesscos.module` | `hook_theme()` declaring the `wastelesscos_page` template |
| `src/Controller/WastelessCosController.php` | Returns render array, attaches libraries, sets cache tags |
| `templates/wastelesscos-page.html.twig` | Page markup (translatable via `{{ '…'|t }}`) |
| `css/wastelesscos.css` | All styles, scoped to `.wlc` to avoid bleeding into the theme |
| `js/wastelesscos.js` | Tabs, directory filter/sort, How-to-Sort lookup, translate select. Uses `Drupal.behaviors` + `once()` |

## Differences from the standalone HTML

- **Page chrome removed.** Skip link, breadcrumb, and footer are deleted —
  the active Drupal theme supplies them via region templates.
- **CSS is scoped to `.wlc`** so it cannot collide with the city theme's
  global selectors.
- **JS uses `Drupal.behaviors.wastelessCos`** and `once('wastelesscos', …)`
  so it survives AJAX re-renders without double-binding listeners.
- **Strings are wrapped in `{{ '…'|t }}`** for translation via Drupal's
  locale system. The in-page Google Translate select remains as a quick-jump
  for visitors who land before locale negotiation kicks in.
- **Stats are passed from the controller** (`$build['#stats']`) rather than
  hard-coded in the template, so editors can adjust them via a future
  config form without touching Twig.
- **Cache tags.** Response is cached for 24 hours with tag `wastelesscos:page`.
  Invalidate via `Cache::invalidateTags(['wastelesscos:page'])` from a hook
  whenever the directory data changes.

## Editing the directory

The hauler/drop-off list lives in `js/wastelesscos.js` as the `R` array.
For a quick content edit:

1. Update the entry in `R`.
2. `drush cr` to bust the asset aggregation cache.

For a richer workflow, swap the in-file array for a config entity or JSON:API
feed. The module is structured so the controller could `#attach` the list as
`drupalSettings.wastelessCos.resources` and the JS would pick it up from
`drupalSettings` — left as a TODO since the standalone microsite is still the
authoring tool today.

## Untouched (intentionally)

- **Video block + transcript** (`#panel-overview` → "Watch:" section). The
  caption note and transcript are placeholders so the next person can drop in
  the real hosted video URL and captions file without rewriting copy.

## Accessibility

The module preserves the WCAG 2.1 AA work from the standalone microsite:

- Tab pattern with arrow / Home / End / roving `tabindex`
- `aria-live="polite"` on the directory results meta
- Visible focus rings (`outline: 3px solid var(--focus)`)
- `prefers-reduced-motion` honored
- Free filter chip has a `visually-hidden` "Free options only" label

When the city theme renders this page, verify the **theme's** masthead/footer
also pass AA — the module can't enforce that from inside.
