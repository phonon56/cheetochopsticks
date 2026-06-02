# Plain-Language Complaint Intake

An open-source, single-file reference implementation of a **plain-language intake** for a multi-step government complaint form. A person describes what happened in one natural-language box; the page extracts structured details **in their browser** and presents a pre-filled, reviewable copy of the form's steps, then hands off to the official form.

It is built as a concept/demonstration around the FBI **IC3** complaint flow, but every agency-specific detail is data in one `CONFIG` block, so it can be re-pointed at any structured form.

- **No backend, no build step, no third-party runtime.** One HTML file.
- **Nothing is transmitted.** All processing is client-side. The tool never submits on the user's behalf — it hands off to the official form.
- **Accessibility target: WCAG 2.1 Level AAA.**

---

## Quick start

Open `ic3_intake_opensource.html` in a browser. That's it — there is no install step. To host it, drop the file on any static web server (or GitHub Pages, S3, an agency CMS, etc.).

The page ships with a restrictive `Content-Security-Policy` meta tag and **no third-party requests by default** — it renders with system-font fallbacks (Georgia / system sans / system mono). To use the original web fonts (Libre Baskerville, Inter, IBM Plex Mono), uncomment the Google Fonts block at the top of the `<head>` and extend the CSP `style-src` / `font-src` to allow `fonts.googleapis.com` and `fonts.gstatic.com`. For zero third-party dependencies, self-host the `.woff2` files via `@font-face`.

---

## How it works

1. **One input.** The user writes a free-text account of the incident. Prompt chips nudge for missing detail (when, money & method, who, first contact, contact details).
2. **Client-side extraction.** Configurable pattern matchers detect amounts, dates, emails, phone numbers, URLs, payment method, likely crime type, location, and subject name/business.
3. **Pre-filled review.** The detected data is mapped into the destination form's steps. Each field shows an honest provenance badge:
   - `✓ from your description` — quoted from the text
   - `auto-suggested · check` — inferred (e.g., payment method from keywords)
   - `guessed · please confirm` — low-confidence (e.g., a relative date)
   - `you fill this in` — not detected
4. **Hand-off.** The user reviews/edits, optionally copies a plain-text summary, and continues to the official form to submit (including any CAPTCHA step).

Browser autofill is supported on the personal-contact fields via correct `autocomplete` tokens (`name`, `tel`, `email`, `address-level2`, `address-level1`, `postal-code`).

---

## Adapting it (edit only `CONFIG`)

Everything an agency needs to change lives in the `CONFIG` object at the top of the `<script>` block. The engine below it does not need editing. Search the file for **`EDIT HERE`**.

| Section | What it controls |
|---|---|
| `brand`, `govNote`, `copy` | Names, seal text, headings, hero copy, textarea placeholder, hand-off text |
| `officialForm` | The destination form URL and button label |
| `prompts` | The detail-prompt chips under the textarea |
| `altPaths` | Alternative-path cards **and** the emergency bar (any entry with `bar:true`) |
| `definitions` | Contents of the accessible "What are these?" dialog |
| `extractors` | The detection patterns. `regex`, `capture`, `keywordMap`, and `date` types are supported |
| `steps` | The destination form's steps and fields (id, label, type, `autocomplete`, `required`) |
| `MAP` | How each detected value lands in a field (`fieldId → {value, source}`) |
| `TOKENS` | Which detected items appear in the "What we picked up" strip |
| `CONFIG.theme` *(optional)* | Override any CSS color variable at runtime to re-skin without touching the stylesheet |

**To point this at a different form:** rewrite `steps` to match that form's fields, adjust `MAP` so detected data fills the right field ids, and add/remove `extractors` for the data that form needs. No engine changes required.

> ⚠️ If you change colors via `CONFIG.theme` or the CSS variables, re-check contrast. All text in the default palette meets **7:1** and control borders/focus meet **3:1**; new colors must be verified to keep AAA conformance.

---

## Accessibility conformance

Designed and tested against **WCAG 2.1 Level AAA**, including:

- **1.4.6 Contrast (Enhanced)** — all text ≥ 7:1; large text and non-text UI (borders, focus rings) verified separately.
- **2.4.13 / 2.4.7 Focus** — thick (3px), offset, high-contrast focus indicators on every interactive element, with a light ring variant on dark surfaces.
- **1.4.8 Visual Presentation** — left-aligned text, line height ≥ 1.5, generous paragraph spacing, and a capped line length (`--measure`, default `70ch`).
- **1.4.4 Resize / 1.4.10 Reflow** — `rem`-based sizing; reflows to a 320px viewport without horizontal scrolling.
- **1.3.1 / 2.4.6 / 2.4.10** — a single `<h1>`, an ordered heading outline, and labeled `<section>`/`<nav>` regions.
- **4.1.2 / 4.1.3** — labeled controls; `role="radiogroup"` with `aria-labelledby`; status and error messages in `aria-live`/`role="status"` regions.
- **Dialog** — a true modal (`<dialog>`/`role="dialog"`) with focus moved in, focus trapped, `Esc` to close, and focus returned to the trigger.
- **Forms** — explicit `<label for>` on every input, screen-reader `(required)` text instead of a spoken asterisk, and `autocomplete` tokens on contact fields.
- **2.4.4 / 2.4.9** — links are self-describing (with `aria-label` where the visible text is short), and external links announce that they open a new tab.

This addresses, as a working reference, the same issues raised in the IC3 accessibility audits (heading structure, announced errors, modal semantics, autocomplete, focus management).

**Note:** Conformance applies to this intake page. The official destination form is separate and must be assessed on its own.

---

## Privacy

All extraction runs locally in the browser. The page makes **no network calls** in its default configuration — a `Content-Security-Policy` meta tag enforces `connect-src 'none'`, `form-action 'none'`, `default-src 'self'`, and there are no third-party scripts, fonts, or images. It stores nothing — no cookies, no `localStorage`, no analytics.

---

## Limitations

Extraction is best-effort pattern matching, not natural-language understanding. It reliably catches amounts, dates, emails, phone numbers, URLs, and keyworded payment/crime types, but it will miss information that isn't explicitly stated and will occasionally mis-detect. **Every field is editable and nothing is auto-submitted.** This tool does not provide legal advice and is not an official government service.

---

## License

Released under the **MIT License** (see `LICENSE`). For works authored by U.S. government employees, you may instead dedicate it to the **public domain (CC0)**; replace the header and `LICENSE` accordingly.
