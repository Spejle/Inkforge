import test from 'node:test';
import assert from 'node:assert/strict';
import { visibilityPolygon, blockerOutline } from '../src/engine/renderer.js';

test('a wall stops the light, open sides stay lit', () => {
  const open = visibilityPolygon(0, 0, 100, []);
  assert.ok(open.some(([x]) => x > 99));
  const walled = visibilityPolygon(0, 0, 100, [[[50, -100], [50, 100]]]);
  assert.ok(walled.every(([x]) => x <= 50.01), 'nothing lit beyond the wall');
  assert.ok(walled.some(([x]) => x < -99), 'the far side of the light is untouched');
});

test('a blocker outline is a closed polygon around the stamp (a box when there is no canvas to trace)', () => {
  const wall = blockerOutline({ stampId: 'dungeon_wall_block', x: 50, y: 50, scale: 1 });
  assert.deepEqual(wall[0], wall[wall.length - 1], 'closed');
  const ys = wall.map(([, y]) => y);
  assert.equal(Math.max(...ys) - Math.min(...ys), 80, 'spans the stamp height');
  const flipped = blockerOutline({ stampId: 'dungeon_wall_block', x: 50, y: 50, scale: 2, rotation: Math.PI / 2 });
  const xs = flipped.map(([x]) => x);
  assert.equal(Math.round(Math.max(...xs) - Math.min(...xs)), 160, 'scale and rotation apply');
});

test('non-blocking stamps return null', () => {
  const stairs = blockerOutline({ stampId: 'dungeon_stairs_down', x: 0, y: 0 });
  assert.equal(stairs, null, 'stairs do not block light');
});

