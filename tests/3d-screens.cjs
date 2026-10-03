/* Writes a few reference screenshots of the portfolio (dark theme, light theme, the hero
   photo depth, reduced motion) into the Kumpulan test-results folder so the portfolio
   folder itself stays small, and prints the WebGL coverage numbers next to them.
   Run:  TEST_URL=http://127.0.0.1:4173/Portofolio%202/ node "Portofolio 2/tests/3d-screens.cjs" */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/Portofolio%202/';
const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');

const sceneStats = page => page.evaluate(() => {
  const canvas = document.getElementById('depth-scene');
  const gl = canvas && canvas.getContext('webgl');
  if (!gl) return null;
  const w = canvas.width, h = canvas.height;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let lit = 0, peak = 0;
  for (let i = 3; i < px.length; i += 4) { if (px[i] > 8) lit++; if (px[i] > peak) peak = px[i]; }
  return {w, h, lit, coverage: +(lit / (w * h) * 100).toFixed(2), peak};
});

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const settle = pg => pg.waitForFunction(() => {
    const el = document.getElementById('intro-reveal');
    return !el || getComputedStyle(el).display === 'none';
  }, null, {timeout: 15000});

  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  await page.goto(base, {waitUntil: 'load'});
  await settle(page);
  await page.waitForTimeout(1200);
  await page.screenshot({path: path.join(out, 'portfolio-hero-3d.png')});
  console.log('hero   ', JSON.stringify(await sceneStats(page)));
  await page.screenshot({path: path.join(out, 'portfolio-full-3d.png'), fullPage: true});

  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(800);
  await page.screenshot({path: path.join(out, 'portfolio-gallery-3d.png')});

  await page.evaluate(() => { window.scrollTo(0, 0); document.getElementById('theme-toggle').click(); });
  await page.waitForTimeout(900);
  await page.screenshot({path: path.join(out, 'portfolio-hero-3d-light.png')});
  console.log('light  ', JSON.stringify(await sceneStats(page)));
  await page.close();

  const still = await browser.newPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  await still.goto(base, {waitUntil: 'load'});
  await settle(still);
  await still.waitForTimeout(800);
  await still.screenshot({path: path.join(out, 'portfolio-hero-3d-reduced-motion.png')});
  console.log('reduced', JSON.stringify(await sceneStats(still)));
  await still.close();

  await browser.close();
  console.log('screenshots ->', out);
})();
