// InkForge Trees & Flora - Extra Viewing Directions
// Additional viewing angles (top-down battlemap/canopy view and side elevation)
// Matches InkForge visual style: light from upper-left, soft ground shadows, crisp ink outlines.
// All detail is strictly deterministic.

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

const lw = (s, f = 0.035) => Math.max(1, s * f);

function groundShadow(ctx, x, y, rx, ry, alpha = 0.25) {
  ctx.save();
  ctx.fillStyle = `rgba(30, 22, 16, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export const STAMPS_VIEWS_TREES = [
  // =========================================================================
  // tree_pine (Evergreen Pine) -> TOP VIEW (Concentric prickly star/circle canopy)
  // =========================================================================
  {
    id: 'tree_pine_top',
    name: 'Evergreen Pine (Top)',
    family: 'tree_pine',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_conifer',
    groupName: 'Conifers',
    defaultScale: 0.9,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#4a6741') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      groundShadow(ctx, cx + s * 0.04, cy + s * 0.04, s * 0.42, s * 0.42, 0.22);

      // Star-spoked needle whorls from bottom to top
      const tiers = [
        { r: s * 0.42, pts: 12, col: sh(fill, -0.22), lwFactor: 0.035 },
        { r: s * 0.32, pts: 10, col: fill, lwFactor: 0.03 },
        { r: s * 0.20, pts: 8, col: sh(fill, 0.18), lwFactor: 0.025 },
        { r: s * 0.08, pts: 6, col: sh(fill, 0.35), lwFactor: 0.02 }
      ];

      for (const t of tiers) {
        ctx.beginPath();
        for (let i = 0; i < t.pts * 2; i++) {
          const ang = (i * Math.PI) / t.pts;
          const rad = (i % 2 === 0) ? t.r : t.r * 0.65;
          const px = cx + Math.cos(ang) * rad;
          const py = cy + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = t.col;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, t.lwFactor);
        ctx.stroke();
      }

      // Center apex bud
      ctx.beginPath();
      ctx.arc(cx - s * 0.02, cy - s * 0.02, s * 0.03, 0, TAU);
      ctx.fillStyle = sh(fill, 0.5);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // tree_oak (Ancient Oak) -> TOP VIEW (Organic cloud-like canopy with branch glimpses)
  // =========================================================================
  {
    id: 'tree_oak_top',
    name: 'Ancient Oak (Top)',
    family: 'tree_oak',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_broadleaf',
    groupName: 'Broadleaf Trees',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#557a46') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      groundShadow(ctx, cx + s * 0.05, cy + s * 0.05, s * 0.44, s * 0.42, 0.26);

      // Multiple overlapping organic lobes forming a lush top-down deciduous canopy
      const rnd = seeded(42);
      const lobes = [
        { x: 0.48, y: 0.48, r: 0.42, shade: -0.15 },
        { x: 0.35, y: 0.38, r: 0.28, shade: 0.15 },
        { x: 0.62, y: 0.36, r: 0.26, shade: 0.08 },
        { x: 0.38, y: 0.62, r: 0.25, shade: -0.25 },
        { x: 0.64, y: 0.60, r: 0.27, shade: -0.2 },
        { x: 0.48, y: 0.30, r: 0.22, shade: 0.22 },
        { x: 0.50, y: 0.50, r: 0.20, shade: 0.05 }
      ];

      for (const lb of lobes) {
        ctx.beginPath();
        const baseR = s * lb.r;
        const lx = s * lb.x;
        const ly = s * lb.y;
        for (let a = 0; a < TAU; a += 0.25) {
          const wobble = baseR * (0.92 + rnd() * 0.16);
          const px = lx + Math.cos(a) * wobble;
          const py = ly + Math.sin(a) * wobble;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = sh(fill, lb.shade);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.03);
        ctx.stroke();
      }

      // Soft interior leaf texture marks
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(s, 0.02);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx - s * 0.12, cy - s * 0.12, s * 0.06, 0.2, 2.2);
      ctx.arc(cx + s * 0.15, cy - s * 0.10, s * 0.05, 0.5, 2.8);
      ctx.arc(cx - s * 0.05, cy + s * 0.15, s * 0.06, 3.2, 5.5);
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // tree_autumn (Autumn Maple) -> TOP VIEW (Warm golden/orange/crimson top-down canopy)
  // =========================================================================
  {
    id: 'tree_autumn_top',
    name: 'Autumn Maple (Top)',
    family: 'tree_autumn',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_broadleaf',
    groupName: 'Broadleaf Trees',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#3f2212', fill = '#d97706') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      groundShadow(ctx, cx + s * 0.05, cy + s * 0.05, s * 0.44, s * 0.42, 0.24);

      const autumnColors = ['#9a1c1c', '#ea580c', '#d97706', '#f59e0b'];
      const lobes = [
        { x: 0.50, y: 0.52, r: 0.40, col: autumnColors[0] }, // deep bottom/shadow
        { x: 0.62, y: 0.58, r: 0.26, col: autumnColors[1] },
        { x: 0.36, y: 0.54, r: 0.27, col: autumnColors[1] },
        { x: 0.60, y: 0.38, r: 0.25, col: autumnColors[2] },
        { x: 0.38, y: 0.36, r: 0.26, col: autumnColors[3] }, // bright top-left
        { x: 0.48, y: 0.32, r: 0.20, col: '#fbbf24' }
      ];

      for (const lb of lobes) {
        ctx.beginPath();
        ctx.arc(s * lb.x, s * lb.y, s * lb.r, 0, TAU);
        ctx.fillStyle = lb.col;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.03);
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // tree_dead (Gnarled Dead Tree) -> TOP VIEW (Radial twisted skeletal branches)
  // =========================================================================
  {
    id: 'tree_dead_top',
    name: 'Gnarled Dead Tree (Top)',
    family: 'tree_dead',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_dead_grp',
    groupName: 'Dead & Gnarled',
    defaultScale: 0.9,
    aspect: 1.0,
    render: (ctx, size, color = '#1c1917', fill = '#44403c') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      groundShadow(ctx, cx + s * 0.04, cy + s * 0.04, s * 0.38, s * 0.38, 0.18);

      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Heavy twisted center trunk bole
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.12, 0, TAU);
      ctx.fill();
      ctx.lineWidth = lw(s, 0.04);
      ctx.stroke();

      // Radiating crooked dead limbs
      const branches = [
        { ang: 0.3, len: 0.38, forks: [-0.3, 0.25] },
        { ang: 1.5, len: 0.40, forks: [-0.2, 0.3] },
        { ang: 2.7, len: 0.42, forks: [-0.35, 0.2] },
        { ang: 3.9, len: 0.36, forks: [-0.25, 0.3] },
        { ang: 5.1, len: 0.41, forks: [-0.3, 0.22] }
      ];

      for (const b of branches) {
        ctx.lineWidth = lw(s, 0.038);
        const midX = cx + Math.cos(b.ang) * s * b.len * 0.5 + Math.sin(b.ang) * s * 0.04;
        const midY = cy + Math.sin(b.ang) * s * b.len * 0.5 - Math.cos(b.ang) * s * 0.04;
        const endX = cx + Math.cos(b.ang) * s * b.len;
        const endY = cy + Math.sin(b.ang) * s * b.len;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();

        // Sub-twigs
        ctx.lineWidth = lw(s, 0.024);
        for (const f of b.forks) {
          const fx = endX + Math.cos(b.ang + f) * s * 0.12;
          const fy = endY + Math.sin(b.ang + f) * s * 0.12;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(fx, fy);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // tree_palm (Palm Tree) -> TOP VIEW (Radial starburst of arched fronds + coconuts)
  // =========================================================================
  {
    id: 'tree_palm_top',
    name: 'Palm Tree (Top)',
    family: 'tree_palm',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_palms',
    groupName: 'Palms',
    defaultScale: 0.9,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#557a46') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      groundShadow(ctx, cx + s * 0.04, cy + s * 0.04, s * 0.42, s * 0.42, 0.20);

      // Radiating fronds
      const numFronds = 7;
      for (let i = 0; i < numFronds; i++) {
        const ang = (i * TAU) / numFronds;
        const frondLen = s * 0.44;
        const tipX = cx + Math.cos(ang) * frondLen;
        const tipY = cy + Math.sin(ang) * frondLen;
        const perpX = -Math.sin(ang);
        const perpY = Math.cos(ang);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        // Frond left curve
        ctx.quadraticCurveTo(
          cx + Math.cos(ang) * s * 0.22 + perpX * s * 0.09,
          cy + Math.sin(ang) * s * 0.22 + perpY * s * 0.09,
          tipX,
          tipY
        );
        // Frond right curve
        ctx.quadraticCurveTo(
          cx + Math.cos(ang) * s * 0.24 - perpX * s * 0.05,
          cy + Math.sin(ang) * s * 0.24 - perpY * s * 0.05,
          cx,
          cy
        );
        ctx.closePath();
        ctx.fillStyle = (i % 2 === 0) ? fill : sh(fill, 0.15);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.025);
        ctx.stroke();

        // Spine vein
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = sh(color, 0.3);
        ctx.lineWidth = lw(s, 0.015);
        ctx.stroke();
      }

      // Palm heart crown & coconuts
      ctx.fillStyle = '#654321';
      for (let c = 0; c < 3; c++) {
        const ca = c * (TAU / 3) + 0.4;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ca) * s * 0.05, cy + Math.sin(ca) * s * 0.05, s * 0.035, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw(s, 0.02);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
];
