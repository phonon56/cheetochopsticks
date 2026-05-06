/**
 * pikes-peak-eop.js
 *
 * Pikes Peak Regional EOP — page behaviors.
 *   • Back-to-top button (toggles .is-visible based on scroll)
 *   • Scroll-spy that updates aria-current="location" on the TOC
 *
 * Wrapped in Drupal.behaviors so it attaches on initial load and on
 * AJAX-injected content (e.g., Layout Builder previews, Views refresh).
 *
 * Convention: state class is .is-visible (matches shared/js/main.js).
 */

(function (Drupal, once) {
  'use strict';

  /* ── Back-to-top ─────────────────────────────────────────── */
  Drupal.behaviors.eopBackToTop = {
    attach: function (context) {
      once('eop-back-to-top', '.eop-back-to-top', context).forEach(function (btn) {
        var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function toggle() {
          if (window.scrollY > 600) {
            btn.classList.add('is-visible');
          } else {
            btn.classList.remove('is-visible');
          }
        }
        window.addEventListener('scroll', toggle, { passive: true });
        toggle();

        btn.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: prefersReduce ? 'auto' : 'smooth' });
          var main = document.getElementById('main-content');
          if (main) main.focus({ preventScroll: true });
        });
      });
    }
  };


  /* ── TOC scroll-spy ──────────────────────────────────────── */
  Drupal.behaviors.eopTocScrollSpy = {
    attach: function (context) {
      once('eop-toc-spy', '.eop-toc__list', context).forEach(function (toc) {
        var links = toc.querySelectorAll('a[href^="#"]');
        if (!('IntersectionObserver' in window) || links.length === 0) return;

        var linkById = {};
        links.forEach(function (a) {
          var id = a.getAttribute('href').slice(1);
          linkById[id] = a;
        });

        var visible = new Set();

        function setCurrent() {
          var topId = null;
          var topY = Infinity;
          visible.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            var y = el.getBoundingClientRect().top;
            if (y < topY) {
              topY = y;
              topId = id;
            }
          });
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          if (topId && linkById[topId]) {
            linkById[topId].setAttribute('aria-current', 'location');
          }
        }

        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              visible.add(e.target.id);
            } else {
              visible.delete(e.target.id);
            }
          });
          setCurrent();
        }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

        Object.keys(linkById).forEach(function (id) {
          var section = document.getElementById(id);
          if (section) observer.observe(section);
        });
      });
    }
  };

})(Drupal, once);
