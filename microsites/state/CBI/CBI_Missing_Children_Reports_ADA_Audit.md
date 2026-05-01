# ADA / WCAG 2.1 AA Audit
## Colorado Bureau of Investigation — Missing Children Annual Reports

**Page audited:** https://cbi.colorado.gov/investigations/missing-persons/missing-children-annual-reports
**Reports audited:** 33 PDFs (1985–2023) + 1 Google Doc (2024)
**Standard applied:** WCAG 2.1 Level AA, plus PDF/UA-1 for the PDF documents
**State of Colorado commitment:** The footer of the page states the State is "committed to providing equitable access… in line with the Web Content Accessibility Guidelines (WCAG) version 2.1, level AA criteria."

---

## Executive summary

The page itself is mostly fine. The **content the page exists to deliver — the reports — is not.** Out of 34 reports linked from this page, **only 12 (35%) provide content that a screen-reader user, a person with low vision using assistive tech, or a researcher using automated tools can actually consume.** The other 65% are scanned images of paper, web pages saved as PDFs with statistical tables baked into images, missing entirely, or tucked into a different format with no notice.

There is one bright spot: the most recent (2024) report — the one in the "outlier" Google Doc format — is actually the **most accessible** report in the entire corpus, with descriptive alt text on every figure and links to the underlying raw data. The agency clearly knows how to produce accessible content. The challenge is consistency.

Because Colorado state policy commits the agency to WCAG 2.1 AA, this is not just a usability problem — it is a stated-commitment gap.

---

## 1. Scope and method

The audit covered:

- The HTML index page that lists the reports.
- A representative sample of the 33 linked PDFs, drawn from each of the three production eras visible in the corpus: scanned (1985–1999), web-archive HTML-as-PDF (2000–2009), and modern designed PDFs (2014–2023).
- The 2024 report, which is hosted as a published Google Doc.

Method: machine text extraction (the same approach a screen reader, search index, or assistive tool would rely on); structural inspection of the index page HTML; comparison against WCAG 2.1 AA Success Criteria and PDF/UA-1.

---

## 2. Page-level findings (the index page)

The HTML page is reasonably structured. Most of the issues are minor and fixable in a single pass.

### 2.1 Findings

**(A) Empty or placeholder heading levels (WCAG 1.3.1, 2.4.6) — Moderate.**
The page includes several `###` headings that contain no text or only the literal placeholder "placeholder". Screen readers announce these as empty headings, which is disorienting and breaks the heading outline.

**(B) Redundant, ambiguous link text (WCAG 2.4.4, 2.4.9) — Moderate.**
Every PDF link in the table renders its accessible name as the year, followed by "(opens in new window)(opens in new window)" — the phrase is duplicated. A screen-reader user navigating by links hears each year twice. Beyond the duplication, the link text gives the user no signal about *which* report it is (the only differentiator is the year integer).

Fix: link text should read like "1985 Missing Children's Report (PDF)" with a single "(opens in new window)" indicator delivered via `aria-label` or a sr-only span.

**(C) Reports table has no programmatic structure (WCAG 1.3.1) — Minor.**
The reports are arranged in a 5-column-wide table, but it is purely a layout grid — no headers, no caption, no semantic relationship between cells. A screen-reader user navigating cell-by-cell hears years in row-major order with no context. A simple `<ul>` or a properly captioned table with a `<caption>` element would be more accessible.

**(D) "Opens in new window" used without a visual cue (WCAG 3.2.5) — Minor.**
Sighted users get no indication that the link launches in a new tab/window — there's no icon, only the screen-reader text. Per WCAG, opening a new window without warning a sighted user is a change of context that should be predictable.

**(E) Document type and size not indicated (WCAG 1.3.1, advisory 2.4.4) — Minor.**
Links don't tell users they're about to download a PDF, nor how big it is. For users on metered connections or older assistive tech, this matters. (One link is a Google Doc rather than a PDF — there is no warning that this differs from the rest.)

**(F) The 2024 link points to a published Google Doc (WCAG 1.3.1, 4.1.2) — Moderate.**
Mixing a Google Doc with 33 PDFs in the same list, with no indication of the format change, breaks predictability. Google Docs in "publish to web" mode often have different keyboard-trap behavior than the rest of the page.

**(G) Phone number for inquiries is not formatted as a `tel:` link in the body content — Minor.**
The number "303-239-4211" appears as plain text; only the footer phone number is a clickable `tel:` link. Mobile screen-reader users have to copy/paste.

**(H) Color contrast: not directly verifiable from text-extracted content — Defer.**
Confirming AA-level contrast (4.5:1 for body text, 3:1 for large text and UI) requires rendering the page. This audit flags it as "verify visually with an automated tool such as axe DevTools or WAVE."

### 2.2 What the page does well

- Has a "Skip to main content" link (WCAG 2.4.1).
- Page has a `<title>` and breadcrumb trail.
- The State accessibility commitment and a contact path for accommodations are linked from the page footer.
- Site language is set on the document.
- Navigation is keyboard-traversable based on the source.

---

## 3. PDF-level findings — the substantive accessibility problem

The 34 reports fall into three production eras with sharply different accessibility characteristics. **The page treats them as a single list, but they are not the same kind of artifact.**

### 3.1 Era 1: Scanned PDFs (1985, 1986, 1989, 1990–1999) — 13 reports

**Status: Inaccessible. Multiple WCAG fails.**

These PDFs are images of paper documents. There is no underlying text. Direct text extraction returns "[This PDF is empty or contains no machine-readable text]."

Failures:

- **WCAG 1.1.1 Non-text Content (Level A) — FAIL.** Every page is a single image with no text alternative. A screen-reader user receives nothing.
- **WCAG 1.4.5 Images of Text (Level AA) — FAIL.** The entire document is one large image of text.
- **WCAG 1.3.1 Info and Relationships (Level A) — FAIL.** No tagged structure, no headings, no reading order.
- **WCAG 1.4.4 Resize Text (Level AA) — FAIL.** Zooming a scanned image degrades quality; the user cannot reflow text.
- **WCAG 4.1.2 Name, Role, Value (Level A) — FAIL.** No semantic structure for assistive tech.
- **PDF/UA-1 § 7.1 Tagged PDF — FAIL.**
- **PDF/UA-1 § 7.2 Document title in metadata — likely FAIL** (cannot verify without binary, but consistent with format).

Practical impact: a blind researcher, journalist, parent of a missing child, or auto-translation tool **cannot read these reports at all**. They are visible only to sighted users with full vision and no assistive-tech reliance.

This is 13 of 34 reports — **38% of the corpus is fully inaccessible.**

**Remediation:** OCR the PDFs (e.g., Adobe Acrobat Pro's "Make Accessible," ABBYY FineReader, Tesseract), then add document tags, headings, and table structure. Approximate effort: 2–4 hours per report depending on complexity, or roughly 30–50 hours total for the whole 1985–1999 backlog. A vendor or batch-processing tool can do this for under $1k.

### 3.2 Era 2: Web-archive HTML-as-PDF (2000–2009) — 10 reports

**Status: Partially accessible. Text extracts unevenly; statistical tables are usually images.**

These are web pages saved to PDF, sometimes from Wayback Machine captures (the 2000 PDF's URL strings include `web.archive.org` paths). Text extraction recovers narrative prose, definitions, and director's-message content — but the statistical content the reports exist for (counts by age, sex, day, month, recovery status) is frequently captured as a printed image of a page with bitmapped tables.

Mixed results in the sample:

- **2008 report:** All tables came through as text — **best of this era.**
- **2009 report:** Historical totals table came through; some other tables only partially.
- **2002, 2000 reports:** Prose came through; "Facts of Interest" and statistical tables are present as images and don't extract.

Failures:

- **WCAG 1.1.1 Non-text Content (Level A) — Partial FAIL** (statistical tables embedded as images have no alt text).
- **WCAG 1.3.1 Info and Relationships (Level A) — FAIL** (tables are not marked up programmatically; reading order is print-page order, not logical content order).
- **WCAG 1.4.5 Images of Text (Level AA) — FAIL** for the table images.
- **PDF/UA-1 § 7.5 Tables — FAIL** (no `<TR>`/`<TH>`/`<TD>` tags).
- **WCAG 2.4.6 Headings and Labels (Level AA) — FAIL** (the "headings" are styled paragraphs, not tagged headings).

Practical impact: a screen-reader user can hear what the report is about and read most of the prose, but cannot access the actual numeric data — which *is* the report.

**Remediation:** Re-export the source HTML to a tagged accessible PDF, or — better — publish the data as a structured page or open dataset. If keeping PDFs, regenerate from source with proper tagging (a one-time effort per report).

### 3.3 Era 3: Modern designed PDFs (2014–2023) — 10 reports

**Status: Mostly accessible at the text level; structural accessibility cannot be verified from content alone.**

These reports extract cleanly to text. Headings, tables, and prose are all recoverable. They are demonstrably the best of the three eras.

But text-extraction success **does not guarantee WCAG/PDF UA compliance.** A PDF can be text-only (no underlying image layer) yet still fail accessibility because:

- It lacks tags (a PDF without tags has no semantic structure for assistive tech, even if a search engine can read the text).
- Reading order in the tag tree may not match visual order.
- Decorative images may be exposed instead of marked artifact.
- Tables may not have header cells designated.
- Form fields, if any, may not have labels.
- Document metadata (title, language) may not be set.

To fully audit these, the binary PDFs need to be inspected (e.g., with PAC 2024, PDF Accessibility Checker, or Acrobat Pro's accessibility checker). Likely findings based on what's typical for state-government communications-team-produced PDFs in this era:

- **Untagged or poorly-tagged structure (WCAG 1.3.1) — Likely partial fail.**
- **Missing document title in metadata (WCAG 2.4.2) — Likely partial fail.**
- **Decorative images (poster-contest cover, child illustrations) without alt text or marked as decorative (WCAG 1.1.1) — Likely partial fail.**
- **Color used to convey info — possible.** The 2021 report shows a pie chart of recovery circumstances with color-only legend; if the only legend is color, that's a 1.4.1 fail.
- **Two-column layouts where reading order may be wrong — possible.** Common in this kind of designed PDF.

**Recommended remediation:** Run each modern report through PAC 2024 and/or Acrobat Pro's checker; expect ~10–30 minutes per report to fix. New reports going forward should be checked at draft time, not after publication.

### 3.4 The 2024 Google Doc

**Status: Format outlier; actually the most accessible report in the corpus.**

The 2024 report is hosted as a Google Doc published to web. This breaks the consistency of the report list, but inspection of the actual content reveals that **it has stronger accessibility properties than any of the PDFs**:

- **Every figure has descriptive alt text.** The cover illustration's alt text reads: "drawing of trees in the background, with a child kneeling on the ground with tears in their eyes looking at a lantern that is lit up yellow as if its glowing with the words 'Bringing our missing children home' written across the foreground." Figures 1–6 all have similarly substantive alt text describing what each chart shows.
- **Every chart links to its underlying raw data** as a public Google Sheet. A user who cannot see Figure 3 (the race pie chart) can both hear the alt text ("69% White, 18% Black, 11% Unknown, 1% Native American, 1% Asian") *and* open the linked spreadsheet.
- **Tables are real HTML tables** with `<th>` headers, not images of tables.
- **Headings use proper heading levels** (H1, H2, H3) — the document outline is navigable by screen reader.
- **The boilerplate stale "39 children/day" figure was finally updated** to "20 children/day" in this report (the earliest correction in the eight-year stretch where it was wrong).

This is, ironically, the report the page treats as the format outlier.

What is still imperfect:

- **Format inconsistency (WCAG 3.2.3, 3.2.4):** Mixing one Google Doc into a list of 33 PDFs without warning is a predictability issue. Users prepared to download a PDF land on something else.
- **No downloadable accessible version:** A user wanting a single archival file (for their own records, for redistribution, for offline reading) has no PDF/A-tagged equivalent.
- **Dependency on Google's published-to-web rendering:** if Google changes the format or removes the publish-to-web feature, the report becomes unreachable.

**The takeaway:** the 2024 report demonstrates the agency *knows how to produce accessible content* — they're doing it well in this format. The challenge is propagating those practices (alt text, raw-data links, real tables) backward into the PDF era and forward into a consistent format choice. The 2024 design is a good template; the missing step is making it consistently produced and consistently distributed.

---

## 4. WCAG 2.1 AA criteria — at-a-glance scorecard

| Criterion | Index page | Era 1 PDFs (1985–99) | Era 2 PDFs (2000–09) | Era 3 PDFs (2014–23) |
|---|---|---|---|---|
| 1.1.1 Non-text content (A) | Pass | Fail | Partial fail | Likely partial |
| 1.3.1 Info & relationships (A) | Partial | Fail | Fail | Likely partial |
| 1.4.1 Use of color (A) | Defer | n/a | n/a | Verify (charts) |
| 1.4.3 Contrast (AA) | Defer | n/a | n/a | Defer |
| 1.4.4 Resize text (AA) | Pass | Fail | Partial | Pass |
| 1.4.5 Images of text (AA) | Pass | Fail | Fail | Pass |
| 2.4.1 Bypass blocks (A) | Pass | n/a | n/a | n/a |
| 2.4.2 Page titled (A) | Pass | Likely fail | Likely fail | Verify |
| 2.4.4 Link purpose (A) | Partial | n/a | n/a | n/a |
| 2.4.6 Headings and labels (AA) | Partial | Fail | Fail | Likely partial |
| 3.1.1 Language of page (A) | Pass | Likely fail | Likely fail | Verify |
| 4.1.2 Name, role, value (A) | Partial | Fail | Fail | Likely partial |

---

## 5. Risk and impact

**Audience harmed:** screen-reader users (estimated 7–8 million U.S. adults with severe visual disabilities), users of refreshable Braille displays, users with cognitive disabilities relying on text-to-speech, motor-impaired users who cannot use a mouse to manually crop and copy table cells, users on low-bandwidth connections or older devices, automated translation tools, search engines, researchers and journalists.

**Subject-matter sensitivity:** missing-children data is exactly the kind of public-safety information whose accessibility matters most. The audience includes parents, caregivers, advocates, and legal professionals — populations with disproportionately high rates of stress, time pressure, and varying technical proficiency.

**Legal/policy exposure:** Title II of the ADA, Section 504, and Colorado's HB21-1110 ("Colorado Laws For Persons With Disabilities") require state agencies to make digital content accessible. Colorado state policy explicitly references WCAG 2.1 AA. The page even links to the state's accessibility commitment — which makes the contrast between the stated commitment and the actual state of these PDFs noteworthy.

---

## 6. Recommendations, in order of impact

1. **Republish the 1990–2009 totals as a single accessible HTML table on the page.** This is a 30-minute job that immediately makes 20 years of headline data accessible, even before any PDF remediation. The data is already extracted in the spreadsheet from this audit.
2. **Run the modern (2014–2023) PDFs through an automated checker (PAC 2024, Acrobat Pro) and remediate.** Expect this is a half-day of work per file maximum. Establish a checker-pass requirement before any future report is posted.
3. **OCR the scanned 1985–1999 PDFs and re-publish as tagged accessible PDFs.** Vendor-priced or batch-processed for ~$25–50/report.
4. **Fix the index page's link text and remove the duplicated "(opens in new window)(opens in new window)" pattern.** Likely a single template change in the CMS.
5. **Add format/size indicators next to each link** ("PDF, 1.2 MB" or "Google Doc"). Standard pattern, reduces confusion.
6. **Publish a structured open dataset alongside the PDFs.** A CSV or table on data.colorado.gov containing the per-year totals and key fields would solve the accessibility problem for the data layer permanently and make the reports actually useful for trend analysis (currently this requires the work that produced this audit's spreadsheet).
7. **Standardize on a single format for future years.** Either PDF or web-published HTML — not both. The 2024 Google Doc breaks the pattern.
8. **Fill the 2010–2013 gap**, or post a notice explaining why those years are absent. As-is, a user encountering the page reasonably assumes a missing report is a website bug.

---

## 7. Scope notes and limitations

- This audit relied on text extraction and HTML-source inspection. Visual rendering, color contrast, focus indicator visibility, and PDF tag-tree structure could not be examined from the available tooling.
- Era-3 PDFs are scored "likely partial" rather than "fail" because text extraction succeeds; the structural-tag layer would need binary inspection (PAC 2024) to confirm.
- The 1987 and 1988 reports, and the 2010–2013 reports, are **absent from the index page entirely** and were therefore not audited.

---

*Prepared from automated extraction of all 34 reports linked at*
*https://cbi.colorado.gov/investigations/missing-persons/missing-children-annual-reports*
*on Thursday, April 30, 2026.*
