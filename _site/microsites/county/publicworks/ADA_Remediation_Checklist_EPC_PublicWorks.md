# ADA / WCAG 2.1 AA Remediation Checklist
## El Paso County Public Works — companion to the May 6, 2026 audit

This checklist pairs each finding in the audit with the **person who can actually fix it**. Most items are *not* developer work — they are content edits, plugin settings, or single-line theme tweaks that the right person can complete in minutes.

The included WordPress plugin (`epc-publicworks-a11y.php`) handles the items marked **[Plugin handles]** as a triage layer until the upstream fix lands. As each upstream fix is completed, the matching shim in the plugin can be removed.

**Site stack confirmed via source inspection (May 6, 2026):**
- Theme: **The7** (`dt-the7`) with per-subdomain child themes (`epc`, `public`, `bocc`)
- Page builder: **WPBakery** (`js_composer`)
- Slider: **Slider Revolution 6.7.38**
- Forms: **Gravity Forms** + reCAPTCHA
- Tables: TablePress Premium
- Same stack confirmed across `publicworks.elpasoco.com`, `bocc.elpasoco.com`, and child subdomains

---

## Quick-win items (under 10 minutes each, no code)

These are configuration or content edits any admin can do in the WordPress dashboard.

- [ ] **F-11 — Subscribe form field labeling.** *Owner: Forms admin.*
  WP Admin → **Forms** → (subscribe form) → Email field → set **Field Label** to "Email", toggle **Required** on, save. Gravity Forms will then emit `<label for>` and `aria-required` automatically.
- [ ] **F-16 — Replace opaque accordion IDs on Road & Bridge.** *Owner: Content admin.*
  Edit the Road & Bridge page → for each accordion section in WPBakery, set **Section ID** to a human-readable slug (e.g. `mowing`, `pothole-repair`, `crack-sealing`). 14 sections, ~20 minutes total.
- [ ] **F-08 — Add "(PDF)" to PDF link text in editor.** *Owner: Content admin.*
  For every PDF link in page content, edit link text to include the format and approximate size, e.g. "El Paso County mowing list (PDF, 240 KB)". Plugin handles this at runtime sitewide; doing it in source removes the runtime cost. **[Plugin handles as fallback]**
- [ ] **F-13 — Convert phone numbers to `tel:` links in editor.** *Owner: Content admin.*
  Replace plain-text "(719) 520-7486" with a real link `<a href="tel:+17195207486">(719) 520-7486</a>` everywhere in page content. Plugin does this at runtime. **[Plugin handles as fallback]**
- [ ] **F-05 — Rewrite "here" link in Adopt-a-Road sentence.** *Owner: Content admin (Road & Bridge page).*
  Change "information can be found here" to "Information about the Adopt-a-Road program is available on the program page." **[Plugin handles]**

## Content / IA decisions

- [ ] **F-06 — Consolidate the 14 repeated "Citizen Connect" callouts** on Road & Bridge into a single page-level service-request callout, plus a persistent action in the chrome. *Owner: Content lead + UX.* Cannot be automated; requires editorial judgment.
- [ ] **F-17 — Add plain-language summaries** to long policy sections (Pothole Repair, Crack Sealing). Define inline: "mastic", "retroreflectivity", "windrows". Target 8th-grade reading level. *Owner: Content lead.*
- [ ] **F-02 — Audit every image on every page** for alt-text intent. 6 of 16 images on `bocc.elpasoco.com` had `alt=""` — some of these are legitimately decorative, some likely informative. *Owner: Content team, page-by-page.* Plugin handles only the road-bridge hero.

## Page edits on Road & Bridge specifically

- [ ] **F-07 — Remove the duplicate `<h1>`** at the top of the Road & Bridge page. Keep one. **[Plugin handles at runtime]**
- [ ] **F-15 — Skip-link target.** After F-07 is fixed, verify `#content` lands on the page H1, not above the breadcrumb. **[Plugin handles at runtime]**

## Theme / template work (developer)

- [ ] **F-04 — Search trigger in The7 header.** Replace `<a href="javascript:void(0)">` with `<button type="button" aria-label="Search">` in the theme's `header.php` (or the relevant The7 template part). The site uses child themes (`epc`, `public`, `bocc`) — override there, do not edit the parent. **[Plugin handles at runtime sitewide]**
- [ ] **F-03 — Empty header anchor.** Locate `<a href=""></a>` between the search input and logo in the masthead and remove it. Not seen in the May 2026 source pull, but the audit observed it. *Owner: Theme developer.*
- [ ] **F-19 — "Top Bar Menu" static text.** Determine intent: button, label, or CMS leakage? Mark up correctly. *Owner: Theme developer.*
- [ ] **F-12 — Brand color `#0074B7`** (4.61:1) — replace with `#005C91` (6.5:1) in the theme's primary stylesheet. *Owner: Theme developer.* **[Plugin handles via CSS override]**

## Theme + plugin replacements (project-level work)

- [ ] **F-09 — WPBakery accordion ARIA.** WPBakery does not emit `aria-expanded` / `aria-controls` / button role on accordion triggers by default. Long-term: replace WPBakery's `vc_tta_accordion` block with a properly-built disclosure pattern (WAI-ARIA Authoring Practices). Until then, **the plugin patches at runtime**.
- [ ] **F-10 — The7 mega-menu.** The7 already emits `aria-haspopup` and `aria-expanded` on parent menu links — markup is better than the audit (static-only) reported. **What's not verified: live runtime keyboard behavior.** *Action:* test with NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari on a real device, plus keyboard-only navigation. If broken, override The7's nav walker in the child theme. Do **not** layer a JS shim on top — it will fight The7's own handler.
- [ ] **F-14 — Slider Revolution 6.7.38 audit.** *Owner: Plugin admin + dev.*
  For every Slider Revolution instance: verify keyboard escape from the carousel, pause/stop controls, accessible names on dot/arrow controls, respect for `prefers-reduced-motion`. Consider replacement with Splide + a11y plugin or a native HTML carousel where instances cannot be remediated in place.

## Phase 2 — verification (cannot be skipped)

The audit was static-HTML only. These need live testing:

- [ ] Run **axe DevTools** or **WAVE** scan on Road & Bridge plus 5 representative pages.
- [ ] **Screen-reader testing:** NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari, on the Road & Bridge page and the homepage.
- [ ] **Keyboard-only walkthrough:** Tab from page top through to footer. Confirm: focus is visible at every stop, no traps in carousels, mega-menu opens with Enter and closes with Escape, accordion sections toggle with Enter/Space.
- [ ] **PDF audit:** open `El-Paso-County-Hwy-Mowing-List.pdf` and any other linked PDFs in Adobe Acrobat → Tools → Accessibility → Full Check. Remediate or replace with HTML.
- [ ] **Color contrast measurement** of all UI uses of `#0074B7` against actual rendered backgrounds with Stark or Colour Contrast Analyser.

## Compliance / legal posture

- [ ] **Date-stamp the audit on receipt.**
- [ ] **Open dated remediation tickets** in the issue tracker for each Critical and Serious finding within 7 calendar days.
- [ ] **Publish an accessibility statement** on `publicworks.elpasoco.com` (and parallel statements on each subdomain) listing known issues, the remediation timeline, and a contact for users who encounter barriers. The state's standard accessibility statement template is acceptable.
- [ ] Schedule a **re-audit** for 60 days from the start of remediation.
- [ ] Apply the same finding pattern across **all WPBakery / Slider Revolution / The7 pages** in the elpasoco.com property family — these are systemic to the platform, not unique to this page.

---

## Owner summary

| Owner | Findings | Effort |
|---|---|---|
| Content admin | F-02 (per page), F-05, F-06, F-08, F-13, F-16, F-17 | Hours, ongoing |
| Forms admin (Gravity Forms) | F-11 | 5 minutes |
| Theme developer (child theme) | F-03, F-04, F-12, F-19, F-15 (verify) | Days |
| Plugin admin / dev | F-14 (Slider Revolution), F-09 (WPBakery accordion replacement) | Weeks |
| QA / accessibility tester | All Phase 2 verification items | Days |
| Communications / legal | Accessibility statement, remediation log | Hours |

## Where the bundled plugin sits in this picture

`epc-publicworks-a11y.php` is a **temporary triage layer**. It runs in the WordPress `mu-plugins/` folder, makes no database changes, and can be removed without trace. It addresses runtime behavior so users are not blocked while the upstream items above are scheduled and completed.

The plugin should **shrink** as upstream fixes land — not grow. If a year from now the plugin is bigger than it is today, that is a signal to escalate the upstream work, not to add more shims.
