/* A/B proof that the WebGL scene is really painted onto the page (not just into its own
   buffer): screenshot the same viewport with the canvas shown and with it hidden, then
   count the pixels that differ. Run after serve.py is up. */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/Portofolio%202/';
const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const page = await browser.newPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  await page.goto(base, {waitUntil: 'load'});
  await page.waitForFunction(() => {
    const el = document.getElementById('intro-reveal');
    return !el || getComputedStyle(el).display === 'none';
  }, null, {timeout: 15000});
  await page.waitForTimeout(900);
  const shown = path.join(out, 'scene-ab-shown.png');
  const hidden = path.join(out, 'scene-ab-hidden.png');
  await page.screenshot({path: shown});
  await page.evaluate(() => { document.getElementById('depth-scene').style.display = 'none'; });
  await page.waitForTimeout(250);
  await page.screenshot({path: hidden});
  await browser.close();
  console.log(shown);
  console.log(hidden);
})();
