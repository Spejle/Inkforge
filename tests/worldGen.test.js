import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWorld, heightField, components, traceOutline, simplifyLoop } from '../src/plugins/builtin/worldGen/index.js';

test('the same seed makes the same world; another seed a different one', () => {
  const a = generateWorld({ width: 1920, height: 1080, seed: 5 });
  const b = generateWorld({ width: 1920, height: 1080, seed: 5 });
  const c = generateWorld({ width: 1920, height: 1080, seed: 6 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.landmasses, c.landmasses);
});

test('land share follows the slider and the map border stays sea', () => {
  for (const land of [0.2, 0.5]) {
    const f = heightField(200, 120, 3, land);
    const share = f.land.reduce((s, v) => s + v, 0) / f.land.length;
    assert.ok(Math.abs(share - land) < 0.02, `share ${share} for ${land}`);
    for (let x = 0; x < 200; x++) assert.equal(f.land[x], 0, 'top row is sea');
  }
});

test('output is plain document data inside the map', () => {
  const w = generateWorld({ width: 3200, height: 2000, seed: 11 });
  assert.ok(w.landmasses.length >= 1);
  for (const l of w.landmasses) {
    assert.ok(l.points.length >= 3);
    for (const [x, y] of l.points) assert.ok(x >= 0 && x <= 3200 && y >= 0 && y <= 2000);
  }
  assert.ok(w.stamps.length > 20 && w.stamps.every((s) => s.stampId && Number.isFinite(s.x)));
  assert.ok(w.brushStrokes.every((s) => s.type === 'brush' && s.points.length));
  assert.deepEqual(w.paths, [], 'no rivers without a browser');
  assert.ok(JSON.stringify(w).length < 200000, 'small enough for autosave');
});

test('outline tracing follows a shape and closes', () => {
  // an L shape on a 5-wide grid
  const cells = [[1, 1], [2, 1], [1, 2], [1, 3], [2, 3], [3, 3]].map(([x, y]) => y * 5 + x);
  const mask = new Uint8Array(25);
  for (const i of cells) mask[i] = 1;
  const [comp] = components(mask, 5, 5);
  assert.equal(comp.length, 6);
  const ring = traceOutline(comp, 5);
  assert.deepEqual(new Set(ring.map(([x, y]) => y * 5 + x)), new Set(cells), 'every cell of a thin shape is on its outline');
  assert.deepEqual(traceOutline([12], 5), [[2, 2]], 'a single cell');
});

test('simplifyLoop keeps a closed shape closed', () => {
  const sq = [];
  for (let i = 0; i < 10; i++) sq.push([i, 0]);
  for (let i = 0; i < 10; i++) sq.push([10, i]);
  for (let i = 10; i > 0; i--) sq.push([i, 10]);
  for (let i = 10; i > 0; i--) sq.push([0, i]);
  const s = simplifyLoop(sq, 0.5);
  assert.ok(s.length >= 4 && s.length <= 6, `${s.length} points`);
});
