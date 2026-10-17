import { fitBox } from './settlementsA.js';
// Castles, fortresses, strongholds and landmarks for every major race (settlementsB workstream).
// All stamps draw in a 100-unit-high box (width = 100 * aspect); light from upper-left,
// lit left / dark right faces, ground shadow falls to the lower right. Deterministic: seeded PRNG only.

const TAU = Math.PI * 2;
const LW = 2.1;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function rgb(s) {
  if (typeof s !== 'string') return [200, 200, 200];
  let m = s.trim();
  if (m[0] === '#') {
    if (m.length === 4) m = '#' + [...m.slice(1)].map((x) => x + x).join('');
    const n = parseInt(m.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const r = m.match(/[\d.]+/g);
  return r && r.length >= 3 ? r.slice(0, 3).map(Number) : [200, 200, 200];
}
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
const lt = (c, t = 0.3) => mix(c, '#fff6dc', t);
const dk = (c, t = 0.4) => mix(c, '#1d1030', t);

function pal(color, fill) {
  const f = fill || '#e2d9cc';
  return { ink: mix(color || '#271c19', '#8a7a68', 0.4), hi: mix(f, '#fff6dc', 0.45), lit: mix(f, '#fff6dc', 0.18), mid: f, dk: mix(f, '#3a3150', 0.36), dd: mix(f, '#241c34', 0.58) };
}
// Re-tint a stone palette (keeps `fill` as the base).
function tone(P, col, t) {
  const o = { ink: P.ink };
  for (const k of ['hi', 'lit', 'mid', 'dk', 'dd']) o[k] = mix(P[k], col, t);
  return o;
}

const RED = '#b0372f', BLUE = '#3d5fa8', GREEN = '#3f8a56', TEAL = '#2f8f8a', PURPLE = '#6a3fa0', GOLD = '#d6a52c',
  WOOD = '#8a5a34', DWOOD = '#5c3a22', SLATE = '#56607a', ORANGE = '#e8802a', GLOW = '#ffd36a', VOID = '#150f1d';

function shadow(c, cx, cy, rx, ry, a = 0.3) {
  rx *= 1.2; ry = Math.max(ry * 1.9, rx * 0.17);
  c.save();
  c.translate(cx, cy); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(96,70,44,${a * 1.15})`); g.addColorStop(0.6, `rgba(96,70,44,${a * 0.8})`); g.addColorStop(1, 'rgba(96,70,44,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
  c.restore();
}
function ink(c, P, lw = LW) { c.strokeStyle = P.ink; c.lineWidth = Math.max(0.5, lw * 0.68); c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function hgrad(c, x, w, stops) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
const CYL = (P) => [[0, P.lit], [0.2, P.hi], [0.5, P.mid], [0.82, P.dk], [1, P.dd]];
const WALL = (P) => [[0, P.hi], [0.45, P.lit], [0.6, P.mid], [1, P.dk]];
const stonesOf = (col) => ({ hi: lt(col, 0.4), lit: lt(col, 0.15), mid: col, dk: dk(col, 0.35), dd: dk(col, 0.6) });
const stops = (S, cyl) => cyl ? [[0, S.lit], [0.2, S.hi], [0.5, S.mid], [0.82, S.dk], [1, S.dd]] : [[0, S.hi], [0.45, S.lit], [0.6, S.mid], [1, S.dk]];

// Masonry body: shaded faces + brick courses + plinth shade + outline.
function body(c, P, x, y, w, h, o = {}) {
  const r = o.rnd || rng(7);
  c.fillStyle = hgrad(c, x, w, o.stops || stops(o.S || P, o.cyl));
  c.fillRect(x, y, w, h);
  if (o.tex !== 0) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.strokeStyle = P.ink; c.globalAlpha = o.tex || 0.2; c.lineWidth = 0.45;
    const bh = o.bh || 4.4, bw = o.bw || 6.5;
    let row = 0;
    c.beginPath();
    for (let yy = y + bh; yy < y + h; yy += bh, row++) {
      c.moveTo(x, yy); c.lineTo(x + w, yy);
      for (let xx = x + (row % 2 ? bw / 2 : 0) + r() * 1.5; xx < x + w; xx += bw) { c.moveTo(xx, yy - bh); c.lineTo(xx, yy); }
    }
    c.stroke();
    c.restore();
  }
  const g = c.createLinearGradient(0, y + h * 0.78, 0, y + h);
  g.addColorStop(0, 'rgba(30,20,40,0)'); g.addColorStop(1, 'rgba(30,20,40,0.24)');
  c.fillStyle = g; c.fillRect(x, y + h * 0.78, w, h * 0.22);
  c.beginPath(); c.rect(x, y, w, h); ink(c, P, o.lw || LW);
}
// Parapet ring + merlons sitting on top edge y.
function merl(c, P, x, y, w, o = {}) {
  const S = o.S || P;
  const n = o.n || Math.max(3, Math.round(w / 5.2));
  const mh = o.h || 3.4, step = w / n, mw = step * 0.6;
  if (o.cyl) {
    const rx = (w + 2) / 2, cx = x + w / 2, ry = rx * 0.32;
    c.beginPath(); c.ellipse(cx, y - 3, rx, ry, 0, 0, TAU); c.fillStyle = S.hi; c.fill(); ink(c, P, 1.2);
    c.beginPath(); c.ellipse(cx, y - 3.4, rx * 0.72, ry * 0.62, 0, 0, TAU); c.fillStyle = S.dk; c.fill();
  } else {
    const d = 3.2;
    c.beginPath(); c.moveTo(x - 1, y - 1.6); c.lineTo(x + w + 1, y - 1.6); c.lineTo(x + w + 3, y - 1.6 - d); c.lineTo(x + 1, y - 1.6 - d); c.closePath();
    c.fillStyle = hgrad(c, x, w, [[0, S.hi], [1, S.lit]]); c.fill(); ink(c, P, 1);
  }
  c.fillStyle = hgrad(c, x - 1, w + 2, o.cyl ? CYL(S) : WALL(S)); c.fillRect(x - 1, y - 1.6, w + 2, 2.6);
  c.beginPath(); c.rect(x - 1, y - 1.6, w + 2, 2.6); ink(c, P, 1.4);
  for (let i = 0; i < n; i++) {
    const mx = x + i * step + (step - mw) / 2, f = i / (n - 1 || 1);
    c.fillStyle = f < 0.35 ? S.lit : f > 0.7 ? S.dk : S.mid;
    c.fillRect(mx, y - 1.6 - mh, mw, mh + 0.3);
    c.beginPath(); c.rect(mx, y - 1.6 - mh, mw, mh + 0.3); ink(c, P, 1.2);
  }
}
function cone(c, P, cx, by, w, h, col, o = {}) {
  const ov = o.ov ?? w * 0.1, L = cx - w / 2 - ov, R = cx + w / 2 + ov, tip = by - h, cv = o.cv || 0, tx = o.tx ?? cx;
  const path = (full, half) => {
    c.beginPath(); c.moveTo(L, by);
    c.quadraticCurveTo((L + tx) / 2 + cv, (by + tip) / 2, tx, tip);
    if (full || half === 'R') c.quadraticCurveTo((R + tx) / 2 - cv, (by + tip) / 2, R, by);
    else c.lineTo(cx, by);
    c.quadraticCurveTo(cx, by + 2.2, full ? L : cx, by + (full ? 0 : 1.6));
    c.closePath();
  };
  // left lit half
  c.beginPath(); c.moveTo(L, by); c.quadraticCurveTo((L + tx) / 2 + cv, (by + tip) / 2, tx, tip); c.lineTo(cx + (tx - cx) * 0, by + 1.8); c.closePath();
  c.fillStyle = lt(col, 0.22); c.fill();
  c.beginPath(); c.moveTo(R, by); c.quadraticCurveTo((R + tx) / 2 - cv, (by + tip) / 2, tx, tip); c.lineTo(cx, by + 1.8); c.closePath();
  c.fillStyle = dk(col, 0.3); c.fill();
  // shingle lines
  c.save(); c.globalAlpha = 0.28; c.lineWidth = 0.5; c.strokeStyle = P.ink; c.beginPath();
  for (let i = 1; i < 5; i++) { const bx = L + (R - L) * i / 5; c.moveTo(tx, tip + 1); c.lineTo(bx, by); }
  c.stroke(); c.restore();
  c.beginPath(); c.moveTo(L, by); c.quadraticCurveTo((L + tx) / 2 + cv, (by + tip) / 2, tx, tip);
  c.quadraticCurveTo((R + tx) / 2 - cv, (by + tip) / 2, R, by); c.quadraticCurveTo(cx, by + 3, L, by); ink(c, P, o.lw || LW);
  void path;
}
function dome(c, P, cx, by, w, h, col) {
  c.beginPath(); c.moveTo(cx - w / 2, by);
  c.bezierCurveTo(cx - w * 0.78, by - h * 0.4, cx - w * 0.2, by - h * 0.55, cx, by - h);
  c.bezierCurveTo(cx + w * 0.2, by - h * 0.55, cx + w * 0.78, by - h * 0.4, cx + w / 2, by);
  c.closePath();
  c.fillStyle = hgrad(c, cx - w / 2, w, [[0, lt(col, 0.4)], [0.3, lt(col, 0.15)], [0.65, col], [1, dk(col, 0.4)]]); c.fill();
  ink(c, P);
}
function flag(c, P, x, y, h, col, o = {}) {
  const d = o.dir || 1, fw = o.w || h * 0.95, fh = o.h || h * 0.42;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.lineCap = 'round'; c.stroke();
  c.beginPath(); c.moveTo(x, y - h);
  c.bezierCurveTo(x + d * fw * 0.3, y - h - fh * 0.25, x + d * fw * 0.65, y - h + fh * 0.3, x + d * fw, y - h + fh * 0.1);
  if (o.swallow) c.lineTo(x + d * fw * 0.78, y - h + fh * 0.5);
  c.lineTo(x + d * fw, y - h + fh);
  c.bezierCurveTo(x + d * fw * 0.65, y - h + fh * 1.25, x + d * fw * 0.3, y - h + fh * 0.75, x, y - h + fh);
  c.closePath(); c.fillStyle = col; c.fill(); ink(c, P, 0.9);
  if (o.dot) { c.beginPath(); c.arc(x + d * fw * 0.4, y - h + fh * 0.5, fh * 0.2, 0, TAU); c.fillStyle = o.dot; c.fill(); }
}
function gate(c, P, cx, by, w, h, o = {}) {
  const r = w / 2, top = by - h;
  c.beginPath(); c.moveTo(cx - r, by); c.lineTo(cx - r, top + r); c.arc(cx, top + r, r, Math.PI, 0); c.lineTo(cx + r, by); c.closePath();
  c.fillStyle = o.glow || VOID; c.fill();
  if (o.glow) {
    const g = c.createLinearGradient(0, top, 0, by); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fill();
  }
  if (o.port) {
    c.save(); c.clip(); c.strokeStyle = o.portCol || '#6b5a4a'; c.lineWidth = 0.9; c.beginPath();
    for (let x = cx - r + 1.6; x < cx + r; x += 2.6) { c.moveTo(x, top); c.lineTo(x, by); }
    for (let y = top + r * 0.6; y < by; y += 3.4) { c.moveTo(cx - r, y); c.lineTo(cx + r, y); }
    c.stroke(); c.restore();
  }
  // voussoir ring
  c.beginPath(); c.arc(cx, top + r, r + 1.5, Math.PI, 0); c.strokeStyle = P.hi; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.moveTo(cx - r, by); c.lineTo(cx - r, top + r); c.arc(cx, top + r, r, Math.PI, 0); c.lineTo(cx + r, by); ink(c, P, 1.5);
}
function slit(c, P, x, y, w = 1.8, h = 5.5, glow) {
  c.beginPath(); c.moveTo(x - w / 2, y + h); c.lineTo(x - w / 2, y + w / 2); c.arc(x, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y + h); c.closePath();
  c.fillStyle = glow || VOID; c.fill(); ink(c, P, 0.7);
}
function tower(c, P, cx, by, w, h, o = {}) {
  const x = cx - w / 2, top = by - h, S = o.S || P;
  body(c, P, x, top, w, h, { cyl: o.cyl !== false, rnd: o.rnd, S, bh: o.bh });
  const n = o.slits ?? 2;
  for (let i = 0; i < n; i++) slit(c, P, cx, top + h * (0.2 + 0.28 * i) + (o.roof ? 2 : 4), Math.max(1.4, w * 0.12), Math.min(6.5, h * 0.14), o.glow);
  if (o.band) { c.fillStyle = 'rgba(30,20,40,0.22)'; c.fillRect(x, top + h * o.band, w, 1.4); }
  let tip = top;
  if (o.roof) {
    const rh = o.rh || w * 1.15;
    cone(c, P, cx, top, w, rh, o.roof, { ov: o.ov ?? w * 0.13, cv: o.cv });
    tip = top - rh;
  } else if (o.dome) {
    dome(c, P, cx, top, w * 1.2, w * 1.4, o.dome); tip = top - w * 1.4;
  } else if (o.top !== 'none') {
    merl(c, P, x - (o.over ?? 0.8), top, w + (o.over ?? 0.8) * 2, { S, cyl: true, n: o.n });
    tip = top - 5;
  }
  if (o.flag) flag(c, P, cx, tip + 0.5, o.flagH || 11, o.flag, { dir: o.fdir || 1 });
  return tip;
}
// Curtain wall run with walkway + merlons.
function wall(c, P, x0, x1, by, h, o = {}) {
  const w = x1 - x0, top = by - h;
  body(c, P, x0, top, w, h, { rnd: o.rnd, S: o.S, tex: o.tex });
  merl(c, P, x0, top, w, { S: o.S, n: o.n });
  if (o.slits) for (let i = 0; i < o.slits; i++) slit(c, P, x0 + (i + 0.5) * w / o.slits, top + 4, 1.5, 4.5, o.glow);
}
function tufts(c, P, r, x0, x1, y, n, col = '#4c7a3e') {
  c.save(); c.strokeStyle = col; c.lineWidth = 0.9; c.lineCap = 'round'; c.beginPath();
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), yy = y + (r() - 0.5) * 3, s = 1.6 + r() * 1.6;
    c.moveTo(x - 1.2, yy); c.lineTo(x - 1.6, yy - s); c.moveTo(x, yy); c.lineTo(x, yy - s * 1.25); c.moveTo(x + 1.2, yy); c.lineTo(x + 1.7, yy - s);
  }
  c.stroke(); c.restore();
}
function tree(c, P, x, by, s, o = {}) {
  const col = o.col || '#3f7d46', tr = o.trunk || DWOOD;
  c.fillStyle = tr; c.fillRect(x - s * 0.06, by - s * 0.45, s * 0.12, s * 0.45);
  const blobs = [[-0.28, -0.55, 0.3], [0.28, -0.55, 0.28], [0, -0.8, 0.34], [-0.1, -0.5, 0.3], [0.22, -0.82, 0.22]];
  const draw = (fn) => blobs.forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * s, by + dy * s, rr * s, 0, TAU); fn(); });
  draw(() => { c.fillStyle = dk(col, 0.25); c.fill(); });
  blobs.forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * s - rr * s * 0.12, by + dy * s - rr * s * 0.14, rr * s * 0.82, 0, TAU); c.fillStyle = col; c.fill(); });
  blobs.slice(0, 3).forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * s - rr * s * 0.3, by + dy * s - rr * s * 0.3, rr * s * 0.4, 0, TAU); c.fillStyle = lt(col, 0.35); c.fill(); });
  c.strokeStyle = P.ink; c.lineWidth = 0.9; blobs.forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * s, by + dy * s, rr * s, -0.2 * Math.PI, 0.95 * Math.PI); c.stroke(); });
}
function pine(c, P, x, by, s, col = '#2f6b45') {
  c.fillStyle = DWOOD; c.fillRect(x - s * 0.05, by - s * 0.18, s * 0.1, s * 0.18);
  for (let i = 0; i < 3; i++) {
    const y = by - s * 0.12 - i * s * 0.26, w = s * (0.36 - i * 0.07);
    c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - s * 0.4); c.lineTo(x + w, y); c.closePath();
    c.fillStyle = hgrad(c, x - w, w * 2, [[0, lt(col, 0.3)], [0.5, col], [1, dk(col, 0.4)]]); c.fill(); ink(c, P, 0.9);
  }
}
// Jagged mountain mass: lit left of apex, dark right, ridge line, optional snow.
function mount(c, P, x, by, w, h, col, r, o = {}) {
  const ax = x + w * (o.apex ?? 0.45), ay = by - h;
  const pts = [[x, by]];
  const nL = 3; for (let i = 1; i <= nL; i++) { const t = i / (nL + 1); pts.push([x + (ax - x) * t + (r() - 0.5) * w * 0.05, by - h * (t * 0.95 + (r() - 0.5) * 0.12)]); }
  pts.push([ax, ay]);
  const nR = 3; for (let i = 1; i <= nR; i++) { const t = i / (nR + 1); pts.push([ax + (x + w - ax) * t + (r() - 0.5) * w * 0.05, ay + (by - ay) * (t * 0.95 + (r() - 0.5) * 0.1)]); }
  pts.push([x + w, by]);
  const P2 = () => { c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); };
  P2(); c.fillStyle = lt(col, 0.18); c.fill();
  c.save(); P2(); c.clip();
  c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(ax + w * 0.03, by - h * 0.5, ax + w * 0.1, by); c.lineTo(x + w + 2, by); c.lineTo(x + w + 2, ay - 2); c.closePath();
  c.fillStyle = dk(col, 0.34); c.fill();
  c.strokeStyle = P.ink; c.globalAlpha = 0.3; c.lineWidth = 0.6; c.beginPath();
  for (let i = 0; i < 9; i++) { const yy = ay + h * (0.2 + i * 0.09), xx = ax + w * (0.04 + r() * 0.1); c.moveTo(xx, yy); c.lineTo(xx + w * (0.12 + r() * 0.12), yy + h * 0.1); }
  c.stroke(); c.globalAlpha = 1;
  if (o.snow) {
    c.beginPath(); c.moveTo(ax - w * 0.2, ay + h * 0.28); c.lineTo(ax - w * 0.1, ay + h * 0.2); c.lineTo(ax - w * 0.05, ay + h * 0.3); c.lineTo(ax + w * 0.02, ay + h * 0.2); c.lineTo(ax + w * 0.1, ay + h * 0.32); c.lineTo(ax + w * 0.2, ay + h * 0.3); c.lineTo(ax + w * 0.3, ay - 2); c.lineTo(ax - w * 0.3, ay - 2); c.closePath();
    c.fillStyle = '#f4f2ee'; c.fill();
  }
  c.restore();
  P2(); ink(c, P);
  return [ax, ay];
}
function smoke(c, x, y, r, n = 4, col = 'rgba(90,85,95,0.55)') {
  for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x + Math.sin(i * 1.7) * r * 0.7 + i * r * 0.35, y - i * r * 1.1, r * (0.6 + i * 0.22), 0, TAU); c.fillStyle = col; c.fill(); }
}
function glowAt(c, x, y, r, col = 'rgba(255,190,80,0.55)') {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,190,80,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function poly(c, P, pts, fill, lw = 1.6) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); } ink(c, P, lw);
}
// Lit-left / dark-right box (house, hut) with a gabled roof. Returns nothing.
function house(c, P, x, by, w, h, roof, o = {}) {
  const wallC = o.wall || P.mid, top = by - h;
  c.fillStyle = hgrad(c, x, w, stops(stonesOf(wallC), false)); c.fillRect(x, top, w, h); c.beginPath(); c.rect(x, top, w, h); ink(c, P, 1.4);
  const rh = o.rh || w * 0.5;
  c.beginPath(); c.moveTo(x - 1.5, top + 0.5); c.lineTo(x + w / 2, top - rh); c.lineTo(x + w / 2, top + 0.5); c.closePath(); c.fillStyle = lt(roof, 0.2); c.fill();
  c.beginPath(); c.moveTo(x + w + 1.5, top + 0.5); c.lineTo(x + w / 2, top - rh); c.lineTo(x + w / 2, top + 0.5); c.closePath(); c.fillStyle = dk(roof, 0.3); c.fill();
  c.beginPath(); c.moveTo(x - 1.5, top + 0.5); c.lineTo(x + w / 2, top - rh); c.lineTo(x + w + 1.5, top + 0.5); c.closePath(); ink(c, P, 1.4);
  if (o.door !== false) { c.fillStyle = DWOOD; c.fillRect(x + w * 0.4, by - h * 0.45, w * 0.2, h * 0.45); c.strokeStyle = P.ink; c.lineWidth = 0.8; c.strokeRect(x + w * 0.4, by - h * 0.45, w * 0.2, h * 0.45); }
}

const ALL = [];
const mk = (id, name, group, groupName, aspect, scale, seed, draw) => (ALL.push({
  id: 'cas_' + id, name, category: 'world_civilization',
  rotate: 'fixed',
  defaultScale: scale, aspect,
  group: 'cas_' + group, groupName,
  render: (ctx, size, color = '#271c19', fill = '#e2d9cc') => {
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    draw(ctx, pal(color, fill), 100 * aspect, 100, rng(seed + hashStr(id)));
    ctx.restore();
  },
}), ALL[ALL.length - 1]);


// ---------------------------------------------------------------- HUMAN
const HUMAN = (id, name, aspect, scale, draw) => mk(id, name, 'human', 'Human Castles', aspect, scale, 11, draw);

const humanKeep = HUMAN('human_keep', 'Human Keep', 1.0, 1.05, (c, P, W, H, r) => {
  shadow(c, 56, 90, 40, 6);
  tufts(c, P, r, 14, 88, 90, 10);
  body(c, P, 30, 38, 40, 50, { rnd: r });
  merl(c, P, 30, 38, 40);
  tower(c, P, 29, 88, 13, 58, { rnd: r, roof: RED, rh: 17, slits: 1 });
  tower(c, P, 71, 88, 13, 58, { rnd: r, roof: RED, rh: 17, slits: 1 });
  slit(c, P, 42, 50, 2.4, 8); slit(c, P, 58, 50, 2.4, 8); slit(c, P, 50, 47, 2.4, 8, GLOW);
  gate(c, P, 50, 88, 11, 17, { port: true });
  flag(c, P, 50, 33, 20, RED, { dot: GOLD });
  flag(c, P, 29, 31, 9, BLUE, { swallow: true });
});

const humanCastle = HUMAN('human_castle', 'Human Castle', 1.2, 1.2, (c, P, W, H, r) => {
  shadow(c, 66, 91, 52, 6);
  tufts(c, P, r, 6, 114, 91, 12);
  // keep behind
  tower(c, P, 60, 76, 28, 46, { rnd: r, roof: RED, rh: 24, slits: 2, flag: RED, flagH: 9, cyl: false, ov: 3 });
  slit(c, P, 54, 42, 2.2, 7, GLOW); slit(c, P, 66, 42, 2.2, 7, GLOW);
  // inner towers
  tower(c, P, 34, 80, 12, 42, { rnd: r, roof: BLUE, rh: 16, slits: 1 });
  tower(c, P, 86, 80, 12, 42, { rnd: r, roof: BLUE, rh: 16, slits: 1 });
  // front wall
  wall(c, P, 14, 106, 88, 22, { rnd: r, slits: 7 });
  // outer towers
  tower(c, P, 14, 90, 17, 52, { rnd: r, roof: RED, rh: 22, slits: 2, flag: GOLD, flagH: 9 });
  tower(c, P, 106, 90, 17, 52, { rnd: r, roof: RED, rh: 22, slits: 2, flag: GOLD, flagH: 9, fdir: -1 });
  // gatehouse
  body(c, P, 49, 54, 22, 36, { rnd: r });
  merl(c, P, 49, 54, 22, { n: 4 });
  gate(c, P, 60, 90, 11, 20, { port: true });
  flag(c, P, 60, 50, 11, GOLD, { swallow: true });
});

const humanFortress = HUMAN('human_fortress', 'Human Fortress', 1.2, 1.2, (c, P, W, H, r) => {
  const Q = tone(P, '#8b93a6', 0.28);
  shadow(c, 66, 91, 54, 7);
  // moat
  c.beginPath(); c.ellipse(60, 91, 54, 5, 0, 0, TAU); c.fillStyle = 'rgba(86,130,170,0.35)'; c.fill();
  // rear keep (square, flat top)
  body(c, Q, 42, 22, 36, 56, { rnd: r }); merl(c, Q, 42, 22, 36, { n: 7 });
  [48, 60, 72].forEach((x) => slit(c, Q, x, 34, 2.2, 8));
  flag(c, Q, 60, 20, 18, RED, { dot: GOLD });
  // side bastions
  [[20, 1], [100, -1]].forEach(([x, d]) => {
    tower(c, Q, x, 80, 18, 44, { S: Q, rnd: r, slits: 2, flag: RED, flagH: 9, fdir: d, n: 4 });
  });
  wall(c, Q, 20, 100, 88, 24, { rnd: r, S: Q, slits: 8 });
  // front drum towers + gatehouse
  tower(c, Q, 14, 92, 20, 58, { S: Q, rnd: r, slits: 3, n: 5 });
  tower(c, Q, 106, 92, 20, 58, { S: Q, rnd: r, slits: 3, n: 5 });
  tower(c, Q, 47, 90, 14, 50, { S: Q, rnd: r, slits: 1 });
  tower(c, Q, 73, 90, 14, 50, { S: Q, rnd: r, slits: 1 });
  body(c, Q, 47, 50, 26, 40, { rnd: r, S: Q }); merl(c, Q, 47, 50, 26, { n: 5, S: Q });
  gate(c, Q, 60, 90, 13, 24, { port: true, portCol: '#8a7a6a' });
  flag(c, Q, 60, 46, 14, RED, { swallow: true });
});

const humanCitadel = HUMAN('human_citadel', 'Human Citadel', 1.3, 1.3, (c, P, W, H, r) => {
  shadow(c, 70, 92, 58, 6);
  tufts(c, P, r, 6, 124, 92, 14);
  // rear great keep with spires
  tower(c, P, 48, 64, 11, 30, { rnd: r, roof: BLUE, rh: 15, slits: 1 });
  tower(c, P, 82, 64, 11, 30, { rnd: r, roof: BLUE, rh: 15, slits: 1 });
  body(c, P, 53, 36, 24, 38, { rnd: r }); merl(c, P, 53, 36, 24, { n: 5 });
  tower(c, P, 65, 62, 16, 36, { rnd: r, roof: BLUE, rh: 22, slits: 2, flag: GOLD, flagH: 9, ov: 2 });
  slit(c, P, 59, 44, 2.4, 7, GLOW); slit(c, P, 71, 44, 2.4, 7, GLOW);
  // mid wall with 3 towers
  wall(c, P, 26, 104, 76, 20, { rnd: r, slits: 6 });
  [28, 65, 102].forEach((x, i) => tower(c, P, x, 78, 13, 46, { rnd: r, roof: i === 1 ? RED : BLUE, rh: 18, slits: 1, flag: RED, flagH: 8 }));
  // front wall + gatehouse
  wall(c, P, 8, 122, 90, 20, { rnd: r, slits: 10 });
  [10, 120].forEach((x, i) => tower(c, P, x, 92, 18, 54, { rnd: r, roof: RED, rh: 24, slits: 2, flag: GOLD, flagH: 10, fdir: i ? -1 : 1 }));
  tower(c, P, 52, 92, 13, 54, { rnd: r, roof: BLUE, rh: 19, slits: 1 });
  tower(c, P, 78, 92, 13, 54, { rnd: r, roof: BLUE, rh: 19, slits: 1 });
  body(c, P, 52, 56, 26, 34, { rnd: r }); merl(c, P, 52, 56, 26, { n: 5 });
  gate(c, P, 65, 90, 13, 22, { port: true });
  flag(c, P, 65, 52, 13, RED, { dot: GOLD });
});


// ---------------------------------------------------------------- ELVEN
const ELF = (id, name, aspect, scale, draw) => mk(id, name, 'elf', 'Elven Citadels', aspect, scale, 23, draw);
const ELFWHITE = (P) => tone(P, '#f4f7ee', 0.42);
const LEAF = '#4f9a58', LEAFD = '#2f7048', SILVER = '#9fb4c8', MOON = '#e9e4b4';
function leafArch(c, P, cx, by, w, h) {
  c.beginPath(); c.moveTo(cx - w / 2, by); c.quadraticCurveTo(cx - w / 2, by - h * 0.55, cx, by - h); c.quadraticCurveTo(cx + w / 2, by - h * 0.55, cx + w / 2, by); c.closePath();
  c.fillStyle = '#243a30'; c.fill(); ink(c, P, 1.2);
  glowAt(c, cx, by - h * 0.4, w, 'rgba(190,255,200,0.35)');
}
function vineTower(c, P, cx, by, w, h, roof, o = {}) {
  const E = o.E;
  const tip = tower(c, E, cx, by, w, h, { rnd: o.rnd, roof, rh: o.rh || w * 2.1, cv: w * 0.22, ov: w * 0.08, slits: 0, flag: o.flag, flagH: 8 });
  const top = by - h;
  for (let i = 0; i < (o.win ?? 2); i++) leafArch(c, P, cx, top + 12 + i * 15, w * 0.3, 8);
  // living vines/roots climbing the tower
  c.strokeStyle = LEAFD; c.lineWidth = 1.5; c.beginPath();
  c.moveTo(cx - w / 2 + 1, by); c.bezierCurveTo(cx - w / 2 - 2, by - h * 0.3, cx + w / 4, by - h * 0.45, cx - w / 4, top + 3); c.stroke();
  for (let i = 0; i < 5; i++) { const t = (i + 1) / 6, lx = cx - w / 2 + 1 + Math.sin(t * 5) * 3, ly = by - h * t; c.beginPath(); c.ellipse(lx, ly, 2.2, 1.2, -0.6, 0, TAU); c.fillStyle = LEAF; c.fill(); ink(c, P, 0.6); }
  return tip;
}

const elfCitadel = ELF('elf_citadel', 'Elven Citadel', 1.1, 1.2, (c, P, W, H, r) => {
  const E = ELFWHITE(P);
  shadow(c, 58, 91, 46, 6);
  tree(c, P, 14, 90, 36, { col: LEAF }); tree(c, P, 100, 90, 34, { col: '#58a860' });
  // low gallery wall with leaf arches
  body(c, E, 24, 62, 62, 28, { rnd: r, S: E, tex: 0.1 });
  [34, 48, 62, 76].forEach((x) => leafArch(c, P, x, 90, 7, 15));
  c.fillStyle = hgrad(c, 22, 66, [[0, E.hi], [1, E.dk]]); c.fillRect(22, 59, 66, 4); c.beginPath(); c.rect(22, 59, 66, 4); ink(c, P, 1.4);
  vineTower(c, P, 28, 62, 11, 36, TEAL, { E, rnd: r, win: 1, flag: SILVER });
  vineTower(c, P, 82, 62, 11, 36, TEAL, { E, rnd: r, win: 1, flag: SILVER });
  const tip = vineTower(c, P, 55, 64, 16, 44, '#2b8a7e', { E, rnd: r, rh: 30, win: 3, flag: '#d9e8cf' });
  void tip;
  tree(c, P, 38, 92, 24, { col: '#63b06a' }); tree(c, P, 74, 92, 22, { col: LEAF });
  tufts(c, P, r, 8, 104, 91, 12, '#3d7d3a');
});

const elfTreehold = ELF('elf_treehold', 'Elven Treehold', 1.0, 1.3, (c, P, W, H, r) => {
  shadow(c, 50, 91, 38, 5);
  // root flare + trunk
  c.beginPath(); c.moveTo(24, 92); c.bezierCurveTo(36, 90, 38, 82, 40, 70); c.lineTo(41, 40); c.lineTo(59, 40); c.lineTo(60, 70); c.bezierCurveTo(62, 82, 66, 90, 78, 92);
  c.bezierCurveTo(66, 94, 34, 94, 24, 92); c.closePath();
  c.fillStyle = hgrad(c, 24, 54, [[0, '#9a6e44'], [0.35, '#7d5636'], [0.7, '#5c3d26'], [1, '#3e2a1c']]); c.fill(); ink(c, P);
  c.save(); c.globalAlpha = 0.3; c.strokeStyle = P.ink; c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i < 6; i++) { const x = 42 + i * 3.2; c.moveTo(x, 90); c.bezierCurveTo(x - 2, 70, x + 2, 55, x, 42); } c.stroke(); c.restore();
  // door
  c.beginPath(); c.moveTo(46, 91); c.lineTo(46, 80); c.quadraticCurveTo(50, 70, 54, 80); c.lineTo(54, 91); c.closePath(); c.fillStyle = '#2c1a10'; c.fill(); ink(c, P, 1.2);
  glowAt(c, 50, 82, 8, 'rgba(255,220,130,0.5)');
  // platforms with huts
  const plat = (x, y, w) => { c.fillStyle = '#a07a50'; c.fillRect(x, y, w, 3); c.beginPath(); c.rect(x, y, w, 3); ink(c, P, 1.2); };
  plat(22, 60, 22); plat(58, 52, 22);
  house(c, P, 26, 60, 12, 9, '#4f9a58', { wall: '#c9a874', rh: 8 });
  house(c, P, 62, 52, 12, 9, '#4f9a58', { wall: '#c9a874', rh: 8 });
  c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(38, 63); c.lineTo(36, 78); c.moveTo(70, 55); c.lineTo(72, 70); c.stroke();
  // rope bridge
  c.beginPath(); c.moveTo(44, 61); c.quadraticCurveTo(51, 66, 58, 54); c.strokeStyle = '#6d4a2c'; c.lineWidth = 1.4; c.stroke();
  // canopy
  const blobs = [[22, 30, 20], [78, 30, 20], [50, 18, 24], [34, 18, 18], [66, 16, 18], [12, 44, 12], [88, 44, 12], [50, 34, 20]];
  blobs.forEach(([x, y, rr]) => { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fillStyle = dk(LEAF, 0.3); c.fill(); });
  blobs.forEach(([x, y, rr]) => { c.beginPath(); c.arc(x - rr * 0.1, y - rr * 0.12, rr * 0.85, 0, TAU); c.fillStyle = LEAF; c.fill(); });
  blobs.slice(0, 5).forEach(([x, y, rr]) => { c.beginPath(); c.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.4, 0, TAU); c.fillStyle = lt(LEAF, 0.4); c.fill(); });
  c.strokeStyle = P.ink; c.lineWidth = 1; blobs.forEach(([x, y, rr]) => { c.beginPath(); c.arc(x, y, rr, -0.1 * Math.PI, 0.9 * Math.PI); c.stroke(); });
  // blossoms + lanterns
  for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(8 + r() * 84, 8 + r() * 44, 1, 0, TAU); c.fillStyle = '#f7e9a8'; c.fill(); }
  [[30, 58], [70, 50]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fillStyle = GLOW; c.fill(); });
  tufts(c, P, r, 12, 90, 92, 8, '#3d7d3a');
});

const elfMoonspire = ELF('elf_moonspire', 'Elven Moonspire', 0.8, 1.2, (c, P, W, H, r) => {
  const E = ELFWHITE(P);
  shadow(c, 42, 92, 30, 5);
  tree(c, P, 14, 92, 26, { col: LEAF }); tree(c, P, 68, 92, 24, { col: '#58a860' });
  // moon pool
  c.beginPath(); c.ellipse(40, 90, 18, 3.4, 0, 0, TAU); c.fillStyle = '#a5cbd8'; c.fill(); ink(c, P, 1);
  // stacked tiers
  body(c, E, 24, 70, 32, 18, { rnd: r, S: E, tex: 0.1 });
  [30, 40, 50].forEach((x) => leafArch(c, P, x, 88, 5, 10));
  tower(c, E, 40, 72, 20, 22, { rnd: r, S: E, slits: 0, roof: SILVER, rh: 8, ov: 3 });
  const tip = tower(c, E, 40, 58, 12, 30, { rnd: r, S: E, slits: 0, roof: TEAL, rh: 24, cv: 2.6, ov: 1.5 });
  leafArch(c, P, 40, 70, 4, 8); leafArch(c, P, 40, 52, 3.5, 7); leafArch(c, P, 40, 40, 3, 6);
  // crescent finial
  c.beginPath(); c.arc(40, tip - 4, 4.6, 0.4 * Math.PI, 1.9 * Math.PI); c.arc(41.8, tip - 5, 3.8, 1.9 * Math.PI, 0.4 * Math.PI, true); c.closePath();
  c.fillStyle = MOON; c.fill(); ink(c, P, 1);
  glowAt(c, 40, tip - 4, 10, 'rgba(235,240,170,0.5)');
  flag(c, P, 25, 70, 8, SILVER, { dir: -1 });
});

// ---------------------------------------------------------------- DWARVEN
const DW = (id, name, aspect, scale, draw) => mk(id, name, 'dwarf', 'Dwarven Holds', aspect, scale, 37, draw);
const DSTONE = (P) => tone(P, '#8c8070', 0.5);
const ROCK = '#8b7f72';
function runeBand(c, P, x, y, w) { c.save(); c.strokeStyle = GOLD; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i < w / 3; i++) { c.moveTo(x + i * 3, y); c.lineTo(x + i * 3 + 1.2, y + 2.2); c.moveTo(x + i * 3 + 1.2, y); c.lineTo(x + i * 3, y + 2.2); } c.stroke(); c.restore(); }
function pillar(c, P, x, by, w, h, S) {
  body(c, P, x, by - h, w, h, { S, cyl: true, tex: 0.12 });
  c.fillStyle = S.hi; c.fillRect(x - 1.2, by - h - 2, w + 2.4, 2.4); c.fillRect(x - 1.2, by - 2.2, w + 2.4, 2.2);
  c.beginPath(); c.rect(x - 1.2, by - h - 2, w + 2.4, 2.4); ink(c, P, 1); c.beginPath(); c.rect(x - 1.2, by - 2.2, w + 2.4, 2.2); ink(c, P, 1);
}

const dwarfMountain = DW('dwarf_mountain_hold', 'Dwarven Mountain Hold', 1.2, 1.4, (c, P, W, H, r) => {
  const D = DSTONE(P);
  shadow(c, 66, 92, 52, 5);
  mount(c, P, 2, 90, 66, 76, ROCK, r, { apex: 0.5, snow: true });
  mount(c, P, 62, 90, 56, 60, '#7d7468', r, { apex: 0.45, snow: true });
  mount(c, P, 28, 90, 66, 50, '#94887a', r, { apex: 0.5 });
  // carved facade
  body(c, D, 40, 54, 40, 36, { rnd: r, S: D, bh: 5, bw: 8 });
  merl(c, D, 40, 54, 40, { n: 8, S: D });
  pillar(c, P, 43, 90, 6, 30, D); pillar(c, P, 71, 90, 6, 30, D);
  runeBand(c, P, 50, 58, 20);
  gate(c, P, 60, 90, 16, 28, { glow: '#e0702a', port: false });
  glowAt(c, 60, 82, 16, 'rgba(255,150,60,0.45)');
  // stairs
  for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? D.lit : D.mid; c.fillRect(48 - i * 2, 90 + i * 1.6 - 1.6, 24 + i * 4, 1.8); }
  // top towers on the mountain shoulder
  tower(c, D, 46, 54, 9, 14, { S: D, rnd: r, slits: 0, n: 3 }); tower(c, D, 74, 54, 9, 14, { S: D, rnd: r, slits: 0, n: 3 });
  flag(c, P, 46, 37, 10, RED, { dot: GOLD }); flag(c, P, 74, 37, 10, RED, { dot: GOLD });
  // chimney smoke from the peak
  smoke(c, 56, 38, 2.2, 3);
});

const dwarfForge = DW('dwarf_forge_hold', 'Dwarven Forge Hold', 1.1, 1.3, (c, P, W, H, r) => {
  const D = DSTONE(P);
  shadow(c, 56, 92, 46, 5);
  mount(c, P, 0, 88, 60, 44, '#85796c', r, { apex: 0.6 });
  mount(c, P, 52, 88, 56, 38, '#7a7064', r, { apex: 0.4 });
  // chimneys
  [[30, 60], [80, 56]].forEach(([x, y]) => { body(c, D, x - 4, y - 24, 8, 30, { S: D, cyl: true, tex: 0.15 }); c.fillStyle = D.dd; c.fillRect(x - 5.2, y - 27, 10.4, 4); c.beginPath(); c.rect(x - 5.2, y - 27, 10.4, 4); ink(c, P, 1.2); glowAt(c, x, y - 26, 6, 'rgba(255,120,40,0.5)'); smoke(c, x, y - 32, 3.2, 4); });
  // squat hall with domed forge-roofs
  body(c, D, 24, 56, 64, 34, { rnd: r, S: D, bh: 5, bw: 8 });
  merl(c, D, 24, 56, 64, { n: 10, S: D });
  tower(c, D, 24, 90, 18, 46, { S: D, rnd: r, slits: 0, dome: '#7a5a3c' });
  tower(c, D, 88, 90, 18, 46, { S: D, rnd: r, slits: 0, dome: '#7a5a3c' });
  [38, 78].forEach((x) => { c.fillStyle = '#ff9a3c'; c.fillRect(x - 2.5, 64, 5, 5); c.beginPath(); c.rect(x - 2.5, 64, 5, 5); ink(c, P, 0.9); glowAt(c, x, 66.5, 7, 'rgba(255,140,50,0.45)'); });
  gate(c, P, 58, 90, 14, 22, { glow: '#d9622a' }); glowAt(c, 58, 84, 13, 'rgba(255,140,50,0.4)');
  // anvil banner
  c.fillStyle = RED; c.fillRect(40, 58, 7, 12); poly(c, P, [[40, 70], [43.5, 66.5], [47, 70]], RED, 0.7);
  c.fillStyle = GOLD; c.fillRect(41.2, 62, 4.6, 1.6); c.fillRect(42.4, 63.4, 2.2, 2.2);
});

const dwarfGate = DW('dwarf_gate_hold', 'Dwarven Gate of Kings', 1.1, 1.3, (c, P, W, H, r) => {
  const D = DSTONE(P);
  shadow(c, 56, 92, 44, 5);
  mount(c, P, 0, 90, 112, 72, ROCK, r, { apex: 0.5 });
  body(c, D, 22, 50, 66, 40, { rnd: r, S: D, bh: 5, bw: 9 });
  // great doors
  gate(c, P, 55, 90, 24, 36, { glow: '#2a1a14' });
  c.save(); c.beginPath(); c.moveTo(43, 90); c.lineTo(43, 66); c.arc(55, 66, 12, Math.PI, 0); c.lineTo(67, 90); c.closePath(); c.clip();
  c.fillStyle = hgrad(c, 43, 24, [[0, '#8b6a45'], [0.5, '#6a4a2e'], [1, '#3e2a1c']]); c.fillRect(43, 52, 24, 40);
  c.strokeStyle = GOLD; c.lineWidth = 1; c.strokeRect(46, 66, 8, 22); c.strokeRect(56, 66, 8, 22); c.beginPath(); c.moveTo(55, 52); c.lineTo(55, 90); c.stroke();
  c.restore(); c.beginPath(); c.moveTo(43, 90); c.lineTo(43, 66); c.arc(55, 66, 12, Math.PI, 0); c.lineTo(67, 90); ink(c, P, 1.5);
  runeBand(c, P, 44, 53, 22);
  // statues of kings flanking the gate
  [[30, 1], [80, -1]].forEach(([x, d]) => {
    pillar(c, P, x - 5, 90, 10, 6, D);
    body(c, D, x - 4.5, 52, 9, 34, { S: D, cyl: true, tex: 0.08 });
    c.beginPath(); c.arc(x, 48, 5, 0, TAU); c.fillStyle = D.lit; c.fill(); ink(c, P, 1.2);
    c.fillStyle = D.mid; c.beginPath(); c.moveTo(x - 4.6, 49); c.lineTo(x, 61); c.lineTo(x + 4.6, 49); c.closePath(); c.fill(); ink(c, P, 0.9);
    c.beginPath(); c.moveTo(x - 5, 46); c.lineTo(x, 38); c.lineTo(x + 5, 46); c.closePath(); c.fillStyle = GOLD; c.fill(); ink(c, P, 1);
    c.fillStyle = D.dd; c.fillRect(x + d * 7, 56, 2, 26); c.fillRect(x + d * 5.5, 56, 5, 4);
  });
  // braziers
  [43, 67].forEach((x) => { c.fillStyle = D.dd; c.fillRect(x - 1.6, 84, 3.2, 6); poly(c, P, [[x - 3, 84], [x + 3, 84], [x + 1.6, 81], [x - 1.6, 81]], D.dk, 0.8); glowAt(c, x, 80, 6, 'rgba(255,150,50,0.6)'); c.beginPath(); c.moveTo(x - 1.6, 81); c.quadraticCurveTo(x, 74, x + 1.6, 81); c.fillStyle = ORANGE; c.fill(); });
  flag(c, P, 55, 50, 12, RED, { dot: GOLD });
});

// ---------------------------------------------------------------- ORC / GOBLIN
const ORC = (id, name, aspect, scale, draw) => mk(id, name, 'orc', 'Orc & Goblin Strongholds', aspect, scale, 53, draw);
const BONE = '#e3dcc6', IRON = '#454049';
function skull(c, P, x, y, s) {
  c.beginPath(); c.ellipse(x, y, s, s * 0.9, 0, 0, TAU); c.fillStyle = BONE; c.fill(); ink(c, P, 0.8);
  c.fillStyle = VOID; c.beginPath(); c.arc(x - s * 0.38, y - s * 0.05, s * 0.26, 0, TAU); c.arc(x + s * 0.38, y - s * 0.05, s * 0.26, 0, TAU); c.fill();
  c.fillRect(x - s * 0.1, y + s * 0.3, s * 0.2, s * 0.35);
}
function spikes(c, P, x0, x1, y, n, h, col = IRON) {
  const st = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const x = x0 + i * st; poly(c, P, [[x + 0.3, y], [x + st / 2, y - h], [x + st - 0.3, y]], col, 0.9); }
}
function palisade(c, P, x0, x1, by, h, r, o = {}) {
  const n = Math.round((x1 - x0) / 5), st = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * st, hh = h * (0.88 + r() * 0.24), w = st * 1.02;
    c.beginPath(); c.moveTo(x, by); c.lineTo(x, by - hh + 4); c.lineTo(x + w / 2, by - hh - (o.pt ?? 3)); c.lineTo(x + w, by - hh + 4); c.lineTo(x + w, by); c.closePath();
    c.fillStyle = hgrad(c, x, w, [[0, '#a07048'], [0.5, '#7b5232'], [1, '#4b301f']]); c.fill(); ink(c, P, 1);
  }
  c.strokeStyle = '#d8c9a4'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0, by - h * 0.55); c.lineTo(x1, by - h * 0.5); c.stroke();
}
function hideTent(c, P, cx, by, w, h, col) {
  poly(c, P, [[cx - w / 2, by], [cx, by - h], [cx + w / 2, by]], col, 1.3);
  c.beginPath(); c.moveTo(cx, by - h); c.lineTo(cx + w / 2, by); c.lineTo(cx + w * 0.1, by); c.closePath(); c.fillStyle = dk(col, 0.3); c.fill();
  c.beginPath(); c.moveTo(cx - w * 0.1, by); c.lineTo(cx, by - h * 0.5); c.lineTo(cx + w * 0.1, by); c.closePath(); c.fillStyle = VOID; c.fill();
  c.beginPath(); c.moveTo(cx - w / 2, by); c.lineTo(cx, by - h); c.lineTo(cx + w / 2, by); ink(c, P, 1.3);
  c.beginPath(); c.moveTo(cx, by - h); c.lineTo(cx - 1.5, by - h - 4); c.moveTo(cx, by - h); c.lineTo(cx + 1.5, by - h - 4); c.strokeStyle = BONE; c.lineWidth = 1.2; c.stroke();
}
function fire(c, x, by, s) {
  glowAt(c, x, by - s * 0.5, s * 2.2, 'rgba(255,140,40,0.45)');
  c.fillStyle = '#4b301f'; c.fillRect(x - s * 0.7, by - 1, s * 1.4, 2);
  c.beginPath(); c.moveTo(x - s * 0.55, by); c.quadraticCurveTo(x - s * 0.7, by - s, x, by - s * 1.5); c.quadraticCurveTo(x + s * 0.7, by - s, x + s * 0.55, by); c.closePath(); c.fillStyle = ORANGE; c.fill();
  c.beginPath(); c.moveTo(x - s * 0.25, by); c.quadraticCurveTo(x - s * 0.3, by - s * 0.5, x, by - s * 0.8); c.quadraticCurveTo(x + s * 0.3, by - s * 0.5, x + s * 0.25, by); c.fillStyle = '#ffe08a'; c.fill();
}
function totem(c, P, x, by, h, w = 7) {
  body(c, P, x - w / 2, by - h, w, h, { S: { hi: '#a37a50', lit: '#8c6540', mid: '#6e4b2e', dk: '#4b301f', dd: '#33200f' }, cyl: true, tex: 0 });
  for (let i = 0; i < 3; i++) skull(c, P, x, by - h + 7 + i * 11, 3.4);
  poly(c, P, [[x - w, by - h + 3], [x - w / 2, by - h + 1], [x - w / 2, by - h + 6]], BONE, 0.9);
  poly(c, P, [[x + w, by - h + 3], [x + w / 2, by - h + 1], [x + w / 2, by - h + 6]], BONE, 0.9);
  poly(c, P, [[x - 2.5, by - h], [x, by - h - 6], [x + 2.5, by - h]], IRON, 0.9);
}

const orcWarcamp = ORC('orc_warcamp', 'Orc Warcamp', 1.2, 1.3, (c, P, W, H, r) => {
  shadow(c, 66, 91, 52, 6);
  c.beginPath(); c.ellipse(60, 84, 52, 9, 0, 0, TAU); c.fillStyle = 'rgba(120,85,50,0.35)'; c.fill();
  // back palisade
  palisade(c, P, 12, 108, 72, 26, r);
  // tents + totem + fire inside
  hideTent(c, P, 36, 85, 26, 26, '#7d6a55'); hideTent(c, P, 90, 85, 26, 26, '#8a6a4a'); hideTent(c, P, 50, 77, 16, 15, '#6c5a4a');
  totem(c, P, 62, 84, 40);
  fire(c, 74, 88, 6);
  // front gate with two log towers
  [[14, 1], [106, -1]].forEach(([x, d]) => {
    body(c, P, x - 7, 52, 14, 38, { S: { hi: '#b78556', lit: '#9a6c42', mid: '#7b5232', dk: '#4b301f', dd: '#33200f' }, tex: 0, cyl: true });
    c.strokeStyle = P.ink; c.globalAlpha = 0.5; c.lineWidth = 0.7; c.beginPath(); for (let y = 58; y < 90; y += 5) { c.moveTo(x - 7, y); c.lineTo(x + 7, y); } c.stroke(); c.globalAlpha = 1;
    c.fillStyle = '#6a4528'; c.fillRect(x - 9, 48, 18, 5); c.beginPath(); c.rect(x - 9, 48, 18, 5); ink(c, P, 1.2);
    spikes(c, P, x - 9, x + 9, 48, 4, 6, '#6b5a48');
    flag(c, P, x, 42, 12, RED, { dir: d, swallow: true, dot: BONE });
  });
  palisade(c, P, 22, 28, 91, 10, r); palisade(c, P, 98, 104, 91, 10, r);
  body(c, P, 45, 70, 30, 6, { S: { hi: '#a98055', lit: '#8c6540', mid: '#6e4b2e', dk: '#4b301f', dd: '#33200f' }, tex: 0 });
  skull(c, P, 60, 73, 3.4);
  tufts(c, P, r, 8, 112, 92, 8, '#5d6b3a');
  smoke(c, 74, 78, 2.2, 3, 'rgba(70,60,60,0.45)');
});

const orcGoblin = ORC('goblin_fort', 'Goblin Scrap Fort', 1.0, 1.2, (c, P, W, H, r) => {
  shadow(c, 54, 91, 38, 5);
  const plank = { hi: '#a8845a', lit: '#8f6b44', mid: '#755433', dk: '#4c3320', dd: '#33200f' };
  // stilts
  [[30, 92], [46, 92], [64, 92], [78, 92]].forEach(([x, y]) => { c.fillStyle = '#5a3d26'; c.fillRect(x - 1.5, 62, 3, y - 62); c.beginPath(); c.rect(x - 1.5, 62, 3, y - 62); ink(c, P, 0.9); });
  c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(30, 90); c.lineTo(46, 70); c.moveTo(78, 90); c.lineTo(64, 70); c.stroke();
  // lopsided tiers
  body(c, P, 24, 46, 56, 18, { S: plank, tex: 0 });
  c.save(); c.strokeStyle = P.ink; c.globalAlpha = 0.4; c.lineWidth = 0.8; c.beginPath(); for (let x = 29; x < 80; x += 5.5) { c.moveTo(x, 46); c.lineTo(x + (r() - 0.5) * 2, 64); } c.stroke(); c.restore();
  body(c, P, 34, 28, 30, 20, { S: plank, tex: 0 });
  poly(c, P, [[28, 28], [49, 12], [70, 28], [64, 30], [34, 30]], '#6b7d4a', 1.4);
  poly(c, P, [[49, 12], [70, 28], [64, 30], [49, 22]], '#4d5c34', 0.8);
  // crooked scrap tower
  body(c, P, 62, 34, 14, 14, { S: plank, tex: 0 }); poly(c, P, [[60, 34], [69, 22], [78, 34]], '#7f7f86', 1.3);
  // windows glow + skulls
  [[40, 56], [60, 56]].forEach(([x, y]) => { c.fillStyle = GLOW; c.fillRect(x - 2, y - 2, 4, 4); c.strokeStyle = P.ink; c.lineWidth = 0.9; c.strokeRect(x - 2, y - 2, 4, 4); glowAt(c, x, y, 6, 'rgba(255,200,80,0.4)'); });
  slit(c, P, 44, 34, 3, 6, GLOW); slit(c, P, 56, 34, 3, 6, GLOW);
  skull(c, P, 49, 20, 2.6);
  // platform railing spikes + ladder
  spikes(c, P, 22, 82, 46, 12, 5, '#6b5a48');
  c.strokeStyle = '#6a4528'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(70, 64); c.lineTo(76, 92); c.moveTo(75, 64); c.lineTo(81, 92); for (let y = 68; y < 92; y += 4) { c.moveTo(70 + (y - 64) * 0.21, y); c.lineTo(75 + (y - 64) * 0.21, y); } c.stroke();
  // sharpened stakes ring
  for (let x = 12; x < 96; x += 6) { poly(c, P, [[x, 92], [x + 1, 84 - r() * 3], [x + 2, 92]], '#8c6540', 0.8); }
  flag(c, P, 49, 12, 11, '#5a8a3a', { dot: BONE });
  flag(c, P, 25, 46, 9, '#5a8a3a', { dir: -1, swallow: true });
});

const orcFortress = ORC('orc_fortress', 'Orc Iron Fortress', 1.2, 1.4, (c, P, W, H, r) => {
  const O = tone(P, '#5a4a4c', 0.55);
  shadow(c, 66, 91, 52, 6);
  // rear keep with horned crown
  body(c, O, 44, 24, 32, 52, { rnd: r, S: O }); spikes(c, P, 42, 78, 24, 8, 9);
  c.fillStyle = '#ff6a2a'; [52, 60, 68].forEach((x) => { c.fillRect(x - 1.2, 38, 2.4, 6); }); glowAt(c, 60, 41, 18, 'rgba(255,100,40,0.25)');
  flag(c, P, 60, 16, 14, RED, { dot: BONE, swallow: true });
  // walls
  wall(c, O, 14, 106, 88, 26, { rnd: r, S: O, n: 14 }); spikes(c, P, 14, 106, 62 - 5, 22, 5);
  // flank towers
  [[20, 1], [100, -1]].forEach(([x, d]) => {
    tower(c, O, x, 90, 18, 60, { S: O, rnd: r, slits: 2, glow: '#ff7a30', n: 4 }); spikes(c, P, x - 10, x + 10, 30 - 3, 5, 9);
    flag(c, P, x, 24, 10, RED, { dir: d, swallow: true });
  });
  // jaw-gate
  body(c, O, 44, 54, 32, 36, { rnd: r, S: O }); spikes(c, P, 43, 77, 54 - 5, 6, 7);
  gate(c, P, 60, 90, 18, 26, { glow: '#2a0e0a', port: true, portCol: '#6a5a58' });
  for (let i = 0; i < 5; i++) { const x = 52 + i * 4; poly(c, P, [[x - 1.6, 64], [x, 69], [x + 1.6, 64]], BONE, 0.7); }
  skull(c, P, 60, 58, 3.6);
  skull(c, P, 32, 72, 2.6); skull(c, P, 88, 72, 2.6); skull(c, P, 36, 80, 2.2); skull(c, P, 84, 80, 2.2);
  [52, 68].forEach((x) => { c.fillStyle = IRON; c.fillRect(x - 0.8, 88, 1.6, 4); glowAt(c, x, 86, 6, 'rgba(255,130,40,0.5)'); });
});

const orcBone = ORC('orc_bone_totem', 'Bone Totem Stronghold', 1.0, 1.3, (c, P, W, H, r) => {
  shadow(c, 52, 91, 40, 6);
  c.beginPath(); c.ellipse(50, 86, 42, 8, 0, 0, TAU); c.fillStyle = 'rgba(110,80,60,0.3)'; c.fill();
  // tusk ring (back)
  for (let x = 12; x < 90; x += 7) { const hh = 14 + r() * 8; poly(c, P, [[x, 78], [x + 2.5 + (x < 50 ? 1.5 : -1.5), 78 - hh], [x + 5, 78]], BONE, 1); }
  // rib-cage gate
  c.strokeStyle = P.ink; c.lineWidth = 4.4; c.beginPath(); c.moveTo(30, 90); c.bezierCurveTo(28, 52, 72, 52, 70, 90); c.stroke();
  c.strokeStyle = BONE; c.lineWidth = 2.6; c.beginPath(); c.moveTo(30, 90); c.bezierCurveTo(28, 52, 72, 52, 70, 90); c.stroke();
  c.lineWidth = 1.8; c.beginPath(); [34, 40].forEach((x, i) => { c.moveTo(x - 4 + i, 84 - i * 7); c.quadraticCurveTo(x + 2, 60 + i * 4, 50, 56 + i * 6); }); c.stroke();
  c.fillStyle = 'rgba(21,15,29,0.7)'; c.beginPath(); c.moveTo(34, 90); c.bezierCurveTo(33, 62, 67, 62, 66, 90); c.closePath(); c.fill();
  // central totem
  totem(c, P, 50, 76, 58, 9);
  poly(c, P, [[43, 15], [36, 5], [47, 11]], BONE, 0.9); poly(c, P, [[57, 15], [64, 5], [53, 11]], BONE, 0.9); skull(c, P, 50, 14, 5.4);
  glowAt(c, 50, 14, 10, 'rgba(255,90,60,0.45)');
  [[16, -1], [84, 1]].forEach(([x, d]) => { totem(c, P, x, 86, 30, 5); flag(c, P, x, 56, 9, RED, { dir: -d, swallow: true }); });
  fire(c, 40, 92, 4.5); fire(c, 62, 92, 4.5);
  tufts(c, P, r, 6, 92, 92, 6, '#5d6b3a');
});


// ---------------------------------------------------------------- DARK / DROW / TIEFLING
const DARK = (id, name, aspect, scale, draw) => mk(id, name, 'dark', 'Dark Towers & Spires', aspect, scale, 71, draw);
const NSTONE = (P) => tone(P, '#2b2838', 0.72);
const NECRO = '#7cff8a', INFERNAL = '#ff5a2a', DROW = '#b06cff';
function fang(c, P, x, by, w, h, lean, S, o = {}) {
  const tx = x + lean;
  c.beginPath(); c.moveTo(x - w / 2, by); c.quadraticCurveTo(x - w / 2 + lean * 0.2, by - h * 0.6, tx, by - h); c.quadraticCurveTo(x + w / 2 + lean * 0.5, by - h * 0.55, x + w / 2, by); c.closePath();
  c.fillStyle = hgrad(c, x - w / 2, w, [[0, S.hi], [0.3, S.lit], [0.6, S.mid], [1, S.dd]]); c.fill();
  c.save(); c.clip(); c.strokeStyle = P.ink; c.globalAlpha = 0.25; c.lineWidth = 0.5; c.beginPath();
  for (let y = by - 4; y > by - h; y -= 4.2) { c.moveTo(x - w, y); c.lineTo(x + w, y - 1.2); } c.stroke(); c.restore();
  c.beginPath(); c.moveTo(x - w / 2, by); c.quadraticCurveTo(x - w / 2 + lean * 0.2, by - h * 0.6, tx, by - h); c.quadraticCurveTo(x + w / 2 + lean * 0.5, by - h * 0.55, x + w / 2, by); ink(c, P);
  if (o.glow) for (let i = 0; i < (o.win || 2); i++) { const t = 0.2 + i * 0.22; slit(c, P, x + lean * t * 0.45, by - h * t - 6, Math.max(1.4, w * 0.14), 5, o.glow); }
}
function bat(c, P, x, y, s) {
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 0.5, y - s * 0.8, x - s, y - s * 0.2); c.quadraticCurveTo(x - s * 0.55, y - s * 0.05, x - s * 0.35, y + s * 0.2); c.lineTo(x, y + s * 0.05);
  c.lineTo(x + s * 0.35, y + s * 0.2); c.quadraticCurveTo(x + s * 0.55, y - s * 0.05, x + s, y - s * 0.2); c.quadraticCurveTo(x + s * 0.5, y - s * 0.8, x, y); c.closePath(); c.fillStyle = '#1c1428'; c.fill(); ink(c, P, 0.6);
}
function deadTree(c, P, x, by, s) {
  c.strokeStyle = '#2b2230'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath();
  c.moveTo(x, by); c.quadraticCurveTo(x - s * 0.1, by - s * 0.5, x + s * 0.05, by - s); c.moveTo(x - s * 0.05, by - s * 0.5); c.lineTo(x - s * 0.35, by - s * 0.8); c.moveTo(x, by - s * 0.65); c.lineTo(x + s * 0.3, by - s * 0.95); c.stroke();
}

const darkNecro = DARK('dark_necro_tower', 'Necromancer Tower', 0.85, 1.2, (c, P, W, H, r) => {
  const N = NSTONE(P);
  shadow(c, 46, 92, 34, 5, 0.38);
  glowAt(c, 42, 90, 34, 'rgba(110,255,140,0.22)');
  deadTree(c, P, 12, 92, 24); deadTree(c, P, 74, 92, 20);
  // jagged tower, stacked & leaning slightly wider at the crown
  body(c, N, 30, 40, 26, 50, { S: N, rnd: r, cyl: true });
  c.beginPath(); c.moveTo(26, 40); c.lineTo(60, 40); c.lineTo(57, 30); c.lineTo(29, 30); c.closePath(); c.fillStyle = hgrad(c, 26, 34, stops(N, true)); c.fill(); ink(c, P);
  // spike crown
  [[28, 30, 25, 8], [36, 30, 34, 12], [44, 30, 46, 7], [52, 30, 58, 14], [58, 30, 62, 6]].forEach(([x0, y0, x1, h]) => poly(c, P, [[x0 - 1, y0], [x1 - 1 + 1, y0 - h], [x0 + 5, y0]], N.mid, 1.1));
  fang(c, P, 43, 30, 12, 30, -3, N);
  slit(c, P, 43, 15, 3, 8, NECRO); glowAt(c, 43, 19, 9, 'rgba(110,255,140,0.5)');
  slit(c, P, 43, 46, 3, 8, NECRO); slit(c, P, 43, 62, 3, 8, NECRO);
  // skull door
  gate(c, P, 43, 90, 9, 14, { glow: '#0e1a10' }); skull(c, P, 43, 70, 3.2);
  // balcony ring
  c.fillStyle = N.dk; c.fillRect(25, 38, 36, 3); c.beginPath(); c.rect(25, 38, 36, 3); ink(c, P, 1.1);
  // fence + graves
  c.strokeStyle = '#2b2230'; c.lineWidth = 1.1; c.beginPath(); for (let x = 54; x < 80; x += 4) { c.moveTo(x, 92); c.lineTo(x, 84); c.moveTo(x - 1, 85); c.lineTo(x, 82); c.lineTo(x + 1, 85); } c.moveTo(54, 87); c.lineTo(78, 87); c.stroke();
  [[18, 92], [64, 92]].forEach(([x, y]) => { poly(c, P, [[x - 3, y], [x - 3, y - 6], [x, y - 8], [x + 3, y - 6], [x + 3, y]], '#9a96a8', 0.9); });
  bat(c, P, 72, 22, 5); bat(c, P, 14, 30, 4); bat(c, P, 64, 12, 3.4);
  smoke(c, 32, 18, 1.6, 0);
});

const darkCitadel = DARK('dark_citadel', 'Dark Citadel', 1.2, 1.4, (c, P, W, H, r) => {
  const N = NSTONE(P);
  shadow(c, 62, 92, 50, 6, 0.4);
  glowAt(c, 60, 86, 56, 'rgba(255,60,60,0.12)');
  // spires (back to front)
  [[38, 60, 8, 62, -2], [82, 60, 8, 62, 2], [60, 62, 12, 78, 0]].forEach(([x, by, w, h, l]) => fang(c, P, x, by + 12, w, h, l, N, { glow: '#ff5a5a', win: 2 }));
  body(c, N, 22, 60, 76, 30, { S: N, rnd: r });
  merl(c, N, 22, 60, 76, { S: N, n: 14 });
  [[22, 18], [98, 18]].forEach(([x, w]) => { tower(c, N, x, 90, w, 54, { S: N, rnd: r, slits: 2, glow: '#ff5a5a', roof: '#3a2a4c', rh: 28, cv: 4 }); });
  [[40, 11], [80, 11]].forEach(([x, w]) => { tower(c, N, x, 90, w, 44, { S: N, rnd: r, slits: 1, glow: '#ff5a5a', roof: '#45305a', rh: 20, cv: 3 }); });
  // rose window + gate
  c.beginPath(); c.arc(60, 68, 5, 0, TAU); c.fillStyle = '#ff6a4a'; c.fill(); ink(c, P, 1.3); glowAt(c, 60, 68, 12, 'rgba(255,90,60,0.4)');
  gate(c, P, 60, 90, 14, 20, { glow: '#2a0a10', port: true, portCol: '#59495a' });
  // flying buttresses
  c.strokeStyle = P.ink; c.lineWidth = 1.3; c.beginPath(); c.moveTo(30, 72); c.quadraticCurveTo(36, 62, 46, 66); c.moveTo(90, 72); c.quadraticCurveTo(84, 62, 74, 66); c.stroke();
  flag(c, P, 22, 28, 9, '#5a1a30'); flag(c, P, 98, 28, 9, '#5a1a30', { dir: -1 });
});

const drowSpire = DARK('drow_spire', 'Drow Spire', 0.95, 1.3, (c, P, W, H, r) => {
  const N = tone(P, '#6a5894', 0.78);
  shadow(c, 48, 92, 36, 5, 0.4);
  glowAt(c, 48, 86, 40, 'rgba(180,100,255,0.2)');
  poly(c, P, [[6, 92], [12, 82], [26, 84], [38, 80], [58, 82], [74, 80], [88, 90], [90, 92]], '#7a6a98', 1.8);
  fang(c, P, 22, 84, 12, 34, -4, N, { glow: DROW });
  fang(c, P, 76, 84, 12, 40, 4, N, { glow: DROW });
  fang(c, P, 36, 84, 14, 50, 3, N, { glow: DROW, win: 2 });
  fang(c, P, 62, 84, 14, 56, -3, N, { glow: DROW, win: 3 });
  fang(c, P, 49, 86, 16, 86, 0, N, { glow: DROW, win: 5 });
  c.save(); c.strokeStyle = 'rgba(245,240,255,0.85)'; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(22, 56); c.quadraticCurveTo(30, 66, 36, 50); c.moveTo(62, 46); c.quadraticCurveTo(70, 56, 76, 46); c.moveTo(60, 74); c.quadraticCurveTo(50, 80, 38, 70); c.stroke();
  c.beginPath(); c.moveTo(76, 84); c.lineTo(92, 56); c.moveTo(86, 84); c.lineTo(92, 56); c.moveTo(80, 76); c.quadraticCurveTo(88, 74, 91, 66); c.stroke(); c.restore();
  gate(c, P, 49, 86, 11, 15, { glow: '#2a103f' }); glowAt(c, 49, 81, 11, 'rgba(180,100,255,0.5)');
  c.fillStyle = '#16101e'; c.beginPath(); c.arc(49, 4, 2.2, 0, TAU); c.fill(); c.strokeStyle = '#16101e'; c.lineWidth = 0.9; c.beginPath();
  for (let i = -2; i <= 2; i++) { if (!i) continue; c.moveTo(49, 4); c.lineTo(49 + i * 3.2, 1 + Math.abs(i) * 0.6); c.moveTo(49, 4); c.lineTo(49 + i * 3.0, 8 - Math.abs(i) * 0.4); } c.stroke();
  [[14, 91], [82, 92], [30, 92]].forEach(([x, y]) => { c.fillStyle = '#d8b8ff'; c.beginPath(); c.arc(x, y - 3, 3, Math.PI, 0); c.fill(); ink(c, P, 0.7); glowAt(c, x, y - 3, 6, 'rgba(200,140,255,0.4)'); });
});

const tieflingKeep = DARK('tiefling_keep', 'Tiefling Infernal Keep', 1.1, 1.3, (c, P, W, H, r) => {
  const T = tone(P, '#6a2a2c', 0.62);
  shadow(c, 58, 92, 46, 5, 0.4);
  // lava moat
  c.save(); c.translate(55, 91); c.scale(1, 0.1); const lg = c.createRadialGradient(0, 0, 0, 0, 0, 40); lg.addColorStop(0, 'rgba(255,170,60,0.85)'); lg.addColorStop(0.55, 'rgba(232,80,30,0.6)'); lg.addColorStop(1, 'rgba(232,80,30,0)'); c.fillStyle = lg; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill(); c.restore();
  glowAt(c, 55, 88, 40, 'rgba(255,90,40,0.18)');
  const horn = (x, y, d, s) => { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + d * s * 0.6, y - s * 0.2, x + d * s * 0.8, y - s * 0.8, x + d * s * 0.4, y - s * 1.3); c.bezierCurveTo(x + d * s * 0.45, y - s * 0.8, x + d * s * 0.2, y - s * 0.5, x - d * s * 0.2, y - s * 0.2); c.closePath(); c.fillStyle = '#2a1a1c'; c.fill(); ink(c, P, 1.1); };
  // central keep with horns
  body(c, T, 38, 36, 34, 52, { S: T, rnd: r }); merl(c, T, 38, 36, 34, { S: T, n: 6 });
  horn(40, 33, -1, 20); horn(70, 33, 1, 20);
  c.beginPath(); c.moveTo(48, 36); c.lineTo(55, 18); c.lineTo(62, 36); c.fillStyle = T.dd; c.fill(); ink(c, P, 1.4);
  slit(c, P, 55, 24, 2.6, 8, '#ffb040');
  [46, 64].forEach((x) => slit(c, P, x, 46, 2.4, 8, '#ff7a30'));
  // flank towers topped with braziers
  [[24, 1], [88, -1]].forEach(([x, d]) => {
    tower(c, T, x, 88, 16, 46, { S: T, rnd: r, slits: 1, glow: '#ff7a30', roof: '#3a1a22', rh: 24, cv: 4, ov: 0 });
    horn(x - d * 7, 50, -d, 12); horn(x + d * 7, 50, d, 12);
  });
  [[24], [88]].forEach(([x]) => { glowAt(c, x, 34, 8, 'rgba(255,100,40,0.5)'); });
  gate(c, P, 55, 88, 14, 20, { glow: '#ff6a2a' });
  glowAt(c, 55, 80, 14, 'rgba(255,120,40,0.45)');
  poly(c, P, [[49, 66], [55, 72], [61, 66]], '#2a1a1c', 1);
  [43, 67].forEach((x) => { c.fillStyle = '#2a1a1c'; c.fillRect(x - 1, 82, 2, 6); c.beginPath(); c.moveTo(x - 2.5, 82); c.lineTo(x + 2.5, 82); c.lineTo(x, 77); c.closePath(); c.fillStyle = ORANGE; c.fill(); });
});

// ---------------------------------------------------------------- DRAGON
const DRG = (id, name, aspect, scale, draw) => mk(id, name, 'dragon', 'Dragon Lairs & Temples', aspect, scale, 89, draw);
function dragon(c, P, x, y, s, col, d = 1) {
  // perched dragon silhouette: x,y = feet position
  c.save(); c.translate(x, y); c.scale(d * s, s);
  const dkc = dk(col, 0.45);
  // tail
  c.beginPath(); c.moveTo(-6, -4); c.bezierCurveTo(-16, -2, -20, -10, -26, -6); c.lineTo(-24, -4); c.bezierCurveTo(-18, -6, -14, 2, -4, 2); c.closePath(); c.fillStyle = dkc; c.fill(); ink(c, P, 0.8 / s);
  // far wing
  c.beginPath(); c.moveTo(0, -12); c.lineTo(-10, -34); c.quadraticCurveTo(-2, -26, 2, -30); c.quadraticCurveTo(8, -22, 10, -26); c.quadraticCurveTo(10, -18, 6, -10); c.closePath(); c.fillStyle = dkc; c.fill(); ink(c, P, 0.8 / s);
  // body
  c.beginPath(); c.ellipse(0, -6, 10, 6.5, -0.2, 0, TAU); c.fillStyle = col; c.fill(); ink(c, P, 0.9 / s);
  // neck + head
  c.beginPath(); c.moveTo(6, -8); c.bezierCurveTo(10, -14, 8, -20, 12, -24); c.lineTo(20, -23); c.lineTo(22, -20); c.lineTo(14, -18); c.bezierCurveTo(14, -12, 14, -8, 10, -3); c.closePath(); c.fillStyle = col; c.fill(); ink(c, P, 0.9 / s);
  c.beginPath(); c.moveTo(12, -24); c.lineTo(8, -29); c.lineTo(15, -25); c.fillStyle = BONE; c.fill();
  c.fillStyle = '#ffd36a'; c.fillRect(15.4, -22.8, 1.4, 1.2);
  // near wing
  c.beginPath(); c.moveTo(2, -10); c.lineTo(-4, -32); c.quadraticCurveTo(2, -26, 6, -30); c.quadraticCurveTo(12, -22, 15, -26); c.quadraticCurveTo(14, -16, 8, -8); c.closePath(); c.fillStyle = lt(col, 0.15); c.fill(); ink(c, P, 0.9 / s);
  c.beginPath(); c.moveTo(2, -10); c.lineTo(-4, -32); c.moveTo(2, -10); c.lineTo(6, -30); c.moveTo(4, -9); c.lineTo(15, -26); c.strokeStyle = P.ink; c.lineWidth = 0.6 / s; c.stroke();
  // legs
  c.fillStyle = dkc; c.fillRect(-3, -2, 3, 4); c.fillRect(4, -2, 3, 4);
  c.restore();
}
function coins(c, P, cx, by, w, h, r) {
  c.beginPath(); c.moveTo(cx - w / 2, by); c.quadraticCurveTo(cx - w * 0.25, by - h * 1.1, cx, by - h); c.quadraticCurveTo(cx + w * 0.25, by - h * 1.1, cx + w / 2, by); c.closePath();
  c.fillStyle = hgrad(c, cx - w / 2, w, [[0, '#ffe58a'], [0.5, '#e6b230'], [1, '#a9791a']]); c.fill(); ink(c, P, 1);
  for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(cx + (r() - 0.5) * w * 0.7, by - r() * h * 0.7 - 1, 0.9, 0, TAU); c.fillStyle = '#fff2b0'; c.fill(); }
}

const dragonLair = DRG('dragon_lair', 'Dragon Lair', 1.2, 1.4, (c, P, W, H, r) => {
  shadow(c, 66, 92, 54, 5);
  mount(c, P, 4, 92, 112, 76, '#4a3a3c', r, { apex: 0.5 });
  mount(c, P, 60, 92, 56, 50, '#3a2c30', r, { apex: 0.5 });
  glowAt(c, 56, 24, 22, 'rgba(255,110,40,0.55)');
  c.strokeStyle = '#ff8a2a'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(56, 17); c.lineTo(52, 30); c.lineTo(56, 40); c.lineTo(50, 54); c.moveTo(60, 20); c.lineTo(66, 34); c.lineTo(63, 46); c.moveTo(30, 66); c.lineTo(36, 58); c.moveTo(88, 70); c.lineTo(80, 60); c.stroke();
  // cave mouth
  c.beginPath(); c.moveTo(34, 92); c.quadraticCurveTo(32, 62, 56, 58); c.quadraticCurveTo(80, 62, 78, 92); c.closePath(); c.fillStyle = '#1a0f10'; c.fill(); ink(c, P, 1.8);
  glowAt(c, 56, 84, 26, 'rgba(255,140,40,0.35)');
  coins(c, P, 50, 92, 28, 12, r); coins(c, P, 66, 92, 20, 8, r);
  // fangs in cave mouth
  for (let i = 0; i < 6; i++) { const x = 38 + i * 6.8; poly(c, P, [[x, 61 + Math.abs(i - 2.5) * 1.6], [x + 1.8, 69 + (i % 2) * 2], [x + 3.4, 61 + Math.abs(i - 2.5) * 1.6]], BONE, 0.7); }
  // bones + dragon on peak
  poly(c, P, [[20, 92], [26, 86], [30, 92]], BONE, 0.8); skull(c, P, 24, 90, 2.6);
  dragon(c, P, 56, 24, 0.8, '#d04a30', 1);
  smoke(c, 74, 34, 1.6, 3, 'rgba(70,60,60,0.4)');
});

const dragonTemple = DRG('dragon_temple', 'Dragonborn Temple', 1.1, 1.3, (c, P, W, H, r) => {
  const S = tone(P, '#d9a868', 0.5);
  shadow(c, 56, 92, 46, 5);
  const tiers = [[8, 90, 94, 16], [18, 74, 74, 16], [28, 58, 54, 16]];
  tiers.forEach(([x, by, w, h]) => { body(c, S, x, by - h + 16 - 16 + 0, w, h, { S, rnd: r, tex: 0.12, bh: 5, bw: 8 }); c.fillStyle = S.hi; c.fillRect(x - 1, by - h - 1.4, w + 2, 2.6); c.beginPath(); c.rect(x - 1, by - h - 1.4, w + 2, 2.6); ink(c, P, 1.1); });
  // top shrine
  body(c, S, 38, 28, 34, 16, { S, rnd: r }); poly(c, P, [[35, 28], [55, 14], [75, 28]], '#c0822c', 1.5); poly(c, P, [[55, 14], [75, 28], [55, 28]], '#8a5a1c', 0.8);
  gate(c, P, 55, 44, 9, 12, { glow: '#e0702a' }); glowAt(c, 55, 40, 10, 'rgba(255,150,60,0.5)');
  // stairs + central gate
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? S.lit : S.mid; c.fillRect(46 - i * 0.6, 90 - i * 2.9 - 2.4, 18 + i * 1.2, 2.8); }
  // dragon head gargoyles
  [[20, -1], [90, 1]].forEach(([x, d]) => { poly(c, P, [[x, 74], [x + d * 9, 66], [x + d * 11, 70], [x + d * 6, 73], [x + d * 8, 77], [x, 76]], S.mid, 1.2); poly(c, P, [[x + d * 5, 66], [x + d * 4, 61], [x + d * 8, 66]], BONE, 0.7); });
  // braziers + banners
  [[16, 82], [94, 82], [30, 66], [80, 66]].forEach(([x, y]) => { c.fillStyle = S.dd; c.fillRect(x - 1.4, y, 2.8, 7); poly(c, P, [[x - 3, y], [x + 3, y], [x + 2, y - 3], [x - 2, y - 3]], S.dk, 0.8); glowAt(c, x, y - 4, 6, 'rgba(255,150,50,0.5)'); c.beginPath(); c.moveTo(x - 1.6, y - 3); c.quadraticCurveTo(x, y - 9, x + 1.6, y - 3); c.fillStyle = ORANGE; c.fill(); });
  flag(c, P, 55, 14, 12, '#a82e22', { dot: GOLD });
  // dragon statue atop the shrine ridge
  poly(c, P, [[50, 15], [52, 9], [55, 7], [59, 9], [58, 12], [60, 14]], '#c0822c', 0.9);
});

const dragonRoost = DRG('dragon_roost', 'Dragon Roost Spire', 0.9, 1.3, (c, P, W, H, r) => {
  shadow(c, 46, 92, 36, 5);
  const pts = [[6, 92], [14, 70], [18, 50], [26, 32], [40, 24], [56, 32], [64, 52], [70, 72], [84, 92]];
  poly(c, P, pts, '#b09a8a', 1.8);
  c.save(); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
  c.fillStyle = 'rgba(50,30,40,0.4)'; c.beginPath(); c.moveTo(40, 24); c.lineTo(56, 32); c.lineTo(64, 52); c.lineTo(70, 72); c.lineTo(90, 92); c.lineTo(90, 10); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,245,220,0.3)'; c.beginPath(); c.moveTo(40, 24); c.lineTo(26, 32); c.lineTo(18, 50); c.lineTo(12, 50); c.lineTo(30, 22); c.closePath(); c.fill();
  c.strokeStyle = P.ink; c.globalAlpha = 0.32; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i < 12; i++) { const y = 34 + i * 5; c.moveTo(18 + r() * 8, y); c.lineTo(46 + r() * 10, y + 5); } c.stroke(); c.restore();
  // dark nest
  c.beginPath(); c.ellipse(40, 25, 20, 5, 0, 0, TAU); c.fillStyle = '#4a3220'; c.fill(); ink(c, P, 1.5);
  c.strokeStyle = '#8a6a3a'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 11; i++) { c.moveTo(24 + i * 3.4, 26); c.lineTo(26 + i * 3.4, 21); } c.stroke();
  [[32, 23], [48, 24]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y - 1.6, 2.4, 3.2, 0, 0, TAU); c.fillStyle = '#e8d8a8'; c.fill(); ink(c, P, 0.8); });
  dragon(c, P, 40, 22, 0.95, '#3d8f88', -1);
  c.strokeStyle = '#4b301f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(12, 86); c.lineTo(20, 76); c.lineTo(16, 66); c.lineTo(24, 58); c.lineTo(22, 48); c.stroke();
  for (let i = 0; i < 4; i++) { const x = 12 + i * 16; poly(c, P, [[x, 92], [x + 1.5, 84 - r() * 4], [x + 3, 92]], BONE, 0.7); }
});

// ---------------------------------------------------------------- HALFLING / GNOME
const FOLK = (id, name, aspect, scale, draw) => mk(id, name, 'folk', 'Halfling & Gnome Follies', aspect, scale, 97, draw);
function cog(c, P, x, y, rr, n, col) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU, rad = i % 2 ? rr * 0.8 : rr; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.closePath(); c.fillStyle = col; c.fill(); ink(c, P, 0.9);
  c.beginPath(); c.arc(x, y, rr * 0.3, 0, TAU); c.fillStyle = VOID; c.fill();
}
function flowers(c, r, x0, x1, y, n) {
  const cols = ['#e86a8a', '#f4d35e', '#b58cf0', '#fff'];
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), yy = y + (r() - 0.5) * 3; c.strokeStyle = '#3d7d3a'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, yy + 2); c.lineTo(x, yy); c.stroke(); c.beginPath(); c.arc(x, yy - 0.4, 1.2, 0, TAU); c.fillStyle = cols[i % 4]; c.fill(); }
}

const folkBurrow = FOLK('halfling_burrow_hall', 'Halfling Burrow Hall', 1.1, 1.2, (c, P, W, H, r) => {
  shadow(c, 56, 91, 46, 5);
  // hill mound
  c.beginPath(); c.moveTo(4, 90); c.bezierCurveTo(8, 50, 36, 32, 58, 34); c.bezierCurveTo(82, 36, 104, 56, 106, 90); c.closePath();
  c.fillStyle = hgrad(c, 4, 102, [[0, '#8fc06a'], [0.45, '#6ea852'], [1, '#42793e']]); c.fill(); ink(c, P, 1.8);
  tufts(c, P, r, 14, 96, 54, 16, '#3d7d3a'); tufts(c, P, r, 10, 100, 72, 12, '#3d7d3a');
  // chimney
  c.fillStyle = '#9a7a62'; c.fillRect(76, 32, 6, 10); c.beginPath(); c.rect(76, 32, 6, 10); ink(c, P, 1); smoke(c, 79, 28, 1.8, 4, 'rgba(110,105,110,0.5)');
  // round door
  c.beginPath(); c.arc(54, 76, 13, 0, TAU); c.fillStyle = '#c6483a'; c.fill(); ink(c, P, 2); c.beginPath(); c.arc(54, 76, 10.4, 0, TAU); c.fillStyle = '#d9604a'; c.fill();
  c.strokeStyle = 'rgba(40,10,10,0.45)'; c.lineWidth = 0.8; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(54 + i * 3.6, 66.5); c.lineTo(54 + i * 3.6, 85.5); } c.stroke();
  c.beginPath(); c.arc(58, 77, 1.5, 0, TAU); c.fillStyle = GOLD; c.fill(); ink(c, P, 0.6);
  // round windows
  [[30, 70], [80, 68]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fillStyle = '#8a6a4a'; c.fill(); ink(c, P, 1.4); c.beginPath(); c.arc(x, y, 4.2, 0, TAU); c.fillStyle = GLOW; c.fill(); c.strokeStyle = '#6a4a2c'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.moveTo(x, y - 4); c.lineTo(x, y + 4); c.stroke(); });
  // path + fence + flowers
  c.beginPath(); c.moveTo(48, 90); c.quadraticCurveTo(54, 92, 60, 90); c.lineTo(66, 98); c.lineTo(40, 98); c.closePath(); c.fillStyle = '#c8aa7a'; c.fill();
  c.strokeStyle = '#e8dcc0'; c.lineWidth = 1.5; c.beginPath(); for (let x = 12; x < 100; x += 5) { if (x > 40 && x < 68) continue; c.moveTo(x, 92); c.lineTo(x, 86); } c.stroke();
  c.strokeStyle = P.ink; c.lineWidth = 0.7; c.beginPath(); c.moveTo(12, 88.6); c.lineTo(38, 88.6); c.moveTo(70, 88.6); c.lineTo(100, 88.6); c.stroke();
  flowers(c, r, 14, 96, 91, 18);
  // little garden tree
  tree(c, P, 96, 88, 22, { col: '#5a9a4a' });
});

const folkGnome = FOLK('gnome_workshop', 'Gnomish Workshop', 0.95, 1.2, (c, P, W, H, r) => {
  const G = tone(P, '#a89070', 0.4);
  shadow(c, 48, 92, 38, 5);
  // pipes
  c.strokeStyle = P.ink; c.lineWidth = 4.4; c.beginPath(); c.moveTo(74, 86); c.lineTo(82, 86); c.lineTo(82, 40); c.lineTo(66, 40); c.stroke();
  c.strokeStyle = '#c47a3c'; c.lineWidth = 2.6; c.stroke();
  smoke(c, 82, 34, 2.2, 4, 'rgba(235,235,240,0.75)');
  // main round tower with a patchwork of stories
  body(c, G, 22, 62, 52, 28, { S: G, rnd: r, cyl: true });
  body(c, G, 28, 40, 40, 24, { S: G, rnd: r, cyl: true });
  c.fillStyle = '#6a4a3a'; c.fillRect(18, 60, 60, 3.4); c.beginPath(); c.rect(18, 60, 60, 3.4); ink(c, P, 1.1);
  // copper dome w/ crooked chimney
  dome(c, P, 48, 40, 48, 28, '#c46b3a'); c.strokeStyle = '#7a3f1f'; c.lineWidth = 0.7; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(48, 12); c.quadraticCurveTo(48 + i * 9, 26, 48 + i * 10.5, 40); } c.stroke();
  c.fillStyle = '#6a4a3a'; c.beginPath(); c.moveTo(34, 24); c.lineTo(38, 24); c.lineTo(37, 14); c.lineTo(33, 15); c.closePath(); c.fill(); ink(c, P, 1); smoke(c, 35, 10, 1.6, 3, 'rgba(120,115,125,0.6)');
  // gears
  cog(c, P, 24, 52, 7, 8, '#b98a46'); cog(c, P, 70, 70, 5.5, 7, '#b98a46'); cog(c, P, 36, 78, 4, 6, '#c9a050');
  // door + windows
  gate(c, P, 48, 90, 10, 15, { glow: '#3a2312' }); c.beginPath(); c.arc(48, 78, 1.2, 0, TAU); c.fillStyle = GOLD; c.fill();
  [[38, 50], [58, 50]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fillStyle = '#9ad7e8'; c.fill(); ink(c, P, 1.2); glowAt(c, x, y, 7, 'rgba(160,230,250,0.3)'); });
  [[56, 72]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fillStyle = GLOW; c.fill(); ink(c, P, 1); });
  // lightning rod + weather vane
  c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(48, 12); c.lineTo(48, 3); c.stroke(); poly(c, P, [[48, 5], [55, 6.5], [48, 8]], '#d9604a', 0.7);
  // crates/barrels
  c.fillStyle = '#8a5a34'; c.fillRect(10, 82, 8, 8); c.strokeStyle = P.ink; c.lineWidth = 0.9; c.strokeRect(10, 82, 8, 8); c.beginPath(); c.moveTo(10, 82); c.lineTo(18, 90); c.stroke();
  tufts(c, P, r, 6, 90, 92, 8, '#4d8a40');
});

const folkFolly = FOLK('halfling_folly', 'Halfling Folly Tower', 0.8, 1.1, (c, P, W, H, r) => {
  const F = tone(P, '#d8c49a', 0.45);
  shadow(c, 42, 92, 30, 4);
  // gently bulging round tower
  c.beginPath(); c.moveTo(22, 90); c.bezierCurveTo(14, 60, 24, 42, 28, 38); c.lineTo(54, 38); c.bezierCurveTo(58, 42, 68, 60, 60, 90); c.closePath();
  c.fillStyle = hgrad(c, 14, 54, stops(F, true)); c.fill(); ink(c, P);
  c.save(); c.clip(); c.strokeStyle = P.ink; c.globalAlpha = 0.18; c.lineWidth = 0.5; for (let y = 42; y < 90; y += 4.4) { c.beginPath(); c.moveTo(10, y); c.lineTo(70, y); c.stroke(); } c.restore();
  // mushroom thatch roof (crooked)
  c.beginPath(); c.moveTo(14, 42); c.bezierCurveTo(16, 24, 34, 8, 44, 10); c.bezierCurveTo(54, 14, 68, 28, 68, 42); c.quadraticCurveTo(42, 46, 14, 42); c.closePath();
  c.fillStyle = hgrad(c, 14, 54, [[0, '#e0b86a'], [0.5, '#c4923c'], [1, '#8a5f22']]); c.fill(); ink(c, P);
  c.save(); c.clip(); c.strokeStyle = '#6a4818'; c.globalAlpha = 0.5; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i < 12; i++) { c.moveTo(44, 10); c.lineTo(10 + i * 6, 46); } c.stroke(); c.restore();
  c.fillStyle = '#e86a6a'; [[26, 32], [52, 36], [40, 22]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill(); });
  // little chimney + flag
  c.fillStyle = '#9a7a62'; c.fillRect(54, 16, 5, 9); c.beginPath(); c.rect(54, 16, 5, 9); ink(c, P, 0.9); smoke(c, 56.5, 13, 1.4, 3, 'rgba(110,105,110,0.5)');
  flag(c, P, 44, 10, 10, '#4f9a58', { dot: GOLD });
  // round door and windows
  c.beginPath(); c.arc(41, 80, 8, Math.PI, 0); c.lineTo(49, 90); c.lineTo(33, 90); c.closePath(); c.fillStyle = '#4a8a5a'; c.fill(); ink(c, P, 1.5); c.beginPath(); c.arc(46, 82, 1, 0, TAU); c.fillStyle = GOLD; c.fill();
  [[34, 56], [48, 62]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 4.2, 0, TAU); c.fillStyle = GLOW; c.fill(); ink(c, P, 1.3); c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.moveTo(x, y - 4); c.lineTo(x, y + 4); c.strokeStyle = '#6a4a2c'; c.lineWidth = 0.7; c.stroke(); });
  // ivy + flower pots
  c.strokeStyle = '#3d7d3a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(24, 88); c.bezierCurveTo(18, 70, 28, 62, 22, 48); c.stroke();
  for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(21 + Math.sin(i * 1.3) * 3, 84 - i * 6.4, 2.2, 1.3, 0.5, 0, TAU); c.fillStyle = '#4f9a58'; c.fill(); }
  flowers(c, r, 8, 76, 91, 14);
  tree(c, P, 70, 90, 20, { col: '#58a860' });
});


// ---------------------------------------------------------------- WIZARD TOWERS
const WIZ = (id, name, aspect, scale, draw) => mk(id, name, 'wizard', 'Wizard Towers', aspect, scale, 101, draw);
const ARCANE = '#6fd6ff';
function taper(c, P, cx, by, wb, wt, h, S, r, o = {}) {
  const top = by - h;
  c.beginPath(); c.moveTo(cx - wb / 2, by); c.lineTo(cx - wt / 2, top); c.lineTo(cx + wt / 2, top); c.lineTo(cx + wb / 2, by); c.closePath();
  c.fillStyle = hgrad(c, cx - wb / 2, wb, stops(S, true)); c.fill();
  c.save(); c.clip(); c.strokeStyle = P.ink; c.globalAlpha = 0.2; c.lineWidth = 0.5; c.beginPath();
  for (let y = by - 4.4, k = 0; y > top; y -= 4.4, k++) { c.moveTo(cx - wb, y); c.lineTo(cx + wb, y); for (let x = cx - wb / 2 + (k % 2 ? 3 : 0); x < cx + wb / 2; x += 6.5) { c.moveTo(x, y); c.lineTo(x, y + 4.4); } }
  c.stroke(); c.restore();
  c.beginPath(); c.moveTo(cx - wb / 2, by); c.lineTo(cx - wt / 2, top); c.lineTo(cx + wt / 2, top); c.lineTo(cx + wb / 2, by); c.closePath(); ink(c, P);
}
function stars(c, x, y, n, r, col = '#ffe58a') {
  for (let i = 0; i < n; i++) { const sx = x + (r() - 0.5) * 12, sy = y + r() * 12; c.beginPath(); c.moveTo(sx, sy - 1.6); c.lineTo(sx + 0.5, sy - 0.5); c.lineTo(sx + 1.6, sy); c.lineTo(sx + 0.5, sy + 0.5); c.lineTo(sx, sy + 1.6); c.lineTo(sx - 0.5, sy + 0.5); c.lineTo(sx - 1.6, sy); c.lineTo(sx - 0.5, sy - 0.5); c.closePath(); c.fillStyle = col; c.fill(); }
}
function crystal(c, P, x, y, w, h, col) {
  const pts = [[x, y - h], [x + w / 2, y - h * 0.65], [x + w / 2.6, y], [x - w / 2.6, y], [x - w / 2, y - h * 0.65]];
  poly(c, P, pts, col, 1.2);
  c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w / 2, y - h * 0.65); c.lineTo(x + w / 2.6, y); c.lineTo(x, y); c.closePath(); c.fillStyle = dk(col, 0.28); c.fill();
  c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - w / 2, y - h * 0.65); c.lineTo(x - w / 2.6, y); c.lineTo(x, y - h * 0.3); c.closePath(); c.fillStyle = lt(col, 0.45); c.fill();
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); ink(c, P, 1.2);
}

const wizA = WIZ('wizard_spire', 'Wizard Spire', 0.8, 1.2, (c, P, W, H, r) => {
  const Z = tone(P, '#9aa0c8', 0.28);
  shadow(c, 42, 92, 30, 5);
  tree(c, P, 66, 92, 24, { col: '#4f8a6a' });
  taper(c, P, 40, 90, 26, 18, 52, Z, r);
  // balcony tiers
  [[66, 28], [46, 24]].forEach(([y, w], i) => { c.fillStyle = Z.dk; c.fillRect(40 - w / 2 - 2, y, w + 4, 3); c.beginPath(); c.rect(40 - w / 2 - 2, y, w + 4, 3); ink(c, P, 1.1); for (let k = 0; k < 6; k++) { c.fillStyle = Z.mid; c.fillRect(40 - w / 2 - 1.5 + k * ((w + 3) / 6), y - 2, 2.4, 2.2); } });
  slit(c, P, 40, 70, 3, 8, GLOW); slit(c, P, 40, 52, 3, 8, GLOW); slit(c, P, 40, 36, 2.6, 7, ARCANE);
  gate(c, P, 40, 90, 8, 12, { glow: '#1a1430' });
  // crooked wizard-hat roof
  const rc = cone(c, P, 40, 34, 24, 30, '#4a4fb0', { ov: 4, tx: 44, cv: -1 });
  void rc;
  stars(c, 40, 22, 3, r); // sparkles
  c.beginPath(); c.arc(50, 4, 3, 0, TAU); c.fillStyle = ARCANE; c.fill(); ink(c, P, 1); glowAt(c, 50, 4, 11, 'rgba(110,214,255,0.5)');
  // brim ring floating
  c.strokeStyle = 'rgba(111,214,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.ellipse(40, 56, 18, 3, 0, 0, TAU); c.stroke();
  // little window of ivy
  c.strokeStyle = '#3d7d3a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(30, 90); c.bezierCurveTo(26, 76, 34, 70, 30, 58); c.stroke();
});

const wizB = WIZ('wizard_crystal', 'Crystal Tower', 0.8, 1.2, (c, P, W, H, r) => {
  const Z = tone(P, '#b8a8d8', 0.4);
  shadow(c, 42, 92, 30, 5);
  glowAt(c, 40, 30, 40, 'rgba(190,120,255,0.18)');
  mount(c, P, 8, 92, 64, 30, '#8a7a96', r, { apex: 0.5 });
  taper(c, P, 40, 70, 22, 14, 44, Z, r);
  [58, 44, 30].forEach((y, i) => slit(c, P, 40, y - 6, 2.6, 7, i ? '#e8b8ff' : GLOW));
  c.fillStyle = Z.dk; c.fillRect(27, 26, 26, 3.4); c.beginPath(); c.rect(27, 26, 26, 3.4); ink(c, P, 1.2);
  // crystal crown
  crystal(c, P, 40, 28, 14, 30, '#b078ff'); crystal(c, P, 31, 28, 7, 15, '#7ac6ff'); crystal(c, P, 49, 28, 7, 17, '#ff8ad8');
  glowAt(c, 40, 14, 14, 'rgba(210,150,255,0.6)');
  // floating shards
  crystal(c, P, 16, 22, 5, 9, '#9ab8ff'); crystal(c, P, 65, 16, 5, 10, '#d8a0ff'); crystal(c, P, 60, 38, 4, 7, '#7ac6ff'); crystal(c, P, 20, 44, 4, 7, '#ff8ad8');
  gate(c, P, 40, 70, 8, 12, { glow: '#2a1a4a' }); glowAt(c, 40, 66, 9, 'rgba(210,150,255,0.5)');
  [[18, 90, 5], [68, 90, 4]].forEach(([x, y, s]) => crystal(c, P, x, y, s, s * 2.2, '#b078ff'));
});

const wizC = WIZ('wizard_observatory', 'Arcane Observatory', 0.9, 1.2, (c, P, W, H, r) => {
  const Z = tone(P, '#a8c0d0', 0.32);
  shadow(c, 46, 92, 34, 5);
  // base hall
  body(c, Z, 22, 60, 48, 30, { S: Z, rnd: r, cyl: true });
  merl(c, Z, 22, 60, 48, { S: Z, n: 8 });
  tower(c, Z, 46, 62, 28, 28, { S: Z, rnd: r, slits: 0, top: 'none' });
  // dome with open slit and telescope
  c.beginPath(); c.moveTo(30, 36); c.bezierCurveTo(28, 14, 64, 14, 62, 36); c.closePath(); c.fillStyle = hgrad(c, 30, 32, [[0, '#8fb8d8'], [0.4, '#5f8cb8'], [1, '#2f4a78']]); c.fill(); ink(c, P);
  c.beginPath(); c.moveTo(42, 20); c.lineTo(50, 20); c.lineTo(52, 34); c.lineTo(40, 34); c.closePath(); c.fillStyle = '#0e1a38'; c.fill(); ink(c, P, 1);
  stars(c, 46, 22, 2, r);
  c.save(); c.translate(48, 28); c.rotate(-0.7); c.fillStyle = '#c9a050'; c.fillRect(0, -2, 16, 4); c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(0, -2, 16, 4); c.fillRect(14, -3, 4, 6); c.strokeRect(14, -3, 4, 6); c.restore();
  // orbital rings
  c.strokeStyle = 'rgba(150,230,255,0.85)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(46, 30, 26, 6, -0.25, Math.PI, TAU); c.stroke(); c.beginPath(); c.ellipse(46, 30, 26, 6, -0.25, 0, Math.PI); c.stroke();
  c.beginPath(); c.arc(70, 20, 2.4, 0, TAU); c.fillStyle = ARCANE; c.fill(); ink(c, P, 0.8);
  c.beginPath(); c.arc(22, 38, 2, 0, TAU); c.fillStyle = '#ffd0f0'; c.fill(); ink(c, P, 0.8);
  [[34, 74], [58, 74]].forEach(([x, y]) => slit(c, P, x, y - 4, 3, 8, GLOW));
  gate(c, P, 46, 90, 10, 16, { glow: '#1a1c38' });
  flag(c, P, 22, 58, 10, BLUE, { dir: -1 });
  tufts(c, P, r, 8, 86, 92, 8, '#4d8a40');
});

// ---------------------------------------------------------------- TEMPLES & SHRINES
const HOLY = (id, name, aspect, scale, draw) => mk(id, name, 'sacred', 'Temples, Shrines & Stones', aspect, scale, 113, draw);
function cypress(c, P, x, by, h) {
  c.beginPath(); c.moveTo(x, by - h); c.bezierCurveTo(x + h * 0.22, by - h * 0.6, x + h * 0.2, by - h * 0.2, x + 1, by); c.lineTo(x - 1, by); c.bezierCurveTo(x - h * 0.2, by - h * 0.2, x - h * 0.22, by - h * 0.6, x, by - h);
  c.fillStyle = hgrad(c, x - h * 0.2, h * 0.4, [[0, '#4f9a58'], [1, '#1f5a3a']]); c.fill(); ink(c, P, 1);
}

const holyMonastery = HOLY('monastery', 'Monastery', 1.2, 1.3, (c, P, W, H, r) => {
  shadow(c, 66, 92, 50, 6);
  tufts(c, P, r, 6, 114, 92, 10);
  // terraced rear: bell tower + chapel
  body(c, P, 62, 38, 30, 38, { rnd: r });
  poly(c, P, [[58, 38], [77, 18], [96, 38]], '#8a4b3a', 1.6); poly(c, P, [[77, 18], [96, 38], [77, 38]], '#5e3126', 0.8);
  c.beginPath(); c.arc(77, 52, 5, Math.PI, 0); c.lineTo(82, 62); c.lineTo(72, 62); c.closePath(); c.fillStyle = VOID; c.fill(); ink(c, P, 1.2);
  tower(c, P, 44, 78, 14, 56, { rnd: r, slits: 0, roof: '#8a4b3a', rh: 18 });
  c.beginPath(); c.arc(44, 40, 3.8, Math.PI, 0); c.lineTo(48, 50); c.lineTo(40, 50); c.closePath(); c.fillStyle = VOID; c.fill(); ink(c, P, 1);
  c.beginPath(); c.arc(44, 46, 1.6, 0, TAU); c.fillStyle = GOLD; c.fill();
  poly(c, P, [[75, 8], [79, 8], [79, 14], [75, 14]], GOLD, 0.6);
  c.strokeStyle = P.ink; c.lineWidth = 1.3; c.beginPath(); c.moveTo(77, 18); c.lineTo(77, 6); c.moveTo(73, 10); c.lineTo(81, 10); c.stroke();
  // cloister wall + arcade
  body(c, P, 12, 66, 96, 22, { rnd: r, tex: 0.12 }); poly(c, P, [[10, 66], [14, 62], [106, 62], [110, 66]], '#8a4b3a', 1.3);
  for (let i = 0; i < 9; i++) { const x = 20 + i * 10; c.beginPath(); c.moveTo(x - 3, 88); c.lineTo(x - 3, 76); c.arc(x, 76, 3, Math.PI, 0); c.lineTo(x + 3, 88); c.closePath(); c.fillStyle = i === 4 ? VOID : '#3a2c28'; c.fill(); ink(c, P, 0.8); }
  gate(c, P, 60, 88, 13, 20, { glow: '#2a1a14' }); c.beginPath(); c.arc(60, 66, 3, 0, TAU); c.fillStyle = GOLD; c.fill(); ink(c, P, 0.8);
  cypress(c, P, 14, 90, 30); cypress(c, P, 106, 90, 26); cypress(c, P, 22, 92, 22);
});

const holyTemple = HOLY('temple', 'Temple of the Gods', 1.1, 1.3, (c, P, W, H, r) => {
  const M = tone(P, '#fff8ee', 0.5);
  shadow(c, 56, 92, 46, 5);
  // steps
  [[8, 90, 96], [11, 87, 90], [14, 84, 84]].forEach(([x, y, w], i) => { c.fillStyle = hgrad(c, x, w, stops(M, false)); c.fillRect(x, y - 3, w, 3.4); c.beginPath(); c.rect(x, y - 3, w, 3.4); ink(c, P, 1); });
  // cella behind columns
  body(c, M, 28, 42, 56, 40, { S: M, rnd: r, tex: 0.1 });
  gate(c, M, 56, 81, 10, 18, { glow: '#2a1c14' }); glowAt(c, 56, 74, 10, 'rgba(255,210,120,0.35)');
  // columns
  for (let i = 0; i < 6; i++) pillar(c, P, 16 + i * 14, 81, 6, 38, M);
  // entablature + pediment
  c.fillStyle = hgrad(c, 10, 92, stops(M, false)); c.fillRect(10, 36, 92, 6); c.beginPath(); c.rect(10, 36, 92, 6); ink(c, P, 1.3);
  poly(c, P, [[8, 36], [56, 12], [104, 36]], M.lit, 1.6); poly(c, P, [[56, 12], [104, 36], [56, 36]], M.dk, 0.8);
  poly(c, P, [[26, 33], [56, 18], [86, 33]], '#d6c9ac', 0.9);
  c.beginPath(); c.arc(56, 28, 4.4, 0, TAU); c.fillStyle = GOLD; c.fill(); ink(c, P, 1);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(56 + Math.cos(a) * 4.4, 28 + Math.sin(a) * 4.4); c.lineTo(56 + Math.cos(a) * 6.6, 28 + Math.sin(a) * 6.6); c.strokeStyle = GOLD; c.lineWidth = 0.9; c.stroke(); }
  poly(c, P, [[52, 12], [56, 5], [60, 12]], GOLD, 1);
  [[10, 36], [102, 36]].forEach(([x]) => poly(c, P, [[x - 2, 36], [x, 31], [x + 2, 36]], M.mid, 0.8));
  [[8, 90], [102, 90]].forEach(([x, y]) => { c.fillStyle = M.dd; c.fillRect(x - 1.4, y - 9, 2.8, 8); glowAt(c, x, y - 11, 6, 'rgba(255,170,60,0.5)'); c.beginPath(); c.moveTo(x - 2, y - 9); c.quadraticCurveTo(x, y - 15, x + 2, y - 9); c.fillStyle = ORANGE; c.fill(); });
});

const holyShrine = HOLY('shrine', 'Wayside Shrine', 0.9, 1.3, (c, P, W, H, r) => {
  const Z = tone(P, '#b0b4a8', 0.25);
  shadow(c, 46, 92, 32, 4);
  tree(c, P, 14, 92, 30, { col: '#e88aa8' }); // blossom
  // stone platform
  for (let i = 0; i < 2; i++) { c.fillStyle = hgrad(c, 24 - i * 3, 44 + i * 6, stops(Z, false)); c.fillRect(24 - i * 3, 86 - i * 4, 44 + i * 6, 4.2); c.beginPath(); c.rect(24 - i * 3, 86 - i * 4, 44 + i * 6, 4.2); ink(c, P, 1); }
  // shrine hall with curved roof
  body(c, Z, 32, 54, 28, 28, { S: Z, rnd: r, tex: 0.1 });
  [[30, 1], [60, 1]].forEach(([x]) => { c.fillStyle = '#b8402e'; c.fillRect(x - 1.6, 52, 4, 32); c.beginPath(); c.rect(x - 1.6, 52, 4, 32); ink(c, P, 1); });
  c.beginPath(); c.moveTo(22, 54); c.quadraticCurveTo(46, 52, 46, 36); c.quadraticCurveTo(46, 52, 70, 54); c.quadraticCurveTo(46, 58, 22, 54); c.closePath(); c.fillStyle = '#6b6b78'; c.fill();
  c.beginPath(); c.moveTo(20, 56); c.quadraticCurveTo(40, 52, 46, 34); c.quadraticCurveTo(52, 52, 72, 56); c.quadraticCurveTo(46, 60, 20, 56); c.closePath();
  c.fillStyle = hgrad(c, 20, 52, [[0, '#8892a8'], [0.5, '#5e6680'], [1, '#383e56']]); c.fill(); ink(c, P, 1.6);
  c.strokeStyle = P.ink; c.globalAlpha = 0.3; c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 8; i++) { c.moveTo(46, 36); c.lineTo(22 + i * 6.6, 56); } c.stroke(); c.globalAlpha = 1;
  poly(c, P, [[44, 36], [46, 29], [48, 36]], GOLD, 0.9);
  // doorway offering
  c.fillStyle = '#1b1226'; c.fillRect(41, 64, 10, 18); c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(41, 64, 10, 18); glowAt(c, 46, 74, 10, 'rgba(255,200,100,0.45)');
  [[43.5, 80], [48.5, 80]].forEach(([x, y]) => { c.fillStyle = '#f4ecd0'; c.fillRect(x - 0.9, y - 4, 1.8, 4); c.beginPath(); c.ellipse(x, y - 5, 0.9, 1.5, 0, 0, TAU); c.fillStyle = ORANGE; c.fill(); });
  // stone lantern
  c.fillStyle = Z.mid; c.fillRect(71, 80, 4, 8); c.fillRect(69, 76, 8, 4); poly(c, P, [[68, 76], [73, 70], [78, 76]], Z.dk, 0.9); c.fillStyle = GLOW; c.fillRect(71.4, 77, 3.2, 2.2); c.beginPath(); c.rect(69, 76, 8, 4); ink(c, P, 0.8);
  tufts(c, P, r, 8, 84, 92, 8, '#4d8a40');
});

const holyStones = HOLY('standing_stones', 'Standing Stones', 1.0, 1.45, (c, P, W, H, r) => {
  const Z = tone(P, '#d4d2c4', 0.5);
  shadow(c, 50, 90, 42, 6, 0.3);
  c.beginPath(); c.ellipse(50, 78, 44, 14, 0, 0, TAU); c.fillStyle = 'rgba(90,140,70,0.4)'; c.fill();
  const menhir = (x, by, w, h, lean) => {
    const L = x - w / 2, R = x + w / 2;
    c.beginPath(); c.moveTo(L, by); c.lineTo(L + lean + 0.8, by - h + 3); c.quadraticCurveTo(x + lean, by - h - 2, R + lean - 0.6, by - h + 4); c.lineTo(R, by); c.closePath();
    c.fillStyle = hgrad(c, L, w, [[0, Z.hi], [0.4, Z.mid], [1, Z.dd]]); c.fill(); ink(c, P, 2.4);
    c.strokeStyle = P.ink; c.globalAlpha = 0.28; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 1, by - h * 0.7); c.lineTo(x + 1, by - h * 0.4); c.moveTo(x + 1, by - h * 0.9); c.lineTo(x, by - h * 0.75); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = 'rgba(70,130,60,0.6)'; c.beginPath(); c.ellipse(x, by - 0.5, w * 0.7, 1.4, 0, 0, TAU); c.fill();
  };
  // back arc (smaller)
  [[22, 70, 6, 18, -1], [34, 63, 6, 19, 0], [50, 61, 6, 18, 0], [66, 63, 6, 20, 0.5], [78, 70, 6, 17, 1]].forEach((a) => menhir(...a));
  // central trilithon
  menhir(40, 80, 7, 28, 0); menhir(60, 80, 7, 30, 0);
  c.beginPath(); c.moveTo(34, 54); c.lineTo(66, 53); c.lineTo(67, 60); c.lineTo(33, 61); c.closePath(); c.fillStyle = hgrad(c, 33, 34, [[0, Z.hi], [0.5, Z.mid], [1, Z.dk]]); c.fill(); ink(c, P, 1.4);
  // front stones
  [[12, 84, 7, 22, -1], [88, 84, 7, 24, 1], [28, 90, 6, 14, 0], [74, 90, 6, 16, 0]].forEach((a) => menhir(...a));
  // altar + glow runes
  c.beginPath(); c.ellipse(50, 82, 7, 2.6, 0, 0, TAU); c.fillStyle = Z.mid; c.fill(); ink(c, P, 1); glowAt(c, 50, 70, 14, 'rgba(130,230,255,0.35)');
  c.strokeStyle = '#7ad8ff'; c.lineWidth = 0.9; [[40, 70], [60, 70]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 1.2, y); c.lineTo(x - 0.8, y + 2); c.lineTo(x, y + 5); c.stroke(); });
  flowers(c, r, 8, 92, 90, 12); tufts(c, P, r, 6, 94, 88, 10, '#3d7d3a');
});

// ---------------------------------------------------------------- RUINS
const RUIN = (id, name, aspect, scale, draw) => mk(id, name, 'ruins', 'Ruins', aspect, scale, 127, draw);
function ruinBody(c, P, x, by, w, h, r, S, o = {}) {
  const n = Math.max(3, Math.round(w / 5)), top = by - h;
  const pts = [[x, by]]; for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, top + (o.broken ?? 1) * r() * h * 0.4 + (i % 2 ? 3 : 0)]); pts.push([x + w, by]);
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath();
  c.fillStyle = hgrad(c, x, w, stops(S, !!o.cyl)); c.fill();
  c.save(); c.clip(); c.strokeStyle = P.ink; c.globalAlpha = 0.22; c.lineWidth = 0.5; c.beginPath();
  for (let y = by - 4.4, k = 0; y > top; y -= 4.4, k++) { c.moveTo(x, y); c.lineTo(x + w, y); for (let xx = x + (k % 2 ? 3 : 0) + r(); xx < x + w; xx += 6.5) { c.moveTo(xx, y); c.lineTo(xx, y + 4.4); } }
  c.stroke(); c.globalAlpha = 1;
  const g = c.createLinearGradient(0, by - 8, 0, by); g.addColorStop(0, 'rgba(60,110,50,0)'); g.addColorStop(1, 'rgba(60,110,50,0.4)'); c.fillStyle = g; c.fillRect(x, by - 8, w, 8);
  c.restore();
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); ink(c, P, 2.9);
  return pts;
}
function ivy(c, x, y0, y1, r) {
  c.strokeStyle = '#3d7d3a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y0); c.bezierCurveTo(x - 4, (y0 + y1) / 2, x + 4, (y0 + y1) / 2 + 4, x, y1); c.stroke();
  for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; c.beginPath(); c.ellipse(x + Math.sin(t * 6) * 2.4, y0 + (y1 - y0) * t, 2, 1.2, 0.6, 0, TAU); c.fillStyle = '#4f9a58'; c.fill(); }
}
function rubble(c, P, r, x0, x1, y, n, S) {
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), s = 1.4 + r() * 2.4; poly(c, P, [[x - s, y], [x - s * 0.6, y - s * 0.9], [x + s * 0.5, y - s], [x + s, y]], r() < 0.5 ? S.lit : S.mid, 0.8); }
}

const ruinCastle = RUIN('ruin_castle', 'Castle Ruins', 1.2, 1.7, (c, P, W, H, r) => {
  const Z = tone(P, '#d8d6c4', 0.5);
  shadow(c, 64, 92, 52, 5);
  tufts(c, P, r, 6, 114, 92, 12, '#4a7a3a');
  ruinBody(c, P, 40, 78, 44, 42, r, Z, { broken: 1.2 });
  ruinBody(c, P, 10, 90, 24, 30, r, Z, { broken: 1.6 }); ruinBody(c, P, 86, 90, 24, 52, r, Z, { broken: 1.2, cyl: true });
  ruinBody(c, P, 30, 90, 62, 20, r, Z, { broken: 1.8 });
  [[22, 62], [98, 40]].forEach(([x, y]) => ivy(c, x, y, 88, r));
  // broken arch + gate
  c.beginPath(); c.moveTo(52, 90); c.lineTo(52, 76); c.arc(60, 76, 8, Math.PI, 1.55 * Math.PI); c.lineTo(60, 90); c.closePath(); c.fillStyle = VOID; c.fill(); ink(c, P, 1.3);
  slit(c, P, 62, 44, 2.4, 7); slit(c, P, 94, 54, 2.4, 7);
  rubble(c, P, r, 6, 114, 91, 14, Z);
  // fallen column + moss
  c.save(); c.translate(40, 92); c.rotate(-0.05); body(c, P, 0, -5, 22, 5, { S: Z, cyl: true, tex: 0 }); c.restore();
  // stubby tree growing inside
  tree(c, P, 70, 90, 22, { col: '#5a8a4a' });
  flag(c, P, 94, 38, 9, '#6a2a2a', { dir: -1, swallow: true });
  bat(c, P, 24, 24, 4); bat(c, P, 52, 18, 3.4);
});

const ruinVillage = RUIN('ruin_village', 'Ruined Village', 1.1, 1.55, (c, P, W, H, r) => {
  const Z = tone(P, '#e0d6bc', 0.5);
  shadow(c, 56, 92, 46, 5);
  tufts(c, P, r, 6, 104, 90, 14, '#4a7a3a');
  const hut = (x, by, w, h) => {
    ruinBody(c, P, x, by, w, h, r, Z, { broken: 1.4 });
    // bare rafters
    c.strokeStyle = '#4b301f'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 1, by - h + 2); c.lineTo(x + w / 2, by - h - w * 0.4); c.lineTo(x + w + 1, by - h + 2); c.moveTo(x + w * 0.25, by - h - w * 0.12); c.lineTo(x + w * 0.25, by - h + 5); c.moveTo(x + w * 0.75, by - h - w * 0.12); c.lineTo(x + w * 0.75, by - h + 5); c.stroke();
  };
  hut(10, 84, 26, 24); hut(70, 82, 28, 22);
  // chimney standing alone
  body(c, P, 44, 70 - 22, 9, 36, { S: Z, tex: 0.25, bh: 3.4 }); poly(c, P, [[43, 48], [46, 44], [53, 46], [54, 48]], Z.mid, 1);
  ruinBody(c, P, 30, 91, 40, 7, r, Z, { broken: 2 });
  ivy(c, 14, 62, 84, r); ivy(c, 96, 62, 82, r);
  // well + cart
  c.beginPath(); c.ellipse(58, 84, 6, 2.4, 0, 0, TAU); c.fillStyle = Z.mid; c.fill(); ink(c, P, 1); c.beginPath(); c.ellipse(58, 83.4, 4, 1.4, 0, 0, TAU); c.fillStyle = VOID; c.fill();
  c.fillStyle = '#6a4528'; c.save(); c.translate(22, 92); c.rotate(0.2); c.fillRect(0, -4, 10, 4); c.strokeStyle = P.ink; c.lineWidth = 0.8; c.strokeRect(0, -4, 10, 4); c.restore();
  c.beginPath(); c.arc(30, 92, 3, 0, TAU); c.strokeStyle = '#4b301f'; c.lineWidth = 1.3; c.stroke();
  rubble(c, P, r, 8, 100, 92, 12, Z);
  deadTree(c, P, 100, 90, 24);
  smoke(c, 49, 40, 1.4, 3, 'rgba(100,95,100,0.35)');
});

const ruinTower = RUIN('ruin_tower', 'Ruined Tower', 0.8, 1.4, (c, P, W, H, r) => {
  const Z = tone(P, '#d8d6c4', 0.5);
  shadow(c, 44, 92, 32, 5);
  tufts(c, P, r, 6, 80, 92, 10, '#4a7a3a');
  c.beginPath(); c.ellipse(40, 90, 22, 3, 0, 0, TAU); c.fillStyle = 'rgba(70,120,60,0.4)'; c.fill();
  ruinBody(c, P, 22, 90, 36, 62, r, Z, { broken: 1.5, cyl: true });
  // half-collapsed inner view
  c.fillStyle = 'rgba(25,15,30,0.5)'; c.beginPath(); c.moveTo(36, 90); c.lineTo(36, 54); c.lineTo(50, 50); c.lineTo(50, 90); c.closePath(); c.fill();
  slit(c, P, 30, 52, 2.4, 8); slit(c, P, 30, 70, 2.4, 8);
  // crack
  c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(48, 40); c.lineTo(46, 52); c.lineTo(50, 62); c.lineTo(47, 74); c.stroke();
  ivy(c, 26, 48, 88, r);
  poly(c, P, [[62, 91], [64, 84], [70, 83], [72, 91]], Z.lit, 1); poly(c, P, [[10, 92], [12, 88], [18, 88], [20, 92]], Z.mid, 1);
  rubble(c, P, r, 8, 74, 92, 10, Z);
  deadTree(c, P, 70, 92, 22);
  bat(c, P, 62, 24, 4);
});


// ---------------------------------------------------------------- WATCHTOWERS & LIGHTHOUSES
const GUARD = (id, name, aspect, scale, draw) => mk(id, name, 'guard', 'Watchtowers & Lighthouses', aspect, scale, 131, draw);
const WATER = '#6aa3c2';
function waves(c, P, r, x0, x1, y0, y1, n) {
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.9; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); c.beginPath(); c.moveTo(x - 3, y); c.quadraticCurveTo(x - 1.5, y - 1.6, x, y); c.quadraticCurveTo(x + 1.5, y + 1.6, x + 3, y); c.stroke(); }
  c.restore();
}
function blobPath(c, cx, cy, rx, ry, r, n = 16) {
  const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 0.92 + r() * 0.12; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  c.beginPath(); const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let s0 = m(pts[n - 1], pts[0]); c.moveTo(s0[0], s0[1]);
  for (let i = 0; i < n; i++) { const e = m(pts[i], pts[(i + 1) % n]); c.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); }
  c.closePath();
}
function foam(c, cx, cy, rx, ry, r) {
  const st = r.toString(); void st;
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5; c.setLineDash([5, 2.4]); blobPath(c, cx, cy, rx * 0.97, ry * 0.97, rng(5)); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 0.9; c.setLineDash([]); blobPath(c, cx, cy, rx * 1.01, ry * 1.01, rng(5)); c.stroke(); c.restore();
}
function water(c, P, cx, cy, rx, ry) {
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.fillStyle = hgrad(c, cx - rx, rx * 2, [[0, '#8bbbd2'], [1, '#5890b0']]); c.fill(); ink(c, P, 1.3);
}
function ship(c, P, x, y, s, sail = '#f1ead6', d = 1) {
  c.save(); c.translate(x, y); c.scale(d * s, s);
  c.beginPath(); c.moveTo(-9, -3); c.lineTo(9, -3); c.quadraticCurveTo(7, 3, 3, 4); c.lineTo(-5, 4); c.quadraticCurveTo(-8, 3, -9, -3); c.closePath(); c.fillStyle = '#7b5232'; c.fill(); ink(c, P, 1 / s);
  c.fillStyle = '#4b301f'; c.fillRect(-9, -4, 18, 1.6);
  c.strokeStyle = P.ink; c.lineWidth = 0.9 / s; c.beginPath(); c.moveTo(0, -3); c.lineTo(0, -19); c.stroke();
  c.beginPath(); c.moveTo(0.8, -18); c.quadraticCurveTo(8, -12, 6.5, -5); c.lineTo(0.8, -5); c.closePath(); c.fillStyle = sail; c.fill(); ink(c, P, 0.8 / s);
  c.beginPath(); c.moveTo(-0.8, -17); c.quadraticCurveTo(-6, -12, -5, -6); c.lineTo(-0.8, -6); c.closePath(); c.fillStyle = dk(sail, 0.1); c.fill(); ink(c, P, 0.8 / s);
  c.restore();
}
function rocks(c, P, r, x0, x1, y, n, col = '#7d7a76') {
  for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + r() * 0.5) / n, s = 3 + r() * 4; poly(c, P, [[x - s, y], [x - s * 0.7, y - s * 0.9], [x + s * 0.2, y - s * 1.2], [x + s * 0.9, y - s * 0.5], [x + s, y]], col, 1.1); }
}

const guardWatch = GUARD('watchtower', 'Watchtower', 0.7, 0.9, (c, P, W, H, r) => {
  shadow(c, 38, 92, 28, 4);
  tufts(c, P, r, 8, 64, 91, 8);
  tower(c, P, 35, 90, 22, 56, { rnd: r, slits: 3, cyl: false });
  // timber hoarding
  c.fillStyle = hgrad(c, 20, 30, [[0, '#a8794a'], [0.6, '#7b5232'], [1, '#4b301f']]); c.fillRect(20, 26, 30, 12); c.beginPath(); c.rect(20, 26, 30, 12); ink(c, P, 1.5);
  c.strokeStyle = P.ink; c.globalAlpha = 0.5; c.lineWidth = 0.8; c.beginPath(); for (let x = 25; x < 50; x += 5) { c.moveTo(x, 20); c.lineTo(x, 32); } c.stroke(); c.globalAlpha = 1;
  [[28, 31], [42, 31]].forEach(([x, y]) => { c.fillStyle = VOID; c.fillRect(x - 1.6, y - 1.6, 3.2, 3.2); });
  cone(c, P, 35, 26, 24, 18, '#6b4a3a', { ov: 4 });
  flag(c, P, 35, 9, 10, RED);
  gate(c, P, 35, 90, 7, 12, { glow: '#2a1a14' });
  // ladder + beacon barrel
  c.strokeStyle = '#6a4528'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(50, 92); c.lineTo(52, 60); c.moveTo(54, 92); c.lineTo(56, 60); for (let y = 88; y > 62; y -= 4) { c.moveTo(50 + (92 - y) * 0.07, y); c.lineTo(54 + (92 - y) * 0.07, y); } c.stroke();
});

const guardOutpost = GUARD('outpost', 'Frontier Outpost', 1.0, 1.1, (c, P, W, H, r) => {
  shadow(c, 52, 92, 40, 5);
  c.beginPath(); c.ellipse(50, 84, 42, 8, 0, 0, TAU); c.fillStyle = 'rgba(120,95,60,0.3)'; c.fill();
  palisade(c, P, 8, 92, 78, 22, r, { pt: 2 });
  // inner hut + stone tower
  house(c, P, 14, 82, 22, 16, '#8a4b3a', { wall: '#c9b48a', rh: 12 });
  tower(c, P, 66, 84, 20, 52, { rnd: r, slits: 2, S: P });
  c.fillStyle = hgrad(c, 54, 24, [[0, '#a8794a'], [0.6, '#7b5232'], [1, '#4b301f']]); c.fillRect(54, 28, 24, 8); c.beginPath(); c.rect(54, 28, 24, 8); ink(c, P, 1.3);
  cone(c, P, 66, 28, 20, 14, '#6b4a3a', { ov: 3 });
  flag(c, P, 66, 15, 11, BLUE, { dot: GOLD });
  // gate
  palisade(c, P, 38, 52, 92, 16, r);
  c.fillStyle = '#6a4528'; c.fillRect(40, 70, 10, 3); c.beginPath(); c.rect(40, 70, 10, 3); ink(c, P, 1);
  fire(c, 32, 90, 3.6);
  // wagon + stakes
  for (let x = 6; x < 94; x += 8) if (x < 36 || x > 56) poly(c, P, [[x, 94], [x + 1.4, 88], [x + 2.8, 94]], '#8c6540', 0.8);
});

const guardLight = GUARD('lighthouse', 'Lighthouse', 0.75, 1.15, (c, P, W, H, r) => {
  shadow(c, 42, 93, 32, 4);
  // beams
  c.save(); const g = c.createLinearGradient(40, 16, 8, 14); g.addColorStop(0, 'rgba(255,240,150,0.7)'); g.addColorStop(1, 'rgba(255,240,150,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(40, 16); c.lineTo(0, 6); c.lineTo(0, 26); c.closePath(); c.fill();
  const g2 = c.createLinearGradient(40, 16, 72, 14); g2.addColorStop(0, 'rgba(255,240,150,0.7)'); g2.addColorStop(1, 'rgba(255,240,150,0)');
  c.fillStyle = g2; c.beginPath(); c.moveTo(40, 16); c.lineTo(78, 8); c.lineTo(78, 24); c.closePath(); c.fill(); c.restore();
  // rock
  poly(c, P, [[14, 92], [18, 82], [28, 80], [52, 80], [64, 84], [68, 92]], '#85807c', 1.6);
  c.fillStyle = 'rgba(40,30,40,0.25)'; c.beginPath(); c.moveTo(52, 80); c.lineTo(64, 84); c.lineTo(68, 92); c.lineTo(46, 92); c.closePath(); c.fill();
  // tapering striped tower
  const bands = 5; for (let i = 0; i < bands; i++) {
    const y0 = 82 - i * 12, y1 = y0 - 12, w0 = 20 - i * 1.6, w1 = 20 - (i + 1) * 1.6;
    c.beginPath(); c.moveTo(40 - w0 / 2, y0); c.lineTo(40 - w1 / 2, y1); c.lineTo(40 + w1 / 2, y1); c.lineTo(40 + w0 / 2, y0); c.closePath();
    const col = i % 2 ? '#f4efe2' : '#c8402f'; c.fillStyle = hgrad(c, 40 - w0 / 2, w0, [[0, lt(col, 0.25)], [0.45, col], [1, dk(col, 0.42)]]); c.fill(); ink(c, P, 1.2);
  }
  slit(c, P, 40, 66, 2.4, 6); slit(c, P, 40, 46, 2.4, 6);
  gate(c, P, 40, 82, 6, 9, { glow: '#2a1a14' });
  // gallery + lantern room
  c.fillStyle = '#2f3440'; c.fillRect(27, 23, 26, 3.4); c.beginPath(); c.rect(27, 23, 26, 3.4); ink(c, P, 1.2);
  c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); for (let x = 28; x < 53; x += 3.6) { c.moveTo(x, 23); c.lineTo(x, 19.5); } c.moveTo(27, 19.5); c.lineTo(53, 19.5); c.stroke();
  c.fillStyle = '#ffe9a0'; c.fillRect(33, 11, 14, 9); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.strokeRect(33, 11, 14, 9); glowAt(c, 40, 15, 14, 'rgba(255,230,120,0.7)');
  c.beginPath(); c.moveTo(31, 11); c.lineTo(40, 3); c.lineTo(49, 11); c.closePath(); c.fillStyle = '#2f3440'; c.fill(); ink(c, P, 1.3);
  c.beginPath(); c.arc(40, 2.5, 1.5, 0, TAU); c.fillStyle = GOLD; c.fill();
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(41, 91, 30, 4.6, 0, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(41, 91.6, 35, 5.6, 0, 0, TAU); c.stroke(); c.restore();
});

const guardBeacon = GUARD('beacon_tower', 'Beacon Tower', 0.7, 0.9, (c, P, W, H, r) => {
  shadow(c, 36, 92, 26, 4);
  mount(c, P, 6, 92, 56, 22, '#8a8268', r, { apex: 0.5 });
  tower(c, P, 34, 76, 16, 46, { rnd: r, slits: 2, over: 1.6, n: 4 });
  slit(c, P, 34, 66, 2.4, 6, GLOW);
  gate(c, P, 34, 77, 6, 9, { glow: '#2a1a14' });
  // fire basket
  c.strokeStyle = P.ink; c.lineWidth = 1.2; c.fillStyle = '#4b301f'; poly(c, P, [[26, 22], [42, 22], [38, 29], [30, 29]], '#3a3a44', 1.3);
  glowAt(c, 34, 14, 20, 'rgba(255,150,50,0.5)');
  c.beginPath(); c.moveTo(27, 22); c.quadraticCurveTo(25, 10, 34, 2); c.quadraticCurveTo(43, 10, 41, 22); c.closePath(); c.fillStyle = ORANGE; c.fill(); ink(c, P, 1);
  c.beginPath(); c.moveTo(30, 22); c.quadraticCurveTo(30, 14, 34, 9); c.quadraticCurveTo(38, 14, 38, 22); c.closePath(); c.fillStyle = '#ffe08a'; c.fill();
  smoke(c, 38, -2, 2, 0);
  // woodpile
  [[56, 90], [62, 90], [59, 86]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fillStyle = '#8a5a34'; c.fill(); ink(c, P, 0.9); });
});

// ---------------------------------------------------------------- PORTS
const PORT = (id, name, aspect, scale, draw) => mk(id, name, 'port', 'Ports & Harbours', aspect, scale, 149, draw);

const portHarbour = PORT('harbour_town', 'Harbour Town', 1.3, 1.4, (c, P, W, H, r) => {
  shadow(c, 56, 90, 46, 5);
  c.save(); blobPath(c, 65, 58, 64, 38, rng(5)); c.clip();
  c.globalAlpha = 0.82; c.fillStyle = hgrad(c, 0, 130, [[0, '#8bbbd2'], [1, '#5890b0']]); c.fillRect(0, 0, 130, 100); c.globalAlpha = 1;
  waves(c, P, r, 6, 124, 72, 94, 16);
  c.beginPath(); c.moveTo(0, 10); c.lineTo(130, 10); c.lineTo(130, 52); c.bezierCurveTo(90, 58, 40, 62, 0, 66); c.closePath(); c.fillStyle = '#9bc27a'; c.fill();
  const Z = tone(P, '#b0a490', 0.2);
  c.beginPath(); c.moveTo(0, 66); c.bezierCurveTo(40, 62, 90, 58, 130, 52); c.lineTo(130, 58); c.bezierCurveTo(90, 64, 40, 68, 0, 72); c.closePath(); c.fillStyle = hgrad(c, 0, 130, [[0, Z.lit], [1, Z.dk]]); c.fill(); ink(c, P, 1.3);
  c.restore(); foam(c, 65, 58, 64, 38, r);
  // houses
  [[8, 54, 14, 14, RED], [26, 52, 16, 18, BLUE], [66, 46, 14, 14, RED], [84, 44, 18, 18, '#8a4b3a'], [106, 42, 14, 14, BLUE]].forEach(([x, by, w, h, col]) => house(c, P, x, by, w, h, col, { wall: '#e0d0aa', rh: 9 }));
  // harbour tower + keep
  tower(c, P, 52, 56, 14, 42, { rnd: r, roof: RED, rh: 16, slits: 1, flag: GOLD, flagH: 8 });
  // crane
  c.strokeStyle = '#5c3a22'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(100, 64); c.lineTo(100, 44); c.lineTo(112, 40); c.moveTo(100, 50); c.lineTo(108, 62); c.stroke(); c.lineWidth = 0.7; c.beginPath(); c.moveTo(112, 40); c.lineTo(112, 54); c.stroke();
  c.fillStyle = '#8a5a34'; c.fillRect(110, 54, 5, 4); c.strokeStyle = P.ink; c.lineWidth = 0.8; c.strokeRect(110, 54, 5, 4);
  // pier & ships
  c.fillStyle = '#7b5232'; c.fillRect(30, 66, 5, 16); c.fillRect(70, 62, 5, 16); c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(30, 66, 5, 16); c.strokeRect(70, 62, 5, 16);
  ship(c, P, 48, 84, 1.5, '#f1ead6'); ship(c, P, 96, 80, 1.3, '#e8c9a0', -1); ship(c, P, 16, 88, 1, '#f1ead6');
  c.fillStyle = '#8a5a34'; [[39, 66], [78, 62]].forEach(([x, y]) => { c.fillRect(x, y, 4, 4); c.strokeRect(x, y, 4, 4); });
  tree(c, P, 120, 38, 22, { col: '#5a9a4a' });
});

const portDock = PORT('fishing_pier', 'Fishing Pier', 1.1, 1.2, (c, P, W, H, r) => {
  shadow(c, 52, 90, 38, 4, 0.2);
  c.save(); blobPath(c, 55, 56, 54, 40, rng(5)); c.clip();
  c.globalAlpha = 0.82; c.fillStyle = hgrad(c, 0, 110, [[0, '#8bbbd2'], [1, '#5890b0']]); c.fillRect(0, 0, 110, 100); c.globalAlpha = 1;
  waves(c, P, r, 4, 104, 58, 94, 14);
  c.beginPath(); c.moveTo(0, 10); c.lineTo(110, 10); c.lineTo(110, 46); c.bezierCurveTo(70, 52, 30, 48, 0, 54); c.closePath(); c.fillStyle = '#d6c58e'; c.fill();
  c.restore(); foam(c, 55, 56, 54, 40, r);
  tufts(c, P, r, 6, 100, 30, 8, '#7a9a4a');
  house(c, P, 10, 42, 20, 16, '#8a4b3a', { wall: '#c9a874', rh: 11 }); house(c, P, 40, 38, 16, 14, '#4f6a8a', { wall: '#d9c8a0', rh: 9 });
  // pier planks
  c.fillStyle = hgrad(c, 0, 10, [[0, '#a8794a'], [1, '#6a4528']]);
  c.fillRect(66, 46, 12, 40); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.strokeRect(66, 46, 12, 40); c.globalAlpha = 0.5; c.lineWidth = 0.7; c.beginPath(); for (let y = 50; y < 86; y += 4) { c.moveTo(66, y); c.lineTo(78, y); } c.stroke(); c.globalAlpha = 1;
  c.fillRect(48, 70, 30, 9); c.strokeRect(48, 70, 30, 9); c.globalAlpha = 0.5; c.beginPath(); for (let x = 52; x < 78; x += 4) { c.moveTo(x, 70); c.lineTo(x, 79); } c.stroke(); c.globalAlpha = 1;
  c.fillStyle = '#5c3a22'; [[66, 88], [78, 88], [48, 82], [76, 82]].forEach(([x, y]) => c.fillRect(x - 1, y - 4, 2, 6));
  ship(c, P, 96, 78, 1.2, '#f1ead6', -1); ship(c, P, 30, 82, 0.9, '#e8c9a0');
  // lantern + nets
  c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(72, 46); c.lineTo(72, 36); c.stroke(); c.beginPath(); c.arc(72, 35, 2.2, 0, TAU); c.fillStyle = GLOW; c.fill(); ink(c, P, 0.8); glowAt(c, 72, 35, 8, 'rgba(255,220,120,0.4)');
  c.strokeStyle = 'rgba(60,40,30,0.7)'; c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 6; i++) { c.moveTo(34 + i * 2, 24); c.lineTo(34 + i * 2, 34); } for (let j = 0; j < 4; j++) { c.moveTo(34, 26 + j * 3); c.lineTo(46, 26 + j * 3); } c.stroke();
});

const portFort = PORT('sea_fortress', 'Sea Fortress', 1.2, 1.3, (c, P, W, H, r) => {
  shadow(c, 62, 92, 50, 4, 0.2);
  blobPath(c, 60, 82, 58, 20, rng(5)); c.globalAlpha = 0.8; c.fillStyle = hgrad(c, 0, 120, [[0, '#8bbbd2'], [1, '#5890b0']]); c.fill(); c.globalAlpha = 1; foam(c, 60, 82, 58, 20, r);
  waves(c, P, r, 10, 110, 70, 94, 12);
  // rocky island
  poly(c, P, [[14, 90], [20, 76], [34, 70], [86, 70], [102, 76], [108, 90], [90, 94], [30, 94]], '#8d8680', 1.6);
  c.fillStyle = 'rgba(40,30,40,0.25)'; c.beginPath(); c.moveTo(70, 70); c.lineTo(102, 76); c.lineTo(108, 90); c.lineTo(90, 94); c.lineTo(66, 92); c.closePath(); c.fill();
  const Z = tone(P, '#a8b0b8', 0.3);
  wall(c, Z, 22, 98, 82, 20, { rnd: r, S: Z, slits: 6 });
  tower(c, Z, 26, 84, 16, 48, { rnd: r, S: Z, roof: SLATE, rh: 18, slits: 2, flag: BLUE, flagH: 8 });
  tower(c, Z, 94, 84, 16, 48, { rnd: r, S: Z, roof: SLATE, rh: 18, slits: 2, flag: BLUE, flagH: 8, fdir: -1 });
  tower(c, Z, 60, 74, 22, 56, { rnd: r, S: Z, slits: 2 });
  c.fillStyle = '#2f3440'; c.fillRect(46, 14, 28, 3); c.fillStyle = '#ffe9a0'; c.fillRect(54, 6, 12, 8); c.strokeStyle = P.ink; c.lineWidth = 1.1; c.strokeRect(54, 6, 12, 8); glowAt(c, 60, 10, 12, 'rgba(255,230,120,0.6)');
  poly(c, P, [[52, 6], [60, 0], [68, 6]], '#2f3440', 1.2);
  gate(c, P, 60, 82, 10, 14, { glow: '#2a1a14', port: true });
  // sea chain + ship
  c.strokeStyle = '#4a4a54'; c.lineWidth = 1.6; c.setLineDash([2, 1.4]); c.beginPath(); c.moveTo(34, 90); c.quadraticCurveTo(60, 98, 86, 90); c.stroke(); c.setLineDash([]);
  ship(c, P, 106, 90, 1.0, '#f1ead6', -1);
});

// ---------------------------------------------------------------- MINES & DUNGEONS
const MINE = (id, name, aspect, scale, draw) => mk(id, name, 'mine', 'Mines & Dungeons', aspect, scale, 163, draw);
function spoil(c, P, r, x, by, w, h, col = '#7d6a58') {
  c.beginPath(); c.moveTo(x, by); c.lineTo(x + w * 0.45, by - h); c.lineTo(x + w, by); c.closePath(); c.fillStyle = hgrad(c, x, w, [[0, lt(col, 0.2)], [0.5, col], [1, dk(col, 0.4)]]); c.fill(); ink(c, P, 1.2);
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + w * (0.25 + r() * 0.5), by - r() * h * 0.7, 0.8, 0, TAU); c.fillStyle = lt(col, 0.4); c.fill(); }
}

const mineEntrance = MINE('mine_entrance', 'Mine Entrance', 1.1, 1.2, (c, P, W, H, r) => {
  shadow(c, 56, 92, 46, 5);
  mount(c, P, 6, 90, 82, 66, '#8a7c6a', r, { apex: 0.45 });
  mount(c, P, 56, 90, 50, 40, '#7a6e5e', r, { apex: 0.5 });
  // timber portal
  c.beginPath(); c.moveTo(34, 90); c.lineTo(34, 62); c.lineTo(66, 62); c.lineTo(66, 90); c.closePath(); c.fillStyle = '#120c12'; c.fill();
  glowAt(c, 50, 80, 20, 'rgba(255,170,60,0.22)');
  const T = '#7b5232'; [[30, 60, 6, 32], [64, 60, 6, 32], [28, 56, 44, 6]].forEach(([x, y, w, h]) => { c.fillStyle = hgrad(c, x, w, [[0, '#a8794a'], [0.6, T], [1, '#4b301f']]); c.fillRect(x, y, w, h); c.beginPath(); c.rect(x, y, w, h); ink(c, P, 1.4); });
  c.fillStyle = '#e8d8a8'; c.fillRect(42, 52, 16, 5); c.strokeStyle = P.ink; c.lineWidth = 0.9; c.strokeRect(42, 52, 16, 5);
  // rails + cart
  c.strokeStyle = '#3a3a44'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(44, 90); c.lineTo(40, 98); c.moveTo(56, 90); c.lineTo(62, 98); c.stroke();
  c.strokeStyle = '#6a4528'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 3; i++) { const y = 92 + i * 2.4; c.moveTo(43 - i * 1.4, y); c.lineTo(57 + i * 1.8, y); } c.stroke();
  c.fillStyle = '#6a6a74'; poly(c, P, [[68, 88], [84, 88], [82, 80], [70, 80]], '#6a6a74', 1.2); c.beginPath(); c.arc(72, 90, 2, 0, TAU); c.arc(80, 90, 2, 0, TAU); c.fillStyle = '#2a2a30'; c.fill();
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(71 + i * 2.6, 79, 1.6, 0, TAU); c.fillStyle = i % 2 ? '#d9c25a' : '#9a9aa6'; c.fill(); }
  spoil(c, P, r, 84, 92, 28, 14); spoil(c, P, r, 6, 92, 20, 9);
  // headframe
  c.strokeStyle = '#5c3a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, 92); c.lineTo(16, 56); c.lineTo(24, 92); c.moveTo(12, 78); c.lineTo(20, 78); c.stroke(); c.beginPath(); c.arc(16, 54, 4, 0, TAU); c.fillStyle = '#6a6a74'; c.fill(); ink(c, P, 1.1);
  [[36, 58], [64, 58]].forEach(([x, y]) => { c.fillStyle = '#2a2a30'; c.fillRect(x - 1, y - 7, 2, 4); c.beginPath(); c.arc(x, y - 3, 2.2, 0, TAU); c.fillStyle = GLOW; c.fill(); ink(c, P, 0.8); });
  smoke(c, 90, 66, 0, 0);
});

const dungeonDoor = MINE('dungeon_entrance', 'Dungeon Entrance', 0.95, 1.2, (c, P, W, H, r) => {
  const Z = tone(P, '#8c8a96', 0.3);
  shadow(c, 48, 92, 38, 5);
  // earth mound
  c.beginPath(); c.moveTo(4, 90); c.bezierCurveTo(8, 40, 40, 30, 52, 32); c.bezierCurveTo(70, 34, 88, 50, 92, 90); c.closePath(); c.fillStyle = hgrad(c, 4, 88, [[0, '#8fb06a'], [0.5, '#6b9a50'], [1, '#3f6a3a']]); c.fill(); ink(c, P, 1.7);
  tufts(c, P, r, 10, 86, 46, 12, '#3a6a30'); rubble(c, P, r, 6, 90, 90, 6, Z);
  // stone arch frame
  body(c, Z, 26, 50, 44, 42, { S: Z, rnd: r }); poly(c, P, [[24, 50], [26, 44], [70, 44], [72, 50]], Z.lit, 1.3);
  gate(c, P, 48, 92, 22, 36, { glow: '#0e0a14' });
  // stairs descending into dark
  for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(${150 - i * 28},${146 - i * 28},${160 - i * 26},1)`; c.fillRect(39 + i * 1.6, 92 - i * 3.4 - 3, 18 - i * 3.2, 3.4); }
  // skull keystone + torches
  skull(c, P, 48, 47, 3.8);
  [[26], [70]].forEach(([x]) => { c.fillStyle = '#4b301f'; c.fillRect(x - 1, 66, 2, 9); c.beginPath(); c.moveTo(x - 2.4, 66); c.quadraticCurveTo(x, 55, x + 2.4, 66); c.closePath(); c.fillStyle = ORANGE; c.fill(); ink(c, P, 0.8); glowAt(c, x, 62, 10, 'rgba(255,160,60,0.5)'); });
  // iron fence and bones
  c.strokeStyle = IRON; c.lineWidth = 1.1; c.beginPath(); for (let x = 8; x < 24; x += 3.6) { c.moveTo(x, 92); c.lineTo(x, 80); c.moveTo(x - 1, 82); c.lineTo(x, 79); c.lineTo(x + 1, 82); } c.moveTo(8, 86); c.lineTo(24, 86); c.stroke();
  poly(c, P, [[74, 92], [80, 88], [86, 92]], BONE, 0.8);
});

const crypt = MINE('crypt', 'Crypt Mausoleum', 1.0, 1.1, (c, P, W, H, r) => {
  const Z = tone(P, '#9a9aa8', 0.3);
  shadow(c, 50, 92, 38, 5, 0.34);
  glowAt(c, 50, 88, 36, 'rgba(120,255,160,0.1)');
  deadTree(c, P, 10, 92, 28);
  // gravestones
  [[18, 92, 1], [82, 92, 1], [74, 94, 1], [26, 95, 1]].forEach(([x, y]) => poly(c, P, [[x - 3.2, y], [x - 3.2, y - 7], [x - 1.4, y - 9.5], [x + 1.4, y - 9.5], [x + 3.2, y - 7], [x + 3.2, y]], '#a8a8b4', 1));
  // mausoleum body
  body(c, Z, 28, 54, 44, 36, { S: Z, rnd: r }); poly(c, P, [[24, 54], [50, 30], [76, 54]], Z.lit, 1.6); poly(c, P, [[50, 30], [76, 54], [50, 54]], Z.dk, 0.8);
  poly(c, P, [[34, 52], [50, 36], [66, 52]], Z.mid, 1);
  [[30], [66]].forEach(([x]) => pillar(c, P, x, 90, 5, 34, Z));
  gate(c, P, 50, 90, 12, 22, { glow: '#0e1a10' }); glowAt(c, 50, 82, 10, 'rgba(120,255,160,0.35)');
  skull(c, P, 50, 47, 3.4);
  poly(c, P, [[48, 30], [50, 24], [52, 30]], Z.mid, 0.8); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(50, 24); c.lineTo(50, 17); c.moveTo(47, 20); c.lineTo(53, 20); c.stroke();
  bat(c, P, 68, 22, 4); bat(c, P, 24, 28, 3.4);
  [[40, 91], [60, 91]].forEach(([x, y]) => { c.fillStyle = '#3a3a44'; c.fillRect(x - 1, y - 6, 2, 6); c.beginPath(); c.arc(x, y - 7, 1.8, 0, TAU); c.fillStyle = '#7cff8a'; c.fill(); });
});

// ---------------------------------------------------------------- SKY
const SKY = (id, name, aspect, scale, draw) => mk(id, name, 'sky', 'Sky Fortresses', aspect, scale, 179, draw);
function cloud(c, x, y, s, a = 0.9) {
  c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); [[0, 0, 6], [6, -3, 7], [13, 0, 6], [6, 2, 6]].forEach(([dx, dy, rr]) => { c.moveTo(x + dx * s + rr * s, y + dy * s); c.arc(x + dx * s, y + dy * s, rr * s, 0, TAU); }); c.fill();
}
function floatIsle(c, P, cx, topY, w, depth, r) {
  // grassy top + rocky underside w/ stalactites
  c.beginPath(); c.moveTo(cx - w / 2, topY); c.quadraticCurveTo(cx - w * 0.5, topY + depth * 0.4, cx - w * 0.3, topY + depth * 0.55);
  c.lineTo(cx - w * 0.2, topY + depth * 0.62); c.lineTo(cx - w * 0.14, topY + depth * 0.9); c.lineTo(cx - w * 0.05, topY + depth * 0.7); c.lineTo(cx, topY + depth); c.lineTo(cx + w * 0.07, topY + depth * 0.66); c.lineTo(cx + w * 0.15, topY + depth * 0.82); c.lineTo(cx + w * 0.22, topY + depth * 0.58); c.quadraticCurveTo(cx + w * 0.5, topY + depth * 0.4, cx + w / 2, topY);
  c.closePath(); c.fillStyle = hgrad(c, cx - w / 2, w, [[0, '#a89684'], [0.5, '#7d6a5c'], [1, '#463a40']]); c.fill(); ink(c, P, 1.8);
  c.save(); c.clip(); c.strokeStyle = P.ink; c.globalAlpha = 0.28; c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 12; i++) { const x = cx - w * 0.4 + r() * w * 0.8; c.moveTo(x, topY + depth * 0.1 + r() * depth * 0.3); c.lineTo(x + 3, topY + depth * (0.4 + r() * 0.4)); } c.stroke(); c.restore();
  c.beginPath(); c.ellipse(cx, topY, w / 2, w * 0.1, 0, 0, TAU); c.fillStyle = hgrad(c, cx - w / 2, w, [[0, '#a8d07a'], [1, '#5f9a48']]); c.fill(); ink(c, P, 1.5);
}

const skyFort = SKY('sky_fortress', 'Floating Fortress', 1.2, 1.3, (c, P, W, H, r) => {
  cloud(c, 98, 86, 1.0, 0.5);
  shadow(c, 64, 96, 30, 2.4, 0.12);
  // roots / waterfall
  c.strokeStyle = 'rgba(150,200,240,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(78, 58); c.lineTo(78, 92); c.stroke();
  floatIsle(c, P, 60, 50, 92, 40, r);
  // castle
  wall(c, P, 28, 92, 50, 14, { rnd: r, slits: 4 });
  tower(c, P, 32, 52, 12, 30, { rnd: r, roof: TEAL, rh: 14, slits: 1 });
  tower(c, P, 88, 52, 12, 30, { rnd: r, roof: TEAL, rh: 14, slits: 1 });
  body(c, P, 48, 20, 24, 32, { rnd: r }); merl(c, P, 48, 20, 24, { n: 5 });
  tower(c, P, 60, 24, 16, 22, { rnd: r, roof: BLUE, rh: 20, slits: 1, flag: GOLD, flagH: 8 });
  gate(c, P, 60, 52, 9, 14, { port: true });
  slit(c, P, 54, 32, 2.2, 6, GLOW); slit(c, P, 66, 32, 2.2, 6, GLOW);
  tree(c, P, 42, 52, 14, { col: '#58a860' });
  glowAt(c, 60, 66, 30, 'rgba(180,220,255,0.18)');
  // chains + small isles
  floatIsle(c, P, 14, 60, 18, 8, r); floatIsle(c, P, 106, 40, 14, 6, r);
});

const skySpire = SKY('sky_spire', 'Floating Spire', 0.9, 1.3, (c, P, W, H, r) => {
  c.translate(5, 10); c.scale(0.9, 0.9);
  const Z = tone(P, '#c8d0f0', 0.35);
  cloud(c, 62, 84, 0.9, 0.5);
  floatIsle(c, P, 44, 56, 54, 52, r);
  tree(c, P, 22, 58, 14, { col: '#6aa860' });
  tower(c, Z, 44, 58, 16, 40, { S: Z, rnd: r, roof: PURPLE, rh: 26, cv: 3, slits: 2, glow: ARCANE });
  gate(c, P, 44, 58, 6, 8, { glow: '#1a1c38' });
  // crystal and orbiting ring
  crystal(c, P, 44, 8, 8, 14, '#7ac6ff'); glowAt(c, 44, 2, 12, 'rgba(110,214,255,0.5)');
  c.strokeStyle = 'rgba(150,230,255,0.85)'; c.lineWidth = 1.1; c.beginPath(); c.ellipse(44, 30, 28, 5, -0.2, 0, TAU); c.stroke();
  flag(c, P, 58, 59, 9, BLUE, { dir: 1 });
  // hanging chain with crystal shards
  [[30, 70], [58, 76]].forEach(([x, y]) => crystal(c, P, x, y, 4, 8, '#a0c8ff'));
  // waterfall
  c.strokeStyle = 'rgba(150,200,240,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(66, 58); c.lineTo(66, 86); c.stroke();
});

const FIT_B = {
  human_castle: [0.025, 1.175, -0.033, 0.995],
  human_citadel: [-0.022, 1.323, -0.052, 1.008],
  elf_citadel: [-0.072, 1.195, -0.182, 0.995],
  elf_treehold: [0, 1.005, -0.06, 0.98],
  elf_moonspire: [-0.015, 0.82, -0.07, 0.99],
  dwarf_forge_hold: [-0.007, 1.087, 0.095, 0.99],
  dwarf_gate_hold: [-0.007, 1.127, 0.172, 0.99],
  dark_necro_tower: [0.025, 0.81, -0.007, 1.012],
  dark_citadel: [0.098, 1.11, -0.048, 1.022],
  drow_spire: [0.052, 0.925, -0.133, 1.01],
  tiefling_keep: [0.092, 1.028, 0.065, 1.01],
  dragon_lair: [0.033, 1.167, -0.035, 1.02],
  dragon_roost: [0.052, 0.848, -0.105, 0.99],
  halfling_folly: [0.102, 0.818, -0.007, 0.978],
  wizard_spire: [0.152, 0.8, -0.035, 0.99],
  wizard_crystal: [0.072, 0.728, -0.025, 0.99],
  shrine: [-0.037, 0.82, 0.287, 0.978],
  watchtower: [0.083, 0.637, -0.018, 0.978],
  lighthouse: [0.055, 0.765, 0.01, 0.988],
  harbour_town: [0.003, 1.327, -0.102, 0.97],
  sea_fortress: [0.013, 1.18, -0.005, 1.012],
  mine_entrance: [0.052, 1.125, 0.233, 0.993],
  crypt: [-0.007, 0.858, 0.163, 1.002],
  sky_fortress: [0.043, 1.17, -0.263, 0.94],
  sky_spire: [0.17, 0.762, 0.02, 1.077],
};
export const STAMPS_SETTLEMENTSB = ALL.map((st) => fitBox(st, FIT_B[st.id.slice(4)]));
