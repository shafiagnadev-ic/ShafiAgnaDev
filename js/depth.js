/* 3D depth layer.
   One pointer listener drives everything: the tilt + glare of the depth
   surfaces (delegated, so gallery cards built later are covered too), the
   cursor spotlight, the aurora parallax, the hero recession on scroll and the
   coverflow rotation of the slashcard rail. Touch pointers and reduced motion
   get the flat design; every effect is a CSS custom property, so a missing
   listener leaves the layout untouched. */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const root = document.documentElement;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* Surfaces that tilt. Delegated through closest() so dynamically rendered
     cards (gallery, slashcards, search results) are included for free. */
  const TILT = '.hardware-card, .slash-card, .social-link, .category-chip, .legend-item, .app-icon, .about-highlights-grid .glass-panel, #resume .glass-panel, .card-glass';
  const TILT_MAX = 7;    /* degrees at the very edge of a surface */
  const LIFT = 26;       /* how far a hovered surface comes towards the viewer */

  let queued = false;
  let px = 0.5, py = 0.5;

  const spot = document.createElement('div');
  spot.className = 'depth-spot';
  spot.setAttribute('aria-hidden', 'true');

  function paintGlobal() {
    queued = false;
    root.style.setProperty('--px', (px * 2 - 1).toFixed(3));
    root.style.setProperty('--py', (py * 2 - 1).toFixed(3));
    spot.style.setProperty('--spot-x', `${(px * 100).toFixed(2)}%`);
    spot.style.setProperty('--spot-y', `${(py * 100).toFixed(2)}%`);
  }
  function queueGlobal() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paintGlobal);
  }

  if (!reduced.matches) {
    document.body.append(spot);
    requestAnimationFrame(() => spot.classList.add('is-on'));
  }

  /* ---------- tilt + glare ---------- */
  let hot = null;
  function resetTilt(el) {
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--tz', '0px');
  }
  function tiltElement(el, event) {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dx = (event.clientX - box.left) / box.width - 0.5;
    const dy = (event.clientY - box.top) / box.height - 0.5;
    el.style.setProperty('--ry', `${(dx * TILT_MAX * 2).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-dy * TILT_MAX * 2).toFixed(2)}deg`);
    // Same pointer position drives the glare/sheen of the surface.
    el.style.setProperty('--mx', `${((dx + 0.5) * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${((dy + 0.5) * 100).toFixed(2)}%`);
  }

  if (fine.matches && !reduced.matches) {
    document.addEventListener('pointermove', event => {
      px = clamp(event.clientX / Math.max(1, innerWidth), 0, 1);
      py = clamp(event.clientY / Math.max(1, innerHeight), 0, 1);
      queueGlobal();

      const el = event.target instanceof Element ? event.target.closest(TILT) : null;
      if (el !== hot) {
        if (hot) resetTilt(hot);
        hot = el;
        if (el) {
          el.classList.add('d3-tilt', 'is-tilting');
          el.style.setProperty('--tz', `${LIFT}px`);
        }
      }
      if (el) tiltElement(el, event);
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      if (hot) resetTilt(hot);
      hot = null;
    });
  }

  /* ---------- hero recedes into the depth as you scroll away ---------- */
  const heroCopy = document.querySelector('.hero-copy');
  let heroQueued = false;
  function paintHero() {
    heroQueued = false;
    if (!heroCopy) return;
    const height = Math.max(1, heroCopy.getBoundingClientRect().height);
    const t = clamp((window.scrollY || 0) / (height * 1.1), 0, 1);
    heroCopy.style.setProperty('--hero-rx', `${(t * 6).toFixed(2)}deg`);
    heroCopy.style.setProperty('--hero-ty', `${(-t * 34).toFixed(1)}px`);
    heroCopy.style.setProperty('--hero-tz', `${(-t * 110).toFixed(1)}px`);
    heroCopy.style.setProperty('--hero-o', (1 - t * 0.5).toFixed(3));
  }
  if (heroCopy) {
    window.addEventListener('scroll', () => {
      if (heroQueued) return;
      heroQueued = true;
      requestAnimationFrame(paintHero);
    }, { passive: true });
    paintHero();
  }

  /* ---------- slashcard rail becomes a 3D coverflow ---------- */
  const rail = document.getElementById('slashcard-track-container');
  if (rail) {
    let railQueued = false;
    function paintRail() {
      railQueued = false;
      const railBox = rail.getBoundingClientRect();
      const middle = railBox.left + railBox.width / 2;
      if (!railBox.width) return;
      for (const card of rail.children) {
        const box = card.getBoundingClientRect();
        const offset = clamp((box.left + box.width / 2 - middle) / railBox.width, -1, 1);
        const away = Math.abs(offset);
        card.style.setProperty('--cf-ry', `${(-offset * 22).toFixed(2)}deg`);
        card.style.setProperty('--cf-tz', `${(-away * 190).toFixed(1)}px`);
        card.style.setProperty('--cf-ty', `${(away * 8).toFixed(1)}px`);
        card.style.setProperty('--cf-scale', (1 - away * 0.05).toFixed(3));
      }
    }
    rail.addEventListener('scroll', () => {
      if (railQueued) return;
      railQueued = true;
      requestAnimationFrame(paintRail);
    }, { passive: true });
    window.addEventListener('resize', paintRail);
    /* Cards are re-rendered on every search, so re-measure after the DOM settles. */
    new MutationObserver(() => requestAnimationFrame(paintRail)).observe(rail, { childList: true });
    paintRail();

    /* The rail is directly draggable and keyboard scrollable: the arrows are a
       shortcut, not the only way to reach a card. */
    rail.tabIndex = 0;
    rail.setAttribute('aria-label', 'Koleksi slashcard, geser atau gunakan tombol panah');
    // Cards are links, and a link is natively draggable: without this the browser
    // starts its own drag-and-drop and the pointer stream stops mid-pan.
    rail.addEventListener('dragstart', event => event.preventDefault());
    let drag = null, suppress = false;
    rail.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      drag = {id: event.pointerId, x: event.clientX, left: rail.scrollLeft, moved: false};
    });
    rail.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        rail.classList.add('is-dragging');
        if (rail.setPointerCapture) rail.setPointerCapture(event.pointerId);
      }
      if (!drag.moved) return;
      event.preventDefault();
      rail.scrollLeft = drag.left - dx;
      paintRail();
    });
    const endDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      suppress = drag.moved;
      drag = null;
      rail.classList.remove('is-dragging');
      if (rail.hasPointerCapture && rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    rail.addEventListener('click', event => {
      if (!suppress) return;
      event.preventDefault();
      event.stopPropagation();
      suppress = false;
    }, true);
    rail.addEventListener('keydown', event => {
      const step = {ArrowLeft: -320, ArrowRight: 320}[event.key];
      if (step === undefined) return;
      event.preventDefault();
      rail.scrollBy({left: step, behavior: 'smooth'});
    });
  }
})();
