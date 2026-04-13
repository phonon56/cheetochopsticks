/**
 * cheetochopsticks.com — main.js  v0.1
 *
 * Site-wide JavaScript — navigation, You+ dropdown,
 * keyboard nav, scroll behaviors, reveal animations.
 *
 * No framework dependencies. Vanilla ES2020+.
 * All interactive components are progressively enhanced
 * and accessible without JavaScript where possible.
 */

'use strict';

/* ── Utility helpers ─────────────────────────────────────── */

/**
 * Post a message to an aria-live region without
 * double-firing if the text is the same as what's there.
 */
function announce(regionId, message) {
  const el = document.getElementById(regionId);
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}

/**
 * Trap focus inside a container element.
 * Returns a cleanup function that removes the listener.
 */
function trapFocus(container) {
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
    const last  = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}


/* ── Navigation — scroll state ───────────────────────────── */

function initNavScroll() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const update = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* ── Mobile nav drawer ───────────────────────────────────── */

function initMobileNav() {
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.nav-drawer');
  if (!hamburger || !drawer) return;

  let cleanupTrap = null;

  const open = () => {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('open');
    drawer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    cleanupTrap = trapFocus(drawer);
    const firstLink = drawer.querySelector('a, button');
    if (firstLink) firstLink.focus();
    announce('live-region', 'Navigation menu opened.');
  };

  const close = () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    if (cleanupTrap) { cleanupTrap(); cleanupTrap = null; }
    // Reset display after CSS transition finishes (350ms)
    setTimeout(() => { drawer.style.display = ''; }, 360);
    hamburger.focus();
    announce('live-region', 'Navigation menu closed.');
  };

  const toggle = () => {
    hamburger.getAttribute('aria-expanded') === 'true' ? close() : open();
  };

  hamburger.addEventListener('click', toggle);

  // Escape closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });

  // Close on drawer link click
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });
}


/* ── You+ dropdown ───────────────────────────────────────── */

function initYouPlusDropdown() {
  const trigger  = document.querySelector('.you-plus-trigger');
  const dropdown = document.querySelector('.you-plus-dropdown');
  if (!trigger || !dropdown) return;

  let isOpen = false;
  let cleanupTrap = null;

  const open = () => {
    isOpen = true;
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.classList.add('open');
    cleanupTrap = trapFocus(dropdown);
    // Move focus to first tile
    const first = dropdown.querySelector('.dropdown-tile, a, button');
    if (first) requestAnimationFrame(() => first.focus());
    announce('live-region', 'You Plus menu opened. Select a data scope.');
  };

  const close = (returnFocus = true) => {
    isOpen = false;
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('open');
    if (cleanupTrap) { cleanupTrap(); cleanupTrap = null; }
    if (returnFocus) trigger.focus();
    announce('live-region', 'You Plus menu closed.');
  };

  const toggle = () => isOpen ? close() : open();

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Escape closes, returns focus to trigger
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close(true);
  });

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (isOpen && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
      close(false);
    }
  });

  // Arrow key nav inside dropdown tiles
  const tiles = () => Array.from(dropdown.querySelectorAll('.dropdown-tile'));

  dropdown.addEventListener('keydown', (e) => {
    const all = tiles();
    const idx = all.indexOf(document.activeElement);
    if (idx === -1) return;

    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = all[(idx + 1) % all.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = all[(idx - 1 + all.length) % all.length];
    } else if (e.key === 'Home') {
      next = all[0];
    } else if (e.key === 'End') {
      next = all[all.length - 1];
    }

    if (next) { e.preventDefault(); next.focus(); }
  });
}


/* ── Scroll reveal (Intersection Observer) ───────────────── */

function initReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just show everything
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}


/* ── Ticker duplication (seamless loop) ──────────────────── */

function initTicker() {
  const track = document.querySelector('.ticker-track');
  if (!track) return;

  // Clone children for seamless loop
  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
}


/* ── Active nav link (simple path match) ─────────────────── */

function initActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const isActive = href === '/' ? path === '/' : path.startsWith(href);
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
  });
}


/* ── Smooth scroll for hash links ────────────────────────── */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY
                  - (parseInt(getComputedStyle(document.documentElement)
                      .getPropertyValue('--nav-h')) || 64) - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}


/* ── Mobile nav toggle (simple version for microsites) ──── */

function toggleMobileNav() {
  const nav = document.getElementById('nav-links');
  const btn = document.querySelector('.nav-menu-btn');
  if (!nav || !btn) return;
  const open = nav.classList.toggle('mobile-open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  btn.textContent = open ? 'Close' : 'Menu';
}


/* ── Notifications panel ────────────────────────────────── */

var _notifLastFocus;

function openNotif() {
  _notifLastFocus = document.activeElement;
  var overlay = document.getElementById('notif-overlay');
  var panel   = document.getElementById('notif-panel');
  var btn     = document.querySelector('.notif-btn');
  if (!overlay || !panel) return;
  overlay.classList.add('open');
  overlay.removeAttribute('aria-hidden');
  panel.classList.add('open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  setTimeout(function() { panel.focus(); }, 50);
}

function closeNotif() {
  var overlay = document.getElementById('notif-overlay');
  var panel   = document.getElementById('notif-panel');
  var btn     = document.querySelector('.notif-btn');
  if (!overlay || !panel) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  panel.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  if (_notifLastFocus) _notifLastFocus.focus();
}

function filterNotif(tier, btn) {
  document.querySelectorAll('.nf-btn').forEach(function(b) {
    b.classList.remove('active');
    b.removeAttribute('aria-pressed');
  });
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  }
  document.querySelectorAll('.notif-item').forEach(function(item) {
    if (tier === 'all') {
      item.classList.remove('hidden');
      item.removeAttribute('aria-hidden');
    } else {
      var hide = item.dataset.tier !== tier;
      item.classList.toggle('hidden', hide);
      hide ? item.setAttribute('aria-hidden','true') : item.removeAttribute('aria-hidden');
    }
  });
  document.querySelectorAll('.notif-group-label').forEach(function(label) {
    label.style.display = tier === 'all' ? '' : 'none';
  });
}


/* ── Data table toggle ──────────────────────────────────── */

function toggleDT(id) {
  var w = document.getElementById(id);
  if (!w) return;
  var open = w.classList.toggle('open');
  document.querySelectorAll('[aria-controls="' + id + '"]').forEach(function(b) {
    b.setAttribute('aria-expanded', open);
    b.textContent = open ? 'Hide table' : 'View table';
  });
}


/* ── Notification panel keyboard handlers ───────────────── */

function initNotifKeyboard() {
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeNotif();
    var panel = document.getElementById('notif-panel');
    if (panel && e.key === 'Tab' && panel.classList.contains('open')) {
      var focusable = panel.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });
}


/* ── Boot ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initMobileNav();
  initYouPlusDropdown();
  initReveal();
  initTicker();
  initActiveNav();
  initSmoothScroll();
  initNotifKeyboard();
});
