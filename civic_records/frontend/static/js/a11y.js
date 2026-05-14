/**
 * Civic Records — accessibility helpers
 *
 * Vanilla ES2020+. No selectors baked in — these are
 * pure helpers other scripts compose with.
 *
 * Patterned after the cheetochopsticks shared/js/main.js
 * helpers so the two civic-tech projects share idioms.
 */

'use strict';

/**
 * Post a message to an aria-live region. Re-fires reliably
 * even if the same text is announced twice in a row by
 * clearing the region first.
 *
 *   <div id="live-region" class="sr-live" aria-live="polite"></div>
 *   announce('live-region', 'Search returned 12 results.');
 */
export function announce(regionId, message) {
    const el = document.getElementById(regionId);
    if (!el) return;
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = message; });
}

/**
 * Trap focus inside a container element. Useful for modals,
 * drawers, and dropdown panels. Returns a cleanup function
 * that removes the listener.
 */
export function trapFocus(container) {
    const focusable = [
        'a[href]', 'button:not([disabled])', 'input:not([disabled])',
        'select:not([disabled])', 'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handler = (e) => {
        if (e.key !== 'Tab') return;
        const els = Array.from(container.querySelectorAll(focusable));
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
}
