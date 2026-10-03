/* Inspect the portfolio as it is actually displayed in the user's own Chrome instance
   (attached over CDP on port 9222). Prints what is rendered, what failed to load, and
   saves a screenshot. Run: node tests/chrome-live-check.cjs */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const contexts = browser.contexts();
  const pages = contexts.flatMap(c => c.pages());
  const page = pages.find(p => /Portofolio%202/.test(p.url())) || pages[0];
  if (!page) throw new Error('no page found in the attached Chrome');

  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(`http ${r.status()} ${r.url().slice(0, 110)}`); });

  const url = page.url();
  await page.bringToFront();
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const visible = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.02;
    };
    const canvas = document.getElementById('depth-scene');
    const gl = canvas && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    let scene = null;
    if (gl) {
      const w = canvas.width, h = canvas.height;
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let lit = 0;
      for (let i = 3; i < px.length; i += 4) if (px[i] > 8) lit++;
      scene = {w, h, lit, coverage: +(lit / (w * h) * 100).toFixed(2)};
    }
    const imgs = [...document.images];
    const thumbs = [...document.querySelectorAll('.slash-card img, .project-card img')];
    return {
      title: document.title,
      lang: document.documentElement.lang,
      theme: document.documentElement.getAttribute('data-theme'),
      height: document.documentElement.scrollHeight,
      hero: {h1: document.querySelector('#hero-title')?.innerText.replace(/\s+/g, ' ').trim(), visible: visible(document.querySelector('#hero-title'))},
      portraitVisible: visible(document.getElementById('portrait')),
      sections: [...document.querySelectorAll('main > section')].map(s => s.id || s.className.split(' ')[0]),
      categories: document.querySelectorAll('.category-chip').length,
      slashCards: document.querySelectorAll('.slash-card').length,
      canvasCards: document.querySelectorAll('.project-card').length,
      linksBlank: [...document.querySelectorAll('.slash-card,.project-card')].filter(a => a.target === '_blank').length,
      firstHref: document.querySelector('.slash-card')?.getAttribute('href'),
      images: {total: imgs.length, loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length, broken: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src).slice(0, 6)},
      thumbs: {total: thumbs.length, loaded: thumbs.filter(i => i.complete && i.naturalWidth > 0).length},
      scene,
      introGone: (() => { const el = document.getElementById('intro-reveal'); return !el || getComputedStyle(el).display === 'none'; })(),
      fontsReady: document.fonts.status,
      dpr: devicePixelRatio,
      viewport: [innerWidth, innerHeight]
    };
  });

  await page.screenshot({path: path.join(out, 'chrome-live-hero.png')});
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(1200);
  await page.screenshot({path: path.join(out, 'chrome-live-gallery.png')});

  console.log('URL      :', url);
  console.log('TITLE    :', info.title);
  console.log('THEME    :', info.theme, '| lang', info.lang, '| viewport', info.viewport.join('x'), '@', info.dpr + 'x', '| page height', info.height);
  console.log('HERO     :', info.hero.visible ? info.hero.h1 : '(hero NOT visible)');
  console.log('PORTRAIT :', info.portraitVisible ? 'visible' : 'NOT visible');
  console.log('SECTIONS :', info.sections.join(' > '));
  console.log('PROJECTS : categories', info.categories, '| slashcards', info.slashCards, '| canvas cards', info.canvasCards, '| target=_blank', info.linksBlank);
  console.log('FIRST LINK:', info.firstHref);
  console.log('IMAGES   :', info.images.loaded + '/' + info.images.total, 'loaded | thumbnails', info.thumbs.loaded + '/' + info.thumbs.total, info.images.broken.length ? '| broken: ' + info.images.broken.join(', ') : '| none broken');
  console.log('WEBGL    :', info.scene ? `${info.scene.lit} lit px (${info.scene.coverage}% of ${info.scene.w}x${info.scene.h})` : 'no context');
  console.log('FONTS    :', info.fontsReady, '| intro closed:', info.introGone);
  console.log('HTTP 4xx :', bad.length ? bad.join(' | ') : 'none');
  console.log('SHOTS    :', path.join(out, 'chrome-live-hero.png'), '|', path.join(out, 'chrome-live-gallery.png'));
  await browser.close();
})().catch(error => { console.error('chrome-live-check FAILED:', error.message); process.exit(1); });
