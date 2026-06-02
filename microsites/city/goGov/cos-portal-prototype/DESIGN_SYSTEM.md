# COS Portal — Design System

The single source of truth for the look and feel of the Contact-the-City portal
(City of Colorado Springs). It documents the design tokens, type scale, color
semantics, component recipes, and accessibility rules that are **already in use**
across the prototype, so new screens stay consistent with what exists today.

This is a descriptive system, not an aspirational one: every token and recipe
below was extracted from the live components in `src/`. The canonical token
definitions live in [`src/index.css`](src/index.css) inside the Tailwind v4
`@theme` block.

---

## 1. Foundations

**Stack.** React 19 + Vite + TypeScript, styled with **Tailwind CSS v4** (via
`@tailwindcss/vite`). There is no component library — components are plain JSX
with utility classes. Tokens are defined as Tailwind `@theme` variables.

**Principles.**

- **Accessibility is a hard requirement, not a polish step.** The project ships
  with axe audits (`scripts/axe-audit.mjs`, `@axe-core/playwright`). Every
  pattern below targets WCAG 2.1 AA. See §8.
- **Warm, civic, confident.** Anchored to the City's "Olympic City USA" mark:
  warm near-white neutrals, charcoal ink, a sandstone-terracotta primary, and the
  Olympic blue as a secondary accent. Most of the page stays calm so the logo and
  a few accents carry the warmth.
- **Mobile-first and keyboard-first.** Layouts collapse to a single column;
  every interactive target is ≥ 44×44px; nav is arrow-key navigable.
- **Color with discipline.** Terracotta = primary action / warmth; Olympic blue =
  links / info; status hues = feedback; the logo's eight peak colors are reserved
  for the jurisdiction legend (dots in neutral chips). The full palette never
  sprays across the chrome — that's what keeps it civic rather than chaotic.

### Using the tokens

All UI chrome — buttons, inputs, cards, callouts, text, borders, surfaces — uses
the **semantic utilities**. Always reach for these; they read by intent and stay
correct if a value changes globally:

```
bg-canvas  bg-surface  text-ink  text-ink-secondary  border-line  bg-brand
```

Each semantic token is a real brand value defined once in the `@theme` block of
`src/index.css`; change a value there and the whole app re-themes. All chrome —
buttons, inputs, cards, callouts, text, borders, surfaces, and even status and
data-quality tones — flows through these tokens.

**Categorical color is the one exception.** The eight jurisdiction hues come from
the city's peak palette (`--color-peak-*`) and render as a small dot inside a
neutral chip (see `JurisdictionTag` and §3), so the legend stays colorful without
turning the UI into a wall of bright pills. `text-white` (on a brand button) is
the only other non-token color in the chrome.

---

## 2. Color tokens

### Brand — sandstone terracotta (primary / warmth)

| Token (utility) | Value | Use |
| --- | --- | --- |
| `brand` | `#a8501e` | Primary buttons, CTAs, eyebrows, links, focus ring, active nav |
| `brand-hover` | `#8c4118` | Primary hover |
| `brand-dark` | `#6e3214` | Deepest accents (logo seal, peaks) |
| `brand-surface` | `#fbeee3` | Selected/active warm tint |
| `brand-ink` | `#5e2c12` | Text/icon on `brand-surface` |

### Accent — Olympic blue (from the city mark)

| Token (utility) | Value | Use |
| --- | --- | --- |
| `accent` | `#0074c8` | Links, info accents |
| `accent-ink` | `#00528f` | Darker blue for text where needed |

### Surfaces

| Token (utility) | Value | Use |
| --- | --- | --- |
| `canvas` | `#faf7f2` | App background — warm near-white (`min-h-screen bg-canvas`) |
| `surface` | `#ffffff` | Cards, header, footer, form panels |
| `surface-muted` | `#f4f0ea` | Inset asides, hovers, neutral chips |

### Text (ink) — anchored on the logo's charcoal

| Token (utility) | Value | Use |
| --- | --- | --- |
| `ink` | `#24272a` | Headings and primary text |
| `ink-strong` | `#3b3e42` | Secondary-button & nav text, strong labels |
| `ink-secondary` | `#56595e` | Body copy, descriptions |
| `ink-muted` | `#686c70` | Meta, hints, captions (AA on every surface) |
| `ink-subtle` | `#989ca1` | Decorative only — not for text (fails AA as text) |

### Lines & borders

| Token | Value | Use |
| --- | --- | --- |
| `line` | `#ece6dd` | Decorative dividers & card edges (pair with shadow) |
| `line-strong` | `#dcd4c8` | Light separators, neutral chips |
| `line-stronger` | `#8a7d68` | **Control border** — inputs/select/textarea (≥3:1, WCAG 1.4.11) |

### Status / feedback

Used for callouts, panels, the error summary, and the data-quality/severity tones.
Each has a border, a tinted surface, and an ink color (dark ink on the light surface).

| Status | Border | Surface | Ink | Triggered by |
| --- | --- | --- | --- | --- |
| `success` | `#14823f` | `#eaf6ee` | `#0b5026` | Confirmation, verified data, "paid" tag |
| `warning` | `#b8791a` | `#fbefd6` | `#6b4a0f` | Heads-up notes, illustrative/prototype data |
| `danger` | `#d12736` | `#fcebec` | `#7e1620` | Error summary, inline field errors |
| `info` | `#0074c8` | `#e6f1fb` | `#00528f` | Info callouts, snapshot data |

---

## 3. Categorical color — the peak palette

The "Olympic City USA" logo is a range of colored peaks. Those colors are reserved
for **categorical legends** — never for chrome — and live as `--color-peak-*`
tokens (utilities `bg-peak-blue`, `bg-peak-green`, …).

**Jurisdiction** renders through the shared `<JurisdictionTag>`: a neutral chip
(`border-line-strong bg-surface text-ink-secondary`) with a small color **dot**.
The text label carries the meaning, so color is never the only signal (1.4.1) and
the dot is `aria-hidden`. Mapping lives in `JURISDICTION_DOT` (`src/data/facets.ts`):

| Jurisdiction | Peak dot |
| --- | --- |
| City | blue `#0074c8` |
| County | green `#00943a` |
| State | magenta `#c61f6e` |
| Federal | indigo `#2f3f8f` |
| Regional | orange `#fea30b` |
| Utility | teal `#0a9aa3` |
| Special district | red `#ea0d44` |
| Tribal | purple `#7d3aa8` |

A slim five-color **peak ribbon** (`#00943a / #0074c8 / #c61f6e / #ea0d44 / #fea30b`)
sits at the top of the app shell as the brand flourish (decorative, `aria-hidden`).

**Destination badges** (Form / External / Email) are plain neutral chips
(`border-line bg-surface-muted text-ink-muted`) — the label does the work.

### Data-quality & severity tones

These map to the semantic **status** tokens (§2), not raw hues, so they recolor
with the theme:

| Tone | Token | Meaning |
| --- | --- | --- |
| verified | `success` | Confirmed from system of record |
| snapshot | `info` | Point-in-time, may lag |
| illustrative | `warning` | Prototype / placeholder data |

Live-tile severity (`SEVERITY_COLORS`, `src/data/rightNow.ts`): `none` → neutral
(`border-line bg-surface-muted`), `info` → `info`, `warning` → `warning`,
`critical` → `danger`. The compensation "paid" tag uses `success`.

Rule of thumb: **chrome and feedback → semantic tokens; the eight jurisdiction
categories → peak dots in neutral chips.**

---

## 4. Typography

Two typefaces, loaded in `index.html`: **Source Serif 4** for display headings
(applied to every `h1`–`h3` via a global rule in `index.css`) and **Source Sans 3**
for body and UI. Both are warm and humanist; the serif gives the portal a classic,
trustworthy voice while the sans keeps forms and data readable.

| Role | Classes | Notes |
| --- | --- | --- |
| Page title (H1) | `text-3xl font-semibold text-ink` | Section landing headers |
| Section / topic title (H2) | `text-2xl font-semibold text-ink` | Form & view headings; `tabIndex={-1}` for focus-on-navigate |
| Subsection (H3) | `text-xl` / `text-base font-semibold` | |
| Body | `text-sm text-ink-secondary` | **Default body size across the app** |
| Meta / labels / hints | `text-xs text-ink-muted` | Eyebrows, badges, helper text, captions |
| Eyebrow / overline | `text-xs uppercase tracking-wide text-ink-muted` | Sits above titles ("Classification #…", "Coming next") |

**Weights in use:** `font-normal`, `font-medium` (labels, emphasis — most common),
`font-semibold` (headings, selected states). Avoid `font-bold` and lighter-than-
normal weights for consistency.

---

## 5. Spacing, radius, elevation, sizing

- **Radius:** `rounded-md` is the default (buttons, inputs, cards, callouts).
  `rounded-lg` for larger/emphasis cards and the success & info panels.
  `rounded-full` for pills/badges only.
- **Elevation:** subtle, warm-tinted shadows (redefined in `@theme`). Cards use
  `shadow-sm` and lift to `shadow-md` on hover; keep it soft — depth comes from
  gentle shadow + warm borders, never heavy drop-shadows.
- **Spacing rhythm:** vertical flow uses `space-y-1 … space-y-6`
  (forms: `space-y-5`); inline gaps `gap-1 … gap-3`. Padding: cards/asides
  `p-3`–`p-4`, emphasis panels `p-5`, page main `p-4 md:p-8`.
- **Touch targets:** every button, link-button, select, and tab carries
  **`min-h-11`** (44px) to satisfy WCAG 2.5.5. Keep this on any new interactive
  control.

**Normalized standards** (use these exact values so the design stays even):

- **Form-control border:** all text inputs, textareas, and selects use
  `border-line-stronger` — the one border that clears the ≥3:1 non-text contrast
  rule (WCAG 1.4.11). Outline buttons and chips may use the lighter `line-strong`
  since their text label identifies the control.
- **Field focus:** all controls use `focus:border-brand`, plus the global
  `:focus-visible` outline.
- **Interactive browse cards:** `min-h-24`, `shadow-sm`, lift to `shadow-md` on hover.
- **Topic / section descriptions:** `text-ink-secondary`.

---

## 6. Component recipes

Copy these class strings for new UI. They are the exact patterns used today, in
semantic-token form.

**Primary button**
```
rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50 min-h-11
```

**Secondary button**
```
rounded-md border border-line-strong px-4 py-2 text-sm text-ink-strong hover:bg-surface-muted min-h-11
```

**Card (static)**
```
rounded-md border border-line bg-surface p-4
```

**Card (interactive / selectable)** — used in browse grids and list items
```
rounded-lg border border-line-strong bg-surface p-4 hover:border-brand hover:bg-brand-surface min-h-24
```

**Text input / textarea / select** (uniform border + focus; select adds `min-h-11 bg-surface`)
```
w-full rounded-md border border-line-stronger px-3 py-2 text-sm focus:border-brand
```

**Field label**
```
block text-sm font-medium text-ink mb-1
```
Required marker: `<span aria-hidden="true" class="text-danger"> *</span>` plus a
visually-hidden `(required)`.

**Inline error** (`role="alert"`)
```
mt-1 text-xs text-danger
```

**Error summary** (top of form, anchors to each field — see §8)
```
rounded-md border border-danger bg-danger-surface p-4   /* heading + links in text-danger-ink */
```

**Success panel**
```
rounded-lg border border-success bg-success-surface p-5   /* text-success-ink */
```

**Warning callout** (`role="note"`)
```
rounded-md border border-warning bg-warning-surface p-3 text-sm text-warning-ink
```

**Info callout**
```
rounded-lg border border-brand bg-brand-surface p-4
```

**Badge / pill**
```
rounded-full border px-2 py-0.5 text-xs font-medium   /* + raw jurisdiction/tone classes, see §3 */
```

**Tab (mode bar item)**
```
block px-4 py-3 text-sm border-b-2 -mb-px min-h-11
selected:  border-brand bg-brand-surface text-brand-ink font-semibold
rest:      border-transparent text-ink-strong hover:bg-surface-muted hover:border-line-stronger
```

**Eyebrow / overline**
```
text-xs uppercase tracking-wide text-ink-muted
```

---

## 7. Layout patterns

- **App shell:** `min-h-screen bg-canvas text-ink flex flex-col`.
- **Header / footer:** `border-b|border-t border-line bg-surface`.
- **Primary layout:** sidebar + content via
  `md:grid md:grid-cols-[320px_1fr]`; the topic nav is a sticky full-height
  aside on `md+`, a toggle-disclosure on mobile.
- **Content width caps:** forms and prose use `max-w-2xl`; data views
  `max-w-4xl`; the accessibility footer `max-w-5xl`.
- **Mode bar:** full-width tablist below the header; items `flex-1 min-w-36`,
  wrap on small screens.

---

## 8. Accessibility (required)

This portal is held to WCAG 2.1 AA and audited with axe. New work must keep:

- **Visible focus** — global `*:focus-visible` outline: 2px solid `brand`,
  2px offset (defined in `index.css`, wired to `--color-focus-ring`).
- **Skip link** — `.skip-link` jumps to `#main`; keep `<main id="main"
  tabIndex={-1}>`.
- **44px targets** — `min-h-11` on all interactive controls (WCAG 2.5.5).
- **Color is never the only signal** — pair status hues with text/labels;
  badges carry `aria-label`.
- **Contrast** — use the `-ink` tokens on tinted surfaces and `text-ink-muted` or
  darker on white. Every token pairing was verified to WCAG 2.1 AA (see
  `/ACCESSIBILITY_AUDIT.md`); `ink-subtle` is decorative only, never text. The
  brand terracotta (`#a8501e`) is reused for the MapLibre attribution links.
- **Forms** — `noValidate` + zod validation; an error **summary** with
  `role="alert"` and in-page anchor links (`#f-<field>`) to each invalid field;
  inputs set `aria-invalid` / `aria-describedby` / `aria-required`.
- **Headings move focus** — section H2s are `tabIndex={-1}` and focused on
  navigation so screen-reader users land in the right place.
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` neutralizes
  animation/transition durations globally; don't bypass it.

Run the audit before shipping:
```
node scripts/axe-audit.mjs
```

---

## 9. Maintenance notes

- **Tokens live in `src/index.css`** (`@theme` block). Add new semantic tokens
  there rather than hard-coding new hex values in components.
- **`src/App.css` is dead code** — leftover from the Vite React template
  (`.hero`, `.vite`, `--accent`, etc.). It is imported nowhere and references
  undefined variables. Safe to delete; it is not part of this design system.
- When introducing a genuinely new color need, first check whether an existing
  status or neutral token fits. Add a new hue only for a new *category* of
  meaning, and document it here.
