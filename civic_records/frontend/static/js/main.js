/**
 * Civic Records — site-wide JavaScript
 *
 * Vanilla ES2020+. Progressive enhancement only —
 * everything must work without JS.
 */

import { announce, trapFocus } from './a11y.js';

/* ── Site nav: scroll state ──────────────────────────────── */

function initNavScroll() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    const update = () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

/* ── Site nav: mobile drawer ─────────────────────────────── */

function initMobileNav() {
    const hamburger = document.querySelector('.nav-hamburger');
    const drawer = document.querySelector('.nav-drawer');
    if (!hamburger || !drawer) return;

    let cleanupTrap = null;

    const open = () => {
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Close menu');
        drawer.classList.add('open');
        drawer.removeAttribute('aria-hidden');
        document.body.style.overflow = 'hidden';
        cleanupTrap = trapFocus(drawer);
        const firstLink = drawer.querySelector('a, button');
        if (firstLink) firstLink.focus();
        announce('live-region', 'Menu opened.');
    };

    const close = () => {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open menu');
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (cleanupTrap) { cleanupTrap(); cleanupTrap = null; }
        hamburger.focus();
        announce('live-region', 'Menu closed.');
    };

    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        isOpen ? close() : open();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });

    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', close);
    });
}

/* ── Active nav link ─────────────────────────────────────── */

function initActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link, .nav-drawer-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const isActive = href === '/' ? path === '/' : path.startsWith(href);
        if (isActive) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/* ── Smooth scroll for in-page anchors ───────────────────── */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href === '#' || href.length < 2) return;

        link.addEventListener('click', (e) => {
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    });
}

/* ── Search results announcement ─────────────────────────── */

function initSearchAnnouncement() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q) return;

    const parcelCount = document.querySelectorAll(
        '[aria-labelledby="parcel-results-heading"] .result-list li'
    ).length;
    const recordCount = document.querySelectorAll(
        '[aria-labelledby="record-results-heading"] .result-list li'
    ).length;

    const total = parcelCount + recordCount;
    const msg = total === 0
        ? `No results for "${q}".`
        : `Found ${total} result${total === 1 ? '' : 's'} for "${q}".`;

    announce('live-region', msg);
}

/* ── Boot ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
    initNavScroll();
    initMobileNav();
    initActiveNav();
    initSmoothScroll();
    initSearchAnnouncement();
});
