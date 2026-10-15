// Stamps added by the treesB workstream. Same shape as entries in stampsCatalog.js STAMPS.
// Undergrowth vegetation (veg_*): bushes, grass, ferns, reeds, mushrooms, cactus, rocks, logs.
// Drawn in a (size*aspect) x size box, light from the upper-left, soft ground shadow, crisp dark outline.
// All detail is deterministic (tiny seeded PRNG), never Math.random.

const TAU = Math.PI * 2;

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

// Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour; non-hex input is returned as-is.
function sh(c, amt) {
  const m = /^#([0-9a-f]{6})$/i.exec(c || '');
  if (!m) return c;
  const t = amt > 0 ? 255 : 0;
  const k = Math.abs(amt);
  const v = [0, 2, 4].map((i) => Math.round(parseInt(m[1].slice(i, i + 2), 16) * (1 - k) + t * k));
  return `rgb(${v[0]},${v[1]},${v[2]})`;
}

const lw = (s, f = 0.04) => Math.max(1, s * f);

function groundShadow(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,15,10,0.26)';
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.12, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Smooth lumpy closed outline
function lumpPath(ctx, cx, cy, rx, ry, n, rnd, amp = 0.18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r = 1 - amp + rnd() * amp * 1.6;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  ctx.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

// Shaded leafy dome: gradient lit from upper-left, leaf dabs, crisp outline
function leafyDome(ctx, cx, cy, rx, ry, body, outline, s, seed, dabs = 14) {
  const rnd = seeded(seed);
  lumpPath(ctx, cx, cy, rx, ry, 12, rnd, 0.2);
  const g = ctx.createRadialGradient(cx - rx * 0.4, cy - ry * 0.45, rx * 0.1, cx, cy, rx * 1.15);
  g.addColorStop(0, sh(body, 0.32));
  g.addColorStop(0.5, body);
  g.addColorStop(1, sh(body, -0.45));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < dabs; i++) {
    const a = rnd() * TAU;
    const d = Math.sqrt(rnd()) * 0.85;
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const lit = (x - cx) * -0.6 + (y - cy) * -0.8 > 0;
    ctx.strokeStyle = lit ? sh(body, 0.4) : sh(body, -0.3);
    ctx.lineWidth = Math.max(0.8, s * 0.028);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.022 + rnd() * s * 0.016, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  ctx.restore();
  lumpPath(ctx, cx, cy, rx, ry, 12, seeded(seed), 0.2);
  ctx.strokeStyle = outline;
  ctx.lineWidth = lw(s, 0.032);
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Tapered grass blade from base (x,y) to tip (tx,ty)
function blade(ctx, x, y, tx, ty, w, bend, body, outline, s) {
  const nx = -(ty - y);
  const ny = tx - x;
  const len = Math.hypot(nx, ny) || 1;
  const ux = nx / len;
  const uy = ny / len;
  const cx = (x + tx) / 2 + ux * bend;
  const cy = (y + ty) / 2 + uy * bend;
  ctx.beginPath();
  ctx.moveTo(x - ux * w, y - uy * w);
  ctx.quadraticCurveTo(cx - ux * w * 0.7, cy - uy * w * 0.7, tx, ty);
  ctx.quadraticCurveTo(cx + ux * w * 0.7, cy + uy * w * 0.7, x + ux * w, y + uy * w);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - ux * w, y - uy * w, x + ux * w, y + uy * w);
  g.addColorStop(0, sh(body, 0.3));
  g.addColorStop(1, sh(body, -0.2));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1.3, s * 0.03);
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function bladeFan(ctx, cx, by, count, hMin, hMax, spread, body, outline, s, seed, wBase) {
  const rnd = seeded(seed);
  const list = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    list.push({ a: (t - 0.5) * spread + (rnd() - 0.5) * 0.25, h: hMin + rnd() * (hMax - hMin), b: (rnd() - 0.5) * s * 0.12, o: (rnd() - 0.5) * s * 0.1 });
  }
  // back (outer) to front (centre)
  list.sort((p, q) => Math.abs(q.a) - Math.abs(p.a));
  for (const b of list) {
    const x = cx + b.o;
    blade(ctx, x, by, x + Math.sin(b.a) * b.h, by - Math.cos(b.a) * b.h, wBase, b.b, sh(body, (rnd() - 0.5) * 0.25), outline, s);
  }
}

function flower(ctx, x, y, r, petal, centre, outline, s) {
  ctx.lineJoin = 'round';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.62, 0, TAU);
    ctx.fillStyle = petal;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw(s, 0.014);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, TAU);
  ctx.fillStyle = centre;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.14, 0, TAU);
  ctx.fill();
}

// Rounded ribbed column helper used by cactus
function pill(ctx, x, y, w, h, body, outline, s) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, sh(body, 0.35));
  g.addColorStop(0.45, body);
  g.addColorStop(1, sh(body, -0.5));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = sh(body, -0.55);
  ctx.lineWidth = Math.max(0.8, s * 0.014);
  for (const f of [0.28, 0.5, 0.72]) {
    ctx.beginPath();
    ctx.moveTo(x + w * f, y + r * 0.3);
    ctx.lineTo(x + w * f, y + h);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = outline;
  ctx.lineWidth = lw(s, 0.035);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
}

// Horizontal rounded bar (cactus elbow)
function bar(ctx, x, y, w, h, body, outline, s) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, sh(body, 0.35));
  g.addColorStop(0.5, body);
  g.addColorStop(1, sh(body, -0.45));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = lw(s, 0.035);
  ctx.stroke();
}

const OUT = '#1f2a1a';

export const STAMPS_TREESB = [
  // ---------------------------------------------------------------- bushes
  {
    id: 'veg_bush_round',
    name: 'Round Bush',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_bushes',
    groupName: 'Bushes & Shrubs',
    render: (ctx, size, color = OUT, fill = '#4f8a3c') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.84, s * 0.4, s * 0.1);
      leafyDome(ctx, s * 0.64, s * 0.56, s * 0.26, s * 0.24, sh(fill, -0.18), color, s, 11, 14);
      leafyDome(ctx, s * 0.34, s * 0.6, s * 0.27, s * 0.24, sh(fill, -0.08), color, s, 12, 14);
      leafyDome(ctx, s * 0.5, s * 0.46, s * 0.3, s * 0.28, fill, color, s, 13, 26);
      ctx.restore();
    }
  },
  {
    id: 'veg_bush_berry',
    name: 'Berry Bush',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_bushes',
    groupName: 'Bushes & Shrubs',
    render: (ctx, size, color = OUT, fill = '#477c3a') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.84, s * 0.38, s * 0.1);
      leafyDome(ctx, s * 0.5, s * 0.53, s * 0.36, s * 0.3, fill, color, s, 21, 28);
      const rnd = seeded(5);
      for (let i = 0; i < 9; i++) {
        const a = rnd() * TAU;
        const d = 0.25 + rnd() * 0.65;
        const x = s * 0.5 + Math.cos(a) * s * 0.3 * d;
        const y = s * 0.5 + Math.sin(a) * s * 0.24 * d;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.04, 0, TAU);
        ctx.fillStyle = '#c3263f';
        ctx.fill();
        ctx.strokeStyle = '#4a0f1a';
        ctx.lineWidth = lw(s, 0.015);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(x - s * 0.017, y - s * 0.017, s * 0.014, s * 0.014);
      }
      ctx.restore();
    }
  },
  {
    id: 'veg_shrub_low',
    name: 'Low Shrub Row',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1.4,
    group: 'veg_bushes',
    groupName: 'Bushes & Shrubs',
    render: (ctx, size, color = OUT, fill = '#7fae4c') => {
      ctx.save();
      const s = size;
      const w = s * 1.4;
      groundShadow(ctx, w * 0.5, s * 0.8, w * 0.44, s * 0.1);
      leafyDome(ctx, w * 0.2, s * 0.6, s * 0.2, s * 0.19, sh(fill, -0.2), color, s, 31, 12);
      leafyDome(ctx, w * 0.8, s * 0.6, s * 0.2, s * 0.19, sh(fill, -0.22), color, s, 32, 12);
      leafyDome(ctx, w * 0.38, s * 0.52, s * 0.23, s * 0.22, sh(fill, -0.06), color, s, 34, 14);
      leafyDome(ctx, w * 0.62, s * 0.52, s * 0.23, s * 0.22, sh(fill, -0.1), color, s, 35, 14);
      leafyDome(ctx, w * 0.5, s * 0.42, s * 0.24, s * 0.22, fill, color, s, 33, 18);
      ctx.restore();
    }
  },
  {
    id: 'veg_thorn_scrub',
    name: 'Thorn Scrub',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_bushes',
    groupName: 'Bushes & Shrubs',
    render: (ctx, size, color = '#2a1d14', fill = '#a8975a') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.82, s * 0.36, s * 0.09);
      const rnd = seeded(41);
      ctx.lineCap = 'round';
      const twigs = [];
      for (let i = 0; i < 11; i++) {
        const a = -Math.PI / 2 + (i / 10 - 0.5) * 2.5 + (rnd() - 0.5) * 0.2;
        twigs.push({ a, l: s * (0.28 + rnd() * 0.2), c: (rnd() - 0.5) * 0.7 });
      }
      for (const [col, wd] of [[color, Math.max(3, s * 0.085)], ['#7a5a3a', Math.max(1.6, s * 0.045)], ['#b8905e', Math.max(0.8, s * 0.014)]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = wd;
        for (const t of twigs) {
          const bx = s * 0.5;
          const by = s * 0.78;
          const ex = bx + Math.cos(t.a) * t.l;
          const ey = by + Math.sin(t.a) * t.l;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo((bx + ex) / 2 + t.c * s * 0.1, (by + ey) / 2, ex, ey);
          ctx.stroke();
        }
      }
      // thorns & sparse leaves
      for (const t of twigs) {
        for (const f of [0.5, 0.8]) {
          const x = s * 0.5 + Math.cos(t.a) * t.l * f;
          const y = s * 0.78 + Math.sin(t.a) * t.l * f;
          ctx.strokeStyle = color;
          ctx.lineWidth = lw(s, 0.022);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(t.a + 1.2) * s * 0.06, y + Math.sin(t.a + 1.2) * s * 0.06);
          ctx.stroke();
        }
        const ex = s * 0.5 + Math.cos(t.a) * t.l;
        const ey = s * 0.78 + Math.sin(t.a) * t.l;
        ctx.beginPath();
        ctx.ellipse(ex, ey, s * 0.05, s * 0.028, t.a, 0, TAU);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.018);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  // ----------------------------------------------------------- grass & ferns
  {
    id: 'veg_grass_tuft',
    name: 'Grass Tuft',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.6,
    aspect: 1,
    group: 'veg_grass',
    groupName: 'Grass, Flowers & Ferns',
    render: (ctx, size, color = OUT, fill = '#6aa84a') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.86, s * 0.3, s * 0.07);
      bladeFan(ctx, s * 0.5, s * 0.86, 9, s * 0.36, s * 0.62, 1.5, fill, color, s, 51, s * 0.04);
      ctx.restore();
    }
  },
  {
    id: 'veg_grass_tall',
    name: 'Tall Wheat Grass',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.7,
    aspect: 1,
    group: 'veg_grass',
    groupName: 'Grass, Flowers & Ferns',
    render: (ctx, size, color = '#2b2414', fill = '#d2c76a') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.88, s * 0.3, s * 0.07);
      bladeFan(ctx, s * 0.5, s * 0.88, 7, s * 0.45, s * 0.72, 1.1, fill, color, s, 61, s * 0.035);
      // seed heads
      const rnd = seeded(62);
      for (let i = 0; i < 5; i++) {
        const a = (i / 4 - 0.5) * 0.9 + (rnd() - 0.5) * 0.15;
        const h = s * (0.66 + rnd() * 0.12);
        const x = s * 0.5 + Math.sin(a) * h;
        const y = s * 0.88 - Math.cos(a) * h;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.03);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s * 0.5 + Math.sin(a) * h * 0.55, s * 0.88 - Math.cos(a) * h * 0.55);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.06, s * 0.03, s * 0.08, 0, 0, TAU);
        ctx.fillStyle = '#d9c46b';
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#8a7430';
        ctx.lineWidth = lw(s, 0.012);
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(-s * 0.025, -s * 0.06 + k * s * 0.028);
          ctx.lineTo(s * 0.025, -s * 0.075 + k * s * 0.028);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  },
  {
    id: 'veg_flowers_patch',
    name: 'Flower Patch',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.7,
    aspect: 1,
    group: 'veg_grass',
    groupName: 'Grass, Flowers & Ferns',
    render: (ctx, size, color = OUT, fill = '#5a9a40') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.8, s * 0.4, s * 0.1);
      bladeFan(ctx, s * 0.32, s * 0.8, 5, s * 0.22, s * 0.38, 1.4, fill, color, s, 71, s * 0.03);
      bladeFan(ctx, s * 0.68, s * 0.8, 5, s * 0.22, s * 0.38, 1.4, fill, color, s, 72, s * 0.03);
      bladeFan(ctx, s * 0.5, s * 0.82, 7, s * 0.25, s * 0.45, 1.6, fill, color, s, 73, s * 0.03);
      const cols = ['#f3e9d0', '#e9709a', '#f2c640', '#9a7be0', '#e8643c'];
      const spots = [[0.3, 0.42], [0.55, 0.28], [0.72, 0.46], [0.44, 0.52], [0.2, 0.6], [0.8, 0.62], [0.62, 0.64]];
      spots.forEach(([fx, fy], i) => {
        ctx.strokeStyle = sh(fill, -0.45);
        ctx.lineWidth = lw(s, 0.02);
        ctx.beginPath();
        ctx.moveTo(s * (0.5 + (fx - 0.5) * 0.4), s * 0.8);
        ctx.lineTo(s * fx, s * fy);
        ctx.stroke();
        flower(ctx, s * fx, s * fy, s * (0.05 + (i % 3) * 0.006), cols[i % cols.length], i % 2 ? '#f2c640' : '#8a4a1a', color, s);
      });
      ctx.restore();
    }
  },
  {
    id: 'veg_fern',
    name: 'Fern',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_grass',
    groupName: 'Grass, Flowers & Ferns',
    render: (ctx, size, color = '#16281a', fill = '#5aa75a') => {
      ctx.save();
      const s = size;
      const bx = s * 0.5;
      const by = s * 0.84;
      groundShadow(ctx, bx, by, s * 0.34, s * 0.08);
      const fronds = [-1.25, -0.8, -0.38, 0, 0.38, 0.8, 1.25];
      const order = [0, 6, 1, 5, 2, 4, 3];
      for (const oi of order) {
        const a = fronds[oi];
        const len = s * (oi === 3 ? 0.62 : 0.5 - Math.abs(a) * 0.05);
        const ex = bx + Math.sin(a) * len;
        const ey = by - Math.cos(a) * len * 0.95;
        const cx = bx + Math.sin(a) * len * 0.35 + (a < 0 ? -1 : 1) * s * 0.03;
        const cy = by - Math.cos(a) * len * 0.8;
        const pt = (t) => {
          const u = 1 - t;
          return [u * u * bx + 2 * u * t * cx + t * t * ex, u * u * by + 2 * u * t * cy + t * t * ey, Math.atan2(2 * u * (cy - by) + 2 * t * (ey - cy), 2 * u * (cx - bx) + 2 * t * (ex - cx))];
        };
        const body = sh(fill, (oi - 3) * 0.04);
        ctx.lineJoin = 'round';
        for (let i = 0; i < 9; i++) {
          const t = 0.18 + (i / 8) * 0.8;
          const [x, y, ang] = pt(t);
          const ll = s * 0.15 * (1 - t * 0.75);
          for (const side of [-1, 1]) {
            const la = ang + side * 1.05;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(la) * ll * 0.5, y + Math.sin(la) * ll * 0.5, ll * 0.55, s * 0.03, la, 0, TAU);
            ctx.fillStyle = side * Math.cos(ang) < 0 ? sh(body, 0.22) : sh(body, -0.12);
            ctx.fill();
            ctx.strokeStyle = sh(body, -0.62);
            ctx.lineWidth = Math.max(1.1, s * 0.02);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.026);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();
        ctx.strokeStyle = sh(body, 0.1);
        ctx.lineWidth = lw(s, 0.01);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  // -------------------------------------------------------- reeds & bamboo
  {
    id: 'veg_reeds',
    name: 'Reeds & Cattails',
    category: 'world_nature',
    rotate: 'fixed',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_wetland',
    groupName: 'Reeds & Bamboo',
    render: (ctx, size, color = '#1d2616', fill = '#6f9a45') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.9, s * 0.34, s * 0.07);
      bladeFan(ctx, s * 0.5, s * 0.9, 6, s * 0.4, s * 0.66, 1.3, fill, color, s, 81, s * 0.028);
      const stems = [[-0.2, 0.74], [0.0, 0.84], [0.2, 0.7], [-0.07, 0.6]];
      stems.forEach(([dx, h], i) => {
        const x0 = s * (0.5 + dx * 0.3);
        const x1 = s * (0.5 + dx);
        const top = s * (0.9 - h);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.04);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, s * 0.9);
        ctx.lineTo(x1, top);
        ctx.stroke();
        ctx.strokeStyle = sh(fill, 0.05);
        ctx.lineWidth = lw(s, 0.014);
        ctx.stroke();
        // cattail head
        const hh = s * 0.17;
        ctx.save();
        ctx.translate(x1, top);
        ctx.beginPath();
        ctx.roundRect(-s * 0.03, -hh * 0.2, s * 0.06, hh, s * 0.03);
        const g = ctx.createLinearGradient(-s * 0.03, 0, s * 0.03, 0);
        g.addColorStop(0, '#9a6a3c');
        g.addColorStop(1, '#4a2e18');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.022);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -hh * 0.2);
        ctx.lineTo(0, -hh * 0.2 - s * 0.05 - (i % 2) * s * 0.02);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
    }
  },
  {
    id: 'veg_bamboo',
    name: 'Bamboo Clump',
    category: 'world_nature',
    rotate: 'fixed',
    defaultScale: 1,
    aspect: 1,
    group: 'veg_wetland',
    groupName: 'Reeds & Bamboo',
    render: (ctx, size, color = '#16281a', fill = '#7aa843') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.92, s * 0.34, s * 0.07);
      const culms = [[0.3, 0.1, 0.05], [0.7, 0.16, 0.05], [0.5, 0.04, 0.062], [0.4, 0.24, 0.045], [0.6, 0.28, 0.045]];
      const rnd = seeded(91);
      // back culms first
      const order = [3, 4, 0, 1, 2];
      for (const ci of order) {
        const [cx, top, wd] = culms[ci];
        const x = s * cx;
        const w = s * wd;
        const y0 = s * top;
        const y1 = s * 0.92;
        const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
        g.addColorStop(0, sh(fill, 0.4));
        g.addColorStop(0.4, fill);
        g.addColorStop(1, sh(fill, -0.45));
        ctx.fillStyle = g;
        ctx.fillRect(x - w, y0, w * 2, y1 - y0);
        ctx.beginPath();
        ctx.ellipse(x, y0, w, w * 0.55, 0, 0, TAU);
        ctx.fillStyle = g;
        ctx.fill();
        const nodes = 4;
        for (let n = 1; n <= nodes; n++) {
          const ny = y0 + ((y1 - y0) * n) / (nodes + 0.6);
          ctx.fillStyle = sh(fill, -0.3);
          ctx.beginPath();
          ctx.roundRect(x - w * 1.2, ny - s * 0.016, w * 2.4, s * 0.034, s * 0.014);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = lw(s, 0.022);
          ctx.stroke();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.035);
        ctx.beginPath();
        ctx.moveTo(x - w, y0);
        ctx.lineTo(x - w, y1);
        ctx.moveTo(x + w, y0);
        ctx.lineTo(x + w, y1);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x, y0, w, w * 0.55, 0, 0, TAU);
        ctx.fillStyle = sh(fill, 0.25);
        ctx.fill();
        ctx.stroke();
        // leaf sprays near the top
        for (let l = 0; l < 4; l++) {
          const side = l % 2 ? 1 : -1;
          const ly = y0 + s * (0.06 + l * 0.06);
          const len = s * (0.15 + rnd() * 0.05);
          ctx.save();
          ctx.translate(x, ly);
          ctx.rotate(side * (0.9 + rnd() * 0.3) - Math.PI / 2 + (side > 0 ? Math.PI : 0) * 0);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(len * 0.5, -s * 0.03, len, 0);
          ctx.quadraticCurveTo(len * 0.5, s * 0.025, 0, 0);
          ctx.fillStyle = sh(fill, l % 2 ? 0.1 : -0.1);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = lw(s, 0.018);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    }
  },

  // -------------------------------------------------------------- mushrooms
  {
    id: 'veg_mushrooms',
    name: 'Mushroom Cluster',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.7,
    aspect: 1,
    group: 'veg_fungi',
    groupName: 'Mushrooms',
    render: (ctx, size, color = '#2a1612', fill = '#c9342b') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.84, s * 0.38, s * 0.08);
      const items = [
        { x: 0.28, y: 0.84, h: 0.34, r: 0.17, cap: sh(fill, -0.25), spots: false },
        { x: 0.74, y: 0.82, h: 0.3, r: 0.15, cap: '#b98a52', spots: false },
        { x: 0.5, y: 0.86, h: 0.46, r: 0.25, cap: fill, spots: true }
      ];
      for (const m of items) {
        const x = s * m.x;
        const y = s * m.y;
        const h = s * m.h;
        const r = s * m.r;
        // stem
        ctx.beginPath();
        ctx.moveTo(x - r * 0.28, y);
        ctx.quadraticCurveTo(x - r * 0.2, y - h * 0.5, x - r * 0.24, y - h * 0.8);
        ctx.lineTo(x + r * 0.24, y - h * 0.8);
        ctx.quadraticCurveTo(x + r * 0.3, y - h * 0.5, x + r * 0.36, y);
        ctx.closePath();
        const g = ctx.createLinearGradient(x - r * 0.3, 0, x + r * 0.35, 0);
        g.addColorStop(0, '#f6efe0');
        g.addColorStop(1, '#bba98a');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.03);
        ctx.lineJoin = 'round';
        ctx.stroke();
        // cap
        const cy = y - h * 0.8;
        ctx.beginPath();
        ctx.moveTo(x - r, cy);
        ctx.bezierCurveTo(x - r, cy - r * 1.35, x + r, cy - r * 1.35, x + r, cy);
        ctx.quadraticCurveTo(x, cy + r * 0.28, x - r, cy);
        ctx.closePath();
        const cg = ctx.createRadialGradient(x - r * 0.4, cy - r * 0.7, r * 0.1, x, cy - r * 0.3, r * 1.3);
        cg.addColorStop(0, sh(m.cap, 0.35));
        cg.addColorStop(0.5, m.cap);
        cg.addColorStop(1, sh(m.cap, -0.45));
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.save();
        ctx.clip();
        if (m.spots) {
          ctx.fillStyle = '#f8f1dc';
          for (const [dx, dy, rr] of [[-0.45, -0.55, 0.16], [0.1, -0.85, 0.13], [0.5, -0.5, 0.15], [-0.1, -0.35, 0.1]]) {
            ctx.beginPath();
            ctx.ellipse(x + dx * r, cy + dy * r, rr * r, rr * r * 0.7, 0, 0, TAU);
            ctx.fill();
          }
        }
        ctx.restore();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.035);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  // ---------------------------------------------------------------- cactus
  {
    id: 'veg_cactus_saguaro',
    name: 'Saguaro Cactus',
    category: 'world_nature',
    rotate: 'fixed',
    defaultScale: 1,
    aspect: 1,
    group: 'veg_desert',
    groupName: 'Desert Plants',
    render: (ctx, size, color = '#16281a', fill = '#4f8f4a') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.92, s * 0.3, s * 0.06);
      // arms (behind main trunk)
      pill(ctx, s * 0.14, s * 0.34, s * 0.14, s * 0.3, fill, color, s);
      bar(ctx, s * 0.16, s * 0.54, s * 0.32, s * 0.14, fill, color, s);
      pill(ctx, s * 0.72, s * 0.2, s * 0.14, s * 0.4, fill, color, s);
      bar(ctx, s * 0.52, s * 0.46, s * 0.3, s * 0.14, fill, color, s);
      pill(ctx, s * 0.37, s * 0.06, s * 0.26, s * 0.86, fill, color, s);
      // flowers on top
      flower(ctx, s * 0.5, s * 0.1, s * 0.035, '#f6efe0', '#f2c640', color, s);
      flower(ctx, s * 0.79, s * 0.21, s * 0.03, '#f6efe0', '#f2c640', color, s);
      ctx.restore();
    }
  },
  {
    id: 'veg_cactus_barrel',
    name: 'Barrel Cactus',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.7,
    aspect: 1,
    group: 'veg_desert',
    groupName: 'Desert Plants',
    render: (ctx, size, color = '#16281a', fill = '#5a9a4a') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.58;
      groundShadow(ctx, cx, s * 0.86, s * 0.34, s * 0.08);
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.3, s * 0.3, 0, 0, TAU);
      const g = ctx.createRadialGradient(cx - s * 0.12, cy - s * 0.14, s * 0.04, cx, cy, s * 0.34);
      g.addColorStop(0, sh(fill, 0.35));
      g.addColorStop(0.5, fill);
      g.addColorStop(1, sh(fill, -0.5));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      ctx.clip();
      // ribs
      ctx.strokeStyle = sh(fill, -0.5);
      ctx.lineWidth = lw(s, 0.018);
      for (const f of [-0.75, -0.4, 0, 0.4, 0.75]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.3);
        ctx.quadraticCurveTo(cx + f * s * 0.5, cy, cx + f * s * 0.2, cy + s * 0.3);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.04);
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.3, s * 0.3, 0, 0, TAU);
      ctx.stroke();
      // spine tufts
      ctx.strokeStyle = '#efe6c4';
      ctx.lineWidth = lw(s, 0.012);
      ctx.lineCap = 'round';
      for (const [dx, dy] of [[-0.14, -0.14], [0.1, -0.2], [-0.2, 0.04], [0.18, -0.02], [-0.05, 0.1], [0.1, 0.2], [-0.15, 0.2]]) {
        const x = cx + dx * s;
        const y = cy + dy * s;
        for (const a of [-0.9, -0.3, 0.3, 0.9]) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.sin(a) * s * 0.035, y - Math.cos(a) * s * 0.035);
          ctx.stroke();
        }
      }
      flower(ctx, cx, cy - s * 0.3, s * 0.045, '#f0709a', '#f2c640', color, s);
      ctx.restore();
    }
  },
  {
    id: 'veg_cactus_prickly',
    name: 'Prickly Pear',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_desert',
    groupName: 'Desert Plants',
    render: (ctx, size, color = '#16281a', fill = '#5f9a55') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.86, s * 0.34, s * 0.07);
      const pads = [
        { x: 0.48, y: 0.7, rx: 0.2, ry: 0.15, a: 0 },
        { x: 0.3, y: 0.46, rx: 0.15, ry: 0.19, a: -0.35 },
        { x: 0.66, y: 0.45, rx: 0.15, ry: 0.2, a: 0.3 },
        { x: 0.5, y: 0.26, rx: 0.13, ry: 0.17, a: 0.05 }
      ];
      pads.forEach((p, i) => {
        ctx.save();
        ctx.translate(s * p.x, s * p.y);
        ctx.rotate(p.a);
        ctx.beginPath();
        ctx.ellipse(0, 0, s * p.rx, s * p.ry, 0, 0, TAU);
        const g = ctx.createRadialGradient(-s * p.rx * 0.4, -s * p.ry * 0.4, s * 0.02, 0, 0, s * p.ry * 1.2);
        g.addColorStop(0, sh(fill, 0.3));
        g.addColorStop(0.55, sh(fill, (i % 2) * 0.06));
        g.addColorStop(1, sh(fill, -0.42));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.035);
        ctx.stroke();
        ctx.fillStyle = '#efe6c4';
        for (const [dx, dy] of [[-0.4, -0.3], [0.1, -0.5], [0.45, -0.1], [-0.2, 0.2], [0.25, 0.4], [-0.5, 0.25]]) {
          ctx.fillRect(dx * s * p.rx - s * 0.008, dy * s * p.ry - s * 0.008, s * 0.016, s * 0.016);
        }
        ctx.restore();
      });
      // fruit
      for (const [fx, fy] of [[0.4, 0.14], [0.6, 0.15], [0.2, 0.3]]) {
        ctx.beginPath();
        ctx.ellipse(s * fx, s * fy, s * 0.035, s * 0.045, 0.3, 0, TAU);
        ctx.fillStyle = '#c8326a';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.02);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  // ----------------------------------------------------- rocks, logs, stumps
  {
    id: 'veg_rock_mossy',
    name: 'Mossy Rock',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.8,
    aspect: 1,
    group: 'veg_debris',
    groupName: 'Rocks, Logs & Stumps',
    render: (ctx, size, color = '#1d1a18', fill = '#8d8a82') => {
      ctx.save();
      const s = size;
      groundShadow(ctx, s * 0.5, s * 0.82, s * 0.4, s * 0.09);
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(s * 0.12, s * 0.78);
        ctx.lineTo(s * 0.1, s * 0.5);
        ctx.lineTo(s * 0.26, s * 0.3);
        ctx.lineTo(s * 0.5, s * 0.22);
        ctx.lineTo(s * 0.74, s * 0.32);
        ctx.lineTo(s * 0.9, s * 0.54);
        ctx.lineTo(s * 0.88, s * 0.78);
        ctx.closePath();
      };
      path();
      const g = ctx.createLinearGradient(s * 0.15, s * 0.2, s * 0.85, s * 0.8);
      g.addColorStop(0, sh(fill, 0.25));
      g.addColorStop(1, sh(fill, -0.4));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      path();
      ctx.clip();
      // facets
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.22);
      ctx.lineTo(s * 0.56, s * 0.52);
      ctx.lineTo(s * 0.88, s * 0.78);
      ctx.lineTo(s * 0.9, s * 0.54);
      ctx.lineTo(s * 0.74, s * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(s * 0.1, s * 0.5);
      ctx.lineTo(s * 0.26, s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.22);
      ctx.lineTo(s * 0.44, s * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = lw(s, 0.018);
      ctx.beginPath();
      ctx.moveTo(s * 0.44, s * 0.46);
      ctx.lineTo(s * 0.56, s * 0.52);
      ctx.lineTo(s * 0.5, s * 0.8);
      ctx.moveTo(s * 0.44, s * 0.46);
      ctx.lineTo(s * 0.26, s * 0.62);
      ctx.stroke();
      // moss cap and drips
      const moss = '#5f8a3a';
      ctx.fillStyle = moss;
      ctx.beginPath();
      ctx.moveTo(s * 0.18, s * 0.42);
      ctx.quadraticCurveTo(s * 0.3, s * 0.2, s * 0.5, s * 0.2);
      ctx.quadraticCurveTo(s * 0.74, s * 0.24, s * 0.82, s * 0.44);
      ctx.quadraticCurveTo(s * 0.74, s * 0.36, s * 0.66, s * 0.42);
      ctx.quadraticCurveTo(s * 0.6, s * 0.34, s * 0.52, s * 0.4);
      ctx.quadraticCurveTo(s * 0.44, s * 0.5, s * 0.38, s * 0.4);
      ctx.quadraticCurveTo(s * 0.28, s * 0.36, s * 0.18, s * 0.42);
      ctx.fill();
      ctx.fillStyle = 'rgba(190,230,130,0.4)';
      ctx.beginPath();
      ctx.ellipse(s * 0.36, s * 0.28, s * 0.1, s * 0.035, -0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = moss;
      ctx.beginPath();
      ctx.ellipse(s * 0.2, s * 0.74, s * 0.08, s * 0.045, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      path();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.045);
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  },
  {
    id: 'veg_log_fallen',
    name: 'Fallen Log',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.9,
    aspect: 1.25,
    group: 'veg_debris',
    groupName: 'Rocks, Logs & Stumps',
    render: (ctx, size, color = '#1e140d', fill = '#8a5a34') => {
      ctx.save();
      const s = size;
      const w = s * 1.25;
      const top = s * 0.3;
      const hgt = s * 0.4;
      const x0 = w * 0.16;
      const x1 = w * 0.94;
      groundShadow(ctx, w * 0.55, top + hgt + s * 0.04, w * 0.42, s * 0.09);
      // branch stub behind
      ctx.fillStyle = sh(fill, -0.3);
      ctx.beginPath();
      ctx.moveTo(w * 0.55, top + s * 0.02);
      ctx.lineTo(w * 0.6, top - s * 0.14);
      ctx.lineTo(w * 0.68, top - s * 0.12);
      ctx.lineTo(w * 0.68, top + s * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.035);
      ctx.lineJoin = 'round';
      ctx.stroke();
      // body
      ctx.beginPath();
      ctx.moveTo(x0, top);
      ctx.lineTo(x1 - s * 0.03, top);
      ctx.quadraticCurveTo(x1 + s * 0.04, top + hgt / 2, x1 - s * 0.03, top + hgt);
      ctx.lineTo(x0, top + hgt);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, top, 0, top + hgt);
      g.addColorStop(0, sh(fill, 0.3));
      g.addColorStop(0.45, fill);
      g.addColorStop(1, sh(fill, -0.5));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      ctx.clip();
      // bark grooves
      ctx.strokeStyle = sh(fill, -0.55);
      ctx.lineWidth = lw(s, 0.018);
      const rnd = seeded(101);
      for (let i = 0; i < 9; i++) {
        const y = top + hgt * (0.12 + i * 0.1);
        const xa = x0 + rnd() * w * 0.5;
        ctx.beginPath();
        ctx.moveTo(xa, y);
        ctx.lineTo(xa + w * (0.12 + rnd() * 0.22), y + (rnd() - 0.5) * s * 0.02);
        ctx.stroke();
      }
      // moss patch
      ctx.fillStyle = '#5f8a3a';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, top + s * 0.03, w * 0.16, s * 0.045, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,235,140,0.45)';
      ctx.beginPath();
      ctx.ellipse(w * 0.47, top + s * 0.015, w * 0.08, s * 0.018, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.04);
      ctx.beginPath();
      ctx.moveTo(x0, top);
      ctx.lineTo(x1 - s * 0.03, top);
      ctx.quadraticCurveTo(x1 + s * 0.04, top + hgt / 2, x1 - s * 0.03, top + hgt);
      ctx.lineTo(x0, top + hgt);
      ctx.stroke();
      // cut end face with growth rings
      const ex = x0;
      const ey = top + hgt / 2;
      ctx.beginPath();
      ctx.ellipse(ex, ey, s * 0.08, hgt / 2, 0, 0, TAU);
      ctx.fillStyle = '#d9b27a';
      ctx.fill();
      ctx.strokeStyle = '#8a5f30';
      ctx.lineWidth = lw(s, 0.014);
      for (const f of [0.7, 0.45, 0.2]) {
        ctx.beginPath();
        ctx.ellipse(ex, ey, s * 0.08 * f, (hgt / 2) * f, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(ex, ey, s * 0.08, hgt / 2, 0, 0, TAU);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.04);
      ctx.stroke();
      ctx.restore();
    }
  },
  {
    id: 'veg_stump',
    name: 'Tree Stump',
    category: 'world_nature',
    rotate: 'tilt',
    defaultScale: 0.7,
    aspect: 1,
    group: 'veg_debris',
    groupName: 'Rocks, Logs & Stumps',
    render: (ctx, size, color = '#1e140d', fill = '#7e5230') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      groundShadow(ctx, cx, s * 0.84, s * 0.38, s * 0.09);
      const topY = s * 0.38;
      const rx = s * 0.24;
      const ry = s * 0.1;
      // body with root flare
      ctx.beginPath();
      ctx.moveTo(cx - rx, topY);
      ctx.lineTo(cx - rx * 0.95, s * 0.66);
      ctx.quadraticCurveTo(cx - rx * 1.2, s * 0.78, cx - rx * 1.7, s * 0.84);
      ctx.quadraticCurveTo(cx - rx * 0.6, s * 0.82, cx - rx * 0.2, s * 0.86);
      ctx.quadraticCurveTo(cx + rx * 0.6, s * 0.86, cx + rx * 1.7, s * 0.84);
      ctx.quadraticCurveTo(cx + rx * 1.2, s * 0.78, cx + rx * 0.95, s * 0.66);
      ctx.lineTo(cx + rx, topY);
      ctx.closePath();
      const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      g.addColorStop(0, sh(fill, 0.25));
      g.addColorStop(0.5, fill);
      g.addColorStop(1, sh(fill, -0.55));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.04);
      ctx.lineJoin = 'round';
      ctx.stroke();
      // bark ridges
      ctx.strokeStyle = sh(fill, -0.55);
      ctx.lineWidth = lw(s, 0.018);
      for (const f of [-0.55, -0.2, 0.15, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(cx + rx * f, topY + ry * 0.7);
        ctx.quadraticCurveTo(cx + rx * f * 1.1, s * 0.58, cx + rx * f * 1.25, s * 0.78);
        ctx.stroke();
      }
      // moss
      ctx.fillStyle = '#5f8a3a';
      ctx.beginPath();
      ctx.ellipse(cx - rx * 0.6, s * 0.7, s * 0.07, s * 0.03, 0.2, 0, TAU);
      ctx.fill();
      // cut top with rings
      ctx.beginPath();
      ctx.ellipse(cx, topY, rx, ry, 0, 0, TAU);
      ctx.fillStyle = '#d9b27a';
      ctx.fill();
      ctx.strokeStyle = '#8a5f30';
      ctx.lineWidth = lw(s, 0.014);
      for (const f of [0.75, 0.52, 0.3, 0.12]) {
        ctx.beginPath();
        ctx.ellipse(cx + rx * 0.03 * (1 - f), topY, rx * f, ry * f, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx - rx * 0.3, topY - ry * 0.35, rx * 0.35, ry * 0.2, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, topY, rx, ry, 0, 0, TAU);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.04);
      ctx.stroke();
      ctx.restore();
    }
  }
];
