/* Centre-split intro reveal.
   Two identical full-screen halves are clipped to the left and right of the
   seam, so the wordmark reads as one mark until the halves swing apart from
   the centre of the screen. No loading indicator: the cover is only the mark,
   and it opens as soon as the window has loaded. Skipped entirely for reduced
   motion, and a failsafe always uncovers the site even if this file never runs. */
(function () {
  'use strict';
  const html = document.documentElement;
  const overlay = document.getElementById('intro-reveal');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const SPLIT_MS = 980;      /* must stay >= the --intro-split transition */
  const MIN_COVER_MS = 520;  /* so the mark registers as a mark, not a flash */
  let done = false;
  let opened = false;

  function uncover() {
    if (done) return;
    done = true;
    html.classList.remove('intro-active');
    html.classList.add('intro-revealed');
    if (!overlay) return;
    overlay.classList.add('is-done');
    setTimeout(() => overlay.remove(), 400);
  }

  if (!overlay || !html.classList.contains('js-motion') || reduced.matches) {
    if (overlay) overlay.remove();
    html.classList.add('intro-revealed');
    return;
  }

  /* Hide the hero under the cover so its 3D entrance plays on reveal. */
  html.classList.add('intro-active');
  const failsafe = setTimeout(uncover, 6000);
  const started = performance.now();

  function open() {
    if (opened) return;
    opened = true;
    const wait = Math.max(0, MIN_COVER_MS - (performance.now() - started));
    setTimeout(() => {
      overlay.classList.add('is-opening');
      setTimeout(() => { clearTimeout(failsafe); uncover(); }, SPLIT_MS);
    }, wait);
  }

  /* Anyone who clicks or types is already done waiting: skip straight to the split. */
  overlay.addEventListener('click', open);
  window.addEventListener('keydown', open, { once: true });

  if (document.readyState === 'complete') open();
  else window.addEventListener('load', open, { once: true });
})();
