/* Verifies the glass/motion layer: glass surfaces, scroll reveals, charts,
   social logos, theme sweep — plus a regression pass over the gallery.
   Run:  python -m http.server 4173 --bind 127.0.0.1   (in the project root)
         node tests/motion-ui.cjs                                        */
const {chromium} = require('./playwright.cjs').playwrightCore;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const errors = [];
  const warnings = [];
  // Local asset failures are real defects; a refused webfont is environmental noise.
  const watch = (pg, tag = '') => {
    const prefix = tag ? `${tag} ` : '';
    pg.on('pageerror', e => errors.push(`${prefix}pageerror: ${e.message}`));
    pg.on('console', m => {
      if (m.type() !== 'error') return;
      if (/Failed to load resource/.test(m.text())) return; // covered by the network listeners below
      errors.push(`${prefix}console: ${m.text()}`);
    });
    pg.on('requestfailed', r => {
      const url = r.url();
      const entry = `${prefix}requestfailed ${url} (${r.failure() && r.failure().errorText})`;
      const error = (r.failure() && r.failure().errorText) || '';
      // Dev-server transport noise (python -m http.server has a tiny accept backlog) is
      // not a missing asset: a genuinely absent file shows up as a 4xx in the response check.
      if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(url) || /ERR_CONNECTION_REFUSED/.test(error)) warnings.push(entry);
      else errors.push(entry);
    });
    pg.on('response', r => { if (r.status() >= 400) errors.push(`${prefix}http ${r.status()} ${r.url()}`); });
  };
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  watch(page);
  await page.goto(base, {waitUntil: 'load'});

  // glass surfaces
  const header = page.locator('#site-header');
  const headerStyle = await header.evaluate(el => {
    const s = getComputedStyle(el);
    return {position: s.position, backdrop: s.backdropFilter || s.webkitBackdropFilter, bg: s.backgroundColor};
  });
  assert.equal(headerStyle.position, 'sticky', 'header is sticky');
  assert.match(headerStyle.backdrop, /blur/, 'header uses backdrop blur');
  assert.match(headerStyle.bg, /rgba\(/, 'header background is translucent');
  const glassPanels = await page.locator('.glass-panel').count();
  assert.ok(glassPanels >= 1, 'at least one glass panel');
  const panelBackdrop = await page.locator('.glass-panel').first().evaluate(el => getComputedStyle(el).backdropFilter);
  assert.match(panelBackdrop, /blur/, 'chart panel uses backdrop blur');
  assert.equal(await page.locator('.aurora-blob').count(), 4, 'aurora backdrop present');

  // social logos + hrefs
  const socials = await page.locator('.social-link').evaluateAll(nodes => nodes.map(n => ({
    href: n.getAttribute('href'), target: n.getAttribute('target'), rel: n.getAttribute('rel'),
    label: n.querySelector('strong').textContent.trim(),
    iconPaths: n.querySelectorAll('.social-icon svg path').length
  })));
  assert.equal(socials.length, 5, 'five social links');
  for (const s of socials) {
    assert.ok(/^https:\/\//.test(s.href), `${s.label} has an absolute https href`);
    assert.equal(s.target, '_blank');
    assert.match(s.rel, /noopener/);
    assert.ok(s.iconPaths >= 1, `${s.label} has an svg logo`);
  }
  assert.deepEqual(socials.map(s => s.label), ['GitHub', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn']);

  // radar chart
  const radar = await page.evaluate(() => {
    const svg = document.getElementById('skill-radar');
    return {
      rings: svg.querySelectorAll('.radar-ring').length,
      axes: svg.querySelectorAll('.radar-axis').length,
      labels: svg.querySelectorAll('.radar-label').length,
      points: svg.querySelectorAll('.radar-point').length,
      shape: svg.querySelectorAll('.radar-shape').length,
      shapePoints: svg.querySelector('.radar-shape').getAttribute('points').split(' ').length,
      topLabels: Array.from(svg.querySelectorAll('.radar-label.is-top')).map(t => t.textContent)
    };
  });
  assert.equal(radar.rings, 5, 'five level rings');
  // Count comes from the profile so adding a skill does not break the geometry checks.
  const skillCount = await page.evaluate(() => window.AGNA_PROFILE.skills.length);
  assert.equal(radar.axes, skillCount, 'one axis per skill');
  assert.equal(radar.labels, skillCount, 'one label per skill');
  assert.equal(radar.points, skillCount, 'one dot per skill');
  assert.equal(radar.shape, 1, 'polygon shape');
  assert.equal(radar.shapePoints, skillCount, `polygon has ${skillCount} vertices`);
  assert.deepEqual(radar.topLabels, ['HTML'], 'master level highlighted');
  const insight = await page.locator('#radar-desc').innerText();
  assert.match(insight, /Terkuat: HTML/);
  assert.match(insight, /Advanced/);
  const legend = await page.locator('.legend-item').count();
  assert.equal(legend, 5, 'legend covers all five levels');

  // reveals + chart animation trigger on scroll
  await page.evaluate(() => document.querySelector('#keahlian').scrollIntoView({block: 'center', behavior: 'instant'}));
  // Reveals are transitions, and the main thread is still busy decoding thumbnails right after
  // load, so wait for the settled state instead of sleeping a fixed amount.
  await page.waitForFunction(() => {
    const panel = document.querySelector('.chart-panel');
    return panel.classList.contains('is-visible') && Number(getComputedStyle(panel).opacity) > 0.98;
  }, null, {timeout: 20000});
  await page.waitForFunction(() => {
    const svg = document.getElementById('skill-radar');
    // Wait for the settled value the assertion below demands: a looser wait lets a
    // still-finishing transition fail the run at random.
    return svg.classList.contains('is-drawn')
      && Number(getComputedStyle(svg.querySelector('.radar-point')).opacity) >= 0.99
      && Number(getComputedStyle(svg.querySelector('.radar-shape')).opacity) >= 0.99;
  }, null, {timeout: 20000});
  const chart = await page.evaluate(() => {
    const panel = document.querySelector('.chart-panel');
    const svg = document.getElementById('skill-radar');
    const shape = getComputedStyle(svg.querySelector('.radar-shape'));
    const point = getComputedStyle(svg.querySelector('.radar-point'));
    return {
      visible: panel.classList.contains('is-visible'),
      opacity: getComputedStyle(panel).opacity,
      drawn: svg.classList.contains('is-drawn'),
      shapeOpacity: shape.opacity, pointOpacity: point.opacity
    };
  });
  assert.ok(chart.visible && Number(chart.opacity) > 0.98, `chart panel revealed (opacity ${chart.opacity})`);
  assert.ok(chart.drawn, 'radar draw-in triggered');
  assert.ok(Number(chart.shapeOpacity) >= 0.99, `radar shape visible (${chart.shapeOpacity})`);
  assert.ok(Number(chart.pointOpacity) >= 0.99, `radar dots visible (${chart.pointOpacity})`);

  // meters grow to their level share; rows are staggered, so wait for every row
  // to settle rather than just the first one to finish.
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('#skills-list .skill-row'));
    if (!rows.length) return false;
    return rows.every(r => {
      const track = r.querySelector('.skill-meter').getBoundingClientRect().width;
      const fill = r.querySelector('.skill-meter i').getBoundingClientRect().width;
      if (!track) return false;
      return Math.abs(fill / track - Number(r.dataset.level) / 5) < 0.03;
    });
  }, null, {timeout: 15000});
  const meters = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#skills-list .skill-row'));
    return rows.map(r => ({
      name: r.querySelector('dt').textContent,
      level: r.dataset.level,
      width: r.querySelector('.skill-meter i').getBoundingClientRect().width,
      track: r.querySelector('.skill-meter').getBoundingClientRect().width
    }));
  });
  assert.equal(meters.length, skillCount, 'one meter per skill');
  for (const m of meters) {
    const ratio = m.width / m.track;
    assert.ok(Math.abs(ratio - Number(m.level) / 5) < 0.06, `${m.name} meter at level ${m.level} (got ${ratio.toFixed(2)})`);
  }
  const roles = await page.locator('#experience-rows tr').count();
  const roleMeters = await page.locator('.role-meter').count();
  const roleCount = await page.evaluate(() => window.AGNA_PROFILE.roles.length);
  assert.equal(roles, roleCount, 'one row per role');
  assert.equal(roleMeters, roleCount, 'one duration meter per role');
  await page.evaluate(() => document.querySelector('.experience-body').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(1400);
  const roleWidth = await page.locator('.role-meter i').first().evaluate(el => el.getBoundingClientRect().width);
  assert.ok(roleWidth > 0, 'duration meters filled after reveal');

  // sticky header state + scroll progress
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(400);
  assert.ok(await page.locator('#site-header').evaluate(el => el.classList.contains('is-scrolled')), 'header reacts to scroll');
  const progress = await page.locator('#scroll-progress-bar').evaluate(el => el.style.transform);
  assert.match(progress, /scaleX\(0\.[0-9]+\)/, `progress bar advanced (${progress})`);
  const activeNav = await page.locator('nav a.is-active').count();
  assert.ok(activeNav >= 1, 'active nav item marked');

  // hero count-up finished
  assert.equal(await page.locator('#tenure-years').innerText(), '10', 'tenure count-up lands on 10');

  // anchor targets clear the sticky header
  await page.locator('nav a[href="#tentang"]').click();
  await page.waitForTimeout(1500);
  const clearsHeader = await page.evaluate(() => {
    const heading = document.getElementById('about-title').getBoundingClientRect();
    const header = document.getElementById('site-header').getBoundingClientRect();
    return heading.top >= header.bottom - 2;
  });
  assert.ok(clearsHeader, 'anchor target is not hidden behind the sticky header');

  // gallery regression
  await page.locator('#gallery-viewport').scrollIntoViewIfNeeded();
  await page.waitForSelector('.project-card');
  const cards = await page.locator('.project-card').count();
  assert.ok(cards > 0 && cards <= 32, `gallery mounted ${cards} cards`);
  assert.equal(await page.evaluate(() => 'raf' in portfolioGallery), false, 'the gallery has no animation loop');
  const still = await page.evaluate(() => portfolioGallery.world.items.map(p => [p.x, p.y]));
  await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => portfolioGallery.world.items.map(p => [p.x, p.y])), still, 'cards stay where the layout put them');

  // theme sweep + light theme
  await page.locator('#theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.waitForTimeout(120);
  assert.equal(await page.locator('.theme-sweep').count(), 1, 'theme sweep element created');
  assert.ok(await page.locator('.theme-sweep').evaluate(el => el.classList.contains('is-running')), 'theme sweep animated');
  await page.locator('#theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');

  // the empty-category invitation replaces the canvas content
  await page.locator('.category-chip[data-category="Automotive"]').click();
  await page.waitForTimeout(200);
  assert.ok(await page.locator('#gallery-empty').isVisible(), 'empty category shows the invitation in the canvas');
  assert.match(await page.locator('#gallery-empty').innerText(), /Do you want to be the first\?/);
  assert.equal(await page.locator('.project-card').count(), 0, 'empty category mounts no cards');
  assert.equal(await page.locator('#motion-status').innerText(), 'KATEGORI KOSONG', 'status reports the empty category');
  await page.locator('.category-chip[data-category="Property"]').click();
  await page.waitForTimeout(300);
  assert.ok(await page.locator('.project-card').count() > 0, 'filled category mounts cards again');
  assert.equal(await page.locator('#gallery-empty').isHidden(), true, 'invitation hides again');

  // no horizontal overflow
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'desktop has no horizontal overflow');
  await page.screenshot({path: 'test-results/desktop-glass.png', fullPage: false});

  // responsive sweep: no overflow anywhere, chart and meters stay inside their boxes
  // (close the desktop page first so the dev server is not hit by several pages at once)
  await page.close();
  const sweep = [];
  for (const width of [1440, 1100, 900, 700, 680, 480, 390]) {
    const view = await browser.newPage({viewport: {width, height: 900}});
    watch(view, `${width}px`);
    await view.goto(base, {waitUntil: 'load'});
    await view.evaluate(() => document.querySelector('#keahlian').scrollIntoView({block: 'center', behavior: 'instant'}));
    await view.waitForTimeout(700);
    const state = await view.evaluate(() => {
      const doc = document.documentElement;
      const panel = document.querySelector('.chart-panel').getBoundingClientRect();
      const svg = document.getElementById('skill-radar').getBoundingClientRect();
      const rows = Array.from(document.querySelectorAll('.skill-row'));
      return {
        overflow: doc.scrollWidth - window.innerWidth,
        svgInside: svg.left >= panel.left - 1 && svg.right <= panel.right + 1,
        rowOverflow: rows.filter(r => r.scrollWidth > r.clientWidth + 1).length,
        rowHeight: Math.max(...rows.map(r => r.getBoundingClientRect().height)),
        socials: document.querySelectorAll('.social-link').length
      };
    });
    await view.close();
    sweep.push({width, ...state});
    assert.ok(state.overflow <= 1, `${width}px: no horizontal overflow (${state.overflow}px)`);
    assert.ok(state.svgInside, `${width}px: radar stays inside the panel`);
    assert.equal(state.rowOverflow, 0, `${width}px: skill rows fit their box`);
    assert.ok(state.rowHeight < 90, `${width}px: skill rows stay single-line (${state.rowHeight.toFixed(0)}px)`);
    assert.equal(state.socials, 5, `${width}px: five social links`);
  }

  const mobile = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  watch(mobile, 'mobile');
  await mobile.goto(base, {waitUntil: 'load'});
  await mobile.locator('#kontak').scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(900);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile has no horizontal overflow');
  assert.equal(await mobile.locator('.social-link').count(), 5, 'mobile shows all social links');
  const mobileSocial = await mobile.locator('.social-link').first().evaluate(el => el.getBoundingClientRect().width);
  assert.ok(mobileSocial > 200, 'mobile social cards are full width');
  await mobile.screenshot({path: 'test-results/mobile-glass.png'});

  const reduced = await browser.newPage({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
  watch(reduced, 'reduced');
  await reduced.goto(base, {waitUntil: 'load'});
  await reduced.locator('#keahlian').scrollIntoViewIfNeeded();
  await reduced.waitForTimeout(300);
  const reducedState = await reduced.evaluate(() => {
    const panel = document.querySelector('.chart-panel');
    const svg = document.getElementById('skill-radar');
    return {
      opacity: getComputedStyle(panel).opacity,
      shapeOpacity: getComputedStyle(svg.querySelector('.radar-shape')).opacity,
      meterWidth: document.querySelector('.skill-meter i').getBoundingClientRect().width,
      blobAnimation: getComputedStyle(document.querySelector('.aurora-blob')).animationName
    };
  });
  assert.equal(reducedState.opacity, '1', 'reduced motion: content visible without animation');
  assert.equal(reducedState.shapeOpacity, '1', 'reduced motion: radar drawn');
  assert.ok(reducedState.meterWidth > 0, 'reduced motion: meters filled');
  assert.equal(reducedState.blobAnimation, 'none', 'reduced motion: aurora still');

  assert.deepEqual(errors, []);
  const report = {
    socials: socials.map(s => ({label: s.label, href: s.href})),
    radar, meters: meters.map(m => ({name: m.name, level: m.level})),
    roleMeters, cards, insight, sweep,
    screenshots: ['test-results/desktop-glass.png', 'test-results/mobile-glass.png'],
    warnings,
    errors
  };
  fs.mkdirSync('test-results', {recursive: true});
  fs.writeFileSync('test-results/motion-ui.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
