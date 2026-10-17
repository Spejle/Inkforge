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

// One hill/dune: filled mound whose drawn crest really peaks at (ax, ay), shade clipped inside it,
// crest inked. Fractions of w/h. Painter order = call order, so later mounds occlude earlier ones.
function moundLayer(ctx, w, h, color, fill, shade, [l, r, base, ax, ay], ripples = false) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(w * l, h * base);
    ctx.quadraticCurveTo(w * (2 * ax - (l + r) / 2), h * (2 * ay - base), w * r, h * base);
  };
  ctx.save();
  path();
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
  // lee face: wedge from the apex to the right foot
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(w * ax, h * ay);
  ctx.lineTo(w * r, h * base);
  ctx.lineTo(w * (ax + (r - ax) * 0.15), h * base);
  ctx.closePath();
  ctx.fill();
  if (ripples) {
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.25)';
    ctx.lineWidth = lw(h, 0.016);
    ctx.beginPath();
    for (const t of [0.35, 0.65]) {
      const y = ay + (base - ay) * t, x0 = l + (ax - l) * t;
      ctx.moveTo(w * x0, h * y);
      ctx.quadraticCurveTo(w * (x0 + 0.06), h * (y - 0.05), w * (x0 + 0.14), h * (y - 0.04));
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw(h, 0.035);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
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
      ctx.save();
      const w = size * 1.15;
      const h = size;
      groundShadow(ctx, w * 0.52, h * 0.88, w * 0.42, h * 0.09, 0.2);

      // Light side (Northwest face)
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.84);
      ctx.lineTo(w * 0.45, h * 0.16);
      ctx.quadraticCurveTo(w * 0.43, h * 0.55, w * 0.49, h * 0.89);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shadow side (Southeast face)
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.16);
      ctx.quadraticCurveTo(w * 0.43, h * 0.55, w * 0.49, h * 0.89);
      ctx.lineTo(w * 0.92, h * 0.82);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.3)';
      ctx.fill();

      // Secondary eastern shoulder shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.48);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.lineTo(w * 0.92, h * 0.82);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.12)';
      ctx.fill();

      // Contour shading lines on shadow side
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.02);
      ctx.beginPath();
      ctx.moveTo(w * 0.47, h * 0.36);
      ctx.lineTo(w * 0.62, h * 0.47);
      ctx.moveTo(w * 0.48, h * 0.54);
      ctx.lineTo(w * 0.71, h * 0.66);
      ctx.moveTo(w * 0.49, h * 0.72);
      ctx.lineTo(w * 0.82, h * 0.80);
      ctx.stroke();

      // Main ridge spine & outer outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.036);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.16);
      ctx.quadraticCurveTo(w * 0.43, h * 0.55, w * 0.49, h * 0.89);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.84);
      ctx.lineTo(w * 0.45, h * 0.16);
      ctx.lineTo(w * 0.92, h * 0.82);
      ctx.stroke();

      // Snow cap
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.16);
      ctx.lineTo(w * 0.35, h * 0.32);
      ctx.lineTo(w * 0.40, h * 0.36);
      ctx.lineTo(w * 0.45, h * 0.31);
      ctx.lineTo(w * 0.51, h * 0.37);
      ctx.lineTo(w * 0.56, h * 0.32);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = lw(h, 0.022);
      ctx.stroke();

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
      ctx.save();
      const s = size;
      const cx = s * 0.48;
      const cy = s * 0.48;

      // Outer mountain base footprint (top-down polygon)
      const basePts = [
        [s * 0.14, s * 0.22], [s * 0.46, s * 0.10], [s * 0.84, s * 0.18],
        [s * 0.90, s * 0.54], [s * 0.82, s * 0.84], [s * 0.48, s * 0.92],
        [s * 0.18, s * 0.82], [s * 0.08, s * 0.50]
      ];
      ctx.beginPath();
      basePts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Slope shadow on the Southeast half
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(s * 0.84, s * 0.18);
      ctx.lineTo(s * 0.90, s * 0.54);
      ctx.lineTo(s * 0.82, s * 0.84);
      ctx.lineTo(s * 0.48, s * 0.92);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.fill();

      // Mid-level topographic contour ring
      const midPts = [
        [s * 0.26, s * 0.32], [s * 0.47, s * 0.25], [s * 0.70, s * 0.30],
        [s * 0.74, s * 0.52], [s * 0.69, s * 0.70], [s * 0.48, s * 0.75],
        [s * 0.28, s * 0.68], [s * 0.22, s * 0.50]
      ];
      ctx.beginPath();
      midPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.022);
      ctx.stroke();

      // High-level contour ring
      const hiPts = [
        [s * 0.36, s * 0.39], [s * 0.48, s * 0.34], [s * 0.60, s * 0.38],
        [s * 0.63, s * 0.50], [s * 0.58, s * 0.61], [s * 0.47, s * 0.63],
        [s * 0.37, s * 0.58], [s * 0.34, s * 0.48]
      ];
      ctx.beginPath();
      hiPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();

      // Topographic slope hachure ticks on shaded slopes
      ctx.lineWidth = lw(s, 0.016);
      ctx.beginPath();
      ctx.moveTo(s * 0.66, s * 0.38); ctx.lineTo(s * 0.76, s * 0.34);
      ctx.moveTo(s * 0.69, s * 0.51); ctx.lineTo(s * 0.82, s * 0.52);
      ctx.moveTo(s * 0.64, s * 0.64); ctx.lineTo(s * 0.75, s * 0.73);
      ctx.moveTo(s * 0.50, s * 0.69); ctx.lineTo(s * 0.50, s * 0.83);
      ctx.stroke();

      // Ridge spines from summit to outer spurs
      ctx.lineWidth = lw(s, 0.034);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(s * 0.14, s * 0.22);
      ctx.moveTo(cx, cy); ctx.lineTo(s * 0.84, s * 0.18);
      ctx.moveTo(cx, cy); ctx.lineTo(s * 0.82, s * 0.84);
      ctx.moveTo(cx, cy); ctx.lineTo(s * 0.18, s * 0.82);
      ctx.stroke();

      // Base footprint outline
      ctx.beginPath();
      basePts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.lineWidth = lw(s, 0.038);
      ctx.stroke();

      // Snow-capped peak summit
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.07);
      ctx.lineTo(cx + s * 0.06, cy - s * 0.02);
      ctx.lineTo(cx + s * 0.05, cy + s * 0.06);
      ctx.lineTo(cx - s * 0.03, cy + s * 0.07);
      ctx.lineTo(cx - s * 0.07, cy + s * 0.01);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = lw(s, 0.024);
      ctx.stroke();

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
      ctx.save();
      const w = size * 1.5;
      const h = size;
      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.44, h * 0.08, 0.22);

      // Back right peak
      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.85);
      ctx.lineTo(w * 0.78, h * 0.25);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // Back right peak shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.78, h * 0.25);
      ctx.quadraticCurveTo(w * 0.80, h * 0.52, w * 0.84, h * 0.85);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.fill();

      // Front left peak
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.85);
      ctx.lineTo(w * 0.25, h * 0.38);
      ctx.lineTo(w * 0.48, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // Front left peak shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.38);
      ctx.lineTo(w * 0.33, h * 0.85);
      ctx.lineTo(w * 0.48, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.fill();

      // Center grand peak
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.90);
      ctx.lineTo(w * 0.48, h * 0.16);
      ctx.lineTo(w * 0.82, h * 0.90);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // Center peak shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.16);
      ctx.quadraticCurveTo(w * 0.51, h * 0.50, w * 0.56, h * 0.90);
      ctx.lineTo(w * 0.82, h * 0.90);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.30)';
      ctx.fill();

      // Inking all spines and outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.035);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Back peak inking
      ctx.beginPath();
      ctx.moveTo(w * 0.65, h * 0.55);
      ctx.lineTo(w * 0.78, h * 0.25);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.moveTo(w * 0.78, h * 0.25);
      ctx.quadraticCurveTo(w * 0.80, h * 0.52, w * 0.84, h * 0.85);
      ctx.stroke();

      // Connecting arête ridge
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.44);
      ctx.lineTo(w * 0.48, h * 0.16);
      ctx.lineTo(w * 0.66, h * 0.48);
      ctx.stroke();

      // Left peak inking
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.85);
      ctx.lineTo(w * 0.25, h * 0.38);
      ctx.lineTo(w * 0.34, h * 0.58);
      ctx.moveTo(w * 0.25, h * 0.38);
      ctx.lineTo(w * 0.33, h * 0.85);
      ctx.stroke();

      // Center grand peak outline and spine
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.90);
      ctx.lineTo(w * 0.48, h * 0.16);
      ctx.lineTo(w * 0.82, h * 0.90);
      ctx.moveTo(w * 0.48, h * 0.16);
      ctx.quadraticCurveTo(w * 0.51, h * 0.50, w * 0.56, h * 0.90);
      ctx.stroke();

      // Center hachures on shadow side
      ctx.lineWidth = lw(h, 0.018);
      ctx.beginPath();
      ctx.moveTo(w * 0.50, h * 0.38); ctx.lineTo(w * 0.62, h * 0.48);
      ctx.moveTo(w * 0.52, h * 0.56); ctx.lineTo(w * 0.68, h * 0.68);
      ctx.stroke();

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
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Range perimeter contour polygon
      const perim = [
        [w * 0.06, h * 0.52], [w * 0.20, h * 0.20], [w * 0.48, h * 0.14],
        [w * 0.74, h * 0.22], [w * 0.94, h * 0.48], [w * 0.86, h * 0.82],
        [w * 0.54, h * 0.88], [w * 0.24, h * 0.84], [w * 0.08, h * 0.74]
      ];
      ctx.beginPath();
      perim.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Ridge crest coordinates
      const p1 = [w * 0.26, h * 0.48];
      const p2 = [w * 0.50, h * 0.42];
      const p3 = [w * 0.76, h * 0.49];

      // Southern / Southeast slope shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.52);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(w * 0.38, h * 0.45);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(w * 0.63, h * 0.46);
      ctx.lineTo(p3[0], p3[1]);
      ctx.lineTo(w * 0.94, h * 0.48);
      ctx.lineTo(w * 0.86, h * 0.82);
      ctx.lineTo(w * 0.54, h * 0.88);
      ctx.lineTo(w * 0.24, h * 0.84);
      ctx.lineTo(w * 0.08, h * 0.74);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.26)';
      ctx.fill();

      // Intermediate contour loops around peaks
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.02);
      // loops follow the ridge (wide, flat) and stay inside the range outline
      ctx.save();
      ctx.beginPath();
      perim.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.clip();
      for (const [px, py, rx, ry] of [[p1[0], p1[1], w * 0.10, h * 0.10], [p2[0], p2[1], w * 0.12, h * 0.12], [p3[0], p3[1], w * 0.09, h * 0.10]]) {
        ctx.beginPath();
        ctx.ellipse(px, py + ry * 0.25, rx, ry, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // Shaded slope hachures on southern flanks
      ctx.lineWidth = lw(h, 0.016);
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.64); ctx.lineTo(w * 0.23, h * 0.77);
      ctx.moveTo(w * 0.44, h * 0.61); ctx.lineTo(w * 0.46, h * 0.78);
      ctx.moveTo(w * 0.56, h * 0.62); ctx.lineTo(w * 0.60, h * 0.80);
      ctx.moveTo(w * 0.76, h * 0.64); ctx.lineTo(w * 0.78, h * 0.77);
      ctx.stroke();

      // Ridge crest spine connecting peaks and spurs
      ctx.lineWidth = lw(h, 0.038);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.52);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(w * 0.38, h * 0.45);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(w * 0.63, h * 0.46);
      ctx.lineTo(p3[0], p3[1]);
      ctx.lineTo(w * 0.94, h * 0.48);
      // North & south lateral spurs
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(w * 0.20, h * 0.20);
      ctx.moveTo(p2[0], p2[1]); ctx.lineTo(w * 0.48, h * 0.14);
      ctx.moveTo(p2[0], p2[1]); ctx.lineTo(w * 0.54, h * 0.88);
      ctx.moveTo(p3[0], p3[1]); ctx.lineTo(w * 0.74, h * 0.22);
      ctx.stroke();

      // Outer perimeter outline
      ctx.beginPath();
      perim.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();

      // Small snow patches on peak summits
      ctx.fillStyle = '#ffffff';
      for (const [px, py] of [p1, p2, p3]) {
        ctx.beginPath();
        ctx.arc(px, py, w * 0.024, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }

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
      ctx.save();
      const w = size * 1.1;
      const h = size;
      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.42, h * 0.08, 0.2);

      // Main horn peak pyramid
      // West face (lit)
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.84);
      ctx.lineTo(w * 0.44, h * 0.12);
      ctx.quadraticCurveTo(w * 0.45, h * 0.52, w * 0.50, h * 0.89);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // East shadow face (icy deep blue shadow)
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.12);
      ctx.quadraticCurveTo(w * 0.45, h * 0.52, w * 0.50, h * 0.89);
      ctx.lineTo(w * 0.90, h * 0.82);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.fillStyle = 'rgba(56, 110, 168, 0.38)';
      ctx.fill();

      // Blue ice crevasse fissures on shadow face
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = lw(h, 0.02);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.36); ctx.lineTo(w * 0.66, h * 0.48);
      ctx.moveTo(w * 0.49, h * 0.58); ctx.lineTo(w * 0.74, h * 0.69);
      ctx.moveTo(w * 0.54, h * 0.76); ctx.lineTo(w * 0.82, h * 0.81);
      ctx.stroke();

      // Arêtes and dark ink outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.038);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Spine arête
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.12);
      ctx.quadraticCurveTo(w * 0.45, h * 0.52, w * 0.50, h * 0.89);
      ctx.stroke();

      // Outer silhouette
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.84);
      ctx.lineTo(w * 0.44, h * 0.12);
      ctx.lineTo(w * 0.90, h * 0.82);
      ctx.stroke();

      // Lateral bergschrund crevasse on sunlit face
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = lw(h, 0.018);
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.60);
      ctx.lineTo(w * 0.39, h * 0.64);
      ctx.stroke();

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
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.52;
      const outerR = s * 0.42;
      const rimR = s * 0.19;

      // Outer conical volcano slope
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, TAU);
      ctx.fillStyle = fill;
      ctx.fill();

      // Dark basalt shadow on Southeast slope
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, -Math.PI * 0.15, Math.PI * 0.85);
      ctx.arc(cx, cy, rimR, Math.PI * 0.85, -Math.PI * 0.15, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 15, 12, 0.45)';
      ctx.fill();

      // Basalt ash ridges radiating down flanks
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.02);
      for (let a = 0; a < TAU; a += TAU / 8) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rimR * 1.1, cy + Math.sin(a) * rimR * 1.1);
        ctx.lineTo(cx + Math.cos(a + 0.1) * outerR * 0.95, cy + Math.sin(a + 0.1) * outerR * 0.95);
        ctx.stroke();
      }

      // Outer cone outline
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.035);
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, TAU);
      ctx.stroke();

      // Caldera crater outer rim
      ctx.beginPath();
      ctx.arc(cx, cy, rimR, 0, TAU);
      ctx.fillStyle = 'rgba(20, 15, 12, 0.7)';
      ctx.fill();
      ctx.stroke();

      // Bubbling fiery magma pool
      ctx.beginPath();
      ctx.arc(cx, cy, rimR * 0.75, 0, TAU);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = lw(s, 0.02);
      ctx.stroke();

      // Magma bubbling hotspots
      ctx.fillStyle = '#fef08a';
      for (const [bx, by, br] of [[-0.03, -0.02, 0.035], [0.04, 0.03, 0.03], [-0.01, 0.05, 0.025], [0.03, -0.05, 0.02]]) {
        ctx.beginPath();
        ctx.arc(cx + s * bx, cy + s * by, s * br, 0, TAU);
        ctx.fill();
      }

      // Lava streaks overflowing the southern flank
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = lw(s, 0.025);
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.05, cy + rimR);
      ctx.quadraticCurveTo(cx + s * 0.08, cy + s * 0.28, cx + s * 0.12, cy + outerR * 0.92);
      ctx.moveTo(cx - s * 0.06, cy + rimR * 0.95);
      ctx.quadraticCurveTo(cx - s * 0.12, cy + s * 0.26, cx - s * 0.15, cy + outerR * 0.88);
      ctx.stroke();

      // Smoke billow drifting northeast
      ctx.fillStyle = 'rgba(100, 95, 90, 0.40)';
      ctx.beginPath();
      ctx.arc(cx + s * 0.06, cy - s * 0.18, s * 0.08, 0, TAU);
      ctx.arc(cx + s * 0.14, cy - s * 0.28, s * 0.10, 0, TAU);
      ctx.arc(cx + s * 0.22, cy - s * 0.36, s * 0.07, 0, TAU);
      ctx.fill();

      ctx.restore();
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
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      const outerR = s * 0.40;
      const rimR = s * 0.16;

      // Outer cone
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, TAU);
      ctx.fillStyle = fill;
      ctx.fill();

      // Southeast slope shadow
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, -Math.PI * 0.1, Math.PI * 0.8);
      ctx.arc(cx, cy, rimR, Math.PI * 0.8, -Math.PI * 0.1, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(25, 18, 15, 0.35)';
      ctx.fill();

      // Outer cone outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, TAU);
      ctx.stroke();

      // Caldera crater rim
      ctx.beginPath();
      ctx.arc(cx, cy, rimR, 0, TAU);
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, rimR, 0, TAU);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Lava trickle running down southern flank
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.02, cy + rimR);
      ctx.quadraticCurveTo(cx - s * 0.03, cy + s * 0.26, cx - s * 0.05, cy + outerR * 0.95);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Smoke plume drifting off
      ctx.fillStyle = 'rgba(120, 113, 108, 0.38)';
      ctx.beginPath();
      ctx.arc(cx + s * 0.04, cy - s * 0.14, s * 0.06, 0, TAU);
      ctx.arc(cx + s * 0.10, cy - s * 0.22, s * 0.07, 0, TAU);
      ctx.arc(cx + s * 0.16, cy - s * 0.29, s * 0.05, 0, TAU);
      ctx.fill();

      ctx.restore();
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
      ctx.save();
      const w = size * 1.4;
      const h = size;
      groundShadow(ctx, w * 0.5, h * 0.86, w * 0.44, h * 0.08, 0.22);

      // Mesa base profile
      const x0 = w * 0.08, x1 = w * 0.92, yBase = h * 0.85;
      const topPts = [
        [w * 0.22, h * 0.38], [w * 0.32, h * 0.26], [w * 0.74, h * 0.26],
        [w * 0.82, h * 0.38], [w * 0.62, h * 0.44], [w * 0.28, h * 0.44]
      ];

      // Stepped cliff wall fill
      ctx.beginPath();
      ctx.moveTo(x0, yBase);
      ctx.lineTo(topPts[0][0], topPts[0][1]);
      ctx.lineTo(topPts[3][0], topPts[3][1]);
      ctx.lineTo(x1, yBase);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shadow on Southeast facing cliff face
      ctx.beginPath();
      ctx.moveTo(topPts[4][0], topPts[4][1]);
      ctx.lineTo(topPts[3][0], topPts[3][1]);
      ctx.lineTo(x1, yBase);
      ctx.lineTo(w * 0.54, yBase);
      ctx.closePath();
      ctx.fillStyle = 'rgba(70, 20, 10, 0.38)';
      ctx.fill();

      // Horizontal sedimentary stratum lines across cliff
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = lw(h, 0.02);
      for (const yf of [0.52, 0.64, 0.75]) {
        const span = (yf - 0.4) / 0.45;
        ctx.beginPath();
        ctx.moveTo(w * (0.22 - span * 0.12), h * yf);
        ctx.lineTo(w * (0.80 + span * 0.10), h * yf);
        ctx.stroke();
      }

      // Flat tabletop surface
      ctx.beginPath();
      topPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = sh(fill, 0.18);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.035);
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Outlines of cliffs & base
      ctx.beginPath();
      ctx.moveTo(x0, yBase);
      ctx.lineTo(topPts[0][0], topPts[0][1]);
      ctx.moveTo(topPts[3][0], topPts[3][1]);
      ctx.lineTo(x1, yBase);
      ctx.moveTo(topPts[4][0], topPts[4][1]);
      ctx.lineTo(w * 0.54, yBase);
      ctx.stroke();

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
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Outer base perimeter (talus apron)
      const outerPts = [
        [w * 0.10, h * 0.22], [w * 0.35, h * 0.10], [w * 0.82, h * 0.14],
        [w * 0.92, h * 0.48], [w * 0.86, h * 0.84], [w * 0.45, h * 0.90],
        [w * 0.14, h * 0.80], [w * 0.06, h * 0.50]
      ];
      ctx.beginPath();
      outerPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Southeast cliff slope shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.82, h * 0.14);
      ctx.lineTo(w * 0.92, h * 0.48);
      ctx.lineTo(w * 0.86, h * 0.84);
      ctx.lineTo(w * 0.45, h * 0.90);
      ctx.lineTo(w * 0.46, h * 0.74);
      ctx.lineTo(w * 0.74, h * 0.70);
      ctx.lineTo(w * 0.78, h * 0.46);
      ctx.lineTo(w * 0.70, h * 0.24);
      ctx.closePath();
      ctx.fillStyle = 'rgba(70, 20, 10, 0.42)';
      ctx.fill();

      // Intermediate stepped contour ring
      const midPts = [
        [w * 0.18, h * 0.25], [w * 0.38, h * 0.17], [w * 0.75, h * 0.19],
        [w * 0.84, h * 0.46], [w * 0.79, h * 0.76], [w * 0.46, h * 0.81],
        [w * 0.20, h * 0.74], [w * 0.14, h * 0.48]
      ];
      ctx.beginPath();
      midPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = lw(h, 0.02);
      ctx.stroke();

      // Tabletop plateau rim (flat summit polygon)
      const rimPts = [
        [w * 0.26, h * 0.30], [w * 0.42, h * 0.22], [w * 0.70, h * 0.24],
        [w * 0.78, h * 0.46], [w * 0.74, h * 0.70], [w * 0.46, h * 0.74],
        [w * 0.28, h * 0.68], [w * 0.22, h * 0.48]
      ];
      ctx.beginPath();
      rimPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = sh(fill, 0.22);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(h, 0.035);
      ctx.stroke();

      // Outer perimeter outline & radial cliff tick marks
      ctx.beginPath();
      outerPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();

      ctx.lineWidth = lw(h, 0.018);
      ctx.beginPath();
      ctx.moveTo(w * 0.78, h * 0.46); ctx.lineTo(w * 0.90, h * 0.48);
      ctx.moveTo(w * 0.74, h * 0.70); ctx.lineTo(w * 0.84, h * 0.80);
      ctx.moveTo(w * 0.46, h * 0.74); ctx.lineTo(w * 0.45, h * 0.88);
      ctx.stroke();

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
      const w = size * 1.3;
      const h = size;
      groundShadow(ctx, w * 0.5, h * 0.86, w * 0.46, h * 0.05);
      // back to front: [left, right, base, apex x, apex y]
      moundLayer(ctx, w, h, color, fill, 'rgba(50, 40, 35, 0.22)', [0.42, 0.95, 0.75, 0.68, 0.40]);
      moundLayer(ctx, w, h, color, fill, 'rgba(50, 40, 35, 0.22)', [0.05, 0.65, 0.82, 0.32, 0.45]);
      moundLayer(ctx, w, h, color, fill, 'rgba(50, 40, 35, 0.25)', [0.28, 0.95, 0.86, 0.62, 0.55]);
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
      const w = size * 1.3;
      const h = size;
      groundShadow(ctx, w * 0.52, h * 0.84, w * 0.44, h * 0.05);
      moundLayer(ctx, w, h, color, fill, 'rgba(180, 83, 9, 0.28)', [0.10, 0.86, 0.70, 0.48, 0.42], true);
      moundLayer(ctx, w, h, color, fill, 'rgba(180, 83, 9, 0.32)', [0.25, 0.96, 0.84, 0.64, 0.54], true);
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
