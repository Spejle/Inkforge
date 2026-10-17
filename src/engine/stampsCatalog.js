// Fantasy and Tactical Stamp Catalog
// Renders vector-sharp cartography and battlemap assets with consistent aspect ratios and lighting

import { EXTRA_STAMPS } from './stamps/index.js';

// ---------------------------------------------------------------------------
// Hand-inked terrain helpers (light from top-left, shaded right face, one ink
// outline around the silhouette, soft contact shadow). Shared by the
// mountains, hills, rocks, stones and tent below.
// ---------------------------------------------------------------------------
const inkRng = (seed) => {
  let a = (seed | 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
const inkPoly = (ctx, pts, close = true) => {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
};
const inkShadow = (ctx, cx, cy, rx, ry, a = 0.24) => {
  ctx.fillStyle = `rgba(40,28,18,${a})`;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
};
const inkStroke = (ctx, color, lw) => { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
const inkHatch = (ctx, color, lw, segs, a = 0.5) => {
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath();
  for (const [x1, y1, x2, y2] of segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
  inkStroke(ctx, color, lw); ctx.restore();
};

// A mountain peak: jagged silhouette, lit left face, shaded right face split by a
// ridge spine, hatching on the shade, optional snow cap and flat (crater) top.
// o: { seed, lit, shade, color, snow (0..1 of height), snowCol, snowShade, flat, lw, hatch }
const inkPeak = (ctx, s, x0, x1, by, px, py, o) => {
  const r = inkRng(o.seed || 1), j = (v) => (r() - 0.5) * v, f = o.flat || 0;
  const L = [[x0, by]];
  for (const t of [0.34, 0.67]) L.push([x0 + (px - f - x0) * t + j(s * 0.035), by + (py - by) * t + j(s * 0.05)]);
  L.push([px - f, py + j(s * 0.01)]);
  if (f) L.push([px + f, py + j(s * 0.01)]);
  const top = [px + f, py];
  const R = [];
  for (const t of [0.3, 0.63]) R.push([top[0] + (x1 - top[0]) * t + j(s * 0.035), py + (by - py) * t + j(s * 0.05)]);
  R.push([x1, by]);
  const sil = [...L, ...R];
  const rb = top[0] + (x1 - top[0]) * 0.18;
  const r0 = f ? [px + f * 0.2, py] : top;
  const ridge = [r0, [r0[0] + (rb - r0[0]) * 0.3 - s * 0.02, py + (by - py) * 0.3], [r0[0] + (rb - r0[0]) * 0.62 + s * 0.015, py + (by - py) * 0.62], [rb, by]];
  const shade = [...ridge, ...R.slice(0, -1).reverse(), ...(f ? [top] : [])];
  shade.splice(ridge.length, 0, [x1, by]);
  const lw = s * (o.lw || 0.03);

  inkPoly(ctx, sil); ctx.fillStyle = o.lit; ctx.fill();
  ctx.save(); inkPoly(ctx, sil); ctx.clip();
  // soft light-to-base gradient on the lit face for depth
  const g = ctx.createLinearGradient(0, py, 0, by);
  g.addColorStop(0, 'rgba(255,250,235,0.35)'); g.addColorStop(1, 'rgba(60,40,25,0.12)');
  ctx.fillStyle = g; ctx.fillRect(x0, py, x1 - x0, by - py);
  inkPoly(ctx, shade); ctx.fillStyle = o.shade; ctx.fill();
  // hatching down the shaded face, parallel to the right slope
  const segs = [], n = o.hatch ?? 5;
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1), ax = r0[0] + (rb - r0[0]) * t, ay = py + (by - py) * t;
    segs.push([ax + s * 0.02, ay, ax + (x1 - px) * 0.45 * (1 - t * 0.4), ay + (by - py) * 0.22]);
  }
  inkHatch(ctx, o.color, lw * 0.45, segs, 0.55);
  // a few rock ticks on the lit face
  inkHatch(ctx, o.color, lw * 0.4, [
    [px - (px - x0) * 0.35, py + (by - py) * 0.55, px - (px - x0) * 0.22, py + (by - py) * 0.48],
    [px - (px - x0) * 0.6, py + (by - py) * 0.8, px - (px - x0) * 0.45, py + (by - py) * 0.74],
  ], 0.4);
  if (o.snow) {
    const sy = py + (by - py) * o.snow, zz = [[x0 - s, py - s], [x1 + s, py - s], [x1 + s, sy]];
    const steps = 9;
    for (let i = steps; i >= 0; i--) zz.push([x0 + ((x1 - x0) * i) / steps, sy + (i % 2 ? s * 0.05 : -s * 0.02) + j(s * 0.03)]);
    zz.push([x0 - s, sy]);
    inkPoly(ctx, zz); ctx.fillStyle = o.snowCol || '#fbfbf7'; ctx.fill();
    ctx.save(); inkPoly(ctx, shade); ctx.clip(); inkPoly(ctx, zz); ctx.fillStyle = o.snowShade || '#c6d0dc'; ctx.fill(); ctx.restore();
    inkPoly(ctx, zz.slice(3), false); ctx.globalAlpha = 0.85; inkStroke(ctx, o.color, lw * 0.5); ctx.globalAlpha = 1;
  }
  ctx.restore();
  inkPoly(ctx, ridge, false); inkStroke(ctx, o.color, lw * 0.6);
  inkPoly(ctx, sil, false); inkStroke(ctx, o.color, lw);
  return { top, f };
};

const inkVolcano = (ctx, size, color, fill, w, lite) => {
  const h = size;
  inkShadow(ctx, w * 0.5, h * 0.88, w * 0.44, h * 0.05);
  inkPeak(ctx, h, w * 0.05, w * 0.95, h * 0.88, w * 0.5, h * 0.3, { seed: 11, lit: fill, shade: 'rgba(15,8,5,0.42)', color, flat: w * 0.09, hatch: 6 });
  // crater rim + glowing throat
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.305, w * 0.085, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1c1210'; ctx.fill(); inkStroke(ctx, color, h * 0.02);
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.31, w * 0.055, h * 0.018, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316'; ctx.fill();
  // lava runs down the lit face
  const run = (pts, wd) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, pts[i + 1][0] * w, pts[i + 1][1] * h);
    inkStroke(ctx, '#7c2d12', h * wd * 1.7); ctx.stroke();
    inkStroke(ctx, '#f97316', h * wd); ctx.stroke();
    inkStroke(ctx, '#fde047', h * wd * 0.35); ctx.stroke();
  };
  run([[0.46, 0.33], [0.42, 0.45], [0.44, 0.55], [0.47, 0.66], [0.41, 0.78]], 0.022);
  if (!lite) run([[0.53, 0.33], [0.57, 0.42], [0.55, 0.5], [0.53, 0.58], [0.58, 0.66]], 0.016);
  // smoke plume: inked puffs drifting right
  const puffs = lite ? [[0.5, 0.2, 0.06], [0.56, 0.1, 0.07]] : [[0.5, 0.21, 0.065], [0.55, 0.12, 0.08], [0.64, 0.05, 0.07], [0.44, 0.13, 0.055]];
  for (const [x, y, rr] of puffs) {
    ctx.beginPath(); ctx.arc(x * w, y * h, rr * h, 0, Math.PI * 2);
    ctx.fillStyle = '#b9b2a8'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.beginPath(); ctx.arc(x * w + rr * h * 0.35, y * h + rr * h * 0.35, rr * h, 0, Math.PI * 2); ctx.fillStyle = '#8f877d'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x * w, y * h, rr * h, 0, Math.PI * 2); inkStroke(ctx, color, h * 0.018);
  }
};

// Rounded mound with lit crown, shaded right flank and a few grass/hatch strokes.
const inkMound = (ctx, h, x0, x1, cx, top, base, o) => {
  const path = () => {
    ctx.beginPath(); ctx.moveTo(x0, base);
    ctx.bezierCurveTo(x0 + (cx - x0) * 0.35, base - (base - top) * 0.75, cx - (cx - x0) * 0.45, top, cx, top);
    ctx.bezierCurveTo(cx + (x1 - cx) * 0.45, top, x1 - (x1 - cx) * 0.35, base - (base - top) * 0.75, x1, base);
  };
  path(); ctx.closePath(); ctx.fillStyle = o.lit; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.beginPath(); ctx.moveTo(cx + (x1 - cx) * 0.08, top - h);
  ctx.lineTo(cx + (x1 - cx) * 0.08, top);
  ctx.bezierCurveTo(cx + (x1 - cx) * 0.28, top + (base - top) * 0.4, cx + (x1 - cx) * 0.1, base - (base - top) * 0.2, cx + (x1 - cx) * 0.25, base);
  ctx.lineTo(x1 + h, base); ctx.lineTo(x1 + h, top - h); ctx.closePath();
  ctx.fillStyle = o.shade; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - (cx - x0) * 0.35, top + (base - top) * 0.28, (x1 - x0) * 0.16, (base - top) * 0.14, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,252,230,0.35)'; ctx.fill();
  const segs = [];
  for (let k = 0; k < 4; k++) { const yy = top + (base - top) * (0.3 + k * 0.17), xx = cx + (x1 - cx) * (0.35 + k * 0.09); segs.push([xx, yy, xx + (x1 - cx) * 0.22, yy + (base - top) * 0.06]); }
  inkHatch(ctx, o.color, h * 0.012, segs, 0.5);
  ctx.restore();
  // grass tufts on the lit flank
  const tufts = [];
  for (const [tx, ty] of [[0.45, 0.45], [0.62, 0.7]]) {
    const xx = x0 + (cx - x0) * tx, yy = top + (base - top) * ty;
    tufts.push([xx, yy, xx - h * 0.012, yy - h * 0.03], [xx + h * 0.012, yy, xx + h * 0.012, yy - h * 0.035], [xx + h * 0.024, yy, xx + h * 0.036, yy - h * 0.028]);
  }
  inkHatch(ctx, o.color, h * 0.011, tufts, 0.7);
  return path;
};

// Faceted rock: lit top-left facet, shaded right facet, crack, outline.
const inkRock = (ctx, h, cx, by, rw, rh, seed, o) => {
  const r = inkRng(seed), n = 7, pts = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n, k = 0.82 + r() * 0.22;
    pts.push([cx + Math.cos(a) * rw * k, by + Math.sin(a) * rh * k * (i === 0 || i === n ? 0.15 : 1)]);
  }
  inkShadow(ctx, cx + rw * 0.1, by, rw * 0.95, Math.min(rh * 0.12, h * 0.03), 0.16);
  inkPoly(ctx, pts); ctx.fillStyle = o.fill; ctx.fill();
  ctx.save(); ctx.clip();
  const ridgeX = cx + rw * (0.12 + r() * 0.12);
  inkPoly(ctx, [[ridgeX, by - rh * 1.2], [ridgeX - rw * 0.08, by - rh * 0.5], [ridgeX + rw * 0.05, by + 2], [cx + rw * 2, by + 2], [cx + rw * 2, by - rh * 1.2]]);
  ctx.fillStyle = 'rgba(40,30,25,0.32)'; ctx.fill();
  inkPoly(ctx, [[cx - rw, by - rh * 1.2], [ridgeX - rw * 0.02, by - rh * 1.2], [ridgeX - rw * 0.1, by - rh * 0.55], [cx - rw, by - rh * 0.45]]);
  ctx.fillStyle = 'rgba(255,250,235,0.35)'; ctx.fill();
  ctx.restore();
  inkHatch(ctx, o.color, h * 0.014, [[ridgeX, by - rh * 0.95, ridgeX - rw * 0.08, by - rh * 0.5], [ridgeX - rw * 0.08, by - rh * 0.5, ridgeX + rw * 0.05, by]], 0.7);
  inkHatch(ctx, o.color, h * 0.01, [[ridgeX + rw * 0.25, by - rh * 0.6, ridgeX + rw * 0.55, by - rh * 0.45], [ridgeX + rw * 0.2, by - rh * 0.3, ridgeX + rw * 0.5, by - rh * 0.15]], 0.5);
  inkPoly(ctx, pts); inkStroke(ctx, o.color, h * 0.026);
};

// Upright standing stone as a slab in 3/4 view (front, right side, top).
const inkSlab = (ctx, h, x, by, w, ht, d, o, lean = 0) => {
  const dx = d * 0.7, dy = -d * 0.45, lx = lean * ht;
  const F = [[x, by], [x + lx, by - ht], [x + w + lx, by - ht], [x + w, by]];
  const S = [[x + w, by], [x + w + lx, by - ht], [x + w + lx + dx, by - ht + dy], [x + w + dx, by + dy]];
  const T = [[x + lx, by - ht], [x + lx + dx, by - ht + dy], [x + w + lx + dx, by - ht + dy], [x + w + lx, by - ht]];
  inkPoly(ctx, F); ctx.fillStyle = o.fill; ctx.fill();
  inkPoly(ctx, S); ctx.fillStyle = o.side; ctx.fill();
  inkPoly(ctx, T); ctx.fillStyle = o.top; ctx.fill();
  inkHatch(ctx, o.color, h * 0.01, [[x + w * 0.3 + lx * 0.6, by - ht * 0.6, x + w * 0.45 + lx * 0.4, by - ht * 0.38]], 0.55);
  inkPoly(ctx, [F[0], F[1], T[1], T[2], S[3], F[3]]); inkStroke(ctx, o.color, h * 0.022);
  inkPoly(ctx, [F[1], F[2], F[3]], false); inkStroke(ctx, o.color, h * 0.012);
  inkPoly(ctx, [F[2], T[2]], false); inkStroke(ctx, o.color, h * 0.012);
};

// Letterbox a settlement-house stamp (cas_*) into another stamp's box.
const inkFitStamp = (id, A) => (ctx, size, color, fill, seed) => {
  const st = EXTRA_STAMPS.find((x) => x.id === id);
  if (!st) return;
  const a = st.aspect || 1, k = Math.min(1, A / a);
  ctx.save(); ctx.translate(((A - a * k) / 2) * size, (1 - k) * size); ctx.scale(k, k);
  st.render(ctx, size, color, fill, seed); ctx.restore();
};

const INK_RENDER = {
  mountain_grand: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
    const s = size;
    ctx.save();
    inkShadow(ctx, s * 0.5, s * 0.87, s * 0.42, s * 0.05);
    inkPeak(ctx, s, s * 0.07, s * 0.93, s * 0.87, s * 0.48, s * 0.1, { seed: 3, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.3 });
    ctx.restore();
  },
  mountain_range: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
    const w = size * 1.5, h = size;
    ctx.save();
    inkShadow(ctx, w * 0.5, h * 0.88, w * 0.46, h * 0.05);
    inkPeak(ctx, h, w * 0.03, w * 0.56, h * 0.86, w * 0.28, h * 0.26, { seed: 5, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.22, hatch: 4 });
    inkPeak(ctx, h, w * 0.42, w * 0.97, h * 0.86, w * 0.7, h * 0.14, { seed: 8, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.27, hatch: 5 });
    inkPeak(ctx, h, w * 0.24, w * 0.74, h * 0.88, w * 0.47, h * 0.42, { seed: 2, lit: fill, shade: 'rgba(70,52,40,0.38)', color, hatch: 4 });
    ctx.restore();
  },
  mountain_snow_peak: (ctx, size, color = '#1e293b', fill = '#f8fafc') => {
    const s = size;
    ctx.save();
    inkShadow(ctx, s * 0.5, s * 0.88, s * 0.38, s * 0.05);
    inkPeak(ctx, s, s * 0.12, s * 0.88, s * 0.88, s * 0.5, s * 0.05, { seed: 9, lit: '#a9b4c2', shade: 'rgba(25,35,60,0.38)', color, snow: 0.55, snowCol: fill, snowShade: '#b5c6dc', hatch: 6 });
    ctx.restore();
  },
  mountain_volcano: (ctx, size, color = '#271c19', fill = '#4a3f35') => { ctx.save(); inkVolcano(ctx, size, color, fill, size * 1.2, false); ctx.restore(); },
  volcano_lite: (ctx, size, color = '#271c19', fill = '#57534e') => { ctx.save(); inkVolcano(ctx, size, color, fill, size * 1.2, true); ctx.restore(); },
  mountain_mesa: (ctx, size, color = '#451a03', fill = '#d97706') => {
    const w = size * 1.4, h = size;
    const P = (pts) => pts.map(([x, y]) => [x * w, y * h]);
    ctx.save();
    inkShadow(ctx, w * 0.5, h * 0.86, w * 0.45, h * 0.05);
    const sil = P([[0.05, 0.86], [0.12, 0.7], [0.18, 0.6], [0.2, 0.42], [0.21, 0.33], [0.26, 0.27], [0.74, 0.27], [0.79, 0.32], [0.8, 0.45], [0.84, 0.6], [0.89, 0.7], [0.95, 0.86]]);
    inkPoly(ctx, sil); ctx.fillStyle = fill; ctx.fill();
    ctx.save(); inkPoly(ctx, sil); ctx.clip();
    // talus apron
    inkPoly(ctx, P([[0, 0.9], [0.12, 0.7], [0.18, 0.62], [0.82, 0.62], [0.88, 0.7], [1, 0.9]])); ctx.fillStyle = 'rgba(120,60,20,0.22)'; ctx.fill();
    // sunlit table top
    inkPoly(ctx, P([[0.21, 0.335], [0.26, 0.27], [0.74, 0.27], [0.79, 0.32], [0.6, 0.345]])); ctx.fillStyle = 'rgba(255,240,200,0.55)'; ctx.fill();
    // shaded right cliff
    inkPoly(ctx, P([[0.62, 0.34], [0.64, 0.45], [0.61, 0.55], [0.66, 0.62], [0.64, 0.75], [0.7, 0.9], [1, 0.9], [1, 0.2], [0.79, 0.32]])); ctx.fillStyle = 'rgba(70,20,8,0.38)'; ctx.fill();
    // strata bands and vertical cracks
    const segs = [];
    for (const y of [0.4, 0.47, 0.54]) segs.push([0.19 * w, y * h, 0.81 * w, (y + 0.006) * h]);
    for (const x of [0.3, 0.42, 0.55, 0.7]) segs.push([x * w, 0.36 * h, (x + 0.01) * w, 0.6 * h]);
    inkHatch(ctx, color, h * 0.011, segs, 0.45);
    inkHatch(ctx, color, h * 0.01, [[0.25 * w, 0.72 * h, 0.3 * w, 0.68 * h], [0.4 * w, 0.78 * h, 0.46 * w, 0.73 * h], [0.75 * w, 0.75 * h, 0.8 * w, 0.71 * h]], 0.5);
    ctx.restore();
    inkPoly(ctx, P([[0.21, 0.335], [0.6, 0.345], [0.79, 0.32]]), false); inkStroke(ctx, color, h * 0.014);
    inkPoly(ctx, sil, false); inkStroke(ctx, color, h * 0.032);
    ctx.restore();
  },
  hills_rolling: (ctx, size, color = '#2c221e', fill = '#dbe5c5') => {
    const w = size * 1.3, h = size;
    ctx.save();
    inkShadow(ctx, w * 0.5, h * 0.82, w * 0.46, h * 0.045);
    const o = { lit: fill, shade: 'rgba(50,60,30,0.28)', color };
    const back = inkMound(ctx, h, w * 0.38, w * 0.97, w * 0.68, h * 0.36, h * 0.8, o);
    back(); inkStroke(ctx, color, h * 0.03);
    const front = inkMound(ctx, h, w * 0.03, w * 0.66, w * 0.32, h * 0.3, h * 0.82, o);
    front(); inkStroke(ctx, color, h * 0.032);
    ctx.restore();
  },
  hills_dunes: (ctx, size, color = '#78350f', fill = '#fde68a') => {
    const w = size * 1.4, h = size;
    ctx.save();
    inkShadow(ctx, w * 0.5, h * 0.8, w * 0.46, h * 0.04, 0.18);
    const dune = (x0, cx, cy, x1, by) => {
      // gentle windward slope to a sharp crest, steep lee face on the right
      ctx.beginPath(); ctx.moveTo(x0 * w, by * h);
      ctx.bezierCurveTo((x0 + (cx - x0) * 0.5) * w, by * h, (cx - (cx - x0) * 0.25) * w, cy * h, cx * w, cy * h);
      ctx.bezierCurveTo((cx + (x1 - cx) * 0.25) * w, cy * h, (cx + (x1 - cx) * 0.5) * w, by * h, x1 * w, by * h);
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.moveTo(cx * w, cy * h);
      ctx.bezierCurveTo((cx - 0.02) * w, (cy + (by - cy) * 0.4) * h, (cx + 0.06) * w, (by - 0.05) * h, (cx + (x1 - cx) * 0.25) * w, by * h);
      ctx.lineTo(w, by * h); ctx.lineTo(w, 0); ctx.closePath();
      ctx.fillStyle = 'rgba(150,80,20,0.35)'; ctx.fill();
      const segs = [];
      for (let k = 1; k <= 3; k++) { const t = k / 4, yy = (cy + (by - cy) * t) * h, xx = (cx - (cx - x0) * t * 0.7) * w; segs.push([xx - (cx - x0) * w * 0.18, yy + h * 0.015, xx, yy]); }
      inkHatch(ctx, color, h * 0.01, segs, 0.55);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(x0 * w, by * h);
      ctx.bezierCurveTo((x0 + (cx - x0) * 0.5) * w, by * h, (cx - (cx - x0) * 0.25) * w, cy * h, cx * w, cy * h);
      ctx.bezierCurveTo((cx + (x1 - cx) * 0.25) * w, cy * h, (cx + (x1 - cx) * 0.5) * w, by * h, x1 * w, by * h);
      inkStroke(ctx, color, h * 0.03);
      // the crest knife-edge
      ctx.beginPath(); ctx.moveTo(cx * w, cy * h);
      ctx.bezierCurveTo((cx - 0.02) * w, (cy + (by - cy) * 0.4) * h, (cx + 0.06) * w, (by - 0.05) * h, (cx + (x1 - cx) * 0.25) * w, by * h);
      inkStroke(ctx, color, h * 0.016);
    };
    dune(0.36, 0.72, 0.36, 0.98, 0.76);
    dune(0.02, 0.4, 0.3, 0.7, 0.8);
    ctx.restore();
  },
  boulder_cluster: (ctx, size, color = '#2c221e', fill = '#a8a29e') => {
    const w = size * 1.4, h = size;
    ctx.save();
    inkShadow(ctx, w * 0.5, h * 0.82, w * 0.44, h * 0.06, 0.18);
    inkRock(ctx, h, w * 0.62, h * 0.72, w * 0.2, h * 0.4, 4, { fill, color });
    inkRock(ctx, h, w * 0.3, h * 0.8, w * 0.22, h * 0.48, 7, { fill, color });
    inkRock(ctx, h, w * 0.78, h * 0.84, w * 0.12, h * 0.22, 12, { fill, color });
    inkRock(ctx, h, w * 0.52, h * 0.86, w * 0.07, h * 0.1, 21, { fill, color });
    inkRock(ctx, h, w * 0.09, h * 0.86, w * 0.05, h * 0.08, 30, { fill, color });
    ctx.restore();
  },
  ruins_stonehenge: (ctx, size, color = '#292524', fill = '#a8a29e') => {
    const w = size * 1.3, h = size;
    const o = { fill, side: 'rgba(60,50,45,0.55)', top: '#d6d1c9', color };
    ctx.save();
    // trodden earth ring
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.7, w * 0.46, h * 0.17, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,100,70,0.18)'; ctx.fill(); ctx.setLineDash([h * 0.02, h * 0.03]); inkStroke(ctx, color, h * 0.008); ctx.setLineDash([]);
    // back arc (smaller, higher)
    for (const [x, ht] of [[0.2, 0.3], [0.36, 0.34], [0.58, 0.34], [0.74, 0.3]]) {
      inkShadow(ctx, (x + 0.05) * w, h * 0.6, w * 0.06, h * 0.02, 0.2);
      inkSlab(ctx, h, x * w, h * 0.6, w * 0.07, h * ht, h * 0.035, o);
    }
    // back lintel across the middle pair
    inkSlab(ctx, h, 0.35 * w, h * 0.26, w * 0.31, h * 0.06, h * 0.035, o);
    // front trilithon + outliers
    for (const [x, ht, ln] of [[0.08, 0.36, 0], [0.32, 0.46, 0], [0.56, 0.46, 0], [0.86, 0.3, 0.12]]) {
      inkShadow(ctx, (x + 0.06) * w, h * 0.83, w * 0.075, h * 0.025);
      inkSlab(ctx, h, x * w, h * 0.83, w * 0.09, h * ht, h * 0.045, o, ln);
    }
    inkSlab(ctx, h, 0.3 * w, h * 0.37, w * 0.37, h * 0.075, h * 0.045, o);
    // fallen stone
    inkShadow(ctx, w * 0.84, h * 0.93, w * 0.1, h * 0.025);
    inkSlab(ctx, h, 0.74 * w, h * 0.93, w * 0.2, h * 0.06, h * 0.05, o);
    ctx.restore();
  },
  camp_tent: (ctx, size, color = '#2c221e', fill = '#fde047') => {
    const w = size * 1.1, h = size;
    const P = (x, y) => [x * w, y * h];
    ctx.save();
    inkShadow(ctx, w * 0.52, h * 0.84, w * 0.44, h * 0.06);
    // guy ropes + pegs behind
    inkHatch(ctx, color, h * 0.008, [[0.3 * w, 0.18 * h, 0.05 * w, 0.8 * h], [0.72 * w, 0.12 * h, 0.97 * w, 0.66 * h]], 0.8);
    // side roof (shaded), seen to the right
    const ridgeF = P(0.3, 0.2), ridgeB = P(0.74, 0.12);
    const roof = [ridgeF, ridgeB, P(0.93, 0.68), P(0.56, 0.84)];
    inkPoly(ctx, roof); ctx.fillStyle = fill; ctx.fill();
    ctx.fillStyle = 'rgba(70,40,10,0.32)'; ctx.fill();
    inkHatch(ctx, color, h * 0.01, [[0.4 * w, 0.4 * h, 0.82 * w, 0.32 * h], [0.47 * w, 0.6 * h, 0.88 * w, 0.52 * h]], 0.4);
    // front gable (lit)
    const front = [ridgeF, P(0.56, 0.84), P(0.06, 0.84)];
    inkPoly(ctx, front); ctx.fillStyle = fill; ctx.fill();
    const g = ctx.createLinearGradient(0.06 * w, 0, 0.56 * w, 0); g.addColorStop(0, 'rgba(255,250,230,0.4)'); g.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = g; ctx.fill();
    // door flap opening
    inkPoly(ctx, [P(0.31, 0.42), P(0.43, 0.84), P(0.2, 0.84)]); ctx.fillStyle = '#2a1d14'; ctx.fill();
    inkPoly(ctx, [P(0.31, 0.42), P(0.2, 0.84), P(0.13, 0.84)]); ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.fill(); inkStroke(ctx, color, h * 0.014);
    // seams
    inkHatch(ctx, color, h * 0.009, [[0.3 * w, 0.2 * h, 0.31 * w, 0.42 * h]], 0.7);
    // outline + poles
    inkPoly(ctx, [P(0.06, 0.84), ridgeF, ridgeB, P(0.93, 0.68), P(0.56, 0.84)]); inkStroke(ctx, color, h * 0.03);
    inkPoly(ctx, [ridgeF, P(0.56, 0.84)], false); inkStroke(ctx, color, h * 0.02);
    inkHatch(ctx, color, h * 0.022, [[0.3 * w, 0.2 * h, 0.3 * w, 0.12 * h], [0.74 * w, 0.12 * h, 0.74 * w, 0.05 * h]], 1);
    ctx.beginPath(); ctx.moveTo(0.74 * w, 0.05 * h); ctx.lineTo(0.84 * w, 0.075 * h); ctx.lineTo(0.74 * w, 0.1 * h); ctx.fillStyle = '#b91c1c'; ctx.fill(); inkStroke(ctx, color, h * 0.012);
    ctx.restore();
  },
  village_houses: (ctx, size, color = '#2c221e', fill = '#dcd4c0') => {
    const w = size * 1.3, h = size;
    ctx.save();
    inkShadow(ctx, w * 0.5, h * 0.85, w * 0.46, h * 0.06);
    // house: lit gable front + shaded side wall + pitched roof receding right
    const house = (x, by, fw, wh, d, roofCol) => {
      const dx = d, dy = -d * 0.5, rh = fw * 0.55, apex = [x + fw / 2, by - wh - rh];
      const front = [[x, by], [x, by - wh], apex, [x + fw, by - wh], [x + fw, by]];
      const sideW = [[x + fw, by], [x + fw, by - wh], [x + fw + dx, by - wh + dy], [x + fw + dx, by + dy]];
      const roof = [apex, [apex[0] + dx, apex[1] + dy], [x + fw + dx + fw * 0.06, by - wh + dy + fw * 0.03], [x + fw + fw * 0.06, by - wh + fw * 0.03]];
      inkPoly(ctx, sideW); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = 'rgba(50,35,25,0.35)'; ctx.fill();
      inkPoly(ctx, front); ctx.fillStyle = fill; ctx.fill();
      inkPoly(ctx, roof); ctx.fillStyle = roofCol; ctx.fill();
      ctx.save(); inkPoly(ctx, roof); ctx.clip();
      const segs = []; for (let k = 1; k < 5; k++) { const t = k / 5; segs.push([apex[0] + (roof[3][0] - apex[0]) * t, apex[1] + (roof[3][1] - apex[1]) * t, apex[0] + dx + (roof[3][0] - apex[0]) * t, apex[1] + dy + (roof[3][1] - apex[1]) * t]); }
      inkHatch(ctx, color, h * 0.008, segs, 0.45); ctx.restore();
      // timber frame + door + window
      inkHatch(ctx, color, h * 0.008, [[x, by - wh * 0.55, x + fw, by - wh * 0.55]], 0.5);
      ctx.fillStyle = '#4a2f1d'; ctx.fillRect(x + fw * 0.38, by - wh * 0.48, fw * 0.24, wh * 0.48);
      ctx.fillStyle = '#f6d66b'; ctx.fillRect(x + fw * 0.4, by - wh - rh * 0.55, fw * 0.2, rh * 0.3);
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x + fw + dx * 0.35, by - wh * 0.7 + dy * 0.35, dx * 0.3, wh * 0.28);
      inkPoly(ctx, [[x, by], [x, by - wh], apex, [apex[0] + dx, apex[1] + dy], roof[2], [x + fw + dx, by + dy], [x + fw, by]]); inkStroke(ctx, color, h * 0.024);
      inkPoly(ctx, [[x, by - wh], [x + fw, by - wh], [x + fw, by]], false); inkStroke(ctx, color, h * 0.012);
      inkPoly(ctx, [apex, roof[3], roof[2]], false); inkStroke(ctx, color, h * 0.014);
    };
    house(0.08 * w, h * 0.66, w * 0.22, h * 0.17, w * 0.12, '#9a3b2a');
    house(0.56 * w, h * 0.68, w * 0.2, h * 0.16, w * 0.12, '#6b4a2b');
    house(0.3 * w, h * 0.86, w * 0.25, h * 0.2, w * 0.13, '#b4532a');
    ctx.restore();
  },
  castle_citadel: inkFitStamp('cas_human_castle', 1.2),
  fortress_keep: inkFitStamp('cas_human_keep', 1.1),
  tower_wizard: inkFitStamp('cas_wizard_spire', 0.7),
  civ_lighthouse: inkFitStamp('cas_lighthouse', 0.8),
};

export const STAMP_CATEGORIES = [
  { id: 'world_nature', name: 'Nature & Land', type: 'world' },
  { id: 'world_civilization', name: 'Settlements & Structures', type: 'world' },
  { id: 'world_nautical', name: 'Nautical & Icons', type: 'world' },
  { id: 'battle_rooms', name: 'Dungeon & Structures', type: 'battle' },
  { id: 'battle_props', name: 'Furniture & Props', type: 'battle' },
  { id: 'battle_tokens', name: 'Creatures & Heroes', type: 'battle' },
];

export const STAMPS = [
  // =========================================================================
  // 1. WORLD: NATURE & LAND (Mountains, Hills, Trees, Flora)
  // =========================================================================
  {
    id: 'mountain_grand',
    name: 'Grand Mountain Peak',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains', groupName: 'Mountains & Volcanoes',
    defaultScale: 1.2,
    aspect: 1,
    render: INK_RENDER.mountain_grand
  },
  {
    id: 'mountain_range',
    name: 'Mountain Ridge Cluster',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains', groupName: 'Mountains & Volcanoes',
    defaultScale: 1.4,
    aspect: 1.5,
    render: INK_RENDER.mountain_range
  },
  {
    id: 'mountain_snow_peak',
    name: 'Glacial Horn Peak',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains', groupName: 'Mountains & Volcanoes',
    defaultScale: 1.2,
    aspect: 1,
    render: INK_RENDER.mountain_snow_peak
  },
  {
    id: 'mountain_volcano',
    name: 'Volcanic Caldera',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains', groupName: 'Mountains & Volcanoes',
    defaultScale: 1.3,
    aspect: 1.2,
    render: INK_RENDER.mountain_volcano
  },
  {
    id: 'mountain_mesa',
    name: 'Desert Mesa Plateau',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_hills', groupName: 'Hills, Dunes & Mesas',
    defaultScale: 1.3,
    aspect: 1.4,
    render: INK_RENDER.mountain_mesa
  },
  {
    id: 'hills_rolling',
    name: 'Rolling Green Hills',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'geo_hills', groupName: 'Hills, Dunes & Mesas',
    defaultScale: 1.0,
    aspect: 1.3,
    render: INK_RENDER.hills_rolling
  },
  {
    id: 'hills_dunes',
    name: 'Desert Sand Dunes',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'geo_hills', groupName: 'Hills, Dunes & Mesas',
    defaultScale: 1.1,
    aspect: 1.4,
    render: INK_RENDER.hills_dunes
  },
  {
    id: 'tree_pine',
    name: 'Evergreen Pine',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_conifer', groupName: 'Conifers',
    defaultScale: 0.9,
    aspect: 0.8,
    render: (ctx, size, color = '#2c221e', fill = '#4a6741') => {
      ctx.save();
      const s = size;
      const trunkColor = '#5c4033';

      // Trunk
      ctx.fillStyle = trunkColor;
      ctx.fillRect(s * 0.36, s * 0.65, s * 0.08, s * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.strokeRect(s * 0.36, s * 0.65, s * 0.08, s * 0.25);

      // Layered pine boughs
      const boughs = [
        { top: 0.15, bot: 0.38, w: 0.45 },
        { top: 0.3, bot: 0.52, w: 0.6 },
        { top: 0.44, bot: 0.7, w: 0.75 }
      ];

      for (const b of boughs) {
        ctx.beginPath();
        ctx.moveTo(s * 0.4, s * b.top);
        ctx.lineTo(s * (0.4 - b.w / 2), s * b.bot);
        ctx.lineTo(s * 0.4, s * (b.bot - 0.06));
        ctx.lineTo(s * (0.4 + b.w / 2), s * b.bot);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        // Shaded right half
        ctx.beginPath();
        ctx.moveTo(s * 0.4, s * b.top);
        ctx.lineTo(s * 0.4, s * (b.bot - 0.06));
        ctx.lineTo(s * (0.4 + b.w / 2), s * b.bot);
        ctx.closePath();
        ctx.fillStyle = 'rgba(20, 40, 20, 0.3)';
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'tree_oak',
    name: 'Ancient Oak',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_broadleaf', groupName: 'Broadleaf Trees',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#2c221e', fill = '#557a46') => {
      ctx.save();
      const s = size;

      // Trunk with roots
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.moveTo(s * 0.42, s * 0.55);
      ctx.lineTo(s * 0.4, s * 0.88);
      ctx.lineTo(s * 0.32, s * 0.95);
      ctx.lineTo(s * 0.68, s * 0.95);
      ctx.lineTo(s * 0.6, s * 0.88);
      ctx.lineTo(s * 0.58, s * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      // Canopy foliage clouds
      const foliageBlobs = [
        { x: 0.5, y: 0.35, r: 0.28 },
        { x: 0.32, y: 0.45, r: 0.2 },
        { x: 0.68, y: 0.45, r: 0.2 },
        { x: 0.45, y: 0.22, r: 0.18 }
      ];

      for (const f of foliageBlobs) {
        ctx.beginPath();
        ctx.arc(s * f.x, s * f.y, s * f.r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        // Shading bottom-right
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.arc(s * (f.x + 0.08), s * (f.y + 0.08), s * f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(25, 45, 20, 0.35)';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(s * f.x, s * f.y, s * f.r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'tree_autumn',
    name: 'Autumn Maple',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_broadleaf', groupName: 'Broadleaf Trees',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#3f2212', fill = '#d97706') => {
      ctx.save();
      const s = size;

      // Trunk
      ctx.fillStyle = '#5c3d2e';
      ctx.fillRect(s * 0.44, s * 0.55, s * 0.12, s * 0.38);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.strokeRect(s * 0.44, s * 0.55, s * 0.12, s * 0.38);

      // Amber and red canopy lobes
      const lobes = [
        { x: 0.5, y: 0.32, r: 0.26, col: '#ea580c' },
        { x: 0.34, y: 0.42, r: 0.19, col: '#d97706' },
        { x: 0.66, y: 0.42, r: 0.19, col: '#b91c1c' }
      ];

      for (const l of lobes) {
        ctx.beginPath();
        ctx.arc(s * l.x, s * l.y, s * l.r, 0, Math.PI * 2);
        ctx.fillStyle = l.col;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'tree_dead',
    name: 'Gnarled Dead Tree',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_dead_grp', groupName: 'Dead & Gnarled',
    defaultScale: 0.9,
    aspect: 0.9,
    render: (ctx, size, color = '#1c1917', fill = '#44403c') => {
      ctx.save();
      const s = size;
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.045;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Twisted trunk and bare branches
      ctx.beginPath();
      ctx.moveTo(s * 0.45, s * 0.92);
      ctx.quadraticCurveTo(s * 0.42, s * 0.6, s * 0.48, s * 0.4);
      // Main fork left
      ctx.lineTo(s * 0.25, s * 0.22);
      ctx.moveTo(s * 0.32, s * 0.28);
      ctx.lineTo(s * 0.2, s * 0.38);
      // Main fork right
      ctx.moveTo(s * 0.48, s * 0.4);
      ctx.lineTo(s * 0.72, s * 0.2);
      ctx.moveTo(s * 0.62, s * 0.27);
      ctx.lineTo(s * 0.78, s * 0.36);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'tree_forest_cluster',
    name: 'Dense Woodland Canopy',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_grove', groupName: 'Groves & Clumps',
    defaultScale: 1.2,
    aspect: 1.4,
    render: (ctx, size, color = '#2c221e', fill = '#557a46') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Cluster of 6 overlapping tree canopy mounds
      const trees = [
        { x: 0.25, y: 0.65, r: 0.22, f: '#486b3a' },
        { x: 0.75, y: 0.65, r: 0.22, f: '#486b3a' },
        { x: 0.35, y: 0.42, r: 0.25, f: fill },
        { x: 0.65, y: 0.42, r: 0.25, f: fill },
        { x: 0.5, y: 0.3, r: 0.28, f: '#5c864b' }
      ];

      for (const t of trees) {
        ctx.beginPath();
        ctx.arc(w * t.x, h * t.y, h * t.r, 0, Math.PI * 2);
        ctx.fillStyle = t.f;
        ctx.fill();

        // Shadow bottom-right
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.arc(w * (t.x + 0.05), h * (t.y + 0.05), h * t.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 40, 15, 0.35)';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(w * t.x, h * t.y, h * t.r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.035;
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 2. WORLD: SETTLEMENTS & CIVILIZATION
  // =========================================================================
  {
    id: 'castle_citadel',
    name: 'Royal Citadel & Keep',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_human', groupName: 'Human Castles',
    defaultScale: 1.3,
    aspect: 1.2,
    render: INK_RENDER.castle_citadel
  },
  {
    id: 'fortress_keep',
    name: 'Stone Bastion Keep',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_human', groupName: 'Human Castles',
    defaultScale: 1.2,
    aspect: 1.1,
    render: INK_RENDER.fortress_keep
  },
  {
    id: 'village_houses',
    name: 'Village Settlement',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_human', groupName: 'Human Settlements',
    defaultScale: 1.1,
    aspect: 1.3,
    render: INK_RENDER.village_houses
  },
  {
    id: 'windmill',
    name: 'Windmill & Farm',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_mills', groupName: 'Windmills & Mills',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#2c221e', fill = '#f5f5f4') => {
      ctx.save();
      const s = size;

      // Tapered tower
      ctx.beginPath();
      ctx.moveTo(s * 0.32, s * 0.88);
      ctx.lineTo(s * 0.38, s * 0.35);
      ctx.lineTo(s * 0.52, s * 0.35);
      ctx.lineTo(s * 0.58, s * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.035;
      ctx.stroke();

      // Conical cap
      ctx.beginPath();
      ctx.moveTo(s * 0.35, s * 0.35);
      ctx.lineTo(s * 0.45, s * 0.22);
      ctx.lineTo(s * 0.55, s * 0.35);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.stroke();

      // 4 Windmill lattice sails
      ctx.save();
      ctx.translate(s * 0.45, s * 0.36);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.025;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s * 0.32);
        ctx.stroke();
        // Lattice sail cloth
        ctx.fillStyle = 'rgba(240, 235, 220, 0.85)';
        ctx.fillRect(s * 0.02, -s * 0.3, s * 0.08, s * 0.26);
        ctx.strokeRect(s * 0.02, -s * 0.3, s * 0.08, s * 0.26);
      }
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  },
  {
    id: 'tower_wizard',
    name: 'Spire of High Sorcery',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_wizard', groupName: 'Wizard Towers',
    defaultScale: 1.1,
    aspect: 0.7,
    render: INK_RENDER.tower_wizard
  },
  {
    id: 'ruins_stonehenge',
    name: 'Ancient Megalith Circle',
    category: 'world_civilization',
    rotate: 'tilt',
    group: 'cas_sacred', groupName: 'Temples, Shrines & Stones',
    defaultScale: 1.2,
    aspect: 1.3,
    render: INK_RENDER.ruins_stonehenge
  },

  // =========================================================================
  // 3. WORLD: NAUTICAL & ICONS (Compass, Ships, Monsters)
  // =========================================================================
  {
    id: 'compass_rose',
    name: 'Nautical Compass Rose',
    category: 'world_nautical',
    rotate: 'fixed',
    defaultScale: 1.5,
    aspect: 1,
    render: (ctx, size, color = '#2c221e', fill = '#d4af37') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.55;
      const r = s * 0.38;

      // Outer rings
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();

      // 8-Point Compass Star
      const points = 8;
      for (let i = 0; i < points; i++) {
        const isMajor = i % 2 === 0;
        const len = isMajor ? r * 0.95 : r * 0.65;
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const nextAngle = angle + Math.PI / points;

        // Left half (Dark shade)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.lineTo(cx + Math.cos(nextAngle) * (r * 0.22), cy + Math.sin(nextAngle) * (r * 0.22));
        ctx.closePath();
        ctx.fillStyle = isMajor ? '#78350f' : '#b45309';
        ctx.fill();
        ctx.stroke();

        // Right half (Gold/Light)
        const prevAngle = angle - Math.PI / points;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.lineTo(cx + Math.cos(prevAngle) * (r * 0.22), cy + Math.sin(prevAngle) * (r * 0.22));
        ctx.closePath();
        ctx.fillStyle = isMajor ? fill : '#fef08a';
        ctx.fill();
        ctx.stroke();
      }

      // Fleur-de-lis / North Arrow indicator
      ctx.font = `bold ${Math.round(s * 0.16)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = color;
      ctx.fillText('N', cx, cy - r * 0.98);

      ctx.restore();
    }
  },
  {
    id: 'ship_caravel',
    name: 'Merchant Caravel',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_ships', groupName: 'Sailing Ships',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#2c221e', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Wooden Hull
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.65);
      ctx.lineTo(w * 0.85, h * 0.65);
      ctx.quadraticCurveTo(w * 0.95, h * 0.72, w * 0.82, h * 0.85);
      ctx.lineTo(w * 0.22, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      // Masts
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.65);
      ctx.lineTo(w * 0.45, h * 0.15); // Main mast
      ctx.moveTo(w * 0.7, h * 0.65);
      ctx.lineTo(w * 0.7, h * 0.25); // Foremast
      ctx.stroke();

      // Billowed White Sails
      ctx.fillStyle = fill;
      // Main sail
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.22);
      ctx.quadraticCurveTo(w * 0.45, h * 0.35, w * 0.58, h * 0.22);
      ctx.lineTo(w * 0.58, h * 0.55);
      ctx.quadraticCurveTo(w * 0.45, h * 0.68, w * 0.32, h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Fore sail
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.3);
      ctx.quadraticCurveTo(w * 0.7, h * 0.38, w * 0.78, h * 0.3);
      ctx.lineTo(w * 0.78, h * 0.52);
      ctx.quadraticCurveTo(w * 0.7, h * 0.62, w * 0.62, h * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'sea_serpent',
    name: 'Mythic Leviathan',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters', groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#0f172a', fill = '#0d9488') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Coils rising above ocean waves
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.045;
      ctx.lineCap = 'round';

      // Serpent Head & Yawning Maw
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.75);
      ctx.quadraticCurveTo(w * 0.18, h * 0.3, w * 0.28, h * 0.25);
      ctx.lineTo(w * 0.38, h * 0.2); // Snout
      ctx.lineTo(w * 0.32, h * 0.35); // Lower jaw
      ctx.quadraticCurveTo(w * 0.25, h * 0.45, w * 0.22, h * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Monster eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.28, h * 0.03, 0, Math.PI * 2);
      ctx.fill();

      // Body coils
      const coils = [
        { x: 0.45, y: 0.75, r: 0.18 },
        { x: 0.72, y: 0.75, r: 0.15 }
      ];

      for (const c of coils) {
        ctx.beginPath();
        ctx.arc(w * c.x, h * c.y, h * c.r, Math.PI, 0);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.stroke();
      }

      // Shared waterline: head and coils rise from the same sea
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.75);
      ctx.lineTo(w * 0.92, h * 0.75);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = h * 0.025;
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // 4. BATTLEMAP: DUNGEON & STRUCTURES
  // =========================================================================
  {
    id: 'dungeon_wall_block',
    name: 'Stone Wall Section',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_walls', groupName: 'Dungeon Walls',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const s = size;

      // Outer drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(s * 0.1, s * 0.1, s * 0.85, s * 0.85);

      // Thick masonry wall cap
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.05, s * 0.05, s * 0.85, s * 0.85);

      // Inner bevel highlight
      ctx.fillStyle = '#64748b';
      ctx.fillRect(s * 0.1, s * 0.1, s * 0.75, s * 0.06);

      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.05;
      ctx.strokeRect(s * 0.05, s * 0.05, s * 0.85, s * 0.85);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_door_wooden',
    name: 'Iron-Banded Wood Door',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_doors', groupName: 'Dungeon Doors',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1c1917', fill = '#78350f') => {
      ctx.save();
      const s = size;

      // Wooden door leaf
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.15, s * 0.35, s * 0.7, s * 0.3);

      // Iron strapping
      ctx.fillStyle = '#475569';
      ctx.fillRect(s * 0.25, s * 0.35, s * 0.08, s * 0.3);
      ctx.fillRect(s * 0.65, s * 0.35, s * 0.08, s * 0.3);

      // Iron ring handle
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.5, s * 0.06, 0, Math.PI * 2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.strokeRect(s * 0.15, s * 0.35, s * 0.7, s * 0.3);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_pillar',
    name: 'Carved Dungeon Pillar',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_pillars', groupName: 'Pillars & Columns',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#475569') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Circular shadow
      ctx.beginPath();
      ctx.arc(cx + s * 0.05, cy + s * 0.05, s * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Outer plinth
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      // Inner capital ring
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'dungeon_stairs_down',
    name: 'Descending Stone Stairs',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_stairs', groupName: 'Stairs & Ladders',
    defaultScale: 1.1,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const s = size;

      // Receding steps (progressively darker downwards)
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const y = s * (0.15 + i * 0.11);
        const darkness = Math.round(75 - i * 11);
        ctx.fillStyle = `rgb(${darkness}, ${darkness + 5}, ${darkness + 10})`;
        ctx.fillRect(s * 0.15, y, s * 0.7, s * 0.11);
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.strokeRect(s * 0.15, y, s * 0.7, s * 0.11);
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 5. BATTLEMAP: FURNITURE & PROPS
  // =========================================================================
  {
    id: 'prop_table_tavern',
    name: 'Long Tavern Feast Table',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_tables', groupName: 'Tables & Desks',
    defaultScale: 1.1,
    aspect: 1.8,
    render: (ctx, size, color = '#2c1810', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.8;
      const h = size;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.165, h * 0.28, w * 0.75, h * 0.55);

      // Wood table planks
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.125, h * 0.22, w * 0.75, h * 0.55);

      // Plank grooves
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.beginPath();
      ctx.moveTo(w * 0.125, h * 0.4);
      ctx.lineTo(w * 0.875, h * 0.4);
      ctx.moveTo(w * 0.125, h * 0.58);
      ctx.lineTo(w * 0.875, h * 0.58);
      ctx.stroke();

      ctx.lineWidth = h * 0.04;
      ctx.strokeRect(w * 0.125, h * 0.22, w * 0.75, h * 0.55);

      ctx.restore();
    }
  },
  {
    id: 'prop_chest_treasure',
    name: 'Gilded Treasure Chest',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_chests', groupName: 'Chests & Containers',
    defaultScale: 0.9,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#92400e') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Wood body
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.5);

      // Gold bands
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.1, h * 0.5);
      ctx.fillRect(w * 0.75, h * 0.3, w * 0.1, h * 0.5);
      // Keyhole escutcheon
      ctx.fillRect(w * 0.46, h * 0.45, w * 0.08, h * 0.15);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.04;
      ctx.strokeRect(w * 0.15, h * 0.3, w * 0.7, h * 0.5);

      ctx.restore();
    }
  },
  {
    id: 'prop_campfire',
    name: 'Roaring Campfire',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_fire', groupName: 'Fires & Braziers',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#2c221e') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Warm radial glow
      const glow = ctx.createRadialGradient(cx, cy, s * 0.1, cx, cy, s * 0.48);
      glow.addColorStop(0, 'rgba(249, 115, 22, 0.75)');
      glow.addColorStop(0.6, 'rgba(234, 88, 12, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // Stone ring
      ctx.fillStyle = '#64748b';
      const stones = 8;
      for (let i = 0; i < stones; i++) {
        const a = (Math.PI * 2 / stones) * i;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (s * 0.3), cy + Math.sin(a) * (s * 0.3), s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.02;
        ctx.stroke();
      }

      // Crossed burning logs
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.22, cy - s * 0.22);
      ctx.lineTo(cx + s * 0.22, cy + s * 0.22);
      ctx.moveTo(cx + s * 0.22, cy - s * 0.22);
      ctx.lineTo(cx - s * 0.22, cy + s * 0.22);
      ctx.stroke();

      // Flame core
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_crate',
    name: 'Storage Crates & Barrels',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_storage', groupName: 'Barrels & Crates',
    defaultScale: 1.0,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Wooden square crate
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.15, h * 0.25, w * 0.42, h * 0.55);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.15, h * 0.25, w * 0.42, h * 0.55);
      // Crate cross-brace
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.25);
      ctx.lineTo(w * 0.57, h * 0.8);
      ctx.moveTo(w * 0.57, h * 0.25);
      ctx.lineTo(w * 0.15, h * 0.8);
      ctx.stroke();

      // Round barrel beside it
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.52, w * 0.18, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'prop_throne_royal',
    name: 'Gilded Royal Throne',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_seating', groupName: 'Chairs & Thrones',
    defaultScale: 1.1,
    aspect: 1,
    render: (ctx, size, color = '#1c1917', fill = '#b91c1c') => {
      ctx.save();
      const s = size;

      // High backrest
      ctx.fillStyle = fill; // Crimson velvet
      ctx.fillRect(s * 0.3, s * 0.15, s * 0.4, s * 0.45);

      // Gold frame & finials
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = s * 0.05;
      ctx.strokeRect(s * 0.28, s * 0.12, s * 0.44, s * 0.5);

      // Seat cushion
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.25, s * 0.58, s * 0.5, s * 0.28);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.035;
      ctx.strokeRect(s * 0.25, s * 0.58, s * 0.5, s * 0.28);

      ctx.restore();
    }
  },
  {
    id: 'prop_brazier_lit',
    name: 'Iron Fire Brazier',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_fire', groupName: 'Fires & Braziers',
    defaultScale: 0.9,
    aspect: 1,
    render: (ctx, size, color = '#0f172a') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Glow halo
      const grad = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.45);
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.75)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Tripod iron bowl
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      // Embers
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  // =========================================================================
  // 6. BATTLEMAP: CREATURES & TOKENS
  // =========================================================================
  {
    id: 'token_hero_warrior',
    name: 'Knight Hero Token',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes', groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e293b', fill = '#3b82f6') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Base token circular disk
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Golden ornate rim
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Knight sword crest
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.25);
      ctx.lineTo(cx, cy + s * 0.25); // Blade
      ctx.moveTo(cx - s * 0.12, cy - s * 0.08);
      ctx.lineTo(cx + s * 0.12, cy - s * 0.08); // Guard
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'token_hero_mage',
    name: 'Arcanist Mage Token',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes', groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e1b4b', fill = '#8b5cf6') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Arcane star icon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s * 0.035;
      const pts = 8;
      for (let i = 0; i < pts; i++) {
        const a = (Math.PI * 2 / pts) * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * (s * 0.24), cy + Math.sin(a) * (s * 0.24));
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'token_hero_rogue',
    name: 'Shadow Rogue Token',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes', groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#15803d') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Crossed daggers
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.18, cy - s * 0.18);
      ctx.lineTo(cx + s * 0.18, cy + s * 0.18);
      ctx.moveTo(cx + s * 0.18, cy - s * 0.18);
      ctx.lineTo(cx - s * 0.18, cy + s * 0.18);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'token_monster_dragon',
    name: 'Elder Red Dragon',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_monsters', groupName: 'Monster Tokens',
    defaultScale: 1.5,
    aspect: 1,
    render: (ctx, size, color = '#450a0a', fill = '#dc2626') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Colossal Boss Token
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Blood red spikes rim
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = s * 0.08;
      ctx.stroke();

      // Dragon Silhouette Crest
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.2, cy - s * 0.1);
      ctx.lineTo(cx, cy - s * 0.28);
      ctx.lineTo(cx + s * 0.2, cy - s * 0.1);
      ctx.lineTo(cx + s * 0.12, cy + s * 0.15);
      ctx.lineTo(cx, cy + s * 0.28);
      ctx.lineTo(cx - s * 0.12, cy + s * 0.15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'token_skull_marker',
    name: 'Boss / Skull Marker',
    category: 'battle_tokens',
    rotate: 'free',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#18181b', fill = '#f43f5e') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = '#881337';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Skull face
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.05, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - s * 0.1, cy + s * 0.05, s * 0.2, s * 0.12);

      // Eye sockets
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx - s * 0.07, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.07, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL WORLD NATURE STAMPS
  // =========================================================================
  {
    id: 'tree_dead_barren',
    name: 'Dead Tree',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_dead_grp', groupName: 'Dead & Gnarled',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#1c1917', fill = '#57534e') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Base roots spreading on ground
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.9);
      ctx.quadraticCurveTo(w * 0.35, h * 0.82, w * 0.42, h * 0.75);
      ctx.lineTo(w * 0.38, h * 0.52);
      // Left major limb
      ctx.lineTo(w * 0.18, h * 0.38);
      ctx.lineTo(w * 0.12, h * 0.22);
      ctx.lineTo(w * 0.18, h * 0.24);
      ctx.lineTo(w * 0.26, h * 0.36);
      ctx.lineTo(w * 0.35, h * 0.2);
      ctx.lineTo(w * 0.39, h * 0.22);
      ctx.lineTo(w * 0.34, h * 0.42);
      // Trunk center fork
      ctx.lineTo(w * 0.46, h * 0.32);
      ctx.lineTo(w * 0.48, h * 0.14);
      ctx.lineTo(w * 0.52, h * 0.15);
      ctx.lineTo(w * 0.51, h * 0.32);
      // Right major limb
      ctx.lineTo(w * 0.62, h * 0.25);
      ctx.lineTo(w * 0.78, h * 0.18);
      ctx.lineTo(w * 0.86, h * 0.22);
      ctx.lineTo(w * 0.76, h * 0.27);
      ctx.lineTo(w * 0.84, h * 0.38);
      ctx.lineTo(w * 0.78, h * 0.4);
      ctx.lineTo(w * 0.68, h * 0.36);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.75);
      // Right roots
      ctx.quadraticCurveTo(w * 0.64, h * 0.82, w * 0.78, h * 0.9);
      ctx.lineTo(w * 0.62, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.84);
      ctx.lineTo(w * 0.36, h * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shading on trunk right side
      ctx.fillStyle = 'rgba(20, 15, 10, 0.3)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.52);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.75);
      ctx.quadraticCurveTo(w * 0.64, h * 0.82, w * 0.78, h * 0.9);
      ctx.lineTo(w * 0.62, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.84);
      ctx.closePath();
      ctx.fill();

      // Inked outline & bark contour lines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.9);
      ctx.quadraticCurveTo(w * 0.35, h * 0.82, w * 0.42, h * 0.75);
      ctx.lineTo(w * 0.38, h * 0.52);
      ctx.lineTo(w * 0.18, h * 0.38);
      ctx.lineTo(w * 0.12, h * 0.22);
      ctx.moveTo(w * 0.18, h * 0.24);
      ctx.lineTo(w * 0.26, h * 0.36);
      ctx.moveTo(w * 0.24, h * 0.33);
      ctx.lineTo(w * 0.35, h * 0.2);
      ctx.moveTo(w * 0.34, h * 0.42);
      ctx.lineTo(w * 0.46, h * 0.32);
      ctx.lineTo(w * 0.48, h * 0.14);
      ctx.moveTo(w * 0.51, h * 0.32);
      ctx.lineTo(w * 0.62, h * 0.25);
      ctx.lineTo(w * 0.78, h * 0.18);
      ctx.lineTo(w * 0.86, h * 0.22);
      ctx.moveTo(w * 0.74, h * 0.23);
      ctx.lineTo(w * 0.84, h * 0.38);
      ctx.moveTo(w * 0.68, h * 0.36);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.75);
      ctx.quadraticCurveTo(w * 0.64, h * 0.82, w * 0.78, h * 0.9);
      ctx.stroke();

      // Trunk wood grain fissures
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.78);
      ctx.lineTo(w * 0.45, h * 0.56);
      ctx.moveTo(w * 0.5, h * 0.74);
      ctx.lineTo(w * 0.51, h * 0.6);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'tree_palm',
    name: 'Palm Tree',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_tropical', groupName: 'Palms',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#15803d') => {
      ctx.save();
      const s = size;

      // Curved slender trunk leaning right
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.92);
      ctx.quadraticCurveTo(s * 0.44, s * 0.65, s * 0.6, s * 0.34);
      ctx.lineTo(s * 0.67, s * 0.34);
      ctx.quadraticCurveTo(s * 0.53, s * 0.65, s * 0.48, s * 0.92);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();

      // Trunk segments
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      const segCount = 6;
      for (let i = 1; i <= segCount; i++) {
        const t = i / (segCount + 1);
        const tx1 = 0.38 * (1 - t) + 0.6 * t;
        const ty1 = 0.92 * (1 - t) + 0.34 * t;
        const tx2 = 0.48 * (1 - t) + 0.67 * t;
        const ty2 = 0.92 * (1 - t) + 0.34 * t;
        ctx.beginPath();
        ctx.moveTo(s * tx1, s * ty1);
        ctx.lineTo(s * tx2, s * ty2);
        ctx.stroke();
      }

      // Trunk outline
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.92);
      ctx.quadraticCurveTo(s * 0.44, s * 0.65, s * 0.6, s * 0.34);
      ctx.moveTo(s * 0.67, s * 0.34);
      ctx.quadraticCurveTo(s * 0.53, s * 0.65, s * 0.48, s * 0.92);
      ctx.stroke();

      // Palm fronds fanning from apex
      const cx = s * 0.64;
      const cy = s * 0.34;
      const fronds = [
        { endX: s * 0.18, endY: s * 0.42, cpX: s * 0.32, cpY: s * 0.16 },
        { endX: s * 0.32, endY: s * 0.16, cpX: s * 0.48, cpY: s * 0.1 },
        { endX: s * 0.65, endY: s * 0.08, cpX: s * 0.64, cpY: s * 0.12 },
        { endX: s * 0.92, endY: s * 0.22, cpX: s * 0.82, cpY: s * 0.12 },
        { endX: s * 0.94, endY: s * 0.45, cpX: s * 0.86, cpY: s * 0.32 },
        { endX: s * 0.48, endY: s * 0.44, cpX: s * 0.54, cpY: s * 0.36 }
      ];

      for (const f of fronds) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(f.cpX, f.cpY, f.endX, f.endY);
        ctx.quadraticCurveTo(f.cpX + (f.endY - cy) * 0.2, f.cpY + (cx - f.endX) * 0.15, cx, cy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(f.cpX, f.cpY, f.endX, f.endY);
        ctx.stroke();
      }

      // Coconuts cluster
      ctx.fillStyle = '#451a03';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      const coconuts = [
        { x: cx - s * 0.03, y: cy + s * 0.02 },
        { x: cx + s * 0.03, y: cy + s * 0.02 },
        { x: cx, y: cy + s * 0.05 }
      ];
      for (const c of coconuts) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, s * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'cactus_saguaro',
    name: 'Desert Cactus',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'veg_desert', groupName: 'Desert Plants',
    defaultScale: 0.9,
    aspect: 0.8,
    render: (ctx, size, color = '#1c1917', fill = '#166534') => {
      ctx.save();
      const w = size * 0.8;
      const h = size;

      // Base desert mound
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.92, w * 0.38, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d97706';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Main trunk and arms
      ctx.fillStyle = fill;

      // Main trunk
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.92);
      ctx.lineTo(w * 0.38, h * 0.18);
      ctx.arc(w * 0.5, h * 0.18, w * 0.12, Math.PI, 0);
      ctx.lineTo(w * 0.62, h * 0.92);
      ctx.closePath();
      ctx.fill();

      // Left arm
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.22, h * 0.6);
      ctx.arc(w * 0.22, h * 0.52, w * 0.08, Math.PI * 0.5, Math.PI);
      ctx.lineTo(w * 0.14, h * 0.32);
      ctx.arc(w * 0.21, h * 0.32, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.28, h * 0.52);
      ctx.arc(w * 0.36, h * 0.52, w * 0.08, Math.PI, Math.PI * 0.5, true);
      ctx.lineTo(w * 0.38, h * 0.52);
      ctx.closePath();
      ctx.fill();

      // Right arm
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.5);
      ctx.lineTo(w * 0.78, h * 0.5);
      ctx.arc(w * 0.78, h * 0.42, w * 0.08, Math.PI * 0.5, 0, true);
      ctx.lineTo(w * 0.86, h * 0.24);
      ctx.arc(w * 0.79, h * 0.24, w * 0.07, 0, Math.PI, true);
      ctx.lineTo(w * 0.72, h * 0.42);
      ctx.arc(w * 0.64, h * 0.42, w * 0.08, 0, Math.PI * 0.5);
      ctx.lineTo(w * 0.62, h * 0.42);
      ctx.closePath();
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(10, 30, 15, 0.25)';
      ctx.fillRect(w * 0.5, h * 0.18, w * 0.12, h * 0.74);
      ctx.fillRect(w * 0.79, h * 0.24, w * 0.07, h * 0.2);

      // Inked outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left arm outline
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.22, h * 0.6);
      ctx.arc(w * 0.22, h * 0.52, w * 0.08, Math.PI * 0.5, Math.PI);
      ctx.lineTo(w * 0.14, h * 0.32);
      ctx.arc(w * 0.21, h * 0.32, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.28, h * 0.5);
      ctx.stroke();

      // Right arm outline
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.5);
      ctx.lineTo(w * 0.78, h * 0.5);
      ctx.arc(w * 0.78, h * 0.42, w * 0.08, Math.PI * 0.5, 0, true);
      ctx.lineTo(w * 0.86, h * 0.24);
      ctx.arc(w * 0.79, h * 0.24, w * 0.07, 0, Math.PI, true);
      ctx.lineTo(w * 0.72, h * 0.42);
      ctx.stroke();

      // Trunk outline
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.92);
      ctx.lineTo(w * 0.38, h * 0.6);
      ctx.moveTo(w * 0.38, h * 0.52);
      ctx.lineTo(w * 0.38, h * 0.18);
      ctx.arc(w * 0.5, h * 0.18, w * 0.12, Math.PI, 0);
      ctx.lineTo(w * 0.62, h * 0.42);
      ctx.moveTo(w * 0.62, h * 0.5);
      ctx.lineTo(w * 0.62, h * 0.92);
      ctx.stroke();

      // Rib lines
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.18);
      ctx.lineTo(w * 0.44, h * 0.9);
      ctx.moveTo(w * 0.5, h * 0.12);
      ctx.lineTo(w * 0.5, h * 0.9);
      ctx.moveTo(w * 0.56, h * 0.18);
      ctx.lineTo(w * 0.56, h * 0.9);
      ctx.moveTo(w * 0.21, h * 0.28);
      ctx.lineTo(w * 0.21, h * 0.52);
      ctx.moveTo(w * 0.79, h * 0.2);
      ctx.lineTo(w * 0.79, h * 0.42);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'boulder_cluster',
    name: 'Boulder Cluster',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'veg_debris', groupName: 'Rocks, Logs & Stumps',
    defaultScale: 1.1,
    aspect: 1.4,
    render: INK_RENDER.boulder_cluster
  },
  {
    id: 'nature_reeds',
    name: 'Freshwater Reeds',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'veg_wetland', groupName: 'Reeds & Wetland Plants',
    defaultScale: 0.9,
    aspect: 0.8,
    render: (ctx, size, color = '#2c221e', fill = '#4d7c0f') => {
      ctx.save();
      const w = size * 0.8;
      const h = size;

      // Water ripples at base
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.9, w * 0.38, h * 0.05, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.84, w * 0.26, h * 0.04, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Reed blades
      const blades = [
        { startX: 0.36, startY: 0.88, cpX: 0.18, cpY: 0.52, endX: 0.1, endY: 0.32 },
        { startX: 0.44, startY: 0.88, cpX: 0.3, cpY: 0.45, endX: 0.26, endY: 0.22 },
        { startX: 0.52, startY: 0.88, cpX: 0.58, cpY: 0.42, endX: 0.56, endY: 0.18 },
        { startX: 0.58, startY: 0.88, cpX: 0.72, cpY: 0.48, endX: 0.76, endY: 0.24 },
        { startX: 0.64, startY: 0.88, cpX: 0.85, cpY: 0.58, endX: 0.9, endY: 0.38 }
      ];

      for (const b of blades) {
        ctx.beginPath();
        ctx.moveTo(w * b.startX, h * b.startY);
        ctx.quadraticCurveTo(w * b.cpX, h * b.cpY, w * b.endX, h * b.endY);
        ctx.quadraticCurveTo(w * (b.cpX + 0.04), h * b.cpY, w * (b.startX + 0.05), h * b.startY);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * b.startX, h * b.startY);
        ctx.quadraticCurveTo(w * b.cpX, h * b.cpY, w * b.endX, h * b.endY);
        ctx.stroke();
      }

      // 3 Cattail stalks
      const cattails = [
        { x: 0.34, topY: 0.24, headH: 0.16 },
        { x: 0.5, topY: 0.14, headH: 0.18 },
        { x: 0.68, topY: 0.22, headH: 0.15 }
      ];

      for (const c of cattails) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * c.x, h * 0.88);
        ctx.lineTo(w * c.x, h * c.topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * c.x, h * c.topY);
        ctx.lineTo(w * c.x, h * (c.topY - 0.06));
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        const rx = w * 0.045;
        const ry = h * c.headH * 0.5;
        ctx.ellipse(w * c.x, h * (c.topY + c.headH * 0.5), rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'nature_lily_pond',
    name: 'Lily Pond',
    category: 'world_nature',
    rotate: 'free',
    group: 'water_features', groupName: 'Ponds & Whirlpools',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#1e293b', fill = '#38bdf8') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Pond water shape
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.5);
      ctx.bezierCurveTo(w * 0.12, h * 0.25, w * 0.45, h * 0.18, w * 0.72, h * 0.22);
      ctx.bezierCurveTo(w * 0.94, h * 0.26, w * 0.92, h * 0.65, w * 0.78, h * 0.78);
      ctx.bezierCurveTo(w * 0.62, h * 0.9, w * 0.28, h * 0.86, w * 0.15, h * 0.5);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shore outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Water ripple ring
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(w * 0.52, h * 0.52, w * 0.28, h * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3 Lily Pads
      const pads = [
        { x: w * 0.36, y: h * 0.42, r: w * 0.12, rot: 0.4 },
        { x: w * 0.68, y: h * 0.48, r: w * 0.1, rot: 2.2 },
        { x: w * 0.48, y: h * 0.68, r: w * 0.11, rot: -1.0 }
      ];

      for (const p of pads) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0.35, Math.PI * 2 - 0.35);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      // Lotus flower
      const fx = w * 0.36;
      const fy = h * 0.42;
      const petals = 6;
      for (let i = 0; i < petals; i++) {
        const ang = (Math.PI * 2 / petals) * i;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(ang) * (w * 0.038), fy + Math.sin(ang) * (w * 0.038), w * 0.038, w * 0.02, ang, 0, Math.PI * 2);
        ctx.fillStyle = '#fce7f3';
        ctx.fill();
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(fx, fy, w * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'volcano_lite',
    name: 'Volcano',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains', groupName: 'Mountains & Volcanoes',
    defaultScale: 1.2,
    aspect: 1.2,
    render: INK_RENDER.volcano_lite
  },
  {
    id: 'tree_snowy_pine',
    name: 'Snowy Pine',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'tree_conifer', groupName: 'Conifers',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#1c1917', fill = '#14532d') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Wooden trunk
      ctx.fillStyle = '#451a03';
      ctx.fillRect(w * 0.44, h * 0.78, w * 0.12, h * 0.14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.44, h * 0.78, w * 0.12, h * 0.14);

      // 3 Pine tiers
      const tiers = [
        { topY: 0.52, botY: 0.8, leftX: 0.15, rightX: 0.85 },
        { topY: 0.32, botY: 0.6, leftX: 0.24, rightX: 0.76 },
        { topY: 0.14, botY: 0.4, leftX: 0.32, rightX: 0.68 }
      ];

      for (const t of tiers) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * t.rightX, h * t.botY);
        ctx.lineTo(w * 0.5, h * (t.botY - 0.05));
        ctx.lineTo(w * t.leftX, h * t.botY);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.fillStyle = 'rgba(5, 30, 15, 0.3)';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * t.rightX, h * t.botY);
        ctx.lineTo(w * 0.5, h * (t.botY - 0.05));
        ctx.closePath();
        ctx.fill();

        // Snow cap
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * (t.rightX - 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.quadraticCurveTo(w * 0.65, h * (t.topY + 0.1), w * 0.5, h * (t.topY + 0.08));
        ctx.quadraticCurveTo(w * 0.35, h * (t.topY + 0.1), w * (t.leftX + 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * t.rightX, h * t.botY);
        ctx.lineTo(w * 0.5, h * (t.botY - 0.05));
        ctx.lineTo(w * t.leftX, h * t.botY);
        ctx.closePath();
        ctx.stroke();

        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(w * (t.leftX + 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.quadraticCurveTo(w * 0.35, h * (t.topY + 0.1), w * 0.5, h * (t.topY + 0.08));
        ctx.quadraticCurveTo(w * 0.65, h * (t.topY + 0.1), w * (t.rightX - 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL WORLD CIVILIZATION STAMPS
  // =========================================================================
  {
    id: 'windmill_rustic',
    name: 'Rustic Windmill',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_mills', groupName: 'Windmills & Mills',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#2c221e', fill = '#e7e5e4') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Round masonry tower base
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.9);
      ctx.lineTo(w * 0.36, h * 0.4);
      ctx.lineTo(w * 0.64, h * 0.4);
      ctx.lineTo(w * 0.72, h * 0.9);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(30, 25, 20, 0.25)';
      ctx.fillRect(w * 0.5, h * 0.4, w * 0.22, h * 0.5);

      // Conical timber roof cap
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.4);
      ctx.lineTo(w * 0.5, h * 0.22);
      ctx.lineTo(w * 0.68, h * 0.4);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();

      // Arched door
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.8, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.57, h * 0.9);
      ctx.lineTo(w * 0.43, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Round window
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.52, w * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Tower outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.9);
      ctx.lineTo(w * 0.36, h * 0.4);
      ctx.lineTo(w * 0.64, h * 0.4);
      ctx.lineTo(w * 0.72, h * 0.9);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.4);
      ctx.lineTo(w * 0.5, h * 0.22);
      ctx.lineTo(w * 0.68, h * 0.4);
      ctx.closePath();
      ctx.stroke();

      // 4 Crossed lattice sails
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -w * 0.4);
        ctx.stroke();

        ctx.fillStyle = 'rgba(250, 245, 235, 0.9)';
        ctx.fillRect(w * 0.02, -w * 0.38, w * 0.1, w * 0.34);
        ctx.strokeRect(w * 0.02, -w * 0.38, w * 0.1, w * 0.34);

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.02, -w * 0.28);
        ctx.lineTo(w * 0.12, -w * 0.28);
        ctx.moveTo(w * 0.02, -w * 0.18);
        ctx.lineTo(w * 0.12, -w * 0.18);
        ctx.stroke();
      }
      ctx.restore();

      // Axle hub
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, w * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'civ_lighthouse',
    name: 'Coastal Lighthouse',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_guard', groupName: 'Watchtowers & Lighthouses',
    defaultScale: 1.1,
    aspect: 0.8,
    render: INK_RENDER.civ_lighthouse
  },
  {
    id: 'ruined_tower',
    name: 'Ruined Tower',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_ruins', groupName: 'Ruins',
    defaultScale: 1.1,
    aspect: 0.9,
    render: (ctx, size, color = '#271c19', fill = '#d6d3d1') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Crumbled watchtower main wall
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.88);
      ctx.lineTo(w * 0.26, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.34);
      ctx.lineTo(w * 0.42, h * 0.34);
      ctx.lineTo(w * 0.44, h * 0.46);
      ctx.lineTo(w * 0.54, h * 0.46);
      ctx.lineTo(w * 0.56, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.38);
      ctx.lineTo(w * 0.68, h * 0.54);
      ctx.lineTo(w * 0.74, h * 0.6);
      ctx.lineTo(w * 0.76, h * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.46);
      ctx.lineTo(w * 0.56, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.38);
      ctx.lineTo(w * 0.68, h * 0.54);
      ctx.lineTo(w * 0.74, h * 0.6);
      ctx.lineTo(w * 0.76, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // Wall breach
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.6);
      ctx.quadraticCurveTo(w * 0.42, h * 0.52, w * 0.48, h * 0.6);
      ctx.lineTo(w * 0.46, h * 0.74);
      ctx.lineTo(w * 0.38, h * 0.74);
      ctx.closePath();
      ctx.fill();

      // Ivy patch
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.48, w * 0.05, 0, Math.PI * 2);
      ctx.arc(w * 0.26, h * 0.56, w * 0.06, 0, Math.PI * 2);
      ctx.arc(w * 0.3, h * 0.64, w * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Fallen rubble stones
      const rubble = [
        { x: w * 0.72, y: h * 0.84, w: w * 0.08, h: h * 0.06 },
        { x: w * 0.8, y: h * 0.86, w: w * 0.07, h: h * 0.05 },
        { x: w * 0.75, y: h * 0.79, w: w * 0.06, h: h * 0.05 }
      ];
      ctx.fillStyle = '#a8a29e';
      for (const r of rubble) {
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.88);
      ctx.lineTo(w * 0.26, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.34);
      ctx.lineTo(w * 0.42, h * 0.34);
      ctx.lineTo(w * 0.44, h * 0.46);
      ctx.lineTo(w * 0.54, h * 0.46);
      ctx.lineTo(w * 0.56, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.38);
      ctx.lineTo(w * 0.68, h * 0.54);
      ctx.lineTo(w * 0.74, h * 0.6);
      ctx.lineTo(w * 0.76, h * 0.88);
      ctx.stroke();

      for (const r of rubble) {
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      }

      // Masonry lines
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.4);
      ctx.lineTo(w * 0.4, h * 0.4);
      ctx.moveTo(w * 0.52, h * 0.65);
      ctx.lineTo(w * 0.68, h * 0.65);
      ctx.moveTo(w * 0.48, h * 0.8);
      ctx.lineTo(w * 0.62, h * 0.8);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'bridge_stone',
    name: 'Stone Arch Bridge',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_bridges', groupName: 'Bridges & Crossings',
    defaultScale: 1.2,
    aspect: 1.6,
    render: (ctx, size, color = '#271c19', fill = '#cbd5e1') => {
      ctx.save();
      const w = size * 1.6;
      const h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.82);
      ctx.lineTo(w * 0.9, h * 0.82);
      ctx.moveTo(w * 0.2, h * 0.88);
      ctx.lineTo(w * 0.8, h * 0.88);
      ctx.stroke();

      // Stone Bridge body
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.95, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.8);
      ctx.lineTo(w * 0.88, h * 0.8);
      ctx.arc(w * 0.7, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.48, h * 0.8);
      ctx.arc(w * 0.3, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.05, h * 0.8);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Pier shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.fillRect(w * 0.46, h * 0.6, w * 0.08, h * 0.2);

      // Parapet
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.52);
      ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.95, h * 0.52);
      ctx.lineTo(w * 0.95, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.05, h * 0.58);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.52);
      ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.95, h * 0.52);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.95, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.8);
      ctx.lineTo(w * 0.88, h * 0.8);
      ctx.arc(w * 0.7, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.48, h * 0.8);
      ctx.arc(w * 0.3, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.05, h * 0.8);
      ctx.closePath();
      ctx.stroke();

      // Keystones
      ctx.lineWidth = 1.8;
      ctx.strokeRect(w * 0.28, h * 0.59, w * 0.04, h * 0.06);
      ctx.strokeRect(w * 0.68, h * 0.59, w * 0.04, h * 0.06);

      ctx.restore();
    }
  },
  {
    id: 'farm_homestead',
    name: 'Farm Homestead',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_rural', groupName: 'Farms & Homesteads',
    defaultScale: 1.2,
    aspect: 1.4,
    render: (ctx, size, color = '#2c221e', fill = '#fde68a') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Furrows
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const fy = h * (0.68 + i * 0.06);
        ctx.moveTo(w * 0.58, fy);
        ctx.lineTo(w * 0.94, fy);
      }
      ctx.stroke();

      // Silo
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(w * 0.14, h * 0.44, w * 0.14, h * 0.4);
      ctx.beginPath();
      ctx.arc(w * 0.21, h * 0.44, w * 0.07, Math.PI, 0);
      ctx.fillStyle = '#64748b';
      ctx.fill();

      // House wall
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.26, h * 0.52, w * 0.32, h * 0.32);

      // House shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.fillRect(w * 0.42, h * 0.52, w * 0.16, h * 0.32);

      // Roof
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.52);
      ctx.lineTo(w * 0.42, h * 0.28);
      ctx.lineTo(w * 0.62, h * 0.52);
      ctx.closePath();
      ctx.fillStyle = '#d97706';
      ctx.fill();

      // Chimney
      ctx.fillStyle = '#78350f';
      ctx.fillRect(w * 0.46, h * 0.25, w * 0.06, h * 0.12);

      // Door and window
      ctx.fillStyle = '#451a03';
      ctx.fillRect(w * 0.32, h * 0.68, w * 0.06, h * 0.16);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.44, h * 0.62, w * 0.06, h * 0.06);

      // Fence
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.88);
      ctx.lineTo(w * 0.54, h * 0.88);
      ctx.moveTo(w * 0.08, h * 0.84);
      ctx.lineTo(w * 0.54, h * 0.84);
      for (let i = 0; i < 5; i++) {
        const px = w * (0.1 + i * 0.1);
        ctx.moveTo(px, h * 0.82);
        ctx.lineTo(px, h * 0.92);
      }
      ctx.stroke();

      // Outlines
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.14, h * 0.44, w * 0.14, h * 0.4);
      ctx.beginPath();
      ctx.arc(w * 0.21, h * 0.44, w * 0.07, Math.PI, 0);
      ctx.stroke();

      ctx.strokeRect(w * 0.26, h * 0.52, w * 0.32, h * 0.32);
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.52);
      ctx.lineTo(w * 0.42, h * 0.28);
      ctx.lineTo(w * 0.62, h * 0.52);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeRect(w * 0.46, h * 0.25, w * 0.06, h * 0.12);

      ctx.restore();
    }
  },
  {
    id: 'port_dock',
    name: 'Port Dock',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_port', groupName: 'Ports & Harbours',
    defaultScale: 1.2,
    aspect: 1.5,
    render: (ctx, size, color = '#271c19', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.5;
      const h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.84);
      ctx.lineTo(w * 0.95, h * 0.84);
      ctx.moveTo(w * 0.35, h * 0.9);
      ctx.lineTo(w * 0.88, h * 0.9);
      ctx.stroke();

      // Quay stone wall
      ctx.fillStyle = '#64748b';
      ctx.fillRect(w * 0.05, h * 0.35, w * 0.22, h * 0.52);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.05, h * 0.35, w * 0.22, h * 0.52);

      // Pilings
      const pilings = [0.38, 0.56, 0.74, 0.88];
      ctx.fillStyle = '#451a03';
      for (const px of pilings) {
        ctx.fillRect(w * px, h * 0.52, w * 0.04, h * 0.34);
        ctx.strokeRect(w * px, h * 0.52, w * 0.04, h * 0.34);
      }

      // Pier deck
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.22, h * 0.46, w * 0.72, h * 0.1);
      ctx.strokeRect(w * 0.22, h * 0.46, w * 0.72, h * 0.1);

      // Planks
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const plankCount = 8;
      for (let i = 1; i < plankCount; i++) {
        const lx = w * (0.22 + (0.72 / plankCount) * i);
        ctx.moveTo(lx, h * 0.46);
        ctx.lineTo(lx, h * 0.56);
      }
      ctx.stroke();

      // Bollards
      ctx.fillStyle = '#1c1917';
      const bollards = [0.32, 0.62, 0.9];
      for (const bx of bollards) {
        ctx.fillRect(w * bx, h * 0.4, w * 0.03, h * 0.07);
        ctx.beginPath();
        ctx.arc(w * (bx + 0.015), h * 0.4, w * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crates
      ctx.fillStyle = '#d97706';
      ctx.fillRect(w * 0.44, h * 0.36, w * 0.08, h * 0.1);
      ctx.strokeRect(w * 0.44, h * 0.36, w * 0.08, h * 0.1);
      ctx.fillRect(w * 0.51, h * 0.38, w * 0.07, h * 0.08);
      ctx.strokeRect(w * 0.51, h * 0.38, w * 0.07, h * 0.08);

      ctx.restore();
    }
  },
  {
    id: 'civ_temple',
    name: 'Ancient Temple',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_sacred', groupName: 'Temples, Shrines & Stones',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Plinth base
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.08, h * 0.82, w * 0.84, h * 0.06);
      ctx.fillRect(w * 0.12, h * 0.77, w * 0.76, h * 0.05);
      ctx.fillRect(w * 0.16, h * 0.72, w * 0.68, h * 0.05);

      // Sanctuary dark interior
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.22, h * 0.38, w * 0.56, h * 0.34);

      // Columns
      const cols = [0.22, 0.38, 0.54, 0.7];
      for (const cx of cols) {
        ctx.fillStyle = fill;
        ctx.fillRect(w * cx, h * 0.38, w * 0.08, h * 0.34);
        ctx.fillStyle = 'rgba(20, 15, 10, 0.2)';
        ctx.fillRect(w * (cx + 0.04), h * 0.38, w * 0.04, h * 0.34);
      }

      // Entablature
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.16, h * 0.32, w * 0.68, h * 0.06);

      // Pediment
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.32);
      ctx.lineTo(w * 0.5, h * 0.14);
      ctx.lineTo(w * 0.86, h * 0.32);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Relief emblem
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.24, w * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.strokeRect(w * 0.08, h * 0.82, w * 0.84, h * 0.06);
      ctx.strokeRect(w * 0.12, h * 0.77, w * 0.76, h * 0.05);
      ctx.strokeRect(w * 0.16, h * 0.72, w * 0.68, h * 0.05);

      for (const cx of cols) {
        ctx.strokeRect(w * cx, h * 0.38, w * 0.08, h * 0.34);
      }

      ctx.strokeRect(w * 0.16, h * 0.32, w * 0.68, h * 0.06);

      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.32);
      ctx.lineTo(w * 0.5, h * 0.14);
      ctx.lineTo(w * 0.86, h * 0.32);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.24, w * 0.04, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'camp_tent',
    name: 'Camp Tent',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_camps', groupName: 'Encampments & Tents',
    defaultScale: 1.0,
    aspect: 1.1,
    render: INK_RENDER.camp_tent
  },
  // =========================================================================
  // ADDITIONAL WORLD NAUTICAL STAMPS
  // =========================================================================
  {
    id: 'nautical_kraken',
    name: 'Giant Kraken',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters', groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#1e1b4b', fill = '#4338ca') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Foaming water
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.82);
      ctx.quadraticCurveTo(w * 0.25, h * 0.76, w * 0.5, h * 0.82);
      ctx.quadraticCurveTo(w * 0.75, h * 0.76, w * 0.95, h * 0.82);
      ctx.stroke();

      // Mantle head
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.82);
      ctx.quadraticCurveTo(w * 0.36, h * 0.42, w * 0.5, h * 0.38);
      ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.62, h * 0.82);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shadow on mantle
      ctx.fillStyle = 'rgba(15, 10, 40, 0.35)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.38);
      ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.62, h * 0.82);
      ctx.lineTo(w * 0.5, h * 0.82);
      ctx.closePath();
      ctx.fill();

      // Yellow eye
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w * 0.45, h * 0.58, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(w * 0.445, h * 0.555, w * 0.01, h * 0.05);

      // Tentacles
      const tentacles = [
        { sx: 0.38, sy: 0.8, c1x: 0.1, c1y: 0.6, c2x: 0.05, c2y: 0.25, ex: 0.18, ey: 0.16 },
        { sx: 0.42, sy: 0.78, c1x: 0.26, c1y: 0.45, c2x: 0.24, c2y: 0.2, ex: 0.34, ey: 0.12 },
        { sx: 0.58, sy: 0.78, c1x: 0.74, c1y: 0.45, c2x: 0.76, c2y: 0.2, ex: 0.66, ey: 0.12 },
        { sx: 0.62, sy: 0.8, c1x: 0.9, c1y: 0.6, c2x: 0.95, c2y: 0.25, ex: 0.82, ey: 0.16 }
      ];

      ctx.strokeStyle = fill;
      ctx.lineWidth = w * 0.05;
      ctx.lineCap = 'round';
      for (const t of tentacles) {
        ctx.beginPath();
        ctx.moveTo(w * t.sx, h * t.sy);
        ctx.bezierCurveTo(w * t.c1x, h * t.c1y, w * t.c2x, h * t.c2y, w * t.ex, h * t.ey);
        ctx.stroke();
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      for (const t of tentacles) {
        ctx.beginPath();
        ctx.moveTo(w * t.sx, h * t.sy);
        ctx.bezierCurveTo(w * t.c1x, h * t.c1y, w * t.c2x, h * t.c2y, w * t.ex, h * t.ey);
        ctx.stroke();

        ctx.fillStyle = '#fbcfe8';
        const mx = (t.c1x + t.c2x) * 0.5;
        const my = (t.c1y + t.c2y) * 0.5;
        ctx.beginPath();
        ctx.arc(w * mx, h * my, w * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.82);
      ctx.quadraticCurveTo(w * 0.36, h * 0.42, w * 0.5, h * 0.38);
      ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.62, h * 0.82);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'ship_galleon',
    name: 'War Galleon',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_ships', groupName: 'Sailing Ships',
    defaultScale: 1.3,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Wooden hull
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.58);
      ctx.lineTo(w * 0.22, h * 0.65);
      ctx.lineTo(w * 0.72, h * 0.65);
      ctx.lineTo(w * 0.84, h * 0.58);
      ctx.lineTo(w * 0.94, h * 0.52);
      ctx.lineTo(w * 0.82, h * 0.72);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.lineTo(w * 0.16, h * 0.84);
      ctx.quadraticCurveTo(w * 0.08, h * 0.72, w * 0.1, h * 0.58);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();

      // Gunports
      ctx.fillStyle = '#1c1917';
      const ports = [0.28, 0.4, 0.52, 0.64];
      for (const px of ports) {
        ctx.fillRect(w * px, h * 0.7, w * 0.04, h * 0.04);
      }

      // Hull outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.58);
      ctx.lineTo(w * 0.22, h * 0.65);
      ctx.lineTo(w * 0.72, h * 0.65);
      ctx.lineTo(w * 0.84, h * 0.58);
      ctx.lineTo(w * 0.94, h * 0.52);
      ctx.moveTo(w * 0.84, h * 0.58);
      ctx.lineTo(w * 0.82, h * 0.72);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.lineTo(w * 0.16, h * 0.84);
      ctx.quadraticCurveTo(w * 0.08, h * 0.72, w * 0.1, h * 0.58);
      ctx.stroke();

      // 3 Masts
      const masts = [
        { x: 0.25, topY: 0.26, sW: 0.16, sH: 0.14 },
        { x: 0.48, topY: 0.14, sW: 0.24, sH: 0.18 },
        { x: 0.7, topY: 0.22, sW: 0.2, sH: 0.16 }
      ];

      for (const m of masts) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * m.x, h * 0.65);
        ctx.lineTo(w * m.x, h * m.topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * (m.x - m.sW * 0.5), h * (m.topY + 0.06));
        ctx.quadraticCurveTo(w * m.x, h * (m.topY + 0.08), w * (m.x + m.sW * 0.5), h * (m.topY + 0.06));
        ctx.lineTo(w * (m.x + m.sW * 0.45), h * (m.topY + 0.06 + m.sH));
        ctx.quadraticCurveTo(w * m.x, h * (m.topY + 0.09 + m.sH), w * (m.x - m.sW * 0.45), h * (m.topY + 0.06 + m.sH));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(w * m.x, h * m.topY);
        ctx.lineTo(w * (m.x - 0.06), h * (m.topY + 0.02));
        ctx.lineTo(w * m.x, h * (m.topY + 0.04));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Water wake
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.86);
      ctx.lineTo(w * 0.88, h * 0.86);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'nautical_whirlpool',
    name: 'Maelstrom Whirlpool',
    category: 'world_nautical',
    rotate: 'free',
    group: 'water_features', groupName: 'Ponds & Whirlpools',
    defaultScale: 1.2,
    aspect: 1.2,
    render: (ctx, size, color = '#0f172a', fill = '#0284c7') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Base water
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.46, h * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Abyss core
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.12, h * 0.09, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#082f49';
      ctx.fill();

      // Spiral arms
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      const arms = 4;
      for (let i = 0; i < arms; i++) {
        const baseAng = (Math.PI * 2 / arms) * i;
        ctx.beginPath();
        for (let step = 0; step <= 30; step++) {
          const t = step / 30;
          const rX = w * (0.42 * (1 - t) + 0.1 * t);
          const rY = h * (0.36 * (1 - t) + 0.08 * t);
          const ang = baseAng + t * Math.PI * 2.2;
          const px = cx + Math.cos(ang) * rX;
          const py = cy + Math.sin(ang) * rY;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Foam spray
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < arms; i++) {
        const baseAng = (Math.PI * 2 / arms) * i + Math.PI / 4;
        ctx.beginPath();
        for (let step = 0; step <= 15; step++) {
          const t = step / 15;
          const rX = w * (0.32 * (1 - t) + 0.14 * t);
          const rY = h * (0.28 * (1 - t) + 0.11 * t);
          const ang = baseAng + t * Math.PI * 1.4;
          const px = cx + Math.cos(ang) * rX;
          const py = cy + Math.sin(ang) * rY;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Boundary stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.46, h * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'sea_serpent_head',
    name: 'Sea Serpent Head',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters', groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#0f172a', fill = '#047857') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      // Sea waves
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.88);
      ctx.quadraticCurveTo(w * 0.3, h * 0.82, w * 0.5, h * 0.88);
      ctx.quadraticCurveTo(w * 0.7, h * 0.82, w * 0.9, h * 0.88);
      ctx.stroke();

      // Dorsal frill
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.86);
      ctx.lineTo(w * 0.14, h * 0.72);
      ctx.lineTo(w * 0.24, h * 0.68);
      ctx.lineTo(w * 0.16, h * 0.54);
      ctx.lineTo(w * 0.28, h * 0.48);
      ctx.lineTo(w * 0.22, h * 0.36);
      ctx.lineTo(w * 0.36, h * 0.36);
      ctx.lineTo(w * 0.38, h * 0.86);
      ctx.closePath();
      ctx.fill();

      // Head and neck body
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.86);
      ctx.quadraticCurveTo(w * 0.28, h * 0.52, w * 0.44, h * 0.34);
      ctx.lineTo(w * 0.56, h * 0.26);
      ctx.lineTo(w * 0.78, h * 0.28);
      ctx.lineTo(w * 0.58, h * 0.44);
      ctx.lineTo(w * 0.72, h * 0.52);
      ctx.lineTo(w * 0.48, h * 0.52);
      ctx.quadraticCurveTo(w * 0.44, h * 0.68, w * 0.52, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Mouth interior
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.44);
      ctx.lineTo(w * 0.74, h * 0.36);
      ctx.lineTo(w * 0.5, h * 0.48);
      ctx.closePath();
      ctx.fill();

      // Forked tongue
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.54, h * 0.46);
      ctx.lineTo(w * 0.82, h * 0.42);
      ctx.lineTo(w * 0.88, h * 0.38);
      ctx.moveTo(w * 0.82, h * 0.42);
      ctx.lineTo(w * 0.88, h * 0.46);
      ctx.stroke();

      // Fangs
      ctx.fillStyle = '#ffffff';
      const fangs = [
        { x1: 0.72, y1: 0.3, x2: 0.74, y2: 0.36, x3: 0.7, y3: 0.3 },
        { x1: 0.64, y1: 0.34, x2: 0.65, y2: 0.4, x3: 0.62, y3: 0.34 },
        { x1: 0.68, y1: 0.5, x2: 0.69, y2: 0.44, x3: 0.66, y3: 0.5 }
      ];
      for (const f of fangs) {
        ctx.beginPath();
        ctx.moveTo(w * f.x1, h * f.y1);
        ctx.lineTo(w * f.x2, h * f.y2);
        ctx.lineTo(w * f.x3, h * f.y3);
        ctx.closePath();
        ctx.fill();
      }

      // Eye
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w * 0.54, h * 0.33, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(w * 0.54, h * 0.33, w * 0.015, 0, Math.PI * 2);
      ctx.fill();

      // Inked outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.86);
      ctx.lineTo(w * 0.14, h * 0.72);
      ctx.lineTo(w * 0.24, h * 0.68);
      ctx.lineTo(w * 0.16, h * 0.54);
      ctx.lineTo(w * 0.28, h * 0.48);
      ctx.lineTo(w * 0.22, h * 0.36);
      ctx.lineTo(w * 0.36, h * 0.36);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.86);
      ctx.quadraticCurveTo(w * 0.28, h * 0.52, w * 0.44, h * 0.34);
      ctx.lineTo(w * 0.56, h * 0.26);
      ctx.lineTo(w * 0.78, h * 0.28);
      ctx.lineTo(w * 0.58, h * 0.44);
      ctx.lineTo(w * 0.72, h * 0.52);
      ctx.lineTo(w * 0.48, h * 0.52);
      ctx.quadraticCurveTo(w * 0.44, h * 0.68, w * 0.52, h * 0.86);
      ctx.stroke();

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL BATTLEMAP PROPS STAMPS
  // =========================================================================
  {
    id: 'prop_chest_wood',
    name: 'Dungeon Chest',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_chests', groupName: 'Chests & Containers',
    defaultScale: 0.9,
    aspect: 1.1,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.16, h * 0.34, w * 0.72, h * 0.5);

      // Wooden box
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.14, h * 0.38, w * 0.72, h * 0.42);

      // Curved lid
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.38);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, w * 0.86, h * 0.38);
      ctx.closePath();
      ctx.fillStyle = '#92400e';
      ctx.fill();

      // Iron strapping
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.18, h * 0.28, w * 0.08, h * 0.52);
      ctx.fillRect(w * 0.46, h * 0.25, w * 0.08, h * 0.55);
      ctx.fillRect(w * 0.74, h * 0.28, w * 0.08, h * 0.52);

      // Padlock
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.47, h * 0.42, w * 0.06, h * 0.1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(w * 0.495, h * 0.45, w * 0.012, h * 0.04);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.38);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, w * 0.86, h * 0.38);
      ctx.stroke();

      ctx.strokeRect(w * 0.14, h * 0.38, w * 0.72, h * 0.42);
      ctx.strokeRect(w * 0.18, h * 0.28, w * 0.08, h * 0.52);
      ctx.strokeRect(w * 0.46, h * 0.25, w * 0.08, h * 0.55);
      ctx.strokeRect(w * 0.74, h * 0.28, w * 0.08, h * 0.52);

      // Rivets
      ctx.fillStyle = '#cbd5e1';
      const rivetY = [0.32, 0.48, 0.65, 0.74];
      for (const ry of rivetY) {
        ctx.beginPath();
        ctx.arc(w * 0.22, h * ry, w * 0.012, 0, Math.PI * 2);
        ctx.arc(w * 0.78, h * ry, w * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_stack',
    name: 'Barrel Stack',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_storage', groupName: 'Barrels & Crates',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Contact shadow
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.88, w * 0.44, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      const drawBarrel = (bx, by, bw, bh) => {
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, by);
        ctx.lineTo(bx + bw * 0.85, by);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.15, by + bh);
        ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.5, bx + bw * 0.15, by);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.5, by);
        ctx.lineTo(bx + bw * 0.85, by);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.5, by + bh);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + bw * 0.1, by + bh * 0.12, bw * 0.8, bh * 0.08);
        ctx.fillRect(bx + bw * 0.04, by + bh * 0.38, bw * 0.92, bh * 0.08);
        ctx.fillRect(bx + bw * 0.04, by + bh * 0.54, bw * 0.92, bh * 0.08);
        ctx.fillRect(bx + bw * 0.1, by + bh * 0.8, bw * 0.8, bh * 0.08);

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(bx + bw * 0.45, by + bh * 0.47, bw * 0.04, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, by);
        ctx.lineTo(bx + bw * 0.85, by);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.15, by + bh);
        ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.5, bx + bw * 0.15, by);
        ctx.closePath();
        ctx.stroke();
      };

      drawBarrel(w * 0.08, h * 0.46, w * 0.4, h * 0.4);
      drawBarrel(w * 0.52, h * 0.46, w * 0.4, h * 0.4);
      drawBarrel(w * 0.3, h * 0.14, w * 0.4, h * 0.4);

      ctx.restore();
    }
  },
  {
    id: 'prop_altar_stone',
    name: 'Ritual Stone Altar',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_altars', groupName: 'Altars & Shrines',
    defaultScale: 1.1,
    aspect: 1.4,
    render: (ctx, size, color = '#1c1917', fill = '#64748b') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(w * 0.12, h * 0.46, w * 0.76, h * 0.44);

      // Bottom plinth
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.15, h * 0.76, w * 0.7, h * 0.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.15, h * 0.76, w * 0.7, h * 0.1);

      // Altar block
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.2, h * 0.46, w * 0.6, h * 0.3);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(w * 0.5, h * 0.46, w * 0.3, h * 0.3);
      ctx.strokeStyle = color;
      ctx.strokeRect(w * 0.2, h * 0.46, w * 0.6, h * 0.3);

      // Slab table top
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(w * 0.14, h * 0.38, w * 0.72, h * 0.08);
      ctx.strokeRect(w * 0.14, h * 0.38, w * 0.72, h * 0.08);

      // Crimson cloth runner
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(w * 0.42, h * 0.38, w * 0.16, h * 0.4);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.42, h * 0.76, w * 0.16, h * 0.02);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.strokeRect(w * 0.42, h * 0.38, w * 0.16, h * 0.4);

      // Carved rune
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.58, w * 0.035, 0, Math.PI * 2);
      ctx.moveTo(w * 0.48, h * 0.54);
      ctx.lineTo(w * 0.52, h * 0.62);
      ctx.stroke();

      // Candlesticks with flames
      const candles = [0.22, 0.74];
      for (const cx of candles) {
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(w * (cx - 0.02), h * 0.32, w * 0.04, h * 0.06);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(w * (cx - 0.01), h * 0.24, w * 0.02, h * 0.08);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(w * cx, h * 0.16);
        ctx.quadraticCurveTo(w * (cx + 0.02), h * 0.22, w * cx, h * 0.24);
        ctx.quadraticCurveTo(w * (cx - 0.02), h * 0.22, w * cx, h * 0.16);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'prop_bookshelf',
    name: 'Library Bookshelf',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_shelves', groupName: 'Bookshelves & Storage',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.14, h * 0.18, w * 0.74, h * 0.74);

      // Bookcase frame
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.12, h * 0.14, w * 0.76, h * 0.74);

      // Interior backing
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(w * 0.18, h * 0.18, w * 0.64, h * 0.66);

      // Top shelf books
      const topBooks = [
        { x: 0.2, w: 0.04, h: 0.16, color: '#dc2626' },
        { x: 0.24, w: 0.05, h: 0.18, color: '#2563eb' },
        { x: 0.29, w: 0.04, h: 0.15, color: '#16a34a' },
        { x: 0.33, w: 0.06, h: 0.17, color: '#ca8a04' },
        { x: 0.39, w: 0.04, h: 0.14, color: '#9333ea' },
        { x: 0.43, w: 0.05, h: 0.18, color: '#ea580c' },
        { x: 0.48, w: 0.05, h: 0.16, color: '#0284c7' }
      ];
      for (const b of topBooks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * (0.38 - b.h), w * b.w, h * b.h);
      }

      // Middle shelf books & scrolls
      const midBooks = [
        { x: 0.2, w: 0.05, h: 0.17, color: '#b91c1c' },
        { x: 0.25, w: 0.06, h: 0.16, color: '#0d9488' },
        { x: 0.31, w: 0.04, h: 0.18, color: '#d97706' }
      ];
      for (const b of midBooks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * (0.6 - b.h), w * b.w, h * b.h);
      }
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.52, h * 0.54, w * 0.24, h * 0.05);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(w * 0.55, h * 0.49, w * 0.18, h * 0.05);

      // Bottom shelf books & flask
      const botBooks = [
        { x: 0.2, w: 0.07, h: 0.18, color: '#4338ca' },
        { x: 0.27, w: 0.06, h: 0.17, color: '#059669' },
        { x: 0.33, w: 0.08, h: 0.19, color: '#7c2d12' }
      ];
      for (const b of botBooks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * (0.84 - b.h), w * b.w, h * b.h);
      }
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(w * 0.68, h * 0.77, w * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.665, h * 0.7, w * 0.03, h * 0.04);

      // Wooden dividers
      ctx.fillStyle = '#92400e';
      ctx.fillRect(w * 0.16, h * 0.38, w * 0.68, h * 0.04);
      ctx.fillRect(w * 0.16, h * 0.6, w * 0.68, h * 0.04);
      ctx.fillRect(w * 0.16, h * 0.84, w * 0.68, h * 0.04);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.strokeRect(w * 0.12, h * 0.14, w * 0.76, h * 0.74);
      ctx.strokeRect(w * 0.16, h * 0.38, w * 0.68, h * 0.04);
      ctx.strokeRect(w * 0.16, h * 0.6, w * 0.68, h * 0.04);
      ctx.strokeRect(w * 0.16, h * 0.84, w * 0.68, h * 0.04);

      // Crown molding
      ctx.fillStyle = '#b45309';
      ctx.fillRect(w * 0.1, h * 0.11, w * 0.8, h * 0.04);
      ctx.strokeRect(w * 0.1, h * 0.11, w * 0.8, h * 0.04);

      ctx.restore();
    }
  }
].concat(EXTRA_STAMPS);

// The viewing direction the original art of a directional stamp shows. Its extra views (stamps/views*.js) carry
// `family: <this id>` and their own `view`, and always sit in this stamp's group.
const BASE_VIEWS = {
  bridge_stone: 'diag', camp_tent: 'diag', castle_citadel: 'diag',
  civ_lighthouse: 'diag', civ_temple: 'diag', dungeon_door_wooden: 'top',
  dungeon_pillar: 'top', dungeon_stairs_down: 'top', dungeon_wall_block: 'top',
  farm_homestead: 'diag', fortress_keep: 'diag', hills_dunes: 'side',
  hills_rolling: 'side', mountain_grand: 'side', mountain_mesa: 'side',
  mountain_range: 'side', mountain_snow_peak: 'side', mountain_volcano: 'side',
  nautical_kraken: 'top', port_dock: 'diag', prop_altar_stone: 'diag',
  prop_barrel_crate: 'top', prop_barrel_stack: 'side', prop_bookshelf: 'front',
  prop_chest_treasure: 'diag', prop_chest_wood: 'diag', prop_table_tavern: 'top',
  prop_throne_royal: 'front', ruined_tower: 'diag', sea_serpent: 'side',
  sea_serpent_head: 'side', ship_caravel: 'side', ship_galleon: 'side',
  token_hero_mage: 'top', token_hero_rogue: 'top', token_hero_warrior: 'top',
  token_monster_dragon: 'top', tower_wizard: 'diag', veg_log_fallen: 'diag',
  veg_stump: 'top', village_houses: 'diag', volcano_lite: 'side',
  windmill: 'diag', windmill_rustic: 'diag',
};
const baseById = new Map(STAMPS.map((s) => [s.id, s]));
for (const [id, view] of Object.entries(BASE_VIEWS)) {
  const b = baseById.get(id);
  if (b) { b.family = id; b.view = view; }
}
for (const s of STAMPS) {
  const b = s.family && s.family !== s.id ? baseById.get(s.family) : null;
  if (b) {
    s.group = b.group; s.groupName = b.groupName; s.category = b.category;
    if (s.view === 'top') s.rotate = 'free'; // a plan view looks right at any angle, whatever the side view does
  }
}

let stampIndex = null;
export function getStampById(id) {
  if (!stampIndex) stampIndex = new Map(STAMPS.map((s) => [s.id, s]));
  return stampIndex.get(id);
}

/** Plugin packs: swaps the plugin stamps and their categories in place (see src/plugins/registry.js). */
export function syncPluginStamps(stamps, categories) {
  for (let i = STAMPS.length - 1; i >= 0; i--) if (STAMPS[i].plugin) STAMPS.splice(i, 1);
  for (let i = STAMP_CATEGORIES.length - 1; i >= 0; i--) if (STAMP_CATEGORIES[i].type === 'plugin') STAMP_CATEGORIES.splice(i, 1);
  STAMPS.push(...stamps);
  STAMP_CATEGORIES.push(...categories);
  stampIndex = null;
}
