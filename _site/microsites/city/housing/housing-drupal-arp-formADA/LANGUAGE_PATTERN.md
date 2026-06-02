---
layout: markdown.njk
permalink: "/microsites/city/housing/housing-drupal-arp-formADA/language-pattern.html"
title: "Bilingual Form Pattern \u2014 EN/ES Language Switcher"
description: "Reusable accessible language-switcher pattern for any bilingual form on the City of Colorado Springs site."
activeNav: "you"
---

This pattern is what to use site-wide for any city page or form that needs to offer multiple languages. It is consistent with WCAG 2.1 AA and with established practice on US federal and state government sites (HUD, ada.gov, NYC.gov, California state portal).

## The pattern in one sentence

A persistent header-region block of `<a>` links — one per available language, each labeled in its own native language, with `lang` and `hreflang` attributes — pointing to URL-prefixed equivalents of the current page.

## What renders

```html
<nav aria-label="Language selection">
  <ul>
    <li>
      <a href="/en/home-arp-comment" lang="en" hreflang="en">English</a>
    </li>
    <li>
      <a href="/es/home-arp-comment" lang="es" hreflang="es" aria-current="page">Español</a>
    </li>
  </ul>
</nav>
```

## Why this and not other patterns

**Why `<a>` and not `<select>`.** A select element styled as a dropdown is a common pattern but carries two real problems. First, it traps focus inside the form-control role and changes context only on `change`, which is unpredictable for screen reader users. Second, it requires JavaScript to navigate, breaking for users with JS disabled or behind certain enterprise filters. Native links don't have these issues.

**Why URL prefix and not a cookie or browser-language detection alone.** URL prefixes make pages shareable, bookmarkable, and indexable in the right language. A cookie-based or session-based selector creates situations where User A shares a URL with User B and User B sees the wrong language. URL prefixes are the only mechanism that survives sharing.

**Why native language names.** A user who needs the Spanish form is by hypothesis more comfortable reading "Español" than "Spanish." This is the federal government standard practice and the W3C recommendation.

**Why `lang` and `hreflang` attributes.** Without `lang`, screen readers pronounce "Español" using English phonemes, which is jarring at best. Without `hreflang`, search engines can't index the language variants correctly.

**Why `aria-current="page"` on the active option.** Screen reader users can navigate to the language switcher and immediately know which language they're currently viewing without re-reading the URL or page title.

## What to avoid

- Globe icons without text. Pure-icon switchers fail WCAG 2.5.3 (Label in Name). If you want an icon, pair it with visible text.
- Flags as the language indicator. Flags represent countries, not languages. Spanish-speakers in Colorado Springs are not necessarily Mexican; using the Mexican flag for the Spanish option misrepresents the language as belonging to one nationality.
- Auto-redirect on first visit based on `Accept-Language`. If you must do this, store the user's explicit choice from then on, and never override the URL prefix when the user has set one.
- Putting the switcher only in the footer. It needs to be discoverable on first paint; users who can't read the page well don't necessarily know to scroll to find help.

## Drupal implementation

Drupal core's Language Switcher block produces output close to the pattern above. To get it fully right:

1. **Configure native language names.** At `/admin/config/regional/language`, edit Spanish and confirm the native name is `Español` (Drupal's default — verify it wasn't overridden).

2. **Place the block in the header region.**
   ```
   Admin → Structure → Block layout → Header region → Place block
     Block: Language switcher (Interface text)
   ```
   Use the "Interface text" variant, not the "Content language" variant, for site-wide navigation. Use the content variant for entity-specific switching where the entity has translations.

3. **Theme adjustments.** In your theme's `language-block.html.twig` (or a similar template name depending on the base theme), confirm the rendered HTML includes:
   - A wrapping `<nav>` with `aria-label="Language selection"`.
   - `<a>` elements for each language with `lang` and `hreflang` attributes (Drupal core adds these by default; if your theme has overridden the template, restore them).
   - `aria-current="page"` (or `aria-current="true"`) on the active language link.

4. **Keyboard test.** Tab to the language switcher from the page top. Confirm focus is visible, both options are reachable, and Enter follows the link.

5. **Screen reader test.** With NVDA or VoiceOver, navigate to the switcher. Confirm: the navigation landmark is announced ("Language selection navigation"), each link is announced with its native pronunciation thanks to `lang`, and the active language is announced as current.

## Reuse across the site

Once the language switcher is configured site-wide, every form, document landing page, and content page that has a Spanish translation gets the switcher automatically. The accessibility work is done once, in the theme template; individual forms and pages don't repeat it.

For forms specifically, the rule of thumb is: **the form is bilingual when its labels, options, descriptions, and confirmation messages are translated; the language switcher just routes the user to the right rendering.** The switcher is a navigation control, not a form control. Don't put it inside the form element.

## Beyond English and Spanish

When the city is ready to add a third language (Tagalog and Vietnamese are the next-likely candidates for Colorado Springs based on local LEP populations), the pattern extends without change: add the language to Drupal, translate the form's strings, and the switcher block automatically picks up the new option. Provided the translations are in place, no code changes are required to add a language to any form using this pattern.
