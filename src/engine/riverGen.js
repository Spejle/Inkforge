// River generation: from a source point, flow downhill to the sea. There is no heightmap, so "height" is the distance
// from the coast (inland is high) plus smooth noise, which is what makes the course meander instead of running straight.

/** Distance of every land cell to the nearest water cell, in cells (two-pass chamfer). land: Uint8Array of w*h, 1 = land. */
export function coastDistance(land, w, h) {
  const d = new Float32Array(w * h);
  const BIG = 1e6;
  for (let i = 0; i < d.length; i++) d[i] = land[i] ? BIG : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]); // outside the map counts as sea
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (d[i]) d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    if (d[i]) d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
  }
  return d;
}

function noise(x, y, seed) {
  const hash = (i, j) => { let n = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296 * 2 - 1; };
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * s(fx);
  const b = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * s(fx);
  return a + (b - a) * s(fy);
}

/**
 * Course of a river from (sx, sy) in cell units, as [[x, y], ...] ending at the coast, or null when the source is not
 * on land. Descends the coast-distance field, turning at most 50 degrees a step.
 */
export function flowRiver(dist, w, h, sx, sy, seed = 1) {
  const sample = (x, y) => {
    const cx = Math.min(w - 1.001, Math.max(0, x)), cy = Math.min(h - 1.001, Math.max(0, y));
    const x0 = Math.floor(cx), y0 = Math.floor(cy), fx = cx - x0, fy = cy - y0;
    const v = (i, j) => dist[j * w + i];
    return (v(x0, y0) * (1 - fx) + v(x0 + 1, y0) * fx) * (1 - fy) + (v(x0, y0 + 1) * (1 - fx) + v(x0 + 1, y0 + 1) * fx) * fy;
  };
  const height = (x, y) => sample(x, y) + 3 * noise(x / 7, y / 7, seed) + 1.2 * noise(x / 3, y / 3, seed + 7);
  if (sample(sx, sy) < 1) return null;
  let x = sx, y = sy, heading = null;
  const pts = [[x, y]];
  for (let step = 0; step < 2000; step++) {
    let best = null;
    for (let k = -4; k <= 4; k++) {
      const a = heading === null ? (k * Math.PI) / 4 : heading + (k * 0.22);
      const nx = x + Math.cos(a), ny = y + Math.sin(a);
      const score = height(nx, ny) + (heading === null ? 0 : Math.abs(k) * 0.15);
      if (!best || score < best.score) best = { a, nx, ny, score };
    }
    if (heading === null) { // first step: head for the nearest coast, whatever the noise says
      best = null;
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8, nx = x + Math.cos(a) * 2, ny = y + Math.sin(a) * 2;
        const score = sample(nx, ny);
        if (!best || score < best.score) best = { a, nx: x + Math.cos(a), ny: y + Math.sin(a), score };
      }
    }
    heading = best.a;
    x = best.nx;
    y = best.ny;
    pts.push([x, y]);
    if (sample(x, y) < 0.6 || x < 0 || y < 0 || x > w || y > h) return pts;
  }
  return pts.length > 8 ? pts : null; // wandered without reaching the sea: keep what we have
}
