// Race settlement stamps (settlementsA workstream). Same shape as entries in stampsCatalog.js STAMPS.
// Every stamp draws in unit space (1 unit = stamp height). Light comes from the upper left.

let INK = '#2c221e', FILL = '#dcd4c0', LW = 0.01;

// ---------- colour + prng helpers ----------
const hex2 = (h) => {
  if (typeof h !== 'string' || !/^#[0-9a-f]{3,6}$/i.test(h)) return [128, 128, 128];
  h = h.slice(1);
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const mix = (a, b, t) => {
  const A = hex2(a), B = hex2(b);
  return '#' + A.map((v, i) => Math.round(Math.max(0, Math.min(255, v + (B[i] - v) * t))).toString(16).padStart(2, '0')).join('');
};
const lit = (c, t) => mix(c, '#fff4d2', t);
const dk = (c, t) => mix(c, '#150c26', t);
const wt = (c) => mix(c, FILL, 0.3); // tint a wall colour towards the user's fill
const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

// ---------- drawing primitives ----------
const stroke = (c) => { c.strokeStyle = INK; c.lineWidth = LW; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
const poly = (c, pts, f, st = true) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (f) { c.fillStyle = f; c.fill(); }
  if (st) stroke(c);
};
const ell = (c, x, y, rx, ry, f, st = true) => {
  c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.0001), Math.max(ry, 0.0001), 0, 0, Math.PI * 2);
  if (f) { c.fillStyle = f; c.fill(); }
  if (st) stroke(c);
};
const line = (c, x1, y1, x2, y2, col = INK, w = LW, a = 1) => {
  c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.globalAlpha = 1;
};
// horizontal light-to-dark gradient: lit on the left, shaded on the right
const cg = (c, x0, x1, col, a = 0.35, b = 0.4) => {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, lit(col, a)); g.addColorStop(0.5, col); g.addColorStop(1, dk(col, b));
  return g;
};
const cone = (c, x, y, rx, h, col, ry = rx * 0.35) => {
  c.beginPath(); c.moveTo(x - rx, y); c.lineTo(x, y - h); c.lineTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.closePath();
  c.fillStyle = cg(c, x - rx, x + rx, col); c.fill(); stroke(c);
};
const dome = (c, x, y, rx, h, col, ry = rx * 0.3) => {
  c.beginPath(); c.moveTo(x - rx, y); c.ellipse(x, y, rx, h, 0, Math.PI, Math.PI * 2); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.closePath();
  c.fillStyle = cg(c, x - rx, x + rx, col, 0.4, 0.45); c.fill(); stroke(c);
  ell(c, x - rx * 0.35, y - h * 0.62, rx * 0.2, h * 0.14, 'rgba(255,250,230,.35)', false);
};
const cyl = (c, x, y, rx, h, col, ry = rx * 0.35, top = true) => {
  c.beginPath(); c.moveTo(x - rx, y - h); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, y - h); c.closePath();
  c.fillStyle = cg(c, x - rx, x + rx, col); c.fill(); stroke(c);
  if (top) ell(c, x, y - h, rx, ry, lit(col, 0.3));
};
// 3/4 block: front (lit), right side (shaded), optional flat top. (x,y) = bottom-left of front face
const box = (c, x, y, w, h, d, col, o = {}) => {
  const f = lit(col, 0.12), s = dk(col, 0.32);
  poly(c, [[x + w, y], [x + w + d, y - d * 0.5], [x + w + d, y - h - d * 0.5], [x + w, y - h]], s);
  poly(c, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], f);
  if (o.top !== false) poly(c, [[x, y - h], [x + w, y - h], [x + w + d, y - h - d * 0.5], [x + d, y - h - d * 0.5]], lit(col, 0.4));
  if (o.bricks) {
    for (let i = 1; i < 4; i++) line(c, x, y - (h * i) / 4, x + w, y - (h * i) / 4, INK, LW * 0.5, 0.3);
    for (let i = 1; i < 3; i++) line(c, x + w + (d * i) / 3, y - (d * i) / 6, x + w + (d * i) / 3, y - h - (d * i) / 6, INK, LW * 0.5, 0.3);
  }
  if (o.cren) {
    const n = o.cren, cw = w / (n * 2 - 1), ms = Math.min(h, w) * 0.16;
    for (let i = 0; i < n; i++) poly(c, [[x + i * 2 * cw, y - h], [x + i * 2 * cw, y - h - ms], [x + i * 2 * cw + cw, y - h - ms], [x + i * 2 * cw + cw, y - h]], f);
  }
};
// gable-roofed house, ridge running away to the right. (x,y)=bottom-left. returns chimney anchor.
const gable = (c, x, y, w, h, d, rh, wall, roof, o = {}) => {
  poly(c, [[x + w, y], [x + w + d, y - d * 0.5], [x + w + d, y - h - d * 0.5], [x + w, y - h]], dk(wall, 0.3));
  poly(c, [[x, y], [x + w, y], [x + w, y - h], [x + w / 2, y - h - rh], [x, y - h]], lit(wall, 0.1));
  const A = [x + w / 2, y - h - rh], A2 = [x + w / 2 + d, y - h - rh - d * 0.5], E = [x + w + (o.ov || 0), y - h], E2 = [x + w + d + (o.ov || 0), y - h - d * 0.5];
  poly(c, [A, A2, E2, E], roof);
  const n = o.shingle || 3;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    line(c, A[0] + (E[0] - A[0]) * t, A[1] + (E[1] - A[1]) * t, A2[0] + (E2[0] - A2[0]) * t, A2[1] + (E2[1] - A2[1]) * t, INK, LW * 0.5, 0.35);
  }
  line(c, A[0], A[1], A2[0], A2[1], lit(roof, 0.5), LW * 0.8, 0.8);
  line(c, x, y - h, A[0], A[1], dk(roof, 0.25), LW * 1.6);
  if (o.timber) {
    line(c, x + w * 0.5, y - h, x + w * 0.5, y, INK, LW * 0.6, 0.45); line(c, x, y - h * 0.5, x + w, y - h * 0.5, INK, LW * 0.6, 0.45);
  }
  if (o.door !== false) {
    c.beginPath(); c.moveTo(x + w * 0.4, y); c.lineTo(x + w * 0.4, y - h * 0.5); c.arc(x + w * 0.5, y - h * 0.5, w * 0.1, Math.PI, 0); c.lineTo(x + w * 0.6, y); c.closePath();
    c.fillStyle = o.doorCol || '#4a2f20'; c.fill(); stroke(c);
  }
  if (o.win !== false) { poly(c, [[x + w * 0.1, y - h * 0.45], [x + w * 0.27, y - h * 0.45], [x + w * 0.27, y - h * 0.72], [x + w * 0.1, y - h * 0.72]], o.winCol || '#f2c35e'); }
  return [(A[0] + E[0]) / 2 + d * 0.25, (A[1] + E[1]) / 2 - d * 0.1];
};
const chimney = (c, x, y, w, h, col) => {
  poly(c, [[x + w, y], [x + w * 1.5, y - w * 0.25], [x + w * 1.5, y - h - w * 0.25], [x + w, y - h]], dk(col, 0.35));
  poly(c, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], lit(col, 0.1));
  poly(c, [[x, y - h], [x + w, y - h], [x + w * 1.5, y - h - w * 0.25], [x + w * 0.5, y - h - w * 0.25]], dk(col, 0.6));
};
const spire = (c, x, y, w, h, col) => {
  poly(c, [[x, y], [x + w, y], [x + w * 1.5, y - w * 0.4], [x + w * 0.5, y - h]], dk(col, 0.3));
  poly(c, [[x - w * 0.1, y], [x + w * 0.5, y - h], [x + w, y]], lit(col, 0.1));
};
const flame = (c, x, y, s) => {
  poly(c, [[x - s * 0.5, y], [x - s * 0.3, y - s * 0.9], [x, y - s * 0.5], [x + s * 0.15, y - s * 1.5], [x + s * 0.5, y]], '#ef7a22', false);
  poly(c, [[x - s * 0.25, y], [x, y - s * 0.8], [x + s * 0.25, y]], '#ffd24a', false);
};
const banner = (c, x, y, h, col) => {
  line(c, x, y, x, y - h, INK, LW * 1.3);
  poly(c, [[x, y - h], [x + h * 0.55, y - h * 0.9], [x + h * 0.4, y - h * 0.75], [x + h * 0.55, y - h * 0.6], [x, y - h * 0.62]], col);
};
const gear = (c, x, y, r, col, teeth = 8) => {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.28; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); pts.push([x + Math.cos(a + 0.2) * rr, y + Math.sin(a + 0.2) * rr]); }
  poly(c, pts, col);
  ell(c, x, y, r * 0.38, r * 0.38, dk(col, 0.5));
};
const tree = (c, x, y, s, col, r) => {
  ell(c, x + s * 0.2, y, s * 0.55, s * 0.18, 'rgba(20,30,10,.25)', false);
  line(c, x, y, x, y - s * 0.5, '#4a3322', LW * 2.2);
  ell(c, x, y - s * 0.85, s * 0.5, s * 0.45, col);
  ell(c, x - s * 0.15, y - s * 1.0, s * 0.25, s * 0.2, lit(col, 0.35), false);
  if (r && r() < 2) line(c, x + s * 0.1, y - s * 0.55, x + s * 0.3, y - s * 0.8, dk(col, 0.4), LW * 0.5, 0.5);
};
const pine = (c, x, y, s, col) => {
  ell(c, x + s * 0.15, y, s * 0.4, s * 0.12, 'rgba(20,30,10,.25)', false);
  for (let i = 0; i < 3; i++) poly(c, [[x - s * (0.42 - i * 0.1), y - s * (0.2 + i * 0.4)], [x, y - s * (0.85 + i * 0.4)], [x + s * (0.42 - i * 0.1), y - s * (0.2 + i * 0.4)]], i % 2 ? lit(col, 0.12) : col);
};
const rock = (c, x, y, s, col = '#8d8a82') => {
  ell(c, x + s * 0.15, y, s * 0.5, s * 0.14, 'rgba(0,0,0,.2)', false);
  poly(c, [[x - s * 0.45, y], [x - s * 0.3, y - s * 0.4], [x + s * 0.05, y - s * 0.55], [x + s * 0.4, y - s * 0.25], [x + s * 0.45, y]], col);
  poly(c, [[x - s * 0.3, y - s * 0.4], [x + s * 0.05, y - s * 0.55], [x, y - s * 0.3]], lit(col, 0.4), false);
};
const smokeAt = (fx, x, y, s) => fx.push({ x, y, s });
const drawSmoke = (c, p) => {
  for (let i = 0; i < 4; i++) {
    const cx = p.x + i * p.s * 0.2 + Math.sin(i) * p.s * 0.04, cy = p.y - i * p.s * 0.3, rr = p.s * (0.1 + 0.05 * i);
    c.globalAlpha = 0.9 - i * 0.18; ell(c, cx, cy, rr, rr * 0.9, '#ece8e0', false); c.globalAlpha = 0.25 - i * 0.04; ell(c, cx, cy, rr, rr * 0.9, null, true); c.globalAlpha = 1;
  }
};
const lantern = (c, x, y, s, col = '#ffd870') => { ell(c, x, y, s * 1.8, s * 1.8, 'rgba(255,220,120,.25)', false); ell(c, x, y, s, s * 1.15, col, false); };
const bricks = (c, x, y, w, h, r, n = 4) => { for (let i = 0; i < n; i++) { const yy = y - h * (0.15 + r() * 0.7), xx = x + w * r() * 0.7; line(c, xx, yy, xx + w * 0.22, yy, INK, LW * 0.5, 0.3); } };

// ---------- RACES ----------
const R = {};

// HUMAN
R.human = {
  lsk: 0.92,
  ground: ['#a9a66e', '#8b9a5a'], wall: { kind: 'stone', col: '#b8b0a0', hw: 0.1, cren: 'sq' },
  house(c, x, y, s, r, fx) {
    const w = s * (0.85 + r() * 0.35), h = s * (0.5 + r() * 0.2), d = s * 0.42, rh = s * (0.45 + r() * 0.15);
    const roof = pick(r, ['#a3392f', '#8a4a2a', '#5f6e7e', '#b87530']);
    const a = gable(c, x - w / 2, y, w, h, d, rh, wt(pick(r, ['#e6dab8', '#d8c9a2', '#eadfca'])), roof, { timber: true, shingle: 3 });
    if (r() < 0.5) { chimney(c, a[0] - s * 0.1, a[1] + s * 0.05, s * 0.13, s * 0.3, '#8b8378'); smokeAt(fx, a[0], a[1] - s * 0.3, s * 0.6); }
  },
  prop(c, x, y, s, r) { r() < 0.7 ? tree(c, x, y, s, pick(r, ['#4f7d3a', '#5b8a3f', '#6b8f3a']), r) : rock(c, x, y, s * 0.6); },
  land(c, x, y, s, r, lvl, fx) {
    if (lvl >= 4) {
      s *= 0.82;
      const w = s * 1.7, h = s * 1.3, d = s * 0.7, x0 = x - w / 2;
      box(c, x0, y, w, h, d, wt('#b9b2a2'), { cren: 5, bricks: true });
      for (const [tx, ty] of [[x0 - s * 0.15, y + s * 0.1], [x0 + w + d * 0.9, y - d * 0.4]]) {
        cyl(c, tx + s * 0.2, ty, s * 0.28, h * 1.3, wt('#b9b2a2'));
        cone(c, tx + s * 0.2, ty - h * 1.3, s * 0.36, s * 0.6, '#a3392f');
        banner(c, tx + s * 0.2, ty - h * 1.3 - s * 0.55, s * 0.45, '#c42a2a');
      }
      box(c, x - s * 0.35, y + s * 0.02, s * 0.7, s * 0.9, s * 0.2, wt('#c4bdad'), { cren: 3 });
      c.beginPath(); c.moveTo(x - s * 0.15, y + s * 0.02); c.lineTo(x - s * 0.15, y - s * 0.4); c.arc(x, y - s * 0.4, s * 0.15, Math.PI, 0); c.lineTo(x + s * 0.15, y + s * 0.02); c.closePath(); c.fillStyle = '#2d1c14'; c.fill(); stroke(c);
      box(c, x - s * 0.3, y - h - d * 0.5, s * 0.6, s * 0.9, s * 0.3, wt('#c4bdad'), { cren: 3 });
      spire(c, x + s * 0.05, y - h - d * 0.5 - s * 0.9, s * 0.55, s * 0.7, '#a3392f');
      banner(c, x + s * 0.25, y - h - d * 0.5 - s * 1.55, s * 0.5, '#2a4fb0');
      return;
    }
    const k = lvl;
    const nw = s * (1.0 + k * 0.1), nh = s * 0.7;
    gable(c, x - nw * 0.1, y, nw, nh, s * 0.8, s * 0.55, wt('#e6dcc4'), '#7a4a32', { shingle: 4, door: false, win: false });
    box(c, x - nw * 0.1 - s * 0.55, y, s * 0.5, s * 1.35, s * 0.3, wt('#cfc7b4'), { bricks: true });
    spire(c, x - nw * 0.1 - s * 0.55, y - s * 1.35 - s * 0.15, s * 0.5, s * (0.9 + k * 0.1), '#5f6e7e');
    ell(c, x - nw * 0.1 - s * 0.3, y - s * 1.0, s * 0.09, s * 0.12, '#f2c35e');
    if (k >= 3) { box(c, x + nw * 0.95, y, s * 0.45, s * 1.0, s * 0.3, wt('#cfc7b4')); spire(c, x + nw * 0.95, y - s * 1.0 - s * 0.15, s * 0.45, s * 0.8, '#5f6e7e'); }
  },
  extra(c, cx, cy, r, lvl) { // well / market stalls
    if (lvl < 2) return;
    ell(c, cx + 0.0, cy + 0.07, 0.025, 0.012, '#6d6a62'); ell(c, cx, cy + 0.065, 0.016, 0.007, '#2a4a66', false);
  }
};

// ELF
R.elf = {
  lsk: 0.72,
  ground: ['#79a65f', '#5f9150'], wall: { kind: 'trunk', col: '#3f7f4a', hw: 0.12 }, sp: 1.3,
  house(c, x, y, s, r, fx) {
    const t = pick(r, ['#8b6a4a', '#9a7656', '#a58a68']), canopy = pick(r, ['#4fa070', '#68b078', '#3f8f78', '#7fb95c']);
    const th = s * (1.1 + r() * 0.4);
    ell(c, x + s * 0.3, y, s * 0.6, s * 0.15, 'rgba(15,40,20,.28)', false);
    poly(c, [[x - s * 0.2, y], [x - s * 0.13, y - th], [x + s * 0.13, y - th], [x + s * 0.22, y]], cg(c, x - s * 0.2, x + s * 0.22, t)); // trunk
    for (const [dx, dy, k] of [[-0.35, -0.15, 0.4], [0.3, -0.1, 0.42], [0, 0.1, 0.5], [-0.05, -0.32, 0.4]]) {
      ell(c, x + dx * s, y - th - dy * s, s * k + s * 0.04, s * k * 0.8, mix(canopy, '#143a2a', 0.1 + (dx > 0 ? 0.25 : 0)));
    }
    for (const [dx, dy] of [[-0.3, -0.22], [0.15, -0.2], [-0.02, -0.4]]) ell(c, x + dx * s, y - th - dy * s, s * 0.2, s * 0.15, lit(canopy, 0.4), false);
    // cabin with lily roof
    const cw = s * 0.5, cy2 = y - th * 0.45;
    poly(c, [[x + s * 0.18, cy2], [x + s * 0.18 + cw, cy2], [x + s * 0.18 + cw, cy2 - cw * 0.7], [x + s * 0.18, cy2 - cw * 0.7]], '#efe6cf');
    c.beginPath(); c.moveTo(x + s * 0.1, cy2 - cw * 0.7); c.quadraticCurveTo(x + s * 0.3, cy2 - cw * 0.75, x + s * 0.18 + cw * 0.5, cy2 - cw * 1.5); c.quadraticCurveTo(x + s * 0.4 + cw, cy2 - cw * 0.8, x + s * 0.28 + cw, cy2 - cw * 0.65); c.closePath(); c.fillStyle = '#4f9a7a'; c.fill(); stroke(c);
    ell(c, x + s * 0.18 + cw * 0.5, cy2 - cw * 0.28, s * 0.07, s * 0.12, '#ffdf7a');
    lantern(c, x - s * 0.1, y - s * 0.2, s * 0.05);
    line(c, x + s * 0.18, cy2, x + s * 0.0, y - s * 0.05, '#6a4f36', LW, 1);
  },
  prop(c, x, y, s, r) { tree(c, x, y, s * 0.9, pick(r, ['#4fa070', '#68b078', '#3f8f78']), r); },
  land(c, x, y, s, r, lvl, fx) {
    const t = '#a58a68', th = s * 1.3;
    ell(c, x, y, s * 1.2, s * 0.25, 'rgba(15,40,20,.28)', false);
    poly(c, [[x - s * 0.6, y + s * 0.05], [x - s * 0.3, y - th], [x + s * 0.3, y - th], [x + s * 0.65, y + s * 0.05]], cg(c, x - s * 0.6, x + s * 0.65, t));
    line(c, x - s * 0.2, y, x - s * 0.1, y - th, INK, LW * 0.6, 0.4); line(c, x + s * 0.1, y, x + s * 0.05, y - th, INK, LW * 0.6, 0.4);
    // white spire tower
    poly(c, [[x - s * 0.15, y - th * 0.5], [x + s * 0.15, y - th * 0.5], [x + s * 0.1, y - th - s * 0.8], [x, y - th - s * 1.5], [x - s * 0.1, y - th - s * 0.8]], '#c6c2e6');
    ell(c, x, y - th * 0.9, s * 0.05, s * 0.1, '#7ad0ff');
    const cols = ['#3f8f6a', '#4fa070', '#68b078', '#3f8f78'];
    const bl = [[-0.9, 0.0], [0.9, 0.0], [-0.55, -0.5], [0.55, -0.5], [0, -0.75], [-1.1, 0.35], [1.1, 0.35], [0, -0.1]];
    bl.forEach(([dx, dy], i) => ell(c, x + dx * s, y - th - dy * s * 0.5, s * (0.55 + (i % 2) * 0.1), s * 0.45, mix(cols[i % 4], '#143a2a', dx > 0 ? 0.3 : 0.05)));
    for (const [dx, dy] of [[-0.8, 0.0], [-0.4, -0.45], [0.1, -0.7]]) ell(c, x + dx * s, y - th - dy * s * 0.5, s * 0.3, s * 0.2, lit('#68b078', 0.35), false);
    spire(c, x - s * 0.1, y - th - s * 0.55, s * 0.2, s * 1.1, '#c6c2e6');
    for (let i = 0; i < 6 + lvl * 2; i++) lantern(c, x + (r() - 0.5) * s * 2.2, y - th - (r() - 0.2) * s * 0.9, s * 0.05);
    if (lvl >= 4) { banner(c, x, y - th - s * 1.5, s * 0.55, '#58b0c8'); }
  },
};

// DWARF
const slate = ['#58606c', '#4d5560', '#66606a'];
R.dwarf = {
  lsk: 0.9,
  ground: ['#8d887a', '#767368'], wall: { kind: 'stone', col: '#7d7a72', hw: 0.11, cren: 'sq' },
  house(c, x, y, s, r, fx) {
    const w = s * (0.9 + r() * 0.3), h = s * (0.55 + r() * 0.15), d = s * 0.5, x0 = x - w / 2, col = wt('#9c9588');
    box(c, x0, y, w, h, d, col, { top: false, bricks: true });
    // hip slate roof
    const rc = pick(r, slate), ap = [x0 + w * 0.5 + d * 0.5, y - h - s * 0.4 - d * 0.25];
    poly(c, [[x0 + w, y - h], [x0 + w + d, y - h - d * 0.5], ap], dk(rc, 0.3));
    poly(c, [[x0 - s * 0.05, y - h], [x0 + w + s * 0.05, y - h], ap], lit(rc, 0.1));
    poly(c, [[x0 + d, y - h - d * 0.5], [x0 - s * 0.05, y - h], ap], lit(rc, 0.3));
    c.beginPath(); c.moveTo(x - w * 0.14, y); c.lineTo(x - w * 0.14, y - h * 0.45); c.arc(x, y - h * 0.45, w * 0.14, Math.PI, 0); c.lineTo(x + w * 0.14, y); c.closePath(); c.fillStyle = '#3a2a20'; c.fill(); stroke(c);
    line(c, x - w * 0.14, y - h * 0.3, x + w * 0.14, y - h * 0.3, '#9a9aa0', LW * 1.2);
    ell(c, x0 + w * 0.2, y - h * 0.55, s * 0.05, s * 0.06, '#f08a2a');
    chimney(c, x0 + w * 0.65, y - h - s * 0.15, s * 0.16, s * 0.4, '#6b665e'); if (r() < 0.5) smokeAt(fx, x0 + w * 0.7, y - h - s * 0.62, s * 0.6);
  },
  prop(c, x, y, s, r) { r() < 0.5 ? pine(c, x, y, s * 0.9, '#3c5a46') : rock(c, x, y, s * 0.8, '#8d8a82'); },
  land(c, x, y, s, r, lvl, fx) {
    const W = s * (1.9 + lvl * 0.1), Hh = s * (1.5 + lvl * 0.15), x0 = x - W / 2, rc = '#8a867c';
    // mountain mass
    const g = c.createLinearGradient(x0, y - Hh, x0 + W, y);
    g.addColorStop(0, '#b8b4aa'); g.addColorStop(0.5, rc); g.addColorStop(1, '#4f4c48');
    c.beginPath(); c.moveTo(x0 - s * 0.2, y + s * 0.05); c.lineTo(x0 + W * 0.15, y - Hh * 0.55); c.lineTo(x0 + W * 0.3, y - Hh * 0.7); c.lineTo(x0 + W * 0.42, y - Hh); c.lineTo(x0 + W * 0.58, y - Hh * 0.8); c.lineTo(x0 + W * 0.72, y - Hh * 0.92); c.lineTo(x0 + W * 0.9, y - Hh * 0.5); c.lineTo(x0 + W + s * 0.2, y + s * 0.05); c.closePath(); c.fillStyle = g; c.fill(); stroke(c);
    poly(c, [[x0 + W * 0.42, y - Hh], [x0 + W * 0.36, y - Hh * 0.82], [x0 + W * 0.47, y - Hh * 0.85], [x0 + W * 0.52, y - Hh * 0.87]], '#eef0f2', false);
    poly(c, [[x0 + W * 0.72, y - Hh * 0.92], [x0 + W * 0.66, y - Hh * 0.8], [x0 + W * 0.77, y - Hh * 0.78]], '#eef0f2', false);
    line(c, x0 + W * 0.42, y - Hh, x0 + W * 0.5, y - Hh * 0.4, INK, LW * 0.6, 0.35); line(c, x0 + W * 0.72, y - Hh * 0.92, x0 + W * 0.68, y - Hh * 0.35, INK, LW * 0.6, 0.35);
    // great gate
    const gw = W * 0.26, gh = Hh * 0.5;
    box(c, x - gw * 0.8, y + s * 0.02, gw * 1.6, gh * 1.15, s * 0.15, '#9a968c', { top: true, bricks: true });
    c.beginPath(); c.moveTo(x - gw / 2, y); c.lineTo(x - gw / 2, y - gh * 0.55); c.arc(x, y - gh * 0.55, gw / 2, Math.PI, 0); c.lineTo(x + gw / 2, y); c.closePath(); c.fillStyle = '#1f1612'; c.fill(); stroke(c);
    ell(c, x, y - gh * 0.35, gw * 0.3, gh * 0.28, 'rgba(240,140,40,.55)', false);
    for (let i = 0; i < 4; i++) line(c, x - gw / 2 + (gw * (i + 0.5)) / 4, y, x - gw / 2 + (gw * (i + 0.5)) / 4, y - gh * 0.8, '#6a6a70', LW * 0.7, 0.8);
    chimney(c, x0 + W * 0.15, y - Hh * 0.35, s * 0.2, s * 0.5, '#6b665e'); smokeAt(fx, x0 + W * 0.2, y - Hh * 0.35 - s * 0.75, s * 0.8);
    chimney(c, x0 + W * 0.8, y - Hh * 0.28, s * 0.2, s * 0.4, '#6b665e'); smokeAt(fx, x0 + W * 0.85, y - Hh * 0.28 - s * 0.65, s * 0.7);
    if (lvl >= 4) { banner(c, x - gw, y - gh * 1.15, s * 0.7, '#c4552a'); banner(c, x + gw, y - gh * 1.15, s * 0.7, '#c4552a'); }
  },
};

// ORC / GOBLIN
R.orc = {
  lsk: 0.85,
  ground: ['#b49a6e', '#9a8058'], wall: { kind: 'pal', col: '#9a7440', hw: 0.12 }, rim: true,
  house(c, x, y, s, r, fx) {
    const col = pick(r, ['#8a6a48', '#7a5a3a', '#6b6a45', '#8f7452']);
    if (r() < 0.3) { // log hut
      const w = s * 1.1, h = s * 0.45, d = s * 0.5;
      box(c, x - w / 2, y, w, h, d, '#7a5a3a', { top: false });
      for (let i = 1; i < 3; i++) line(c, x - w / 2, y - (h * i) / 3, x + w / 2, y - (h * i) / 3, INK, LW * 0.6, 0.5);
      poly(c, [[x - w / 2 - s * 0.08, y - h], [x - w / 2 + w * 0.5, y - h - s * 0.45], [x + w / 2 + s * 0.08, y - h]], lit(col, 0.05));
      poly(c, [[x - w / 2 + w * 0.5, y - h - s * 0.45], [x - w / 2 + w * 0.5 + d, y - h - s * 0.45 - d * 0.5], [x + w / 2 + d, y - h - d * 0.5], [x + w / 2 + s * 0.08, y - h]], dk(col, 0.3));
      poly(c, [[x - w * 0.12, y], [x - w * 0.12, y - h * 0.8], [x + w * 0.12, y - h * 0.8], [x + w * 0.12, y]], '#2a1c14');
      poly(c, [[x - w / 2 + w * 0.5 - s * 0.04, y - h - s * 0.45], [x - w / 2 + w * 0.5, y - h - s * 0.62], [x - w / 2 + w * 0.5 + s * 0.04, y - h - s * 0.45]], '#e8e2cf');
      return;
    }
    const rx = s * 0.55, h = s * 0.95;
    cone(c, x, y, rx, h, col);
    for (const a of [-0.55, -0.15, 0.3]) line(c, x, y - h, x + a * rx * 1.6, y + rx * 0.3 * Math.cos(a * 1.4), INK, LW * 0.5, 0.35);
    poly(c, [[x - rx * 0.28, y + rx * 0.2], [x, y - h * 0.5], [x + rx * 0.28, y + rx * 0.2]], '#2a1c14');
    line(c, x - s * 0.18, y - h - s * 0.1, x + s * 0.18, y - h + s * 0.08, '#4a3322', LW * 1.8); line(c, x + s * 0.18, y - h - s * 0.1, x - s * 0.18, y - h + s * 0.08, '#4a3322', LW * 1.8);
    if (r() < 0.22) { ell(c, x + rx * 0.45, y - h * 0.25, s * 0.07, s * 0.07, '#e8e2cf'); ell(c, x + rx * 0.4, y - h * 0.25, s * 0.015, s * 0.02, INK, false); ell(c, x + rx * 0.5, y - h * 0.25, s * 0.015, s * 0.02, INK, false); }
    if (r() < 0.35) smokeAt(fx, x, y - h - s * 0.1, s * 0.5);
  },
  prop(c, x, y, s, r) {
    if (r() < 0.5) { for (let i = -1; i <= 1; i++) poly(c, [[x + i * s * 0.18 - s * 0.05, y], [x + i * s * 0.18, y - s * (0.55 + r() * 0.15)], [x + i * s * 0.18 + s * 0.05, y]], '#7a5a3a'); }
    else { line(c, x, y, x, y - s * 0.8, '#4a3322', LW * 2); ell(c, x, y - s * 0.85, s * 0.11, s * 0.1, '#e8e2cf'); ell(c, x - s * 0.04, y - s * 0.86, s * 0.02, s * 0.025, INK, false); ell(c, x + s * 0.04, y - s * 0.86, s * 0.02, s * 0.025, INK, false); }
  },
  land(c, x, y, s, r, lvl, fx) {
    const w = s * 2.0, h = s * 0.8, d = s * 0.9, x0 = x - w / 2;
    box(c, x0, y, w, h, d, '#6a4a30', { top: false });
    for (let i = 1; i < 4; i++) line(c, x0, y - (h * i) / 4, x0 + w, y - (h * i) / 4, INK, LW * 0.6, 0.5);
    const col = '#7f6342';
    poly(c, [[x0 - s * 0.12, y - h], [x, y - h - s * 0.95], [x0 + w + s * 0.12, y - h]], lit(col, 0.05));
    poly(c, [[x, y - h - s * 0.95], [x + d, y - h - s * 0.95 - d * 0.5], [x0 + w + d, y - h - d * 0.5], [x0 + w + s * 0.12, y - h]], dk(col, 0.3));
    for (const dx of [-0.35, 0, 0.35]) line(c, x + dx * w * 0.5, y - h - s * 0.1, x + dx * w * 0.5, y - h - s * 0.5 + Math.abs(dx) * s, INK, LW * 0.5, 0.4);
    poly(c, [[x - w * 0.12, y], [x - w * 0.12, y - h * 0.75], [x + w * 0.12, y - h * 0.75], [x + w * 0.12, y]], '#241810');
    poly(c, [[x - s * 0.12, y - h - s * 0.9], [x - s * 0.55, y - h - s * 1.3], [x - s * 0.3, y - h - s * 0.85]], '#e8e2cf'); // horns
    poly(c, [[x + s * 0.12, y - h - s * 0.9], [x + s * 0.55, y - h - s * 1.3], [x + s * 0.3, y - h - s * 0.85]], '#cfc8b4');
    ell(c, x, y - h - s * 0.55, s * 0.12, s * 0.11, '#e8e2cf'); ell(c, x - s * 0.04, y - h - s * 0.55, s * 0.025, s * 0.03, INK, false); ell(c, x + s * 0.04, y - h - s * 0.55, s * 0.025, s * 0.03, INK, false);
    for (const sx of [x0 - s * 0.35, x0 + w + s * 0.5]) { line(c, sx, y + s * 0.05, sx, y - s * 1.1, '#4a3322', LW * 2.4); ell(c, sx, y - s * 1.15, s * 0.1, s * 0.09, '#e8e2cf'); banner(c, sx, y - s * 0.9, s * 0.4, '#8a2a20'); }
    smokeAt(fx, x + w * 0.3, y - h - s * 0.6, s * 0.7);
  },
  extra(c, cx, cy, r, lvl, fx) {
    const s = 0.08; ell(c, cx, cy + 0.12, s * 0.8, s * 0.3, '#3a2e26'); flame(c, cx, cy + 0.12, s * 0.7); smokeAt(fx, cx, cy + 0.07, 0.07);
  },
};

// HALFLING
R.halfling = {
  ground: ['#88b95f', '#6ea04e'], wall: { kind: 'fence', col: '#8b6a50', hw: 0.08 }, nm: 1.35,
  house(c, x, y, s, r, fx) {
    const g = pick(r, ['#6fa84c', '#7db556', '#62a050']), rx = s * (0.65 + r() * 0.15), h = s * 0.7;
    dome(c, x, y, rx, h, g, rx * 0.22);
    for (let i = 0; i < 2; i++) { const a = r() * 3 + 0.1, rr = r() * 0.6; const fxp = x + Math.cos(a) * rx * rr * 0.9 - rx * 0.1, fyp = y - Math.sin(a) * h * rr * 0.9 - h * 0.1; ell(c, fxp, fyp, s * 0.025, s * 0.025, pick(r, ['#f4d34a', '#f08090', '#ffffff']), false); }
    const dc = pick(r, ['#c4402a', '#d8a82a', '#3a7a4a', '#3a5aa8']);
    ell(c, x, y - rx * 0.28, rx * 0.3, rx * 0.34, '#d9d0a8'); ell(c, x, y - rx * 0.28, rx * 0.22, rx * 0.26, dc);
    ell(c, x + rx * 0.08, y - rx * 0.28, s * 0.018, s * 0.018, '#ffd24a', false);
    ell(c, x + rx * 0.62, y - h * 0.3, s * 0.07, s * 0.07, '#f2c35e');
    if (r() < 0.5) { chimney(c, x + rx * 0.2, y - h * 0.82, s * 0.1, s * 0.22, '#8b6a50'); smokeAt(fx, x + rx * 0.27, y - h * 0.82 - s * 0.28, s * 0.45); }
    for (let i = 0; i < 3; i++) line(c, x - rx * 1.0 + i * s * 0.06, y + s * 0.08, x - rx * 1.0 + i * s * 0.06, y + s * 0.01, '#8b6a50', LW * 1.4); // fence bit
    line(c, x - rx * 1.0, y + s * 0.05, x - rx * 0.88, y + s * 0.05, '#8b6a50', LW);
  },
  prop(c, x, y, s, r) {
    if (r() < 0.3) tree(c, x, y, s * 0.8, '#5f9a46', r);
    else { for (let i = -1; i <= 1; i++) line(c, x - s * 0.3, y + i * s * 0.1, x + s * 0.3, y + i * s * 0.1, '#6b4a2a', LW * 2, 0.9); for (let i = -2; i <= 2; i++) ell(c, x + i * s * 0.12, y - s * 0.05, s * 0.04, s * 0.05, '#4f9a3a', false); }
  },
  land(c, x, y, s, r, lvl, fx) {
    s *= lvl >= 3 ? 1.35 : lvl >= 2 ? 1.15 : 1;
    const mx = x + s * 0.7;
    dome(c, x - s * 0.6, y, s * 1.2, s * 1.0, '#6fa84c', s * 0.25);
    ell(c, x - s * 0.6, y - s * 0.38, s * 0.3, s * 0.34, '#d9d0a8'); ell(c, x - s * 0.6, y - s * 0.38, s * 0.23, s * 0.27, '#c4402a');
    ell(c, x - s * 1.05, y - s * 0.35, s * 0.1, s * 0.1, '#f2c35e'); ell(c, x - s * 0.15, y - s * 0.35, s * 0.1, s * 0.1, '#f2c35e');
    poly(c, [[mx - s * 0.4, y], [mx - s * 0.26, y - s * 1.3], [mx + s * 0.26, y - s * 1.3], [mx + s * 0.4, y]], cg(c, mx - s * 0.4, mx + s * 0.4, '#e6dcc0'));
    cone(c, mx, y - s * 1.3, s * 0.32, s * 0.42, '#8a4a2a', s * 0.1);
    poly(c, [[mx - s * 0.08, y], [mx - s * 0.08, y - s * 0.3], [mx + s * 0.08, y - s * 0.3], [mx + s * 0.08, y]], '#4a2f20');
    const hx = mx, hy = y - s * 1.15;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4, ex = hx + Math.cos(a) * s * 1.0, ey = hy + Math.sin(a) * s * 1.0; line(c, hx, hy, ex, ey, '#5a3e2a', LW * 1.6); const nx = -Math.sin(a), ny = Math.cos(a); poly(c, [[hx + Math.cos(a) * s * 0.3, hy + Math.sin(a) * s * 0.3], [ex, ey], [ex + nx * s * 0.2, ey + ny * s * 0.2], [hx + Math.cos(a) * s * 0.3 + nx * s * 0.2, hy + Math.sin(a) * s * 0.3 + ny * s * 0.2]], '#f0e8d0'); }
    ell(c, hx, hy, s * 0.07, s * 0.07, '#4a3322');
    chimney(c, x - s * 0.3, y - s * 0.95, s * 0.12, s * 0.3, '#8b6a50'); smokeAt(fx, x - s * 0.24, y - s * 1.3, s * 0.55);
  },
};

// GNOME
R.gnome = {
  lsk: 0.8,
  ground: ['#a0a678', '#8a9068'], wall: { kind: 'stone', col: '#a08a6a', hw: 0.06, cren: 'sq' }, pn: 3,
  house(c, x, y, s, r, fx) {
    const col = pick(r, ['#c4784a', '#4a9a98', '#b89048', '#8a6ab0']), rx = s * (0.55 + r() * 0.12), h = s * (0.5 + r() * 0.2);
    cyl(c, x, y, rx * 0.95, s * 0.2, wt('#d8cba8'), rx * 0.3, false);
    dome(c, x, y - s * 0.2, rx, h, col, rx * 0.28);
    line(c, x - rx * 0.93, y - s * 0.28, x + rx * 0.93, y - s * 0.28, dk(col, 0.4), LW, 0.7);
    for (let i = -2; i <= 2; i++) ell(c, x + i * rx * 0.35, y - s * 0.2 - rx * 0.26 + Math.abs(i) * s * 0.012, s * 0.014, s * 0.014, lit(col, 0.5), false);
    ell(c, x - rx * 0.1, y - s * 0.5, s * 0.13, s * 0.13, '#f2c35e'); ell(c, x - rx * 0.1, y - s * 0.5, s * 0.13, s * 0.13, null, true);
    ell(c, x + rx * 0.45, y - s * 0.12, s * 0.07, s * 0.1, '#4a2f20');
    if (r() < 0.25) gear(c, x + rx * 0.2, y - s * 0.2 - h - s * 0.05, s * 0.12, '#c8a24a', 7);
    else { const px = x - rx * 0.35, py = y - s * 0.2 - h * 0.85; cyl(c, px, py, s * 0.07, s * 0.3, '#8a6a40', s * 0.025); smokeAt(fx, px, py - s * 0.32, s * 0.45); }
  },
  prop(c, x, y, s, r) {
    if (r() < 0.55) { line(c, x, y, x, y - s * 0.3, '#e8dcc0', LW * 3); ell(c, x, y - s * 0.34, s * 0.25, s * 0.17, pick(r, ['#c4402a', '#8a5ab0', '#d8a82a'])); ell(c, x - s * 0.08, y - s * 0.4, s * 0.04, s * 0.04, '#fff', false); }
    else gear(c, x, y - s * 0.12, s * 0.16, '#a08a5a', 7);
  },
  land(c, x, y, s, r, lvl, fx) {
    const tw = s * 0.55, th = s * 1.9;
    cyl(c, x, y, tw, th, '#c0a470'); for (let i = 1; i < 5; i++) line(c, x - tw, y - th * i / 5, x + tw, y - th * i / 5, INK, LW * 0.5, 0.3);
    ell(c, x, y - th * 0.7, s * 0.3, s * 0.3, '#c6c2e6'); line(c, x, y - th * 0.7, x, y - th * 0.7 - s * 0.2, INK, LW * 1.4); line(c, x, y - th * 0.7, x + s * 0.14, y - th * 0.7, INK, LW * 1.4);
    gear(c, x - tw - s * 0.05, y - th * 0.4, s * 0.3, '#c8a24a', 9); gear(c, x + tw + s * 0.02, y - th * 0.25, s * 0.2, '#a87a3a', 7);
    cone(c, x, y - th, tw * 1.15, s * 0.6, '#4a9a98');
    { const bx = x + s * 1.25, by = y - th - s * 0.45; line(c, bx, by + s * 0.22, x + tw * 0.9, y - th + s * 0.1, INK, LW * 0.7, 0.7); ell(c, bx, by, s * 0.36, s * 0.28, '#d8503a'); ell(c, bx, by, s * 0.1, s * 0.28, '#f2c35e', false); ell(c, bx, by, s * 0.36, s * 0.28, null, true); }
    cyl(c, x + tw + s * 0.5, y, s * 0.15, s * 0.9, '#8a6a40', s * 0.05); smokeAt(fx, x + tw + s * 0.5, y - s * 0.95, s * 0.7);
  },
};

// DRAGONBORN
const sand = '#d8b878';
const stepPyr = (c, x, y, w, tiers, th, d, col, o = {}) => {
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i * 0.2), td = d * (1 - i * 0.2), by = y - i * th;
    box(c, x - tw / 2 + i * d * 0.1 * 0, by - (i ? 0 : 0), tw, th, td, mix(col, o.alt || '#c4552a', i % 2 ? 0.25 : 0), { bricks: false, cren: o.cren && i === tiers - 1 ? 3 : 0 });
  }
  const tw = w, sw = tw * 0.16; // stair strip up the front
  poly(c, [[x - sw, y], [x + sw, y], [x + sw * 0.4, y - th * tiers], [x - sw * 0.4, y - th * tiers]], lit(col, 0.45));
  for (let i = 1; i < tiers * 2; i++) { const t = i / (tiers * 2), ww = sw * (1 - t * 0.6); line(c, x - ww, y - th * tiers * t, x + ww, y - th * tiers * t, INK, LW * 0.5, 0.45); }
};
R.dragonborn = {
  lsk: 0.7,
  ground: ['#d4b87a', '#bf9f62'], wall: { kind: 'stone', col: '#cdb07a', hw: 0.09, cren: 'step', tw: 1.5 }, nm: 1.15,
  house(c, x, y, s, r, fx) {
    const col = wt(pick(r, ['#d8b878', '#cfa86a', '#dcc08a'])), w = s * (0.9 + r() * 0.2), t = 2 + (r() < 0.4 ? 1 : 0);
    stepPyr(c, x, y, w, t, s * 0.28, s * 0.45, col, { alt: '#bf7a4a' });
    if (r() < 0.5) { ell(c, x, y - s * 0.28 * t - s * 0.22, s * 0.06, s * 0.03, '#4a3a2a'); flame(c, x, y - s * 0.28 * t - s * 0.2, s * 0.14); }
    else banner(c, x + w * 0.2, y - s * 0.28 * t - s * 0.12, s * 0.4, pick(r, ['#b02a2a', '#2a8a7a']));
    poly(c, [[x - w * 0.5, y - s * 0.18], [x - w * 0.5, y], [x - w * 0.42, y], [x - w * 0.42, y - s * 0.18]], '#3a2a20', false);
  },
  prop(c, x, y, s, r) {
    if (r() < 0.5) { line(c, x, y, x + s * 0.12, y - s * 0.8, '#7a5a3a', LW * 2.2); for (let i = 0; i < 5; i++) { const a = -0.5 + i * 0.75; line(c, x + s * 0.12, y - s * 0.8, x + s * 0.12 + Math.cos(a - 1.3) * s * 0.4, y - s * 0.8 + Math.sin(a * 0.5 + 0.5) * s * 0.25, '#4f8a3a', LW * 2); } }
    else rock(c, x, y, s * 0.7, '#b89a6a');
  },
  land(c, x, y, s, r, lvl, fx) {
    const t = [4, 4, 5, 7][Math.min(lvl, 3)], th = s * (lvl >= 3 ? 0.36 : 0.42);
    stepPyr(c, x, y, s * [1.7, 1.8, 2.2, 2.9][Math.min(lvl, 3)], t, th, s * [0.8, 0.85, 1.0, 1.3][Math.min(lvl, 3)], '#d8b878', { alt: '#c4552a', cren: false });
    // dragon-head totem + brazier
    const ty = y - th * t;
    poly(c, [[x - s * 0.22, ty], [x - s * 0.2, ty - s * 0.4], [x + s * 0.0, ty - s * 0.55], [x + s * 0.28, ty - s * 0.42], [x + s * 0.18, ty - s * 0.3], [x + s * 0.2, ty]], '#a8452a');
    ell(c, x - s * 0.02, ty - s * 0.4, s * 0.03, s * 0.025, '#ffd24a', false);
    poly(c, [[x - s * 0.1, ty - s * 0.5], [x - s * 0.3, ty - s * 0.8], [x - s * 0.02, ty - s * 0.58]], '#e8dcc0'); poly(c, [[x + s * 0.1, ty - s * 0.5], [x + s * 0.3, ty - s * 0.8], [x + s * 0.0, ty - s * 0.58]], '#cfc4a8');
    for (const dx of [-0.95, 0.95]) { const px = x + dx * s * (lvl >= 3 ? 1.3 : 1), py = y - th * 2.2; ell(c, px, py, s * 0.08, s * 0.04, '#4a3a2a'); flame(c, px, py - s * 0.02, s * 0.22); }
    const bh = lvl >= 3 ? 1.5 : 0.85; banner(c, x - s * 1.1, y + s * 0.0, s * bh, '#b02a2a'); banner(c, x + s * 1.1, y + s * 0.0, s * bh, '#c8a22a');
    smokeAt(fx, x, ty - s * 0.85, s * 0.6);
  },
};

// LIZARDFOLK
R.lizard = {
  lsk: 0.9,
  ground: ['#cdbd90', '#b0a074'], wall: { kind: 'pal', col: '#bfae80', hw: 0.1, round: true },
  house(c, x, y, s, r, fx) {
    const wood = '#6b5338', th = s * 0.45, rx = s * 0.5, thatch = pick(r, ['#9a8a4a', '#8a7a3e', '#a08f50']);
    for (const dx of [-0.8, -0.3, 0.3, 0.8]) line(c, x + dx * rx, y, x + dx * rx, y - th, wood, LW * 2, 1);
    ell(c, x, y + s * 0.03, rx * 1.1, s * 0.08, 'rgba(10,30,20,.35)', false);
    poly(c, [[x - rx * 1.05, y - th], [x + rx * 1.05, y - th], [x + rx * 1.15, y - th - s * 0.08], [x - rx * 0.95, y - th - s * 0.08]], '#8a6a44');
    for (let i = 1; i < 5; i++) line(c, x - rx * 1.0 + i * rx * 0.4, y - th, x - rx * 1.0 + i * rx * 0.4, y - th - s * 0.08, INK, LW * 0.5, 0.5);
    cyl(c, x, y - th - s * 0.08, rx * 0.72, s * 0.3, '#a08a5a', rx * 0.2, false);
    { const w0 = LW; LW = w0 * 1.7; cone(c, x, y - th - s * 0.38, rx * 0.95, s * 0.55, thatch, rx * 0.25); LW = w0; }
    for (const a of [-0.6, -0.2, 0.25, 0.6]) line(c, x, y - th - s * 0.93, x + a * rx * 0.9, y - th - s * 0.38 + rx * 0.2, INK, LW * 0.5, 0.35);
    poly(c, [[x - s * 0.08, y - th - s * 0.08], [x - s * 0.08, y - th - s * 0.3], [x + s * 0.08, y - th - s * 0.3], [x + s * 0.08, y - th - s * 0.08]], '#2a1c14');
    line(c, x - rx * 1.0, y, x - rx * 0.75, y - th, '#8a6a44', LW * 1.2);
    if (r() < 0.4) smokeAt(fx, x, y - th - s * 0.95, s * 0.5);
  },
  prop(c, x, y, s, r) {
    if (r() < 0.55) { for (let i = -2; i <= 2; i++) { line(c, x + i * s * 0.07, y, x + i * s * 0.1 + i * s * 0.02, y - s * (0.45 + r() * 0.2), '#6a8a3e', LW * 1.6); } ell(c, x, y - s * 0.55, s * 0.04, s * 0.09, '#6a4a2a', false); }
    else { ell(c, x, y, s * 0.55, s * 0.2, '#9cc4ba'); ell(c, x - s * 0.1, y - s * 0.02, s * 0.2, s * 0.06, '#c8e0d8', false); }
  },
  land(c, x, y, s, r, lvl, fx) {
    const wood = '#6b5338', th = s * 0.6, rx = s * 0.95;
    for (const dx of [-0.85, -0.4, 0.4, 0.85]) line(c, x + dx * rx, y, x + dx * rx, y - th, wood, LW * 2.6, 1);
    poly(c, [[x - rx * 1.1, y - th], [x + rx * 1.1, y - th], [x + rx * 1.25, y - th - s * 0.12], [x - rx * 0.95, y - th - s * 0.12]], '#8a6a44');
    cyl(c, x, y - th - s * 0.12, rx * 0.8, s * 0.45, '#a08a5a', rx * 0.22, false);
    { const w0 = LW; LW = w0 * 1.7; cone(c, x, y - th - s * 0.57, rx * 1.05, s * 0.95, '#8a7a3e', rx * 0.28); LW = w0; }
    for (const a of [-0.7, -0.3, 0.15, 0.55]) line(c, x, y - th - s * 1.52, x + a * rx, y - th - s * 0.57 + rx * 0.22, INK, LW * 0.5, 0.35);
    poly(c, [[x - s * 0.1, y - th - s * 0.12], [x - s * 0.1, y - th - s * 0.42], [x + s * 0.1, y - th - s * 0.42], [x + s * 0.1, y - th - s * 0.12]], '#2a1c14');
    for (const sx of [x - rx * 1.45, x + rx * 1.5]) { line(c, sx, y + s * 0.05, sx, y - s * 1.2, '#4a3a2a', LW * 2.6); ell(c, sx, y - s * 1.28, s * 0.13, s * 0.11, '#e8e2cf'); for (const dy of [0.3, 0.6, 0.9]) line(c, sx - s * 0.1, y - s * dy, sx + s * 0.1, y - s * dy, '#7a3a2a', LW * 1.6); }
    line(c, x - rx * 1.45, y - s * 0.3, x - rx * 1.0, y - th, '#8a6a44', LW * 1.2);
    smokeAt(fx, x, y - th - s * 1.55, s * 0.7);
  },
  walk(c, a, b) { line(c, a.x, a.y, b.x, b.y, '#8a6a44', LW * 4, 1); line(c, a.x, a.y, b.x, b.y, '#b08a58', LW * 2, 1); },
};

// DROW / TIEFLING
const obs = '#3a3350', glow = '#d46bff';
const spireTower = (c, x, y, w, h, col, capH) => {
  poly(c, [[x - w, y], [x - w * 0.55, y - h], [x + w * 0.55, y - h], [x + w, y]], cg(c, x - w, x + w, col, 0.25, 0.5));
  c.beginPath(); c.moveTo(x - w * 0.85, y - h); c.quadraticCurveTo(x - w * 0.4, y - h - capH * 0.35, x, y - h - capH); c.quadraticCurveTo(x + w * 0.4, y - h - capH * 0.35, x + w * 0.85, y - h); c.closePath();
  c.fillStyle = cg(c, x - w, x + w, dk(col, 0.1), 0.35, 0.5); c.fill(); stroke(c);
  line(c, x - w * 0.8, y - h * 0.95, x - w * 0.5, y - h * 0.1, lit(col, 0.6), LW * 1.2, 0.7);
  for (let i = 0; i < Math.max(1, Math.floor(h / (w * 1.1))); i++) { const wy = y - h * 0.25 - i * w * 1.1; if (wy < y - h * 0.9) break; ell(c, x, wy - w * 0.3, w * 0.07, w * 0.11, glow, false); }
};
R.drow = {
  lsk: 0.72,
  ground: ['#7a74a0', '#625c86'], wall: { kind: 'stone', col: '#7a74a8', hw: 0.12, cren: 'spike' }, sp: 1.15, inner: 0.7, rim: true,
  house(c, x, y, s, r, fx) {
    ell(c, x, y, s * 0.7, s * 0.14, 'rgba(10,0,30,.4)', false);
    const n = r() < 0.5 ? 2 : 3, hs = [1.0, 1.7, 1.3].slice(0, n);
    const order = n === 2 ? [[-0.2, 1], [0.25, 0]] : [[-0.32, 2], [0.32, 2], [0, 1]];
    order.forEach(([dx, hi], i) => spireTower(c, x + dx * s, y + (i === n - 1 ? s * 0.05 : 0), s * (0.2 + (hi === 1 ? 0.04 : 0)), s * hs[hi] * (0.75 + r() * 0.2), pick(r, ['#5a4e80', '#4c4272', '#665a90']), s * 0.7));
  },
  prop(c, x, y, s, r) {
    if (r() < 0.5) { poly(c, [[x - s * 0.15, y], [x - s * 0.02, y - s * 0.8], [x + s * 0.15, y]], '#6a6488'); poly(c, [[x + s * 0.14, y], [x + s * 0.25, y - s * 0.45], [x + s * 0.38, y]], '#4f4a6c'); }
    else { line(c, x, y, x, y - s * 0.25, '#c8b8e0', LW * 2); ell(c, x, y - s * 0.3, s * 0.2, s * 0.14, '#9a5ae0'); ell(c, x - s * 0.06, y - s * 0.34, s * 0.04, s * 0.03, '#e8c8ff', false); }
  },
  land(c, x, y, s, r, lvl, fx) {
    box(c, x - s * 1.0, y, s * 2.0, s * 0.7, s * 0.7, '#3a3350', { top: true, bricks: true });
    spireTower(c, x - s * 0.9, y - s * 0.1, s * 0.28, s * 1.5, '#4c4272', s * 0.9); spireTower(c, x + s * 1.05, y - s * 0.4, s * 0.26, s * 1.4, '#4c4272', s * 0.8);
    spireTower(c, x - s * 0.4, y - s * 0.7, s * 0.3, s * 1.8, '#5a4e80', s * 1.0); spireTower(c, x + s * 0.55, y - s * 0.7, s * 0.3, s * 1.6, '#5a4e80', s * 0.9);
    spireTower(c, x, y - s * 0.3, s * (lvl >= 3 ? 0.5 : 0.4), s * (lvl >= 3 ? 2.8 : 2.4), '#463a60', s * (lvl >= 3 ? 1.6 : 1.5));
    // spider sigil
    const sy = y - s * (lvl >= 3 ? 1.6 : 1.2); ell(c, x, sy, s * 0.07, s * 0.1, glow, false); ell(c, x, sy - s * 0.1, s * 0.04, s * 0.04, glow, false);
    for (let i = 0; i < 4; i++) { const k = (i - 1.5) * 0.12; line(c, x - s * 0.04, sy + k * s, x - s * 0.22, sy + k * s * 2.4 - s * 0.05, glow, LW * 0.9); line(c, x + s * 0.04, sy + k * s, x + s * 0.22, sy + k * s * 2.4 - s * 0.05, glow, LW * 0.9); }
    poly(c, [[x - s * 0.15, y + s * 0.0], [x - s * 0.15, y - s * 0.3], [x, y - s * 0.5], [x + s * 0.15, y - s * 0.3], [x + s * 0.15, y]], '#14102a');
  },
  glowFx: true,
};

// MERFOLK
const shellDome = (c, x, y, rx, h, col) => {
  dome(c, x, y, rx, h, col, rx * 0.26);
  for (let i = 1; i < 6; i++) { const a = Math.PI * (i / 6); c.beginPath(); c.moveTo(x, y - h * 0.95); c.quadraticCurveTo(x - Math.cos(a) * rx * 0.8, y - h * 0.5, x - Math.cos(a) * rx * 0.98, y); c.strokeStyle = dk(col, 0.4); c.globalAlpha = 0.5; c.lineWidth = LW * 0.6; c.stroke(); c.globalAlpha = 1; }
};
R.merfolk = {
  ground: ['#e3d3a0', '#cdbb88'], wall: { kind: 'stone', col: '#e2d6bc', hw: 0.06, cren: 'sq', cap: '#6aa8a6' }, water: true, hamPlus: 4, pn: 2,
  house(c, x, y, s, r, fx) {
    const col = pick(r, ['#7fb5b2', '#dccfa8', '#d9907e', '#7fb5b2']), rx = s * (0.5 + r() * 0.15), h = s * (0.55 + r() * 0.2);
    { const w0 = LW; LW = w0 * 1.7; shellDome(c, x, y, rx, h, col); LW = w0; }
    ell(c, x, y - h - s * 0.02, s * 0.06, s * 0.06, '#fff8f0'); ell(c, x - s * 0.02, y - h - s * 0.04, s * 0.02, s * 0.02, '#fff', false);
    ell(c, x + rx * 0.1, y - s * 0.2, s * 0.1, s * 0.13, '#2a4a66'); ell(c, x + rx * 0.1, y - s * 0.2, s * 0.06, s * 0.09, '#7ae0e8', false);
    if (r() < 0.2) { const kx = x + rx * 1.1; for (const [dx, dy] of [[0, 0.35], [-0.08, 0.28], [0.1, 0.3]]) line(c, kx, y, kx + dx * s, y - dy * s, '#d9907e', LW * 2.2); }
  },
  prop(c, x, y, s, r) {
    if (r() < 0.6) { for (const [dx, dy] of [[0, 0.5], [-0.12, 0.38], [0.12, 0.42], [0.2, 0.28]]) { line(c, x, y, x + dx * s, y - dy * s, pick(r, ['#d9907e', '#c4806a', '#d8a890']), LW * 2.4); ell(c, x + dx * s, y - dy * s, s * 0.035, s * 0.035, '#f8d0c0', false); } }
    else { poly(c, [[x - s * 0.2, y], [x - s * 0.25, y - s * 0.2], [x, y - s * 0.3], [x + s * 0.25, y - s * 0.2], [x + s * 0.2, y]], '#f0d0c0'); for (let i = -1; i <= 1; i++) line(c, x, y - s * 0.28, x + i * s * 0.12, y, '#c8a090', LW * 0.6, 0.7); }
  },
  land(c, x, y, s, r, lvl, fx) {
    for (const [dx, hh, col] of [[-1.1, 1.3, '#7fb5b2'], [1.1, 1.1, '#d9907e']]) { cone(c, x + dx * s, y, s * 0.3, s * hh, col, s * 0.1); for (let i = 1; i < 5; i++) line(c, x + dx * s - s * 0.3 * (1 - i / 5), y - s * hh * (i / 5), x + dx * s + s * 0.3 * (1 - i / 5), y - s * hh * (i / 5) + s * 0.04, dk(col, 0.4), LW * 0.6, 0.6); ell(c, x + dx * s, y - s * hh - s * 0.03, s * 0.06, s * 0.06, '#fff8f0'); }
    LW *= 1.5;
    c.beginPath(); c.moveTo(x - s * 1.0, y); c.quadraticCurveTo(x - s * 1.2, y - s * 1.4, x, y - s * 1.7); c.quadraticCurveTo(x + s * 1.2, y - s * 1.4, x + s * 1.0, y); c.closePath(); c.fillStyle = cg(c, x - s, x + s, '#a9d0c8', 0.35, 0.4); c.fill(); stroke(c);
    for (let i = 1; i < 7; i++) { const t = i / 7, ex = x - s * 1.0 + s * 2.0 * t; c.beginPath(); c.moveTo(x, y - s * 1.6); c.quadraticCurveTo((x + ex) / 2 + (t - 0.5) * s * 0.3, y - s * 0.8, ex, y); c.strokeStyle = dk('#a9d0c8', 0.4); c.globalAlpha = 0.55; c.lineWidth = LW * 0.7; c.stroke(); c.globalAlpha = 1; }
    c.beginPath(); c.moveTo(x - s * 0.25, y); c.lineTo(x - s * 0.25, y - s * 0.4); c.arc(x, y - s * 0.4, s * 0.25, Math.PI, 0); c.lineTo(x + s * 0.25, y); c.closePath(); c.fillStyle = '#2a4a66'; c.fill(); stroke(c);
    ell(c, x, y - s * 1.82, s * 0.14, s * 0.14, '#fff8f0'); ell(c, x - s * 0.04, y - s * 1.86, s * 0.045, s * 0.045, '#fff', false);
    ell(c, x, y - s * 0.55, s * 0.12, s * 0.15, '#7ae0e8', false); LW /= 1.5;
  },
};

// ---------- builder ----------
const LV = [
  { k: 'Hamlet', n: 4, kk: 0.54, s: 0.2, asp: 1.1, rx: 0.34, ry: 0.19, ls: 0 },
  { k: 'Village', n: 7, kk: 0.66, s: 0.17, asp: 1.2, rx: 0.38, ry: 0.23, ls: 1.45 },
  { k: 'Town', n: 12, kk: 0.78, s: 0.14, asp: 1.3, rx: 0.41, ry: 0.27, ls: 1.65 },
  { k: 'City', n: 26, kk: 0.87, s: 0.11, asp: 1.4, rx: 0.44, ry: 0.3, ls: 1.9 },
  { k: 'Capital', n: 36, kk: 0.93, s: 0.095, asp: 1.5, rx: 0.46, ry: 0.31, ls: 2.4 },
];

function wallRing(c, cx, cy, rx, ry, race, lvl, back, r, fx) {
  const o = race.wall; if (lvl < 1) return;
  if (lvl === 1 && o.kind === 'stone') return;
  const scale = lvl === 1 ? 0.4 : lvl === 2 ? 0.6 : lvl === 3 ? 1 : 1.2;
  const hw = o.hw * scale, N = o.kind === 'pal' ? 84 : o.kind === 'blob' ? 78 : 30, gap = 0.2;
  const ruin = (i) => (lvl <= 2 ? ((i * 7919 + 13) % 10) < (lvl === 1 ? 4 : 2) : false);
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2, tm = (t0 + t1) / 2;
    const isBack = Math.sin(tm) < 0; if (isBack !== back) continue;
    if (!back && Math.abs(tm - Math.PI / 2) < gap) continue;
    if (ruin(i)) continue;
    const p0 = [cx + rx * Math.cos(t0), cy + ry * Math.sin(t0)], p1 = [cx + rx * Math.cos(t1), cy + ry * Math.sin(t1)], pm = [cx + rx * Math.cos(tm), cy + ry * Math.sin(tm)];
    const l = -Math.cos(tm);
    if (o.kind === 'stone') {
      const col = l > 0 ? lit(o.col, l * 0.3) : dk(o.col, -l * 0.35);
      poly(c, [p0, p1, [p1[0], p1[1] - hw], [p0[0], p0[1] - hw]], col);
      poly(c, [[p0[0], p0[1] - hw], [p1[0], p1[1] - hw], [p1[0], p1[1] - hw - hw * 0.12], [p0[0], p0[1] - hw - hw * 0.12]], lit(o.col, 0.4), false);
      if (lvl >= 3 && i % 3 === 0) line(c, pm[0], pm[1], pm[0], pm[1] - hw, INK, LW * 0.5, 0.3);
      const mw = (p1[0] - p0[0]) * 0.28;
      if (o.cren === 'sq') { const m = [pm[0] - mw * 0.0, pm[1] - hw - hw * 0.12]; if (mw !== 0) poly(c, [[m[0] - Math.abs(mw) * 0.5, m[1]], [m[0] - Math.abs(mw) * 0.5, m[1] - hw * 0.2], [m[0] + Math.abs(mw) * 0.5, m[1] - hw * 0.2], [m[0] + Math.abs(mw) * 0.5, m[1]]], col); }
      else if (o.cren === 'spike') poly(c, [[pm[0] - Math.abs(mw) * 0.5, pm[1] - hw - hw * 0.12], [pm[0], pm[1] - hw * 1.7], [pm[0] + Math.abs(mw) * 0.5, pm[1] - hw - hw * 0.12]], dk(o.col, 0.2));
      else if (o.cren === 'step') poly(c, [[pm[0] - Math.abs(mw) * 0.6, pm[1] - hw - hw * 0.12], [pm[0] - Math.abs(mw) * 0.6, pm[1] - hw * 1.3], [pm[0], pm[1] - hw * 1.3], [pm[0], pm[1] - hw * 1.5], [pm[0] + Math.abs(mw) * 0.6, pm[1] - hw * 1.5], [pm[0] + Math.abs(mw) * 0.6, pm[1] - hw - hw * 0.12]], col);
    } else if (o.kind === 'pal') {
      const sw = Math.max(0.012, (hw * 0.28));
      const col = mix(o.col, i % 2 ? '#3a2a1a' : '#a08a5a', 0.15 + (i % 3) * 0.06 + (l < 0 ? 0.15 : -0.05));
      const hh = hw * (0.85 + ((i * 37) % 5) * 0.06);
      if (o.round) { c.beginPath(); c.moveTo(pm[0] - sw, pm[1]); c.lineTo(pm[0] - sw, pm[1] - hh); c.arc(pm[0], pm[1] - hh, sw, Math.PI, 0); c.lineTo(pm[0] + sw, pm[1]); c.closePath(); c.fillStyle = col; c.fill(); stroke(c); }
      else poly(c, [[pm[0] - sw, pm[1]], [pm[0] - sw, pm[1] - hh], [pm[0], pm[1] - hh - sw * 1.9], [pm[0] + sw, pm[1] - hh], [pm[0] + sw, pm[1]]], col);
      if (!o.round) line(c, pm[0] - sw * 0.45, pm[1] - 0.002, pm[0] - sw * 0.45, pm[1] - hh, '#d8b878', LW * 0.9, l > -0.3 ? 0.75 : 0.35);
      if (lvl >= 3 && !o.round && i % 24 === 5) { ell(c, pm[0], pm[1] - hh - sw * 2.4, sw * 0.9, sw * 0.8, '#e8e2cf'); }
    } else if (o.kind === 'trunk') {
      poly(c, [p0, p1, [p1[0], p1[1] - hw * 0.32], [p0[0], p0[1] - hw * 0.32]], mix('#4f8a4a', '#143a2a', l < 0 ? 0.25 : 0.05));
      if (lvl < 3 && i % 3 === 2) continue;
      const cc = ['#4f9a70', '#68b078', '#3f8f78'][i % 3], th2 = hw * (1.2 + ((i * 31) % 4) * 0.12);
      line(c, pm[0], pm[1], pm[0], pm[1] - th2, '#4a3322', LW * 4.2); line(c, pm[0], pm[1], pm[0], pm[1] - th2, '#a08560', LW * 2.4);
      ell(c, pm[0], pm[1] - th2, hw * 0.34, hw * 0.28, mix(cc, '#143a2a', l < 0 ? 0.2 : 0)); ell(c, pm[0] - hw * 0.1, pm[1] - th2 - hw * 0.08, hw * 0.14, hw * 0.1, lit(cc, 0.4), false);
    } else if (o.kind === 'fence') {
      line(c, p0[0], p0[1] - hw * 0.7, p1[0], p1[1] - hw * 0.7, '#6b4a2a', LW * 1.6); line(c, p0[0], p0[1] - hw * 0.3, p1[0], p1[1] - hw * 0.3, '#6b4a2a', LW * 1.6);
      line(c, p0[0], p0[1], p0[0], p0[1] - hw, '#b08a58', LW * 2.6);
    } else {
      const rr = hw * (0.5 + ((i * 53) % 4) * 0.08), col = mix(o.col, i % 2 ? '#e0a050' : '#143a2a', 0.1 + (i % 4) * 0.06);
      ell(c, pm[0], pm[1] - rr * 0.5, rr, rr * 0.85, mix(col, '#143a2a', l < 0 ? 0.2 : 0));
      ell(c, pm[0] - rr * 0.3, pm[1] - rr * 0.8, rr * 0.4, rr * 0.3, lit(col, 0.4), false);
      if (race.water && i % 5 === 0) { line(c, pm[0], pm[1], pm[0] + rr * 0.4, pm[1] - rr * 1.7, '#f0907a', LW * 2); }
    }
  }
  // towers
  const nt = lvl === 4 ? 6 : lvl === 3 ? 4 : lvl === 2 ? 2 : 0;
  if (o.kind === 'blob' || o.kind === 'trunk' || o.kind === 'fence') return;
  const angs = [];
  for (let i = 0; i < nt; i++) angs.push(((i + 0.5) / nt) * Math.PI * 2);
  if (lvl >= 2) angs.push(Math.PI / 2 - gap, Math.PI / 2 + gap);
  for (const t of angs) {
    const isBack = Math.sin(t) < 0; if (isBack !== back) continue;
    const px = cx + rx * Math.cos(t), py = cy + ry * Math.sin(t), tw = hw * 0.42 * (o.tw || 1), th = hw * 1.5;
    if (o.kind === 'stone') {
      cyl(c, px, py, tw, th, o.col, tw * 0.35);
      if (o.cren === 'spike') cone(c, px, py - th, tw * 1.2, hw * 1.3, dk(o.col, 0.2), tw * 0.4); else cone(c, px, py - th, tw * 1.25, hw * 0.9, o.cap || (o.cren === 'step' ? '#c4552a' : '#a3392f'), tw * 0.4);
    } else {
      for (const dx of [-0.8, 0.8]) line(c, px + dx * tw, py, px + dx * tw, py - th, '#4a3322', LW * 2.2);
      poly(c, [[px - tw * 1.2, py - th], [px + tw * 1.2, py - th], [px + tw * 1.3, py - th - hw * 0.4], [px - tw * 1.3, py - th - hw * 0.4]], '#6a4a2a');
      poly(c, [[px - tw * 1.45, py - th - hw * 0.4], [px, py - th - hw * 0.95], [px + tw * 1.45, py - th - hw * 0.4]], o.round ? '#b8a060' : '#7a4a2a');
    }
  }
}

function makeRender(raceKey, li, id) {
  const race = R[raceKey], L = LV[li];
  return (ctx, size, color = '#2c221e', fill = '#dcd4c0') => {
    ctx.save();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.scale(size, size);
    const KK = (NAMES[raceKey][1].length === 5 ? [0.4, 0.5, 0.63, 0.78, 0.93] : [0.46, 0.6, 0.76, 0.93])[li];
    ctx.translate(L.asp / 2, 0.985); ctx.scale(KK, KK); ctx.translate(-L.asp / 2, -1.05);
    INK = color; FILL = fill; LW = Math.max(0.009, 1.1 / size);
    const r = rng(hashStr(id));
    const W = L.asp, cx = W / 2, cy = 0.66, rx = L.rx * W, ry = L.ry, fx = [];
    const gx = rx * 1.1, gy = ry * 1.18;
    // water lagoon (merfolk)
    if (race.water) {
      ctx.save(); ctx.translate(cx, cy + 0.02); ctx.scale(1, gy / gx);
      const g = ctx.createRadialGradient(0, 0, gx * 0.55, 0, 0, gx * 1.12); g.addColorStop(0, 'rgba(70,170,200,.85)'); g.addColorStop(1, 'rgba(70,170,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, gx * 1.12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // ground shadow + ground
    ctx.save(); ctx.translate(cx + 0.012, cy + 0.03); ctx.scale(1, gy / gx);
    let g = ctx.createRadialGradient(0, 0, gx * 0.4, 0, 0, gx); g.addColorStop(0, 'rgba(80,66,50,.17)'); g.addColorStop(1, 'rgba(80,66,50,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, gx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, gy / gx);
    g = ctx.createRadialGradient(0, 0, gx * 0.35, 0, 0, gx);
    g.addColorStop(0, mix(race.ground[0], FILL, 0.1)); g.addColorStop(0.75, mix(race.ground[1], FILL, 0.1)); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.95; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, gx, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    if (raceKey === 'lizard') for (let i = 0; i < 3 + li; i++) { const a = r() * 6.28, d = 0.55 + r() * 0.35; ell(ctx, cx + Math.cos(a) * gx * d, cy + Math.sin(a) * gy * d, 0.04 + r() * 0.04, 0.015 + r() * 0.012, 'rgba(150,190,182,.8)', false); }
    for (let i = 0; i < 14 + li * 6; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.95; const px = cx + Math.cos(a) * gx * d, py = cy + Math.sin(a) * gy * d; line(ctx, px, py, px + 0.006, py - 0.012, dk(race.ground[1], 0.3), LW * 0.7, 0.5); }
    if (race.rim) { ell(ctx, cx, cy, gx * 0.96, gy * 0.96, null, false); ctx.strokeStyle = lit(race.ground[0], 0.35); ctx.globalAlpha = 0.7; ctx.lineWidth = 0.014; ctx.stroke(); ctx.globalAlpha = 1; }
    // road
    const pathPts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, py = cy + gy * 0.92 - t * (gy * 0.92 + ry * 0.2); pathPts.push([cx + Math.sin(t * 5) * 0.03 * (1 - t * 0.3), py]); }
    ctx.beginPath(); pathPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = dk(race.ground[1], 0.2); ctx.globalAlpha = 0.9; ctx.lineWidth = 0.035 + li * 0.004; ctx.stroke();
    ctx.strokeStyle = lit(mix(race.ground[0], '#c8a878', 0.55), 0.1); ctx.lineWidth = 0.027 + li * 0.004; ctx.stroke(); ctx.globalAlpha = 1;
    // placement
    const ws = r; const objs = [], taken = [];
    const free = (x, y, s) => taken.every((t) => ((x - t.x) / ((s + t.s) * 0.55)) ** 2 + ((y - t.y) / ((s + t.s) * 0.28)) ** 2 >= 1);
    const roadX = (y) => { const t = (cy + gy * 0.92 - y) / (gy * 0.92 + ry * 0.2); return cx + Math.sin(t * 5) * 0.03 * (1 - t * 0.3); };
    let lm = null;
    if (L.ls) { const ls = L.s * L.ls * (race.lsk || 1), ly = cy - ry * 0.32; lm = { y: ly, draw: () => race.land(ctx, cx, ly, ls, r, li, fx) }; taken.push({ x: cx, y: ly, s: ls * 2.2 }); objs.push(lm); }
    const inner = race.inner && li >= 2 ? race.inner : li >= 2 ? 0.82 : 0.95;
    let placed = 0; const NN = Math.round(L.n * (race.nm && li >= 2 ? race.nm : 1)) + (race.hamPlus && li === 0 ? race.hamPlus : 0); const SP = race.sp || 1;
    for (let tries = 0; tries < 900 && placed < NN; tries++) {
      const a = r() * 6.2832, d = Math.sqrt(r()), x = cx + Math.cos(a) * rx * inner * d, y = cy + Math.sin(a) * ry * inner * d + ry * 0.1;
      if (Math.abs(x - roadX(y)) < L.s * 0.55) continue;
      if (!free(x, y, L.s * SP)) continue;
      taken.push({ x, y, s: L.s * SP }); placed++;
      const sd = hashStr(id + placed);
      objs.push({ y, x, draw: () => race.house(ctx, x, y, L.s, rng(sd), fx) });
    }
    if (race.extra && li <= 1) { /* hamlet camp feature */ }
    // props around
    const np = race.pn != null ? race.pn : 5 + li * 4;
    for (let tries = 0; tries < 600 && np > 0 && objs.length < NN + 1 + np; tries++) {
      const a = r() * 6.2832, d = li >= 3 ? 1.0 + r() * 0.08 : 0.55 + r() * 0.5, x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d * 1.1;
      if (Math.abs(x - roadX(y)) < 0.05 || !free(x, y, L.s * 0.6) || x < 0.06 || x > W - 0.06) continue;
      taken.push({ x, y, s: L.s * 0.5 }); const sd = hashStr(id + 'p' + tries);
      objs.push({ y, x, draw: () => race.prop(ctx, x, y, L.s * 0.85, rng(sd)) });
    }
    if (race.extra) { const ex = cx + (li === 0 ? 0 : rx * 0.0), ey = cy + (li === 0 ? 0 : 0) + (li >= 1 ? ry * 0.55 : 0); if (li === 0 || raceKey === 'human' && li >= 2) objs.push({ y: ey, draw: () => race.extra(ctx, ex, ey - (li === 0 ? 0.12 : 0.07) + (li === 0 ? 0 : 0), r, li, fx) }); }
    if (race.walk) { const hs = objs.filter((o) => o.x && o !== lm).sort((a, b) => a.x - b.x); for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) { const A = hs[i], B = hs[j]; if (Math.hypot(A.x - B.x, (A.y - B.y) * 2) < L.s * 1.9) race.walk(ctx, { x: A.x, y: A.y + 0.01 }, { x: B.x, y: B.y + 0.01 }); } }
    wallRing(ctx, cx, cy, rx, ry, race, li, true, r, fx);
    objs.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
    wallRing(ctx, cx, cy, rx, ry, race, li, false, r, fx);
    fx.forEach((p) => drawSmoke(ctx, p));
    ctx.restore();
  };
}

const NAMES = {
  human: ['Human', ['Hamlet', 'Village', 'Town', 'City', 'Capital']],
  elf: ['Elven', ['Glade', 'Village', 'Town', 'City', 'Capital']],
  dwarf: ['Dwarven', ['Outpost', 'Hold', 'Town', 'City', 'Capital']],
  orc: ['Orc', ['Camp', 'Village', 'Town', 'Stronghold']],
  halfling: ['Halfling', ['Hamlet', 'Village', 'Town', 'City']],
  gnome: ['Gnome', ['Workshop', 'Village', 'Town', 'City']],
  dragonborn: ['Dragonborn', ['Outpost', 'Village', 'Town', 'City']],
  lizard: ['Lizardfolk', ['Stilt Camp', 'Village', 'Town', 'City']],
  drow: ['Drow', ['Outpost', 'Village', 'Town', 'City']],
  merfolk: ['Merfolk', ['Reef', 'Village', 'Town', 'City']],
};
const GROUPNAMES = { human: 'Human', elf: 'Elven', dwarf: 'Dwarven', orc: 'Orc & Goblin', halfling: 'Halfling', gnome: 'Gnome', dragonborn: 'Dragonborn', lizard: 'Lizardfolk', drow: 'Drow & Tiefling', merfolk: 'Merfolk' };

const levelsFor = (key) => (NAMES[key][1].length === 5 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3]);
const order = (arr) => [1, 0, ...arr.filter((i) => i > 1)]; // Village first (the group tile)

export const STAMPS_SETTLEMENTSA = Object.keys(R).flatMap((key) =>
  order(levelsFor(key)).map((li) => {
    const id = `set_${key === 'lizard' ? 'lizardfolk' : key}_${['hamlet', 'village', 'town', 'city', 'capital'][li]}`;
    // 4-level races use Camp/Village/Town/City names with level index 0..3 mapped onto LV 0..3
    return {
      id, name: `${NAMES[key][0]} ${NAMES[key][1][li]}`, category: 'world_civilization',
      rotate: 'fixed',
      defaultScale: [2.1, 1.8, 1.7, 1.6, 1.6][li], aspect: LV[li].asp,
      group: `set_${key === 'lizard' ? 'lizardfolk' : key}`, groupName: `${GROUPNAMES[key]} Settlements`,
      render: makeRender(key, li, id),
    };
  })
);
