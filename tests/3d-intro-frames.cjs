/* Captures the two states of the intro so the reveal can be checked by pixels
   (a text-only model cannot look at the screenshots): the cover frame while the
   window is still loading, and the frame right after the halves have split.
   Run:  node tests/3d-intro-frames.cjs                                   */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  // Hold the load event open so the cover phase can be photographed. The portrait
  // image is used because images block the load event; a preloaded font does not.
  await page.route(/portrait\.webp$/, async route => {
    await new Promise(r => setTimeout(r, 2500));
    await route.continue();
  });
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(700);
  const coverState = await page.evaluate(() => {
    const el = document.getElementById('intro-reveal');
    const mark = el.querySelector('.intro-mark').getBoundingClientRect();
    return {
      opening: el.classList.contains('is-opening'),
      mark: {left: Math.round(mark.left), top: Math.round(mark.top), width: Math.round(mark.width), height: Math.round(mark.height)},
      loaders: el.querySelectorAll('.intro-loader-slot, .intro-progress, .bike-loader-stage').length,
      heroOpacity: getComputedStyle(document.querySelector('.hero-copy h1')).opacity
    };
  });
  // A capture taken after the split started would silently misrepresent the cover,
  // so fail loudly instead of letting the pixel checks blame the wrong thing.
  if (coverState.opening) throw new Error('the cover frame was captured after the split started');
  if (coverState.mark.left >= 720 || coverState.mark.left + coverState.mark.width <= 720) {
    throw new Error(`the cover mark does not straddle the centre seam (${coverState.mark.left})`);
  }
  const out = process.env.SHOT_DIR || require('node:path').join(__dirname, '..', '..', 'Kumpulan', 'test-results');
  fs.mkdirSync(out, {recursive: true});
  await page.screenshot({path: require('node:path').join(out, '3d-intro-cover.png')});
  await page.waitForFunction(() => document.getElementById('intro-reveal')?.classList.contains('is-opening'), null, {timeout: 12000});
  await page.waitForTimeout(430);   /* mid-flight: both halves visibly separated */
  await page.screenshot({path: require('node:path').join(out, '3d-intro-opening.png')});
  await page.waitForFunction(() => {
    const el = document.getElementById('intro-reveal');
    return !el || getComputedStyle(el).display === 'none';
  }, null, {timeout: 12000});
  await page.waitForTimeout(900);
  await page.screenshot({path: require('node:path').join(out, '3d-intro-revealed.png')});
  const report = {...coverState, frames: ['3d-intro-cover.png', '3d-intro-opening.png', '3d-intro-revealed.png'].map(name => require('node:path').join(out, name))};
  fs.writeFileSync(require('node:path').join(out, '3d-intro-frames.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
