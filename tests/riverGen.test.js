import test from 'node:test';
import assert from 'node:assert/strict';
import { coastDistance, flowRiver } from '../src/plugins/builtin/riverGen/flow.js';

test('a river from the middle of an island reaches the sea; water gives none', () => {
  const w = 80, h = 80, land = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) land[y * w + x] = Math.hypot(x - 40, y - 40) < 30 ? 1 : 0;
  const d = coastDistance(land, w, h);
  const pts = flowRiver(d, w, h, 40, 40, 3);
  assert.ok(pts && pts.length > 10);
  const [ex, ey] = pts[pts.length - 1];
  assert.ok(Math.hypot(ex - 40, ey - 40) > 28, 'ends at the shore');
  assert.equal(flowRiver(d, w, h, 2, 2, 3), null);
});
