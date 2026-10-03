/* Drives the portfolio in the user's OWN Chrome (attached over CDP on 9222): opens the
   portfolio on port 5500, clicks a project card with a real mouse click, then reports what the
   new tab is and whether that project actually painted. Screenshots both tabs.
   New tabs are detected through Chrome's HTTP endpoint, not through Playwright's page list,
   because a target="_blank" tab is created outside the attached context.
   Run:  node tests/chrome-live-click.cjs "330 KOPI"   (defaults to the first card) */
const {chromium} = require('./playwright.cjs').playwrightCore;
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.SHOT_DIR || path.join(__dirname, '..', '..', 'Kumpulan', 'test-results');
const want = process.argv[2] || null;
const PORTFOLIO = process.env.PORTFOLIO_URL || 'http://127.0.0.1:5500/index.html';

const listTabs = async () => {
  const response = await fetch('http://127.0.0.1:9222/json/list');
  return (await response.json()).filter(t => t.type === 'page');
};

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => /127\.0\.0\.1:5500/.test(p.url()));
  if (!page) page = await context.newPage();
  await page.bringToFront();
  await page.goto(PORTFOLIO, {waitUntil: 'load', timeout: 30000});
  await page.waitForTimeout(4000);   // let the intro animation finish

  const before = await page.evaluate(() => ({
    title: document.title,
    cards: document.querySelectorAll('.slash-card').length,
    base: window.PORTFOLIO_PROJECT_BASE,
    paint: performance.getEntriesByType('paint').map(e => Math.round(e.startTime))[0] ?? null,
    heroVisible: (() => { const h = document.querySelector('#hero-title'); if (!h) return false;
      const r = h.getBoundingClientRect(); return r.width > 1 && r.height > 1; })()
  }));
  console.log('PORTFOLIO :', before.title, '| cards', before.cards, '| project base', JSON.stringify(before.base),
              '| painted at', before.paint, 'ms | hero visible', before.heroVisible);
  await page.screenshot({path: path.join(out, 'live-5500-portfolio.png')});

  const known = new Set((await listTabs()).map(t => t.id));
  const card = page.locator('.slash-card', want ? {hasText: want} : {}).first();
  const info = await card.evaluate(el => ({label: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
                                           href: el.href, target: el.target}));
  console.log('CLICKING  :', info.label, '| target=' + info.target);
  console.log('  href    :', info.href);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await card.click({timeout: 15000});

  let fresh = null;
  for (let i = 0; i < 40 && !fresh; i++) {
    await page.waitForTimeout(500);
    fresh = (await listTabs()).find(t => !known.has(t.id) && t.url !== 'about:blank');
  }
  if (!fresh) throw new Error('no new tab opened');
  console.log('NEW TAB   :', fresh.url);

  const project = await context.newPage();
  await project.goto(fresh.url, {waitUntil: 'domcontentloaded', timeout: 30000});
  await project.waitForTimeout(3000);
  const result = await project.evaluate(() => {
    const text = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
    return {title: document.title, textLength: text.length, head: text.slice(0, 90),
            readyState: document.readyState,
            paints: performance.getEntriesByType('paint').map(e => Math.round(e.startTime))};
  });
  const shot = path.join(out, 'live-5510-project.png');
  await project.screenshot({path: shot});
  console.log('RENDERED  :', result.title, '|', result.textLength, 'chars |', result.readyState,
              '| painted at', result.paints[0] ?? 'NONE', 'ms');
  console.log('TEXT      :', JSON.stringify(result.head));
  console.log('SHOTS     :', path.join(out, 'live-5500-portfolio.png'), '|', shot);
  await project.close();
  await browser.close();
})().catch(error => { console.error('chrome-live-click FAILED:', error.message); process.exit(1); });
