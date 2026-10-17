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

export { inkRng, inkPoly, inkShadow, inkStroke, inkHatch, inkPeak, inkVolcano, inkMound, inkRock, inkSlab };
