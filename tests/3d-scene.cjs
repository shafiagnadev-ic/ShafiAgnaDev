/* Verifies the WebGL 3D scene, the portrait depth layer and — end to end — that every
   project card still opens its website in a new tab now that the project files live in
   ../Kumpulan instead of inside this folder.

   Run from the folder that CONTAINS the portfolio (so ../Kumpulan resolves):
     python -c "import functools,http.server,socketserver; socketserver.TCPServer.request_queue_size=256; http.server.ThreadingHTTPServer(('127.0.0.1',4173), functools.partial(http.server.SimpleHTTPRequestHandler, directory='.')).serve_forever()"
     TEST_URL=http://127.0.0.1:4173/Portofolio%202/ node "Portofolio 2/tests/3d-scene.cjs"   */
const {chromium} = require('./playwright.cjs').playwrightCore;
const assert = require('node:assert/strict');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/Portofolio%202/';

/* Reads the actual GL framebuffer of the scene: how many pixels are lit, and a cheap
   hash so two samples can be compared (the scene must move, and must not move when the
   visitor prefers reduced motion). */
const sampleScene = page => page.evaluate(() => {
  const canvas = document.getElementById('depth-scene');
  if (!canvas) return {missing: true};
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return {noContext: true, width: canvas.width, height: canvas.height};
  const width = canvas.width, height = canvas.height;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let lit = 0, hash = 2166136261, peak = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a > 8) lit++;
    if (a > peak) peak = a;
    hash = (hash ^ (a + pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7)) >>> 0;
    hash = (hash * 16777619) >>> 0;
  }
  return {width, height, lit, total: width * height, peak, hash, frames: window.__sceneFrames || null};
});

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
  const settle = async pg => {
    await pg.waitForFunction(() => {
      const el = document.getElementById('intro-reveal');
      return !el || getComputedStyle(el).display === 'none';
    }, null, {timeout: 15000});
  };

  /* ---------- 1. the scene exists and paints ---------- */
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  watch(page);
  await page.goto(base, {waitUntil: 'load'});
  await settle(page);
  await page.waitForTimeout(900);

  const canvasState = await page.evaluate(() => {
    const canvas = document.getElementById('depth-scene');
    if (!canvas) return {present: false};
    const style = getComputedStyle(canvas);
    return {
      present: true,
      context: !!canvas.getContext('webgl'),
      width: canvas.width, height: canvas.height,
      cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight,
      position: style.position, zIndex: style.zIndex, pointerEvents: style.pointerEvents,
      live: canvas.classList.contains('is-live'),
      opacity: Number(style.opacity)
    };
  });
  assert.ok(canvasState.present, 'the scene canvas is in the document');
  assert.ok(canvasState.context, 'the scene runs on a real WebGL context');
  assert.equal(canvasState.position, 'fixed', 'the scene is a fixed backdrop');
  assert.equal(canvasState.pointerEvents, 'none', 'the scene never swallows clicks');
  assert.equal(canvasState.cssWidth, 1440, 'the scene spans the viewport');
  assert.ok(canvasState.width >= 1440 && canvasState.height >= 900, `backing store matches the viewport (${canvasState.width}x${canvasState.height})`);
  assert.ok(canvasState.live, 'the scene reports itself live after its first frame');
  assert.ok(canvasState.opacity > 0.4, `the scene is visible (opacity ${canvasState.opacity})`);

  const first = await sampleScene(page);
  assert.ok(!first.missing && !first.noContext, 'the framebuffer is readable');
  const coverage = first.lit / first.total;
  assert.ok(first.lit > 3000, `the scene draws geometry (${first.lit} lit pixels)`);
  assert.ok(coverage > 0.002 && coverage < 0.35, `the scene covers a sane share of the canvas (${(coverage * 100).toFixed(2)}%)`);
  assert.ok(first.peak > 40, `the scene is not a black frame (peak alpha ${first.peak})`);

  /* ---------- 2. it is animated, and it stays behind the content ---------- */
  await page.waitForTimeout(700);
  const second = await sampleScene(page);
  assert.notEqual(second.hash, first.hash, 'the globe keeps rotating between frames');

  const layering = await page.evaluate(() => ({
    canvasZ: Number(getComputedStyle(document.getElementById('depth-scene')).zIndex),
    mainZ: Number(getComputedStyle(document.querySelector('main')).zIndex),
    auroraZ: Number(getComputedStyle(document.querySelector('.aurora')).zIndex)
  }));
  assert.ok(layering.mainZ > layering.canvasZ, 'content sits above the scene');
  assert.ok(layering.auroraZ <= layering.canvasZ, 'the aurora stays behind the scene');

  /* ---------- 3. scroll and pointer re-pose the camera ---------- */
  const beforeScroll = await sampleScene(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.6));
  await page.waitForTimeout(500);
  const afterScroll = await sampleScene(page);
  assert.notEqual(afterScroll.hash, beforeScroll.hash, 'scrolling re-poses the 3D camera');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  /* ---------- 4. the portrait photo floats above its frame in real 3D ---------- */
  const portrait = await page.evaluate(() => {
    const container = document.querySelector('.portrait-img-container');
    const img = document.getElementById('portrait');
    const matrix = new DOMMatrixReadOnly(getComputedStyle(img).transform);
    return {
      stage: getComputedStyle(container).transformStyle,
      perspective: getComputedStyle(container).perspective,
      z: matrix.m43,
      matrix: getComputedStyle(img).transform
    };
  });
  assert.equal(portrait.stage, 'preserve-3d', 'the portrait container is a 3D stage');
  assert.match(portrait.perspective, /px/, 'the stage has perspective');
  assert.ok(portrait.z > 20, `the photo rides above the frame (translateZ ${portrait.z}px)`);

  /* ---------- 5. every project card still opens its website in a new tab ---------- */
  const links = await page.evaluate(() => {
    const seen = new Map();
    for (const node of document.querySelectorAll('.slash-card, .project-card, .search-result, .dialog-project')) {
      const href = node.getAttribute('href');
      if (href) seen.set(href, (seen.get(href) || 0) + 1);
    }
    return [...seen.keys()];
  });
  assert.ok(links.length > 0, `project links are rendered (${links.length})`);
  // A link is either the catalog's own relative path (../Kumpulan/Website/...) or — when the
  // two-port preview is running — that same path served by the projects server on 5510.
  const wrong = links.filter(href => !/^\.\.\/Kumpulan\/Website\//.test(href)
    && !/^https?:\/\/[^/]+\/Website\//.test(href) && !href.startsWith('#'));
  assert.deepEqual(wrong, [], 'every project link points at the moved project folder');

  const statuses = await page.evaluate(async hrefs => {
    const out = [];
    for (const href of hrefs.slice(0, 12)) {
      try {
        const response = await fetch(href, {method: 'GET'});
        out.push({href, status: response.status});
      } catch (error) {
        out.push({href, status: String(error)});
      }
    }
    return out;
  }, links);
  for (const entry of statuses) {
    assert.equal(entry.status, 200, `${entry.href} resolves to a real project (${entry.status})`);
  }

  /* one real click: a new tab, and the project itself loads there */
  await page.evaluate(() => document.getElementById('gallery-viewport').scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForSelector('.project-card');
  await page.waitForTimeout(300);
  const spot = await page.evaluate(() => {
    const canvas = document.getElementById('gallery-viewport').getBoundingClientRect();
    for (const card of document.querySelectorAll('.project-card')) {
      const box = card.getBoundingClientRect();
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      if (cx < canvas.left + 10 || cx > canvas.right - 10) continue;
      if (cy < canvas.top + 10 || cy > canvas.bottom - 10) continue;
      if (cy < 0 || cy > innerHeight) continue;
      return {x: cx, y: cy, href: card.getAttribute('href')};
    }
    return null;
  });
  assert.ok(spot, 'a canvas card is clickable inside the viewport');
  const popupPromise = page.waitForEvent('popup');
  await page.mouse.click(spot.x, spot.y);
  const popup = await popupPromise;
  const popupResponse = await popup.waitForLoadState('domcontentloaded').then(() => popup.evaluate(() => ({
    url: location.href, title: document.title, body: !!document.body && document.body.childElementCount > 0
  })));
  // The target is either ../Kumpulan/Website/... (plain static server) or that same path
  // served by the projects server on its own port — never the portfolio page itself.
  assert.ok(/\/Website\//.test(popupResponse.url) && popupResponse.url !== page.url(),
    `the new tab opens the moved project (${popupResponse.url})`);
  assert.equal(popupResponse.body, true, 'the project page actually renders in the new tab');
  assert.ok(page.url().startsWith(base), 'the portfolio itself stayed on its own page');
  await popup.close();

  /* ---------- 6. reduced motion: one static frame, no loop ---------- */
  const stillPage = await browser.newPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  watch(stillPage, '[reduced]');
  await stillPage.goto(base, {waitUntil: 'load'});
  await settle(stillPage);
  await stillPage.waitForTimeout(600);
  const still1 = await sampleScene(stillPage);
  await stillPage.waitForTimeout(800);
  const still2 = await sampleScene(stillPage);
  assert.ok(still1.lit > 1000, `reduced motion still shows the scene (${still1.lit} lit pixels)`);
  assert.equal(still2.hash, still1.hash, 'reduced motion holds a single frame');
  await stillPage.close();

  /* ---------- 7. no layout damage and no failed requests ---------- */
  for (const width of [1440, 1100, 900, 700, 480, 390]) {
    await page.setViewportSize({width, height: 900});
    await page.waitForTimeout(220);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `no horizontal overflow at ${width}px (${overflow}px)`);
    const frame = await page.evaluate(() => {
      const canvas = document.getElementById('depth-scene');
      return canvas ? {w: canvas.clientWidth, h: canvas.clientHeight, backing: canvas.width} : null;
    });
    assert.ok(frame && frame.w === width && frame.backing >= width, `the scene follows the viewport at ${width}px`);
  }

  await page.setViewportSize({width: 1440, height: 900});
  await page.evaluate(() => document.getElementById('theme-toggle').click());
  await page.waitForTimeout(500);
  const lightScene = await sampleScene(page);
  assert.ok(lightScene.lit > 1000, `the scene survives the light theme (${lightScene.lit} lit pixels)`);
  const blend = await page.evaluate(() => {
    const gl = document.getElementById('depth-scene').getContext('webgl');
    return {theme: document.documentElement.getAttribute('data-theme'), error: gl.getError()};
  });
  assert.equal(blend.theme, 'light', 'the theme toggle switched the document');
  assert.equal(blend.error, 0, 'no GL error after the theme swap');

  assert.deepEqual(errors, [], `no page errors or failed requests (${errors.join(' | ')})`);

  await browser.close();
  console.log('3d-scene: all checks passed');
})().catch(error => {
  console.error('3d-scene FAILED:', error.message);
  process.exit(1);
});
