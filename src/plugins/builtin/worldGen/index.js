// World generator: a seeded height field becomes ordinary map data (landmass polygons, biome brush strokes, mountain and
// tree stamps, rivers), so everything it makes can be edited, erased and undone like hand-made work, and the map still
// opens without this plugin.
import { simplifyPath } from '../../../utils/pathSmooth.js';
// rivers use the River generation plugin's router (bundled in a shared chunk: that plugin need not be installed)
import { generateRiver } from '../riverGen/index.js';

/** Small seeded PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fractal value noise sampler over [0,1]^2, seeded. */
function noise2(seed, octaves = 5) {
  const r = rng(seed);
  const N = 256, perm = new Uint8Array(N * 2), vals = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < N; i++) perm[N + i] = perm[i];
  const lattice = (x, y) => vals[perm[(perm[x & 255] + y) & 511]];
  const smooth = (t) => t * t * (3 - 2 * t);
  const value = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const a = lattice(xi, yi), b = lattice(xi + 1, yi), c = lattice(xi, yi + 1), d = lattice(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x, y, base = 3) => {
    let sum = 0, amp = 1, f = base, norm = 0;
    for (let o = 0; o < octaves; o++) { sum += value(x * f, y * f) * amp; norm += amp; amp *= 0.5; f *= 2; }
    return sum / norm;
  };
}

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Height field on a gw x gh grid, edges pushed under the sea, and the land mask at the height that makes `land` (0..1)
 * of the map land. Returns { gw, gh, height, land, sea }.
 */
export function heightField(gw, gh, seed, land = 0.35, { aspect = gw / gh } = {}) {
  const n = noise2(seed);
  const warp = noise2(seed + 101, 3);
  const height = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const u = x / gw, v = y / gh;
    // domain warp makes coastlines less blobby
    const wu = u + (warp(u, v, 2) - 0.5) * 0.25, wv = v + (warp(u + 5.2, v + 1.3, 2) - 0.5) * 0.25;
    let hgt = n(wu * aspect, wv, 2.2);
    const edge = Math.min(u, 1 - u, v, 1 - v) * 2; // 0 at the border, 1 at the centre
    hgt -= (1 - smoothstep(0, 0.35, edge)) * 0.6;
    height[y * gw + x] = hgt;
  }
  const sorted = Float32Array.from(height).sort();
  const sea = sorted[Math.min(sorted.length - 1, Math.floor((1 - land) * sorted.length))];
  const mask = new Uint8Array(gw * gh);
  for (let i = 0; i < mask.length; i++) mask[i] = height[i] > sea ? 1 : 0;
  return { gw, gh, height, land: mask, sea };
}

/** Connected land components (8-neighbour), as arrays of cell indices, largest first. */
export function components(mask, gw, gh) {
  const seen = new Uint8Array(mask.length), out = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    const comp = [], stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop();
      comp.push(c);
      const cx = c % gw, cy = (c / gw) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
        const j = y * gw + x;
        if (mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    out.push(comp);
  }
  return out.sort((a, b) => b.length - a.length);
}

const DIRS = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]]; // W NW N NE E SE S SW: clockwise

/** Outer boundary of one component (Moore-neighbour tracing), as grid cells [x, y] in order. */
export function traceOutline(comp, gw) {
  const set = new Set(comp);
  const start = Math.min(...comp); // top row, leftmost: the cell to its west is outside
  const at = (x, y) => x >= 0 && x < gw && set.has(y * gw + x);
  const sx = start % gw, sy = (start / gw) | 0;
  const out = [[sx, sy]];
  let cx = sx, cy = sy, back = 0, second = null;
  for (let guard = 0; guard < comp.length * 8 + 16; guard++) {
    let found = -1;
    for (let k = 0; k < 8; k++) {
      const d = (back + k) % 8;
      if (at(cx + DIRS[d][0], cy + DIRS[d][1])) { found = d; break; }
    }
    if (found < 0) break; // a single cell
    const pd = (found + 7) % 8; // the empty neighbour checked just before
    const nx = cx + DIRS[found][0], ny = cy + DIRS[found][1];
    const px = cx + DIRS[pd][0] - nx, py = cy + DIRS[pd][1] - ny;
    back = DIRS.findIndex(([a, b]) => a === px && b === py);
    if (back < 0) back = (found + 4) % 8;
    if (cx === sx && cy === sy && second && nx === second[0] && ny === second[1]) break;
    if (!second) second = [nx, ny];
    cx = nx; cy = ny;
    if (!(cx === sx && cy === sy)) out.push([cx, cy]);
  }
  return out;
}

/** Simplify a closed outline: split it at the point farthest from the first, simplify both halves (a loop whose ends
 * meet would collapse to a line otherwise). */
export function simplifyLoop(pts, eps) {
  let far = 0, best = -1;
  pts.forEach(([x, y], i) => { const d = Math.hypot(x - pts[0][0], y - pts[0][1]); if (d > best) { best = d; far = i; } });
  if (far === 0) return pts;
  const a = simplifyPath(pts.slice(0, far + 1), eps), b = simplifyPath([...pts.slice(far), pts[0]], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const BIOME_STAMPS = {
  forest_floor: ['tr_oak', 'tr_pine', 'tr_round', 'tr_spruce', 'tr_birch'],
  jungle: ['tr_palm', 'tr_palm_lean', 'tr_round'],
  savanna: ['tr_acacia', 'tr_baobab'],
  tundra: ['tr_snowy_pine', 'tr_snowy_spruce'],
  desert: ['cactus_saguaro'],
  grassland: ['tr_oak', 'tr_bush']
};
// trees per sample point by biome (fractions are chances)
const TREE_DENSITY = { forest_floor: 3, jungle: 3, savanna: 0.5, tundra: 1.2, desert: 0.12, grassland: 0.25, snow: 0 };

/** Climate: hot at the middle latitude, cold at the top and bottom, colder up high; moisture from its own noise. */
function biomeAt(t, m, hRel) {
  if (t < 0.16 || hRel > 0.9) return 'snow';
  if (t < 0.3) return 'tundra';
  if (t > 0.62 && m < 0.36) return 'desert';
  if (t > 0.55 && m < 0.48) return 'savanna';
  if (t > 0.68 && m > 0.6) return 'jungle';
  if (m > 0.52) return 'forest_floor';
  return 'grassland';
}

/**
 * A generated world as plain document data: { landmasses, brushStrokes, stamps, paths }.
 * options: width, height (map px), seed, land (0..1 share of land), mountains/forests (0..1 amount),
 * rivers (count; needs a browser, uses the river generator), climate ('world' spans poles to equator, 'region' is temperate).
 */
export function generateWorld({ width, height, seed = 1, land = 0.38, mountains = 0.5, forests = 0.5, rivers = 6, climate = 'world', riverRouter = typeof document === 'undefined' ? null : generateRiver }) {
  const cell = Math.max(6, Math.round(Math.max(width, height) / 220));
  const gw = Math.ceil(width / cell), gh = Math.ceil(height / cell);
  const field = heightField(gw, gh, seed, land, { aspect: width / height });
  const r = rng(seed * 7 + 3);
  const moisture = noise2(seed + 7, 4);
  const id = (p, i) => `${p}_${seed}_${i}`;

  // 1. landmasses: the outline of every island big enough to read, smoothed by the renderer's spline
  const minCells = Math.max(6, Math.round((gw * gh) / 4000));
  const comps = components(field.land, gw, gh).filter((c) => c.length >= minCells);
  const keep = new Uint8Array(gw * gh);
  for (const c of comps) for (const i of c) keep[i] = 1;
  const landmasses = comps.map((c, i) => {
    const pts = traceOutline(c, gw).map(([x, y]) => [(x + 0.5) * cell, (y + 0.5) * cell]);
    const simple = pts.length > 8 ? simplifyLoop(pts, cell * 0.45) : pts;
    return { id: id('land', i), biome: 'grassland', points: simple.map(([x, y]) => [Math.round(x), Math.round(y)]) };
  }).filter((l) => l.points.length >= 3);

  // height relative to the land (0 at the coast, 1 at the highest peak)
  let top = field.sea;
  for (let i = 0; i < keep.length; i++) if (keep[i] && field.height[i] > top) top = field.height[i];
  const hRel = (i) => (field.height[i] - field.sea) / Math.max(1e-6, top - field.sea);
  const temp = (x, y, i) => {
    const lat = y / gh;
    const base = climate === 'region' ? 0.55 + (0.5 - lat) * 0.2 : 1 - Math.abs(lat - 0.5) * 2;
    return base - hRel(i) * 0.35 + (moisture(x / gw + 3.1, y / gh + 7.7, 3) - 0.5) * 0.15;
  };

  // 2. biome strokes: a coarse sample grid, each row's runs of one biome become one soft brush stroke
  const step = Math.max(3, Math.round(80 / cell));
  const biomeOf = new Map(); // sample index -> biome
  const brushStrokes = [];
  let bi = 0;
  for (let y = Math.floor(step / 2); y < gh; y += step) {
    let run = null;
    const flush = () => {
      if (run && run.biome !== 'grassland') {
        brushStrokes.push({ id: id('bio', bi++), type: 'brush', target: 'foreground', biome: run.biome, size: Math.round(step * cell * (2.2 + r() * 0.8)), opacity: 0.8, softness: 0.9, blendMode: 'source-over', points: run.points });
      }
      run = null;
    };
    for (let x = Math.floor(step / 2); x < gw; x += step) {
      const i = y * gw + x;
      if (!keep[i]) { flush(); continue; }
      const b = biomeAt(temp(x, y, i), moisture(x / gw, y / gh, 3), hRel(i));
      biomeOf.set(i, b);
      if (!run || run.biome !== b) { flush(); run = { biome: b, points: [] }; }
      // jittered off the sample grid so patches read as organic, not tiled
      run.points.push({ x: Math.round((x + 0.5 + (r() - 0.5) * step * 0.8) * cell), y: Math.round((y + 0.5 + (r() - 0.5) * step * 0.8) * cell) });
    }
    flush();
  }

  // 3. mountains on the high ground, spaced apart; hills on the slopes below them
  const stamps = [];
  let si = 0;
  const place = (stampId, x, y, scale) => stamps.push({
    id: id('st', si++), stampId, x: Math.round(x), y: Math.round(y), scale: Number(scale.toFixed(2)), rotation: 0, zIndex: 0,
    seed: Math.floor(r() * 1e6), flipX: r() < 0.5, tone: Number((0.94 + r() * 0.12).toFixed(2))
  });
  const high = [];
  for (let i = 0; i < keep.length; i++) if (keep[i] && hRel(i) > 0.55) high.push(i);
  for (let i = high.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [high[i], high[j]] = [high[j], high[i]]; }
  const peaks = [];
  const minD = Math.max(width, height) / 32;
  const maxPeaks = Math.round(10 + 70 * mountains);
  for (const i of high) {
    if (peaks.length >= maxPeaks) break;
    const x = ((i % gw) + r()) * cell, y = (((i / gw) | 0) + r()) * cell, h = hRel(i);
    const need = h > 0.72 ? minD : minD * 1.3;
    if (peaks.some((p) => Math.hypot(p.x - x, p.y - y) < need)) continue;
    const cold = temp(i % gw, (i / gw) | 0, i) < 0.3;
    const id_ = h > 0.72 ? (cold ? 'mountain_snow_peak' : r() < 0.6 ? 'mountain_grand' : 'mountain_range') : 'hills_rolling';
    peaks.push({ x, y, h });
    place(id_, x, y, (h > 0.72 ? 1.1 : 0.9) * (0.8 + r() * 0.5) * Math.max(0.7, Math.min(1.6, width / 3200)));
  }

  // 4. trees by biome, a few per sample point, kept off the mountains
  const maxTrees = Math.round(60 + 340 * forests);
  let trees = 0;
  for (const [i, b] of biomeOf) {
    if (trees >= maxTrees) break;
    const kinds = BIOME_STAMPS[b];
    if (!kinds) continue;
    let n = TREE_DENSITY[b] * forests * 2;
    n = Math.floor(n) + (r() < n % 1 ? 1 : 0);
    for (let k = 0; k < n && trees < maxTrees; k++) {
      const x = ((i % gw) + (r() - 0.5) * step) * cell, y = (((i / gw) | 0) + (r() - 0.5) * step) * cell;
      const gi = Math.min(gh - 1, Math.max(0, Math.round(y / cell))) * gw + Math.min(gw - 1, Math.max(0, Math.round(x / cell)));
      if (!keep[gi] || peaks.some((p) => Math.hypot(p.x - x, p.y - y) < minD * 0.6)) continue;
      place(kinds[Math.floor(r() * kinds.length)], x, y, 0.55 + r() * 0.35);
      trees++;
    }
  }

  // 5. rivers from below the peaks to the sea (browser only: the router rasterises the land on a canvas)
  const paths = [];
  if (riverRouter && rivers > 0) {
    const sources = [...peaks].sort((a, b) => b.h - a.h);
    for (const p of sources) {
      if (paths.length >= rivers) break;
      const sx = p.x + (r() - 0.5) * minD * 0.8, sy = p.y + minD * 0.35;
      const gen = riverRouter(width, height, landmasses, [], sx, sy, Math.floor(r() * 1e5), { paths, stamps });
      if (!gen || gen.points.length < 6) continue;
      paths.push({ id: id('river', paths.length), type: 'river', color: '#2563eb', width: Math.round(Math.max(8, width / 280)), taper: gen.joins ? 'join' : true, points: simplifyPath(gen.points, 1.5) });
    }
  }

  return { landmasses, brushStrokes, stamps, paths };
}
