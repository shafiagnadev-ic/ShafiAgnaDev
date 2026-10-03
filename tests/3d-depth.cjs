/* Verifies the 3D depth layer: the centre-split intro, the pointer tilt system,
   the slashcard coverflow, the gallery warp, the 3D reveals and the bike loader
   on the app thumbnail.
   Run:  python -m http.server 4173 --bind 127.0.0.1   (in the project root)
         node tests/3d-depth.cjs                                        */
const {chromium} = require('./playwright.cjs').playwrightCore;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const errors = [];
  const watch = (pg, tag = '') => {
    const prefix = tag ? `${tag} ` : '';
    pg.on('pageerror', e => errors.push(`${prefix}pageerror: ${e.message}`));
    pg.on('console', m => {
      if (m.type() !== 'error') return;
      if (/Failed to load resource/.test(m.text())) return;
      errors.push(`${prefix}console: ${m.text()}`);
    });
    pg.on('response', r => { if (r.status() >= 400) errors.push(`${prefix}http ${r.status()} ${r.url()}`); });
  };
  const introGone = pg => pg.waitForFunction(() => {
    const el = document.getElementById('intro-reveal');
    return !el || getComputedStyle(el).display === 'none';
  }, null, {timeout: 10000});

  /* ---------- 1. the centre-split intro ---------- */
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  watch(page);
  // Hold the load event open by delaying the portrait image (images are in the load
  // event's blocking set; speculative font preloads are not). app.js swaps the portrait
  // src to this file, so this is the request the window actually waits for.
  await page.route(/portrait\.webp$/, async route => {
    await new Promise(r => setTimeout(r, 2500));
    await route.continue();
  });
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  const cover = await page.evaluate(() => {
    const el = document.getElementById('intro-reveal');
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return {
      width: Math.round(box.width), height: Math.round(box.height),
      halves: el.querySelectorAll('.intro-half').length,
      copies: el.querySelectorAll('.intro-copy .intro-mark').length,
      loaders: el.querySelectorAll('.intro-loader-slot, .intro-progress, .intro-counter, .bike-loader-stage').length,
      pointer: getComputedStyle(el).pointerEvents,
      opening: el.classList.contains('is-opening'),
      active: document.documentElement.classList.contains('intro-active'),
      heroHidden: getComputedStyle(document.querySelector('.hero-copy h1')).opacity
    };
  });
  assert.ok(cover, 'intro overlay is rendered');
  assert.equal(cover.width, 1440, 'intro covers the viewport width');
  assert.equal(cover.height, 900, 'intro covers the viewport height');
  assert.equal(cover.halves, 2, 'two halves meet at the centre');
  assert.equal(cover.copies, 2, 'the mark is drawn once per half');
  assert.equal(cover.loaders, 0, 'the intro shows no loading indicator');
  assert.equal(cover.opening, false, 'the cover is still up while the window loads');
  assert.equal(cover.pointer, 'auto', 'intro blocks clicks while it covers the page');
  assert.ok(cover.active, 'hero is held back until the reveal');
  assert.equal(cover.heroHidden, '0', 'hero stays hidden under the cover');

  await page.waitForFunction(() => document.getElementById('intro-reveal')?.classList.contains('is-opening'), null, {timeout: 10000});
  const opening = await page.evaluate(() => {
    const el = document.getElementById('intro-reveal');
    return {
      left: getComputedStyle(el.querySelector('.intro-half-left')).transform,
      right: getComputedStyle(el.querySelector('.intro-half-right')).transform,
      pointer: getComputedStyle(el).pointerEvents
    };
  });
  assert.match(opening.left, /matrix/, 'left half travels away from the centre');
  assert.match(opening.right, /matrix/, 'right half travels away from the centre');
  assert.equal(opening.pointer, 'none', 'open intro no longer swallows clicks');

  await introGone(page);
  const revealed = await page.evaluate(() => ({
    active: document.documentElement.classList.contains('intro-active'),
    done: document.documentElement.classList.contains('intro-revealed'),
    hero: getComputedStyle(document.querySelector('.hero-copy h1')).opacity,
    loader: !!document.querySelector('.depth-spot')
  }));
  assert.equal(revealed.active, false, 'intro-active is cleared');
  assert.ok(revealed.done, 'site marked as revealed');
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.hero-copy h1')).opacity) > 0.95, null, {timeout: 8000});
  assert.ok(revealed.loader, 'cursor spotlight layer exists');

  /* ---------- 2. the app thumbnail keeps the bike loader ---------- */
  // Checked before scrolling: the logo is lazy, so the loader must still be up.
  const appWrap = page.locator('.app-icon');
  const appState = await appWrap.evaluate(el => ({
    loading: el.classList.contains('loading'),
    loader: !!el.querySelector('.bike-loader-stage svg#bike'),
    label: (el.querySelector('.bike-label') || {}).textContent || '',
    imgOpacity: getComputedStyle(el.querySelector('img')).opacity
  }));
  assert.ok(appState.loading, 'app thumbnail is marked as loading while it is empty');
  assert.ok(appState.loader, 'bike loader is mounted on the app thumbnail');
  assert.match(appState.label, /Loading/, 'the loader is labelled');
  assert.equal(appState.imgOpacity, '0', 'empty app thumbnail hides the image placeholder');
  await page.evaluate(() => document.getElementById('make-me-smart').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForFunction(() => {
    const el = document.querySelector('.app-icon');
    const img = el && el.querySelector('img');
    return img && img.complete && img.naturalWidth > 0 && !el.classList.contains('loading') && !el.querySelector('.bike-loader-stage');
  }, null, {timeout: 20000});
  await page.waitForFunction(() => {
    const img = document.querySelector('.app-icon img');
    return img && Number(getComputedStyle(img).opacity) > 0.95;
  }, null, {timeout: 8000});
  assert.ok(true, 'app logo fades in when it arrives');

  /* ---------- 2b. the portrait photo toggle is a 3D flip ---------- */
  const portraitSrc = () => page.evaluate(() => document.getElementById('portrait').getAttribute('src'));
  const before = await portraitSrc();
  // Read the pose synchronously: a 300ms transition on a busy main thread can
  // finish between two polls, so catching a mid-flight frame is a race.
  const applied = await page.evaluate(() => {
    document.getElementById('toggle-photo-btn').click();
    return document.getElementById('portrait').style.transform;
  });
  const perspective = await page.evaluate(() => getComputedStyle(document.querySelector('.portrait-img-container')).perspective);
  assert.match(applied, /rotateY\(90deg\)/, 'photo toggle turns the portrait out of plane');
  assert.equal(perspective, '900px', 'photo frame renders that turn with perspective');
  await page.waitForFunction(prev => document.getElementById('portrait').getAttribute('src') !== prev, before, {timeout: 6000});
  assert.notEqual(before, await portraitSrc(), 'photo toggle swaps formal and casual');

  /* ---------- 3. tilt surfaces respond to the pointer ---------- */
  assert.ok(await page.evaluate(() => matchMedia('(hover:hover) and (pointer:fine)').matches), 'headless run is a fine pointer');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const card = page.locator('#hardware-nine-flipper');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const cardBox = await card.boundingBox();
  await page.mouse.move(cardBox.x + cardBox.width * 0.8, cardBox.y + cardBox.height * 0.2);
  await page.waitForTimeout(220);
  const tilted = await card.evaluate(el => ({
    ry: el.style.getPropertyValue('--ry'), rx: el.style.getPropertyValue('--rx'),
    tz: el.style.getPropertyValue('--tz'),
    transform: getComputedStyle(el).transform,
    cls: el.classList.contains('d3-tilt')
  }));
  assert.ok(tilted.cls, 'hardware card joins the depth system');
  assert.ok(parseFloat(tilted.ry) > 1, `tilt follows the pointer in Y (${tilted.ry})`);
  assert.ok(parseFloat(tilted.rx) > 1, `tilt follows the pointer in X (${tilted.rx})`);
  assert.equal(tilted.tz, '26px', 'hovered surface lifts towards the viewer');
  assert.match(tilted.transform, /matrix3d/, 'tilt is a real 3D transform');
  await page.mouse.move(5, 5);
  await page.waitForTimeout(200);
  const released = await card.evaluate(el => ({ry: el.style.getPropertyValue('--ry'), tz: el.style.getPropertyValue('--tz')}));
  assert.equal(parseFloat(released.ry), 0, 'tilt returns to flat on leave');
  assert.equal(released.tz, '0px', 'lift released on leave');

  /* ---------- 4. slashcard rail is a coverflow ---------- */
  const rail = page.locator('#slashcard-track-container');
  await rail.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const first = page.locator('.slash-card').first();
  const railBefore = await first.evaluate(el => el.style.getPropertyValue('--cf-ry'));
  await rail.evaluate(el => { el.scrollLeft = el.scrollWidth * 0.5; });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.slash-card')).slice(0, 6);
    return cards.map(c => ({ry: c.style.getPropertyValue('--cf-ry'), tz: c.style.getPropertyValue('--cf-tz'), transform: getComputedStyle(c).transform}));
  });
  assert.ok(after.some(c => Math.abs(parseFloat(c.ry)) > 2), 'cards bank with their distance from the rail centre');
  assert.ok(after.some(c => parseFloat(c.tz) < -20), 'cards recede into the depth at the edges');
  assert.ok(after.every(c => /matrix3d/.test(c.transform)), 'coverflow cards use 3D transforms');
  assert.notEqual(railBefore, after[0].ry, 'rail scroll re-poses the first card');

  /* ---------- 5. the gallery canvas renders interactive slashcards ---------- */
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForSelector('.project-card');
  const slash = await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    const glass = card.querySelector('.card-glass');
    const cat = card.querySelector('.slash-cat');
    const name = card.querySelector('.slash-name');
    const open = card.querySelector('.slash-open');
    const thumb = card.querySelector('.thumbnail-wrap');
    const box = card.getBoundingClientRect();
    return {
      cards: document.querySelectorAll('.project-card').length,
      size: [Math.round(box.width), Math.round(box.height)],
      clip: getComputedStyle(glass).clipPath,
      cat: cat && cat.textContent, name: name && name.textContent,
      action: open && open.textContent.replace(/\s+/g, ' ').trim(),
      actionOpacity: open && getComputedStyle(open).opacity,
      glare: !!card.querySelector('.card-glare'),
      thumbHeight: Math.round(thumb.getBoundingClientRect().height),
      innerFits: thumb.getBoundingClientRect().bottom <= glass.getBoundingClientRect().bottom + 1
    };
  });
  assert.ok(slash.cards > 0, `canvas mounts slashcards (${slash.cards})`);
  assert.match(slash.clip, /polygon/, 'canvas cards carry the slash corner');
  assert.equal(slash.cat, 'FOOD & BEVERAGE', 'the card names its own category');
  assert.ok(slash.name && slash.name.length > 1, 'the card names the project');
  assert.match(slash.action, /Buka Website/, 'the card states what clicking does');
  assert.ok(Number(slash.actionOpacity) < 0.9, 'the action stays quiet until hover');
  assert.ok(slash.glare, 'the card carries a pointer-driven glare layer');
  assert.ok(slash.innerFits, 'the slashcard body fits inside the card');
  assert.ok(slash.size[1] > 200 && slash.size[1] < 320, `canvas card is tall enough for the body (${slash.size[1]}px)`);

  // The slash is only visible if the cut is bigger than the border radius: a rounded
  // corner of the same size would swallow the diagonal and hide it.
  const slashGeometry = await page.evaluate(() => {
    const read = el => {
      const cs = getComputedStyle(el);
      const cut = /calc\(100% - (\d+(?:\.\d+)?)px\)/.exec(cs.clipPath);
      return {cut: cut ? Number(cut[1]) : 0, radius: parseFloat(cs.borderTopLeftRadius) || 0};
    };
    return {
      card: read(document.querySelector('.project-card .card-glass')),
      rail: read(document.querySelector('.slash-card'))
    };
  });
  assert.ok(slashGeometry.card.cut > slashGeometry.card.radius, `canvas slash cut (${slashGeometry.card.cut}px) beats its radius (${slashGeometry.card.radius}px)`);
  assert.ok(slashGeometry.rail.cut > slashGeometry.rail.radius, `rail slash cut (${slashGeometry.rail.cut}px) beats its radius (${slashGeometry.rail.radius}px)`);

  // Layout order read from offsets, not bounding boxes: a card rotated in 3D reports
  // an inflated bounding box, so only untransformed geometry proves the stack order.
  const stack = await page.evaluate(() => {
    const card = document.querySelector('.project-card');
    const saved = card.style.transform;
    card.style.transform = 'none';
    const glass = card.querySelector('.card-glass');
    const savedGlass = glass.style.transform;
    glass.style.transform = 'none';
    const parts = ['.thumbnail-wrap', '.slash-cat', '.slash-name', '.slash-open'].map(sel => card.querySelector(sel));
    const out = {
      glass: glass.offsetHeight,
      stacked: parts.every((el, i) => i === 0 || el.offsetTop >= parts[i - 1].offsetTop),
      within: parts.every(el => el.offsetTop + el.offsetHeight <= glass.offsetHeight + 1),
      clipped: parts.some(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1),
      bottom: Math.max(...parts.map(el => el.offsetTop + el.offsetHeight))
    };
    card.style.transform = saved;
    glass.style.transform = savedGlass;
    return out;
  });
  assert.ok(stack.stacked, 'the card stacks thumbnail, category, name and action in order');
  assert.ok(stack.within, `the card content stays inside the card (${stack.bottom}px of ${stack.glass}px)`);
  assert.equal(stack.clipped, false, 'no card text is clipped');

  // hover: the action lights up, the thumbnail zooms, the card floats forward
  const live = page.locator('.project-card').first();
  const liveId = Number(await live.getAttribute('data-id'));
  await live.hover({force: true});
  await page.waitForFunction(id => {
    const open = document.querySelector('.project-card .slash-open');
    const card = document.querySelector('.project-card');
    return card && Number(getComputedStyle(open).opacity) > 0.9
      && /matrix3d/.test(getComputedStyle(card).transform)
      && getComputedStyle(card.querySelector('.thumbnail-wrap img')).transform !== 'none';
  }, liveId, {timeout: 8000});
  const hoverState = await live.evaluate(el => ({
    action: getComputedStyle(el.querySelector('.slash-open')).opacity,
    cardTransform: getComputedStyle(el).transform,
    imgTransform: getComputedStyle(el.querySelector('.thumbnail-wrap img')).transform,
    border: getComputedStyle(el.querySelector('.card-glass')).borderTopColor,
    glare: getComputedStyle(el.querySelector('.card-glare')).opacity
  }));
  assert.ok(Number(hoverState.action) > 0.9, 'hover lights up the card action');
  assert.match(hoverState.cardTransform, /matrix3d/, 'hovered card floats in 3D');
  assert.match(hoverState.imgTransform, /matrix/, 'hovered thumbnail zooms');
  assert.ok(Number(hoverState.glare) > 0.5, 'hovered card shows the pointer glare');
  await page.mouse.move(5, 5);

  // the same card still opens its site in a new tab
  // Click a card whose centre really sits inside the canvas: a card hanging over the
  // edge cannot be clicked reliably.
  const spot = await page.evaluate(() => {
    const canvas = document.getElementById('gallery-viewport').getBoundingClientRect();
    for (const card of document.querySelectorAll('.project-card')) {
      const box = card.getBoundingClientRect();
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      if (cx < canvas.left + 10 || cx > canvas.right - 10) continue;
      if (cy < canvas.top + 10 || cy > canvas.bottom - 10) continue;
      if (cy < 0 || cy > innerHeight) continue;
      return {x: cx, y: cy, name: card.querySelector('.slash-name').textContent};
    }
    return null;
  });
  assert.ok(spot, 'a canvas slashcard is fully inside the canvas');
  const popupPromise = page.waitForEvent('popup');
  await page.mouse.click(spot.x, spot.y);
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  assert.ok(popup.url().startsWith('http'), `canvas slashcard "${spot.name}" opens its site (${popup.url().slice(0, 40)})`);
  await popup.close();
  assert.ok(page.url().startsWith(base), 'the portfolio stays on its own page');

  /* ---------- 6. the slashcard rail is directly draggable ---------- */
  await rail.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const railBox = await rail.boundingBox();
  const railStart = await rail.evaluate(el => el.scrollLeft);
  await page.mouse.move(railBox.x + railBox.width - 60, railBox.y + railBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(railBox.x + 120, railBox.y + railBox.height / 2, {steps: 12});
  await page.mouse.up();
  await page.waitForTimeout(250);
  const railDragged = await rail.evaluate(el => el.scrollLeft);
  assert.ok(railDragged > railStart, `pointer drag pans the rail (${railStart} → ${railDragged})`);
  assert.equal(await rail.getAttribute('tabindex'), '0', 'the rail is keyboard reachable');
  await rail.focus();
  const railBeforeKey = await rail.evaluate(el => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  assert.ok(await rail.evaluate(el => el.scrollLeft) > railBeforeKey, 'arrow keys pan the rail');

  /* ---------- 7. the wall is static: swapping a category never animates it ---------- */
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForSelector('.project-card');
  await page.locator('.category-chip[data-category="Property"]').click();
  await page.waitForTimeout(120);
  const afterSwap = await page.evaluate(() => ({
    cards: document.querySelectorAll('.project-card').length,
    onOrigin: portfolioGallery.world.items.every(p => p.x === p.originX && p.y === p.originY),
    transform: getComputedStyle(document.querySelector('.project-card')).transform,
    posed: [...document.querySelectorAll('.project-card')].map(c => c.style.transform)
  }));
  assert.ok(afterSwap.cards > 0, 'cards mount for the new category');
  assert.ok(afterSwap.onOrigin, 'every card sits on its layout origin');
  assert.match(afterSwap.transform, /matrix/, 'cards are posed on the 3D stage');
  await page.waitForTimeout(800);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.project-card')].map(c => c.style.transform)), afterSwap.posed, 'nothing moves after the swap');

  /* ---------- 6. no horizontal overflow anywhere ---------- */
  const sweep = [];
  for (const width of [1440, 1100, 900, 700, 680, 480, 390]) {
    const view = await browser.newPage({viewport: {width, height: 900}});
    watch(view, `${width}px`);
    await view.goto(base, {waitUntil: 'load'});
    await introGone(view);
    await view.evaluate(() => document.querySelector('#keahlian').scrollIntoView({block: 'center', behavior: 'instant'}));
    await view.waitForTimeout(900);
    const state = await view.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      rowHeight: Math.max(...Array.from(document.querySelectorAll('.skill-row')).map(r => r.getBoundingClientRect().height)),
      svgInside: (() => {
        const panel = document.querySelector('.chart-panel').getBoundingClientRect();
        const svg = document.getElementById('skill-radar').getBoundingClientRect();
        return svg.left >= panel.left - 1 && svg.right <= panel.right + 1;
      })(),
      headerRight: Math.round(document.querySelector('.header-controls').getBoundingClientRect().right),
      intro: !!document.getElementById('intro-reveal')
    }));
    await view.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.getElementById('tentang').scrollIntoView({block: 'start', behavior: 'instant'});
    });
    await view.waitForTimeout(1500);
    const anchor = await view.evaluate(() => {
      const heading = document.getElementById('about-title').getBoundingClientRect();
      const header = document.getElementById('site-header').getBoundingClientRect();
      return {clears: heading.top >= header.bottom - 2, headerHeight: Math.round(header.height)};
    });
    await view.close();
    sweep.push({width, ...state, anchor});
    assert.ok(state.overflow <= 1, `${width}px: no horizontal overflow (${state.overflow}px)`);
    assert.ok(state.headerRight <= width + 1, `${width}px: header controls stay inside the viewport (${state.headerRight})`);
    assert.ok(anchor.clears, `${width}px: anchor target clears the ${anchor.headerHeight}px header`);
    assert.ok(state.rowHeight < 90, `${width}px: skill rows stay single-line (${state.rowHeight.toFixed(0)}px)`);
    assert.ok(state.svgInside, `${width}px: radar stays inside its panel`);
    assert.equal(state.intro, false, `${width}px: intro is removed after the reveal`);
  }

  /* ---------- 7. reduced motion: flat, instant, no intro ---------- */
  const reduced = await browser.newPage({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
  watch(reduced, 'reduced');
  await reduced.goto(base, {waitUntil: 'load'});
  const flat = await reduced.evaluate(() => ({
    intro: !!document.getElementById('intro-reveal'),
    revealed: document.documentElement.classList.contains('intro-revealed'),
    hero: getComputedStyle(document.querySelector('.hero-copy h1')).opacity,
    reveal: getComputedStyle(document.querySelector('.chart-panel')).transform,
    spot: !!document.querySelector('.depth-spot')
  }));
  assert.equal(flat.intro, false, 'reduced motion skips the intro entirely');
  assert.ok(flat.revealed, 'reduced motion still uncovers the site');
  assert.equal(flat.hero, '1', 'reduced motion shows the hero immediately');
  assert.equal(flat.reveal, 'none', 'reduced motion leaves revealed sections flat');
  assert.equal(flat.spot, false, 'reduced motion has no cursor spotlight');
  await reduced.close();

  assert.deepEqual(errors, []);
  const out = process.env.SHOT_DIR || require('node:path').join(__dirname, '..', '..', 'Kumpulan', 'test-results');
  fs.mkdirSync(out, {recursive: true});
  const report = {cover, opening, revealed, tilted, coverflow: after, staticWall: afterSwap, app: appState, sweep, flat, errors};
  fs.writeFileSync(require('node:path').join(out, '3d-depth.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
