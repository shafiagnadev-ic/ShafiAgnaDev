const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../js/gallery-engine.js');

// The wall is static: cards are laid out once on a fixed grid and never move on their own.
// The engine exposes no step/drift function at all, so nothing can animate the wall by
// accident — the only thing that moves is the camera, moved by the visitor.
test('the wall is static: cards sit on their grid and carry no velocity', () => {
  assert.equal(engine.stepWorld, undefined, 'no drift step is exposed');
  const data = Array.from({length: 240}, (_, i) => ({nama: `Test ${i}`}));
  const world = engine.createWorld(data);
  assert.equal(world.items.length, 240);
  assert.ok(world.items.every(p => p.x === p.originX && p.y === p.originY), 'every card sits on its origin');
  assert.ok(world.items.every(p => p.vx === undefined && p.vy === undefined), 'cards carry no velocity');
  const mobile = engine.createWorld(data, true);
  assert.ok(mobile.items.every(p => p.x === p.originX && p.y === p.originY), 'mobile grid is static too');
});

test('the layout is deterministic: the same collection always lands on the same grid', () => {
  const data = Array.from({length: 40}, (_, i) => ({nama: `Test ${i}`}));
  const a = engine.createWorld(data).items.map(p => [p.x, p.y]);
  const b = engine.createWorld(data).items.map(p => [p.x, p.y]);
  assert.deepEqual(a, b);
  assert.equal(new Set(a.map(pair => pair.join(','))).size, a.length, 'no two cards share a slot');
});
