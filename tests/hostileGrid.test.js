import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProject } from '../src/utils/importGuard.js';
import { buildPlan } from '../src/engine/renderer.js';

// Counts drawing calls; the grid layer is pure path building, so this is enough to run it outside a browser.
function countingCtx() {
  let calls = 0;
  const ctx = new Proxy({}, { get: (_, k) => (k === 'calls' ? calls : () => { if (++calls > 2e6) throw new Error('grid drawing does not end'); }), set: () => true });
  return ctx;
}

test('a hostile grid size in a map file cannot hang the renderer', () => {
  for (const type of ['square', 'isometric', 'hex_pointy', 'hex_flat']) {
    for (const size of [-5, 0.0001, 1e-300, 'x', NaN, 1e9]) {
      const p = sanitizeProject({ title: 'g', width: 2000, height: 2000, grid: { enabled: true, type, size, offsetX: 1e308, opacity: 'a' } });
      assert.ok(p.grid.size >= 16 && p.grid.size <= 1000, `${type} ${size} -> ${p.grid.size}`);
      const grid = buildPlan({ width: p.width, height: p.height, grid: p.grid }).items.find((i) => i.name === 'grid');
      const ctx = countingCtx();
      grid.parts[0].draw(ctx);
      assert.ok(ctx.calls > 0);
    }
  }
  assert.equal(sanitizeProject({ grid: 'abc' }).grid, undefined);
  assert.equal(sanitizeProject({ grid: { size: 64, type: 'square' } }).grid.size, 64); // ordinary grids are unchanged
});
