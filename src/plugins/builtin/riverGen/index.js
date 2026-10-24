// River generation: click on land and a river winds from there to the sea, or into an existing river.
import { hasLand, makeLayer, drawLandMask, stampAspect } from '../../../engine/renderer.js';
import { routeRiver, shapeRiver } from './flow.js';

const HIGH = /mountain|volcano|peak|hill|mesa|caldera/;

/** Marks the cells within r of the polyline pts (map px) in grid g. */
function stampLine(g, w, h, cell, pts, r) {
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (cell / 2)));
    for (let t = 0; t <= steps; t++) {
      const cx = (ax + ((bx - ax) * t) / steps) / cell, cy = (ay + ((by - ay) * t) / steps) / cell;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (x >= 0 && y >= 0 && x < w && y < h && Math.hypot(x - cx, y - cy) <= r) g[y * w + x] = 1;
      }
    }
  }
}

/** Nearest point to (x, y) on any of the polylines (map px). */
function nearestOn(lines, x, y) {
  let best = null, bd = Infinity;
  for (const pts of lines) for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
    const px = ax + t * dx, py = ay + t * dy, d = Math.hypot(px - x, py - y);
    if (d < bd) { bd = d; best = [px, py]; }
  }
  return best;
}

/**
 * A generated river { points, joins } from (x, y) in map px, ending at the sea or on an existing river (joins: true;
 * never crossing one), or null when (x, y) is not on land. Mountain-like stamps are routed around. options: { paths, stamps } from the map.
 */
export function generateRiver(width, height, landmasses, brushStrokes, x, y, seed, { paths = [], stamps = [] } = {}) {
  if (!hasLand(landmasses, brushStrokes)) return null;
  const cell = Math.max(4, Math.round(Math.max(width, height) / 400));
  const { c, g } = makeLayer(width, height, 1 / cell);
  drawLandMask(g, landmasses, brushStrokes);
  const w = c.width, h = c.height;
  const px = c.getContext('2d').getImageData(0, 0, w, h).data;
  const land = new Uint8Array(w * h);
  for (let i = 0; i < land.length; i++) land[i] = px[i * 4 + 3] > 127 ? 1 : 0;

  const rivers = paths.filter((p) => p.type === 'river' && Array.isArray(p.points) && p.points.length > 1).map((p) => p.points);
  const river = new Uint8Array(w * h);
  for (const pts of rivers) stampLine(river, w, h, cell, pts, 0.8);

  const high = new Float32Array(w * h);
  for (const s of stamps) {
    if (!HIGH.test(s.stampId || '')) continue;
    // the drawn sprite is 80*scale px high, centred on (x, y) or standing on it (anchor 'base')
    const H = 80 * (s.scale || 1), r = (0.45 * H * Math.max(1, stampAspect(s))) / cell;
    const cx = s.x / cell, cy = (s.y - (s.anchor === 'base' ? H / 2 : 0)) / cell;
    for (let yy = Math.floor(cy - 1.6 * r); yy <= Math.ceil(cy + 1.6 * r); yy++) for (let xx = Math.floor(cx - 1.6 * r); xx <= Math.ceil(cx + 1.6 * r); xx++) {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const d = Math.hypot(xx - cx, yy - cy) / r;
      const v = d < 1 ? 1 : d < 1.6 ? 1 - (d - 1) / 0.6 : 0;
      if (v > high[yy * w + xx]) high[yy * w + xx] = v;
    }
  }

  const cells = routeRiver(land, w, h, x / cell, y / cell, { seed, river, high });
  if (!cells) return null;
  const onLand = (a, b) => land[Math.round(b) * w + Math.round(a)] === 1 && !river[Math.round(b) * w + Math.round(a)];
  const shaped = shapeRiver([[x / cell, y / cell], ...cells.slice(1)], seed, onLand).map(([a, b]) => [a * cell, b * cell]);
  const [ex, ey] = shaped[shaped.length - 1];
  const [lx, ly] = cells[cells.length - 1];
  const joins = river[ly * w + lx] === 1;
  if (joins) {
    const snap = nearestOn(rivers, ex, ey); // a confluence: end exactly on the other river
    if (snap) shaped[shaped.length - 1] = snap;
  } else {
    const [qx, qy] = shaped[shaped.length - 2]; // a mouth: run one cell on into the sea (drawing is clipped to land)
    const l = Math.hypot(ex - qx, ey - qy) || 1;
    shaped.push([ex + ((ex - qx) / l) * cell * 1.5, ey + ((ey - qy) / l) * cell * 1.5]);
  }
  return { points: shaped.map(([a, b]) => [Math.round(a), Math.round(b)]), joins };
}
