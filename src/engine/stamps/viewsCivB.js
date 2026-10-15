// Additional viewing directions for civilization stamps (CivB workstream).
// Light from upper-left, soft ground shadows, crisp dark outline. Deterministic rendering.

const TAU = Math.PI * 2;

// Tiny seeded PRNG for deterministic variations if needed
export const prng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Drawing helper: filled and/or stroked polygon
const poly = (ctx, pts, fillStyle, strokeStyle, lw = 2.5) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
  if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = lw; ctx.stroke(); }
};

// Drawing helper: soft ground shadow
const groundShadow = (ctx, cx, cy, rx, ry, alpha = 0.25) => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fillStyle = `rgba(25, 20, 15, ${alpha})`;
  ctx.fill();
};

export const STAMPS_VIEWS_CIVB = [
  {
    id: 'ruined_tower_side',
    name: 'Ruined Tower (Side)',
    family: 'ruined_tower',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_ruins',
    groupName: 'Ruins',
    defaultScale: 1.1,
    aspect: 0.9,
    render: (ctx, size, color = '#271c19', fill = '#d6d3d1') => {
      ctx.save();
      const w = size * 0.9, h = size;

      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.42, h * 0.06, 0.25);

      const wallPts = [
        [w * 0.22, h * 0.88], [w * 0.24, h * 0.22], [w * 0.32, h * 0.22],
        [w * 0.33, h * 0.30], [w * 0.40, h * 0.30], [w * 0.43, h * 0.42],
        [w * 0.52, h * 0.42], [w * 0.55, h * 0.36], [w * 0.63, h * 0.36],
        [w * 0.66, h * 0.52], [w * 0.73, h * 0.60], [w * 0.76, h * 0.88]
      ];
      poly(ctx, wallPts, fill, color, 2.5);

      // Shaded right half (light from upper-left)
      poly(ctx, [
        [w * 0.50, h * 0.42], [w * 0.55, h * 0.36], [w * 0.63, h * 0.36],
        [w * 0.66, h * 0.52], [w * 0.73, h * 0.60], [w * 0.76, h * 0.88], [w * 0.50, h * 0.88]
      ], 'rgba(30, 25, 20, 0.28)');

      // Dark window slit
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(w * 0.31, h * 0.46, w * 0.06, h * 0.16);
      ctx.strokeStyle = color; ctx.lineWidth = 1.8;
      ctx.strokeRect(w * 0.31, h * 0.46, w * 0.06, h * 0.16);

      // Ivy patch climbing left wall
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(w * 0.26, h * 0.46, w * 0.05, 0, TAU);
      ctx.arc(w * 0.24, h * 0.54, w * 0.06, 0, TAU);
      ctx.arc(w * 0.27, h * 0.63, w * 0.05, 0, TAU);
      ctx.fill();

      // Fallen rubble stones
      ctx.fillStyle = '#a8a29e';
      const rubble = [
        [w * 0.73, h * 0.83, w * 0.08, h * 0.05],
        [w * 0.81, h * 0.85, w * 0.07, h * 0.04],
        [w * 0.76, h * 0.78, w * 0.06, h * 0.05]
      ];
      for (const [rx, ry, rw, rh] of rubble) {
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }

      // Masonry courses
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.38); ctx.lineTo(w * 0.40, h * 0.38);
      ctx.moveTo(w * 0.45, h * 0.62); ctx.lineTo(w * 0.65, h * 0.62);
      ctx.moveTo(w * 0.38, h * 0.76); ctx.lineTo(w * 0.60, h * 0.76);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'ruined_tower_top',
    name: 'Ruined Tower (Top)',
    family: 'ruined_tower',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_ruins',
    groupName: 'Ruins',
    defaultScale: 1.1,
    aspect: 1.0,
    render: (ctx, size, color = '#271c19', fill = '#d6d3d1') => {
      ctx.save();
      const w = size, h = size;
      const cx = w * 0.48, cy = h * 0.48, R = w * 0.34, r = w * 0.20;

      groundShadow(ctx, cx + w * 0.06, cy + h * 0.06, R * 1.06, R * 1.06, 0.22);

      // Floor and inner shadow
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = '#b8b2a8'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.7, Math.PI * 0.8);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.25)'; ctx.fill();

      // Broken wall ring (breach at southeast)
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.35, Math.PI * 1.75, false);
      ctx.lineTo(cx + Math.cos(Math.PI * 1.75) * r, cy + Math.sin(Math.PI * 1.75) * r);
      ctx.arc(cx, cy, r, Math.PI * 1.75, Math.PI * 0.35, true);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

      // Shaded eastern wall fracture
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 0.35, false);
      ctx.lineTo(cx + Math.cos(Math.PI * 0.35) * r, cy + Math.sin(Math.PI * 0.35) * r);
      ctx.arc(cx, cy, r, Math.PI * 0.35, 0, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 25, 20, 0.22)'; ctx.fill();

      // Rubble in breach
      ctx.fillStyle = '#a8a29e'; ctx.lineWidth = 1.8;
      const rubble = [
        [cx + R * 0.72, cy + R * 0.30, w * 0.07, h * 0.06],
        [cx + R * 0.90, cy + R * 0.55, w * 0.08, h * 0.05],
        [cx + R * 0.40, cy + R * 0.85, w * 0.06, h * 0.06],
        [cx + r * 0.30, cy + r * 0.25, w * 0.05, h * 0.05]
      ];
      for (const [bx, by, bw, bh] of rubble) {
        ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
      }

      // Ivy cluster on northwest rim
      ctx.fillStyle = '#15803d'; ctx.beginPath();
      ctx.arc(cx - R * 0.85, cy - R * 0.50, w * 0.045, 0, TAU);
      ctx.arc(cx - R * 0.95, cy - R * 0.25, w * 0.05, 0, TAU);
      ctx.arc(cx - R * 0.70, cy - R * 0.70, w * 0.04, 0, TAU);
      ctx.fill();

      // Masonry coping joints
      ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath();
      for (const a of [Math.PI * 0.6, Math.PI * 0.9, Math.PI * 1.2, Math.PI * 1.5]) {
        ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      }
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'bridge_stone_top',
    name: 'Stone Arch Bridge (Top)',
    family: 'bridge_stone',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_bridges',
    groupName: 'Bridges & Crossings',
    defaultScale: 1.2,
    aspect: 1.5,
    render: (ctx, size, color = '#271c19', fill = '#cbd5e1') => {
      ctx.save();
      const w = size * 1.5, h = size;

      // Water ripples flowing under bridge
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.0; ctx.beginPath();
      ctx.moveTo(w * 0.20, h * 0.16); ctx.lineTo(w * 0.42, h * 0.16);
      ctx.moveTo(w * 0.58, h * 0.16); ctx.lineTo(w * 0.80, h * 0.16);
      ctx.moveTo(w * 0.18, h * 0.84); ctx.lineTo(w * 0.42, h * 0.84);
      ctx.moveTo(w * 0.58, h * 0.84); ctx.lineTo(w * 0.82, h * 0.84);
      ctx.stroke();

      // Shadow cast onto water to the southeast
      ctx.fillStyle = 'rgba(20, 15, 10, 0.22)';
      ctx.fillRect(w * 0.08, h * 0.68, w * 0.84, h * 0.10);

      // Pier cutwaters (triangular breakwaters)
      poly(ctx, [[w * 0.44, h * 0.32], [w * 0.50, h * 0.20], [w * 0.56, h * 0.32]], '#94a3b8', color, 2.5);
      poly(ctx, [[w * 0.44, h * 0.68], [w * 0.50, h * 0.80], [w * 0.56, h * 0.68]], '#64748b', color, 2.5);

      // Main Roadway Deck
      ctx.fillStyle = fill; ctx.fillRect(w * 0.06, h * 0.32, w * 0.88, h * 0.36);

      // North & south parapet walls
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(w * 0.06, h * 0.28, w * 0.88, h * 0.07);
      ctx.fillStyle = '#64748b'; ctx.fillRect(w * 0.06, h * 0.65, w * 0.88, h * 0.07);

      // Roadway & Parapet outlines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.06, h * 0.28, w * 0.88, h * 0.44);
      ctx.strokeRect(w * 0.06, h * 0.28, w * 0.88, h * 0.07);
      ctx.strokeRect(w * 0.06, h * 0.65, w * 0.88, h * 0.07);

      // Pavement flagstones
      ctx.lineWidth = 1.8; ctx.beginPath();
      for (let i = 1; i <= 6; i++) {
        const px = w * (0.06 + i * 0.125);
        ctx.moveTo(px, h * 0.35); ctx.lineTo(px, h * 0.65);
      }
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'bridge_stone_side',
    name: 'Stone Arch Bridge (Side)',
    family: 'bridge_stone',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_bridges',
    groupName: 'Bridges & Crossings',
    defaultScale: 1.2,
    aspect: 1.6,
    render: (ctx, size, color = '#271c19', fill = '#cbd5e1') => {
      ctx.save();
      const w = size * 1.6, h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.0; ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.83); ctx.lineTo(w * 0.95, h * 0.83);
      ctx.moveTo(w * 0.15, h * 0.89); ctx.lineTo(w * 0.85, h * 0.89);
      ctx.stroke();

      // Stone Bridge body
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.50, w * 0.95, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.80); ctx.lineTo(w * 0.86, h * 0.80);
      ctx.arc(w * 0.69, h * 0.80, w * 0.17, 0, Math.PI, true);
      ctx.lineTo(w * 0.48, h * 0.80);
      ctx.arc(w * 0.31, h * 0.80, w * 0.17, 0, Math.PI, true);
      ctx.lineTo(w * 0.05, h * 0.80); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();

      // Pier shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.fillRect(w * 0.48, h * 0.63, w * 0.06, h * 0.17);

      // Parapet
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.52);
      ctx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.95, h * 0.52);
      ctx.lineTo(w * 0.95, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.50, w * 0.05, h * 0.58);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8'; ctx.fill();

      // Outlines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.52);
      ctx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.95, h * 0.52);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.50, w * 0.95, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.80); ctx.lineTo(w * 0.86, h * 0.80);
      ctx.arc(w * 0.69, h * 0.80, w * 0.17, 0, Math.PI, true);
      ctx.lineTo(w * 0.48, h * 0.80);
      ctx.arc(w * 0.31, h * 0.80, w * 0.17, 0, Math.PI, true);
      ctx.lineTo(w * 0.05, h * 0.80); ctx.closePath();
      ctx.stroke();

      // Keystones
      ctx.lineWidth = 1.8;
      ctx.strokeRect(w * 0.29, h * 0.61, w * 0.04, h * 0.06);
      ctx.strokeRect(w * 0.67, h * 0.61, w * 0.04, h * 0.06);

      ctx.restore();
    }
  },
  {
    id: 'farm_homestead_top',
    name: 'Farm Homestead (Top)',
    family: 'farm_homestead',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_rural',
    groupName: 'Farms & Homesteads',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#2c221e', fill = '#fde68a') => {
      ctx.save();
      const w = size * 1.3, h = size;

      // Shadows
      groundShadow(ctx, w * 0.19, h * 0.33, w * 0.07, h * 0.07, 0.22);
      ctx.fillStyle = 'rgba(20, 15, 10, 0.22)';
      ctx.fillRect(w * 0.26, h * 0.22, w * 0.30, h * 0.28);
      ctx.fillRect(w * 0.60, h * 0.18, w * 0.32, h * 0.30);

      // Plowed field furrows (bottom right)
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2.0; ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const fy = h * (0.60 + i * 0.07);
        ctx.moveTo(w * 0.58, fy); ctx.lineTo(w * 0.92, fy);
      }
      ctx.stroke();

      // Fenced paddock (bottom left)
      ctx.fillStyle = 'rgba(253, 230, 138, 0.4)';
      ctx.fillRect(w * 0.10, h * 0.58, w * 0.40, h * 0.34);
      // Trough
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(w * 0.14, h * 0.63, w * 0.08, h * 0.06);
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.14, h * 0.63, w * 0.08, h * 0.06);
      // Fence rails & posts
      ctx.strokeStyle = color; ctx.lineWidth = 2.0;
      ctx.strokeRect(w * 0.10, h * 0.58, w * 0.40, h * 0.34);
      ctx.fillStyle = '#78350f';
      const posts = [[0.10, 0.58], [0.23, 0.58], [0.36, 0.58], [0.50, 0.58], [0.50, 0.75], [0.50, 0.92], [0.36, 0.92], [0.23, 0.92], [0.10, 0.92], [0.10, 0.75]];
      for (const [px, py] of posts) ctx.fillRect(w * px - 2, h * py - 2, 4, 4);

      // Farmhouse roof
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(w * 0.24, h * 0.18, w * 0.28, h * 0.12);
      ctx.fillStyle = '#d97706'; ctx.fillRect(w * 0.24, h * 0.30, w * 0.28, h * 0.12);
      ctx.fillStyle = '#78350f'; ctx.fillRect(w * 0.42, h * 0.23, w * 0.05, h * 0.06);
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.24, h * 0.18, w * 0.28, h * 0.24);
      ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.30); ctx.lineTo(w * 0.52, h * 0.30); ctx.stroke();

      // Barn roof
      ctx.fillStyle = '#d97706'; ctx.fillRect(w * 0.58, h * 0.14, w * 0.30, h * 0.13);
      ctx.fillStyle = '#b45309'; ctx.fillRect(w * 0.58, h * 0.27, w * 0.30, h * 0.13);
      ctx.strokeRect(w * 0.58, h * 0.14, w * 0.30, h * 0.26);
      ctx.beginPath(); ctx.moveTo(w * 0.58, h * 0.27); ctx.lineTo(w * 0.88, h * 0.27); ctx.stroke();

      // Silo
      ctx.beginPath(); ctx.arc(w * 0.16, h * 0.30, w * 0.06, 0, TAU);
      ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(w * 0.16, h * 0.30, w * 0.02, 0, TAU);
      ctx.fillStyle = '#64748b'; ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'port_dock_top',
    name: 'Port Dock (Top)',
    family: 'port_dock',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_port',
    groupName: 'Ports & Harbours',
    defaultScale: 1.2,
    aspect: 1.4,
    render: (ctx, size, color = '#271c19', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.4, h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.0; ctx.beginPath();
      ctx.moveTo(w * 0.30, h * 0.22); ctx.lineTo(w * 0.55, h * 0.22);
      ctx.moveTo(w * 0.68, h * 0.26); ctx.lineTo(w * 0.92, h * 0.26);
      ctx.moveTo(w * 0.30, h * 0.78); ctx.lineTo(w * 0.60, h * 0.78);
      ctx.moveTo(w * 0.72, h * 0.82); ctx.lineTo(w * 0.94, h * 0.82);
      ctx.stroke();

      // Pier shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.20)';
      ctx.fillRect(w * 0.20, h * 0.64, w * 0.70, h * 0.08);

      // Quay & Pier
      ctx.fillStyle = '#64748b'; ctx.fillRect(w * 0.05, h * 0.10, w * 0.17, h * 0.80);
      ctx.fillStyle = fill; ctx.fillRect(w * 0.20, h * 0.35, w * 0.70, h * 0.30);

      // Piling heads
      ctx.fillStyle = '#451a03';
      for (const px of [0.24, 0.46, 0.68, 0.88]) {
        ctx.beginPath(); ctx.arc(w * px, h * 0.37, w * 0.02, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(w * px, h * 0.63, w * 0.02, 0, TAU); ctx.fill();
      }

      // Bollards
      ctx.fillStyle = '#1c1917';
      for (const bx of [0.35, 0.86]) {
        ctx.beginPath(); ctx.arc(w * bx, h * 0.42, w * 0.022, 0, TAU); ctx.fill();
      }

      // Crates
      ctx.fillStyle = '#d97706';
      ctx.fillRect(w * 0.52, h * 0.44, w * 0.08, h * 0.11);
      ctx.fillRect(w * 0.61, h * 0.42, w * 0.07, h * 0.10);

      // Outlines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.05, h * 0.10, w * 0.17, h * 0.80);
      ctx.strokeRect(w * 0.20, h * 0.35, w * 0.70, h * 0.30);
      ctx.strokeRect(w * 0.52, h * 0.44, w * 0.08, h * 0.11);
      ctx.strokeRect(w * 0.61, h * 0.42, w * 0.07, h * 0.10);

      // Planks
      ctx.lineWidth = 1.8; ctx.beginPath();
      for (let i = 1; i < 10; i++) {
        const lx = w * (0.20 + (0.70 / 10) * i);
        ctx.moveTo(lx, h * 0.35); ctx.lineTo(lx, h * 0.65);
      }
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'port_dock_side',
    name: 'Port Dock (Side)',
    family: 'port_dock',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_port',
    groupName: 'Ports & Harbours',
    defaultScale: 1.2,
    aspect: 1.5,
    render: (ctx, size, color = '#271c19', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.5, h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.0; ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.84); ctx.lineTo(w * 0.95, h * 0.84);
      ctx.moveTo(w * 0.32, h * 0.90); ctx.lineTo(w * 0.90, h * 0.90);
      ctx.stroke();

      // Stone Quay wall
      ctx.fillStyle = '#64748b'; ctx.fillRect(w * 0.05, h * 0.40, w * 0.20, h * 0.48);

      // Pilings & cross bracing
      const pilings = [0.38, 0.54, 0.70, 0.86];
      ctx.fillStyle = '#451a03'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2.0;
      for (const px of pilings) ctx.fillRect(w * px, h * 0.54, w * 0.04, h * 0.32);
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.58); ctx.lineTo(w * 0.54, h * 0.82);
      ctx.moveTo(w * 0.54, h * 0.58); ctx.lineTo(w * 0.42, h * 0.82);
      ctx.moveTo(w * 0.74, h * 0.58); ctx.lineTo(w * 0.86, h * 0.82);
      ctx.moveTo(w * 0.86, h * 0.58); ctx.lineTo(w * 0.74, h * 0.82);
      ctx.stroke();

      // Pier deck & cargo
      ctx.fillStyle = fill; ctx.fillRect(w * 0.20, h * 0.48, w * 0.72, h * 0.08);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(w * 0.44, h * 0.38, w * 0.08, h * 0.10);
      ctx.fillRect(w * 0.52, h * 0.40, w * 0.07, h * 0.08);

      // Bollards
      ctx.fillStyle = '#1c1917';
      for (const bx of [0.32, 0.88]) {
        ctx.fillRect(w * bx, h * 0.42, w * 0.03, h * 0.06);
        ctx.beginPath(); ctx.arc(w * (bx + 0.015), h * 0.42, w * 0.02, 0, TAU); ctx.fill();
      }

      // Outlines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.05, h * 0.40, w * 0.20, h * 0.48);
      for (const px of pilings) ctx.strokeRect(w * px, h * 0.54, w * 0.04, h * 0.32);
      ctx.strokeRect(w * 0.20, h * 0.48, w * 0.72, h * 0.08);
      ctx.strokeRect(w * 0.44, h * 0.38, w * 0.08, h * 0.10);
      ctx.strokeRect(w * 0.52, h * 0.40, w * 0.07, h * 0.08);

      ctx.restore();
    }
  },
  {
    id: 'civ_temple_front',
    name: 'Ancient Temple (Front)',
    family: 'civ_temple',
    view: 'front',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_sacred',
    groupName: 'Temples, Shrines & Stones',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 1.3, h = size;

      groundShadow(ctx, w * 0.5, h * 0.87, w * 0.44, h * 0.04, 0.20);

      // Plinth steps
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.08, h * 0.82, w * 0.84, h * 0.05);
      ctx.fillRect(w * 0.12, h * 0.77, w * 0.76, h * 0.05);
      ctx.fillRect(w * 0.16, h * 0.72, w * 0.68, h * 0.05);

      // Sanctuary dark interior
      ctx.fillStyle = '#334155'; ctx.fillRect(w * 0.22, h * 0.38, w * 0.56, h * 0.34);

      // Columns
      const cols = [0.22, 0.38, 0.54, 0.70];
      for (const cx of cols) {
        ctx.fillStyle = fill; ctx.fillRect(w * cx, h * 0.38, w * 0.08, h * 0.34);
        ctx.fillStyle = 'rgba(20, 15, 10, 0.2)'; ctx.fillRect(w * (cx + 0.04), h * 0.38, w * 0.04, h * 0.34);
      }

      // Entablature & Pediment
      ctx.fillStyle = fill; ctx.fillRect(w * 0.16, h * 0.32, w * 0.68, h * 0.06);
      poly(ctx, [[w * 0.14, h * 0.32], [w * 0.50, h * 0.14], [w * 0.86, h * 0.32]], fill, color, 2.5);

      // Relief emblem
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(w * 0.50, h * 0.24, w * 0.04, 0, TAU); ctx.fill();

      // Acroteria
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(w * 0.485, h * 0.10, w * 0.03, h * 0.04);
      ctx.fillRect(w * 0.125, h * 0.28, w * 0.03, h * 0.04);
      ctx.fillRect(w * 0.845, h * 0.28, w * 0.03, h * 0.04);

      // Outlines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.08, h * 0.82, w * 0.84, h * 0.05);
      ctx.strokeRect(w * 0.12, h * 0.77, w * 0.76, h * 0.05);
      ctx.strokeRect(w * 0.16, h * 0.72, w * 0.68, h * 0.05);
      for (const cx of cols) ctx.strokeRect(w * cx, h * 0.38, w * 0.08, h * 0.34);
      ctx.strokeRect(w * 0.16, h * 0.32, w * 0.68, h * 0.06);
      ctx.beginPath(); ctx.arc(w * 0.50, h * 0.24, w * 0.04, 0, TAU); ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'civ_temple_top',
    name: 'Ancient Temple (Top)',
    family: 'civ_temple',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_sacred',
    groupName: 'Temples, Shrines & Stones',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 1.3, h = size;

      ctx.fillStyle = 'rgba(20, 15, 10, 0.20)';
      ctx.fillRect(w * 0.10, h * 0.14, w * 0.84, h * 0.78);

      // Concentric steps
      ctx.fillStyle = fill; ctx.fillRect(w * 0.06, h * 0.10, w * 0.84, h * 0.78);
      ctx.fillStyle = '#e7e5e4'; ctx.fillRect(w * 0.10, h * 0.14, w * 0.76, h * 0.70);
      ctx.fillStyle = fill; ctx.fillRect(w * 0.14, h * 0.18, w * 0.68, h * 0.62);

      // Gabled Roof (north lit, south shaded)
      ctx.fillStyle = fill; ctx.fillRect(w * 0.16, h * 0.20, w * 0.64, h * 0.29);
      ctx.fillStyle = '#d6d3d1'; ctx.fillRect(w * 0.16, h * 0.49, w * 0.64, h * 0.29);

      // Gable ends
      poly(ctx, [[w * 0.16, h * 0.20], [w * 0.12, h * 0.49], [w * 0.16, h * 0.78]], '#e7e5e4');
      poly(ctx, [[w * 0.80, h * 0.20], [w * 0.84, h * 0.49], [w * 0.80, h * 0.78]], '#e7e5e4');

      // Finial
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(w * 0.50, h * 0.49, w * 0.03, 0, TAU); ctx.fill();

      // Outlines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.06, h * 0.10, w * 0.84, h * 0.78);
      ctx.strokeRect(w * 0.10, h * 0.14, w * 0.76, h * 0.70);
      ctx.strokeRect(w * 0.14, h * 0.18, w * 0.68, h * 0.62);

      // Roof perimeter & ridge
      poly(ctx, [
        [w * 0.16, h * 0.20], [w * 0.80, h * 0.20], [w * 0.84, h * 0.49],
        [w * 0.80, h * 0.78], [w * 0.16, h * 0.78], [w * 0.12, h * 0.49]
      ], null, color, 2.5);
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.49); ctx.lineTo(w * 0.84, h * 0.49);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(w * 0.50, h * 0.49, w * 0.03, 0, TAU); ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'camp_tent_front',
    name: 'Camp Tent (Front)',
    family: 'camp_tent',
    view: 'front',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_camps',
    groupName: 'Encampments & Tents',
    defaultScale: 1.0,
    aspect: 1.1,
    render: (ctx, size, color = '#2c221e', fill = '#fde047') => {
      ctx.save();
      const w = size * 1.1, h = size;

      groundShadow(ctx, w * 0.50, h * 0.85, w * 0.42, h * 0.06, 0.30);

      // Guy-lines
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(w * 0.50, h * 0.30); ctx.lineTo(w * 0.08, h * 0.85);
      ctx.moveTo(w * 0.50, h * 0.30); ctx.lineTo(w * 0.92, h * 0.85);
      ctx.stroke();

      // Wooden pegs
      ctx.fillStyle = '#78350f';
      ctx.fillRect(w * 0.06, h * 0.83, w * 0.04, h * 0.06);
      ctx.fillRect(w * 0.90, h * 0.83, w * 0.04, h * 0.06);

      // Facade (left lit, right shaded)
      poly(ctx, [[w * 0.50, h * 0.30], [w * 0.20, h * 0.84], [w * 0.50, h * 0.84]], fill);
      poly(ctx, [[w * 0.50, h * 0.30], [w * 0.50, h * 0.84], [w * 0.80, h * 0.84]], '#eab308');

      // Dark interior opening
      poly(ctx, [[w * 0.50, h * 0.40], [w * 0.34, h * 0.84], [w * 0.66, h * 0.84]], '#451a03');

      // Center wooden tent pole
      ctx.fillStyle = '#78350f'; ctx.fillRect(w * 0.485, h * 0.40, w * 0.03, h * 0.44);

      // Warm lantern glow inside
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(w * 0.50, h * 0.68, w * 0.045, 0, TAU); ctx.fill();

      // Outlines
      poly(ctx, [[w * 0.50, h * 0.30], [w * 0.20, h * 0.84], [w * 0.80, h * 0.84]], null, color, 2.5);

      ctx.lineWidth = 1.8; ctx.beginPath();
      ctx.moveTo(w * 0.50, h * 0.40); ctx.lineTo(w * 0.34, h * 0.84);
      ctx.moveTo(w * 0.50, h * 0.40); ctx.lineTo(w * 0.66, h * 0.84);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'camp_tent_top',
    name: 'Camp Tent (Top)',
    family: 'camp_tent',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_camps',
    groupName: 'Encampments & Tents',
    defaultScale: 1.0,
    aspect: 1.1,
    render: (ctx, size, color = '#2c221e', fill = '#fde047') => {
      ctx.save();
      const w = size * 1.1, h = size;

      ctx.fillStyle = 'rgba(25, 20, 15, 0.22)';
      ctx.fillRect(w * 0.22, h * 0.22, w * 0.62, h * 0.62);

      // Guy-lines
      ctx.strokeStyle = color; ctx.lineWidth = 2.0; ctx.beginPath();
      ctx.moveTo(w * 0.20, h * 0.20); ctx.lineTo(w * 0.08, h * 0.12);
      ctx.moveTo(w * 0.80, h * 0.20); ctx.lineTo(w * 0.92, h * 0.12);
      ctx.moveTo(w * 0.20, h * 0.80); ctx.lineTo(w * 0.08, h * 0.88);
      ctx.moveTo(w * 0.80, h * 0.80); ctx.lineTo(w * 0.92, h * 0.88);
      ctx.moveTo(w * 0.50, h * 0.20); ctx.lineTo(w * 0.50, h * 0.08);
      ctx.moveTo(w * 0.50, h * 0.80); ctx.lineTo(w * 0.50, h * 0.92);
      ctx.stroke();

      // Pegs
      ctx.fillStyle = '#78350f';
      for (const [px, py] of [[0.06, 0.10], [0.90, 0.10], [0.485, 0.06], [0.06, 0.86], [0.90, 0.86], [0.485, 0.90]]) {
        ctx.fillRect(w * px, h * py, w * 0.03, h * 0.04);
      }

      // Roof slopes (left lit, right shaded)
      ctx.fillStyle = fill; ctx.fillRect(w * 0.20, h * 0.20, w * 0.30, h * 0.60);
      ctx.fillStyle = '#eab308'; ctx.fillRect(w * 0.50, h * 0.20, w * 0.30, h * 0.60);

      // Front entrance opening & lantern glow
      poly(ctx, [[w * 0.50, h * 0.20], [w * 0.38, h * 0.28], [w * 0.62, h * 0.28]], '#451a03');
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(w * 0.50, h * 0.25, w * 0.03, 0, TAU); ctx.fill();

      // Outlines & ridge
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.20, h * 0.20, w * 0.60, h * 0.60);
      ctx.beginPath(); ctx.moveTo(w * 0.50, h * 0.20); ctx.lineTo(w * 0.50, h * 0.80); ctx.stroke();

      ctx.lineWidth = 1.8; ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.28); ctx.lineTo(w * 0.50, h * 0.20); ctx.lineTo(w * 0.62, h * 0.28);
      ctx.stroke();

      ctx.restore();
    }
  }
];
