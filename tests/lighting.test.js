import test from 'node:test';
import assert from 'node:assert/strict';
import { visibilityPolygon } from '../src/engine/renderer.js';

test('a wall stops the light, open sides stay lit', () => {
  const open = visibilityPolygon(0, 0, 100, []);
  assert.ok(open.some(([x]) => x > 99));
  const walled = visibilityPolygon(0, 0, 100, [[[50, -100], [50, 100]]]);
  assert.ok(walled.every(([x]) => x <= 50.01), 'nothing lit beyond the wall');
  assert.ok(walled.some(([x]) => x < -99), 'the far side of the light is untouched');
});
