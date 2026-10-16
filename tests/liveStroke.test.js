import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, withLiveStroke } from '../src/engine/renderer.js';

const landDeps = (p) => p.items.find((i) => i.name === 'land').parts[0].deps;

test('live stroke changes the land cache key per frame and restores the committed key after', () => {
  const strokes = [{ id: 'a', points: [{ x: 1, y: 1 }] }];
  const base = { width: 100, height: 100, brushStrokes: strokes };
  const committed = landDeps(buildPlan(base));
  const f1 = landDeps(buildPlan({ ...base, landStroke: { id: 'b', points: [] } }));
  const f2 = landDeps(buildPlan({ ...base, landStroke: { id: 'b', points: [] } }));
  assert.notEqual(f1[1], committed[1]);
  assert.notEqual(f1[1], f2[1]);
  assert.equal(landDeps(buildPlan(base))[1], committed[1]);
  assert.equal(withLiveStroke(strokes, null), strokes);
  assert.equal(strokes.length, 1);
});
