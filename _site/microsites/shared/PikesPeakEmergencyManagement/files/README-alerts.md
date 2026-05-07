# PPROEM Civic Platform — Concept & Accessibility Audit

A constructive proposal and accessibility audit for the **Pikes Peak Regional Office of Emergency Management** alerts page at [pproem.com/alerts](https://pproem.com/alerts), prepared by an El Paso County resident.

This repository contains three things:

1. A formal **WCAG 2.1 Level AA accessibility audit** of the current alerts page
2. A working **prototype** of a parcel-keyed civic platform that addresses the structural issues the audit revealed
3. A **letter to PPROEM leadership** presenting both, in case the work is useful

> *Nothing here is a product pitch. Nothing here is for sale. The audit and the prototype are offered as civic contribution.*

---

## What's the problem?

The current PPROEM alerts page is built around three vendor products stitched together:

- An **ArcGIS** map iframe for showing alert zones
- An **Everbridge** form iframe for alert subscriptions
- A **Drupal** CMS for surrounding content

None of these systems know about each other. A resident asking "is my address under evacuation order?" has to learn three separate UIs, none of which are parcel-aware, and at least one of which (the embedded ArcGIS map) is inaccessible to assistive-technology users.

The accessibility audit identifies fifteen issues against WCAG 2.1 Level AA, of which five are critical Level A failures. The most consequential is that the embedded map — the page's primary mechanism for communicating where alerts are active — has no text-based alternative. Blind, low-vision, and keyboard-only residents cannot determine whether an active alert applies to their address.

## What's the proposed solution?

A single platform where every civic record — alert, permit, road closure, meeting item, financial line — lives on the **parcel** it affects. Any resident searches their address or parcel ID and sees everything that touches their property in plain language, in chronological order, with the underlying documents preserved.

The prototype borrows three patterns the public-safety field has already validated:

| Pattern | Source | What it does |
|---|---|---|
| Address-to-zone map | Genasys Protect (formerly Zonehaven) | Resolves an address to a zone, shows zone status |
| Address-bound subscribe | PG&E PSPS lookup | Binds notifications to a specific address, not a generic list |
| Plain-language content | Watch Duty | Translates raw alert data into actionable guidance |

The architectural contribution underneath is the **parcel as universal key** — every record in every module (alerts, permits, meetings, requests, finance) joins on parcel ID, so search across the whole platform returns everything connected to that property.

---

## What's in this repo

```
pproem-platform/
│
├── README.md                          ← you are here
├── LETTER.md                          ← kind letter to PPROEM leadership
│
├── docs/
│   └── pproem-accessibility-audit.docx  ← formal WCAG 2.1 AA audit (18 pages)
│
└── prototype/
    ├── index.html                     ← interactive version (Leaflet map, JS, full UI)
    └── email-preview.html             ← static HTML version, email-safe
```

---

## How to view the prototype

### Interactive version (recommended)

The interactive version uses real OpenStreetMap tiles via Leaflet, with simulated evacuation zones over Colorado Springs. Three demo addresses are seeded so you can see different alert states.

**Option A — view it hosted:**
[https://your-wordpress-domain.com/pproem-prototype](https://your-wordpress-domain.com/pproem-prototype)

**Option B — clone and open locally:**
```bash
git clone https://github.com/your-handle/pproem-platform.git
cd pproem-platform/prototype
open index.html        # macOS
xdg-open index.html    # Linux
```

No build step. No dependencies. The Leaflet library is loaded from CDN.

**Try these in the search box:**
- `4720 Lorson Ranch Pkwy` — shows an active evacuation order
- `8901 Black Forest Rd` — shows an evacuation warning
- `123 N Tejon St` — shows the all-clear state with property records

### Email-safe preview

`email-preview.html` is a flat, table-based HTML version with no JavaScript or iframes. It renders inside Gmail, Outlook, and Apple Mail and is intended to be embedded in correspondence so recipients can see the concept without leaving their inbox.

```bash
open prototype/email-preview.html
```

---

## How to read the audit

`docs/pproem-accessibility-audit.docx` is an 18-page formal report structured as a deliverable that can be routed through legal, IT, and procurement.

- **Sections 1–3:** Executive summary, regulatory framework (Title II, the 2024 Final Rule, the April 2026 Interim Final Rule extending the deadline to **April 26, 2027**), scope and methodology
- **Section 4:** Twelve things the page does correctly
- **Section 5:** One-page findings summary table, color-coded by severity
- **Section 6:** Detailed findings — each with a metadata strip, issue narrative, and remediation guidance
- **Sections 7–8:** Risk assessment and a phased remediation plan with hour estimates
- **Appendices:** Standards, references, conformance statement

The five critical Level A failures are estimated at 4–8 developer hours of markup work in total. The audit is offered freely for use in vendor conversations, internal planning, or wherever it's useful.

---

## Standards and references

- **Title II of the Americans with Disabilities Act** — 42 U.S.C. § 12131 et seq.
- **DOJ Final Rule** — 89 Fed. Reg. 31320 (April 24, 2024), codified at 28 CFR Part 35
- **DOJ Interim Final Rule** — 91 Fed. Reg. 16793 (effective April 20, 2026), extending compliance deadlines by one year
- **WCAG 2.1, Levels A and AA** — W3C Recommendation, the technical standard adopted by DOJ
- **Genasys Protect** — [protect.genasys.com](https://protect.genasys.com)
- **Watch Duty** — [watchduty.org](https://www.watchduty.org)

---

## Contact

This work was prepared by [Your Name], a resident of El Paso County. If you're with PPROEM, the County, or the City and would like to talk about the audit, the prototype, or the underlying architecture, the letter in `LETTER.md` is addressable to your office.

[your-email@example.com](mailto:your-email@example.com)

---

## License

The code in `prototype/` is released under the MIT License — use it, fork it, adapt it freely. The accessibility audit in `docs/` is offered to PPROEM and the relevant public entities for any internal use without attribution required.
