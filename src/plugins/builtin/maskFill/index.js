// Mask fill: a paint bucket for the landmass mask. Clicking water fills the enclosed water with land (Add Land mode);
// clicking land fills that landmass with water (Carve Water mode). The region is rasterised and stored as row runs.
import { makeLayer, drawLandMask } from '../../../engine/renderer.js';

/**
 * Runs [y, x0, x1] (cells, inclusive) of the 4-connected region around (sx, sy) whose value equals grid[sy*w+sx].
 * ponytail: scanline-free stack flood, O(cells); fine up to the ~1.5 M cell grid used here.
 */
export function floodRuns(grid, w, h, sx, sy) {
  const want = grid[sy * w + sx];
  const seen = new Uint8Array(w * h);
  const stack = [sy * w + sx];
  seen[sy * w + sx] = 1;
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i - x) / w;
    if (x > 0 && !seen[i - 1] && grid[i - 1] === want) { seen[i - 1] = 1; stack.push(i - 1); }
    if (x < w - 1 && !seen[i + 1] && grid[i + 1] === want) { seen[i + 1] = 1; stack.push(i + 1); }
    if (y > 0 && !seen[i - w] && grid[i - w] === want) { seen[i - w] = 1; stack.push(i - w); }
    if (y < h - 1 && !seen[i + w] && grid[i + w] === want) { seen[i + w] = 1; stack.push(i + w); }
  }
  const runs = [];
  for (let y = 0; y < h; y++) {
    let x0 = -1;
    for (let x = 0; x <= w; x++) {
      const on = x < w && seen[y * w + x];
      if (on && x0 < 0) x0 = x;
      else if (!on && x0 >= 0) { runs.push([y, x0, x - 1]); x0 = -1; }
    }
  }
  return runs;
}

/** A mask stroke filling the region under (x, y) with `mode` ('land' | 'water'), or null if it already is that. */
export function maskFillStroke(width, height, landmasses, brushStrokes, x, y, mode) {
  const cell = Math.max(2, Math.round(Math.max(width, height) / 1500));
  const { c, g } = makeLayer(width, height, 1 / cell);
  drawLandMask(g, landmasses, brushStrokes);
  const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const w = c.width, h = c.height;
  const grid = new Uint8Array(w * h);
  for (let i = 0; i < grid.length; i++) grid[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  const sx = Math.min(w - 1, Math.max(0, Math.floor(x / cell))), sy = Math.min(h - 1, Math.max(0, Math.floor(y / cell)));
  if (grid[sy * w + sx] === (mode === 'land' ? 1 : 0)) return null;
  const runs = floodRuns(grid, w, h, sx, sy);
  // a few outline points so the eraser can still find the fill
  const points = runs.filter((_, i) => i % 8 === 0).flatMap(([ry, a, b]) => [{ x: a * cell, y: ry * cell }, { x: (b + 1) * cell, y: ry * cell }]);
  return { id: 'mask_' + Date.now(), type: 'mask', mode, shape: 'fill', cell, runs, size: cell * 2, opacity: 1, points };
}
