// Stamps added for nautical viewing directions.
// Same shape as entries in stampsCatalog.js STAMPS.
// Deterministic detail, balanced save/restore, crisp dark outlines, light from upper left.

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

function drawDropShadow(ctx, x, y, rx, ry, rot = 0, alpha = 0.16) {
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaterRipples(ctx, ripples) {
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  for (const [x, y, rx, ry] of ripples) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEye(ctx, x, y, r, iris, pupil = true) {
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (pupil) {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMastWithRolledSail(ctx, mx, cy, span, color, fill, flag = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(mx, cy - span);
  ctx.lineTo(mx, cy + span);
  ctx.stroke();

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(mx, cy, 3, span * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(mx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (flag) {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(mx, cy);
    ctx.lineTo(mx - 8, cy - 3);
    ctx.lineTo(mx - 8, cy + 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBillowedSail(ctx, m, w, h, color, fill, pennant = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w * m.x, h * 0.65);
  ctx.lineTo(w * m.x, h * m.topY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * (m.x - m.sW * 0.45), h * (m.topY + 0.06));
  ctx.quadraticCurveTo(w * (m.x + 0.04), h * (m.topY + 0.12), w * (m.x + m.sW * 0.55), h * (m.topY + 0.07));
  ctx.lineTo(w * (m.x + m.sW * 0.5), h * (m.topY + 0.06 + m.sH));
  ctx.quadraticCurveTo(w * (m.x + 0.03), h * (m.topY + 0.14 + m.sH), w * (m.x - m.sW * 0.4), h * (m.topY + 0.06 + m.sH));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();

  if (pennant) {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(w * m.x, h * m.topY);
    ctx.lineTo(w * (m.x - 0.06), h * (m.topY + 0.02));
    ctx.lineTo(w * m.x, h * (m.topY + 0.04));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawKrakenTentacles(ctx, tentacles, w, h, fill, color) {
  ctx.strokeStyle = fill;
  ctx.lineWidth = w * 0.045;
  ctx.lineCap = 'round';
  for (const t of tentacles) {
    ctx.beginPath();
    ctx.moveTo(w * t.sx, h * t.sy);
    ctx.bezierCurveTo(w * t.c1x, h * t.c1y, w * t.c2x, h * t.c2y, w * t.ex, h * t.ey);
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  for (const t of tentacles) {
    ctx.beginPath();
    ctx.moveTo(w * t.sx, h * t.sy);
    ctx.bezierCurveTo(w * t.c1x, h * t.c1y, w * t.c2x, h * t.c2y, w * t.ex, h * t.ey);
    ctx.stroke();
    ctx.fillStyle = '#fbcfe8';
    const mx = (t.sx + 3 * t.c1x + 3 * t.c2x + t.ex) / 8;
    const my = (t.sy + 3 * t.c1y + 3 * t.c2y + t.ey) / 8;
    ctx.beginPath();
    ctx.arc(w * mx, h * my, w * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawFangs(ctx, cx, h, w) {
  ctx.fillStyle = '#ffffff';
  const fangs = [
    [cx - w * 0.08, h * 0.42, cx - w * 0.06, h * 0.49, cx - w * 0.04, h * 0.42],
    [cx + w * 0.04, h * 0.42, cx + w * 0.06, h * 0.49, cx + w * 0.08, h * 0.42],
    [cx - w * 0.06, h * 0.65, cx - w * 0.04, h * 0.58, cx - w * 0.02, h * 0.65],
    [cx + w * 0.02, h * 0.65, cx + w * 0.04, h * 0.58, cx + w * 0.06, h * 0.65]
  ];
  for (const [x1, y1, x2, y2, x3, y3] of fangs) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }
}

export const STAMPS_VIEWS_NAUTICAL = [
  // 1. Merchant Caravel (Top)
  {
    id: 'ship_caravel_top',
    name: 'Merchant Caravel (Top)',
    family: 'ship_caravel',
    view: 'top',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_ships',
    groupName: 'Sailing Ships',
    defaultScale: 1.1,
    aspect: 1.1,
    render: (ctx, size, color = '#2c221e', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;
      const cy = h * 0.5;
      drawDropShadow(ctx, w * 0.5, cy + h * 0.04, w * 0.42, h * 0.22);

      // Outer hull
      ctx.beginPath();
      ctx.moveTo(w * 0.12, cy - h * 0.16);
      ctx.quadraticCurveTo(w * 0.5, cy - h * 0.28, w * 0.86, cy);
      ctx.quadraticCurveTo(w * 0.5, cy + h * 0.28, w * 0.12, cy + h * 0.16);
      ctx.lineTo(w * 0.1, cy);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner deck & hatches
      ctx.beginPath();
      ctx.moveTo(w * 0.15, cy - h * 0.12);
      ctx.quadraticCurveTo(w * 0.5, cy - h * 0.21, w * 0.81, cy);
      ctx.quadraticCurveTo(w * 0.5, cy + h * 0.21, w * 0.15, cy + h * 0.12);
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.fill();

      ctx.fillStyle = '#92400e';
      ctx.fillRect(w * 0.15, cy - h * 0.1, w * 0.16, h * 0.2);
      ctx.fillRect(w * 0.44, cy - h * 0.05, w * 0.08, h * 0.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(w * 0.44, cy - h * 0.05, w * 0.08, h * 0.1);

      // Bowsprit
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.84, cy);
      ctx.lineTo(w * 0.98, cy);
      ctx.stroke();

      // Masts & Rolled Sails
      drawMastWithRolledSail(ctx, w * 0.42, cy, h * 0.24, color, fill);
      drawMastWithRolledSail(ctx, w * 0.68, cy, h * 0.18, color, fill);

      ctx.restore();
    }
  },

  // 2. Merchant Caravel (Diag)
  {
    id: 'ship_caravel_diag',
    name: 'Merchant Caravel (Diag)',
    family: 'ship_caravel',
    view: 'diag',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_ships',
    groupName: 'Sailing Ships',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#2c221e', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;
      drawDropShadow(ctx, w * 0.52, h * 0.82, w * 0.38, h * 0.12, -0.2);

      // Wooden Hull (3/4 perspective)
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.54);
      ctx.lineTo(w * 0.32, h * 0.58);
      ctx.lineTo(w * 0.76, h * 0.68);
      ctx.lineTo(w * 0.88, h * 0.74);
      ctx.quadraticCurveTo(w * 0.78, h * 0.88, w * 0.64, h * 0.86);
      ctx.lineTo(w * 0.22, h * 0.78);
      ctx.quadraticCurveTo(w * 0.12, h * 0.7, w * 0.14, h * 0.54);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Deck surface
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.54);
      ctx.lineTo(w * 0.32, h * 0.58);
      ctx.lineTo(w * 0.76, h * 0.68);
      ctx.lineTo(w * 0.88, h * 0.74);
      ctx.lineTo(w * 0.74, h * 0.75);
      ctx.lineTo(w * 0.24, h * 0.64);
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.fill();

      // Bowsprit
      ctx.beginPath();
      ctx.moveTo(w * 0.88, h * 0.74);
      ctx.lineTo(w * 0.98, h * 0.78);
      ctx.stroke();

      // Billowed sails
      drawBillowedSail(ctx, { x: 0.44, topY: 0.16, sW: 0.22, sH: 0.32 }, w, h, color, fill);
      drawBillowedSail(ctx, { x: 0.70, topY: 0.28, sW: 0.16, sH: 0.24 }, w, h, color, fill);

      ctx.restore();
    }
  },

  // 3. War Galleon (Top)
  {
    id: 'ship_galleon_top',
    name: 'War Galleon (Top)',
    family: 'ship_galleon',
    view: 'top',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_ships',
    groupName: 'Sailing Ships',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#271c19', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;
      const cy = h * 0.5;
      drawDropShadow(ctx, w * 0.5, cy + h * 0.04, w * 0.44, h * 0.26);

      // Outer hull
      ctx.beginPath();
      ctx.moveTo(w * 0.12, cy - h * 0.2);
      ctx.quadraticCurveTo(w * 0.5, cy - h * 0.35, w * 0.84, cy - h * 0.06);
      ctx.lineTo(w * 0.9, cy);
      ctx.lineTo(w * 0.84, cy + h * 0.06);
      ctx.quadraticCurveTo(w * 0.5, cy + h * 0.35, w * 0.12, cy + h * 0.2);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Decks & castles
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(w * 0.14, cy - h * 0.17);
      ctx.quadraticCurveTo(w * 0.5, cy - h * 0.26, w * 0.82, cy);
      ctx.quadraticCurveTo(w * 0.5, cy + h * 0.26, w * 0.14, cy + h * 0.17);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#5c2406';
      ctx.fillRect(w * 0.14, cy - h * 0.14, w * 0.18, h * 0.28);
      ctx.fillRect(w * 0.68, cy - h * 0.1, w * 0.12, h * 0.2);

      // Cannons
      ctx.fillStyle = '#1c1917';
      for (const px of [0.36, 0.44, 0.52, 0.6]) {
        ctx.fillRect(w * px, cy - h * 0.27, w * 0.03, h * 0.06);
        ctx.fillRect(w * px, cy + h * 0.21, w * 0.03, h * 0.06);
      }

      // Bowsprit
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.86, cy);
      ctx.lineTo(w * 0.98, cy);
      ctx.stroke();

      // Masts & rolled sails with pennants
      drawMastWithRolledSail(ctx, w * 0.24, cy, h * 0.2, color, fill, true);
      drawMastWithRolledSail(ctx, w * 0.48, cy, h * 0.3, color, fill, true);
      drawMastWithRolledSail(ctx, w * 0.72, cy, h * 0.24, color, fill, true);

      ctx.restore();
    }
  },

  // 4. War Galleon (Diag)
  {
    id: 'ship_galleon_diag',
    name: 'War Galleon (Diag)',
    family: 'ship_galleon',
    view: 'diag',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_ships',
    groupName: 'Sailing Ships',
    defaultScale: 1.3,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;
      drawDropShadow(ctx, w * 0.52, h * 0.84, w * 0.42, h * 0.13, -0.15);

      // War Galleon Hull in 3/4 perspective
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.48);
      ctx.lineTo(w * 0.24, h * 0.54);
      ctx.lineTo(w * 0.7, h * 0.62);
      ctx.lineTo(w * 0.82, h * 0.58);
      ctx.lineTo(w * 0.92, h * 0.68);
      ctx.lineTo(w * 0.78, h * 0.84);
      ctx.lineTo(w * 0.16, h * 0.82);
      ctx.quadraticCurveTo(w * 0.08, h * 0.66, w * 0.1, h * 0.48);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gunports
      ctx.fillStyle = '#1c1917';
      const ports = [
        { x: 0.28, y: 0.66 }, { x: 0.4, y: 0.69 },
        { x: 0.52, y: 0.72 }, { x: 0.64, y: 0.74 }
      ];
      for (const p of ports) {
        ctx.fillRect(w * p.x, h * p.y, w * 0.035, h * 0.035);
      }

      // Bowsprit
      ctx.beginPath();
      ctx.moveTo(w * 0.9, h * 0.68);
      ctx.lineTo(w * 0.98, h * 0.66);
      ctx.stroke();

      // 3 Masts with tiered sails & red pennants
      drawBillowedSail(ctx, { x: 0.26, topY: 0.24, sW: 0.16, sH: 0.16 }, w, h, color, fill, true);
      drawBillowedSail(ctx, { x: 0.5,  topY: 0.12, sW: 0.22, sH: 0.2 },  w, h, color, fill, true);
      drawBillowedSail(ctx, { x: 0.72, topY: 0.22, sW: 0.18, sH: 0.16 }, w, h, color, fill, true);

      ctx.restore();
    }
  },

  // 5. Mythic Leviathan (Top)
  {
    id: 'sea_serpent_top',
    name: 'Mythic Leviathan (Top)',
    family: 'sea_serpent',
    view: 'top',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters',
    groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#0f172a', fill = '#0d9488') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      drawWaterRipples(ctx, [
        [w * 0.18, h * 0.5, w * 0.1, h * 0.16],
        [w * 0.55, h * 0.5, w * 0.1, h * 0.16],
        [w * 0.9, h * 0.5, w * 0.08, h * 0.14]
      ]);

      // Sinuous body coils, inked like the base (dark outline, fill body)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.16, h * 0.5);
      ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.45, h * 0.2, w * 0.55, h * 0.5);
      ctx.bezierCurveTo(w * 0.65, h * 0.8, w * 0.8, h * 0.8, w * 0.9, h * 0.48);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.14 + h * 0.045;
      ctx.stroke();
      ctx.strokeStyle = fill;
      ctx.lineWidth = h * 0.14 - h * 0.01;
      ctx.stroke();

      // Dorsal ridge
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      // Ridge scales sit on the body curve itself
      const segs = [
        [[0.16, 0.5], [0.3, 0.2], [0.45, 0.2], [0.55, 0.5]],
        [[0.55, 0.5], [0.65, 0.8], [0.8, 0.8], [0.9, 0.48]]
      ];
      for (const [a, b, c, d] of segs) {
        for (const t of [0.3, 0.55, 0.8]) {
          const u = 1 - t;
          const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
          const px = k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0];
          const py = k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1];
          ctx.beginPath();
          ctx.arc(w * px, h * py, h * 0.025, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Head
      ctx.fillStyle = fill;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.38);
      ctx.lineTo(w * 0.08, h * 0.5);
      ctx.lineTo(w * 0.2, h * 0.62);
      ctx.quadraticCurveTo(w * 0.24, h * 0.5, w * 0.2, h * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eyes
      drawEye(ctx, w * 0.14, h * 0.44, h * 0.025, '#ef4444', false);
      drawEye(ctx, w * 0.14, h * 0.56, h * 0.025, '#ef4444', false);

      ctx.restore();
    }
  },

  // 6. Mythic Leviathan (Diag)
  {
    id: 'sea_serpent_diag',
    name: 'Mythic Leviathan (Diag)',
    family: 'sea_serpent',
    view: 'diag',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters',
    groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#0f172a', fill = '#0d9488') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      drawWaterRipples(ctx, [
        [w * 0.5, h * 0.72, w * 0.44, h * 0.14],
        [w * 0.5, h * 0.78, w * 0.44, h * 0.14]
      ]);

      // Coils
      const coils = [
        { cx: 0.78, cy: 0.72, rx: 0.12, ry: 0.2 },
        { cx: 0.5,  cy: 0.68, rx: 0.15, ry: 0.28 }
      ];
      for (const c of coils) {
        ctx.beginPath();
        // Solid humps like the base coils, not hollow rings
        ctx.ellipse(w * c.cx, h * c.cy, w * c.rx, h * c.ry, -0.2, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.stroke();
      }

      // Reared Neck & Head
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.76);
      ctx.quadraticCurveTo(w * 0.2, h * 0.38, w * 0.32, h * 0.28);
      ctx.lineTo(w * 0.44, h * 0.24);
      ctx.lineTo(w * 0.36, h * 0.42);
      ctx.quadraticCurveTo(w * 0.28, h * 0.5, w * 0.28, h * 0.76);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shaded underside
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.76);
      ctx.quadraticCurveTo(w * 0.26, h * 0.46, w * 0.36, h * 0.42);
      ctx.lineTo(w * 0.28, h * 0.76);
      ctx.closePath();
      ctx.fill();

      drawEye(ctx, w * 0.32, h * 0.32, h * 0.03, '#ef4444', false);

      ctx.restore();
    }
  },

  // 7. Sea Serpent Head (Front)
  {
    id: 'sea_serpent_head_front',
    name: 'Sea Serpent Head (Front)',
    family: 'sea_serpent_head',
    view: 'front',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters',
    groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#0f172a', fill = '#047857') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;
      const cx = w * 0.5;

      drawWaterRipples(ctx, [[cx, h * 0.88, w * 0.42, h * 0.06]]);

      // Lateral frills
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.2);
      for (const [px, py] of [[0.22, 0.32], [0.26, 0.48], [0.16, 0.62], [0.5, 0.76], [0.84, 0.62], [0.74, 0.48], [0.78, 0.32]]) {
        ctx.lineTo(w * px, h * py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Head & Neck
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.14, h * 0.86);
      ctx.quadraticCurveTo(cx - w * 0.2, h * 0.52, cx - w * 0.18, h * 0.32);
      ctx.quadraticCurveTo(cx, h * 0.22, cx + w * 0.18, h * 0.32);
      ctx.quadraticCurveTo(cx + w * 0.2, h * 0.52, cx + w * 0.14, h * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gaping Maw
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.54, w * 0.13, h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tongue
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.6);
      ctx.lineTo(cx, h * 0.72);
      ctx.lineTo(cx - w * 0.04, h * 0.78);
      ctx.moveTo(cx, h * 0.72);
      ctx.lineTo(cx + w * 0.04, h * 0.78);
      ctx.stroke();

      // Fangs
      drawFangs(ctx, cx, h, w);

      drawEye(ctx, cx - w * 0.12, h * 0.36, w * 0.03, '#f59e0b', true);
      drawEye(ctx, cx + w * 0.12, h * 0.36, w * 0.03, '#f59e0b', true);

      ctx.restore();
    }
  },

  // 8. Sea Serpent Head (Top)
  {
    id: 'sea_serpent_head_top',
    name: 'Sea Serpent Head (Top)',
    family: 'sea_serpent_head',
    view: 'top',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters',
    groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#0f172a', fill = '#047857') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;
      const cx = w * 0.5;

      drawWaterRipples(ctx, [[cx, h * 0.84, w * 0.35, h * 0.1]]);

      // Frills
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.3);
      const frillPts = [
        [0.16, 0.44], [0.24, 0.56], [0.18, 0.72], [0.5, 0.8],
        [0.82, 0.72], [0.76, 0.56], [0.84, 0.44]
      ];
      for (const [px, py] of frillPts) {
        ctx.lineTo(w * px, h * py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Head and neck
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.15);
      ctx.lineTo(cx + w * 0.16, h * 0.36);
      ctx.lineTo(cx + w * 0.12, h * 0.84);
      ctx.lineTo(cx - w * 0.12, h * 0.84);
      ctx.lineTo(cx - w * 0.16, h * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dorsal ridge
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.24);
      ctx.lineTo(cx, h * 0.84);
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx - w * 0.03, h * 0.2, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.03, h * 0.2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Amber eyes
      drawEye(ctx, cx - w * 0.15, h * 0.36, w * 0.025, '#f59e0b', true);
      drawEye(ctx, cx + w * 0.15, h * 0.36, w * 0.025, '#f59e0b', true);

      ctx.restore();
    }
  },

  // 9. Giant Kraken (Side)
  {
    id: 'nautical_kraken_side',
    name: 'Giant Kraken (Side)',
    family: 'nautical_kraken',
    view: 'side',
    category: 'world_nautical',
    rotate: 'fixed',
    group: 'nautical_monsters',
    groupName: 'Sea Serpents & Monsters',
    defaultScale: 1.3,
    aspect: 1.3,
    render: (ctx, size, color = '#1e1b4b', fill = '#4338ca') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      drawWaterRipples(ctx, [[w * 0.5, h * 0.84, w * 0.45, h * 0.06]]);

      // Bulbous Mantle in profile
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.84);
      ctx.quadraticCurveTo(w * 0.16, h * 0.42, w * 0.38, h * 0.38);
      ctx.quadraticCurveTo(w * 0.54, h * 0.46, w * 0.52, h * 0.84);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shaded underside
      ctx.fillStyle = 'rgba(15, 10, 40, 0.35)';
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.38);
      ctx.quadraticCurveTo(w * 0.54, h * 0.46, w * 0.52, h * 0.84);
      ctx.lineTo(w * 0.38, h * 0.84);
      ctx.closePath();
      ctx.fill();

      // Yellow eye with slit pupil
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.62, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(w * 0.375, h * 0.59, w * 0.009, h * 0.06);

      // Massive tentacles
      drawKrakenTentacles(ctx, [
        { sx: 0.26, sy: 0.82, c1x: 0.08, c1y: 0.55, c2x: 0.06, c2y: 0.2, ex: 0.2, ey: 0.14 },
        { sx: 0.44, sy: 0.82, c1x: 0.52, c1y: 0.45, c2x: 0.62, c2y: 0.16, ex: 0.72, ey: 0.12 },
        { sx: 0.48, sy: 0.82, c1x: 0.68, c1y: 0.56, c2x: 0.84, c2y: 0.3, ex: 0.92, ey: 0.24 }
      ], w, h, fill, color);

      // Mantle outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.84);
      ctx.quadraticCurveTo(w * 0.16, h * 0.42, w * 0.38, h * 0.38);
      ctx.quadraticCurveTo(w * 0.54, h * 0.46, w * 0.52, h * 0.84);
      ctx.stroke();

      ctx.restore();
    }
  }
];
