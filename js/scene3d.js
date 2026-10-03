/* Real 3D layer: a hand-written WebGL scene — no library, no CDN, works offline and
   over file://.
   It draws a slowly rotating point-globe with wireframe meridians/parallels and three
   tilted orbit rings behind the page content. One pointer listener and one scroll
   listener pose the camera, colours come from the theme tokens (dark = additive glow,
   light = ink), so both themes are covered.

   Removable in one step: delete this file, the "3D SCENE (WebGL)" block at the end of
   css/styles.css and the <canvas id="depth-scene"> in index.html and the site falls
   back to the CSS depth layer alone. No WebGL -> the canvas removes itself and nothing
   else changes. prefers-reduced-motion -> one static frame instead of the loop. */
(function () {
  'use strict';
  const canvas = document.getElementById('depth-scene');
  if (!canvas || !window.WebGLRenderingContext) return;

  const ATTRIBUTES = {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: 'low-power',
    /* The drawing buffer is kept so the rendered frame can be read back (tests, and any
       screenshot/thumbnail tool the visitor's browser offers). */
    preserveDrawingBuffer: true
  };
  let gl = null;
  try {
    gl = canvas.getContext('webgl', ATTRIBUTES) || canvas.getContext('experimental-webgl', ATTRIBUTES);
  } catch (error) {
    gl = null;
  }
  if (!gl) { canvas.remove(); return; }

  /* ---------- shaders ---------- */
  const VERTEX = [
    'attribute vec3 aPos;',
    'attribute float aSeed;',
    'uniform mat3 uRot;',
    'uniform float uScale;',   /* projection scale (NDC per unit at the camera plane) */
    'uniform float uAspect;',
    'uniform float uZoom;',    /* camera distance: w = p.z + uZoom */
    'uniform float uSize;',    /* point sprite size in CSS px before the divide */
    'uniform float uDpr;',
    'uniform vec2 uCenter;',
    'varying float vFog;',
    'varying float vSeed;',
    'void main() {',
    '  vec3 p = uRot * aPos;',
    '  float w = max(p.z + uZoom, 0.35);',
    '  float s = uScale / w;',
    '  gl_Position = vec4(p.x * s / uAspect + uCenter.x, p.y * s + uCenter.y, 0.0, 1.0);',
    '  gl_PointSize = clamp(uSize * uDpr / w, 1.0, 30.0 * uDpr);',
    '  vFog = clamp((w - 1.05) / 2.6, 0.0, 1.0);',
    '  vSeed = aSeed;',
    '}'
  ].join('\n');

  const FRAGMENT_POINT = [
    'precision mediump float;',
    'uniform vec3 uColorA;',
    'uniform vec3 uColorB;',
    'uniform float uAlpha;',
    'varying float vFog;',
    'varying float vSeed;',
    'void main() {',
    '  vec2 d = gl_PointCoord - 0.5;',
    '  float r2 = dot(d, d);',
    '  if (r2 > 0.25) discard;',
    '  float falloff = smoothstep(0.25, 0.0, r2);',
    '  float a = falloff * falloff * (1.0 - vFog * 0.8) * uAlpha;',
    '  gl_FragColor = vec4(mix(uColorA, uColorB, vSeed) * a, a);',
    '}'
  ].join('\n');

  const FRAGMENT_LINE = [
    'precision mediump float;',
    'uniform vec3 uColorA;',
    'uniform float uAlpha;',
    'varying float vFog;',
    'void main() {',
    '  float a = uAlpha * (1.0 - vFog * 0.85);',
    '  gl_FragColor = vec4(uColorA * a, a);',
    '}'
  ].join('\n');

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  function program(fragmentSource) {
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return null;
    const linked = gl.createProgram();
    gl.attachShader(linked, vs);
    gl.attachShader(linked, fs);
    gl.linkProgram(linked);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return gl.getProgramParameter(linked, gl.LINK_STATUS) ? linked : null;
  }

  const pointProgram = program(FRAGMENT_POINT);
  const lineProgram = program(FRAGMENT_LINE);
  if (!pointProgram || !lineProgram) { canvas.remove(); return; }

  function uniforms(linked, names) {
    const map = {};
    for (const name of names) map[name] = gl.getUniformLocation(linked, name);
    return map;
  }
  const pointU = uniforms(pointProgram, ['uRot', 'uScale', 'uAspect', 'uZoom', 'uSize', 'uDpr', 'uCenter', 'uColorA', 'uColorB', 'uAlpha']);
  const lineU = uniforms(lineProgram, ['uRot', 'uScale', 'uAspect', 'uZoom', 'uSize', 'uDpr', 'uCenter', 'uColorA', 'uAlpha']);

  /* ---------- geometry ---------- */
  const TOTAL_POINTS = 1500;
  const pointData = new Float32Array(TOTAL_POINTS * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < TOTAL_POINTS; i++) {
    const y = 1 - (i / (TOTAL_POINTS - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const shell = 1 + (Math.random() - 0.5) * 0.12;
    pointData[i * 4] = Math.cos(theta) * ring * shell;
    pointData[i * 4 + 1] = y * shell;
    pointData[i * 4 + 2] = Math.sin(theta) * ring * shell;
    pointData[i * 4 + 3] = Math.random();
  }

  const SEGMENTS = 72;
  const lineVertices = [];
  const push = (x, y, z) => lineVertices.push(x, y, z, 0);
  /* parallels */
  for (let k = -2; k <= 2; k++) {
    const lat = (k * Math.PI) / 6;
    const r = Math.cos(lat), y = Math.sin(lat);
    for (let i = 0; i < SEGMENTS; i++) {
      const a0 = (i / SEGMENTS) * Math.PI * 2, a1 = ((i + 1) / SEGMENTS) * Math.PI * 2;
      push(Math.cos(a0) * r, y, Math.sin(a0) * r);
      push(Math.cos(a1) * r, y, Math.sin(a1) * r);
    }
  }
  /* meridians: eight half circles through both poles */
  for (let m = 0; m < 8; m++) {
    const phi = (m * Math.PI) / 8;
    for (let i = 0; i < SEGMENTS; i++) {
      const t0 = (i / SEGMENTS) * Math.PI, t1 = ((i + 1) / SEGMENTS) * Math.PI;
      const p0 = [Math.sin(t0) * Math.cos(phi), Math.cos(t0), Math.sin(t0) * Math.sin(phi)];
      const p1 = [Math.sin(t1) * Math.cos(phi), Math.cos(t1), Math.sin(t1) * Math.sin(phi)];
      push(p0[0], p0[1], p0[2]);
      push(p1[0], p1[1], p1[2]);
    }
  }
  /* three orbit rings, each tilted differently */
  const RINGS = [
    {radius: 1.36, tiltX: 1.02, tiltZ: 0.0},
    {radius: 1.62, tiltX: -0.34, tiltZ: 0.62},
    {radius: 1.92, tiltX: 1.42, tiltZ: -0.28}
  ];
  for (const ring of RINGS) {
    const cx = Math.cos(ring.tiltX), sx = Math.sin(ring.tiltX);
    const cz = Math.cos(ring.tiltZ), sz = Math.sin(ring.tiltZ);
    for (let i = 0; i < SEGMENTS * 2; i++) {
      const a0 = (i / (SEGMENTS * 2)) * Math.PI * 2, a1 = ((i + 1) / (SEGMENTS * 2)) * Math.PI * 2;
      for (const a of [a0, a1]) {
        /* circle in the XZ plane, then rotated about X and about Z */
        const x0 = Math.cos(a) * ring.radius, y0 = 0, z0 = Math.sin(a) * ring.radius;
        const y1 = y0 * cx - z0 * sx, z1 = y0 * sx + z0 * cx;
        const x2 = x0 * cz - y1 * sz, y2 = x0 * sz + y1 * cz;
        push(x2, y2, z1);
      }
    }
  }
  const lineData = new Float32Array(lineVertices);
  const lineVertexCount = lineVertices.length / 4;

  function buffer(data) {
    const handle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, handle);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return handle;
  }
  const pointBuffer = buffer(pointData);
  const lineBuffer = buffer(lineData);

  function bindAttributes(linked) {
    const position = gl.getAttribLocation(linked, 'aPos');
    const seed = gl.getAttribLocation(linked, 'aSeed');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 16, 0);
    if (seed >= 0) {
      gl.enableVertexAttribArray(seed);
      gl.vertexAttribPointer(seed, 1, gl.FLOAT, false, 16, 12);
    }
  }

  /* ---------- state ---------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const SPIN = 0.35;          /* start angle of the globe */
  const PITCH = -0.26;        /* start tilt: the north pole leans towards the viewer */
  const ZOOM = 2.6;           /* camera distance in globe radii */
  const state = {
    width: 0, height: 0, dpr: 1, spin: SPIN,
    aimX: 0, aimY: 0, pointerX: 0, pointerY: 0, scroll: 0,
    alpha: 0.62, colorA: [0.77, 0.89, 0.7], colorB: [0.24, 0.68, 0.96],
    pointCount: TOTAL_POINTS, frames: 0, slowFrames: 0, raf: 0, last: 0, running: false
  };

  function parseColor(value) {
    const text = String(value || '').trim();
    const hex = text.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const rgb = text.match(/rgba?\(([^)]+)\)/i);
    if (rgb) {
      const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
      if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) return parts.map(n => n / 255);
    }
    return null;
  }

  function readTheme() {
    const light = (document.documentElement.getAttribute('data-theme') || 'dark') === 'light';
    const accent = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--accent'));
    state.colorA = accent || (light ? [0.28, 0.41, 0.22] : [0.77, 0.89, 0.7]);
    state.colorB = light ? [0.09, 0.5, 0.6] : [0.24, 0.68, 0.96];
    state.alpha = light ? 0.42 : 0.62;
    /* Additive light on the dark theme; ink that darkens the light theme. Both read the
       same premultiplied fragment output. */
    gl.enable(gl.BLEND);
    if (light) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFunc(gl.ONE, gl.ONE);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (state.width === width && state.height === height && state.dpr === dpr) return;
    state.width = width; state.height = height; state.dpr = dpr;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /* Column-major rotation matrix for Rx(pitch) * Ry(yaw). */
  const matrix = new Float32Array(9);
  function rotation(pitch, yaw) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    matrix[0] = cy;      matrix[1] = sx * sy;  matrix[2] = -cx * sy;
    matrix[3] = 0;       matrix[4] = cx;       matrix[5] = sx;
    matrix[6] = sy;      matrix[7] = -sx * cy; matrix[8] = cx * cy;
    return matrix;
  }

  function draw() {
    resize();
    const width = state.width, height = state.height;
    const narrow = width < 760;
    const radius = Math.min(width, height) * (narrow ? 0.42 : 0.34);
    /* Scroll and the pointer add to the slow spin instead of replacing it, so the globe
       keeps turning while the visitor reads. */
    const yaw = state.spin + state.pointerX * 0.55;
    const pitch = PITCH - state.pointerY * 0.4 - state.scroll * 0.5;
    const zoom = ZOOM + state.scroll * 0.55;
    const scale = (2 * radius * zoom) / Math.max(1, height);
    const centerX = 2 * (width * (narrow ? 0.5 : 0.64)) / width - 1;
    const centerY = 1 - 2 * (height * (narrow ? 0.34 : 0.4)) / height;
    const pointSize = radius * 0.026 * zoom;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(lineProgram);
    gl.uniformMatrix3fv(lineU.uRot, false, rotation(pitch, yaw));
    gl.uniform1f(lineU.uScale, scale);
    gl.uniform1f(lineU.uAspect, width / Math.max(1, height));
    gl.uniform1f(lineU.uZoom, zoom);
    gl.uniform1f(lineU.uSize, 1);
    gl.uniform1f(lineU.uDpr, state.dpr);
    gl.uniform2f(lineU.uCenter, centerX, centerY);
    gl.uniform3fv(lineU.uColorA, state.colorA);
    gl.uniform1f(lineU.uAlpha, state.alpha * 0.55);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    bindAttributes(lineProgram);
    gl.drawArrays(gl.LINES, 0, lineVertexCount);

    gl.useProgram(pointProgram);
    gl.uniformMatrix3fv(pointU.uRot, false, matrix);
    gl.uniform1f(pointU.uScale, scale);
    gl.uniform1f(pointU.uAspect, width / Math.max(1, height));
    gl.uniform1f(pointU.uZoom, zoom);
    gl.uniform1f(pointU.uSize, pointSize);
    gl.uniform1f(pointU.uDpr, state.dpr);
    gl.uniform2f(pointU.uCenter, centerX, centerY);
    gl.uniform3fv(pointU.uColorA, state.colorA);
    gl.uniform3fv(pointU.uColorB, state.colorB);
    gl.uniform1f(pointU.uAlpha, state.alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    bindAttributes(pointProgram);
    gl.drawArrays(gl.POINTS, 0, state.pointCount);

    state.frames++;
    canvas.classList.add('is-live');
  }

  function schedule() {
    if (state.raf || !state.running) return;
    state.raf = requestAnimationFrame(step);
  }

  function step(now) {
    state.raf = 0;
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 0.016;
    state.last = now;
    const started = performance.now();

    state.pointerX += (state.aimX - state.pointerX) * 0.06;
    state.pointerY += (state.aimY - state.pointerY) * 0.06;
    state.spin += dt * 0.16;
    draw();

    const cost = performance.now() - started;
    if (state.frames < 120 && cost > 26) {
      state.slowFrames++;
      if (state.slowFrames > 40 && state.pointCount > 500) {
        state.pointCount = Math.round(state.pointCount / 2);
        state.slowFrames = 0;
      }
    }
    schedule();
  }

  /* A single static frame still has to react to the pointer and to scroll, so the pose
     is painted immediately whenever the loop is not running. */
  function repaint() { if (!state.running) draw(); }

  /* ---------- input ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced.matches) {
    window.addEventListener('pointermove', event => {
      state.aimX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
      state.aimY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
      if (!state.running) { state.pointerX = state.aimX; state.pointerY = state.aimY; }
      repaint();
    }, { passive: true });
  }
  window.addEventListener('scroll', () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.scroll = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
    repaint();
  }, { passive: true });
  window.addEventListener('resize', () => { resize(); draw(); });

  /* The theme toggle rewrites data-theme on <html>. */
  new MutationObserver(() => { readTheme(); draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- lifecycle ---------- */
  function start() {
    if (state.running || reduced.matches || document.hidden) return;
    state.running = true;
    state.last = 0;
    schedule();
  }
  function stop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }
  function sync() {
    if (reduced.matches) { stop(); resize(); draw(); }
    else start();
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else sync(); });
  if (reduced.addEventListener) reduced.addEventListener('change', sync);
  sync();
})();
