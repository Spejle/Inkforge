import test from 'node:test';
import assert from 'node:assert/strict';
import { compactFog } from '../src/plugins/builtin/fog/index.js';
import { sanitizeFog, sanitizeProject } from '../src/utils/importGuard.js';

test('sanitizeFog keeps only well-formed strokes', () => {
  const f = sanitizeFog({
    enabled: 1,
    strokes: [
      { mode: 'reveal', size: 40, points: [[1, 2], [3, 4]] },
      { mode: 'evil', size: 1e9, points: [[1, 2], ['x', 3], null] },
      { mode: 'hide', all: true, junk: 'x' },
      { mode: 'reveal', points: [] },
      'nope'
    ]
  });
  assert.deepEqual(f, {
    enabled: true,
    strokes: [
      { mode: 'reveal', size: 40, points: [[1, 2], [3, 4]] },
      { mode: 'reveal', size: 2000, points: [[1, 2]] },
      { mode: 'hide', all: true }
    ]
  });
});

test('old projects without fog load with fog off', () => {
  assert.deepEqual(sanitizeProject({}).fog, { enabled: false, strokes: [] });
  assert.deepEqual(sanitizeFog('x'), { enabled: false, strokes: [] });
});

test('strokes before the last reveal/hide all are dropped from drawing', () => {
  const a = { mode: 'reveal', size: 10, points: [[0, 0]] };
  const all = { mode: 'hide', all: true };
  const b = { mode: 'reveal', size: 10, points: [[5, 5]] };
  assert.deepEqual(compactFog([a, all, b]), [all, b]);
  assert.deepEqual(compactFog([a, b]), [a, b]);
});
