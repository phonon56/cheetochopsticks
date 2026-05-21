# The Dais — Civic Calendar (Drupal module)

Custom module that renders the unified civic calendar at `/calendar` on the
coloradosprings.gov Drupal site. Aggregates:

- City Council and Planning Commission meetings (Legistar)
- Board of County Commissioners (BoCC)
- EPC development plan review (parcel-keyed projects)
- Accela permits and licensing
- PPRBD building permits
- Procurement bids and IFBs
- Regional emergency alerts (PPROEM, CSU, CDOT)
- City news, Parks releases, CSPD open-data publications
- Reference guides (CORA, permits, assessments, LDC)

Single filterable month/week/day view with a per-event drawer and topic-based
digest subscription (the same subscription object the goGov Notification
Center would persist).

This is a Drupal 9 / 10 / 11 port of the standalone microsite at
`microsites/city/CitizenConnect/Calendar/dais-calendar.html`. The standalone
is the content + UX source of truth; the module wraps it in idiomatic Drupal
so the page inherits the city theme's header, breadcrumb, footer, and
accessibility chrome.

## Install

```bash
# From your Drupal docroot
cp -R path/to/this/dais_calendar modules/custom/
drush en dais_calendar -y
drush cr
```

The page is then served at **/calendar**.

## What's inside

| File | Purpose |
| --- | --- |
| `dais_calendar.info.yml` | Module metadata |
| `dais_calendar.routing.yml` | Route for `/calendar` |
| `dais_calendar.libraries.yml` | CSS + JS asset library, plus external fonts library |
| `dais_calendar.module` | `hook_theme()` declaring the `dais_calendar_page` template |
| `src/Controller/DaisCalendarController.php` | Returns render array, attaches libraries, sets cache tags |
| `templates/dais-calendar-page.html.twig` | Page markup (theme chrome stripped) |
| `css/dais-calendar.css` | All styles, scoped to `.dais-cal` so they can't collide with the city theme |
| `js/dais-calendar.js` | Tabs, month/week/day rendering, drawer, subscribe modal, topic digest. Wrapped in `Drupal.behaviors.daisCalendar` + `once()` |

## Accessibility (WCAG 2.1 AAA)

- Palette tuned so all body text has ≥7:1 contrast against the dark
  background, and structural grid lines have ≥3:1.
- Skip link + visually-hidden `h1` (theme provides the visible page title).
- Every interactive element (filter rows, day cells, events, view switcher,
  parcel chips, connected-record items) is a native `<button>` or
  semantically labeled control with full keyboard support.
- `aria-checked` on filter rows; `aria-pressed` on the view switcher;
  `aria-expanded` on the mobile rail toggle.
- The drawer and subscribe modal:
  - Are wired with `role="dialog"`, `aria-modal="true"`, and
    `aria-labelledby` pointing at their heading.
  - Focus moves to the close button when they open and returns to the
    trigger when they close.
  - Tab and Shift+Tab are trapped inside the dialog while open.
  - `Escape` closes whichever dialog is active.
- Polite live regions announce view changes and the current record count.
- `prefers-reduced-motion` suppresses transitions and transforms.

## Differences from the standalone HTML

- **Page chrome removed.** Skip link, masthead `h1`, footer — all dropped.
  The Drupal theme supplies them through its region templates.
- **CSS is scoped to `.dais-cal`** so it cannot collide with the city
  theme's global selectors. Applied via the wrapper `<div class="dais-cal"
  data-dais-root>`.
- **JS uses `Drupal.behaviors.daisCalendar`** and `once('dais-cal', …)` so it
  survives AJAX re-renders without double-binding listeners.
- **Cache tags.** Response is cached for 30 minutes with tag
  `dais_calendar:page`. When the City wires live feeds, invalidate via
  `Cache::invalidateTags(['dais_calendar:page'])` after each feed pull.

## Wiring live feeds

Event data currently lives in `js/dais-calendar.js` as the `EVENTS` array
(records pulled and modeled 2026-05-20). The natural Drupal path forward:

1. Build a service that fetches from each source's API on a cron schedule
   (Legistar, BoCC, EPC dev-plan review, Accela, PPRBD, procurement, etc.).
2. Cache the normalized event list keyed by `dais_calendar:events`.
3. In `DaisCalendarController::page()`, fetch the cached list and attach
   via `#attached['drupalSettings']['daisCalendar']['events']`.
4. In the JS, replace the inline `EVENTS` const with `drupalSettings.daisCalendar.events`.

The data shape is documented in the standalone HTML's `EVENTS` array — every
record carries `id`, `cat`, `src`, `title`, `date {y,m,day,h?,min?}`,
`allday?`, `span?`, `dept`, `loc?`, `parcel?`, `file?`, `applicant?`,
`link`, `linkLabel?`, `ical?`, `summary`, `connected?[]`.

## Topics module

The "Subscribe" modal builds a subscription object via the inlined `Topics`
module — a byte-for-byte port of `shared/topics.ts`. Eight topics covering
public meetings, development near me, bids & contracts, public comment,
licenses & inspections, emergency closures, news, and how-to guides. Each
topic maps to a set of `(content type, source)` pairs and a `geoAware` flag
that requires a parcel ZIP match before delivering geo-scoped items.

When subscribing with the same email twice, the second save merges new
topics into the existing record rather than creating a duplicate — the
upsert behavior the Notification Center would implement server-side.
