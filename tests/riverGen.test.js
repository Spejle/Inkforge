import test from 'node:test';
import assert from 'node:assert/strict';
import { routeRiver, shapeRiver } from '../src/plugins/builtin/riverGen/flow.js';

// an oval island, 200 x 120 cells, like a 1920 x 1080 map at 5 px a cell
const W = 200, H = 120;
const island = () => {
  const land = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) land[y * W + x] = ((x - 100) / 90) ** 2 + ((y - 60) / 50) ** 2 < 1 ? 1 : 0;
  return land;
};
const length = (p) => p.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const segsCross = ([a, b], [c, d]) => {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};

test('a river from inland reaches the sea, winds, and is the same for the same seed', () => {
  const land = island();
  const cells = routeRiver(land, W, H, 100, 60, { seed: 3 });
  assert.ok(cells && cells.length > 10);
  const [ex, ey] = cells[cells.length - 1];
  assert.equal(land[ey * W + ex], 0, 'ends in the sea');
  const line = shapeRiver(cells, 3);
  const sinuosity = length(line) / Math.hypot(line[0][0] - ex, line[0][1] - ey);
  console.log('sinuosity', sinuosity.toFixed(2), 'points', line.length);
  assert.ok(sinuosity > 1.1 && sinuosity < 2, `sinuosity ${sinuosity}`);
  assert.deepEqual(routeRiver(land, W, H, 100, 60, { seed: 3 }), cells);
  assert.equal(routeRiver(land, W, H, 2, 2, { seed: 3 }), null, 'water gives none');
});

test('a river beside an existing one flows into it and never crosses it', () => {
  const land = island(), river = new Uint8Array(W * H);
  const existing = [];
  for (let x = 30; x <= 170; x++) { const y = 75 + Math.round(4 * Math.sin(x / 9)); river[y * W + x] = 1; river[(y + 1) * W + x] = 1; existing.push([x, y]); }
  const cells = routeRiver(land, W, H, 100, 62, { seed: 5, river });
  const [ex, ey] = cells[cells.length - 1];
  assert.equal(river[ey * W + ex], 1, 'ends on the river');
  assert.ok(cells.slice(0, -1).every(([x, y]) => !river[y * W + x]), 'touches it only at the end');
  const line = shapeRiver(cells, 5);
  for (let i = 0; i < line.length - 2; i++) for (let k = 0; k < existing.length - 1; k++) {
    assert.ok(!segsCross([line[i], line[i + 1]], [existing[k], existing[k + 1]]), 'no crossing');
  }
});

test('a river routes around high ground', () => {
  const land = island(), high = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 100, y - 85) < 12) high[y * W + x] = 1;
  for (const seed of [1, 2, 3, 4]) {
    const cells = routeRiver(land, W, H, 100, 68, { seed, high });
    const inside = cells.filter(([x, y]) => high[y * W + x] > 0).length;
    assert.equal(inside, 0, `seed ${seed}: ${inside} cells on the mountain`);
  }
});

test('the river never crosses itself and routing is fast', () => {
  const land = island();
  const t = performance.now();
  for (let s = 1; s <= 10; s++) {
    const line = shapeRiver(routeRiver(land, W, H, 40 + s * 12, 40 + (s % 3) * 15, { seed: s }), s);
    for (let i = 0; i < line.length - 1; i++) for (let k = i + 2; k < line.length - 1; k++) assert.ok(!segsCross([line[i], line[i + 1]], [line[k], line[k + 1]]), `seed ${s} self-crossing`);
  }
  const ms = (performance.now() - t) / 10;
  console.log('ms per river', ms.toFixed(1));
  assert.ok(ms < 150);
});
