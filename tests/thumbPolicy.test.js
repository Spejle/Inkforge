import { test } from 'node:test';
import assert from 'node:assert/strict';
import { thumbDue, THUMB_EVERY_MS } from '../src/utils/thumbPolicy.js';

test('autosave reuses a recent thumbnail of the same map only', () => {
  const prev = { id: 'map_a', at: 1000 };
  assert.equal(thumbDue(prev, 'map_a', 1000 + THUMB_EVERY_MS - 1), false, 'same map, recent: reuse');
  assert.equal(thumbDue(prev, 'map_a', 1000 + THUMB_EVERY_MS + 1), true, 'same map, stale');
  // the bug: leaving map A to the menu took A's thumbnail, opening B autosaved B within 30 s with A's picture
  assert.equal(thumbDue(prev, 'map_b', 1001), true, 'another map never reuses it');
  assert.equal(thumbDue({ id: null, at: 0 }, 'map_a', 5), true, 'first save');
  assert.equal(thumbDue(prev, 'map_a', 1001, true), true, 'forced');
});

test("'cached' (page being hidden) reuses this map's thumbnail however old, never another map's", () => {
  const prev = { id: 'map_a', at: 1000 };
  assert.equal(thumbDue(prev, 'map_a', 1000 + 10 * THUMB_EVERY_MS, 'cached'), false);
  assert.equal(thumbDue(prev, 'map_b', 1001, 'cached'), true);
});
