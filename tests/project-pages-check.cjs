/* Opens project pages from ../Kumpulan in a real browser and reports what actually renders:
   visible text length, element count, console/page errors, failed requests. Used to find
   project demos that stay blank when served by a plain static server.
   Run:  node tests/project-pages-check.cjs "Ayam Goreng Simpang Siliwangi" ... */
const {chromium} = require('./playwright.cjs').playwrightCore;
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const names = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  for (const name of names) {
    const url = base + 'Kumpulan/Website/Food%20And%20Beverage/' + encodeURIComponent(name) + '/index.html';
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    const errors = [], failed = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 160)));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
    page.on('requestfailed', r => failed.push(r.url().slice(0, 120) + ' (' + (r.failure()?.errorText || '?') + ')'));
    page.on('response', r => { if (r.status() >= 400) failed.push('http ' + r.status() + ' ' + r.url().slice(0, 110)); });
    let status = null;
    try {
      const response = await page.goto(url, {waitUntil: 'load', timeout: 30000});
      status = response && response.status();
      await page.waitForTimeout(1500);
    } catch (error) {
      errors.push('goto: ' + error.message.slice(0, 120));
    }
    const info = await page.evaluate(() => {
      const body = document.body;
      const text = (body ? body.innerText : '').replace(/\s+/g, ' ').trim();
      const visible = [...document.querySelectorAll('body *')].filter(el => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 4 && r.height > 4 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
      }).length;
      const overlays = [...document.querySelectorAll('body *')].filter(el => {
        const s = getComputedStyle(el);
        return s.position === 'fixed' && Number(s.opacity) > 0.05 && s.display !== 'none' && el.getBoundingClientRect().height > innerHeight * 0.5;
      }).map(el => el.className || el.id || el.tagName).slice(0, 5);
      return {
        title: document.title,
        bodyText: text.slice(0, 160),
        textLength: text.length,
        elements: document.querySelectorAll('body *').length,
        visibleElements: visible,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
        htmlClass: document.documentElement.className,
        fixedOverlays: overlays
      };
    }).catch(e => ({evalError: e.message.slice(0, 120)}));
    console.log('===== ' + name);
    console.log('  status', status, '| title:', info.title);
    console.log('  text len', info.textLength, '| elements', info.elements, '| visible', info.visibleElements, '| overlays', JSON.stringify(info.fixedOverlays));
    console.log('  body bg', info.bodyBg, 'color', info.bodyColor, '| html class', JSON.stringify(info.htmlClass));
    console.log('  first text:', JSON.stringify(info.bodyText));
    if (errors.length) console.log('  ERRORS:', errors.slice(0, 5).join(' | '));
    if (failed.length) console.log('  FAILED:', [...new Set(failed)].slice(0, 5).join(' | '));
    await page.close();
  }
  await browser.close();
})();
