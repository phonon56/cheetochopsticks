# Pikes Peak Regional Office of Emergency Management

Two pages live in this folder, each delivered in three formats: a
standalone HTML page, a cheetochopsticks `.njk` wrapper, and a DVersion
partial bundle for Drupal / WordPress hosts.

## Pages

### 1. Pikes Peak Regional Emergency Operations Plan

Adopted January 2026 by El Paso County and the City of Colorado Springs.
Long-form policy doc: TOC, 14 sections, appendix, signatories.

| Path | Use case | Served at |
| --- | --- | --- |
| [`pikes-peak-regional-eop.html`](pikes-peak-regional-eop.html) | Standalone, self-contained — open in a browser, share offline, hand to a Drupal/WP team for reference. No cheetochopsticks chrome. | `/microsites/shared/PikesPeakEmergencyManagement/pikes-peak-regional-eop.html` |
| [`pikes-peak-regional-eop.njk`](pikes-peak-regional-eop.njk) | Eleventy template — rendered through `site.njk` so cheetochopsticks.com shows the EOP with the site nav, subscribe block, and footer. | `/microsites/shared/PikesPeakEmergencyManagement/` |
| [`dversion/dist/pikes-peak-eop.{html,css,js}`](dversion/) | Drupal/WordPress handoff bundle. Namespaced `cc-pikes-peak-eop`; scoped CSS via `@scope`; scoped JS via IIFE. | not served on cheetochopsticks.com (excluded via `.eleventyignore`) |

### 2. PPROEM Current Alerts

Live regional alerts dashboard. Leaflet map, zone status table, address
search, subscribe modal. **Wired to live data** — see "Live data
sources" below.

| Path | Use case | Served at |
| --- | --- | --- |
| [`pproem-alerts.html`](pproem-alerts.html) | Standalone, self-contained dashboard — drop into a static host. | `/microsites/shared/PikesPeakEmergencyManagement/pproem-alerts.html` |
| [`pproem-alerts.njk`](pproem-alerts.njk) | Eleventy template — rendered through `site.njk` for cheetochopsticks.com. | `/microsites/shared/PikesPeakEmergencyManagement/pproem-alerts/` |
| [`dversion/dist/pproem-alerts.{html,css,js}`](dversion/) | Drupal/WordPress handoff bundle. Namespaced `cc-pproem-alerts`. **Requires Leaflet 1.9.4 (CSS + JS)** loaded by the host before the partial JS runs. | not served on cheetochopsticks.com |

## Source of truth

For each page, the standalone `.html` is the fully-formed source. The
other two derive from it:

- The `.njk` is a body-fragment view: same `<style>` block and body
  markup, with the document-level wrappers (`DOCTYPE`, `<html>`,
  `<head>`, `<body>`, the inline skip link) and the inner
  `<main id="main-content">` removed — `site.njk` provides those. It
  adds Eleventy front-matter (title, description, `headExtras` for fonts
  + Leaflet, the `subscribeTopic` for the cheetochopsticks subscribe
  block).
- The `dversion/` build reads from each `.html` directly. Its
  `stripPatterns` config peels off the same document-level wrappers,
  re-extracts `<style>` / `<script>` blocks, and wraps the result in a
  namespaced `<div class="cc-…">` with `@scope` CSS and IIFE JS for
  drop-in safety on any host CMS.

## When you edit a page

Update the `.html` first, then mirror the change to the other two:

1. **Edit the canonical `.html`** (`pikes-peak-regional-eop.html` or
   `pproem-alerts.html`).
2. **Re-sync the matching `.njk`** — copy any changes inside the
   `<style>` block and the body content (between `<body>` and `</body>`,
   skipping the skip link, with the inner `<main id="main-content">`
   replaced by `<div class="eop-main">` for the EOP page or
   `<div class="alerts-main">` for the alerts page). Front-matter stays.
3. **Rebuild the DVersion** — one command rebuilds both partials:

   ```sh
   node microsites/shared/PikesPeakEmergencyManagement/dversion/build.mjs
   ```

The `.njk` sync is manual (a small copy/paste). If it becomes a
maintenance burden, the dversion library can be extended to also emit
`.njk` variants — but with two pages, the duplication cost is low.

## DVersion conventions

Follows the standard pattern documented in
[`microsites/_dversion-build.mjs`](../../_dversion-build.mjs) and used
by the forestry, CitizenConnect, traffic SafetyPlan, and police DVersion
bundles:

- **Namespace class.** Root is `<div class="cc-pikes-peak-eop">` or
  `<div class="cc-pproem-alerts">`. Add the matching `--themed`
  modifier for the source's editorial palette.
- **CSS isolation.** Whole stylesheet wrapped in `@scope (.cc-…)`;
  design tokens hoisted outside `@scope` to set custom properties on
  the partial root.
- **JS isolation.** Behaviors wrapped in an IIFE; `document.*` lookups
  proxied to resolve against the partial root. Inline `onclick=` /
  `onsubmit=` handlers auto-detected and exposed on `window`.
- **Build artifacts.** `dversion/dist/` is the deliverable.
  `dversion/preview/<page>.html` is a self-contained harness that
  simulates a host page with a default/themed toggle.

See [`dversion/README.md`](dversion/README.md) for both **Drupal** and
**WordPress** integration instructions (including WPBakery / Visual
Composer steps).

## Live data sources (alerts page)

The alerts page reads from four CORS-friendly public endpoints. No
auth, no API keys, no proxy — they're called directly from the browser
in production:

| Endpoint | Purpose | Notes |
| --- | --- | --- |
| `https://services3.arcgis.com/4RbSpZqACDsi1hHk/arcgis/rest/services/Hazard_Boundary/FeatureServer/0` | Active hazard zones | PPROEM-hosted ArcGIS feature service. The same feed their public viewer at [experience.arcgis.com](https://experience.arcgis.com/experience/5a3a0e8317ca46689371b0f116a3231b/) reads. Filter `where=Status='Active'` for current zones; fields include `BoundaryType`, `Event`, `Status`, `Acres`, `Comments`, `Notes`. |
| `https://gisservices.elpasoco.com/arcgis2/rest/services/HubPublic/Parcels/MapServer/0` | El Paso County parcels | Public Hub layer. Spatial query at a lat/long returns the parcel `PARCEL` ID and a `HYPERLINK` to the Spatialest property page. |
| `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` | Address → lat/long | ArcGIS World Geocoder. Free for anonymous, browser-side use. We constrain `searchExtent` to the El Paso County bbox so addresses geocode locally. |
| `https://member.everbridge.net/1772417038942752/new` | Peak Alerts opt-in | Where the **subscribe** modal sends users. PPROEM's actual push channel is Everbridge / Peak Alerts; it has no public pull API, so the page reads zone status from the ArcGIS feed (above) but writes subscriptions to Everbridge. |

### How PPROEM publishes alerts

PPROEM has two parallel alert channels:

- **Push (opt-in):** [Peak Alerts](https://member.everbridge.net/1772417038942752/new) on Everbridge — SMS, email, voice. Subscribers set their address and receive alerts that affect that location. No public pull API; the alert content lives inside Everbridge's tenant.
- **Pull (public-facing):** the [PPROEM Public Viewer](https://experience.arcgis.com/experience/5a3a0e8317ca46689371b0f116a3231b/) ArcGIS Experience reads from the `Hazard_Boundary`, `Road_Closure`, `Shelter_Public_View` feature services on `services3.arcgis.com/4RbSpZqACDsi1hHk/`. PPROEM staff edit features in those layers when they activate / clear a zone. Edits propagate to anyone querying the service in seconds.

The alerts page on this site reads the **pull** side because it's the only machine-readable source. The Subscribe button routes users to the **push** side because that's the official notification channel.

### Fallback behavior

If the live hazard fetch fails (network down, CORS hiccup, service outage), the page falls back to a small mock zone set so the page still demonstrates evacuation / warning / advisory / clear states. The status banner at the top of the page makes the data source explicit:

- **green dot, "Live data — N active hazard zones"** — pulled from PPROEM
- **green dot, "Live data — no active hazard zones"** — query succeeded but returned zero (a clear day)
- **red dot, "Demo data — couldn't reach the live PPROEM hazard feed"** — fallback in effect

Auto-refreshes every 5 minutes.

## Source notes

Unlike the other DVersion sources in this repo (which are `.njk` body
fragments rendered by Eleventy's `site.njk` layout), the PPROEM source
pages are complete HTML documents. Each exists in two forms — a
standalone `.html` AND a `.njk` that renders through `site.njk`. The
DVersion build reads the `.html`; its `stripPatterns` config peels off
the document-level wrappers (DOCTYPE, `<html>`, `<head>`, `<body>`,
skip link) so the partial body is only the page content. Style and
script blocks are extracted *before* the strip patterns run, so they
survive the wrapper removal.

The alerts page additionally loads Leaflet (`leaflet.css` +
`leaflet.js`) from unpkg. Those `<link>` and `<script>` tags are
stripped along with `<head>`. The standalone `.html` keeps them inline
and works as-is. The `.njk` puts them in `headExtras` so site.njk
includes them. The DVersion bundle drops them — the host CMS must
re-add Leaflet via its asset pipeline (Drupal library YAML or
`wp_enqueue_*` — see the dversion README).
