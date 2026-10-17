// Tree stamps: hand-inked fantasy-map style. One confident ink line around the WHOLE silhouette
// (every part is inked first, then all parts are painted over it, so inner seams carry no ink),
// foliage in scalloped clumps lit from the upper-left, trunks that run up into the crown, a soft
// contact shadow, and per-seed variation (shape, lean, tint) so groves never look stamped.
// Everything draws in a 0..s box with the ground at ~0.9s. Deterministic (seeded PRNG only).

const TAU = Math.PI * 2;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// base = the stamp's own design seed, seed = per-instance seed from the renderer.
const vrng = (base, seed) => rng((Math.imul(base | 0, 2654435761) ^ Math.imul(Math.floor((Number(seed) || 0) * 997) | 0, 40503)) >>> 0);

const rgb = (h) => {
  const s = String(h || '');
  const r = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s);
  if (r) return [+r[1], +r[2], +r[3]];
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (!m) return [92, 138, 72];
  let x = m[1];
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(x.substr(i, 2), 16));
};
const hex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
// Shade ramp from one base tint; shadows lean cool/violet, lights lean warm.
const ramp = (b) => ({
  deep: mix(mix(b, '#0c1810', 0.6), '#2a1a3a', 0.15),
  dark: mix(mix(b, '#13261a', 0.38), '#2a1a3a', 0.1),
  mid: hex(rgb(b)),
  light: mix(b, '#f4ee96', 0.3),
  hi: mix(b, '#fffbd2', 0.58),
});
const vary = (f, v) => { const t = v() - 0.5; return t > 0 ? mix(f, '#bdb446', t * 0.32) : mix(f, '#285a4c', -t * 0.32); };
const BARK = { dark: '#4a3220', mid: '#7a5634', light: '#a88052' };
const FOLIAGE = '#5c8a48';
const LW = (s) => Math.max(1, s * 0.026);

// ---------------------------------------------------------------- core
// A part inks itself (outline pass) and paints itself (colour pass).
const fillPart = (p, paint) => ({ ink: (c, lw) => { c.lineWidth = 2 * lw; c.stroke(p); c.fill(p); }, paint: (c, lw) => paint(c, p, lw) });
const limbPart = (p, w, B = BARK) => ({
  ink: (c, lw) => { c.lineWidth = w + 2 * lw; c.stroke(p); },
  paint: (c) => {
    c.lineWidth = w; c.strokeStyle = B.mid; c.stroke(p);
    c.translate(-w * 0.18, -w * 0.05); c.lineWidth = w * 0.32; c.strokeStyle = B.light; c.stroke(p);
  },
});
function drawTree(ctx, s, ink, parts) {
  const lw = LW(s);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = ink; ctx.fillStyle = ink;
  for (const q of parts) q.ink(ctx, lw);
  for (const q of parts) { ctx.save(); q.paint(ctx, lw); ctx.restore(); }
  ctx.restore();
}

let SHADOW_OFF = false;
function groundShadow(ctx, s, cx = 0.5, cy = 0.9, rx = 0.3, ry = 0.06) {
  if (SHADOW_OFF) return;
  ctx.save();
  ctx.translate((cx + 0.05) * s, (cy + 0.01) * s);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * s * 1.1);
  g.addColorStop(0, 'rgba(28,22,10,0.32)');
  g.addColorStop(0.6, 'rgba(28,22,10,0.24)');
  g.addColorStop(1, 'rgba(28,22,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, rx * s * 1.1, 0, TAU); ctx.fill();
  ctx.restore();
}

// Scalloped (leafy-edged) blob.
function scallop(x, y, r, n, rnd, sq = 0.9) {
  const p = new Path2D();
  const a0 = rnd() * TAU, pts = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU, rr = r * (0.88 + rnd() * 0.12); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * sq]); }
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const B = pts[(i + 1) % n], am = a0 + ((i + 0.5) / n) * TAU;
    p.quadraticCurveTo(x + Math.cos(am) * r * 1.2, y + Math.sin(am) * r * 1.2 * sq, B[0], B[1]);
  }
  p.closePath();
  return p;
}

// One foliage clump: shadow body, lit mass shifted up-left, warm highlight, leaf ticks.
function clump(x, y, r, P, rnd, sq = 0.9) {
  const n = r > 14 ? 9 : 7;
  const p = scallop(x, y, r, n, rnd, sq);
  const body = scallop(x - r * 0.14, y - r * 0.2, r * 0.84, n, rnd, sq);
  const lit = scallop(x - r * 0.3, y - r * 0.36, r * 0.48, 6, rnd, sq);
  const ticks = [];
  for (let i = 0; i < 4; i++) { const a = rnd() * TAU, d = (0.25 + rnd() * 0.45) * r; ticks.push([x + Math.cos(a) * d, y + Math.sin(a) * d * sq, i < 2]); }
  return fillPart(p, (c, pp, lw) => {
    c.fillStyle = P.dark; c.fill(pp);
    c.clip(pp);
    c.fillStyle = P.mid; c.fill(body);
    c.fillStyle = P.light; c.fill(lit);
    if (r > 7) {
      c.lineWidth = Math.max(0.7, lw * 0.5);
      for (const [tx, ty, hi] of ticks) {
        c.strokeStyle = hi ? P.dark : P.light;
        c.beginPath(); c.arc(tx, ty, r * 0.14, hi ? 0.15 * Math.PI : 1.15 * Math.PI, hi ? 0.85 * Math.PI : 1.85 * Math.PI); c.stroke();
      }
    }
    c.strokeStyle = P.deep; c.lineWidth = lw * 1.1; c.stroke(pp); // soft seam between clumps, not ink
  });
}

// Crown from a layout of [x, y, r(, paletteIndex)] in box units, jittered per seed.
function crown(s, layout, pals, v, { dx = 0, sx = 1, sy = 1, cx = 0.5, cy = 0.4, jit = 0.022, sq = 0.9 } = {}) {
  const ys = layout.map((l) => l[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return layout
    .map(([x, y, r, k]) => [cx + (x - cx) * sx + dx + (v() - 0.5) * jit * 2, cy + (y - cy) * sy + (v() - 0.5) * jit * 2, r * (0.9 + v() * 0.2), k])
    .sort((a, b) => a[1] - b[1])
    .map(([x, y, r, k]) => {
      const pal = Array.isArray(pals) ? pals[k ?? Math.floor(v() * pals.length)] : pals;
      const t = y1 > y0 ? (y - y0) / (y1 - y0) : 0.5;
      return clump(x * s, y * s, r * s, t < 0.34 ? pal.top : t > 0.7 ? pal.bot : pal.mid, v, sq);
    });
}
const tiers3 = (f) => ({ top: ramp(mix(f, '#eee68a', 0.12)), mid: ramp(f), bot: ramp(mix(f, '#1a3020', 0.16)) });

// Tapered trunk with root flare, lit left, shaded right, darkened where the crown overhangs it.
function trunk(s, { x = 0.5, top = 0.5, bot = 0.9, wt = 0.07, wb = 0.09, flare = 0.04, lean = 0, B = BARK, lines = true }) {
  const P = (v) => v * s, p = new Path2D();
  p.moveTo(P(x + lean - wt / 2), P(top));
  p.quadraticCurveTo(P(x + lean * 0.5 - wb / 2), P((top + bot) / 2), P(x - wb / 2 - flare), P(bot));
  p.quadraticCurveTo(P(x), P(bot - 0.02), P(x + wb / 2 + flare), P(bot));
  p.quadraticCurveTo(P(x + lean * 0.5 + wb / 2), P((top + bot) / 2), P(x + lean + wt / 2), P(top));
  p.closePath();
  return fillPart(p, (c, pp, lw) => {
    c.fillStyle = B.mid; c.fill(pp); c.clip(pp);
    c.fillStyle = B.dark; c.fillRect(P(x + lean * 0.5 + wb * 0.1), 0, s, s);
    c.fillStyle = B.light; c.fillRect(0, 0, P(x + lean * 0.5 - wb * 0.24), s);
    if (lines && s > 30) {
      c.strokeStyle = B.dark; c.lineWidth = Math.max(0.6, lw * 0.4);
      for (const d of [-0.18, 0.2]) { c.beginPath(); c.moveTo(P(x + lean + d * wt), P(top + 0.04)); c.lineTo(P(x + d * wb * 1.3), P(bot - 0.02)); c.stroke(); }
    }
    c.fillStyle = 'rgba(20,14,8,0.4)'; c.fillRect(0, P(top), s, P(0.08));
  });
}
const limb = (s, x0, y0, cx, cy, x1, y1, w, B) => {
  const p = new Path2D(); p.moveTo(x0 * s, y0 * s); p.quadraticCurveTo(cx * s, cy * s, x1 * s, y1 * s);
  return limbPart(p, w * s, B);
};

// ---------------------------------------------------------------- broadleaf
const LAYOUTS = {
  oak: [[.5, .2, .15], [.31, .27, .14], [.69, .26, .14], [.18, .42, .12], [.82, .41, .12], [.5, .36, .17], [.35, .5, .14], [.65, .5, .14], [.5, .56, .11]],
  ancient: [[.5, .16, .14], [.33, .22, .14], [.68, .22, .14], [.18, .36, .14], [.83, .36, .14], [.42, .34, .16], [.6, .34, .16], [.26, .5, .13], [.74, .5, .13], [.5, .5, .14]],
  round: [[.5, .17, .17], [.33, .27, .15], [.68, .26, .15], [.26, .44, .14], [.74, .43, .14], [.5, .36, .19], [.38, .56, .12], [.62, .57, .12]],
  tall: [[.5, .1, .12], [.36, .2, .12], [.64, .19, .12], [.33, .34, .12], [.67, .34, .12], [.5, .3, .14], [.42, .46, .11], [.58, .47, .11]],
  bush: [[.3, .66, .15], [.7, .66, .15], [.5, .56, .19], [.4, .72, .13], [.62, .72, .13], [.2, .75, .1], [.8, .75, .1]],
};
const TRUNKS = {
  oak: { top: 0.5, wt: 0.075, wb: 0.1 },
  ancient: { top: 0.48, wt: 0.12, wb: 0.15, flare: 0.07 },
  round: { top: 0.56, wt: 0.08, wb: 0.1, flare: 0.045 },
  tall: { top: 0.46, wt: 0.055, wb: 0.075, flare: 0.035 },
};

function broadleaf(ctx, s, color, fill, kind, base, seed) {
  const v = vrng(base, seed);
  const pals = tiers3(vary(fill, v));
  const sx = 0.9 + v() * 0.18, sy = 0.94 + v() * 0.1, dx = (v() - 0.5) * 0.05;
  ctx.save();
  if (kind === 'bush') {
    groundShadow(ctx, s, 0.5, 0.86, 0.36, 0.06);
    drawTree(ctx, s, color, crown(s, LAYOUTS.bush, pals, v, { sx, cy: 0.7, dx: dx * 0.5 }));
  } else {
    const T = TRUNKS[kind], anc = kind === 'ancient';
    groundShadow(ctx, s, 0.5, 0.9, anc ? 0.36 : 0.3, 0.065);
    const top = T.top, fy = top + 0.08;
    const parts = [
      trunk(s, { ...T, lean: dx * 0.8 }),
      limb(s, 0.5 + dx * 0.4, fy, 0.42 + dx, top - 0.02, 0.32 + dx, top - 0.1, T.wt * 0.55),
      limb(s, 0.5 + dx * 0.4, fy, 0.6 + dx, top - 0.01, 0.68 + dx, top - 0.11, T.wt * 0.5),
      ...crown(s, LAYOUTS[kind], pals, v, { sx, sy, dx, cy: top - 0.15 }),
    ];
    drawTree(ctx, s, color, parts);
    if (anc) { // hanging moss
      ctx.strokeStyle = pals.bot.light; ctx.lineWidth = Math.max(0.8, s * 0.012); ctx.lineCap = 'round';
      for (const x of [0.28, 0.37, 0.63, 0.72]) {
        ctx.beginPath(); ctx.moveTo(x * s, 0.6 * s); ctx.quadraticCurveTo((x + 0.01) * s, 0.66 * s, (x - 0.01) * s, (0.68 + v() * 0.05) * s); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function autumn(ctx, s, color, base, seed, hues) {
  const v = vrng(base, seed);
  const pals = hues.map((h) => tiers3(vary(h, v)));
  const sx = 0.9 + v() * 0.18, dx = (v() - 0.5) * 0.05;
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.065);
  for (let i = 0; i < 7; i++) { // fallen leaves under the shadow
    ctx.fillStyle = pals[i % pals.length].mid.mid;
    ctx.beginPath(); ctx.ellipse((0.2 + v() * 0.62) * s, (0.87 + v() * 0.07) * s, s * 0.016, s * 0.009, v() * 3, 0, TAU); ctx.fill();
  }
  const T = TRUNKS.oak;
  drawTree(ctx, s, color, [
    trunk(s, { ...T, lean: dx * 0.8 }),
    limb(s, 0.5, 0.58, 0.42 + dx, 0.48, 0.32 + dx, 0.4, 0.04),
    limb(s, 0.5, 0.58, 0.6 + dx, 0.49, 0.68 + dx, 0.39, 0.035),
    ...crown(s, LAYOUTS.oak, pals, v, { sx, dx, cy: 0.35 }),
  ]);
  ctx.restore();
}

// ---------------------------------------------------------------- conifers
function tierPath(s, cx, top, bot, hw, teeth, v) {
  const p = new Path2D();
  p.moveTo(cx * s, top * s);
  p.quadraticCurveTo((cx + hw * 0.4) * s, (top + (bot - top) * 0.6) * s, (cx + hw) * s, bot * s);
  for (let i = 1; i < teeth * 2; i++) {
    const x = cx + hw - (2 * hw * i) / (teeth * 2);
    const y = bot - (i % 2 ? (bot - top) * (0.16 + v() * 0.06) : (v() - 0.5) * 0.012);
    p.lineTo(x * s, y * s);
  }
  p.lineTo((cx - hw) * s, bot * s);
  p.quadraticCurveTo((cx - hw * 0.4) * s, (top + (bot - top) * 0.6) * s, cx * s, top * s);
  p.closePath();
  return p;
}

function conifer(ctx, s, color, fill, { seed: base, tiers = 4, hw = 0.26, top = 0.06, bot = 0.8, teeth = 3, snow = false, slim = 0.5, tr = 0.07 }, seed) {
  const v = vrng(base, seed);
  tiers = Math.max(2, tiers + Math.floor(v() * 3) - 1);
  hw *= 0.9 + v() * 0.2;
  top += v() * 0.05;
  const lean = (v() - 0.5) * 0.12;
  const P = ramp(vary(fill, v));
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, hw + 0.05, 0.055);
  ctx.translate(0.5 * s, 0.9 * s); ctx.rotate(lean); ctx.translate(-0.5 * s, -0.9 * s);
  const parts = [trunk(s, { top: bot - 0.12, bot: 0.9, wt: tr * 0.8, wb: tr, flare: 0.03, lines: false })];
  const geo = [];
  for (let i = 0; i < tiers; i++) {
    const tt = top + (bot - top) * (i / tiers) * 0.9;
    const bb = top + (bot - top) * Math.min(1, (i + 1.5) / (tiers + 0.5));
    const w = hw * (slim + (1 - slim) * ((i + 1) / tiers));
    geo.push([tt, bb, w, tierPath(s, 0.5, tt, bb, w, teeth + (i > 1 && teeth > 2 ? 1 : 0), v)]);
  }
  for (let i = tiers - 1; i >= 0; i--) { // bottom tier first, upper tiers overlap it
    const [tt, bb, w, p] = geo[i], above = i > 0 ? geo[i - 1][3] : null;
    parts.push(fillPart(p, (c, pp, lw) => {
      c.fillStyle = P.mid; c.fill(pp); c.clip(pp);
      c.fillStyle = P.dark;
      c.beginPath(); c.moveTo(0.5 * s, tt * s); c.lineTo((0.5 + w * 1.3) * s, (bb + 0.02) * s); c.lineTo((0.5 + w * 0.15) * s, (bb + 0.02) * s); c.fill();
      c.fillStyle = P.light;
      c.beginPath(); c.moveTo(0.49 * s, tt * s); c.lineTo((0.5 - w * 1.2) * s, (bb + 0.01) * s); c.lineTo((0.5 - w * 0.35) * s, (bb + 0.01) * s); c.fill();
      if (s > 30) { // needle strokes
        c.strokeStyle = P.dark; c.lineWidth = Math.max(0.6, lw * 0.4);
        for (let k = 0; k < 3; k++) {
          const y = tt + (bb - tt) * (0.45 + k * 0.17), ww = w * ((y - tt) / (bb - tt)) * 0.7;
          c.beginPath(); c.moveTo((0.5 - ww) * s, y * s); c.quadraticCurveTo(0.5 * s, (y + 0.03) * s, (0.5 + ww) * s, y * s); c.stroke();
        }
      }
      if (snow) {
        const sy = tt + (bb - tt) * 0.5;
        c.fillStyle = '#f3f7fb';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(s, 0); c.lineTo(s, sy * s);
        for (let k = 0; k <= 6; k++) { const x = 0.5 + w * 1.2 - (2.4 * w * k) / 6; c.quadraticCurveTo((x + w * 0.2) * s, (sy + 0.05) * s, x * s, (sy + (k % 2 ? 0.01 : -0.01)) * s); }
        c.lineTo(0, sy * s); c.closePath(); c.fill();
        c.fillStyle = 'rgba(140,165,200,0.6)';
        c.beginPath(); c.moveTo(0.5 * s, tt * s); c.lineTo(s, tt * s); c.lineTo(s, (sy + 0.05) * s); c.lineTo((0.5 + w * 0.1) * s, (sy + 0.04) * s); c.fill();
      }
      if (above) { c.translate(0, s * 0.03); c.fillStyle = 'rgba(12,24,16,0.4)'; c.fill(above); } // cast by the tier above
    }));
  }
  drawTree(ctx, s, color, parts);
  ctx.restore();
}

// ---------------------------------------------------------------- willow / birch
function willow(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  const f = vary(fill, v), pals = tiers3(f), P = ramp(f);
  const dx = (v() - 0.5) * 0.05;
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.36, 0.06);
  const parts = [trunk(s, { top: 0.42, bot: 0.9, wt: 0.07, wb: 0.1, flare: 0.05, lean: dx })];
  parts.push(...crown(s, [[.5, .18, .16], [.3, .27, .14], [.7, .27, .14], [.4, .34, .13], [.6, .34, .13], [.18, .38, .1], [.82, .38, .1]], pals, v, { dx, cy: 0.28 }));
  for (let i = 0; i < 11; i++) { // drooping curtains hang in front of the crown
    const x = 0.14 + i * 0.072 + (v() - 0.5) * 0.02 + dx, e = Math.abs(x - 0.5);
    const y0 = 0.3 + e * 0.25, len = 0.28 + v() * 0.14 - e * 0.25, sway = (v() - 0.5) * 0.04;
    const p = new Path2D();
    p.moveTo(x * s, y0 * s);
    p.bezierCurveTo((x + sway) * s, (y0 + len * 0.4) * s, (x - sway + (x < 0.5 ? -0.02 : 0.02)) * s, (y0 + len * 0.75) * s, (x + sway * 0.5) * s, (y0 + len) * s);
    const col = x < 0.45 ? P.light : x > 0.6 ? P.dark : P.mid;
    parts.push({ ink: (c, lw) => { c.lineWidth = s * 0.026 + 2 * lw; c.stroke(p); }, paint: (c) => { c.lineWidth = s * 0.026; c.strokeStyle = col; c.stroke(p); } });
  }
  drawTree(ctx, s, color, parts);
  ctx.restore();
}

function birch(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  const pals = tiers3(vary(mix(fill, '#c8d870', 0.25), v));
  const W = { dark: '#9ea4a6', mid: '#e6e3d8', light: '#fbf9f0' };
  const dx = (v() - 0.5) * 0.05;
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.24, 0.05);
  const tk = trunk(s, { top: 0.38, bot: 0.9, wt: 0.045, wb: 0.065, flare: 0.025, B: W, lines: false, lean: dx });
  const marks = [];
  for (let i = 0; i < 7; i++) marks.push([0.47 + (v() - 0.5) * 0.02 + dx * (0.9 - (0.5 + i * 0.055)) / 0.5, 0.5 + i * 0.055, 0.02 + v() * 0.025]);
  const paintT = tk.paint;
  tk.paint = (c, lw) => { paintT(c, lw); c.fillStyle = '#2b2622'; for (const [x, y, w] of marks) c.fillRect(x * s, y * s, w * s, s * 0.011); };
  drawTree(ctx, s, color, [
    tk,
    limb(s, 0.5 + dx * 0.5, 0.5, 0.42, 0.42, 0.36 + dx, 0.34, 0.022, W),
    limb(s, 0.5 + dx * 0.5, 0.46, 0.58, 0.38, 0.65 + dx, 0.3, 0.02, W),
    ...crown(s, [[.5, .12, .11], [.37, .22, .11], [.64, .2, .11], [.5, .28, .12], [.3, .36, .09], [.7, .35, .09], [.45, .4, .08], [.58, .41, .08]], pals, v, { dx, cy: 0.26 }),
  ]);
  ctx.restore();
}

// ---------------------------------------------------------------- palm / savanna
function frondPath(x0, y0, ang, L, w, droop, n = 10) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const x1 = x0 + dx * L, y1 = y0 + dy * L + droop * L;
  const cx = x0 + dx * L * 0.55, cy = y0 + dy * L * 0.55 - droop * L * 0.35;
  const left = [], right = [];
  for (let k = 1; k < n; k++) {
    const t = k / n, u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
    let tx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), ty = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
    const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
    const ww = w * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (k % 2 ? 1 : 0.6);
    left.push([px - ty * ww, py + tx * ww]); right.push([px + ty * ww * 0.85, py - tx * ww * 0.85]);
  }
  const p = new Path2D();
  p.moveTo(x0, y0);
  for (const q of left) p.lineTo(q[0], q[1]);
  p.lineTo(x1, y1);
  for (const q of right.reverse()) p.lineTo(q[0], q[1]);
  p.closePath();
  const spine = new Path2D(); spine.moveTo(x0, y0); spine.quadraticCurveTo(cx, cy, x1, y1);
  return { p, spine };
}
function frond(x0, y0, ang, L, w, droop, P, lit) {
  const { p, spine } = frondPath(x0, y0, ang, L, w, droop);
  return fillPart(p, (c, pp, lw) => {
    c.fillStyle = lit > 0.3 ? P.light : lit < -0.3 ? P.dark : P.mid; c.fill(pp);
    c.clip(pp);
    c.translate(w * 0.25, w * 0.3); c.fillStyle = 'rgba(15,30,15,0.28)'; c.fill(pp); c.translate(-w * 0.25, -w * 0.3);
    c.strokeStyle = lit > 0 ? P.hi : P.mid; c.lineWidth = Math.max(0.7, lw * 0.6); c.stroke(spine);
  });
}

function palm(ctx, s, color, fill, base, seed, lean = 0.08, coconuts = true) {
  const v = vrng(base, seed);
  const P = ramp(vary(fill, v));
  lean += (v() - 0.5) * 0.08;
  const bx = lean < -0.2 ? 0.66 : 0.46, tx = bx + lean, ty = (lean < -0.2 ? 0.38 : 0.32) + v() * 0.04;
  const cxp = bx + lean * 0.1, cyp = lean < -0.2 ? 0.76 : 0.62;
  const pt = (t) => { const u = 1 - t; return [u * u * bx + 2 * u * t * cxp + t * t * tx, u * u * 0.9 + 2 * u * t * cyp + t * t * ty]; };
  const L = [], R = [], N = 12;
  for (let i = 0; i <= N; i++) {
    const t = i / N, [x, y] = pt(t), [x2, y2] = pt(Math.min(1, t + 0.01)), [x0, y0] = pt(Math.max(0, t - 0.01));
    let nx = -(y2 - y0), ny = x2 - x0; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
    const w = (0.042 - t * 0.016 + (i === 0 ? 0.02 : 0)) * s;
    L.push([x * s - nx * w, y * s - ny * w]); R.push([x * s + nx * w, y * s + ny * w]);
  }
  const tp = new Path2D(); tp.moveTo(L[0][0], L[0][1]);
  for (const q of L) tp.lineTo(q[0], q[1]);
  for (const q of R.reverse()) tp.lineTo(q[0], q[1]);
  tp.closePath();
  const parts = [fillPart(tp, (c, pp, lw) => {
    c.fillStyle = BARK.mid; c.fill(pp); c.clip(pp);
    c.strokeStyle = BARK.dark; c.lineWidth = Math.max(0.7, lw * 0.6);
    for (let i = 1; i < N; i++) { const [x, y] = pt(i / N); c.beginPath(); c.moveTo((x - 0.05) * s, y * s); c.lineTo((x + 0.05) * s, (y + 0.02) * s); c.stroke(); }
    c.fillStyle = 'rgba(40,24,10,0.4)'; c.translate(s * 0.022, 0); c.fill(pp);
  })];
  const fr = [];
  for (const a of [-1.9, -1.25, -2.5, -0.65]) fr.push([a + (v() - 0.5) * 0.25, 0.24, 0.12]); // back/up
  for (const a of [-3.05, -0.1, 2.9, 0.25]) fr.push([a + (v() - 0.5) * 0.2, 0.3, 0.38]); // sides/front droop
  for (const [a, Lf, dr] of fr) parts.push(frond(tx * s, ty * s, a, (Lf + v() * 0.06) * s, s * 0.06, dr, P, -Math.cos(a) * 0.8 - Math.sin(a) * 0.4));
  if (coconuts) for (const [x, y] of [[-0.02, 0.04], [0.025, 0.045]]) {
    const p = new Path2D(); p.arc((tx + x) * s, (ty + y) * s, s * 0.024, 0, TAU);
    parts.push(fillPart(p, (c, pp) => { c.fillStyle = '#6b4a28'; c.fill(pp); c.clip(pp); c.fillStyle = '#8f6a3e'; c.beginPath(); c.arc((tx + x - 0.008) * s, (ty + y - 0.008) * s, s * 0.012, 0, TAU); c.fill(); }));
  }
  ctx.save();
  groundShadow(ctx, s, bx + 0.04, 0.9, 0.26, 0.05);
  drawTree(ctx, s, color, parts);
  ctx.restore();
}

function acacia(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  const pals = tiers3(vary(fill, v));
  const dx = (v() - 0.5) * 0.06;
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.38, 0.055);
  drawTree(ctx, s, color, [
    trunk(s, { top: 0.64, bot: 0.9, wt: 0.05, wb: 0.065, flare: 0.03, lean: dx * 0.3 }),
    limb(s, 0.5, 0.68, 0.38, 0.6, 0.27 + dx, 0.4, 0.035),
    limb(s, 0.5, 0.68, 0.62, 0.58, 0.72 + dx, 0.38, 0.035),
    limb(s, 0.5, 0.68, 0.5, 0.52, 0.5 + dx, 0.36, 0.028),
    ...crown(s, [[.15, .36, .1], [.85, .35, .1], [.3, .3, .13], [.7, .29, .13], [.5, .26, .14], [.4, .37, .11], [.6, .37, .11]], pals, v, { dx, sx: 0.95 + v() * 0.1, cy: 0.32, sq: 0.62 }),
  ]);
  ctx.restore();
}

function baobab(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  const pals = tiers3(vary(fill, v));
  const B = { dark: '#6e5238', mid: '#9a7a58', light: '#bc9c74' };
  const fat = 0.9 + v() * 0.2;
  const X = (x) => (0.5 + (x - 0.5) * fat) * s;
  const body = new Path2D();
  body.moveTo(0.46 * s, 0.32 * s);
  body.bezierCurveTo(0.44 * s, 0.5 * s, X(0.1), 0.6 * s, X(0.2), 0.9 * s);
  body.quadraticCurveTo(0.5 * s, 0.87 * s, X(0.8), 0.9 * s);
  body.bezierCurveTo(X(0.9), 0.6 * s, 0.56 * s, 0.5 * s, 0.54 * s, 0.32 * s);
  body.closePath();
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.36, 0.065);
  drawTree(ctx, s, color, [
    limb(s, 0.47, 0.36, 0.3, 0.32, 0.2, 0.25, 0.035, B),
    limb(s, 0.53, 0.36, 0.7, 0.32, 0.8, 0.25, 0.035, B),
    limb(s, 0.5, 0.35, 0.5, 0.25, 0.5, 0.17, 0.035, B),
    fillPart(body, (c, pp, lw) => {
      c.fillStyle = B.mid; c.fill(pp); c.clip(pp);
      c.fillStyle = B.dark; c.fillRect(0.56 * s, 0, s, s);
      c.fillStyle = B.light; c.fillRect(0, 0, 0.4 * s, s);
      c.strokeStyle = B.dark; c.lineWidth = Math.max(0.6, lw * 0.4);
      for (let i = 0; i < 6; i++) { const x = 0.3 + i * 0.08; c.beginPath(); c.moveTo((0.45 + (x - 0.5) * 0.3) * s, 0.42 * s); c.quadraticCurveTo(x * s, 0.66 * s, X(x + (x - 0.5) * 0.15), 0.89 * s); c.stroke(); }
    }),
    ...crown(s, [[.19, .24, .12], [.81, .24, .12], [.5, .15, .14], [.33, .24, .1], [.67, .24, .1]], pals, v, { cy: 0.22, sq: 0.75 }),
  ]);
  ctx.restore();
}

// ---------------------------------------------------------------- dead / gnarled
function bareSegs(v, x, y, a, len, w, depth, gnarl) {
  const segs = [];
  const grow = (x, y, a, len, w, d) => {
    const bend = (v() - 0.5) * (gnarl ? 0.9 : 0.5);
    const mx = x + Math.cos(a + bend * 0.5) * len * 0.5, my = y + Math.sin(a + bend * 0.5) * len * 0.5;
    const nx = mx + Math.cos(a + bend) * len * 0.5, ny = my + Math.sin(a + bend) * len * 0.5;
    segs.push([x, y, mx, my, nx, ny, w]);
    if (d <= 0) return;
    for (let i = 0; i < 2; i++) grow(nx, ny, a + bend + (i ? 1 : -1) * (0.4 + v() * 0.45), len * (0.64 + v() * 0.14), w * 0.66, d - 1);
    if (v() < 0.5 && d > 1) grow(mx, my, a + bend + (v() < 0.5 ? -1.1 : 1.1), len * 0.5, w * 0.5, d - 2);
  };
  grow(x, y, a, len, w, depth);
  return segs;
}
// All branch strokes as one part so joints have no seams.
function branchPart(s, segs, B) {
  const stroke = (c, col, k, add, off) => {
    c.strokeStyle = col;
    for (const [x, y, mx, my, nx, ny, sw] of segs) {
      const dx = -sw * s * off;
      c.lineWidth = Math.max(sw * s * k + add, 0.8);
      c.beginPath(); c.moveTo(x * s + dx, y * s); c.quadraticCurveTo(mx * s + dx, my * s, nx * s + dx, ny * s); c.stroke();
    }
  };
  return { ink: (c, lw) => stroke(c, c.strokeStyle, 1, 2 * lw, 0), paint: (c) => { stroke(c, B.dark, 1, 0, 0); stroke(c, B.mid, 0.6, 0, 0.14); stroke(c, B.light, 0.22, 0, 0.26); } };
}

function bare(ctx, s, color, base, seed, { gnarl = false, depth = 4, barren = false }) {
  const v = vrng(base, seed);
  const segs = bareSegs(v, 0.5, 0.9, -Math.PI / 2 + (v() - 0.5) * 0.2 + (gnarl ? 0.1 : 0), (gnarl ? 0.28 : 0.25) * (0.9 + v() * 0.15), gnarl ? 0.1 : 0.075, depth, gnarl);
  const B = barren ? { dark: '#4e4436', mid: '#7e6c54', light: '#a8967a' } : BARK;
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, barren ? 0.28 : 0.24, 0.05);
  const rp = new Path2D(); // root flare
  rp.moveTo(0.4 * s, 0.91 * s); rp.quadraticCurveTo(0.47 * s, 0.86 * s, 0.47 * s, 0.8 * s); rp.lineTo(0.53 * s, 0.8 * s); rp.quadraticCurveTo(0.53 * s, 0.86 * s, 0.61 * s, 0.91 * s); rp.closePath();
  drawTree(ctx, s, color, [
    fillPart(rp, (c, pp) => { c.fillStyle = B.mid; c.fill(pp); c.clip(pp); c.fillStyle = B.dark; c.fillRect(0.51 * s, 0, s, s); }),
    branchPart(s, segs, B),
  ]);
  if (gnarl) {
    ctx.fillStyle = '#1e1510';
    ctx.beginPath(); ctx.ellipse(0.5 * s, 0.76 * s, s * 0.02, s * 0.036, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- fantasy
function sparkle(ctx, x, y, r, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
function glow(ctx, x, y, r, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function crystalTree(ctx, s, color, base, seed) {
  const v = vrng(base, seed);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.06);
  glow(ctx, 0.5 * s, 0.4 * s, 0.4 * s, 'rgba(150,230,255,0.35)');
  const parts = [trunk(s, { top: 0.5, bot: 0.9, wt: 0.05, wb: 0.085, flare: 0.05, B: { dark: '#3a2e52', mid: '#5a4a78', light: '#7e6ea0' } })];
  const shards = [[.22, .6, .07, .1], [.8, .58, .07, .11], [.33, .52, .1, .15], [.68, .5, .1, .17], [.42, .5, .1, .2], [.6, .5, .1, .19], [.5, .46, .14, .22]];
  for (const [x0, y, w, h0] of shards) {
    const x = x0 + (v() - 0.5) * 0.03, h = h0 * (0.85 + v() * 0.3);
    const X = x * s, Y = y * s, W = w * s, H = h * s;
    const top = [X + (v() - 0.5) * W * 0.4, Y - H * 1.9], L = [X - W, Y - H * 0.5], Bt = [X - W * 0.2, Y + H * 0.4], R = [X + W, Y - H * 0.4], C = [X - W * 0.2, Y - H * 0.7];
    const p = new Path2D(); p.moveTo(...top); p.lineTo(...L); p.lineTo(...Bt); p.lineTo(...R); p.closePath();
    parts.push(fillPart(p, (c, pp, lw) => {
      for (const [a, b, d, col] of [[top, L, C, '#c7f4ff'], [top, C, R, '#6fc3ee'], [L, Bt, C, '#8fdcf6'], [Bt, R, C, '#4a86cc']]) {
        c.fillStyle = col; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.closePath(); c.fill();
      }
      c.strokeStyle = '#2f5a90'; c.lineWidth = lw * 0.5; c.stroke(pp);
    }));
  }
  drawTree(ctx, s, color, parts);
  for (let i = 0; i < 4; i++) sparkle(ctx, (0.25 + v() * 0.5) * s, (0.12 + v() * 0.35) * s, s * 0.035, '#ffffff');
  ctx.restore();
}

function glowTree(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.06);
  glow(ctx, 0.5 * s, 0.38 * s, 0.45 * s, 'rgba(120,255,230,0.4)');
  drawTree(ctx, s, color, [
    trunk(s, { top: 0.5, bot: 0.9, wt: 0.075, wb: 0.1, B: { dark: '#28364e', mid: '#3a4a6a', light: '#5a6c8e' } }),
    ...crown(s, LAYOUTS.oak, tiers3(vary(fill, v)), v, { cy: 0.35 }),
  ]);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i++) glow(ctx, (0.2 + v() * 0.6) * s, (0.15 + v() * 0.45) * s, s * 0.035, 'rgba(200,255,240,0.9)');
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 3; i++) sparkle(ctx, (0.25 + v() * 0.5) * s, (0.1 + v() * 0.5) * s, s * 0.03, '#ffffff');
  ctx.restore();
}

function worldTree(ctx, s, color, base, seed) {
  const v = vrng(base, seed);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.92, 0.44, 0.06);
  glow(ctx, 0.5 * s, 0.35 * s, 0.5 * s, 'rgba(255,225,120,0.35)');
  const roots = [[0.18, 0.93, 0.05], [0.82, 0.93, 0.05], [0.3, 0.95, 0.04], [0.7, 0.95, 0.04]].map(([x, y, w]) => limb(s, 0.5, 0.8, (0.5 + x) / 2, 0.83, x, y, w));
  const lay = [[.5, .1, .13], [.34, .16, .14], [.66, .16, .14], [.2, .28, .14], [.8, .28, .14], [.42, .27, .15], [.6, .27, .15], [.26, .42, .12], [.74, .42, .12], [.5, .42, .14]];
  const tk = trunk(s, { top: 0.4, bot: 0.92, wt: 0.1, wb: 0.15, flare: 0.07 }), pt = tk.paint;
  tk.paint = (c, lw) => { pt(c, lw); c.fillStyle = 'rgba(255,220,110,0.9)'; for (const y of [0.6, 0.7, 0.8]) c.fillRect(0.5 * s - s * 0.012, y * s, s * 0.024, s * 0.035); };
  drawTree(ctx, s, color, [...roots, tk,
    limb(s, 0.5, 0.5, 0.38, 0.42, 0.28, 0.36, 0.05), limb(s, 0.5, 0.5, 0.62, 0.42, 0.72, 0.36, 0.05),
    ...crown(s, lay.map(([x, y, r], i) => [x, y, r, i % 4 === 0 ? 1 : 0]), [tiers3(vary('#6a9a3c', v)), tiers3('#d8b440')], v, { cy: 0.3 })]);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) glow(ctx, (0.15 + v() * 0.7) * s, (0.06 + v() * 0.45) * s, s * 0.03, 'rgba(255,240,170,0.9)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ---------------------------------------------------------------- groves
// items: [x, groundY, scale, fn(ctx, s, seed)]; wf widens the box for wide-aspect stamps.
function grove(ctx, s, items, shared, seed, wf = 1) {
  if (shared) groundShadow(ctx, s, shared[0] * wf, shared[1], shared[2] * wf, shared[3]);
  SHADOW_OFF = !!shared;
  try {
    [...items].sort((a, b) => a[1] - b[1]).forEach(([x, y, k, fn], i) => {
      ctx.save();
      ctx.translate((x * wf - 0.5 * k) * s, (y - 0.9 * k) * s);
      ctx.scale(k, k);
      fn(ctx, s, (Number(seed) || 0) * 31 + i);
      ctx.restore();
    });
  } finally { SHADOW_OFF = false; }
}

// Shift a 1:1 tree drawing into a box of size*aspect width.
function fit(ctx, s, aspect, draw) {
  ctx.save(); ctx.translate(((aspect - 1) / 2) * s, 0); draw(); ctx.restore();
}

// ---------------------------------------------------------------- top-down canopies
// Same clumps and palettes as the side views; cast shadow falls down-right.
function topShadow(ctx, s, r) {
  ctx.fillStyle = 'rgba(28,22,10,0.26)';
  ctx.beginPath(); ctx.ellipse(0.56 * s, 0.57 * s, r * s, r * 0.95 * s, 0, 0, TAU); ctx.fill();
}
function topBroad(ctx, s, color, fills, base, seed) {
  const v = vrng(base, seed);
  const pals = fills.map((f) => tiers3(vary(f, v)));
  const n = 7 + Math.floor(v() * 2), a0 = v() * TAU, lay = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; lay.push([0.5 + Math.cos(a) * 0.25, 0.5 + Math.sin(a) * 0.25, 0.16 + v() * 0.03, a, i % pals.length]); }
  ctx.save();
  topShadow(ctx, s, 0.42);
  lay.sort((p, q) => (q[0] + q[1]) - (p[0] + p[1])); // shaded side first, lit upper-left on top
  const parts = lay.map(([x, y, r, a, k]) => {
    const lit = -(Math.cos(a) + Math.sin(a));
    return clump(x * s, y * s, r * s, lit > 0.5 ? pals[k].top : lit < -0.5 ? pals[k].bot : pals[k].mid, v, 1);
  });
  parts.push(clump(0.47 * s, 0.47 * s, 0.2 * s, pals[0].top, v, 1));
  drawTree(ctx, s, color, parts);
  ctx.restore();
}

function topPine(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  const P = ramp(vary(fill, v));
  ctx.save();
  topShadow(ctx, s, 0.4);
  const parts = [];
  for (const [R, n, col] of [[0.42, 13, P.mid], [0.31, 11, P.light], [0.2, 9, P.light], [0.09, 7, P.hi]]) {
    const a0 = v() * TAU, p = new Path2D();
    for (let i = 0; i < n * 2; i++) {
      const a = a0 + (i / (n * 2)) * TAU, r = (i % 2 ? R * 0.74 : R * (0.95 + v() * 0.08)) * s;
      const x = 0.5 * s + Math.cos(a) * r, y = 0.5 * s + Math.sin(a) * r;
      if (i) p.lineTo(x, y); else p.moveTo(x, y);
    }
    p.closePath();
    parts.push(fillPart(p, (c, pp, lw) => {
      c.fillStyle = col; c.fill(pp); c.clip(pp);
      c.fillStyle = P.dark; // lower-right half in shade
      c.beginPath(); c.moveTo(s, 0); c.lineTo((0.5 + R * 0.25) * s, (0.5 - R * 0.25) * s); c.lineTo(0, s); c.lineTo(s, s); c.fill();
      c.strokeStyle = P.deep; c.lineWidth = lw; c.stroke(pp);
    }));
  }
  drawTree(ctx, s, color, parts);
  ctx.restore();
}

function topDead(ctx, s, color, base, seed) {
  const v = vrng(base, seed);
  const segs = [], n = 5 + Math.floor(v() * 2), a0 = v() * TAU;
  for (let i = 0; i < n; i++) segs.push(...bareSegs(v, 0.5, 0.5, a0 + (i / n) * TAU + (v() - 0.5) * 0.4, 0.2, 0.05, 2, true));
  ctx.save();
  topShadow(ctx, s, 0.3);
  const hub = new Path2D(); hub.arc(0.5 * s, 0.5 * s, 0.07 * s, 0, TAU);
  drawTree(ctx, s, color, [branchPart(s, segs, BARK), fillPart(hub, (c, pp) => { c.fillStyle = BARK.mid; c.fill(pp); c.clip(pp); c.fillStyle = BARK.light; c.beginPath(); c.arc(0.48 * s, 0.48 * s, 0.04 * s, 0, TAU); c.fill(); })]);
  ctx.restore();
}

function topPalm(ctx, s, color, fill, base, seed) {
  const v = vrng(base, seed);
  const P = ramp(vary(fill, v));
  ctx.save();
  topShadow(ctx, s, 0.4);
  const parts = [], n = 8, a0 = v() * TAU;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU + (v() - 0.5) * 0.3;
    parts.push(frond(0.5 * s, 0.5 * s, a, (0.4 + v() * 0.06) * s, 0.08 * s, 0.08, P, -(Math.cos(a) + Math.sin(a)) * 0.6));
  }
  const hub = new Path2D(); hub.arc(0.5 * s, 0.5 * s, 0.05 * s, 0, TAU);
  parts.push(fillPart(hub, (c, pp) => { c.fillStyle = '#6b4a28'; c.fill(pp); }));
  drawTree(ctx, s, color, parts);
  ctx.restore();
}

// Shared with stampsCatalog.js tree_* entries and viewsTrees.js top views.
export const TREE = { broadleaf, autumn, conifer, bare, palm, grove, fit, topBroad, topPine, topDead, topPalm };

const FC = '#2a2018';
const G = (group, groupName) => ({ group, groupName });
const T = (id, name, g, scale, render) => ({ id: 'tr_' + id, name, category: 'world_nature', rotate: 'fixed', defaultScale: scale, aspect: 1, ...g, render });

const G_BROAD = G('tree_broadleaf', 'Broadleaf Trees');
const G_CONIF = G('tree_conifer', 'Conifers');
const G_TROP = G('tree_tropical', 'Palms');
const G_SAV = G('tree_savanna', 'Savanna Trees');
const G_DEAD = G('tree_dead_grp', 'Dead & Gnarled');
const G_FANT = G('tree_fantasy', 'Fantasy Trees');
const G_GROVE = G('tree_grove', 'Groves & Clumps');

const bl = (kind, base, f0 = FOLIAGE) => (c, s, color = FC, fill = f0, seed) => broadleaf(c, s, color, fill, kind, base, seed);
const blF = (kind, base, f0 = FOLIAGE) => (c, s, seed) => broadleaf(c, s, FC, f0, kind, base, seed);
const cf = (o, f0) => (c, s, color = FC, fill = f0, seed) => conifer(c, s, color, fill, o, seed);
const cfF = (o, f0) => (c, s, seed) => conifer(c, s, FC, f0, o, seed);

export const STAMPS_TREESA = [
  T('oak', 'Oak', G_BROAD, 1.0, bl('oak', 11)),
  T('oak_ancient', 'Ancient Oak', G_BROAD, 1.3, bl('ancient', 12)),
  T('round', 'Round Tree', G_BROAD, 0.9, bl('round', 13)),
  T('elm', 'Tall Elm', G_BROAD, 1.1, bl('tall', 14)),
  T('bush', 'Shrub', G_BROAD, 0.6, bl('bush', 15, '#7c9e4c')),

  T('pine', 'Pine', G_CONIF, 1.0, cf({ seed: 21, tiers: 4, hw: 0.3, top: 0.03, bot: 0.74, teeth: 3 }, '#4d8250')),
  T('spruce', 'Spruce', G_CONIF, 1.0, cf({ seed: 22, tiers: 5, hw: 0.27, top: 0.03, bot: 0.8, teeth: 3, slim: 0.35 }, '#3f7a5a')),
  T('fir_squat', 'Squat Fir', G_CONIF, 0.9, cf({ seed: 23, tiers: 3, hw: 0.38, top: 0.1, bot: 0.8, teeth: 4, slim: 0.62, tr: 0.09 }, '#6a9e58')),
  T('cypress', 'Cypress', G_CONIF, 1.0, cf({ seed: 24, tiers: 6, hw: 0.16, top: 0.02, bot: 0.82, teeth: 2, slim: 0.6, tr: 0.05 }, '#4f8a52')),

  T('snowy_pine', 'Snowy Pine', G_CONIF, 1.0, cf({ seed: 31, tiers: 4, hw: 0.31, top: 0.05, bot: 0.8, teeth: 3, snow: true }, '#3f7454')),
  T('snowy_spruce', 'Snowy Spruce', G_CONIF, 1.0, cf({ seed: 32, tiers: 5, hw: 0.27, top: 0.03, bot: 0.8, teeth: 3, slim: 0.35, snow: true }, '#38665a')),

  T('autumn_gold', 'Autumn Oak', G_BROAD, 1.0, (c, s, color = FC, _f, seed) => autumn(c, s, color, 41, seed, ['#d9a02c', '#e07a24', '#c85a22'])),
  T('autumn_red', 'Crimson Maple', G_BROAD, 1.0, (c, s, color = FC, _f, seed) => autumn(c, s, color, 42, seed, ['#c8402a', '#d9622a', '#a8302a'])),

  T('willow', 'Willow', G_BROAD, 1.1, (c, s, color = FC, fill = '#6e9a4c', seed) => willow(c, s, color, fill, 51, seed)),
  T('birch', 'Birch', G_BROAD, 1.0, (c, s, color = FC, fill = '#7aa650', seed) => birch(c, s, color, fill, 61, seed)),

  T('palm', 'Palm', G_TROP, 1.0, (c, s, color = FC, fill = '#6cb64c', seed) => palm(c, s, color, fill, 71, seed, 0.08)),
  T('palm_lean', 'Leaning Palm', G_TROP, 1.0, (c, s, color = FC, fill = '#78c056', seed) => palm(c, s, color, fill, 72, seed, -0.34, false)),

  T('acacia', 'Acacia', G_SAV, 1.0, (c, s, color = FC, fill = '#a0a84a', seed) => acacia(c, s, color, fill, 81, seed)),
  T('baobab', 'Baobab', G_SAV, 1.1, (c, s, color = FC, fill = '#7ea848', seed) => baobab(c, s, color, fill, 82, seed)),

  T('dead', 'Dead Tree', G_DEAD, 1.0, (c, s, color = FC, _f, seed) => bare(c, s, color, 91, seed, { depth: 4 })),
  T('gnarled', 'Gnarled Tree', G_DEAD, 1.0, (c, s, color = FC, _f, seed) => bare(c, s, color, 92, seed, { gnarl: true, depth: 3 })),
  T('barren', 'Barren Snag', G_DEAD, 0.9, (c, s, color = FC, _f, seed) => bare(c, s, color, 93, seed, { depth: 3, barren: true })),

  T('crystal', 'Crystal Tree', G_FANT, 1.0, (c, s, color = '#241a30', _f, seed) => crystalTree(c, s, color, 101, seed)),
  T('glow', 'Glowing Tree', G_FANT, 1.0, (c, s, color = '#1c2a2a', fill = '#3fc0a0', seed) => glowTree(c, s, color, fill, 102, seed)),
  T('world', 'World Tree', G_FANT, 1.6, (c, s, color = FC, _f, seed) => worldTree(c, s, color, 103, seed)),

  T('grove_oak', 'Oak Grove', G_GROVE, 1.3, (c, s, _c, _f, seed) => grove(c, s, [
    [0.3, 0.82, 0.66, blF('oak', 111)], [0.7, 0.84, 0.66, blF('round', 112)], [0.5, 0.94, 0.76, blF('oak', 113)]], [0.5, 0.9, 0.42, 0.075], seed)),
  T('grove_pine', 'Pine Stand', G_GROVE, 1.3, (c, s, _c, _f, seed) => grove(c, s, [
    [0.25, 0.8, 0.6, cfF({ seed: 121, tiers: 4, hw: 0.27 }, '#4d8250')], [0.75, 0.82, 0.62, cfF({ seed: 122, tiers: 5, hw: 0.23, slim: 0.35 }, '#3f7a5a')],
    [0.5, 0.92, 0.78, cfF({ seed: 123, tiers: 4, hw: 0.27 }, '#558c52')]], null, seed)),
  T('grove_snow', 'Snowy Stand', G_GROVE, 1.3, (c, s, _c, _f, seed) => grove(c, s, [
    [0.28, 0.82, 0.6, cfF({ seed: 131, tiers: 4, hw: 0.27, snow: true }, '#3f7454')], [0.74, 0.84, 0.62, cfF({ seed: 132, tiers: 5, hw: 0.23, slim: 0.35, snow: true }, '#38665a')],
    [0.5, 0.93, 0.74, cfF({ seed: 133, tiers: 4, hw: 0.27, snow: true }, '#3f7454')]], null, seed)),
  T('thicket', 'Thicket', G_GROVE, 1.0, (c, s, _c, _f, seed) => grove(c, s, [
    [0.3, 0.86, 0.62, blF('bush', 141, '#7c9e4c')], [0.7, 0.86, 0.6, blF('bush', 142, '#6e9448')], [0.5, 0.93, 0.7, blF('bush', 143, '#7c9e4c')]], [0.5, 0.9, 0.42, 0.07], seed)),
];
