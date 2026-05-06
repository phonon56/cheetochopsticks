<?php
/**
 * Plugin Name: EPC Public Works — Accessibility Remediation
 * Description: Targeted WCAG 2.1 AA fixes for publicworks.elpasoco.com, focused on the
 *              Road & Bridge page. Implements the fixable findings from the
 *              ADA / WCAG 2.1 AA audit dated 2026-05-06.
 * Version:     1.0.0
 * Author:      Audit remediation
 * License:     MIT
 *
 * ============================================================================
 *  HOW TO INSTALL  (no developer required)
 * ============================================================================
 *
 *  1. Connect to the WordPress server via SFTP, the host's file manager, or
 *     the WP file editor (Tools → File Manager on most hosts).
 *
 *  2. Navigate to:    /wp-content/mu-plugins/
 *
 *     If the directory `mu-plugins` does not exist yet, create it.
 *     "mu" stands for "must-use" — plugins in this folder load automatically
 *     and cannot be deactivated from the dashboard.
 *
 *  3. Upload this file as:
 *        /wp-content/mu-plugins/epc-publicworks-a11y.php
 *
 *  4. Done. There is no activation step. Load the Road & Bridge page in
 *     a private browser window to verify the fixes are live (view-source
 *     and search for "epc-a11y" — you should see a marker comment).
 *
 *  To uninstall:    delete the file. No database changes are made.
 *
 * ============================================================================
 *  WHAT THIS FIXES  (mapped to audit finding IDs, May 6 2026 audit)
 * ============================================================================
 *
 *  Scope key:
 *    [SITEWIDE]      runs on every front-end request
 *    [TARGET]        runs only on /road-bridge/ (the audited URL)
 *    [SETTINGS-FIX]  the right answer is a config change, not this code —
 *                    the plugin only provides a defensive shim
 *
 *   F-01  [SITEWIDE-JS]  Hash-fragment deep links move keyboard focus into
 *         the target accordion panel and open it.
 *   F-02  [TARGET-PHP]   Hero image (Grading-County-Roads.jpg) gets a
 *         descriptive alt.
 *   F-03  [TARGET-PHP]   Empty <a href=""></a> anchors stripped (defensive;
 *         not seen in the May 2026 source pull).
 *   F-04  [SITEWIDE-PHP] Search trigger <a href="javascript:void(0)"> is
 *         rewritten as <button type="button" aria-label="Search">. Sitewide
 *         because this anchor is in the header on every page.
 *   F-05  [TARGET-PHP]   Adopt-a-Road link text "here" → "Adopt-a-Road
 *         program page".
 *   F-07  [TARGET-PHP]   Second <h1> on the page demoted to <h2>. Other
 *         pages already have a single H1.
 *   F-08  [SITEWIDE-JS]  PDF links get a "(PDF)" indicator appended.
 *   F-09  [SITEWIDE-JS]  WPBakery accordion triggers receive role=button,
 *         aria-controls, and a live aria-expanded that mirrors panel state.
 *   F-10  *Not patched.* The7 theme already ships aria-haspopup and
 *         aria-expanded on parent menu links; layering a second handler
 *         would race The7's own state management. Needs live keyboard
 *         testing first; if broken, fix in a child theme override.
 *   F-11  [SITEWIDE-JS / SETTINGS-FIX] Belt-and-braces: footer subscribe
 *         email field gets aria-label and aria-required when no associated
 *         <label> is present. THE PROPER FIX is in the Gravity Forms editor.
 *   F-12  [SITEWIDE-CSS] Brand color #0074B7 overridden to #005C91 (6.5:1
 *         contrast on white) for text and link uses.
 *   F-13  [SITEWIDE-JS]  US phone numbers in body content become tel: links.
 *   F-15  [SITEWIDE-JS]  Skip-link target moved past the breadcrumb to the
 *         page H1.
 *
 * ============================================================================
 *  WHAT THIS DOES NOT FIX  (these need human work, not code)
 * ============================================================================
 *
 *   F-06  14 repeated "Citizen Connect" callouts on road-bridge, plus 3
 *         more in the site nav and 1 in the footer. Consolidating them is a
 *         content/IA decision a human should make.
 *   F-10  Mega-menu disclosure behavior. The7 theme ships the right markup
 *         (aria-haspopup, aria-expanded). What's not verified by static
 *         inspection: keyboard behavior, focus management, Escape-to-close.
 *         Test live with NVDA + Firefox before deciding whether to patch.
 *   F-11  Subscribe form. The CORRECT fix is in Gravity Forms field
 *         settings: open Forms → (form) → Email field → Appearance, set
 *         "Custom Validation Message" / label visibility, and ensure the
 *         field's "Required" toggle is on. Gravity Forms emits proper
 *         <label for> + aria-required automatically when configured.
 *   F-14  Slider Revolution audit / replacement. Plugin-level work.
 *   F-16  Opaque accordion IDs (#1521730235050-eeb77351-ce78). Best fixed
 *         by editing each accordion in WPBakery's editor and setting a
 *         human-readable Section ID (e.g. "mowing").
 *   F-17  Plain-language rewrites of policy content.
 *   F-19  "Top Bar Menu" — needs design intent before remediation.
 *
 * ============================================================================
 *  SAFETY NOTES
 * ============================================================================
 *
 *  - PHP rewrites run on every page via `ob_start()`, but the actual work
 *    is split:
 *      * SITEWIDE rewrites: only F-04 (search anchor → button), one regex
 *        against the header pattern. Cheap.
 *      * TARGET rewrites (F-02, F-03, F-05, F-07): additionally run on
 *        /road-bridge/ URLs only.
 *  - ARIA fixes (JS) and color override (CSS) run site-wide because they
 *    are additive and safe (CSS is scoped to known-white content regions
 *    so we don't recolor links on dark backgrounds).
 *  - All regex rewrites are targeted; they will be no-ops if the markup
 *    they expect is no longer present after a theme update.
 *  - To narrow JS/CSS to one page, see `epc_a11y_should_run_globally()`
 *    below. To disable sitewide PHP rewrites entirely, comment out the
 *    `add_action('template_redirect', ...)` block.
 *
 * ============================================================================
 *  THIS PLUGIN IS TEMPORARY — PLAN TO RETIRE IT
 * ============================================================================
 *
 *  This file is a triage layer. Every fix in here is a workaround for
 *  upstream markup that the theme, WPBakery shortcodes, or Slider Revolution
 *  is producing incorrectly. The right long-term fix is to correct the
 *  source — not to keep regex-rewriting the output forever.
 *
 *  Cost of leaving this in place:
 *    - PHP `ob_start()` runs on every front-end page render. The sitewide
 *      branch is a single regex (≈ 1–3 ms). The road-bridge branch runs
 *      additional regexes (≈ 5–15 ms total) on that page only.
 *    - Mitigated heavily by page caching (WP Super Cache, W3 Total Cache,
 *      CDN HTML caching) — with caching on, the rewrite runs once per
 *      cache miss and the cached HTML is served thereafter at zero cost.
 *    - Regex fragility: a theme or page-builder update can change the
 *      surrounding markup and silently turn a fix into a no-op.
 *    - One more thing for the next maintainer to discover and reason about.
 *
 *  Recommended retirement path  (target: within 60–90 days):
 *
 *    1. THEME / TEMPLATE EDITS — move these out of regex into source markup:
 *         F-02  Set the hero image's alt in Media Library or template.
 *         F-03  Find and delete the empty <a></a> in the header template.
 *         F-04  Replace the search anchor with a real <button> in header.php
 *               (or the relevant theme part).
 *         F-05  Edit the Adopt-a-Road sentence in the page content directly.
 *         F-07  Remove the duplicate H1 from the page template.
 *         F-08  Edit the PDF link text in the page content to include "(PDF)".
 *         F-13  Edit phone numbers in content to be real <a href="tel:"> links.
 *
 *    2. PAGE-BUILDER & THEME REPLACEMENT — F-09, F-10, F-14:
 *         a) WPBakery (js_composer) accordions: replace with a properly-built
 *            disclosure pattern (WAI-ARIA Authoring Practices: Disclosure).
 *            Until then, the JS shim in this file handles ARIA at runtime.
 *         b) The7 theme mega-menu: live-test The7's runtime keyboard behavior
 *            first. If broken, override `walker_nav_menu` in a child theme
 *            (The7 supports child themes; this site already uses one — `epc`)
 *            to emit real <button> elements for parent items, or contact
 *            Dream-Theme (theme vendor) for an a11y patch. DO NOT layer a
 *            JS shim on top — it will fight The7's own state management.
 *         c) Slider Revolution: audit each instance for keyboard escape,
 *            pause controls, and accessible names. Consider replacement
 *            with Splide + a11y plugin or a native HTML carousel.
 *
 *    3. FORM PLUGIN CONFIG — F-11  (this is a 2-minute fix, no code):
 *         a) WP Admin → Forms → (subscribe form) → Email field
 *         b) Set "Field Label" to "Email" (visible) and ensure "Required" is on.
 *         c) Under "Appearance", set "Description Placement" → "Below input".
 *         d) Save. Gravity Forms then emits:
 *              <label for="input_X_Y">Email <span class="gfield_required">*</span></label>
 *              <input ... aria-required="true" required="" />
 *            …which is the correct WCAG markup. The JS shim in this file
 *            becomes redundant once the form is configured properly.
 *
 *    4. THEME STYLESHEET — F-12:
 *         Update the theme's brand color variable from #0074B7 to #005C91
 *         in the actual stylesheet so the override here becomes redundant.
 *
 *    5. AS EACH ITEM IS RESOLVED UPSTREAM:
 *         Comment out or delete the matching block in this file. When all
 *         findings are addressed at the source, delete the file entirely.
 *
 *  Re-audit checkpoint: after every batch of upstream fixes, re-run an
 *  automated scan (axe DevTools, WAVE) and screen-reader spot checks before
 *  removing the matching shim from this plugin. The plugin should shrink
 *  over time, not accumulate. If a year from now this file has grown rather
 *  than shrunk, that is a signal to escalate the upstream work, not to add
 *  more shims.
 *
 * ============================================================================
 */

if (!defined('ABSPATH')) { exit; }

/**
 * Should this page receive the targeted CONTENT rewrites?
 * Restricted to the audited page to keep blast radius small.
 */
function epc_a11y_is_target_page() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    return (strpos($uri, '/road-bridge') !== false);
}

/**
 * Should the global JS/CSS fixes run on this page?
 * Default: site-wide. Restrict here if you want it only on road-bridge.
 */
function epc_a11y_should_run_globally() {
    return !is_admin();
}

/* -------------------------------------------------------------------------
 *  PHP: HTML rewrite via output buffer  (content fixes for road-bridge)
 * ------------------------------------------------------------------------- */

add_action('template_redirect', function () {
    if (is_admin()) { return; }
    // Sitewide rewrites are cheap and apply on every page.
    // Page-specific rewrites only run when the URL matches.
    ob_start(epc_a11y_is_target_page()
        ? 'epc_a11y_rewrite_html_full'
        : 'epc_a11y_rewrite_html_sitewide');
});

/**
 * Sitewide rewrites — small, targeted, run on every page.
 * Currently: F-04 (search anchor → button). Phone (F-13) and PDF (F-08)
 * indicators are handled in JS sitewide instead, since the DOM walk is
 * cheaper than a server-side scan of the full page on every request.
 */
function epc_a11y_rewrite_html_sitewide($html) {
    if (!is_string($html) || strlen($html) < 200) { return $html; }
    $html = preg_replace('#</head>#i', "<!-- epc-a11y v1.0.0 active (sitewide) -->\n</head>", $html, 1);
    return epc_a11y_apply_sitewide_rewrites($html);
}

/**
 * Full rewrite stack for the audited target page (road-bridge).
 * Includes the sitewide rewrites plus page-specific content fixes.
 */
function epc_a11y_rewrite_html_full($html) {
    if (!is_string($html) || strlen($html) < 200) { return $html; }
    $html = preg_replace('#</head>#i', "<!-- epc-a11y v1.0.0 active (full) -->\n</head>", $html, 1);

    $html = epc_a11y_apply_sitewide_rewrites($html);

    // F-02: hero image alt text. (page-specific: targets the road-bridge hero)
    $html = preg_replace_callback(
        '#(<img\b[^>]*Grading-County-Roads[^>]*?)(\s+alt="")?([^>]*>)#i',
        function ($m) {
            $tag = $m[1] . $m[3];
            $tag = preg_replace('#\s+alt="[^"]*"#i', '', $tag);
            return preg_replace('#(/?>)$#', ' alt="County motor grader smoothing a gravel road"$1', $tag);
        },
        $html
    );

    // F-03: strip empty anchors. (defensive — not seen in 2026-05 source pull)
    $html = preg_replace('#<a\s+href=""\s*>\s*</a>#i', '', $html);
    $html = preg_replace('#<a>\s*</a>#i', '', $html);

    // F-05: generic "here" link in Adopt-a-Road sentence. (page-specific)
    $html = preg_replace_callback(
        '#(<a\b[^>]*adopt[^>]*>)\s*here\s*(</a>)#i',
        function ($m) { return $m[1] . 'Adopt-a-Road program page' . $m[2]; },
        $html
    );
    $html = preg_replace(
        '#(Adopt-a-Road program[^<]{0,80}?)<a\b([^>]*)>\s*here\s*</a>#i',
        '$1<a$2>Adopt-a-Road program page</a>',
        $html
    );

    // F-07: demote SECOND <h1> on the page to <h2>. (page-specific)
    $html = epc_a11y_demote_second_h1($html);

    return $html;
}

/**
 * F-04: rewrite the header search anchor as a real button.
 * Safe to run sitewide because it's a single regex against a header pattern.
 */
function epc_a11y_apply_sitewide_rewrites($html) {
    $html = preg_replace_callback(
        '#<a\b([^>]*?)href=(["\'])\s*javascript:\s*void\s*\(\s*0\s*\)\s*;?\s*\2([^>]*)>(.*?)</a>#is',
        function ($m) {
            $before = $m[1];
            $after  = $m[3];
            $inner  = $m[4];
            $attrs  = trim($before . ' ' . $after);
            $attrs  = preg_replace('#\srole=(["\'])[^"\']*\1#i', '', $attrs);
            $name   = (trim(strip_tags($inner)) === '') ? ' aria-label="Search"' : '';
            return '<button type="button"' . $name . ' ' . $attrs . '>' . $inner . '</button>';
        },
        $html
    );
    return $html;
}

/**
 * Demote the second <h1> element (and its closing tag) to <h2>.
 * Position-based so the regex stays simple and scoped.
 */
function epc_a11y_demote_second_h1($html) {
    if (!preg_match_all('#<h1\b[^>]*>#i', $html, $opens, PREG_OFFSET_CAPTURE) || count($opens[0]) < 2) {
        return $html;
    }
    $second_open      = $opens[0][1][0];
    $second_open_pos  = $opens[0][1][1];
    $second_open_len  = strlen($second_open);

    $close_pos = stripos($html, '</h1>', $second_open_pos + $second_open_len);
    if ($close_pos === false) { return $html; }

    // Replace close tag first so the open-tag offset stays valid.
    $html = substr_replace($html, '</h2>', $close_pos, 5);

    $new_open = preg_replace('#^<h1#', '<h2', $second_open);
    $html = substr_replace($html, $new_open, $second_open_pos, $second_open_len);

    return $html;
}

/* (Phone-number linkification moved to JS — see fixPhoneNumbers() in the
   footer script. DOM walking is cheaper than server-side regex over the
   full page on every request, and works sitewide rather than per-URL.) */

/* -------------------------------------------------------------------------
 *  CSS: brand-color contrast override (F-12) + supporting styles
 * ------------------------------------------------------------------------- */

add_action('wp_head', function () {
    if (!epc_a11y_should_run_globally()) { return; }
    ?>
<style id="epc-a11y-css">
/* F-12: replace #0074B7 (4.61:1 on white) with #005C91 (6.5:1) for links.
   IMPORTANT: scoped to known-white content regions only. Do NOT use the
   bare `a {}` selector — it would recolor links on dark backgrounds
   (footer, hero overlays, sliders) and create new contrast failures. */
.entry-content a, .entry-content a:link, .entry-content a:visited,
article a, article a:link, article a:visited,
main a, main a:link, main a:visited,
.wpb-content-wrapper a,
.wpb_text_column a,
.vc_tta-color-blue .vc_tta-panel-title > a,
.vc_tta-panel-body a {
    color: #005C91;
}
/* Inline styles authored at #0074B7 (anywhere in the page). */
[style*="#0074B7" i],
[style*="#0074b7" i] { color: #005C91 !important; }

/* Skip-link visibility while focused (F-15 supporting style). */
.epc-skip-link:focus,
a[href="#content"]:focus,
.skip-link:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    clip: auto !important;
    overflow: visible !important;
    background: #005C91;
    color: #fff;
    padding: .5rem 1rem;
    z-index: 100000;
}

/* PDF format indicator (F-08). */
.epc-fmt { font-weight: normal; opacity: .8; }

/* Visible focus ring for keyboard users — applies everywhere additively. */
:focus-visible {
    outline: 2px solid #005C91;
    outline-offset: 2px;
}
</style>
    <?php
}, 99);

/* -------------------------------------------------------------------------
 *  JS: hash-focus, accordion ARIA, form labeling, skip-link, PDF tagging,
 *      phone-number tel: linkification.
 *  (Mega-menu intentionally NOT patched here — see F-10 notes above.)
 * ------------------------------------------------------------------------- */

add_action('wp_footer', function () {
    if (!epc_a11y_should_run_globally()) { return; }
    ?>
<script id="epc-a11y-js">
(function () {
    'use strict';

    /* ---------- F-01: focus into accordion target on hash navigation ---------- */
    function focusFromHash() {
        var hash = window.location.hash;
        if (!hash || hash.length < 2) { return; }
        var id = decodeURIComponent(hash.slice(1));
        var el = document.getElementById(id);
        if (!el) { return; }

        // Walk up to the nearest WPBakery accordion panel, if any.
        var panel = el.closest ? el.closest('.vc_tta-panel') : null;
        if (panel) {
            var trigger = panel.querySelector('.vc_tta-panel-title a, .vc_tta-panel-heading a, [role="button"]');
            if (trigger) {
                if (!panel.classList.contains('vc_active') &&
                    !panel.classList.contains('vc_tta-panel-active')) {
                    trigger.click();
                }
                setTimeout(function () {
                    trigger.focus();
                    trigger.scrollIntoView({ block: 'start', behavior: 'smooth' });
                }, 120);
                return;
            }
        }

        // Generic fallback.
        if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); }
        el.focus();
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    /* ---------- F-09: ARIA on WPBakery accordions ---------- */
    function fixAccordions() {
        var panels = document.querySelectorAll('.vc_tta-panel');
        panels.forEach(function (panel, i) {
            var title   = panel.querySelector('.vc_tta-panel-title');
            var body    = panel.querySelector('.vc_tta-panel-body');
            var trigger = title ? title.querySelector('a') : null;
            if (!trigger || !body) { return; }

            if (!body.id) { body.id = 'epc-panel-' + i; }
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('aria-controls', body.id);

            function syncState() {
                var open = panel.classList.contains('vc_active') ||
                           panel.classList.contains('vc_tta-panel-active');
                trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
                body.setAttribute('aria-hidden', open ? 'false' : 'true');
            }
            syncState();

            trigger.addEventListener('click', function () { setTimeout(syncState, 60); });
            trigger.addEventListener('keydown', function (e) {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    trigger.click();
                }
            });

            if (typeof MutationObserver !== 'undefined') {
                new MutationObserver(syncState).observe(panel, {
                    attributes: true, attributeFilter: ['class']
                });
            }
        });
    }

    /* ---------- F-10: mega-menu — INTENTIONALLY NOT PATCHED HERE.
       The7 theme already emits aria-haspopup="true" and aria-expanded="false"
       on parent menu links. Layering a second toggle handler would race
       The7's own state management. If live keyboard testing shows The7's
       runtime behavior is broken, the fix belongs in a child theme override
       of the nav walker, not in this plugin. ---------- */

    /* ---------- F-11: footer subscribe email field labeling
       (BELT-AND-BRACES — the proper fix is in the Gravity Forms field
       settings; this only kicks in when no <label> is associated). ---------- */
    function fixSubscribeForm() {
        document.querySelectorAll('input[type="email"]').forEach(function (input) {
            var hasLabel = (input.labels && input.labels.length > 0) ||
                           input.hasAttribute('aria-label') ||
                           input.hasAttribute('aria-labelledby');
            if (!hasLabel) {
                input.setAttribute('aria-label', 'Email address (required)');
            }
            // Visible "(Required)" text alone doesn't programmatically convey state.
            if (!input.hasAttribute('aria-required') && !input.required) {
                input.setAttribute('aria-required', 'true');
            }
        });
    }

    /* ---------- F-08 (sitewide): annotate PDF links with "(PDF)" ---------- */
    function fixPdfLinks() {
        var links = document.querySelectorAll('a[href$=".pdf" i], a[href*=".pdf?" i], a[href*=".pdf#" i]');
        links.forEach(function (a) {
            if (a.dataset.epcPdfTagged === '1') { return; }
            var text = (a.textContent || '').trim();
            if (text === '' || /\bpdf\b/i.test(text)) {
                a.dataset.epcPdfTagged = '1';
                return;
            }
            var span = document.createElement('span');
            span.className = 'epc-fmt';
            span.textContent = ' (PDF)';
            a.appendChild(span);
            a.dataset.epcPdfTagged = '1';
        });
    }

    /* ---------- F-13 (sitewide): wrap (XXX) XXX-XXXX phone numbers in tel: links.
       Walks text nodes, skips content already inside <a>, <button>, <input>,
       <script>, <style>, <textarea>. Handles multiple matches per node. ---------- */
    function fixPhoneNumbers() {
        var rxTest = /\(\d{3}\)\s*\d{3}-\d{4}/;
        var rxAll  = /\((\d{3})\)\s*(\d{3})-(\d{4})/g;
        var skipAncestor = /^(A|BUTTON|INPUT|SCRIPT|STYLE|TEXTAREA|NOSCRIPT|CODE|PRE)$/;

        if (!document.body || typeof document.createTreeWalker !== 'function') { return; }

        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!rxTest.test(node.nodeValue)) { return NodeFilter.FILTER_REJECT; }
                var p = node.parentElement;
                while (p) {
                    if (skipAncestor.test(p.tagName)) { return NodeFilter.FILTER_REJECT; }
                    p = p.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var nodes = [];
        var n;
        while ((n = walker.nextNode())) { nodes.push(n); }

        nodes.forEach(function (node) {
            var text = node.nodeValue;
            var frag = document.createDocumentFragment();
            var lastIdx = 0;
            var match;
            rxAll.lastIndex = 0;
            while ((match = rxAll.exec(text)) !== null) {
                if (match.index > lastIdx) {
                    frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
                }
                var a = document.createElement('a');
                a.href = 'tel:+1' + match[1] + match[2] + match[3];
                a.textContent = match[0];
                frag.appendChild(a);
                lastIdx = match.index + match[0].length;
            }
            if (lastIdx < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIdx)));
            }
            if (node.parentNode) { node.parentNode.replaceChild(frag, node); }
        });
    }

    /* ---------- F-15: ensure skip-link lands on the (now-single) H1 ---------- */
    function fixSkipLink() {
        var skip = document.querySelector('a.skip-link, a[href="#content"]');
        if (!skip) { return; }
        var target = document.getElementById('content');
        if (target && !target.querySelector('h1')) {
            // The "#content" anchor lands above chrome — point skip at the real H1 instead.
            var h1 = document.querySelector('main h1, .entry-content h1, h1');
            if (h1) {
                if (!h1.id) { h1.id = 'epc-main-heading'; }
                skip.setAttribute('href', '#' + h1.id);
                if (!h1.hasAttribute('tabindex')) { h1.setAttribute('tabindex', '-1'); }
            }
        }
    }

    function init() {
        try { fixAccordions(); }    catch (e) { /* fail open */ }
        try { fixSubscribeForm(); } catch (e) { /* fail open */ }
        try { fixSkipLink(); }      catch (e) { /* fail open */ }
        try { fixPdfLinks(); }      catch (e) { /* fail open */ }
        try { fixPhoneNumbers(); }  catch (e) { /* fail open */ }
        try { focusFromHash(); }    catch (e) { /* fail open */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.addEventListener('hashchange', function () {
        try { focusFromHash(); } catch (e) {}
    });
})();
</script>
    <?php
}, 99);
