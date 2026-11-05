import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVttGeometry, vttResolution } from '../src/plugins/builtin/vttExport/index.js';

const grid = { size: 60, offsetX: 0, offsetY: 0 };

test('wall stamps become line-of-sight walls, doors stay portals', () => {
  const { lineOfSight } = buildVttGeometry({
    grid,
    stamps: [
      { id: 'a', stampId: 'dungeon_wall_block', x: 120, y: 120, scale: 1 },
      { id: 'b', stampId: 'dungeon_door_wooden', x: 300, y: 120, scale: 1 }
    ]
  });
  assert.equal(lineOfSight.length, 1, 'one wall, the door is a portal');
  const xs = lineOfSight[0].map((p) => p.x);
  assert.ok(Math.min(...xs) < 2 && Math.max(...xs) > 2, 'the ring surrounds the stamp at grid x = 2');
});

test('wall paths still export', () => {
  const { lineOfSight } = buildVttGeometry({ grid, paths: [{ type: 'wall', points: [[0, 0], [120, 0]] }] });
  assert.deepEqual(lineOfSight, [[{ x: 0, y: 0 }, { x: 2, y: 0 }]]);
});

test('a rotated door gets rotated portal bounds', () => {
  const door = (rotation) =>
    buildVttGeometry({ grid, stamps: [{ stampId: 'dungeon_door_wooden', x: 300, y: 300, scale: 1, rotation }] }).portals[0];
  const flat = door(0);
  assert.equal(flat.bounds[0].y, flat.bounds[1].y, 'unrotated door lies horizontally');
  const upright = door(Math.PI / 2);
  assert.ok(Math.abs(upright.bounds[0].x - upright.bounds[1].x) < 1e-3, 'a quarter turn stands it vertically');
  assert.ok(upright.bounds[0].y !== upright.bounds[1].y);
  assert.equal(upright.rotation, Number((Math.PI / 2).toFixed(3)));
});

test('grid offset moves the origin so VTT grid lines match ours', () => {
  const g = { size: 60, offsetX: 15, offsetY: 30 };
  const { origin, lineOfSight } = buildVttGeometry({ grid: g, paths: [{ type: 'wall', points: [[15, 30], [75, 30]] }] });
  assert.deepEqual(origin, { x: -0.25, y: -0.5 });
  assert.deepEqual(lineOfSight[0][0], { x: 0, y: 0 }, 'a point on a grid line lands on an integer');
});

test('resolution: map_size * pixels_per_grid is the image size, also off a whole number of cells', () => {
  // 1920 x 1080 with a 70 px grid is 27.43 x 15.43 cells; map_size used to be rounded to 27 x 15, so importers
  // squeezed the image into 1890 x 1050 px and it no longer lined up with the walls
  const r = vttResolution(1920, 1080, 70, 1, { x: 0, y: 0 });
  assert.equal(r.pixels_per_grid, 70);
  assert.ok(Math.abs(r.map_size.x * 70 - 1920) < 0.5 && Math.abs(r.map_size.y * 70 - 1080) < 0.5, JSON.stringify(r));
  const whole = vttResolution(1800, 1200, 60, 1, { x: 0, y: 0 });
  assert.deepEqual(whole.map_size, { x: 30, y: 20 });
});
