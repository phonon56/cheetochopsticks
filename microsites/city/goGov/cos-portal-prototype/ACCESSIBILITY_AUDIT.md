# Accessibility Audit: COS Portal — "Playful" Design System

**Standard:** WCAG 2.1 AA · **Date:** 2026-05-26 · **Scope:** the proposed playful/brand-anchored design system (tokens, type, color) plus the new UI elements (logo, peaks ribbon, jurisdiction dot-chips) and the existing component ARIA. Reviewed against the rendered preview, not yet applied to `src/`.

## Summary

**Issues found: 6** — Critical: 0 · Major: 3 · Minor: 3.
All Major issues were **fixed in the token set** during this audit (the preview now reflects the corrected values). The Minor items are advisory polish, not failures.

The existing components were already strong on accessibility (skip link, keyboard-navigable section bar, semantic error summary, labelled inputs, 44px targets, reduced-motion). The findings are concentrated in the *new* color/border choices and the *new* decorative elements.

> Note: this is a static + computed audit (catches the ~30% an automated pass plus contrast math can find). Before launch, also run the repo's axe pass (`node scripts/axe-audit.mjs`) against the live build and do a manual screen-reader (VoiceOver/NVDA) + 200% zoom check.

---

## Findings

### Perceivable

| # | Issue | WCAG | Severity | Status / Fix |
|---|-------|------|----------|--------------|
| 1 | Form-control borders (inputs, select, textarea, search box, outline buttons) used `line-stronger` `#c3baac` — only **1.9:1** on white, far below the 3:1 required for the visual boundary of a control. | 1.4.11 Non-text contrast | 🟡 Major | **Fixed.** `line-stronger` darkened to `#8a7d68` → 4.03:1 on surface, 3.77:1 on canvas, 3.55:1 on muted. Outline buttons re-pointed to this border. |
| 2 | Meta text (`ink-muted` `#6e7277`) on the muted sand surface was **4.27:1** — under 4.5 for normal text (e.g. the "Form" pill, captions on tinted areas). | 1.4.3 Contrast | 🟡 Major | **Fixed.** `ink-muted` darkened to `#686c70` → 4.66:1 on muted, 4.95:1 on canvas, 5.29:1 on white. |
| 3 | Search placeholder (`ink-subtle` `#989ca1`) was **2.76:1**, and the hero search had **no visible label / accessible name** — placeholder-only fields fail both contrast and labeling. | 1.4.3 / 3.3.2 | 🟡 Major | **Fixed.** Placeholder uses `ink-muted` (5.29:1) and the input gained `aria-label="Describe what you need help with"`. |
| 4 | Decorative SVG icons (status check/alert/info, search, pin, arrow) and the color dots/peaks ribbon would be announced or add noise to screen readers. | 1.1.1 / 4.1.2 | 🟢 Minor | **Fixed.** All decorative graphics marked `aria-hidden="true"`; status meaning is carried by the bold heading text, not the icon. |
| 5 | Bright logo **orange** dot `#fea30b` is only **2.0:1** on white as a graphic. | 1.4.11 (advisory) | 🟢 Minor | Acceptable — dots are decorative and every chip carries a **text label**, so jurisdiction is never conveyed by color alone (1.4.1 satisfied). *Recommendation:* add a 1px inset ring on dots so low-contrast hues (orange/teal) stay crisp. |
| 6 | Card border `line` `#ece6dd` is ~1.2:1 on white. | 1.4.11 | 🟢 Minor | Acceptable — card boundaries are **decorative** and reinforced by `shadow-sm` + padding, so the border isn't the sole identifier. Could darken slightly for definition if desired. |

### Operable

No issues. The existing patterns carry over and remain compliant — see "Keyboard & Robust" below. Focus indicator is a 2px solid `brand` outline with 2px offset (visible, 2.4.7). *Advisory:* on a terracotta button the ring is the same hue as the button (separated only by the 2px offset gap); a charcoal or dual-tone focus ring would read more crisply there.

### Understandable

No new issues. Forms keep `noValidate` + zod validation, a `role="alert"` error **summary** with in-page anchor links to each field, and `aria-invalid` / `aria-describedby` / `aria-required` on inputs (3.3.1, 3.3.2, 3.3.3). Color is paired with text/icon everywhere (1.4.1).

### Robust

No new issues. The logo image carries descriptive `alt`; interactive controls expose name/role/value. *Go-live note:* if the header logo links home, give the link one clear accessible name (e.g. `alt="City of Colorado Springs — Olympic City USA, home"`).

---

## Color Contrast Check (after fixes)

| Element | Foreground | Background | Ratio | Required | Pass |
|---|---|---|---|---|---|
| Heading / primary text | ink `#24272a` | canvas `#faf7f2` | 14.05 | 4.5 | ✅ |
| Body text | ink-secondary `#56595e` | surface `#fff` | 7.03 | 4.5 | ✅ |
| Meta / captions | ink-muted `#686c70` | surface-muted `#f4f0ea` | 4.66 | 4.5 | ✅ |
| Eyebrow / link (terracotta) | brand `#a8501e` | canvas | 5.13 | 4.5 | ✅ |
| Link (Olympic blue) | accent `#0074c8` | surface | 4.85 | 4.5 | ✅ |
| Primary button label | white | brand `#a8501e` | 5.48 | 4.5 | ✅ |
| Placeholder / search | ink-muted `#686c70` | surface | 5.29 | 4.5 | ✅ |
| Success message | `#0b5026` | success-surface | 8.64 | 4.5 | ✅ |
| Warning message | `#6b4a0f` | warning-surface | 7.05 | 4.5 | ✅ |
| Danger message | `#7e1620` | danger-surface | 9.01 | 4.5 | ✅ |
| Info message | `#00528f` | info-surface | 7.04 | 4.5 | ✅ |
| Form-control border | line-stronger `#8a7d68` | surface | 4.03 | 3.0 | ✅ |
| Focus ring | brand `#a8501e` | surface | 5.48 | 3.0 | ✅ |
| Status icons (graphic) | success/warn/danger/info | their surfaces | 3.18–4.50 | 3.0 | ✅ |

## Text Sizing

| Role | Size | Assessment |
|---|---|---|
| Body / intro | 15–16px | ✅ Comfortable; meets best-practice (≥16px for primary reading where possible). |
| Section/topic headings | 18–30px serif | ✅ Clear hierarchy. |
| Page title (hero) | ~43px serif | ✅ |
| Meta, eyebrows, chip labels, captions | 12px (`text-xs`) | ✅ Acceptable for short labels only (no WCAG minimum); all now ≥4.5:1 contrast. Don't use 12px for running text. |

No fixed-height text containers; layout is rem-based and responsive, so it should reflow at 200% zoom (1.4.10) and tolerate text-spacing overrides (1.4.12) — **verify manually at 200%** before launch. Touch targets use `min-h-11` (44px), satisfying 2.5.5.

## Keyboard & Screen Reader (existing patterns — retained)

| Element | Behavior | Status |
|---|---|---|
| Skip link → `#main` | Visible on focus, jumps to `<main tabIndex=-1>` | ✅ 2.4.1 |
| Section bar (Mode bar) | Roving `tabindex`, ←/→/Home/End, `aria-current="page"` | ✅ 2.1.1 / 4.1.2 |
| Topic selection | Focus moves to the heading (`tabIndex=-1`) on navigate | ✅ 2.4.3 |
| Form errors | `role="alert"` summary with anchor links; `aria-invalid`/`describedby`/`required` | ✅ 3.3.1/3.3.3 |
| Decorative graphics | `aria-hidden="true"` (icons, dots, peaks ribbon) | ✅ 1.1.1 |
| Logo | Descriptive `alt` | ✅ 1.1.1 |

## Priority Fixes

1. **(Done) Control-border contrast** — darkened `line-stronger` to `#8a7d68`; apply to inputs, select, textarea, and outline buttons when going live. This was the only widespread failure.
2. **(Done) Meta + placeholder contrast** — darkened `ink-muted` to `#686c70`; placeholder uses it; search got an `aria-label`.
3. **(Done) `aria-hidden` on decorative graphics.**
4. **(Advisory) Dot ring + button focus ring** — add a 1px inset ring on legend dots, and consider a charcoal focus ring on terracotta buttons.
5. **(Before launch) Live testing** — run `scripts/axe-audit.mjs`, screen-reader pass, and a 200% zoom/reflow check on the built app.

## Corrected token values (carry these into `src/index.css` at go-live)

```
--color-ink-muted:     #686c70;   /* was #6e7277 — now AA on the muted surface  */
--color-line-stronger: #8a7d68;   /* was #c3baac — now ≥3:1 for control borders */
/* placeholders: use ink-muted; decorative icons/dots/ribbon: aria-hidden="true" */
/* hero search: add a visible <label> or aria-label */
```
