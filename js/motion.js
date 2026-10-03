/* Motion layer: scroll reveals, glass header, progress bar, nav state,
   count-up, pointer tilt/magnet and theme view-transition wiring.
   Every effect here is skipped when the user prefers reduced motion. */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const softMotion = () => !reduced.matches;

  /* ---------- scroll reveals ---------- */
  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
  for (const node of reveals) {
    const delay = Number(node.dataset.delay || 0);
    if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);
  }
  const showAll = () => { for (const node of reveals) node.classList.add('is-visible'); };
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || !softMotion()) showAll();
    else {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      for (const node of reveals) observer.observe(node);
      // Safety net for anything the observer can never see (hidden, zero-height, print).
      setTimeout(showAll, 3000);
      reduced.addEventListener('change', () => { if (reduced.matches) showAll(); });
    }
  }

  /* ---------- active nav item (last section whose start passed the header) ---------- */
  const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function syncNav() {
    if (!sections.length) return;
    let current = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top - 140 <= 0) current = section;
    }
    for (const link of navLinks) {
      link.classList.toggle('is-active', !!current && link.getAttribute('href') === `#${current.id}`);
    }
  }

  /* ---------- glass header + scroll progress ---------- */
  const header = document.getElementById('site-header');
  const progress = document.getElementById('scroll-progress-bar');
  let queued = false;
  function applyScroll() {
    queued = false;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${Math.min(1, y / max).toFixed(4)})`;
    }
    syncNav();
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(applyScroll); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  applyScroll();

  /* ---------- count-up for the tenure figure ---------- */
  const tenure = document.getElementById('tenure-years');
  if (tenure) {
    const target = Number(tenure.dataset.count || tenure.textContent) || 0;
    if (!softMotion() || !window.requestAnimationFrame) tenure.textContent = String(target);
    else {
      const duration = 1300, start = performance.now();
      tenure.textContent = '0';
      const step = now => {
        const t = Math.min(1, (now - start) / duration);
        tenure.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  /* ---------- pointer-reactive glass (tilt + highlight) ---------- */
  if (finePointer.matches && softMotion()) {
    const portrait = document.querySelector('[data-tilt]');
    if (portrait) {
      portrait.addEventListener('pointermove', event => {
        const box = portrait.getBoundingClientRect();
        const px = (event.clientX - box.left) / box.width - 0.5;
        const py = (event.clientY - box.top) / box.height - 0.5;
        portrait.style.setProperty('--tilt-y', `${(px * 9).toFixed(2)}deg`);
        portrait.style.setProperty('--tilt-x', `${(-py * 9).toFixed(2)}deg`);
      });
      portrait.addEventListener('pointerleave', () => {
        portrait.style.setProperty('--tilt-y', '0deg');
        portrait.style.setProperty('--tilt-x', '0deg');
      });
    }
    for (const panel of document.querySelectorAll('.glass-panel, .social-link')) {
      panel.addEventListener('pointermove', event => {
        const box = panel.getBoundingClientRect();
        panel.style.setProperty('--mx', `${(((event.clientX - box.left) / box.width) * 100).toFixed(2)}%`);
        panel.style.setProperty('--my', `${(((event.clientY - box.top) / box.height) * 100).toFixed(2)}%`);
      });
    }
    for (const button of document.querySelectorAll('.button.primary')) {
      button.addEventListener('pointermove', event => {
        const box = button.getBoundingClientRect();
        const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
        button.style.setProperty('--mag-x', `${(dx * 5).toFixed(2)}px`);
        button.style.setProperty('--mag-y', `${(dy * 4).toFixed(2)}px`);
      });
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--mag-x', '0px');
        button.style.setProperty('--mag-y', '0px');
      });
    }
  }
})();
