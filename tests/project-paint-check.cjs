/* Does a demo project actually PAINT while the CDN stylesheets it links in <head> are slow?
   The same page is rendered twice: CDN fails fast (aborted) vs CDN answers only after 20s.
   Reports DOM text, readyState and paint timings for each, and writes both frames.
   Run with the projects server up (default http://127.0.0.1:5510/):
     node "Portofolio 2/tests/project-paint-check.cjs" "Ayam Goreng Simpang Siliwangi" */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PROJECTS_URL || 'http://127.0.0.1:5510/';
const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');
const names = process.argv.slice(2);

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  for (const name of names) {
    const url = base + 'Website/Food%20And%20Beverage/' + encodeURIComponent(name) + '/index.html';
    for (const mode of ['cdn-fast', 'cdn-slow']) {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      page.setDefaultTimeout(8000);
      await page.route('**/*', async route => {
        const target = route.request().url();
        if (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(target)) return route.continue();
        if (mode === 'cdn-fast') return route.abort();
        await new Promise(done => setTimeout(done, 20000));   // slow CDN: answers after 20s
        return route.abort();
      });
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 20000}).catch(() => {});
      await page.waitForTimeout(6000);
      const shot = path.join(out, `project-paint-${mode}.png`);
      // page.screenshot() waits for fonts to settle; CDP takes the frame as it is right now.
      const cdp = await page.context().newCDPSession(page);
      const {data} = await cdp.send('Page.captureScreenshot', {format: 'png'});
      fs.writeFileSync(shot, Buffer.from(data, 'base64'));
      const state = await page.evaluate(() => ({
        dom: (document.body.innerText || '').replace(/\s+/g, ' ').trim().length,
        paints: performance.getEntriesByType('paint').map(e => `${e.name}=${Math.round(e.startTime)}ms`),
        readyState: document.readyState,
        bodyBg: getComputedStyle(document.body).backgroundColor
      }));
      console.log(`${mode.padEnd(8)} DOM ${state.dom} chars | readyState ${state.readyState} | bg ${state.bodyBg} | paints: ${state.paints.join(', ') || 'NONE — nothing painted'}`);
      await page.unroute('**/*');
      await page.close();
    }
    console.log('===== ' + name);
  }
  await browser.close();
})().catch(error => { console.error('project-paint-check FAILED:', error.message); process.exit(1); });
