# Pikes Peak Regional Emergency Operations Plan

Source of truth for the Pikes Peak Regional EOP (adopted January 2026 by El
Paso County and the City of Colorado Springs).

| Path | Use case |
| --- | --- |
| [`pikes-peak-regional-eop.html`](pikes-peak-regional-eop.html) | Standalone HTML page. Open in a browser. The source the DVersion build derives from. |
| [`dversion/`](dversion/) | Drupal-handoff bundle. Generated from the source via `node dversion/build.mjs`. Same convention as the other DVersion partials in this repo. |

## DVersion conventions

This page follows the standard pattern documented in
[`microsites/_dversion-build.mjs`](../../_dversion-build.mjs) and used by
the forestry, CitizenConnect, traffic SafetyPlan, and police DVersion
bundles:

- **Namespace class.** Root is `<div class="cc-pikes-peak-eop">`. Add
  `cc-pikes-peak-eop--themed` for the source's editorial palette.
- **CSS isolation.** Whole stylesheet wrapped in
  `@scope (.cc-pikes-peak-eop) { … }`; design tokens hoisted outside
  `@scope` to set custom properties on the partial root.
- **JS isolation.** Behaviors wrapped in an IIFE; `document.*` lookups
  proxied to resolve against the partial root.
- **Build artifact.** `dversion/dist/` (HTML + CSS + JS) is the deliverable
  for the Drupal team. `dversion/preview/index.html` is a self-contained
  harness simulating a Drupal host page with a default/themed toggle.

See [`dversion/README.md`](dversion/README.md) for Drupal integration
instructions.

## Source notes

Unlike the other DVersion sources in this repo (which are `.njk` body
fragments rendered by Eleventy's `site.njk` layout), the EOP source is a
complete HTML document with its own `<head>` and inline `<style>` /
`<script>`. The DVersion build's `stripPatterns` config peels off the
document-level wrappers (DOCTYPE, `<html>`, `<head>`, `<body>`, skip link)
so the partial body is only the EOP content. Style and script blocks are
extracted *before* the strip patterns run, so they survive the wrapper
removal.

## Re-running the build

```sh
node microsites/shared/PikesPeakEmergencyManagement/dversion/build.mjs
```

After any edit to `pikes-peak-regional-eop.html`. The DVersion is always
derived — never hand-edit anything in `dversion/dist/`.
