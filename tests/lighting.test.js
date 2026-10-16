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

test('tree stamps block with an octagon (trunk + inner crown footprint)', () => {
  const tree = blockerOutline({ stampId: 'tree_pine', x: 100, y: 100, scale: 1 });
  assert.ok(tree, 'tree returns an outline');
  // Closed polyline of 8 segments has 9 points
  assert.equal(tree.length, 9, 'tree outline is an 8-sided polygon');
  // First and last points match to close the loop
  assert.deepEqual(tree[0], tree[8], 'polygon is closed');
  // Distance from center is circular/octagonal radius (scaled down by k = 0.45)
  for (let i = 0; i < 8; i++) {
    const [px, py] = tree[i];
    const dist = Math.hypot(px - 100, py - 100);
    assert.ok(dist < 25, 'radius reflects trunk and inner crown rather than entire canopy');
  }
});

test('pillar stamps block with a circular polygon', () => {
  const pillar = blockerOutline({ stampId: 'dungeon_pillar', x: 200, y: 200, scale: 1 });
  assert.ok(pillar, 'pillar returns an outline');
  // Closed polyline of 12 segments has 13 points (circle approximation)
  assert.equal(pillar.length, 13, 'pillar outline is a circular polygon');
  assert.deepEqual(pillar[0], pillar[12], 'polygon is closed');
  // All vertices should be equidistant from the center
  for (let i = 0; i < 12; i++) {
    const [px, py] = pillar[i];
    const dist = Math.hypot(px - 200, py - 200);
    assert.ok(Math.abs(dist - 40) < 0.001, 'vertices lie on a circle of radius 40');
  }
});

test('furniture, chests and walls keep box footprints', () => {
  const table = blockerOutline({ stampId: 'prop_table_tavern', x: 50, y: 50, scale: 1 });
  assert.ok(table, 'table returns an outline');
  assert.equal(table.length, 5, 'table outline is a 4-sided box (5 points closed)');
  assert.deepEqual(table[0], table[4]);

  const chest = blockerOutline({ stampId: 'prop_chest_treasure', x: 50, y: 50, scale: 1 });
  assert.ok(chest, 'chest returns an outline');
  assert.equal(chest.length, 5, 'chest outline is a 4-sided box');
  assert.deepEqual(chest[0], chest[4]);

  const wall = blockerOutline({ stampId: 'dungeon_wall_block', x: 50, y: 50, scale: 1 });
  assert.ok(wall, 'wall returns an outline');
  assert.equal(wall.length, 5, 'wall outline is a 4-sided box');
  assert.deepEqual(wall[0], wall[4]);
});

test('non-blocking stamps return null', () => {
  const stairs = blockerOutline({ stampId: 'dungeon_stairs_down', x: 0, y: 0 });
  assert.equal(stairs, null, 'stairs do not block light');
});
