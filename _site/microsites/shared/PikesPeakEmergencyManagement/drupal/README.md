# Pikes Peak Regional EOP — Drupal integration bundle

This folder contains the EOP page split into Drupal-friendly assets:

| File | Purpose |
| --- | --- |
| `pikes_peak_eop.libraries.yml` | Library definition. Declares the CSS/JS to attach. |
| `pikes-peak-eop.css` | All page styles, namespaced under `.eop-page`. |
| `pikes-peak-eop.js` | Back-to-top + TOC scroll-spy, wrapped in `Drupal.behaviors`. |
| `pikes-peak-eop.html.twig` | Body fragment — no `<html>`, `<head>`, or `<body>`. |

## Install

1. **Drop into a custom module.** Most common path. Create `modules/custom/pikes_peak_eop/`, copy these four files in, and add a one-line module file:

   ```php
   // modules/custom/pikes_peak_eop/pikes_peak_eop.module
   <?php
   ```

   …plus the standard `pikes_peak_eop.info.yml`:

   ```yaml
   name: 'Pikes Peak Regional EOP'
   type: module
   description: 'Renders the Pikes Peak Regional Emergency Operations Plan.'
   core_version_requirement: ^10 || ^11
   package: 'Custom'
   ```

2. **Register the template.** Either expose it as a theme hook in the `.module` file, or copy the Twig file into your theme's `templates/` directory and rename it to match a Drupal template suggestion (e.g. `node--emergency-plan.html.twig`).

3. **Enable the module** and clear caches: `drush en pikes_peak_eop -y && drush cr`.

4. **Render.** From any controller, block, or preprocess hook:

   ```php
   return [
     '#theme' => 'pikes_peak_eop',
     '#attached' => ['library' => ['pikes_peak_eop/eop']],
   ];
   ```

   Or include the Twig directly in another template:

   {% raw %}
   ```twig
   {% include '@pikes_peak_eop/pikes-peak-eop.html.twig' %}
   ```
   {% endraw %}

## Template variables

The Twig template accepts an optional `eop` object with these keys (defaults are baked in for the January 2026 plan):

{% raw %}
```twig
{
  title:         'Pikes Peak Regional Emergency Operations Plan',
  eyebrow:       'El Paso County · City of Colorado Springs · January 2026',
  lede:          '…',
  adopted:       '2026-01-16',          {# ISO date #}
  adopted_label: 'January 16, 2026',
  supersedes:    'EOP dated February 2, 2021',
  issued_by:     'PPROEM',
  coverage:      '2,127 sq. mi. · 752,772 residents',
  contact: {
    name, street, city_state_zip, phone, phone_href
  },
  signatories: [
    { authority, name, date, date_label }, …
  ]
}
```
{% endraw %}

Pass it from a preprocess hook:

```php
function pikes_peak_eop_preprocess_pikes_peak_eop(&$variables) {
  $variables['eop'] = [
    'title' => \Drupal::config('pikes_peak_eop.settings')->get('title'),
    // …
  ];
}
```

## Conventions

- **Wrapper class.** Everything renders inside `<div class="eop-page">`. The CSS file scopes every selector under that wrapper, so it's safe to load alongside any Drupal theme without selector collisions.
- **Token overrides.** Within `.eop-page`, the shared tokens `--paper`, `--ink`, `--gold`, `--navy`, and `--font-display` are overridden with editorial values. Outside `.eop-page`, the global theme keeps its values.
- **Page-specific tokens** use the `--eop-` prefix (`--eop-rust`, `--eop-pine`, `--eop-rule`, `--eop-muted`, `--eop-risk-*`, etc.).
- **State class.** Use `.is-visible` for transient state (matches the convention in `shared/js/main.js`).
- **Skip link / sr-only.** Not redefined here — Drupal's outer theme should provide them. The shared `shared/css/main.css` already has both.

## Drupal-specific gotchas to know about

- **`once`** is imported from `core/once` in `libraries.yml`. If you target Drupal < 9.4, swap to `jquery.once` and adjust the JS.
- **CKEditor stripping.** If editors paste this HTML into a CKEditor body field, the WYSIWYG filter will strip class attributes by default. Render via Twig template, not body field.
- **Sticky TOC** uses `position: sticky` with `top: 1.5rem`. If your theme uses a fixed admin toolbar (~79 px), bump the `top` value or the TOC will sit under the toolbar.
- **Print styles** hide topbar, TOC, and footer — verify against any Drupal page-level print stylesheet that may also be loading.
- **Library cache.** After editing the CSS or JS files, run `drush cr` or hit `?ays-clear-cache=1` to bust Drupal's library cache.

## What's NOT in this bundle

- The original meta tags (`<title>`, OpenGraph, Twitter, schema.org JSON-LD). Those belong in the page's `<head>` and Drupal handles them via metatag module or `hook_page_attachments`. See the standalone version for reference values.
- Skip link and `.sr-only` utility — provided by `shared/css/main.css`.
- The `<html lang="en">` declaration — Drupal sets this from the site's interface language.
