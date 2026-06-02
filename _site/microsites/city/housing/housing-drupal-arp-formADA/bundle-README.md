---
layout: markdown.njk
permalink: "/microsites/city/housing/housing-drupal-arp-formADA/bundle-readme.html"
title: "HOME-ARP Comment Form \u2014 Drupal Webform Replacement Bundle"
description: "A WCAG 2.1 AA Drupal Webform replacement for the city's ArcGIS Survey123 HOME-ARP comment form, with bilingual EN/ES, JSON webhook, and accessibility-first design."
activeNav: "you"
---

Replacement for the ArcGIS Survey123 form currently used to collect public comments on the City of Colorado Springs HOME-ARP Allocation Plan amendment (April 24 – May 26, 2026 comment window). Built on the Drupal Webform module — accessible to WCAG 2.1 Level AA out of the box, bilingual (English + Spanish), and outputting submissions to three destinations in parallel: a JSON webhook, a staff notification email, and Drupal's native submission storage.

## See it before you import

A standalone accessible HTML preview of the form lives alongside this bundle — no Drupal needed, no submission stored, just the form as residents will see it:

> **[home-arp-form-preview.html](home-arp-form-preview.html)** — full field-for-field render of the Drupal Webform with EN/ES toggle, conditional fields, character counter, accessible error summary, and submit interception. Use it for design review, screen-reader walkthroughs, and stakeholder demos before the YAML is imported into Drupal.

## Why replace Survey123

Esri's own April 2024 Accessibility Conformance Report for ArcGIS Survey123 web acknowledges the product as "Partially Supports" on multiple WCAG 2.1 Level A and AA criteria affecting form completion: keyboard operability (2.1.1), accessible names (2.5.3, 4.1.2), focus order (2.4.3), and form labels (3.3.2). For an active 30-day federally regulated public participation process under 24 CFR 91.105, those are not acceptable gaps.

This bundle replaces the form with a city-controlled equivalent that is accessible by default, Spanish-translatable, and integrable with the city's existing record systems via JSON webhook.

## What's in this bundle

```
home_arp_form/
├── README.md                                              # this file
├── drupal/
│   ├── webform.webform.home_arp_comment.yml               # main form (English source)
│   └── language/es/
│       └── webform.webform.home_arp_comment.yml           # Spanish translation overlay
├── schema/
│   └── home_arp_submission.schema.json                    # JSON Schema 2020-12
├── receiver/
│   ├── app.py                                             # FastAPI sample webhook receiver
│   ├── requirements.txt
│   └── sample-submission.json                             # smoke test payload
└── docs/
    ├── INSTALL.md                                         # admin install/import guide
    └── LANGUAGE_PATTERN.md                                # accessible language selector pattern
```

## Quickstart

1. Read `docs/INSTALL.md` end to end (15 minutes).
2. Import the Drupal config: `drush config:import:single --source=drupal/webform.webform.home_arp_comment.yml`.
3. Edit two values in the imported form's handlers — webhook URL and Office of Accessibility email address.
4. Run the receiver locally: `cd receiver/ && pip install -r requirements.txt && uvicorn app:app --port 8080`.
5. Submit a test comment. Verify the receiver stores it and the email arrives.

Detailed steps, including bilingual setup and language switcher placement, are in `docs/INSTALL.md`.

## What this delivers

- **WCAG 2.1 Level AA accessible by default.** Native HTML form controls with programmatically associated labels, keyboard operable, accessible error messaging, ARIA live regions, no JavaScript-only interactions.
- **Bilingual (English + Spanish) with a reusable pattern.** Drupal Configuration Translation, URL-prefix language detection, accessible language switcher block. The pattern documented in `docs/LANGUAGE_PATTERN.md` is reusable for any other bilingual form on the city site.
- **Three output channels in parallel.** Every submission writes to (a) a JSON webhook for integration with the city's record system, (b) a staff notification email to Housing and Community Vitality, (c) Drupal's native submission storage for staff review and CSV export. A fourth conditional handler emails the Office of Accessibility when an accommodation is requested.
- **Inline accommodation intake.** The form's built-in accommodation request section replaces the city's current phone-only intake. Requests route directly to the Office of Accessibility with a five-business-day SLA expectation in the notification email.
- **Auditable submission contract.** The JSON Schema in `schema/` is the contract between the form and any consumer. Use it to validate submissions, generate receivers in any language, and document what the form collects.

## Integration with the broader platform vision

This form fits the architecture sketched in earlier conversation as the comment-intake leaf of a request module. Each submission becomes a record in the ticket system: type `public_comment`, source `home_arp_comment`, owner `Housing and Homelessness Response`, with the parcel field optionally populated from the ZIP-to-neighborhood lookup if the submitter provided a ZIP. The receiver's `_forward_to_record_system()` function in `app.py` is the integration seam — implement it once and every comment becomes a ticket.

When the platform's plain-language summary AI layer is in place, the same form structure surfaces a summary of the active draft amendment above the comment fields, replacing the static intro markup. Comments collected against a known draft can then be threaded back to the specific section they reference, which is a HUD-best-practice for comment-response narratives.

## Maintenance

- Update the open/close dates in the form's settings for each new comment window. This is a two-field edit in the Webform UI.
- Translation strings: maintain via Configuration Translation in the Drupal UI rather than editing the YAML overlay. The YAML in this bundle is the bootstrap, not the ongoing maintenance surface.
- Schema versioning: the JSON Schema's `$id` includes `/v1.json`. If the form's collected fields change in a way that breaks the contract, bump to `/v2.json` and version both the schema file and the webhook URL path. Don't mutate v1 in place.

## Compliance posture

Complies with:

- WCAG 2.1 Level AA (the DOJ Title II rule's adopted standard for state and local government web content)
- Section 508 of the Rehabilitation Act (via WCAG 2.1 AA conformance)
- ADA Title II (28 CFR Part 35) — equally effective communication and the codified web accessibility requirement
- 24 CFR 91.105 — HUD citizen participation rule, including the accessibility requirement at 91.105(a)(4)
- Title VI of the Civil Rights Act and HUD LEP guidance — bilingual form satisfies the vital-document obligation for the city's largest LEP population

Does not on its own satisfy:

- PDF/UA-1 for the underlying draft amendment (this is a form, not a PDF — the PDF needs separate remediation)
- Multi-language obligations beyond Spanish (Tagalog, Vietnamese, and others may be appropriate as the city's LEP analysis evolves; the pattern in this bundle extends to additional languages without code changes)
