// InkForge Land Stamps - Extra Viewing Directions
// Views for mountain, volcanic, plateau, hill, and vegetation debris stamps.
// All art adheres to: light from upper-left, soft ground shadow, crisp dark ink outlines.
// All detail is strictly deterministic via seeded PRNG, never Math.random.

const TAU = Math.PI * 2;

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || ''));
  if (!m) return [128, 128, 128];
  let s = m[1];
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.substr(i, 2), 16));
}

function sh(c, amt) {
  const [r, g, b] = hexToRgb(c);
  const target = amt > 0 ? 255 : 0;
  const k = Math.min(1, Math.max(0, Math.abs(amt)));
  const nr = Math.round(r * (1 - k) + target * k);
  const ng = Math.round(g * (1 - k) + target * k);
  const nb = Math.round(b * (1 - k) + target * k);
  return `rgb(${nr},${ng},${nb})`;
}

const lw = (s, f = 0.04) => Math.max(1, s * f);

function groundShadow(ctx, x, y, rx, ry, alpha = 0.25) {
  ctx.save();
  ctx.fillStyle = `rgba(30, 22, 16, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.08, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

import { inkRng, inkPoly, inkShadow, inkStroke, inkHatch, inkPeak, inkMound } from './inkHelpers.js';

// Plan view of an inked peak, matching inkPeak: jagged rim, lit north-west half,
// shaded south-east half with hatching, ridges from the summit, optional snow cap.
function inkTopPeak(ctx, s, cx, cy, rx, ry, o) {
  const r = inkRng(o.seed || 1), n = 16, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (r() - 0.5) * 0.2, k = 0.84 + r() * 0.2;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const lw = s * (o.lw || 0.03);
  if (o.shadow !== false) inkShadow(ctx, cx + rx * 0.08, cy + ry * 0.1, rx, ry * 0.98, 0.2);
  inkPoly(ctx, pts); ctx.fillStyle = o.lit; ctx.fill();
  ctx.save(); inkPoly(ctx, pts); ctx.clip();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, 'rgba(255,250,235,0.35)'); g.addColorStop(1, 'rgba(60,40,25,0.12)');
  ctx.fillStyle = g; ctx.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4);
  inkPoly(ctx, [[cx - rx * 2, cy + ry * 2], [cx + rx * 2, cy - ry * 2], [cx + rx * 2, cy + ry * 2]]); ctx.fillStyle = o.shade; ctx.fill();
  const segs = [];
  for (let k = 1; k <= 5; k++) {
    const a = -Math.PI / 4 + (k / 6) * Math.PI;
    segs.push([cx + Math.cos(a) * rx * 0.35, cy + Math.sin(a) * ry * 0.35, cx + Math.cos(a) * rx * 0.85, cy + Math.sin(a) * ry * 0.85]);
  }
  inkHatch(ctx, o.color, lw * 0.45, segs, 0.55);
  if (o.snow) {
    const sp = pts.map(([x, y]) => { const k = o.snow * (0.8 + r() * 0.4); return [cx + (x - cx) * k, cy + (y - cy) * k]; });
    inkPoly(ctx, sp); ctx.fillStyle = o.snowCol || '#fbfbf7'; ctx.fill();
    ctx.save(); inkPoly(ctx, sp); ctx.clip();
    inkPoly(ctx, [[cx - rx * 2, cy + ry * 2], [cx + rx * 2, cy - ry * 2], [cx + rx * 2, cy + ry * 2]]); ctx.fillStyle = o.snowShade || '#c6d0dc'; ctx.fill();
    ctx.restore();
    inkPoly(ctx, sp); ctx.globalAlpha = 0.85; inkStroke(ctx, o.color, lw * 0.5); ctx.globalAlpha = 1;
  }
  ctx.restore();
  const rid = [];
  for (let i = 1; i < n; i += 3) rid.push([cx, cy, cx + (pts[i][0] - cx) * 0.92, cy + (pts[i][1] - cy) * 0.92]);
  inkHatch(ctx, o.color, lw * 0.6, rid, 0.9);
  inkPoly(ctx, pts); inkStroke(ctx, o.color, lw);
}

// One dune exactly as the base hills_dunes draws it (windward slope, knife crest, shaded lee).
function inkDune(ctx, w, h, color, fill, x0, cx, cy, x1, by) {
  const sil = () => {
    ctx.beginPath(); ctx.moveTo(x0 * w, by * h);
    ctx.bezierCurveTo((x0 + (cx - x0) * 0.5) * w, by * h, (cx - (cx - x0) * 0.25) * w, cy * h, cx * w, cy * h);
    ctx.bezierCurveTo((cx + (x1 - cx) * 0.25) * w, cy * h, (cx + (x1 - cx) * 0.5) * w, by * h, x1 * w, by * h);
  };
  const crest = () => {
    ctx.beginPath(); ctx.moveTo(cx * w, cy * h);
    ctx.bezierCurveTo((cx - 0.02) * w, (cy + (by - cy) * 0.4) * h, (cx + 0.06) * w, (by - 0.05) * h, (cx + (x1 - cx) * 0.25) * w, by * h);
  };
  sil(); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  ctx.save(); ctx.clip();
  crest(); ctx.lineTo(w, by * h); ctx.lineTo(w, 0); ctx.closePath();
  ctx.fillStyle = 'rgba(150,80,20,0.35)'; ctx.fill();
  const segs = [];
  for (let k = 1; k <= 3; k++) { const t = k / 4, yy = (cy + (by - cy) * t) * h, xx = (cx - (cx - x0) * t * 0.7) * w; segs.push([xx - (cx - x0) * w * 0.18, yy + h * 0.015, xx, yy]); }
  inkHatch(ctx, color, h * 0.01, segs, 0.55);
  ctx.restore();
  sil(); inkStroke(ctx, color, h * 0.03);
  crest(); inkStroke(ctx, color, h * 0.016);
}

// Plan view of the inked volcano: cone, crater with lava throat, lava run, smoke puffs.
function inkTopVolcano(ctx, s, w, color, fill, lite) {
  const cx = w * 0.5, cy = s * 0.54;
  inkTopPeak(ctx, s, cx, cy, w * 0.42, s * 0.4, { seed: 11, lit: fill, shade: 'rgba(15,8,5,0.42)', color });
  const run = (pts, wd) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0] * w, pts[0][1] * s);
    for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * s, pts[i + 1][0] * w, pts[i + 1][1] * s);
    inkStroke(ctx, '#7c2d12', s * wd * 1.7); ctx.stroke();
    inkStroke(ctx, '#f97316', s * wd); ctx.stroke();
    inkStroke(ctx, '#fde047', s * wd * 0.35); ctx.stroke();
  };
  run([[0.44, 0.6], [0.36, 0.66], [0.33, 0.74], [0.3, 0.8], [0.24, 0.84]], 0.022);
  if (!lite) run([[0.56, 0.6], [0.62, 0.68], [0.6, 0.76], [0.58, 0.82], [0.62, 0.88]], 0.016);
  ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.12, s * 0.11, 0, 0, TAU);
  ctx.fillStyle = '#1c1210'; ctx.fill(); inkStroke(ctx, color, s * 0.022);
  ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.075, s * 0.065, 0, 0, TAU); ctx.fillStyle = '#f97316'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - w * 0.015, cy - s * 0.015, w * 0.035, s * 0.03, 0, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill();
  const puffs = lite ? [[0.6, 0.4, 0.06], [0.7, 0.28, 0.07]] : [[0.6, 0.42, 0.065], [0.68, 0.3, 0.08], [0.8, 0.2, 0.07], [0.56, 0.3, 0.055]];
  for (const [x, y, rr] of puffs) {
    ctx.beginPath(); ctx.arc(x * w, y * s, rr * s, 0, TAU);
    ctx.fillStyle = '#b9b2a8'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.beginPath(); ctx.arc(x * w + rr * s * 0.35, y * s + rr * s * 0.35, rr * s, 0, TAU); ctx.fillStyle = '#8f877d'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x * w, y * s, rr * s, 0, TAU); inkStroke(ctx, color, s * 0.018);
  }
}

export const STAMPS_VIEWS_LAND = [
  // =========================================================================
  // mountain_grand
  // =========================================================================
  {
    id: 'mountain_grand_diag',
    name: 'Grand Mountain Peak (Diag)',
    family: 'mountain_grand',
    view: 'diag',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains',
    groupName: 'Mountain Peaks',
    defaultScale: 1.2,
    aspect: 1.15,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      const w = size * 1.15, h = size;
      ctx.save();
      inkShadow(ctx, w * 0.52, h * 0.87, w * 0.46, h * 0.05);
      // the same snow-capped peak turned: summit off-centre, a long shaded east flank and a shoulder
      inkPeak(ctx, h, w * 0.5, w * 0.97, h * 0.88, w * 0.7, h * 0.42, { seed: 6, lit: fill, shade: 'rgba(70,52,40,0.38)', color, hatch: 4 });
      inkPeak(ctx, h, w * 0.04, w * 0.86, h * 0.87, w * 0.38, h * 0.1, { seed: 3, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.3 });
      ctx.restore();
    }
  },
  {
    id: 'mountain_grand_top',
    name: 'Grand Mountain Peak (Top)',
    family: 'mountain_grand',
    view: 'top',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains',
    groupName: 'Mountain Peaks',
    defaultScale: 1.2,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      const w = size, h = size;
      ctx.save();
      inkTopPeak(ctx, h, w * 0.5, h * 0.5, w * 0.42, h * 0.4, { seed: 3, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.38 });
      ctx.restore();
    }
  },

  // =========================================================================
  // mountain_range
  // =========================================================================
  {
    id: 'mountain_range_diag',
    name: 'Mountain Ridge Cluster (Diag)',
    family: 'mountain_range',
    view: 'diag',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains',
    groupName: 'Mountain Peaks',
    defaultScale: 1.4,
    aspect: 1.5,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      const w = size * 1.5, h = size;
      ctx.save();
      inkShadow(ctx, w * 0.5, h * 0.86, w * 0.47, h * 0.06);
      // the base's three peaks receding diagonally: far right high, near left low
      inkPeak(ctx, h, w * 0.5, w * 0.98, h * 0.74, w * 0.76, h * 0.06, { seed: 8, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.27, hatch: 5 });
      inkPeak(ctx, h, w * 0.24, w * 0.74, h * 0.82, w * 0.5, h * 0.2, { seed: 5, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.22, hatch: 4 });
      inkPeak(ctx, h, w * 0.02, w * 0.5, h * 0.9, w * 0.24, h * 0.44, { seed: 2, lit: fill, shade: 'rgba(70,52,40,0.38)', color, hatch: 4 });
      ctx.restore();
    }
  },
  {
    id: 'mountain_range_top',
    name: 'Mountain Ridge Cluster (Top)',
    family: 'mountain_range',
    view: 'top',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains',
    groupName: 'Mountain Peaks',
    defaultScale: 1.4,
    aspect: 1.4,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      const w = size * 1.4, h = size;
      ctx.save();
      inkTopPeak(ctx, h, w * 0.5, h * 0.7, w * 0.15, h * 0.22, { seed: 2, lit: fill, shade: 'rgba(70,52,40,0.38)', color });
      inkTopPeak(ctx, h, w * 0.22, h * 0.4, w * 0.18, h * 0.3, { seed: 5, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.4 });
      inkTopPeak(ctx, h, w * 0.76, h * 0.38, w * 0.2, h * 0.32, { seed: 8, lit: fill, shade: 'rgba(70,52,40,0.34)', color, snow: 0.45 });
      ctx.restore();
    }
  },

  // =========================================================================
  // mountain_snow_peak
  // =========================================================================
  {
    id: 'mountain_snow_peak_diag',
    name: 'Glacial Horn Peak (Diag)',
    family: 'mountain_snow_peak',
    view: 'diag',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_mountains',
    groupName: 'Mountain Peaks',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#1e293b', fill = '#f8fafc') => {
      const w = size * 1.1, h = size;
      ctx.save();
      inkShadow(ctx, w * 0.52, h * 0.88, w * 0.42, h * 0.05);
      // same blue-grey rock and deep snow mantle as the base, summit pushed left so the shaded face shows
      inkPeak(ctx, h, w * 0.08, w * 0.95, h * 0.88, w * 0.4, h * 0.06, { seed: 9, lit: '#a9b4c2', shade: 'rgba(25,35,60,0.42)', color, snow: 0.55, snowCol: fill, snowShade: '#b5c6dc', hatch: 7 });
      ctx.restore();
    }
  },

  // =========================================================================
  // mountain_volcano
  // =========================================================================
  {
    id: 'mountain_volcano_top',
    name: 'Volcanic Caldera (Top)',
    family: 'mountain_volcano',
    view: 'top',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_volcanoes',
    groupName: 'Volcanoes',
    defaultScale: 1.3,
    aspect: 1.0,
    render: (ctx, size, color = '#271c19', fill = '#4a3f35') => {
      ctx.save(); inkTopVolcano(ctx, size, size, color, fill, false); ctx.restore();
    }
  },

  // =========================================================================
  // volcano_lite
  // =========================================================================
  {
    id: 'volcano_lite_top',
    name: 'Volcano (Top)',
    family: 'volcano_lite',
    view: 'top',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_volcanoes',
    groupName: 'Volcanoes',
    defaultScale: 1.2,
    aspect: 1.0,
    render: (ctx, size, color = '#271c19', fill = '#57534e') => {
      ctx.save(); inkTopVolcano(ctx, size, size, color, fill, true); ctx.restore();
    }
  },

  // =========================================================================
  // mountain_mesa
  // =========================================================================
  {
    id: 'mountain_mesa_diag',
    name: 'Desert Mesa Plateau (Diag)',
    family: 'mountain_mesa',
    view: 'diag',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_plateaus',
    groupName: 'Mesas & Plateaus',
    defaultScale: 1.3,
    aspect: 1.4,
    render: (ctx, size, color = '#451a03', fill = '#d97706') => {
      const w = size * 1.4, h = size;
      const P = (pts) => pts.map(([x, y]) => [x * w, y * h]);
      ctx.save();
      inkShadow(ctx, w * 0.52, h * 0.86, w * 0.46, h * 0.06);
      // talus apron, front cliff (lit), side cliff (shaded), sunlit table top
      const apron = P([[0.04, 0.86], [0.14, 0.7], [0.8, 0.74], [0.92, 0.66], [0.97, 0.82], [0.9, 0.88]]);
      inkPoly(ctx, apron); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = 'rgba(120,60,20,0.22)'; ctx.fill();
      const front = P([[0.16, 0.72], [0.19, 0.42], [0.66, 0.46], [0.68, 0.76]]);
      const side = P([[0.66, 0.46], [0.86, 0.32], [0.88, 0.64], [0.68, 0.76]]);
      const top = P([[0.19, 0.42], [0.38, 0.27], [0.86, 0.32], [0.66, 0.46]]);
      inkPoly(ctx, front); ctx.fillStyle = fill; ctx.fill();
      inkPoly(ctx, side); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = 'rgba(70,20,8,0.38)'; ctx.fill();
      inkPoly(ctx, top); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = 'rgba(255,240,200,0.55)'; ctx.fill();
      // strata on both cliffs and cracks
      const segs = [];
      for (const t of [0.3, 0.52, 0.74]) {
        segs.push([0.18 * w, (0.42 + 0.3 * t) * h, 0.665 * w, (0.46 + 0.3 * t) * h]);
        segs.push([0.665 * w, (0.46 + 0.3 * t) * h, 0.87 * w, (0.32 + 0.32 * t) * h]);
      }
      for (const x of [0.28, 0.4, 0.53]) segs.push([x * w, 0.45 * h, (x + 0.01) * w, 0.7 * h]);
      inkHatch(ctx, color, h * 0.011, segs, 0.45);
      inkHatch(ctx, color, h * 0.01, [[0.25 * w, 0.8 * h, 0.3 * w, 0.77 * h], [0.6 * w, 0.83 * h, 0.66 * w, 0.8 * h]], 0.5);
      inkPoly(ctx, P([[0.19, 0.42], [0.66, 0.46], [0.86, 0.32]]), false); inkStroke(ctx, color, h * 0.014);
      inkPoly(ctx, P([[0.66, 0.46], [0.68, 0.76]]), false); inkStroke(ctx, color, h * 0.014);
      inkPoly(ctx, P([[0.04, 0.86], [0.14, 0.7], [0.16, 0.72], [0.19, 0.42], [0.38, 0.27], [0.86, 0.32], [0.88, 0.64], [0.92, 0.66], [0.97, 0.82], [0.9, 0.88]])); inkStroke(ctx, color, h * 0.032);
      ctx.restore();
    }
  },
  {
    id: 'mountain_mesa_top',
    name: 'Desert Mesa Plateau (Top)',
    family: 'mountain_mesa',
    view: 'top',
    category: 'world_nature',
    rotate: 'fixed',
    group: 'geo_plateaus',
    groupName: 'Mesas & Plateaus',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#451a03', fill = '#d97706') => {
      const w = size * 1.2, h = size;
      const P = (pts) => pts.map(([x, y]) => [x * w, y * h]);
      ctx.save();
      inkShadow(ctx, w * 0.54, h * 0.55, w * 0.46, h * 0.42, 0.2);
      // talus apron ring, cliff band (shaded on the south-east), flat sunlit table
      const apron = P([[0.06, 0.48], [0.14, 0.2], [0.42, 0.08], [0.78, 0.1], [0.95, 0.34], [0.93, 0.7], [0.72, 0.92], [0.34, 0.92], [0.1, 0.76]]);
      const cliff = P([[0.16, 0.46], [0.22, 0.24], [0.44, 0.15], [0.74, 0.17], [0.86, 0.36], [0.84, 0.64], [0.68, 0.82], [0.36, 0.82], [0.18, 0.7]]);
      const table = P([[0.24, 0.45], [0.28, 0.29], [0.46, 0.22], [0.7, 0.24], [0.78, 0.38], [0.76, 0.58], [0.64, 0.72], [0.38, 0.72], [0.26, 0.62]]);
      inkPoly(ctx, apron); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = 'rgba(120,60,20,0.22)'; ctx.fill();
      inkPoly(ctx, cliff); ctx.fillStyle = fill; ctx.fill();
      ctx.save(); inkPoly(ctx, cliff); ctx.clip();
      inkPoly(ctx, P([[0, 1], [1, 0], [1, 1]])); ctx.fillStyle = 'rgba(70,20,8,0.38)'; ctx.fill();
      ctx.restore();
      inkPoly(ctx, table); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = 'rgba(255,240,200,0.55)'; ctx.fill();
      // strata contour between table and cliff edge, cracks on the table
      const mid = cliff.map(([x, y], i) => [(x + table[i][0]) / 2, (y + table[i][1]) / 2]);
      inkPoly(ctx, mid); ctx.save(); ctx.globalAlpha = 0.45; inkStroke(ctx, color, h * 0.011); ctx.restore();
      inkHatch(ctx, color, h * 0.01, [[0.4 * w, 0.36 * h, 0.48 * w, 0.42 * h], [0.55 * w, 0.52 * h, 0.62 * w, 0.5 * h], [0.36 * w, 0.58 * h, 0.42 * w, 0.62 * h]], 0.45);
      inkPoly(ctx, table); inkStroke(ctx, color, h * 0.014);
      inkPoly(ctx, apron); inkStroke(ctx, color, h * 0.032);
      inkPoly(ctx, cliff); inkStroke(ctx, color, h * 0.02);
      ctx.restore();
    }
  },

  // =========================================================================
  // hills_rolling
  // =========================================================================
  {
    id: 'hills_rolling_diag',
    name: 'Rolling Green Hills (Diag)',
    family: 'hills_rolling',
    view: 'diag',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'geo_hills',
    groupName: 'Hills & Dunes',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#2c221e', fill = '#dbe5c5') => {
      const w = size * 1.3, h = size;
      ctx.save();
      inkShadow(ctx, w * 0.52, h * 0.84, w * 0.46, h * 0.06);
      const o = { lit: fill, shade: 'rgba(50,60,30,0.28)', color };
      // the base's two mounds plus a third, staggered back to the upper right
      const far = inkMound(ctx, h, w * 0.5, w * 0.98, w * 0.76, h * 0.22, h * 0.62, o);
      far(); inkStroke(ctx, color, h * 0.028);
      const back = inkMound(ctx, h, w * 0.3, w * 0.86, w * 0.58, h * 0.36, h * 0.74, o);
      back(); inkStroke(ctx, color, h * 0.03);
      const front = inkMound(ctx, h, w * 0.02, w * 0.6, w * 0.3, h * 0.42, h * 0.86, o);
      front(); inkStroke(ctx, color, h * 0.032);
      ctx.restore();
    }
  },

  // =========================================================================
  // hills_dunes
  // =========================================================================
  {
    id: 'hills_dunes_diag',
    name: 'Desert Sand Dunes (Diag)',
    family: 'hills_dunes',
    view: 'diag',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'geo_hills',
    groupName: 'Hills & Dunes',
    defaultScale: 1.1,
    aspect: 1.3,
    render: (ctx, size, color = '#78350f', fill = '#fde68a') => {
      const w = size * 1.3, h = size;
      ctx.save();
      inkShadow(ctx, w * 0.52, h * 0.82, w * 0.46, h * 0.05, 0.18);
      // the base's two dunes, the back one set further away (higher, smaller)
      inkDune(ctx, w, h, color, fill, 0.36, 0.72, 0.24, 0.98, 0.64);
      inkDune(ctx, w, h, color, fill, 0.02, 0.4, 0.36, 0.78, 0.82);
      ctx.restore();
    }
  },

  // =========================================================================
  // veg_log_fallen
  // =========================================================================
  {
    id: 'veg_log_fallen_side',
    name: 'Fallen Log (Side)',
    family: 'veg_log_fallen',
    view: 'side',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'veg_debris',
    groupName: 'Rocks, Logs & Stumps',
    defaultScale: 0.9,
    aspect: 1.4,
    render: (ctx, size, color = '#1e140d', fill = '#8a5a34') => {
      ctx.save();
      const s = size;
      const w = s * 1.4;
      const top = s * 0.45;
      const hgt = s * 0.32;
      const x0 = w * 0.12;
      const x1 = w * 0.90;
      groundShadow(ctx, w * 0.52, top + hgt + s * 0.03, w * 0.42, s * 0.08);

      // Branch stub projecting upward
      ctx.fillStyle = sh(fill, -0.3);
      ctx.beginPath();
      ctx.moveTo(w * 0.56, top + s * 0.02);
      ctx.lineTo(w * 0.62, top - s * 0.15);
      ctx.lineTo(w * 0.68, top - s * 0.13);
      ctx.lineTo(w * 0.67, top + s * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.035);
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Log body
      const body = new Path2D();
      body.moveTo(x0, top);
      body.lineTo(x1 - s * 0.04, top + s * 0.02);
      // Splintered right broken end
      body.lineTo(x1, top + hgt * 0.4);
      body.lineTo(x1 - s * 0.03, top + hgt * 0.7);
      body.lineTo(x1 + s * 0.01, top + hgt);
      body.lineTo(x0, top + hgt);
      body.closePath();

      const g = ctx.createLinearGradient(0, top, 0, top + hgt);
      g.addColorStop(0, sh(fill, 0.28));
      g.addColorStop(0.5, fill);
      g.addColorStop(1, sh(fill, -0.5));
      ctx.fillStyle = g;
      ctx.fill(body);

      // Bark longitudinal grooves
      ctx.save();
      ctx.clip(body);
      ctx.strokeStyle = sh(fill, -0.55);
      ctx.lineWidth = lw(s, 0.018);
      const rnd = seeded(107);
      for (let i = 0; i < 7; i++) {
        const y = top + hgt * (0.15 + i * 0.12);
        const xa = x0 + rnd() * w * 0.3;
        ctx.beginPath();
        ctx.moveTo(xa, y);
        ctx.lineTo(xa + w * (0.2 + rnd() * 0.35), y + (rnd() - 0.5) * s * 0.02);
        ctx.stroke();
      }
      // Moss patch on top
      ctx.fillStyle = '#5f8a3a';
      ctx.beginPath();
      ctx.ellipse(w * 0.40, top + s * 0.02, w * 0.14, s * 0.035, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 235, 140, 0.45)';
      ctx.beginPath();
      ctx.ellipse(w * 0.38, top + s * 0.01, w * 0.07, s * 0.015, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      // Inked body outline
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.038);
      ctx.stroke(body);

      // Flat severed left end face
      ctx.beginPath();
      ctx.moveTo(x0, top);
      ctx.lineTo(x0, top + hgt);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'veg_log_fallen_top',
    name: 'Fallen Log (Top)',
    family: 'veg_log_fallen',
    view: 'top',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'veg_debris',
    groupName: 'Rocks, Logs & Stumps',
    defaultScale: 0.9,
    aspect: 1.4,
    render: (ctx, size, color = '#1e140d', fill = '#8a5a34') => {
      ctx.save();
      const s = size;
      const w = s * 1.4;
      const cy = s * 0.50;
      const r = s * 0.16;
      const x0 = w * 0.14;
      const x1 = w * 0.88;

      groundShadow(ctx, w * 0.52, cy + r + s * 0.03, w * 0.42, s * 0.08, 0.22);

      // Branch stubs extending north and south
      ctx.fillStyle = sh(fill, -0.3);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.034);
      ctx.lineJoin = 'round';

      // North branch stub
      ctx.beginPath();
      ctx.moveTo(w * 0.58, cy - r + s * 0.02);
      ctx.lineTo(w * 0.62, cy - r - s * 0.14);
      ctx.lineTo(w * 0.67, cy - r - s * 0.12);
      ctx.lineTo(w * 0.66, cy - r + s * 0.03);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // South branch stub
      ctx.beginPath();
      ctx.moveTo(w * 0.36, cy + r - s * 0.02);
      ctx.lineTo(w * 0.39, cy + r + s * 0.12);
      ctx.lineTo(w * 0.44, cy + r + s * 0.10);
      ctx.lineTo(w * 0.43, cy + r - s * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Main horizontal cylinder
      const body = new Path2D();
      body.moveTo(x0, cy - r);
      body.lineTo(x1 - s * 0.03, cy - r * 0.9);
      // Splintered jagged right end
      body.lineTo(x1, cy - r * 0.3);
      body.lineTo(x1 - s * 0.02, cy + r * 0.2);
      body.lineTo(x1 + s * 0.01, cy + r * 0.8);
      body.lineTo(x1 - s * 0.04, cy + r);
      body.lineTo(x0, cy + r);
      body.quadraticCurveTo(x0 - s * 0.04, cy, x0, cy - r);
      body.closePath();

      const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      g.addColorStop(0, sh(fill, 0.25));
      g.addColorStop(0.45, fill);
      g.addColorStop(1, sh(fill, -0.45));
      ctx.fillStyle = g;
      ctx.fill(body);

      // Longitudinal bark grooves
      ctx.save();
      ctx.clip(body);
      ctx.strokeStyle = sh(fill, -0.55);
      ctx.lineWidth = lw(s, 0.018);
      const rnd = seeded(203);
      for (let i = 0; i < 8; i++) {
        const y = cy - r + (2 * r) * (0.12 + i * 0.11);
        const xa = x0 + rnd() * w * 0.3;
        ctx.beginPath();
        ctx.moveTo(xa, y);
        ctx.lineTo(xa + w * (0.2 + rnd() * 0.35), y + (rnd() - 0.5) * s * 0.02);
        ctx.stroke();
      }

      // Moss patch along the upper edge
      ctx.fillStyle = '#5f8a3a';
      ctx.beginPath();
      ctx.ellipse(w * 0.48, cy - r * 0.6, w * 0.16, r * 0.35, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 235, 140, 0.45)';
      ctx.beginPath();
      ctx.ellipse(w * 0.46, cy - r * 0.65, w * 0.08, r * 0.18, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      // Inked outline
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.038);
      ctx.stroke(body);

      // Left rounded cut cap curve
      ctx.beginPath();
      ctx.arc(x0, cy, r, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = sh(fill, -0.4);
      ctx.lineWidth = lw(s, 0.02);
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // veg_stump
  // =========================================================================
  {
    id: 'veg_stump_side',
    name: 'Tree Stump (Side)',
    family: 'veg_stump',
    view: 'side',
    category: 'world_nature',
    rotate: 'tilt',
    group: 'veg_debris',
    groupName: 'Rocks, Logs & Stumps',
    defaultScale: 0.7,
    aspect: 1.0,
    render: (ctx, size, color = '#1e140d', fill = '#7e5230') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const topY = s * 0.38;
      const rx = s * 0.22;
      groundShadow(ctx, cx, s * 0.86, s * 0.40, s * 0.09, 0.26);

      // Body with prominent buttress roots spreading into turf
      const body = new Path2D();
      body.moveTo(cx - rx, topY);
      body.lineTo(cx - rx * 0.95, s * 0.60);
      body.quadraticCurveTo(cx - rx * 1.25, s * 0.72, cx - rx * 1.85, s * 0.85);
      body.quadraticCurveTo(cx - rx * 0.7, s * 0.83, cx - rx * 0.2, s * 0.87);
      body.quadraticCurveTo(cx + rx * 0.7, s * 0.87, cx + rx * 1.85, s * 0.85);
      body.quadraticCurveTo(cx + rx * 1.25, s * 0.72, cx + rx * 0.95, s * 0.60);
      body.lineTo(cx + rx, topY);
      body.closePath();

      const g = ctx.createLinearGradient(cx - rx * 1.5, 0, cx + rx * 1.5, 0);
      g.addColorStop(0, sh(fill, 0.25));
      g.addColorStop(0.45, fill);
      g.addColorStop(1, sh(fill, -0.55));
      ctx.fillStyle = g;
      ctx.fill(body);

      // Vertical bark grooves down trunk into roots
      ctx.strokeStyle = sh(fill, -0.55);
      ctx.lineWidth = lw(s, 0.018);
      for (const f of [-0.6, -0.2, 0.2, 0.6]) {
        ctx.beginPath();
        ctx.moveTo(cx + rx * f, topY + s * 0.02);
        ctx.quadraticCurveTo(cx + rx * f * 1.15, s * 0.62, cx + rx * f * 1.45, s * 0.82);
        ctx.stroke();
      }

      // Moss patch at root base
      ctx.fillStyle = '#5f8a3a';
      ctx.beginPath();
      ctx.ellipse(cx - rx * 0.6, s * 0.78, s * 0.09, s * 0.035, -0.15, 0, TAU);
      ctx.fill();

      // Inked outline
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.04);
      ctx.lineJoin = 'round';
      ctx.stroke(body);

      // Flat severed top cut edge
      ctx.beginPath();
      ctx.moveTo(cx - rx, topY);
      ctx.lineTo(cx + rx, topY);
      ctx.stroke();

      // Turf grass tufts around root tips
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = lw(s, 0.018);
      for (const gx of [cx - rx * 1.7, cx - rx * 0.1, cx + rx * 1.6]) {
        ctx.beginPath();
        ctx.moveTo(gx, s * 0.87);
        ctx.lineTo(gx - s * 0.02, s * 0.82);
        ctx.moveTo(gx, s * 0.87);
        ctx.lineTo(gx + s * 0.02, s * 0.81);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
];
