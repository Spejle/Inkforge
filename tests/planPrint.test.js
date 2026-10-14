import test from 'node:test';
import assert from 'node:assert';
import { planPrint, PAPERS } from '../src/utils/printUtils.js';

test('planPrint: A4 portrait fit-to-one-page gives cols=1 rows=1', () => {
  const plan = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'fit',
    squareInches: 1,
    overlapMm: 0,
  });

  assert.strictEqual(plan.cols, 1, 'cols should be 1');
  assert.strictEqual(plan.rows, 1, 'rows should be 1');
  assert.strictEqual(plan.pages, 1, 'pages should be 1');
});

test('planPrint: 1920x1080 map (gridSize 60, squareInches 1, scaleMode "scale", overlapMm 0) matches hand calculation', () => {
  // Hand calculation:
  // Paper A4 portrait: pw=210, ph=297, margin=10mm -> printW=190, printH=277
  // pxPerMm = gridSize / (25.4 * squareInches) = 60 / 25.4 ~= 2.3622 px/mm
  // mapMmW = 1920 / (60 / 25.4) = 32 * 25.4 = 812.8 mm
  // mapMmH = 1080 / (60 / 25.4) = 18 * 25.4 = 457.2 mm
  // stepW = 190 - 0 = 190 mm, stepH = 277 - 0 = 277 mm
  // cols = ceil((812.8 - 0) / 190 - 1e-6) = ceil(4.27789...) = 5
  // rows = ceil((457.2 - 0) / 277 - 1e-6) = ceil(1.65054...) = 2
  // pages = cols * rows = 5 * 2 = 10
  const plan = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'scale',
    squareInches: 1,
    overlapMm: 0,
  });

  assert.strictEqual(plan.cols, 5, 'cols should be 5');
  assert.strictEqual(plan.rows, 2, 'rows should be 2');
  assert.strictEqual(plan.pages, 10, 'pages should be 10');
  assert.strictEqual(plan.printW, 190);
  assert.strictEqual(plan.printH, 277);
  assert.strictEqual(Math.round(plan.mapMmW * 10) / 10, 812.8);
  assert.strictEqual(Math.round(plan.mapMmH * 10) / 10, 457.2);
});

test('planPrint: overlap increases or keeps sheet count', () => {
  const basePlan = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'scale',
    squareInches: 1,
    overlapMm: 0,
  });

  const planSameSheets = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'scale',
    squareInches: 1,
    overlapMm: 10,
  });

  const planMoreSheets = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'scale',
    squareInches: 1,
    overlapMm: 35,
  });

  assert.strictEqual(basePlan.pages, 10, 'base sheet count is 10');
  assert.strictEqual(planSameSheets.pages, 10, '10mm overlap keeps sheet count at 10');
  assert.strictEqual(planMoreSheets.pages, 12, '35mm overlap increases sheet count to 12');
  assert.ok(planSameSheets.pages >= basePlan.pages, 'overlap should keep sheet count');
  assert.ok(planMoreSheets.pages >= basePlan.pages, 'overlap should increase sheet count');
});

test('planPrint: landscape swaps paper dims', () => {
  const portrait = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'fit',
    squareInches: 1,
    overlapMm: 0,
  });

  const landscape = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: true,
    scaleMode: 'fit',
    squareInches: 1,
    overlapMm: 0,
  });

  assert.strictEqual(portrait.pw, 210);
  assert.strictEqual(portrait.ph, 297);
  assert.strictEqual(landscape.pw, 297);
  assert.strictEqual(landscape.ph, 210);
  assert.strictEqual(landscape.pw, portrait.ph, 'landscape width should match portrait height');
  assert.strictEqual(landscape.ph, portrait.pw, 'landscape height should match portrait width');
  assert.strictEqual(landscape.printW, portrait.printH, 'landscape printW should match portrait printH');
  assert.strictEqual(landscape.printH, portrait.printW, 'landscape printH should match portrait printW');
});

test('planPrint: unknown paper falls back to A4', () => {
  const fallback = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'NonExistentPaperFormat',
    landscape: false,
    scaleMode: 'scale',
    squareInches: 1,
    overlapMm: 0,
  });

  const a4 = planPrint({
    mapWidth: 1920,
    mapHeight: 1080,
    gridSize: 60,
    paper: 'A4',
    landscape: false,
    scaleMode: 'scale',
    squareInches: 1,
    overlapMm: 0,
  });

  assert.strictEqual(fallback.pw, PAPERS.A4[0], 'fallback pw should be A4 width');
  assert.strictEqual(fallback.ph, PAPERS.A4[1], 'fallback ph should be A4 height');
  assert.strictEqual(fallback.pw, a4.pw, 'fallback pw should equal explicit A4 pw');
  assert.strictEqual(fallback.ph, a4.ph, 'fallback ph should equal explicit A4 ph');
  assert.strictEqual(fallback.printW, a4.printW, 'fallback printW should equal A4 printW');
  assert.strictEqual(fallback.printH, a4.printH, 'fallback printH should equal A4 printH');
  assert.strictEqual(fallback.cols, a4.cols);
  assert.strictEqual(fallback.rows, a4.rows);
  assert.strictEqual(fallback.pages, a4.pages);
});
