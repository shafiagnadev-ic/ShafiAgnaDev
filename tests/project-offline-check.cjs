/* Reproduces the "blank white page" a demo project shows when the CDN stylesheets it
   links in <head> are slow or unreachable (the demo pages pull Google Fonts, Font Awesome
   and Bootstrap Icons from the internet). Blocks every external request, then reports
   whether anything actually paints, at several moments in time.
   Run: node tests/project-offline-check.cjs "Ayam Goreng Simpang Siliwangi" */
const {chromium} = require('./playwright.cjs').playwrightCore;
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const names = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  for (const name of names) {
    const url = base + 'Kumpulan/Website/Food%20And%20Beverage/' + encodeURIComponent(name) + '/index.html';
    for (const mode of ['blocked', 'hanging']) {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      const external = [];
      await page.route('**/*', async route => {
        const target = route.request().url();
        if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(target)) {
          external.push(target.slice(0, 70));
          if (mode === 'blocked') return route.abort();
          return new Promise(() => {});   // never resolve: simulates a stalled CDN
        }
        return route.continue();
      });
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 20000}).catch(() => {});
      const snap = async label => {
        const paint = await page.evaluate(() => {
          const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
          const first = document.querySelector('h1, h2, .hero, header');
          const box = first ? first.getBoundingClientRect() : null;
          return {
            textLength: text.length,
            firstBox: box ? [Math.round(box.width), Math.round(box.height)] : null,
            styleSheets: document.styleSheets.length,
            sheetRules: [...document.styleSheets].map(s => { try { return s.cssRules.length; } catch (e) { return 'x'; } }),
            bodyVisible: document.body ? getComputedStyle(document.body).visibility : '?'
          };
        }).catch(e => ({error: e.message.slice(0, 80)}));
        console.log(`  [${mode} ${label}] text ${paint.textLength} | first box ${JSON.stringify(paint.firstBox)} | sheets ${paint.styleSheets} rules ${JSON.stringify(paint.sheetRules)}`);
      };
      await snap('t=1s');
      await page.waitForTimeout(4000);
      await snap('t=5s');
      await page.waitForTimeout(11000);
      await snap('t=16s');
      console.log(`  external requests seen: ${[...new Set(external)].join(' | ') || 'none'}`);
      await page.close();
    }
    console.log('===== ' + name + ' done');
  }
  await browser.close();
})();
