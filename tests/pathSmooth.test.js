import test from 'node:test';
import assert from 'node:assert/strict';
import { simplifyPath } from '../src/utils/pathSmooth.js';

test('jitter on a straight line collapses to its endpoints', () => {
  const pts = Array.from({ length: 50 }, (_, i) => [i * 4, (i % 2) * 1]);
  assert.equal(simplifyPath(pts, 2.5).length, 2);
});
test('a real corner survives', () => {
  const pts = [[0, 0], [50, 0], [100, 0], [100, 50], [100, 100]];
  assert.deepEqual(simplifyPath(pts, 2.5), [[0, 0], [100, 0], [100, 100]]);
});
