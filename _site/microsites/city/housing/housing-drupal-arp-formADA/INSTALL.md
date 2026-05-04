---
layout: markdown.njk
permalink: "/microsites/city/housing/housing-drupal-arp-formADA/install.html"
title: "HOME-ARP Comment Webform \u2014 Install Guide"
description: "Step-by-step Drupal admin installation guide for the HOME-ARP Comment Webform bundle."
activeNav: "you"
---

This guide is for a Drupal site administrator with a working Drupal 10 (or 11) installation. Estimated time: 30–45 minutes for a clean install, plus translation review.

## 1. Required modules

Enable these modules. All are widely deployed; none require custom code.

| Module | Source | Purpose |
|---|---|---|
| Webform | contrib (`drupal/webform`) | The form itself |
| Webform Translation | bundled with Webform | Per-form translation glue |
| Language | core | Adds languages to the site |
| Configuration Translation | core | Translates configuration entities |
| Interface Translation | core | Translates UI strings |
| File | core | Attachment uploads |
| Token | contrib (`drupal/token`) | Email body templating (a Webform dep) |
| Key (recommended) | contrib (`drupal/key`) | Stores the webhook shared secret outside config |

Install with Composer if not already present:

```bash
composer require drupal/webform drupal/token drupal/key
drush en webform webform_translation language config_translation locale file token key
```

## 2. Add Spanish as a site language

```
Admin → Configuration → Regional and language → Languages → Add language → Spanish (es)
```

Then enable URL-prefix detection (recommended for accessibility, SEO, and shareability):

```
Admin → Configuration → Regional and language → Detection and selection
  Enable: URL
  Order: URL > Browser > Selected language
```

Confirm `/admin/config/regional/language/detection/url` shows `Path prefix: en, es`.

## 3. Import the form

There are three options. Pick whichever fits your workflow.

**Option A: Configuration sync (recommended for environments with proper config management).**

```bash
# Place file
cp drupal/webform.webform.home_arp_comment.yml \
   <site>/sites/default/files/config_*/sync/webform.webform.home_arp_comment.yml
cp drupal/language/es/webform.webform.home_arp_comment.yml \
   <site>/sites/default/files/config_*/sync/language/es/webform.webform.home_arp_comment.yml

drush config:import
```

**Option B: Drush single-config import.**

```bash
drush config:import:single --source=drupal/webform.webform.home_arp_comment.yml
drush config:import:single \
  --source=drupal/language/es/webform.webform.home_arp_comment.yml \
  --partial
```

**Option C: Admin UI (no Drush).**

```
Admin → Structure → Webforms → + Add webform
  Title: HOME-ARP Allocation Plan — Public Comment
  Machine name: home_arp_comment
  Save
```

Then on the new form:

```
Settings → Source (YAML) tab
  Paste the contents of drupal/webform.webform.home_arp_comment.yml
  Save
```

For the Spanish version via UI:

```
Translate tab → Spanish → Edit
  Translate each label, description, and option using the strings in
  drupal/language/es/webform.webform.home_arp_comment.yml as a reference.
  Save
```

## 4. Configure the webhook

After import, edit the `json_webhook` handler:

```
Admin → Structure → Webforms → HOME-ARP → Settings → Emails / Handlers
  Edit "JSON webhook to record system"
  Completed URL:    https://<your-receiver-host>/webhook/home-arp-comment
  Custom options:
    headers:
      X-Webform-Source: 'cos-home-arp-comment'
      X-Webform-Secret: '<your-secret>'      # or use a Key module reference
```

Recommended: store the secret with the Key module (`/admin/config/system/keys`) and reference it in the handler instead of hardcoding. This keeps the secret out of exported config and rotation becomes a one-step operation.

## 5. Configure the email recipients

Edit the `email_notification` handler:

```
To: CityHousingAndCommunityVitality@coloradosprings.gov   (already set)
```

Edit the `accessibility_routing` handler:

```
To: <office-of-accessibility@coloradosprings.gov>
```

Replace `CHANGE-ME-office-of-accessibility@coloradosprings.gov` with the real address. This handler only fires when the submitter checks the "I need an alternate format or accommodation" box — it is the inline replacement for the city's current phone-only accommodation intake.

## 6. Place the form on a page

Two patterns work; pick one.

**Pattern A: Webform-owned page (simplest).** The form's settings already specify `page_submit_path: /home-arp-comment` and `page_confirm_path: /home-arp-comment/confirmation`. Drupal serves the form at those paths automatically. You'll get bilingual URLs `/en/home-arp-comment` and `/es/home-arp-comment` once URL-prefix detection is enabled.

**Pattern B: Block on an existing page.** Place the Webform Submission Form block on whatever node hosts the public comment instructions:

```
Admin → Structure → Block layout → Place block → Webform Submission Form
  Webform: HOME-ARP Allocation Plan — Public Comment
  Region: Content
  Visibility: Pages → /node/<NID-of-HOME-ARP-page>
```

## 7. Place the language switcher

Two important accessibility choices for the switcher.

**(a) Use `<a>` elements, not buttons.** Drupal core's Language switcher block does this correctly out of the box. Don't replace it with a `<select>` styled to look like a dropdown — that creates focus and announcement issues for screen readers.

**(b) Render each language name in its own language.** "English" and "Español," not "Inglés" and "Spanish." Drupal core does this when languages are configured with their native names. Verify at `/admin/config/regional/language` that Spanish is listed with the native name `Español`.

Place the block in the site header:

```
Admin → Structure → Block layout → <Header region> → Place block
  Block: Language switcher
  Visibility: All pages (or restrict if needed)
```

The reusable accessible pattern is documented in `docs/LANGUAGE_PATTERN.md`.

## 8. Run the receiver

The reference receiver in `receiver/` is the smallest deployable example.

```bash
cd receiver/
pip install -r requirements.txt
export HOMEARP_WEBHOOK_SECRET='<same-value-as-Drupal-handler>'
export HOMEARP_STORAGE_DIR='/var/lib/home-arp-submissions'
uvicorn app:app --host 127.0.0.1 --port 8080
```

Production deployment notes are at the top of `receiver/app.py`. At minimum:

- Front it with TLS (Caddy, nginx, or an internal load balancer).
- Run under a dedicated non-root user with write access only to the storage directory.
- Set HMAC-SHA256 signing if your Drupal stack supports it (see "Verify secret" comment in `app.py`).
- Add a request body size limit at the proxy layer in addition to the in-app limit.
- Monitor the audit log; alert on schema-validation failures (likely indicates upstream form change or hostile traffic).

## 9. Smoke test

Submit a test comment through the form, in English and again in Spanish. Verify:

- The form renders without console errors (browser DevTools → Console).
- Tab order is logical and focus is always visible.
- The receiver logs an accepted submission (HTTP 202) with `submission_id`.
- The storage directory has a JSON file matching the submission.
- The Housing email arrives.
- If you checked the accommodation box, the Office of Accessibility email also arrives.
- Switching to Spanish at `/es/home-arp-comment` shows the translated form.
- A submission from the Spanish form has `langcode: "es"` in the JSON payload.

## 10. Pre-launch accessibility review

Before going live, run:

- Automated: axe DevTools or WAVE on `/home-arp-comment` and `/es/home-arp-comment`.
- Keyboard: complete the form using only Tab, Shift+Tab, Space, Enter, and arrow keys. No mouse.
- Screen reader: complete the form with NVDA (Windows + Firefox) or VoiceOver (macOS + Safari). Note any field that is not announced or any control that is reached but not labeled.
- Zoom: complete the form at 200% zoom and at 400% zoom.
- Color contrast: Lighthouse audit, target 100 on Accessibility.

Findings from this review should drive a final pass before launch.

## Removing the form (post comment-window)

The form is configured to close automatically on `2026-05-26T23:59:59-06:00`. After that date, attempts to submit return the configured `form_close_message`. Submissions remain stored in Drupal and in the receiver's filesystem; nothing is deleted.

To unpublish the form path entirely after the comment period:

```
Admin → Structure → Webforms → HOME-ARP → Settings → General
  Status: Closed (already automatic)
  Then: Page → Page enabled → Disabled
```

This stops `/home-arp-comment` from resolving but preserves the form and its submissions for the public record.
