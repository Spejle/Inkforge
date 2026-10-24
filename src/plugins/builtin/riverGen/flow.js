// River generation, in grid cells. Two stages: ROUTE finds where the river goes (the cheapest way from the source to
// the sea or to an existing river over a noisy cost field, so it bends through "valleys", goes around mountains and
// merges into rivers instead of crossing them); SHAPE turns that jaggy cell path into a smooth, gently meandering line.

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

/** Smooth value noise in [0, 1]. */
function noise(x, y, seed) {
  const hash = (i, j) => { let n = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * s(fx);
  const b = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * s(fx);
  return a + (b - a) * s(fy);
}

const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

/**
 * Cell path [[x, y], ...] from (sx, sy) to the first sea or `river` cell, or null when the source is not open land.
 * Dijkstra from every target cell outwards, stopped once the source is reached; a step costs its length times
 * 1 + 4 * noise (valleys) + 40 * high (mountain stamps), so routes bend, avoid peaks, and converge into a tree.
 * land: 1 = land; river: 1 = existing river (optional); high: 0..1 per cell (optional).
 */
export function routeRiver(land, w, h, sx, sy, { seed = 1, river = null, high = null } = {}) {
  sx = Math.round(sx); sy = Math.round(sy);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return null;
  const src = sy * w + sx;
  if (!land[src] || (river && river[src])) return null;
  const isTarget = (i) => !land[i] || (river && river[i]);
  const n = w * h;
  const cost = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    cost[i] = 1 + 4 * (0.65 * noise(x / 30, y / 30, seed) + 0.35 * noise(x / 10, y / 10, seed + 11)) + (high ? 40 * high[i] : 0);
  }
  const dist = new Float64Array(n).fill(Infinity);
  const next = new Int32Array(n).fill(-1); // downstream neighbour
  // binary heap of (key, cell); a cell may be in it several times, stale entries are skipped when popped
  const hk = new Float64Array(n * 8), hv = new Int32Array(n * 8);
  let size = 0;
  const push = (i) => {
    const key = dist[i];
    let k = size++;
    while (k > 0) { const p = (k - 1) >> 1; if (hk[p] <= key) break; hk[k] = hk[p]; hv[k] = hv[p]; k = p; }
    hk[k] = key; hv[k] = i;
  };
  const pop = () => {
    const top = hv[0], key = hk[--size], val = hv[size];
    let k = 0;
    while (true) {
      let c = 2 * k + 1;
      if (c >= size) break;
      if (c + 1 < size && hk[c + 1] < hk[c]) c++;
      if (hk[c] >= key) break;
      hk[k] = hk[c]; hv[k] = hv[c]; k = c;
    }
    hk[k] = key; hv[k] = val;
    return top;
  };
  // seed with the targets that border land (inner sea cells can never be on a shortest path)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!isTarget(i)) continue;
    let edge = false;
    for (const [dx, dy] of NB) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && !isTarget(yy * w + xx)) { edge = true; break; }
    }
    if (edge) { dist[i] = 0; push(i); }
  }
  if (!size) { // no sea on the map at all: the map edge is the sea
    for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const i = y * w + x; if (dist[i]) { dist[i] = 0; push(i); } }
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const i = y * w + x; if (dist[i]) { dist[i] = 0; push(i); } }
  }
  const done = new Uint8Array(n);
  while (size) {
    const i = pop();
    if (done[i]) continue;
    done[i] = 1;
    if (i === src) break;
    const x = i % w, y = (i - x) / w;
    for (const [dx, dy, len] of NB) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const j = yy * w + xx;
      if (done[j] || isTarget(j)) continue;
      const d = dist[i] + len * (cost[i] + cost[j]) / 2;
      if (d < dist[j]) { dist[j] = d; next[j] = i; push(j); }
    }
  }
  if (!done[src]) return null;
  const out = [];
  for (let i = src; i >= 0; i = next[i]) {
    const x = i % w;
    out.push([x, (i - x) / w]);
    if (isTarget(i)) break;
  }
  return out;
}

const chaikin = (p) => {
  if (p.length < 3) return p;
  const out = [p[0]];
  for (let i = 0; i < p.length - 1; i++) {
    const [ax, ay] = p[i], [bx, by] = p[i + 1];
    out.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
  }
  out.push(p[p.length - 1]);
  return out;
};

/** Points every `step` along a polyline. */
function resample(p, step) {
  const out = [p[0]];
  let carry = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const [ax, ay] = p[i], [bx, by] = p[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= len) { out.push([ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len]); t += step; }
    carry = len - (t - step);
  }
  const last = p[p.length - 1], end = out[out.length - 1];
  if (Math.hypot(last[0] - end[0], last[1] - end[1]) > step * 0.3) out.push(last);
  else out[out.length - 1] = last;
  return out;
}

/**
 * The river line for a cell path: smoothed, then meandered sideways (wavelength 16-26 cells, amplitude growing to
 * ~3 cells downstream and fading out at both ends, so the source and the mouth or confluence stay put).
 * onLand(x, y) vetoes an offset that would leave the land.
 */
export function shapeRiver(cells, seed = 1, onLand = () => true) {
  if (!cells || cells.length < 2) return cells;
  let p = resample(chaikin(chaikin(chaikin(cells))), 1.5);
  const s = [0];
  for (let i = 1; i < p.length; i++) s.push(s[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const S = s[s.length - 1];
  const ease = (t) => Math.min(1, Math.max(0, t)) ** 2 * (3 - 2 * Math.min(1, Math.max(0, t)));
  const phase = noise(seed * 0.37, 5.1, seed) * Math.PI * 2;
  let theta = phase;
  p = p.map(([x, y], i) => {
    if (i === 0 || i === p.length - 1) return [x, y];
    const [ax, ay] = p[i - 1], [bx, by] = p[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    theta += ((2 * Math.PI) / (16 + 10 * noise(s[i] / 20, 0.5, seed + 3))) * (s[i] - s[i - 1]);
    const amp = (1 + 2.2 * (s[i] / S)) * ease(s[i] / 10) * ease((S - s[i]) / 8);
    const off = amp * Math.sin(theta);
    const q = [x + nx * off, y + ny * off];
    return onLand(q[0], q[1]) ? q : [x, y];
  });
  return chaikin(p);
}
