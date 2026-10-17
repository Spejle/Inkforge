// Dynamic lighting: darkness over the map, campfires and braziers cut light into it, walls and solid stamps cast shadows.
import { getStampById } from '../../../engine/stampsCatalog.js';
import { stampAspect, layerScale, makeLayer } from '../../../engine/renderer.js';
import { simplifyPath } from '../../../utils/pathSmooth.js';
import { isFeatureOn } from '../../features.js';

/** Stamps that give light: campfires and braziers. Shared with the VTT export, so what you see is what Foundry gets. */
export const isLightStamp = (s) => /campfire|brazier/.test(s.stampId || '');
/** Light reach in map px: 6 grid squares at stamp scale 1. */
export const lightRange = (s, grid) => 6 * (grid?.size || 60) * (s.scale || 1);

// Stamps that stop light, by group: dungeon walls, pillars and doors, furniture, mountains and trees.
const BLOCKER_GROUP = /^(dungeon_(walls|pillars|doors)|prop_(tables|chests|storage|altars|shelves)|geo_mountains|tree_)/;
// What a light-blocking stamp really looks like from above: its drawn sprite, traced once at low resolution (the top and
// bottom opaque pixel of every column, so a tree casts a tree-shaped shadow and a crate a crate-shaped one). Cached in
// unit coordinates (0..1 across the sprite) so any scale, rotation or flip reuses it.
const outlineCache = new Map();
const BOX = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
function spriteOutline(def, s, aspect) {
  if (typeof document === 'undefined') return BOX;
  const key = [s.stampId, s.color, s.fill, s.seed, aspect.toFixed(2)].join('|');
  let o = outlineCache.get(key);
  if (o) return o;
  const H = 48, W = Math.max(8, Math.round(H * aspect));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  def.render(g, H, s.color, s.fill, s.seed);
  const px = g.getImageData(0, 0, W, H).data;
  const top = [], bot = [];
  for (let x = 0; x < W; x++) {
    let t = -1, b = -1;
    for (let y = 0; y < H; y++) if (px[(y * W + x) * 4 + 3] > 110) { if (t < 0) t = y; b = y; }
    if (t >= 0) { top.push([(x + 0.5) / W, t / H]); bot.push([(x + 0.5) / W, (b + 1) / H]); }
  }
  if (top.length < 2) o = BOX;
  else {
    const ring = [...simplifyPath(bot, 0.02), ...simplifyPath(top, 0.02).reverse()];
    ring.push(ring[0]);
    o = ring.length >= 4 ? ring : BOX;
  }
  outlineCache.set(key, o);
  if (outlineCache.size > 400) outlineCache.delete(outlineCache.keys().next().value);
  return o;
}

/** The footprint of a light-blocking stamp as a closed polyline in map px: the traced shape of its sprite. */
export function blockerOutline(s) {
  const def = getStampById(s.stampId);
  if (!def || !BLOCKER_GROUP.test(def.group || '')) return null;
  const aspect = stampAspect(s);
  const H = 80 * (s.scale || 1), W = H * aspect;
  const cos = Math.cos(s.rotation || 0), sin = Math.sin(s.rotation || 0);
  return spriteOutline(def, s, aspect).map(([a, b]) => {
    // the same frame renderStamps draws in: flip, then sprite corner at the origin (or its base at the origin)
    const u = (a - 0.5) * W * (s.flipX ? -1 : 1);
    const v = (b * H - (s.anchor === 'base' ? H : H / 2)) * (s.flipY ? -1 : 1);
    return [s.x + u * cos - v * sin, s.y + u * sin + v * cos];
  });
}

// Darkness needs the lights and walls, which live outside the atmosphere settings. The result is memoised so the Pixi
// view, which rebuilds its texture whenever the object changes, only does so when a light, a wall or a setting did.
let lightMemo = { a: null, s: null, p: null, g: null, out: null };
export function withLighting(a, stamps, paths, grid) {
  if (!(a.darkness > 0)) return a;
  if (!isFeatureOn('lighting')) return { ...a, darkness: 0 };
  const m = lightMemo;
  if (m.a === a && m.s === stamps && m.p === paths && m.g === grid) return m.out;
  const out = {
    ...a,
    lights: stamps.filter(isLightStamp).map((s) => ({ x: s.x, y: s.y, r: lightRange(s, grid) })),
    walls: paths.filter((p) => p.type === 'wall' && p.points && p.points.length > 1).map((p) => p.points),
    blocks: stamps.filter((s) => !isLightStamp(s)).map(blockerOutline).filter(Boolean)
  };
  lightMemo = { a, s: stamps, p: paths, g: grid, out };
  return out;
}

/** Visible region from (lx, ly) within r, as a polygon, given wall polylines: classic ray casting to every wall end. */
export function visibilityPolygon(lx, ly, r, walls) {
  const segs = [];
  const box = [[lx - r, ly - r], [lx + r, ly - r], [lx + r, ly + r], [lx - r, ly + r], [lx - r, ly - r]];
  const add = (pts) => {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      if (Math.max(ax, bx) < lx - r || Math.min(ax, bx) > lx + r || Math.max(ay, by) < ly - r || Math.min(ay, by) > ly + r) continue;
      segs.push([ax, ay, bx, by]);
    }
  };
  add(box);
  walls.forEach(add);
  const angles = [];
  for (const [ax, ay, bx, by] of segs) {
    for (const [px, py] of [[ax, ay], [bx, by]]) {
      const a = Math.atan2(py - ly, px - lx);
      angles.push(a - 0.0002, a, a + 0.0002);
    }
  }
  angles.sort((x, y) => x - y);
  const out = [];
  for (const a of angles) {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = Infinity;
    for (const [ax, ay, bx, by] of segs) {
      const ex = bx - ax, ey = by - ay;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((ax - lx) * ey - (ay - ly) * ex) / den; // distance along the ray
      const u = ((ax - lx) * dy - (ay - ly) * dx) / den; // position along the wall
      if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
    }
    if (best < Infinity) out.push([lx + dx * best, ly + dy * best]);
  }
  return out;
}

/** Night over the map with the lights cut through it; walls throw shadows. */
export function drawLighting(ctx, width, height, op) {
  const ls = layerScale(ctx, width, height);
  const { c, g } = makeLayer(width, height, ls);
  g.fillStyle = `rgba(8, 12, 34, ${op.darkness})`;
  g.fillRect(0, 0, width, height);

  const walls = op.walls || [];
  const blocks = op.blocks || [];
  const allOccluders = [...walls, ...blocks];
  const lights = op.lights || [];

  const directGlow = [];
  const ambGlow = [];

  for (const l of lights) {
    // 1. Ambient bounce illumination within the light radius:
    // Stopped by solid room walls (op.walls), but diffuse bounce fills around small objects (op.blocks).
    // This ensures cast shadows are translucent and darker than lit ground, but never pitch black.
    const wallPoly = walls.length > 0 ? visibilityPolygon(l.x, l.y, l.r, walls) : null;
    g.save();
    if (wallPoly && wallPoly.length >= 3) {
      g.beginPath();
      wallPoly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.clip();
    }
    g.globalCompositeOperation = 'destination-out';
    const ambCutGrad = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    ambCutGrad.addColorStop(0, 'rgba(0, 0, 0, 0.44)');
    ambCutGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.36)');
    ambCutGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
    ambCutGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.08)');
    ambCutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = ambCutGrad;
    g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    g.restore();

    ambGlow.push({ l, wallPoly });

    // 2. Direct light with soft penumbra widening with distance:
    // Sample the light emitter across its diameter (flame area light)
    const emitterR = Math.max(8, Math.min(22, l.r * 0.045));
    // Center sample (weight 1.5) + inner ring of 3 (weight 1.0) + outer ring of 4 (weight 1.0)
    const jitterSpecs = [
      { dx: 0, dy: 0, w: 1.5 },
      // Inner ring: radius 0.5 * emitterR
      { dx: emitterR * 0.5 * Math.cos(0), dy: emitterR * 0.5 * Math.sin(0), w: 1.0 },
      { dx: emitterR * 0.5 * Math.cos((2 * Math.PI) / 3), dy: emitterR * 0.5 * Math.sin((2 * Math.PI) / 3), w: 1.0 },
      { dx: emitterR * 0.5 * Math.cos((4 * Math.PI) / 3), dy: emitterR * 0.5 * Math.sin((4 * Math.PI) / 3), w: 1.0 },
      // Outer ring: radius 1.0 * emitterR (rotated by 45 degrees)
      { dx: emitterR * Math.cos(Math.PI / 4), dy: emitterR * Math.sin(Math.PI / 4), w: 1.0 },
      { dx: emitterR * Math.cos((3 * Math.PI) / 4), dy: emitterR * Math.sin((3 * Math.PI) / 4), w: 1.0 },
      { dx: emitterR * Math.cos((5 * Math.PI) / 4), dy: emitterR * Math.sin((5 * Math.PI) / 4), w: 1.0 },
      { dx: emitterR * Math.cos((7 * Math.PI) / 4), dy: emitterR * Math.sin((7 * Math.PI) / 4), w: 1.0 }
    ];
    const totalW = jitterSpecs.reduce((sum, s) => sum + s.w, 0);

    // Unified concentric radial gradient centered at (l.x, l.y) for both cut and warm glow
    const directCutGrad = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    directCutGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    directCutGrad.addColorStop(0.2, 'rgba(0, 0, 0, 0.92)');
    directCutGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.65)');
    directCutGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.32)');
    directCutGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.10)');
    directCutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    for (const spec of jitterSpecs) {
      const jx = l.x + spec.dx;
      const jy = l.y + spec.dy;
      const poly = visibilityPolygon(jx, jy, l.r, allOccluders);
      if (poly.length < 3) continue;

      const normW = spec.w / totalW;

      g.save();
      g.beginPath();
      poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.clip();
      g.globalCompositeOperation = 'destination-out';
      g.globalAlpha = normW * 0.76;
      g.fillStyle = directCutGrad;
      g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      g.restore();

      directGlow.push({ l, poly, normW });
    }
  }

  // Draw darkness layer onto destination
  ctx.drawImage(c, 0, 0, width, height);

  // Warm firelight tint in harmony with the lighting cuts
  if (lights.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // A. Ambient bounce warmth inside the lit space
    for (const { l, wallPoly } of ambGlow) {
      ctx.save();
      if (wallPoly && wallPoly.length >= 3) {
        ctx.beginPath();
        wallPoly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.clip();
      }
      const ambWarmGrad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      ambWarmGrad.addColorStop(0, 'rgba(255, 175, 75, 0.14)');
      ambWarmGrad.addColorStop(0.35, 'rgba(255, 160, 60, 0.09)');
      ambWarmGrad.addColorStop(0.7, 'rgba(255, 140, 50, 0.04)');
      ambWarmGrad.addColorStop(1, 'rgba(240, 120, 30, 0)');
      ctx.fillStyle = ambWarmGrad;
      ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      ctx.restore();
    }

    // B. Direct warm torchlight glow matching direct light cut
    for (const { l, poly, normW } of directGlow) {
      const warmGrad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      warmGrad.addColorStop(0, 'rgba(255, 215, 140, 0.45)');
      warmGrad.addColorStop(0.2, 'rgba(255, 190, 100, 0.38)');
      warmGrad.addColorStop(0.45, 'rgba(255, 160, 70, 0.24)');
      warmGrad.addColorStop(0.7, 'rgba(245, 130, 45, 0.10)');
      warmGrad.addColorStop(0.88, 'rgba(235, 100, 30, 0.03)');
      warmGrad.addColorStop(1, 'rgba(220, 80, 20, 0)');

      ctx.save();
      ctx.beginPath();
      poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = normW;
      ctx.fillStyle = warmGrad;
      ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      ctx.restore();
    }

    ctx.restore();
  }
}

