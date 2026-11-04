import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, filterStable } from '../src/engine/renderer.js';

const sameDeps = (a, b) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const depsOf = (plan, name) => plan.items.find((i) => i.name === name).parts.flatMap((p) => p.deps);

const layerStyle = { c_a: { visible: true }, c_b: { visible: true } };
const layerVisibility = { background: true, land: true, paths: true, stamps: true, text: true, grid: false, atmosphere: false, c_a: true, c_b: true };
const landmasses = [], coastline = {};
const doc = () => ({
  width: 200, height: 200, layerStyle, layerVisibility, landmasses, coastline,
  stamps: [{ id: 's1', stampId: 'x', x: 1, y: 1 }, { id: 's2', stampId: 'x', x: 2, y: 2, layer: 'c_a' }, { id: 's3', stampId: 'x', x: 3, y: 3, layer: 'c_b' }],
  paths: [{ id: 'p1', type: 'road', points: [[0, 0], [5, 5]], layer: 'c_b' }],
  texts: [{ id: 't1', text: 'hi', x: 0, y: 0 }],
  brushStrokes: []
});

test('filterStable returns the previous array while the same objects pass the filter', () => {
  const memo = new Map();
  const a = { id: 1, k: 1 }, b = { id: 2, k: 2 };
  const first = filterStable(memo, 'x', [a, b], (o) => o.k === 1);
  assert.equal(filterStable(memo, 'x', [a, { ...b }], (o) => o.k === 1), first);
  assert.notEqual(filterStable(memo, 'x', [{ ...a }, b], (o) => o.k === 1), first);
  const all = [a, b];
  assert.equal(filterStable(memo, 'y', all, () => true), all); // nothing filtered out: the source itself
  assert.notEqual(filterStable(null, 'x', [a, b], (o) => o.k === 1), first); // no memo: plain filter
});

test('moving a stamp only changes the cache key of the layer that holds it', () => {
  const memo = new Map();
  const d = doc();
  const before = buildPlan({ ...d, memo });
  const stamps = d.stamps.map((s) => (s.id === 's2' ? { ...s, x: 50 } : s));
  const after = buildPlan({ ...d, stamps, memo });
  assert.ok(!sameDeps(depsOf(before, 'c_a'), depsOf(after, 'c_a')));
  for (const name of ['stamps', 'c_b', 'text', 'paths', 'land']) assert.ok(sameDeps(depsOf(before, name), depsOf(after, name)), name);
});

test('selection only repaints the layer the selected object is on', () => {
  const memo = new Map();
  const d = doc();
  const before = buildPlan({ ...d, memo });
  const after = buildPlan({ ...d, memo, selectedStampId: 's3' });
  assert.ok(!sameDeps(depsOf(before, 'c_b'), depsOf(after, 'c_b')));
  for (const name of ['stamps', 'c_a']) assert.ok(sameDeps(depsOf(before, name), depsOf(after, name)), name);
});

test('biome brush strokes do not repaint paths; mask strokes repaint layers with rivers', () => {
  const memo = new Map();
  const d = { ...doc(), paths: [{ id: 'r', type: 'river', points: [[0, 0], [9, 9]] }] };
  const before = buildPlan({ ...d, memo });
  const brushed = buildPlan({ ...d, memo, brushStrokes: [{ id: 'b', type: 'brush', points: [{ x: 1, y: 1 }] }] });
  assert.ok(sameDeps(depsOf(before, 'paths'), depsOf(brushed, 'paths')));
  const masked = buildPlan({ ...d, memo, brushStrokes: [{ id: 'm', type: 'mask', mode: 'land', points: [{ x: 1, y: 1 }] }] });
  assert.ok(!sameDeps(depsOf(before, 'paths'), depsOf(masked, 'paths')));
});
