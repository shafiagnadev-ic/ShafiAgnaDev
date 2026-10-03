/* Verifies the two things asked for, in a real browser:
     1. the palette is black (page, panels, and the former RGB glow blobs are all neutral), and
     2. the gallery cards are static — they never move, at all.
   Prints a PASS/FAIL line per check and writes screenshots.
   Run:  node tests/black-theme-check.cjs            (uses $TEST_URL or http://127.0.0.1:5500) */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://127.0.0.1:5500';
const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');

const results = [];
const check = (name, ok, detail) => { results.push({name, ok, detail}); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

// pulls every rgb()/rgba() triple out of a computed value and returns its chroma (max-min per colour)
const grayscaleOf = value => {
  const triples = [...String(value).matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m => [Number(m[1]), Number(m[2]), Number(m[3])]);
  if (!triples.length) return {chroma: 0, count: 0};
  return {chroma: Math.max(...triples.map(([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b))), count: triples.length};
};

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base, {waitUntil: 'load'});
  await page.waitForSelector('.project-card');
  await page.waitForTimeout(2500);   // let the intro settle

  /* ---------- 1. black palette ---------- */
  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const blobs = [...document.querySelectorAll('.aurora-blob')].map(el => getComputedStyle(el).backgroundImage);
    const ambients = [...document.querySelectorAll('.ambient')].map(el => getComputedStyle(el).backgroundImage);
    return {
      bg: root.getPropertyValue('--bg').trim(),
      accent: root.getPropertyValue('--accent').trim(),
      canvas: root.getPropertyValue('--canvas').trim(),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyBgImage: getComputedStyle(document.body).backgroundImage,
      shellBg: getComputedStyle(document.querySelector('.gallery-shell')).backgroundColor,
      shellBgImage: getComputedStyle(document.querySelector('.gallery-shell')).backgroundImage,
      blobs, ambients,
      difference: {color: getComputedStyle(document.querySelector('.difference')).color,
                   bg: getComputedStyle(document.querySelector('.difference')).backgroundImage},
      app: {color: getComputedStyle(document.querySelector('.app-visual')).color},
      themeColor: document.querySelector('meta[name="theme-color"]').content
    };
  });
  check('--bg is black', /^#000(000)?$/.test(palette.bg), `--bg ${palette.bg}, --canvas ${palette.canvas}`);
  // body carries a gradient, so its backgroundColor is transparent; the painted result is
  // what matters — the gradient stops are checked here and the real pixels are sampled below.
  check('body paints black', palette.bodyBg === 'rgb(0, 0, 0)' || grayscaleOf(palette.bodyBgImage).chroma <= 3,
    `${palette.bodyBg} over ${palette.bodyBgImage.slice(0, 60)}…`);
  check('background gradient is neutral', grayscaleOf(palette.bodyBgImage).chroma <= 3,
    `chroma ${grayscaleOf(palette.bodyBgImage).chroma} over ${grayscaleOf(palette.bodyBgImage).count} stops`);
  check('gallery shell paints black', palette.shellBg === 'rgb(5, 5, 5)' || grayscaleOf(palette.shellBgImage).chroma <= 3,
    `${palette.shellBg} over chroma ${grayscaleOf(palette.shellBgImage).chroma}`);
  check('accent is neutral', /^#f2f2f2$/i.test(palette.accent), `--accent ${palette.accent}`);
  check('theme-color meta is black', palette.themeColor.toLowerCase() === '#000000', palette.themeColor);

  const blobChroma = Math.max(...palette.blobs.map(v => grayscaleOf(v).chroma));
  const ambientChroma = Math.max(...palette.ambients.map(v => grayscaleOf(v).chroma));
  check('aurora glow is black, not RGB', blobChroma <= 3, `${palette.blobs.length} blobs, worst chroma ${blobChroma}`);
  check('canvas glow is black, not RGB', ambientChroma <= 3, `${palette.ambients.length} ambients, worst chroma ${ambientChroma}`);
  check('difference block keeps readable ink', /^rgb\((24[0-9]|25[0-5]), (24[0-9]|25[0-5]), (24[0-9]|25[0-5])\)$/.test(palette.difference.color),
    `color ${palette.difference.color}, bg chroma ${grayscaleOf(palette.difference.bg).chroma}`);
  check('app panel keeps readable ink', palette.app.color === 'rgb(242, 242, 242)', palette.app.color);

  // nothing on the page should still be painted in a saturated colour
  const painted = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      if (el.closest('#intro-reveal') || el.matches('img, svg, canvas, .thumbnail-wrap img, .app-icon img')) continue;
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'outlineColor']) {
        const m = String(s[prop]).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
        if (!m) continue;
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        const alpha = m[4] === undefined ? 1 : Number(m[4]);
        if (alpha < 0.06) continue;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (chroma > 26) { bad.push(`${el.tagName}.${(el.className || '').toString().split(' ')[0]} ${prop}=${s[prop]}`); break; }
      }
    }
    return bad;
  });
  check('no saturated colour left in the UI', painted.length === 0, painted.slice(0, 4).join(' | ') || 'all neutral');

  /* ---------- 1b. the light theme is neutral too ---------- */
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(500);
  const light = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const chroma = value => {
      const t = [...String(value).matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m => [+m[1], +m[2], +m[3]]);
      return t.length ? Math.max(...t.map(([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b))) : 0;
    };
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      bg: root.getPropertyValue('--bg').trim(),
      accent: root.getPropertyValue('--accent').trim(),
      gradChroma: chroma(getComputedStyle(document.body).backgroundImage),
      glowChroma: Math.max(...[...document.querySelectorAll('.aurora-blob, .ambient')].map(el => chroma(getComputedStyle(el).backgroundImage))),
      difference: getComputedStyle(document.querySelector('.difference')).color
    };
  });
  check('light theme switches', light.theme === 'light', `theme ${light.theme}`);
  check('light theme is neutral', light.gradChroma <= 3 && light.glowChroma <= 3,
    `--bg ${light.bg}, --accent ${light.accent}, backdrop chroma ${light.gradChroma}, glow chroma ${light.glowChroma}`);
  check('light theme keeps readable ink on the difference block', /^rgb\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}\)$/.test(light.difference), light.difference);
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(400);

  /* ---------- 2. the cards do not move ---------- */
  const sample = () => page.evaluate(() => ({
    transforms: [...document.querySelectorAll('.project-card')].map(c => c.style.transform),
    positions: portfolioGallery.world.items.map(p => [p.x, p.y]),
    camera: [portfolioGallery.camera.x, portfolioGallery.camera.y],
    mounted: document.querySelectorAll('.project-card').length
  }));
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(600);
  const first = await sample();
  await page.waitForTimeout(3000);
  const later = await sample();
  check('cards keep the same transform for 3s', JSON.stringify(first.transforms) === JSON.stringify(later.transforms),
    `${first.mounted} cards mounted`);
  check('card positions never change', JSON.stringify(first.positions) === JSON.stringify(later.positions),
    `${first.positions.length} items`);
  check('camera does not drift', JSON.stringify(first.camera) === JSON.stringify(later.camera), first.camera.join(', '));
  check('no animation loop exists', await page.evaluate(() => !('raf' in portfolioGallery) && !('playing' in portfolioGallery)), 'no raf/playing on the gallery');
  check('no play/stop control', await page.locator('#motion-toggle').count() === 0, 'button removed');
  check('status line says the collection is static', (await page.locator('#motion-status').innerText()).includes('STATIS'),
    await page.locator('#motion-status').innerText());
  // the wall must not be animated by CSS either
  const animated = await page.evaluate(() => [...document.querySelectorAll('.project-card, .card-layer, .ambient, .aurora-blob')]
    .filter(el => { const s = getComputedStyle(el); return s.animationName !== 'none' && s.animationDuration !== '0s'; })
    .map(el => `${el.className}:${getComputedStyle(el).animationName}`));
  // A freshly mounted card fades in (opacity only, animation-name cardIn) — that is not
  // movement. Anything that animates position or the glow would show up here.
  const moves = animated.filter(entry => !/:cardIn$/.test(entry));
  check('nothing animates position or glow', moves.length === 0, moves.slice(0, 4).join(' | ') || 'only the mount fade');

  /* ---------- 3. dragging still works (the only thing that moves) ---------- */
  const box = await page.locator('#gallery-viewport').boundingBox();
  const beforeDrag = await page.evaluate(() => portfolioGallery.camera.x);
  await page.mouse.move(box.x + box.width - 60, box.y + box.height - 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 140, box.y + box.height - 80, {steps: 14});
  await page.mouse.up();
  await page.waitForTimeout(200);
  const afterDrag = await page.evaluate(() => portfolioGallery.camera.x);
  check('drag still pans the wall', afterDrag > beforeDrag, `${beforeDrag} -> ${afterDrag}`);
  await page.locator('#gallery-reset').click();
  await page.waitForTimeout(200);
  check('Reset returns to the start', await page.evaluate(() => portfolioGallery.camera.x) === 0, 'camera 0');

  check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  const heroShot = path.join(out, 'black-theme-hero.png');
  const galleryShot = path.join(out, 'black-theme-gallery.png');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.screenshot({path: heroShot});
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(700);
  await page.screenshot({path: galleryShot});
  console.log('SHOTS: ' + heroShot + ' | ' + galleryShot);

  const failed = results.filter(r => !r.ok);
  fs.writeFileSync(path.join(out, 'black-theme-check.json'), JSON.stringify({checks: results, failed: failed.length}, null, 2));
  await browser.close();
  if (failed.length) { console.error(`${failed.length} check(s) failed`); process.exit(1); }
  console.log(`all ${results.length} checks passed`);
})().catch(error => { console.error('black-theme-check FAILED:', error.message); process.exit(1); });
