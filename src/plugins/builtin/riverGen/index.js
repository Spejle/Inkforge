// River generation: click on land and a river meanders from there to the nearest coast.
import { hasLand, makeLayer, drawLandMask } from '../../../engine/renderer.js';
import { coastDistance, flowRiver } from './flow.js';

/** A generated river from (x, y) to the nearest sea in map px, or null when (x, y) is not on land. */
export function generateRiver(width, height, landmasses, brushStrokes, x, y, seed) {
  if (!hasLand(landmasses, brushStrokes)) return null;
  const cell = Math.max(4, Math.round(Math.max(width, height) / 400));
  const { c, g } = makeLayer(width, height, 1 / cell);
  drawLandMask(g, landmasses, brushStrokes);
  const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const land = new Uint8Array(c.width * c.height);
  for (let i = 0; i < land.length; i++) land[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  const pts = flowRiver(coastDistance(land, c.width, c.height), c.width, c.height, x / cell, y / cell, seed);
  return pts && pts.map(([a, b]) => [Math.round(a * cell), Math.round(b * cell)]);
}
