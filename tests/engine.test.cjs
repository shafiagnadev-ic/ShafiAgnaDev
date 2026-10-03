const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const enginePath = path.join(__dirname, '../js/gallery-engine.js');
test('world gives every data item a unique bounded position without mounting DOM', () => {
  assert.ok(fs.existsSync(enginePath), 'gallery engine must exist');
  const {createWorld} = require(enginePath);
  const data = Array.from({length: 240}, (_, i) => ({nama:`Test ${i}`, url:`https://example.com/${i}`,thumbnail:''}));
  const world = createWorld(data, false);
  assert.equal(world.items.length, 240);
  assert.equal(new Set(world.items.map(p => `${p.x},${p.y}`)).size, 240);
  for (const p of world.items) {
    assert.ok(p.x >= 0 && p.x + world.cardWidth <= world.width);
    assert.ok(p.y >= 0 && p.y + world.cardHeight <= world.height);
    assert.equal(p.data, data[p.id]);
  }
});
test('culling returns only nearby cards and enforces a smaller mobile budget', () => {
  const engine = require(enginePath);
  assert.equal(typeof engine.visibleItems, 'function', 'position-based culling exists');
  const world = engine.createWorld(Array.from({length:240}, (_,i)=>({nama:String(i)})));
  const viewport = {x:0,y:0,width:1200,height:650};
  const visible = engine.visibleItems(world, viewport, 32, 80);
  assert.ok(visible.length > 0 && visible.length <= 32 && visible.length < 240);
  assert.ok(visible.every(p=>p.x < 1280 && p.y < 730));
  const far = engine.visibleItems(world, {...viewport,x:2000,y:2000},32,80);
  assert.ok(far.length > 0);
  assert.ok(far.every(p=>!visible.includes(p)));
  assert.ok(engine.visibleItems(world,{...viewport,width:4000,height:4000},10,40).length <= 10);
});
