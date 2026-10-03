/* Same two checks as black-theme-check.cjs, but inside the user's own Chrome window
   (attached over CDP on 9222) so the report describes the browser they are actually looking at.
   Run:  node tests/chrome-live-static.cjs */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => /127\.0\.0\.1:5500/.test(p.url())) || context.pages()[0];
  await page.bringToFront();
  await page.goto('http://127.0.0.1:5500/index.html', {waitUntil: 'load', timeout: 30000});
  await page.waitForTimeout(4000);

  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const chroma = value => {
      const t = [...String(value).matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m => [+m[1], +m[2], +m[3]]);
      return t.length ? Math.max(...t.map(([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b))) : 0;
    };
    return {
      bg: root.getPropertyValue('--bg').trim(),
      accent: root.getPropertyValue('--accent').trim(),
      gradChroma: chroma(getComputedStyle(document.body).backgroundImage),
      glowChroma: Math.max(...[...document.querySelectorAll('.aurora-blob, .ambient')].map(el => chroma(getComputedStyle(el).backgroundImage))),
      themeColor: document.querySelector('meta[name="theme-color"]').content
    };
  });
  console.log('PALETTE : --bg ' + palette.bg + ' | --accent ' + palette.accent + ' | theme-color ' + palette.themeColor
    + ' | backdrop chroma ' + palette.gradChroma + ' | glow chroma ' + palette.glowChroma);

  const sample = () => page.evaluate(() => ({
    transforms: [...document.querySelectorAll('.project-card')].map(c => c.style.transform),
    positions: portfolioGallery.world.items.map(p => [p.x, p.y]),
    status: document.getElementById('motion-status').textContent,
    toggle: !!document.getElementById('motion-toggle'),
    loop: 'raf' in portfolioGallery || 'playing' in portfolioGallery
  }));
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(600);
  const a = await sample();
  await page.waitForTimeout(4000);
  const b = await sample();
  console.log('CARDS   : ' + a.transforms.length + ' mounted | status "' + a.status + '" | play/stop button: ' + (a.toggle ? 'STILL THERE' : 'removed') + ' | animation loop: ' + (a.loop ? 'STILL RUNNING' : 'none'));
  console.log('STATIC  : transforms identical over 4s: ' + (JSON.stringify(a.transforms) === JSON.stringify(b.transforms))
    + ' | positions identical: ' + (JSON.stringify(a.positions) === JSON.stringify(b.positions)));

  const shot = path.join(out, 'chrome-live-static.png');
  await page.screenshot({path: shot});
  console.log('SHOT    : ' + shot);
  await browser.close();
})().catch(error => { console.error('chrome-live-static FAILED:', error.message); process.exit(1); });
