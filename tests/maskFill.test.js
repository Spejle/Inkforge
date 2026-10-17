import { test } from 'node:test';
import assert from 'node:assert/strict';
import { floodRuns } from '../src/plugins/builtin/maskFill/index.js';

test('flood fill stays inside a closed ring and reports row runs', () => {
  // 5x5 with a land ring around the centre cell
  const g = Uint8Array.from([
    0, 0, 0, 0, 0,
    0, 1, 1, 1, 0,
    0, 1, 0, 1, 0,
    0, 1, 1, 1, 0,
    0, 0, 0, 0, 0
  ]);
  assert.deepEqual(floodRuns(g, 5, 5, 2, 2), [[2, 2, 2]]);
  const outside = floodRuns(g, 5, 5, 0, 0);
  assert.equal(outside.reduce((n, [, a, b]) => n + b - a + 1, 0), 16);
  assert.deepEqual(outside[1], [1, 0, 0]);
});
