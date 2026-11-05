import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProject } from '../src/utils/importGuard.js';
import { drawSmoothPolygon, drawSmoothPolyline, drawFillRuns } from '../src/engine/renderer.js';
import { PRESET_MAPS } from '../src/engine/presetMaps.js';

const ctx = new Proxy({}, { get: () => () => {} });

test('wrongly typed points and runs in a map file cannot crash the renderer', () => {
  const p = sanitizeProject({
    title: 'bad geometry',
    landmasses: [{ id: 'a', points: 5 }, { id: 'b', points: [[1, 2], null, [3, 4], 'x', [5, 'y'], [6, 7], [8, 9]] }, { id: 'c', points: 'abcd' }],
    paths: [{ id: 'p', type: 'river', points: 7 }, { id: 'q', type: 'road', points: [[1, 2], { x: 1 }, [3, 4]] }],
    brushStrokes: [{ id: 's', type: 'mask', points: 'x' }, { id: 't', type: 'mask', shape: 'fill', runs: 5 }, { id: 'u', type: 'mask', points: [{ x: 1, y: 2 }, null, { x: 'a', y: 1 }] }]
  });
  assert.deepEqual(p.landmasses.map((l) => l.points.length), [0, 4, 0]);
  assert.deepEqual(p.paths.map((l) => l.points.length), [0, 2]);
  assert.deepEqual(p.brushStrokes.map((b) => b.points?.length ?? b.runs.length), [0, 0, 1]);
  for (const l of p.landmasses) drawSmoothPolygon(ctx, l.points);
  for (const x of p.paths) if (x.points.length >= 2) drawSmoothPolyline(ctx, x.points);
  for (const b of p.brushStrokes) if (b.runs) drawFillRuns(ctx, b);
});

test('the sample maps keep every point through the guard', () => {
  for (const m of PRESET_MAPS) {
    const p = sanitizeProject(m);
    for (const k of ['landmasses', 'paths', 'brushStrokes']) assert.deepEqual(p[k], m[k] || [], `${m.id} ${k}`);
  }
});
