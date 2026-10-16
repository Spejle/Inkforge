import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getGridLines,
  getHexVertices,
  getRoughPolygonPoints,
  getWavyStrokePoints,
  scaleBrushSizeForPreview
} from '../src/utils/previews.js';

test('getHexVertices returns 6 vertices equidistant from center', () => {
  const cx = 50;
  const cy = 50;
  const r = 20;

  const flatVertices = getHexVertices(cx, cy, r, 'flat');
  assert.equal(flatVertices.length, 6, 'flat hex has 6 vertices');

  // Verify distance from center is exactly r for all vertices
  for (const [x, y] of flatVertices) {
    const dist = Math.hypot(x - cx, y - cy);
    assert.ok(Math.abs(dist - r) < 1e-5, `vertex (${x}, ${y}) is distance ${r} from center`);
  }

  // First flat vertex starts at angle 0 (x = cx + r, y = cy)
  assert.ok(Math.abs(flatVertices[0][0] - (cx + r)) < 1e-5);
  assert.ok(Math.abs(flatVertices[0][1] - cy) < 1e-5);

  const pointyVertices = getHexVertices(cx, cy, r, 'pointy');
  assert.equal(pointyVertices.length, 6, 'pointy hex has 6 vertices');

  // First pointy vertex starts at angle PI/6
  const expectedX = cx + r * Math.cos(Math.PI / 6);
  const expectedY = cy + r * Math.sin(Math.PI / 6);
  assert.ok(Math.abs(pointyVertices[0][0] - expectedX) < 1e-5);
  assert.ok(Math.abs(pointyVertices[0][1] - expectedY) < 1e-5);
});

test('getGridLines produces valid geometry for all grid types', () => {
  const w = 64;
  const h = 44;

  // 1. Square grid
  const squareLines = getGridLines(w, h, 'square', { size: 16 });
  assert.ok(squareLines.length >= 6, 'contains vertical and horizontal lines');
  // Check that every line has start and end points spanning bounds
  for (const line of squareLines) {
    assert.equal(line.length, 2, 'line segment has 2 points');
    const [p1, p2] = line;
    const isVertical = Math.abs(p1[0] - p2[0]) < 1e-5;
    const isHorizontal = Math.abs(p1[1] - p2[1]) < 1e-5;
    assert.ok(isVertical || isHorizontal, 'line is axis-aligned');
  }

  // 2. Isometric grid
  const isoLines = getGridLines(w, h, 'isometric', { size: 16 });
  assert.ok(isoLines.length >= 4, 'contains isometric diagonals');
  for (const line of isoLines) {
    assert.equal(line.length, 2, 'isometric segment has 2 points');
    assert.equal(line[0][1], 0, 'starts at y = 0');
    assert.equal(line[1][1], h, 'ends at y = h');
  }

  // 3. Flat hex grid
  const flatHexes = getGridLines(w, h, 'hex_flat', { size: 12 });
  assert.ok(flatHexes.length >= 3, 'contains several hex cells');
  for (const cell of flatHexes) {
    assert.equal(cell.length, 6, 'each hex cell has 6 vertices');
  }

  // 4. Pointy hex grid
  const pointyHexes = getGridLines(w, h, 'hex_pointy', { size: 12 });
  assert.ok(pointyHexes.length >= 3, 'contains several pointy hex cells');
  for (const cell of pointyHexes) {
    assert.equal(cell.length, 6, 'each hex cell has 6 vertices');
  }
});

test('getRoughPolygonPoints creates fractal perturbed polygon vertices', () => {
  const cx = 32;
  const cy = 22;
  const r = 14;

  // Zero roughness should produce regular polygon
  const smooth = getRoughPolygonPoints(cx, cy, r, 0, 10);
  assert.equal(smooth.length, 10, 'has 10 vertices');
  for (const [x, y] of smooth) {
    const dist = Math.hypot(x - cx, y - cy);
    assert.ok(Math.abs(dist - r) < 1e-5, 'zero roughness radius is constant');
  }

  // With roughness > 0, points are perturbed within expected fractal bounds
  const rough = getRoughPolygonPoints(cx, cy, r, 0.6, 12);
  assert.equal(rough.length, 12, 'has 12 vertices');
  const distances = rough.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const minExpected = r * (1 - 0.4 * 0.6);
  const maxExpected = r * (1 + 0.4 * 0.6);
  for (const d of distances) {
    assert.ok(d >= minExpected - 1e-5 && d <= maxExpected + 1e-5, 'radius within noise bounds');
  }
  // Not all points are equal (perturbation occurred)
  const isVarying = distances.some((d) => Math.abs(d - r) > 0.01);
  assert.ok(isVarying, 'points vary according to pseudo noise');
});

test('getWavyStrokePoints creates smooth sine wave within bounds', () => {
  const w = 64;
  const h = 44;
  const count = 20;
  const margin = 8;

  const points = getWavyStrokePoints(w, h, count, margin);
  assert.equal(points.length, count, 'produces requested point count');

  // Starts at margin and ends at w - margin
  assert.ok(Math.abs(points[0].x - margin) < 1e-5, 'starts at margin');
  assert.ok(Math.abs(points[points.length - 1].x - (w - margin)) < 1e-5, 'ends at w - margin');

  // Monotonically increasing in X
  for (let i = 1; i < points.length; i++) {
    assert.ok(points[i].x > points[i - 1].x, 'x coordinates increase monotonically');
  }

  // Y values remain within canvas height bounds
  const midY = h / 2;
  const amp = h * 0.18;
  for (const pt of points) {
    assert.ok(pt.y >= midY - amp - 1e-5 && pt.y <= midY + amp + 1e-5, 'y within amplitude bounds');
  }
});

test('scaleBrushSizeForPreview clamps and scales proportionally', () => {
  const h = 44;
  const minR = scaleBrushSizeForPreview(1, h);
  const midR = scaleBrushSizeForPreview(40, h);
  const maxR = scaleBrushSizeForPreview(500, h);

  assert.ok(minR >= 3, 'minimum radius is >= 3');
  assert.ok(maxR <= h * 0.38, 'maximum radius is <= h * 0.38');
  assert.ok(minR <= midR && midR <= maxR, 'radii scale monotonically with size');

  // Handles undefined/null gracefully
  const defaultR = scaleBrushSizeForPreview(undefined, h);
  assert.ok(defaultR > 0 && defaultR <= h * 0.38, 'default size returns valid radius');
});
