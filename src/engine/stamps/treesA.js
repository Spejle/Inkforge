// Stamps added by the treesA workstream. Same shape as entries in stampsCatalog.js STAMPS.
// Ink-and-parchment trees: light from the upper-left, dark underside, soft ground shadow,
// deterministic detail (seeded PRNG, never Math.random). All draw in a 0..s box, ground at ~0.9s.

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

const rgb = (h) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || ''));
  if (!m) return [85, 122, 70];
  let x = m[1];
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(x.substr(i, 2), 16));
};
const mix = (a, b, t) => {
  const A = rgb(a), B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
// Shade ramp from one base tint (mix() returns rgb(); re-hex not needed, mix parses only hex,
// so ramp() takes hex and mixes from the hex).
const ramp = (base, warm) => {
  const hex = (c) => {
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(c);
    return m ? '#' + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, '0')).join('') : c;
  };
  const b = hex(base);
  return {
    dark: mix(hex(mix(b, '#1a2a14', 0.5)), '#2a1a3a', 0.12),
    mid: mix(b, '#000000', 0.05),
    light: warm ? mix(b, '#f8ee78', 0.4) : mix(b, '#f4f0a0', 0.28),
    hi: warm ? mix(b, '#fff8a8', 0.62) : mix(b, '#fffbc8', 0.5),
  };
};
const BARK = ramp('#7a5634');
const FOLIAGE = '#5c8a48';

let SHADOW_OFF = false;
let HALO = false;
function groundShadow(ctx, s, cx = 0.5, cy = 0.9, rx = 0.3, ry = 0.06) {
  if (SHADOW_OFF) return;
  rx *= 1.1;
  ctx.save();
  ctx.translate((cx + 0.045) * s, (cy + 0.012) * s);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * s);
  g.addColorStop(0, 'rgba(30,24,12,0.21)');
  g.addColorStop(0.72, 'rgba(30,24,12,0.18)');
  g.addColorStop(1, 'rgba(30,24,12,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Tapered trunk with root flare, lit from the left, outlined.
function trunk(ctx, s, o, { x = 0.5, top = 0.55, bot = 0.9, wt = 0.07, wb = 0.09, flare = 0.04, bark = BARK, lean = 0, lines = true }) {
  const p = (v) => v * s;
  ctx.save();
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(p(x + lean - wt / 2), p(top));
    ctx.quadraticCurveTo(p(x + lean * 0.5 - wb / 2), p((top + bot) / 2), p(x - wb / 2 - flare), p(bot));
    ctx.lineTo(p(x + wb / 2 + flare), p(bot));
    ctx.quadraticCurveTo(p(x + lean * 0.5 + wb / 2), p((top + bot) / 2), p(x + lean + wt / 2), p(top));
    ctx.closePath();
  };
  path();
  ctx.fillStyle = bark.mid;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = bark.dark; // shaded right side
  ctx.fillRect(p(x + wb * 0.1), p(top - 0.02), p(0.3), p(bot - top + 0.05));
  ctx.fillStyle = bark.light; // lit left strip
  ctx.fillRect(p(x - 0.3), p(top - 0.02), p(0.3 - wb * 0.22), p(bot - top + 0.05));
  if (lines) {
    ctx.strokeStyle = bark.dark;
    ctx.lineWidth = Math.max(0.6, s * 0.01);
    for (const dx of [-0.2, 0.15]) {
      ctx.beginPath();
      ctx.moveTo(p(x + dx * wb), p(top + 0.02));
      ctx.lineTo(p(x + dx * wb * 1.2), p(bot - 0.01));
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.save();
  path();
  ctx.strokeStyle = o;
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

// One layered foliage lobe: dark underside, mid body, upper-left highlight, leaf dabs, ink outline.
function lobe(ctx, s, o, x, y, r, P, rnd, lw = s * 0.026) {
  const n = 9;
  const k = [];
  for (let i = 0; i < n; i++) k.push(0.9 + rnd() * 0.2);
  const X = x * s, Y = y * s, R = r * s;
  const path = (dx, dy, sc) => {
    const pt = (i) => {
      const a = (i / n) * Math.PI * 2;
      const rr = R * sc * k[((i % n) + n) % n];
      return [X + dx + Math.cos(a) * rr, Y + dy + Math.sin(a) * rr * 0.92];
    };
    ctx.beginPath();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pt(0), pt(1));
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 1; i <= n; i++) {
      const c = pt(i), m = mid(c, pt(i + 1));
      ctx.quadraticCurveTo(c[0], c[1], m[0], m[1]);
    }
    ctx.closePath();
  };
  ctx.save();
  path(0, 0, 1);
  ctx.fillStyle = P.dark;
  ctx.fill();
  ctx.clip();
  path(-R * 0.13, -R * 0.15, 0.93);
  ctx.fillStyle = P.mid;
  ctx.fill();
  path(-R * 0.27, -R * 0.3, 0.6);
  ctx.fillStyle = P.light;
  ctx.fill();
  path(-R * 0.38, -R * 0.42, 0.28);
  ctx.fillStyle = P.hi;
  ctx.fill();
  ctx.lineWidth = Math.max(0.6, lw * 0.5);
  ctx.lineCap = 'round';
  ctx.strokeStyle = P.dark;
  for (let i = 0; i < 5; i++) { // leaf dabs
    const a = 0.1 + rnd() * 1.5, d = (0.35 + rnd() * 0.5) * R;
    ctx.beginPath();
    ctx.arc(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.9, R * 0.12, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  path(0, 0, 1);
  if (HALO) { ctx.strokeStyle = 'rgba(255,255,235,0.2)'; ctx.lineWidth = lw * 3; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.strokeStyle = o;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function canopy(ctx, s, o, layout, pal, rnd, lw) {
  [...layout].sort((a, b) => a[1] - b[1]).forEach(([x, y, r, pi]) => {
    lobe(ctx, s, o, x, y, r, Array.isArray(pal) ? pal[pi || 0] : pal, rnd, lw);
  });
}

// ---------------------------------------------------------------- broadleaf
const LAYOUTS = {
  oak: [[.5, .38, .16], [.3, .46, .15], [.7, .45, .15], [.15, .58, .11], [.85, .57, .11], [.4, .56, .16], [.62, .56, .15]],
  ancient: [[.5, .22, .15], [.33, .3, .15], [.68, .3, .15], [.2, .43, .14], [.82, .43, .14], [.4, .42, .16], [.6, .42, .16], [.28, .56, .12], [.72, .56, .12], [.5, .55, .14]],
  round: [[.5, .2, .18], [.34, .3, .15], [.7, .28, .14], [.26, .46, .13], [.75, .45, .14], [.5, .42, .2], [.38, .58, .11], [.63, .6, .1]],
  tall: [[.5, .22, .14], [.3, .27, .13], [.7, .27, .13], [.4, .42, .12], [.6, .42, .12], [.5, .54, .09]],
  bush: [[.27, .7, .14], [.73, .7, .14], [.5, .6, .19], [.4, .7, .12], [.62, .7, .12]],
};
const TRUNKS = {
  oak: { top: 0.56 },
  round: { top: 0.64, wt: 0.085, wb: 0.1, flare: 0.045 },
  tall: { top: 0.5, wt: 0.055, wb: 0.07, flare: 0.035 },
};

function broadleaf(ctx, s, color, fill, kind, seed) {
  const rnd = rng(seed);
  const P = ramp(fill, kind === 'bush');
  ctx.save();
  if (kind === 'bush') {
    groundShadow(ctx, s, 0.5, 0.88, 0.34, 0.06);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, s, 0.8 * s); ctx.clip();
    canopy(ctx, s, color, LAYOUTS.bush, P, rnd, s * 0.03);
    ctx.restore();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.19 * s, 0.8 * s); ctx.lineTo(0.81 * s, 0.8 * s); ctx.stroke();
  } else {
    const anc = kind === 'ancient';
    groundShadow(ctx, s, 0.5, 0.9, anc ? 0.36 : 0.3, 0.065);
    trunk(ctx, s, color, { top: 0.5, bot: 0.9, wt: anc ? 0.11 : 0.07, wb: anc ? 0.14 : 0.09, flare: anc ? 0.07 : 0.04, lean: anc ? 0.01 : 0, ...(TRUNKS[kind] || {}) });
    canopy(ctx, s, color, LAYOUTS[kind], P, rnd);
    if (anc) { // hanging moss strands
      ctx.strokeStyle = P.light;
      ctx.lineWidth = Math.max(0.8, s * 0.014);
      ctx.lineCap = 'round';
      for (const x of [0.3, 0.38, 0.62, 0.7]) {
        ctx.beginPath();
        ctx.moveTo(x * s, 0.64 * s);
        ctx.quadraticCurveTo((x + 0.01) * s, 0.7 * s, (x - 0.01) * s, (0.72 + rnd() * 0.04) * s);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function autumn(ctx, s, color, seed, hues) {
  const rnd = rng(seed);
  const pals = hues.map((h) => ramp(h));
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.065);
  trunk(ctx, s, color, { top: 0.5, bot: 0.9, wt: 0.07, wb: 0.09, flare: 0.045 });
  const lay = LAYOUTS.oak.map(([x, y, r], i) => [x, y, r, (i + Math.floor(rnd() * 2)) % pals.length]);
  canopy(ctx, s, color, lay, pals, rnd);
  for (let i = 0; i < 6; i++) { // fallen leaves
    ctx.fillStyle = pals[i % pals.length].mid;
    ctx.beginPath();
    ctx.ellipse((0.22 + rnd() * 0.58) * s, (0.88 + rnd() * 0.06) * s, s * 0.016, s * 0.009, rnd() * 3, 0, 6.3);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- conifers
function tier(ctx, s, o, cx, top, bot, hw, P, rnd, teeth, snow) {
  const lw = s * 0.026;
  const jit = [];
  for (let i = 0; i < teeth * 2; i++) jit.push((rnd() - 0.5) * 0.008);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(cx * s, top * s);
    ctx.quadraticCurveTo((cx + hw * 0.45) * s, (top + (bot - top) * 0.55) * s, (cx + hw) * s, bot * s);
    for (let i = 1; i < teeth * 2; i++) {
      const x = cx + hw - (2 * hw * i) / (teeth * 2);
      const y = bot - (i % 2 ? (bot - top) * 0.13 : 0) + jit[i];
      ctx.lineTo(x * s, y * s);
    }
    ctx.lineTo((cx - hw) * s, bot * s);
    ctx.quadraticCurveTo((cx - hw * 0.45) * s, (top + (bot - top) * 0.55) * s, cx * s, top * s);
    ctx.closePath();
  };
  ctx.save();
  path();
  ctx.fillStyle = P.mid;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = P.dark; // shaded right flank
  ctx.beginPath();
  ctx.moveTo((cx + hw * 0.06) * s, top * s);
  ctx.lineTo((cx + hw * 1.2) * s, (bot + 0.02) * s);
  ctx.lineTo((cx + hw * 0.3) * s, (bot + 0.02) * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.light; // lit left flank
  ctx.beginPath();
  ctx.moveTo((cx - hw * 0.05) * s, (top + 0.01) * s);
  ctx.lineTo((cx - hw * 1.1) * s, (bot + 0.01) * s);
  ctx.lineTo((cx - hw * 0.25) * s, (bot + 0.01) * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.dark; // drooping branch strokes
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(0.6, s * 0.008);
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const y = top + (bot - top) * (0.35 + i * 0.16);
    const w = hw * ((y - top) / (bot - top)) * 0.8;
    ctx.beginPath();
    ctx.moveTo((cx - w * 0.9) * s, y * s);
    ctx.quadraticCurveTo(cx * s, (y + 0.035) * s, (cx + w * 0.9) * s, y * s);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (snow) {
    const sy = top + (bot - top) * 0.6;
    const n = 4;
    ctx.fillStyle = '#f2f7fb';
    ctx.beginPath();
    ctx.moveTo((cx - hw * 1.3) * s, (top - 0.02) * s);
    ctx.lineTo((cx + hw * 1.3) * s, (top - 0.02) * s);
    ctx.lineTo((cx + hw * 1.3) * s, sy * s);
    for (let i = 0; i < n * 2; i++) {
      const x = cx + hw * 1.3 - (2.6 * hw * (i + 1)) / (n * 2);
      ctx.quadraticCurveTo((x + hw * 0.16) * s, (sy + (i % 2 ? -0.01 : 0.06)) * s, x * s, (sy + (i % 2 ? 0.0 : 0.0)) * s);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(150,175,205,0.55)'; // cool shade on the right
    ctx.beginPath();
    ctx.moveTo((cx + hw * 0.05) * s, (top + 0.01) * s);
    ctx.lineTo((cx + hw * 1.3) * s, (top - 0.02) * s);
    ctx.lineTo((cx + hw * 1.3) * s, (sy + 0.04) * s);
    ctx.lineTo((cx + hw * 0.1) * s, (sy + 0.03) * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  path();
  if (!snow) { ctx.strokeStyle = 'rgba(255,255,230,0.17)'; ctx.lineWidth = lw * 2.8; ctx.lineJoin = 'round'; ctx.stroke(); }
  if (!snow) { // 1px lit-side rim just inside the ink line
    ctx.save();
    path();
    ctx.clip();
    ctx.beginPath(); ctx.rect(0, 0, (cx + hw * 0.15) * s, s); ctx.clip();
    path();
    ctx.strokeStyle = 'rgba(255,255,225,0.3)';
    ctx.lineWidth = lw + 2 * Math.max(1, s * 0.016);
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = o;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function conifer(ctx, s, color, fill, { seed, tiers = 4, hw = 0.26, top = 0.06, bot = 0.8, teeth = 3, snow = false, slim = 0.5, tr = 0.07, vseed }) {
  const rnd = rng(seed);
  let lean = 0;
  if (vseed != null && isFinite(vseed)) { // per-instance variation: tiers +-1, apex lean +-4 deg
    const v = rng((Math.imul(Math.floor(vseed * 1000) | 0, 2654435761) ^ seed) >>> 0);
    tiers = Math.max(2, tiers + Math.floor(v() * 3) - 1);
    lean = ((v() - 0.5) * 8 * Math.PI) / 180;
  }
  const P = ramp(fill);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, hw + 0.06, 0.06);
  ctx.translate(0.5 * s, 0.9 * s); ctx.rotate(lean); ctx.translate(-0.5 * s, -0.9 * s);
  trunk(ctx, s, color, { top: bot - 0.1, bot: 0.9, wt: tr * 0.8, wb: tr, flare: 0.03 });
  for (let i = tiers - 1; i >= 0; i--) {
    const tt = top + (bot - top) * (i / tiers) * 0.92;
    const bb = top + (bot - top) * Math.min(1, (i + 1.55) / (tiers + 0.55));
    const w = hw * (slim + (1 - slim) * ((i + 1) / tiers));
    tier(ctx, s, color, 0.5, tt, bb, w, P, rnd, teeth, snow);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- willow / birch
function willow(ctx, s, color, fill, seed) {
  const rnd = rng(seed);
  const P = ramp(fill);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.34, 0.06);
  trunk(ctx, s, color, { top: 0.4, bot: 0.9, wt: 0.07, wb: 0.1, flare: 0.05, lean: -0.02 });
  canopy(ctx, s, color, [[.5, .22, .17], [.3, .32, .14], [.7, .32, .14]], P, rnd);
  for (let i = 0; i < 9; i++) { // drooping curtains
    const x = 0.16 + i * 0.085 + (rnd() - 0.5) * 0.02;
    const edge = Math.abs(x - 0.5);
    const y0 = 0.32 + edge * 0.2, len = 0.26 + rnd() * 0.12 - edge * 0.2;
    const sway = (rnd() - 0.5) * 0.03;
    const curve = () => {
      ctx.beginPath();
      ctx.moveTo(x * s, y0 * s);
      ctx.bezierCurveTo((x + sway) * s, (y0 + len * 0.4) * s, (x - sway + (x < 0.5 ? -0.02 : 0.02)) * s, (y0 + len * 0.75) * s, (x + sway * 0.5) * s, (y0 + len) * s);
    };
    ctx.lineCap = 'round';
    curve(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.041; ctx.stroke();
    curve(); ctx.strokeStyle = i % 3 ? P.dark : P.mid; ctx.lineWidth = s * 0.024; ctx.stroke();
  }
  ctx.restore();
}

function birch(ctx, s, color, fill, seed) {
  const rnd = rng(seed);
  const P = ramp(mix(fill, '#c8d870', 0.3));
  const white = { dark: '#aab0b4', mid: '#e8e6dc', light: '#fbf9f0', hi: '#fff' };
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.26, 0.055);
  trunk(ctx, s, color, { top: 0.4, bot: 0.9, wt: 0.045, wb: 0.065, flare: 0.025, bark: white, lines: false, lean: 0.015 });
  ctx.fillStyle = '#2b2622';
  for (let i = 0; i < 7; i++) {
    const y = 0.5 + i * 0.055;
    ctx.fillRect((0.47 + (rnd() - 0.5) * 0.01 + 0.007 * (0.9 - y) * 2) * s, y * s, s * (0.02 + rnd() * 0.02), s * 0.012);
  }
  ctx.strokeStyle = color; // thin branches
  ctx.lineWidth = s * 0.02;
  ctx.lineCap = 'round';
  for (const [a, b, c, d] of [[0.51, 0.5, 0.36, 0.36], [0.51, 0.45, 0.66, 0.3]]) {
    ctx.beginPath(); ctx.moveTo(a * s, b * s); ctx.lineTo(c * s, d * s); ctx.stroke();
  }
  canopy(ctx, s, color, [[.5, .2, .12], [.36, .34, .11], [.66, .3, .11], [.5, .38, .13], [.28, .46, .08], [.72, .44, .09]], P, rnd, s * 0.022);
  ctx.restore();
}

// ---------------------------------------------------------------- palm / savanna
function palm(ctx, s, color, fill, seed, lean = 0.08, coconuts = true) {
  const rnd = rng(seed);
  const P = ramp(fill, true);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.055);
  const bx = lean < 0 ? 0.66 : 0.45, tx = bx + lean, ty = lean < 0 ? 0.36 : 0.33;
  const pt = (t) => {
    const u = 1 - t, cx = bx + lean * (lean < -0.2 ? 0.1 : 0.1), cy = lean < -0.2 ? 0.76 : 0.62;
    return [u * u * bx + 2 * u * t * cx + t * t * tx, u * u * 0.9 + 2 * u * t * cy + t * t * ty];
  };
  const seg = (w, col, dx = 0) => {
    for (let i = 0; i < 14; i++) {
      const a = pt(i / 14), b = pt((i + 1) / 14);
      ctx.strokeStyle = col;
      ctx.lineWidth = w * (1.25 - (i / 14) * 0.5) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a[0] * s + dx, a[1] * s);
      ctx.lineTo(b[0] * s + dx, b[1] * s);
      ctx.stroke();
    }
  };
  seg(0.1, color);
  seg(0.074, BARK.mid);
  seg(0.024, BARK.light, -s * 0.014);
  ctx.fillStyle = BARK.mid; ctx.strokeStyle = color; ctx.lineWidth = s * 0.026; // base knot
  ctx.beginPath(); ctx.ellipse(bx * s, 0.885 * s, s * 0.065, s * 0.032, 0, 0, 6.3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = BARK.dark; // rings
  ctx.lineWidth = Math.max(0.7, s * 0.01);
  for (let i = 1; i < 14; i++) {
    const a = pt(i / 14);
    ctx.beginPath();
    ctx.moveTo((a[0] - 0.026) * s, a[1] * s);
    ctx.lineTo((a[0] + 0.026) * s, (a[1] + 0.012) * s);
    ctx.stroke();
  }
  [-2.9, -0.25, -2.4, -0.75, -1.9, -1.2, -1.57, 0.5, 2.6].forEach((ang, i) => {
    const L = (0.3 + rnd() * 0.06) * s;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const x0 = tx * s, y0 = ty * s;
    const x1 = x0 + dx * L, y1 = y0 + dy * L + L * 0.55 * Math.abs(dx);
    const cx = x0 + dx * L * 0.5, cy = y0 + dy * L * 0.5 - L * 0.28;
    const nx = -dy, ny = dx, w = s * 0.07;
    const frond = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx + nx * w, cy + ny * w - w * 0.2, x1, y1);
      ctx.quadraticCurveTo(cx - nx * w * 0.2, cy - ny * w * 0.2 + w * 0.5, x0, y0);
      ctx.closePath();
    };
    frond();
    ctx.fillStyle = i < 3 || dx > 0.1 ? P.dark : P.light;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = dx < 0 ? P.light : P.mid;
    ctx.lineWidth = s * 0.012;
    for (let k = 1; k < 8; k++) { // leaflet ticks
      const t = k / 8;
      const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + nx * w * 0.5, py + ny * w * 0.5 + w * 0.25);
      ctx.stroke();
    }
    ctx.restore();
    frond();
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.024;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.save(); frond(); ctx.clip(); ctx.translate(Math.max(0.8, s * 0.012), Math.max(0.8, s * 0.012)); frond();
    ctx.strokeStyle = '#f6ffb4'; ctx.lineWidth = Math.max(1.2, s * 0.02); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = P.hi;
    ctx.lineWidth = s * 0.008;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1 * 0.98 + x0 * 0.02, y1);
    ctx.stroke();
  });
  if (coconuts) {
    for (const [x, y] of [[-0.022, 0.045], [0.026, 0.052]]) {
      ctx.fillStyle = '#6b4a28';
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.016;
      ctx.beginPath();
      ctx.arc((tx + x) * s, (ty + y) * s, s * 0.022, 0, 6.3);
      ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
}

function acacia(ctx, s, color, fill, seed) {
  const rnd = rng(seed);
  const P = ramp(fill, true);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.36, 0.055);
  const lim = [[0.5, 0.9, 0.5, 0.66, 0.06], [0.5, 0.68, 0.34, 0.46, 0.04], [0.5, 0.68, 0.68, 0.44, 0.04], [0.5, 0.68, 0.52, 0.42, 0.03]];
  const wob = lim.map(() => (rnd() - 0.5) * 0.03 * s);
  for (const pass of [0, 1]) {
    lim.forEach(([a, b, c, d, w], i) => {
      ctx.strokeStyle = pass ? BARK.mid : color;
      ctx.lineWidth = (pass ? w : w + 0.026) * s;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a * s, b * s);
      ctx.quadraticCurveTo(((a + c) / 2) * s + wob[i], ((b + d) / 2) * s, c * s, d * s);
      ctx.stroke();
    });
  }
  canopy(ctx, s, color, [[.2, .4, .11], [.8, .38, .11], [.33, .34, .14], [.68, .32, .14], [.5, .3, .15], [.5, .42, .12]], P, rnd);
  ctx.restore();
}

function baobab(ctx, s, color, fill, seed) {
  const rnd = rng(seed);
  const P = ramp(fill);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.36, 0.065);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(0.46 * s, 0.34 * s);
    ctx.bezierCurveTo(0.44 * s, 0.5 * s, 0.1 * s, 0.6 * s, 0.2 * s, 0.9 * s);
    ctx.lineTo(0.8 * s, 0.9 * s);
    ctx.bezierCurveTo(0.9 * s, 0.6 * s, 0.56 * s, 0.5 * s, 0.54 * s, 0.34 * s);
    ctx.closePath();
  };
  for (const [x, y, ex, ey] of [[0.47, 0.37, 0.2, 0.25], [0.53, 0.37, 0.8, 0.25], [0.5, 0.35, 0.5, 0.17]]) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.moveTo(x * s, y * s); ctx.lineTo(ex * s, ey * s); ctx.stroke();
    ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = s * 0.035;
    ctx.beginPath(); ctx.moveTo(x * s, y * s); ctx.lineTo(ex * s, ey * s); ctx.stroke();
  }
  body();
  ctx.fillStyle = '#9a7a58';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#6e5238';
  ctx.beginPath(); ctx.moveTo(0.52 * s, 0.3 * s); ctx.lineTo(0.9 * s, 0.3 * s); ctx.lineTo(0.9 * s, 0.95 * s); ctx.lineTo(0.62 * s, 0.95 * s); ctx.bezierCurveTo(0.64 * s, 0.7 * s, 0.58 * s, 0.5 * s, 0.52 * s, 0.3 * s); ctx.fill();
  ctx.fillStyle = '#b89870';
  ctx.beginPath(); ctx.moveTo(0.46 * s, 0.34 * s); ctx.bezierCurveTo(0.44 * s, 0.5 * s, 0.1 * s, 0.6 * s, 0.2 * s, 0.9 * s); ctx.lineTo(0.34 * s, 0.9 * s); ctx.bezierCurveTo(0.26 * s, 0.66 * s, 0.44 * s, 0.5 * s, 0.49 * s, 0.34 * s); ctx.fill();
  ctx.strokeStyle = '#5a4230';
  ctx.lineWidth = s * 0.01;
  for (let i = 0; i < 6; i++) {
    const x = 0.3 + i * 0.08;
    ctx.beginPath(); ctx.moveTo((0.42 + (x - 0.5) * 0.35) * s, 0.4 * s); ctx.quadraticCurveTo(x * s, 0.65 * s, (x + (x - 0.5) * 0.15) * s, 0.9 * s); ctx.stroke();
  }
  ctx.restore();
  body(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.03; ctx.lineJoin = 'round'; ctx.stroke();
  canopy(ctx, s, color, [[.19, .25, .125], [.81, .25, .125], [.5, .16, .145], [.33, .26, .105], [.67, .26, .105]], P, rnd);
  ctx.restore();
}

// ---------------------------------------------------------------- dead / gnarled
function bare(ctx, s, color, seed, { gnarl = false, depth = 4, barren = false }) {
  const rnd = rng(seed);
  const segs = [];
  const grow = (x, y, a, len, w, d) => {
    const bend = (rnd() - 0.5) * (gnarl ? 0.9 : 0.5);
    const mx = x + Math.cos(a + bend * 0.5) * len * 0.5, my = y + Math.sin(a + bend * 0.5) * len * 0.5;
    const nx = mx + Math.cos(a + bend) * len * 0.5, ny = my + Math.sin(a + bend) * len * 0.5;
    segs.push([x, y, mx, my, nx, ny, w]);
    if (d <= 0) return;
    const na = a + bend;
    for (let i = 0; i < 2; i++) {
      const sp = (i ? 1 : -1) * (0.45 + rnd() * 0.4);
      grow(nx, ny, na + sp, len * (0.66 + rnd() * 0.12), w * 0.68, d - 1);
    }
    if (rnd() < 0.5 && d > 1) grow(mx, my, na + (rnd() < 0.5 ? -1.1 : 1.1), len * 0.5, w * 0.5, d - 2);
  };
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, barren ? 0.3 : 0.24, barren ? 0.06 : 0.05);
  if (false) {
    ctx.strokeStyle = 'rgba(70,50,30,0.55)';
    ctx.lineWidth = Math.max(0.7, s * 0.01);
    ctx.lineCap = 'round';
    for (const [a, b, c, d] of [[0.22, 0.9, 0.34, 0.92], [0.66, 0.92, 0.8, 0.9], [0.3, 0.95, 0.42, 0.93], [0.58, 0.95, 0.7, 0.96]]) {
      ctx.beginPath(); ctx.moveTo(a * s, b * s); ctx.lineTo(c * s, d * s); ctx.stroke();
    }
  }
  grow(0.5, 0.9, -Math.PI / 2 + (gnarl ? 0.1 : 0), gnarl ? 0.3 : 0.26, gnarl ? 0.1 : 0.075, depth);
  const B = barren ? ramp('#7e6c54') : BARK;
  const draw = (col, wk, off) => {
    ctx.lineCap = 'round';
    for (const [x, y, mx, my, nx, ny, sw] of segs) {
      const dx = -sw * s * off;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(sw * s * wk, s * 0.008);
      ctx.beginPath(); ctx.moveTo(x * s + dx, y * s); ctx.quadraticCurveTo(mx * s + dx, my * s, nx * s + dx, ny * s); ctx.stroke();
    }
  };
  // outline pass first so joints do not show seams
  ctx.lineCap = 'round';
  for (const [x, y, mx, my, nx, ny, sw] of segs) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(sw * s + s * (barren ? 0.04 : 0.028), s * (barren ? 0.042 : 0.03));
    ctx.beginPath(); ctx.moveTo(x * s, y * s); ctx.quadraticCurveTo(mx * s, my * s, nx * s, ny * s); ctx.stroke();
  }
  draw(B.dark, 1, 0);
  draw(B.mid, 0.62, 0.12);
  draw(B.light, 0.22, 0.24);
  if (gnarl) { // knot hollow
    ctx.fillStyle = '#1e1510';
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.012;
    ctx.beginPath(); ctx.ellipse(0.5 * s, 0.76 * s, s * 0.022, s * 0.04, 0, 0, 6.3); ctx.fill(); ctx.stroke();
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
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
}

function crystalTree(ctx, s, color, seed) {
  const rnd = rng(seed);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.06);
  glow(ctx, 0.5 * s, 0.4 * s, 0.4 * s, 'rgba(150,230,255,0.4)');
  trunk(ctx, s, color, { top: 0.5, bot: 0.9, wt: 0.05, wb: 0.085, flare: 0.05, bark: ramp('#5a4a78') });
  const shards = [[.5, .46, .17, .22], [.33, .52, .1, .15], [.68, .5, .1, .17], [.22, .6, .07, .1], [.8, .58, .07, .11], [.42, .5, .1, .2], [.6, .5, .1, .19]];
  shards.sort((a, b) => b[1] - a[1]).sort((a, b) => a[2] - b[2]).reverse();
  for (const [x, y, w, h] of shards) {
    const X = x * s, Y = y * s, W = w * s, H = h * s;
    const top = [X, Y - H * 1.9];
    const L = [X - W, Y - H * 0.5], B = [X - W * 0.2, Y + H * 0.4], R = [X + W, Y - H * 0.4], C = [X - W * 0.2, Y - H * 0.7];
    for (const [a, b, c, col] of [[top, L, C, '#c7f4ff'], [top, C, R, '#6fc3ee'], [L, B, C, '#8fdcf6'], [B, R, C, '#4a86cc']]) {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...L); ctx.lineTo(...B); ctx.lineTo(...R); ctx.closePath();
    ctx.strokeStyle = 'rgba(235,250,255,0.22)'; ctx.lineWidth = s * 0.06; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.022; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...L); ctx.lineTo(...B); ctx.lineTo(...R); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = s * 0.01; ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...C); ctx.lineTo(...B); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) sparkle(ctx, (0.25 + rnd() * 0.5) * s, (0.12 + rnd() * 0.35) * s, s * 0.035, '#ffffff');
  ctx.restore();
}

function glowTree(ctx, s, color, fill, seed) {
  const rnd = rng(seed);
  const P = ramp(fill);
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.9, 0.3, 0.06);
  glow(ctx, 0.5 * s, 0.9 * s, 0.34 * s, 'rgba(120,255,220,0.35)');
  trunk(ctx, s, color, { top: 0.5, bot: 0.9, wt: 0.07, wb: 0.09, flare: 0.05, bark: ramp('#3a4a6a') });
  glow(ctx, 0.5 * s, 0.38 * s, 0.4 * s, 'rgba(120,255,230,0.45)');
  HALO = true;
  canopy(ctx, s, color, LAYOUTS.oak, P, rnd);
  HALO = false;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i++) glow(ctx, (0.2 + rnd() * 0.6) * s, (0.2 + rnd() * 0.45) * s, s * 0.035, 'rgba(200,255,240,0.9)');
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 3; i++) sparkle(ctx, (0.25 + rnd() * 0.5) * s, (0.1 + rnd() * 0.5) * s, s * 0.03, '#ffffff');
  ctx.restore();
}

function worldTree(ctx, s, color, seed) {
  const rnd = rng(seed);
  const pals = [ramp('#6a9a3c'), ramp('#d8b440')];
  ctx.save();
  groundShadow(ctx, s, 0.5, 0.92, 0.42, 0.06);
  glow(ctx, 0.5 * s, 0.35 * s, 0.5 * s, 'rgba(255,225,120,0.4)');
  for (const [x, y, w] of [[0.2, 0.93, 0.05], [0.8, 0.93, 0.05], [0.3, 0.95, 0.04], [0.7, 0.95, 0.04]]) { // roots
    const rt = () => { ctx.beginPath(); ctx.moveTo(0.5 * s, 0.8 * s); ctx.quadraticCurveTo(((0.5 + x) / 2) * s, 0.84 * s, x * s, y * s); };
    ctx.lineCap = 'round';
    rt(); ctx.strokeStyle = color; ctx.lineWidth = (w + 0.025) * s; ctx.stroke();
    rt(); ctx.strokeStyle = BARK.mid; ctx.lineWidth = w * s; ctx.stroke();
  }
  trunk(ctx, s, color, { top: 0.4, bot: 0.92, wt: 0.1, wb: 0.15, flare: 0.07 });
  ctx.fillStyle = 'rgba(255,220,110,0.85)'; // runes
  for (const y of [0.62, 0.72, 0.82]) ctx.fillRect(0.5 * s - s * 0.012, y * s, s * 0.024, s * 0.035);
  const lay = [[.5, .14, .13], [.34, .2, .14], [.66, .2, .14], [.2, .32, .14], [.8, .32, .14], [.42, .3, .15], [.6, .3, .15], [.26, .46, .12], [.74, .46, .12], [.5, .44, .14]];
  HALO = true;
  canopy(ctx, s, color, lay.map(([x, y, r], i) => [x, y, r, i % 4 === 0 ? 1 : 0]), pals, rnd);
  HALO = false;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) glow(ctx, (0.15 + rnd() * 0.7) * s, (0.08 + rnd() * 0.5) * s, s * 0.03, 'rgba(255,240,170,0.9)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ---------------------------------------------------------------- groves
function grove(ctx, s, items, shared) {
  if (shared) groundShadow(ctx, s, ...shared);
  SHADOW_OFF = !!shared;
  [...items].sort((a, b) => a[1] - b[1]).forEach(([x, y, k, fn]) => {
    ctx.save();
    ctx.translate((x - 0.5 * k) * s, (y - 0.9 * k) * s);
    ctx.scale(k, k);
    fn(ctx, s);
    ctx.restore();
  });
  SHADOW_OFF = false;
}

const FC = '#2a2018';
const G = (group, groupName) => ({ group, groupName });
const T = (id, name, g, scale, render) => ({ id: 'tr_' + id, name, category: 'world_nature', defaultScale: scale, aspect: 1, ...g, render });

const G_BROAD = G('tree_broadleaf', 'Broadleaf Trees');
const G_CONIF = G('tree_conifer', 'Conifers');
const G_SNOW = G('tree_snowy', 'Snowy Conifers');
const G_AUT = G('tree_autumn_grp', 'Autumn Trees');
const G_WILL = G('tree_willow', 'Willows');
const G_BIRCH = G('tree_birch', 'Birches');
const G_TROP = G('tree_tropical', 'Palms');
const G_SAV = G('tree_savanna', 'Savanna Trees');
const G_DEAD = G('tree_dead_grp', 'Dead & Gnarled');
const G_FANT = G('tree_fantasy', 'Fantasy Trees');
const G_GROVE = G('tree_grove', 'Groves & Clumps');

const bl = (kind, seed, f0 = FOLIAGE) => (c, s, color = FC, fill = f0) => broadleaf(c, s, color, fill, kind, seed);
const blF = (kind, seed, f0 = FOLIAGE) => (c, s) => broadleaf(c, s, FC, f0, kind, seed);
const cf = (o, f0) => (c, s, color = FC, fill = f0, seed) => conifer(c, s, color, fill, { ...o, vseed: seed });
const cfF = (o, f0) => (c, s) => conifer(c, s, FC, f0, o);

export const STAMPS_TREESA = [
  T('oak', 'Oak', G_BROAD, 1.0, bl('oak', 11)),
  T('oak_ancient', 'Ancient Oak', G_BROAD, 1.3, bl('ancient', 12)),
  T('round', 'Round Tree', G_BROAD, 0.9, bl('round', 13)),
  T('elm', 'Tall Elm', G_BROAD, 1.1, bl('tall', 14)),
  T('bush', 'Shrub', G_BROAD, 0.6, bl('bush', 15, '#7c9e4c')),

  T('pine', 'Pine', G_CONIF, 1.0, cf({ seed: 21, tiers: 4, hw: 0.3, top: 0.03, bot: 0.7, teeth: 3 }, '#4d8250')),
  T('spruce', 'Spruce', G_CONIF, 1.0, cf({ seed: 22, tiers: 5, hw: 0.27, top: 0.03, bot: 0.8, teeth: 3, slim: 0.35 }, '#5e9a6a')),
  T('fir_squat', 'Squat Fir', G_CONIF, 0.9, cf({ seed: 23, tiers: 3, hw: 0.38, top: 0.1, bot: 0.8, teeth: 4, slim: 0.62, tr: 0.09 }, '#76ac60')),
  T('cypress', 'Cypress', G_CONIF, 1.0, cf({ seed: 24, tiers: 6, hw: 0.16, top: 0.02, bot: 0.82, teeth: 2, slim: 0.6, tr: 0.05 }, '#62a05c')),

  T('snowy_pine', 'Snowy Pine', G_SNOW, 1.0, cf({ seed: 31, tiers: 4, hw: 0.31, top: 0.05, bot: 0.8, teeth: 3, snow: true }, '#4d8258')),
  T('snowy_spruce', 'Snowy Spruce', G_SNOW, 1.0, cf({ seed: 32, tiers: 5, hw: 0.27, top: 0.03, bot: 0.8, teeth: 3, slim: 0.35, snow: true }, '#437260')),

  T('autumn_gold', 'Autumn Oak', G_AUT, 1.0, (c, s, color = FC) => autumn(c, s, color, 41, ['#d9a02c', '#e07a24', '#c85a22'])),
  T('autumn_red', 'Crimson Maple', G_AUT, 1.0, (c, s, color = FC) => autumn(c, s, color, 42, ['#c8402a', '#d9622a', '#a8302a'])),

  T('willow', 'Willow', G_WILL, 1.1, (c, s, color = FC, fill = '#6e9a4c') => willow(c, s, color, fill, 51)),
  T('birch', 'Birch', G_BIRCH, 1.0, (c, s, color = FC, fill = '#7aa650') => birch(c, s, color, fill, 61)),

  T('palm', 'Palm', G_TROP, 1.0, (c, s, color = FC, fill = '#80cc58') => palm(c, s, color, fill, 71, 0.08)),
  T('palm_lean', 'Leaning Palm', G_TROP, 1.0, (c, s, color = FC, fill = '#8cd860') => palm(c, s, color, fill, 72, -0.34, false)),

  T('acacia', 'Acacia', G_SAV, 1.0, (c, s, color = FC, fill = '#a8b04e') => acacia(c, s, color, fill, 81)),
  T('baobab', 'Baobab', G_SAV, 1.1, (c, s, color = FC, fill = '#86b04c') => baobab(c, s, color, fill, 82)),

  T('dead', 'Dead Tree', G_DEAD, 1.0, (c, s, color = FC) => bare(c, s, color, 91, { depth: 4 })),
  T('gnarled', 'Gnarled Tree', G_DEAD, 1.0, (c, s, color = FC) => bare(c, s, color, 92, { gnarl: true, depth: 3 })),
  T('barren', 'Barren Snag', G_DEAD, 0.9, (c, s, color = FC) => bare(c, s, color, 93, { depth: 3, barren: true })),

  T('crystal', 'Crystal Tree', G_FANT, 1.0, (c, s, color = '#241a30') => crystalTree(c, s, color, 101)),
  T('glow', 'Glowing Tree', G_FANT, 1.0, (c, s, color = '#1c2a2a', fill = '#3fc0a0') => glowTree(c, s, color, fill, 102)),
  T('world', 'World Tree', G_FANT, 1.6, (c, s, color = FC) => worldTree(c, s, color, 103)),

  T('grove_oak', 'Oak Grove', G_GROVE, 1.3, (c, s) => grove(c, s, [
    [0.34, 0.84, 0.7, blF('oak', 111)], [0.66, 0.86, 0.7, blF('round', 112)], [0.5, 0.93, 0.8, blF('oak', 113)]], [0.5, 0.9, 0.42, 0.075])),
  T('grove_pine', 'Pine Stand', G_GROVE, 1.3, (c, s) => grove(c, s, [
    [0.25, 0.8, 0.6, cfF({ seed: 121, tiers: 4, hw: 0.27 }, '#4d8250')], [0.75, 0.82, 0.62, cfF({ seed: 122, tiers: 5, hw: 0.23, slim: 0.35 }, '#477a58')],
    [0.5, 0.9, 0.78, cfF({ seed: 123, tiers: 4, hw: 0.27 }, '#5a9255')]])),
  T('grove_snow', 'Snowy Stand', G_GROVE, 1.3, (c, s) => grove(c, s, [
    [0.28, 0.82, 0.6, cfF({ seed: 131, tiers: 4, hw: 0.27, snow: true }, '#4d8258')], [0.74, 0.84, 0.62, cfF({ seed: 132, tiers: 5, hw: 0.23, slim: 0.35, snow: true }, '#437260')],
    [0.5, 0.92, 0.74, cfF({ seed: 133, tiers: 4, hw: 0.27, snow: true }, '#4d8258')]])),
  T('thicket', 'Thicket', G_GROVE, 1.0, (c, s) => grove(c, s, [
    [0.33, 0.86, 0.62, blF('bush', 141, '#7c9e4c')], [0.67, 0.86, 0.6, blF('bush', 142, '#7c9e4c')], [0.5, 0.92, 0.7, blF('bush', 143, '#7c9e4c')]], [0.5, 0.9, 0.4, 0.07])),
];
