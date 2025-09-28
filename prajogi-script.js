/* Prajogi Pangestu — Site interactions
   Framework: Vanilla JS + Bootstrap modal
   Notes: Keep this file light. No external deps needed.
*/
(() => {
  'use strict';

  // ===== Helpers
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Smooth section focus for a11y when using in-page anchors
  function focusSectionFromHash(hash) {
    if (!hash) return;
    const el = document.getElementById(hash.replace('#', ''));
    if (el) {
      // Add a temporary tabindex to allow focusing non-interactive sections
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      // Provide a subtle scroll into view (CSS already has scroll-behavior)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Cleanup tabindex later
      setTimeout(() => el.removeAttribute('tabindex'), 1000);
    }
  }

  // Enhance clicks on hero CTA buttons (anchors to sections)
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.length > 1) {
        e.preventDefault();
        history.pushState(null, '', href);
        focusSectionFromHash(href);
      }
    }, { passive: false });
  });

  // Handle direct hash on page load
  if (location.hash) {
    window.addEventListener('load', () => focusSectionFromHash(location.hash));
  }

  // ===== Image Modal (works with any element having data-bs-target="#fotoModal")
  const modalEl = $('#fotoModal');
  const modalImage   = $('#modalImage');
  const modalLabel   = $('#fotoModalLabel');
  const yearVal      = $('#yearVal');
  const modalCaption = $('#modalCaption');

  // Collect all triggers (images/figures) that open the modal
  const modalTriggers = $$('[data-bs-target="#fotoModal"]');

  // Preload helper
  function preload(src) {
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }

  // Derive data for modal from a trigger element
  function getModalDataFrom(el) {
    const src     = el.dataset.src || el.getAttribute('src') || '';
    const title   = el.dataset.title || el.getAttribute('alt') || 'Foto';
    const year    = el.dataset.year || '—';
    const caption = el.dataset.caption || '';
    return { src, title, year, caption };
  }

  function renderModal({ src, title, year, caption }) {
    if (!src) return;
    modalImage.src = src;
    modalImage.alt = title;
    modalLabel.textContent = title;
    yearVal.textContent = year;
    modalCaption.textContent = caption;
  }

  // Bind click for all triggers
  modalTriggers.forEach((el) => {
    // Preload on hover for snappier feel
    el.addEventListener('pointerenter', () => preload(el.dataset.src || el.getAttribute('src')));

    el.addEventListener('click', () => {
      renderModal(getModalDataFrom(el));
      activeIndex = modalTriggers.indexOf ? modalTriggers.indexOf(el) : modalTriggers.findIndex(x => x === el);
    }, { passive: true });
  });

  // Keep track of active index for keyboard nav
  let activeIndex = 0;

  function showByIndex(idx) {
    if (modalTriggers.length === 0) return;
    // Wrap around
    if (idx < 0) idx = modalTriggers.length - 1;
    if (idx >= modalTriggers.length) idx = 0;
    activeIndex = idx;
    const el = modalTriggers[activeIndex];
    renderModal(getModalDataFrom(el));
  }

  // Keyboard navigation when modal is open (← → to switch)
  if (modalEl) {
    modalEl.addEventListener('shown.bs.modal', () => {
      const onKey = (ev) => {
        if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          showByIndex(activeIndex - 1);
        } else if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          showByIndex(activeIndex + 1);
        }
      };
      document.addEventListener('keydown', onKey);
      modalEl.addEventListener('hidden.bs.modal', () => {
        document.removeEventListener('keydown', onKey);
      }, { once: true });
    });
  }

  // ===== Lightweight ScrollSpy for CTA buttons
  // Highlights the matching CTA when its section is in view
  const sectionIds = ['perjalanan', 'pelajaran', 'kesimpulan'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
  const ctas = sectionIds.map(id => $(`a[href="#${id}"]`)).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length && ctas.length) {
    const map = new Map();
    sections.forEach((sec, i) => map.set(sec, ctas[i]));

    const io = new IntersectionObserver((entries) => {
      // Choose the entry with greatest intersection ratio
      const best = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!best) return;

      ctas.forEach(btn => btn.classList.remove('active'));
      const btn = map.get(best.target);
      if (btn) btn.classList.add('active');
    }, { root: null, rootMargin: '0px 0px -50% 0px', threshold: prefersReduced ? 0.25 : [0.25, 0.5, 0.75, 1] });

    sections.forEach(sec => io.observe(sec));
  }

  // ===== Reveal-on-scroll for .story-card (progressively enhance)
  const cards = $$('.story-card');
  if ('IntersectionObserver' in window && cards.length && !prefersReduced) {
    cards.forEach(c => c.style.transform = 'translateY(8px)');
    cards.forEach(c => c.style.opacity = '0');

    const ioCards = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.transition = 'opacity .6s ease, transform .6s ease';
          el.style.opacity = '1';
          el.style.transform = 'none';
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    cards.forEach(c => ioCards.observe(c));
  }

  // ===== Defensive image error handling (swap to neutral placeholder)
  function attachImageFallback(img) {
    img.addEventListener('error', () => {
      // Subtle neutral placeholder (1x1 PNG data URI) — avoids broken icon
      img.removeAttribute('srcset');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
           <rect width="100%" height="100%" fill="#e9ecef"/>
           <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, system-ui, Arial" font-size="20" fill="#adb5bd">Gambar tidak tersedia</text>
         </svg>`
      );
      img.style.objectFit = 'contain';
    }, { once: true });
  }
  $$('img').forEach(attachImageFallback);

  // ===== Lazy-loading polyfill (very light)
  if (!('loading' in HTMLImageElement.prototype)) {
    const lazyImgs = $$('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      const ioLazy = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src; // support pattern if dev opts-in later
            obs.unobserve(img);
          }
        });
      });
      lazyImgs.forEach(img => ioLazy.observe(img));
    }
  }
})();
