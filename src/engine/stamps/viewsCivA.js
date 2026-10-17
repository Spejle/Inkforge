import { fitBox } from './settlementsA.js';
// Additional viewing directions for civilization stamps (CivA workstream).
// Light comes from the upper left; soft ground shadow falls to the lower right.
// Deterministic: no Math.random. Crisp dark outline, balanced ctx.save()/ctx.restore().

function groundShadow(ctx, cx, cy, rx, ry, a = 0.25) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(30, 25, 20, ${a})`;
  ctx.fill();
  ctx.restore();
}

function coneRoof(ctx, x1, y1, apexX, apexY, x2, y2, fillCol, outlineCol, lw, shadeCol = 'rgba(30, 25, 20, 0.3)') {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(apexX, apexY);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fillStyle = fillCol;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(x2, y2);
  ctx.lineTo((x1 + x2) / 2, y1);
  ctx.closePath();
  ctx.fillStyle = shadeCol;
  ctx.fill();

  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(apexX, apexY);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.stroke();
}

function coneTop(ctx, cx, cy, r, fillCol, outlineCol, lw, shadeCol = 'rgba(30, 25, 20, 0.28)') {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillCol;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI * 0.25, Math.PI * 0.75);
  ctx.closePath();
  ctx.fillStyle = shadeCol;
  ctx.fill();

  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = lw;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, r * 0.08), 0, Math.PI * 2);
  ctx.fillStyle = outlineCol;
  ctx.fill();
}

function crenellations(ctx, x, y, w, h, count, fillCol, outlineCol, lw) {
  const cw = w / (count * 2 - 1);
  ctx.fillStyle = fillCol;
  ctx.strokeStyle = outlineCol;
  ctx.lineWidth = lw;
  for (let i = 0; i < count; i++) {
    const cx = x + i * cw * 2;
    ctx.fillRect(cx, y, cw, h);
    ctx.strokeRect(cx, y, cw, h);
  }
}

// measured ink bounds of the stamps that overflow their box (see fitBox)
const FIT_VA = { windmill_front: [0.077, 0.823, -0.092, 0.98], tower_wizard_side: [0.055, 0.642, -0.052, 0.98], civ_lighthouse_side: [-0.003, 0.938, 0.005, 1] };

export const STAMPS_VIEWS_CIVA = [
  // 1. castle_citadel (Side)
  {
    id: 'castle_citadel_side',
    name: 'Royal Citadel & Keep (Side)',
    family: 'castle_citadel',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_human',
    groupName: 'Human Castles',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#e2d9cc') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.44, h * 0.07);

      // Central Great Tower (background)
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.38, h * 0.25, w * 0.24, h * 0.65);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.fillRect(w * 0.5, h * 0.25, w * 0.12, h * 0.65);
      coneRoof(ctx, w * 0.34, h * 0.25, w * 0.5, h * 0.05, w * 0.66, h * 0.25, '#b91c1c', color, lw);

      // Curtain wall
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.18, h * 0.5, w * 0.64, h * 0.4);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.18)';
      ctx.fillRect(w * 0.5, h * 0.5, w * 0.32, h * 0.4);
      crenellations(ctx, w * 0.3, h * 0.44, w * 0.4, h * 0.06, 5, fill, color, lw);

      // Left bastion tower
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.14, h * 0.45, w * 0.18, h * 0.45);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.fillRect(w * 0.23, h * 0.45, w * 0.09, h * 0.45);
      coneRoof(ctx, w * 0.11, h * 0.45, w * 0.23, h * 0.28, w * 0.35, h * 0.45, '#b91c1c', color, lw);

      // Right bastion tower
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.68, h * 0.45, w * 0.18, h * 0.45);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.fillRect(w * 0.77, h * 0.45, w * 0.09, h * 0.45);
      coneRoof(ctx, w * 0.65, h * 0.45, w * 0.77, h * 0.28, w * 0.89, h * 0.45, '#b91c1c', color, lw);

      // Side postern arch
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.82, w * 0.04, Math.PI, 0);
      ctx.lineTo(w * 0.54, h * 0.9);
      ctx.lineTo(w * 0.46, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Slits
      ctx.fillRect(w * 0.22, h * 0.58, w * 0.025, h * 0.08);
      ctx.fillRect(w * 0.76, h * 0.58, w * 0.025, h * 0.08);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.38, h * 0.25, w * 0.24, h * 0.65);
      ctx.strokeRect(w * 0.18, h * 0.5, w * 0.64, h * 0.4);
      ctx.strokeRect(w * 0.14, h * 0.45, w * 0.18, h * 0.45);
      ctx.strokeRect(w * 0.68, h * 0.45, w * 0.18, h * 0.45);

      ctx.restore();
    }
  },

  // 2. castle_citadel (Top)
  {
    id: 'castle_citadel_top',
    name: 'Royal Citadel & Keep (Top)',
    family: 'castle_citadel',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_human',
    groupName: 'Human Castles',
    defaultScale: 1.3,
    aspect: 1.0,
    render: (ctx, size, color = '#271c19', fill = '#e2d9cc') => {
      ctx.save();
      const w = size;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.44, h * 0.44, 0.28);

      // Outer square curtain wall ring
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.16, h * 0.16, w * 0.68, h * 0.68);

      // Courtyard in a lighter tone
      ctx.fillStyle = '#f5efe6';
      ctx.fillRect(w * 0.28, h * 0.28, w * 0.44, h * 0.44);

      // Shaded south and east wall walkways
      ctx.fillStyle = 'rgba(30, 25, 20, 0.2)';
      ctx.fillRect(w * 0.26, h * 0.72, w * 0.52, h * 0.08);
      ctx.fillRect(w * 0.72, h * 0.26, w * 0.08, h * 0.52);

      // Gatehouse notch in the south wall
      ctx.fillStyle = '#f5efe6';
      ctx.fillRect(w * 0.43, h * 0.8, w * 0.14, h * 0.08);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(w * 0.47, h * 0.82, w * 0.06, h * 0.06);

      // Curtain wall outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.16, h * 0.16, w * 0.68, h * 0.68);
      ctx.strokeRect(w * 0.28, h * 0.28, w * 0.44, h * 0.44);
      ctx.strokeRect(w * 0.43, h * 0.8, w * 0.14, h * 0.08);

      // Crenellation ticks along curtain wall outer edge
      ctx.lineWidth = lw * 0.75;
      const ticks = [0.28, 0.36, 0.44, 0.52, 0.60, 0.68, 0.72];
      ctx.beginPath();
      for (const t of ticks) {
        ctx.moveTo(w * t, h * 0.16); ctx.lineTo(w * t, h * 0.20);
        ctx.moveTo(w * 0.84, h * t); ctx.lineTo(w * 0.80, h * t);
        ctx.moveTo(w * 0.16, h * t); ctx.lineTo(w * 0.20, h * t);
        if (t < 0.42 || t > 0.58) {
          ctx.moveTo(w * t, h * 0.84); ctx.lineTo(w * t, h * 0.80);
        }
      }
      ctx.stroke();

      // Central keep with red roof ridge line
      const kw = w * 0.26;
      const kh = h * 0.20;
      const kx = w * 0.37;
      const ky = h * 0.38;
      groundShadow(ctx, kx + kw * 0.52, ky + kh * 0.54, kw * 0.52, kh * 0.52, 0.2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(kx, ky, kw, kh * 0.5);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(kx, ky + kh * 0.5, kw, kh * 0.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(kx, ky, kw, kh);
      ctx.beginPath();
      ctx.moveTo(kx, ky + kh * 0.5);
      ctx.lineTo(kx + kw, ky + kh * 0.5);
      ctx.stroke();

      // Four round corner towers: grey stone circles with darker rim + 8-wedge red conical roof
      const rStone = w * 0.11;
      const rRoof = w * 0.082;
      const corners = [
        [w * 0.16, h * 0.16],
        [w * 0.84, h * 0.16],
        [w * 0.16, h * 0.84],
        [w * 0.84, h * 0.84]
      ];
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, rStone, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = lw * 1.1;
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * 0.7;
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
          const a0 = (i * Math.PI) / 4;
          const a1 = ((i + 1) * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, rRoof, a0, a1);
          ctx.closePath();
          const isShaded = i >= 1 && i <= 4;
          ctx.fillStyle = isShaded ? (i % 2 === 0 ? '#991b1b' : '#b91c1c') : (i % 2 === 0 ? '#dc2626' : '#ef4444');
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = lw * 0.4;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, rRoof * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // 3. fortress_keep (Side)
  {
    id: 'fortress_keep_side',
    name: 'Stone Bastion Keep (Side)',
    family: 'fortress_keep',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_human',
    groupName: 'Human Castles',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#1c1917', fill = '#cbd5e1') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.44, h * 0.07, 0.3);

      // Plinth batter (sloped base)
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.9);
      ctx.lineTo(w * 0.22, h * 0.78);
      ctx.lineTo(w * 0.78, h * 0.78);
      ctx.lineTo(w * 0.82, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Main keep body
      ctx.fillRect(w * 0.22, h * 0.35, w * 0.56, h * 0.43);

      // Left corner tower
      ctx.fillRect(w * 0.18, h * 0.3, w * 0.18, h * 0.55);
      // Right corner tower
      ctx.fillRect(w * 0.64, h * 0.3, w * 0.18, h * 0.55);

      // Shaded right sides
      ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.fillRect(w * 0.5, h * 0.35, w * 0.14, h * 0.43);
      ctx.fillRect(w * 0.73, h * 0.3, w * 0.09, h * 0.55);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.78);
      ctx.lineTo(w * 0.78, h * 0.78);
      ctx.lineTo(w * 0.82, h * 0.9);
      ctx.lineTo(w * 0.5, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Crenellations
      crenellations(ctx, w * 0.18, h * 0.24, w * 0.18, h * 0.06, 2, fill, color, lw);
      crenellations(ctx, w * 0.64, h * 0.24, w * 0.18, h * 0.06, 2, fill, color, lw);
      crenellations(ctx, w * 0.36, h * 0.29, w * 0.28, h * 0.06, 3, fill, color, lw);

      // Arrow slits
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w * 0.26, h * 0.48, w * 0.025, h * 0.12);
      ctx.fillRect(w * 0.72, h * 0.48, w * 0.025, h * 0.12);
      ctx.fillRect(w * 0.43, h * 0.48, w * 0.025, h * 0.12);
      ctx.fillRect(w * 0.55, h * 0.48, w * 0.025, h * 0.12);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.18, h * 0.3, w * 0.18, h * 0.55);
      ctx.strokeRect(w * 0.64, h * 0.3, w * 0.18, h * 0.55);
      ctx.strokeRect(w * 0.22, h * 0.35, w * 0.56, h * 0.43);
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.9);
      ctx.lineTo(w * 0.22, h * 0.78);
      ctx.moveTo(w * 0.78, h * 0.78);
      ctx.lineTo(w * 0.82, h * 0.9);
      ctx.lineTo(w * 0.18, h * 0.9);
      ctx.stroke();

      ctx.restore();
    }
  },

  // 4. fortress_keep (Top)
  {
    id: 'fortress_keep_top',
    name: 'Stone Bastion Keep (Top)',
    family: 'fortress_keep',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_human',
    groupName: 'Human Castles',
    defaultScale: 1.2,
    aspect: 1.0,
    render: (ctx, size, color = '#1c1917', fill = '#cbd5e1') => {
      ctx.save();
      const w = size;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.42, h * 0.42, 0.32);

      // Main central keep block
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56);

      // 4 square corner towers projecting outward
      const tw = w * 0.22;
      const th = h * 0.22;
      const towers = [
        [w * 0.12, h * 0.12],
        [w * 0.66, h * 0.12],
        [w * 0.12, h * 0.66],
        [w * 0.66, h * 0.66]
      ];
      for (const [tx, ty] of towers) {
        ctx.fillStyle = fill;
        ctx.fillRect(tx, ty, tw, th);
      }

      // Recessed keep terrace
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(w * 0.32, h * 0.32, w * 0.36, h * 0.36);

      // Shaded south/east parapets
      ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.fillRect(w * 0.22, h * 0.68, w * 0.56, h * 0.1);
      ctx.fillRect(w * 0.68, h * 0.22, w * 0.1, h * 0.56);
      for (const [tx, ty] of towers) {
        ctx.fillRect(tx + tw * 0.5, ty, tw * 0.5, th);
        ctx.fillRect(tx, ty + th * 0.5, tw, th * 0.5);
      }

      // Central stair penthouse / trapdoor
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.44, h * 0.44, w * 0.12, h * 0.12);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56);
      ctx.strokeRect(w * 0.32, h * 0.32, w * 0.36, h * 0.36);
      ctx.strokeRect(w * 0.44, h * 0.44, w * 0.12, h * 0.12);
      for (const [tx, ty] of towers) {
        ctx.strokeRect(tx, ty, tw, th);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx + tw * 0.42, ty + 1, tw * 0.16, 2);
        ctx.fillRect(tx + 1, ty + th * 0.42, 2, th * 0.16);
      }

      ctx.restore();
    }
  },

  // 5. village_houses (Top)
  {
    id: 'village_houses_top',
    name: 'Village Settlement (Top)',
    family: 'village_houses',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'set_human',
    groupName: 'Human Settlements',
    defaultScale: 1.1,
    aspect: 1.3,
    render: (ctx, size, color = '#2c221e', fill = '#dcd4c0') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;
      const lw = h * 0.032;

      groundShadow(ctx, w * 0.5, h * 0.52, w * 0.48, h * 0.42, 0.2);

      // Slightly green ground tone
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.5, w * 0.46, h * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#c8d6af';
      ctx.fill();

      // Short dirt-path strips connecting houses
      ctx.strokeStyle = '#d4b896';
      ctx.lineWidth = w * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.48);
      ctx.lineTo(w * 0.48, h * 0.48);
      ctx.lineTo(w * 0.78, h * 0.44);
      ctx.moveTo(w * 0.48, h * 0.48);
      ctx.lineTo(w * 0.46, h * 0.74);
      ctx.moveTo(w * 0.48, h * 0.48);
      ctx.lineTo(w * 0.52, h * 0.24);
      ctx.stroke();

      // Tiny well circle
      const wellX = w * 0.48;
      const wellY = h * 0.48;
      ctx.beginPath();
      ctx.arc(wellX, wellY, w * 0.038, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 0.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wellX, wellY, w * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();

      // 6 clustered gabled house roofs with tile variations
      const houses = [
        { x: 0.12, y: 0.18, w: 0.25, h: 0.18, vert: false, lit: '#ea580c', dark: '#9a3412', ch: [0.26, 0.21] },
        { x: 0.54, y: 0.12, w: 0.18, h: 0.26, vert: true,  lit: '#dc2626', dark: '#991b1b', ch: [0.60, 0.16] },
        { x: 0.74, y: 0.22, w: 0.22, h: 0.17, vert: false, lit: '#a16207', dark: '#713f12', ch: null },
        { x: 0.10, y: 0.54, w: 0.18, h: 0.28, vert: true,  lit: '#b91c1c', dark: '#7f1d1d', ch: [0.14, 0.60] },
        { x: 0.35, y: 0.68, w: 0.24, h: 0.18, vert: false, lit: '#854d0e', dark: '#582f0e', ch: null },
        { x: 0.66, y: 0.58, w: 0.26, h: 0.19, vert: false, lit: '#d97706', dark: '#9a3412', ch: [0.82, 0.62] }
      ];

      for (const b of houses) {
        const hx = w * b.x;
        const hy = h * b.y;
        const hw = w * b.w;
        const hh = h * b.h;

        groundShadow(ctx, hx + hw * 0.52, hy + hh * 0.54, hw * 0.52, hh * 0.52, 0.2);

        if (b.vert) {
          ctx.fillStyle = b.lit;
          ctx.fillRect(hx, hy, hw * 0.5, hh);
          ctx.fillStyle = b.dark;
          ctx.fillRect(hx + hw * 0.5, hy, hw * 0.5, hh);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.strokeRect(hx, hy, hw, hh);
          ctx.beginPath();
          ctx.moveTo(hx + hw * 0.5, hy);
          ctx.lineTo(hx + hw * 0.5, hy + hh);
          ctx.stroke();
        } else {
          ctx.fillStyle = b.lit;
          ctx.fillRect(hx, hy, hw, hh * 0.5);
          ctx.fillStyle = b.dark;
          ctx.fillRect(hx, hy + hh * 0.5, hw, hh * 0.5);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.strokeRect(hx, hy, hw, hh);
          ctx.beginPath();
          ctx.moveTo(hx, hy + hh * 0.5);
          ctx.lineTo(hx + hw, hy + hh * 0.5);
          ctx.stroke();
        }

        if (b.ch) {
          ctx.fillStyle = '#57534e';
          ctx.fillRect(w * b.ch[0], h * b.ch[1], w * 0.035, h * 0.035);
          ctx.strokeRect(w * b.ch[0], h * b.ch[1], w * 0.035, h * 0.035);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(w * b.ch[0] + 1, h * b.ch[1] + 1, w * 0.02, h * 0.02);
        }
      }

      ctx.restore();
    }
  },

  // 6. windmill (Front)
  {
    id: 'windmill_front',
    name: 'Windmill & Farm (Front)',
    family: 'windmill',
    view: 'front',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_mills',
    groupName: 'Windmills & Mills',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#2c221e', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;
      const lw = h * 0.032;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.40, h * 0.06);

      // Round whitewashed stone tower (warm stone palette)
      ctx.beginPath();
      ctx.moveTo(w * 0.27, h * 0.89);
      ctx.lineTo(w * 0.35, h * 0.40);
      ctx.lineTo(w * 0.65, h * 0.40);
      ctx.lineTo(w * 0.73, h * 0.89);
      ctx.closePath();
      ctx.fillStyle = '#faf8f5';
      ctx.fill();

      // Warm stone plinth at base
      ctx.fillStyle = '#e7dfd5';
      ctx.fillRect(w * 0.26, h * 0.87, w * 0.48, h * 0.04);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.26, h * 0.87, w * 0.48, h * 0.04);

      // Curvature shading on right side
      ctx.fillStyle = 'rgba(45, 35, 25, 0.18)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.40);
      ctx.lineTo(w * 0.65, h * 0.40);
      ctx.lineTo(w * 0.73, h * 0.87);
      ctx.lineTo(w * 0.5, h * 0.87);
      ctx.closePath();
      ctx.fill();

      // Tower outlines
      ctx.beginPath();
      ctx.moveTo(w * 0.27, h * 0.87);
      ctx.lineTo(w * 0.35, h * 0.40);
      ctx.lineTo(w * 0.65, h * 0.40);
      ctx.lineTo(w * 0.73, h * 0.87);
      ctx.stroke();

      // Arched wooden door
      ctx.fillStyle = '#5c3d2e';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.78, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.57, h * 0.87);
      ctx.lineTo(w * 0.43, h * 0.87);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Two small windows (middle and upper floors)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.46, h * 0.60, w * 0.08, h * 0.07);
      ctx.strokeRect(w * 0.46, h * 0.60, w * 0.08, h * 0.07);
      ctx.fillRect(w * 0.465, h * 0.48, w * 0.07, h * 0.06);
      ctx.strokeRect(w * 0.465, h * 0.48, w * 0.07, h * 0.06);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.60); ctx.lineTo(w * 0.5, h * 0.67);
      ctx.moveTo(w * 0.5, h * 0.48); ctx.lineTo(w * 0.5, h * 0.54);
      ctx.stroke();

      // Thatched cone cap (straw gold/amber)
      coneRoof(ctx, w * 0.31, h * 0.40, w * 0.5, h * 0.16, w * 0.69, h * 0.40, '#ca8a04', color, lw, 'rgba(120, 53, 15, 0.35)');

      // Four wide sails with lattice cross-hatching in an X shape, hub in middle of cap (h * 0.28)
      ctx.save();
      ctx.translate(w * 0.5, h * 0.28);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        // Main stock spar
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -w * 0.44);
        ctx.stroke();

        // Wide sail frame
        const fw = w * 0.12;
        const fh = w * 0.34;
        const fy = -w * 0.42;
        ctx.fillStyle = 'rgba(250, 246, 238, 0.75)';
        ctx.fillRect(w * 0.02, fy, fw, fh);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * 0.7;
        ctx.strokeRect(w * 0.02, fy, fw, fh);

        // Lattice cross-hatching: longitudinal bar + crossbars + diagonals
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, fy);
        ctx.lineTo(w * 0.08, fy + fh);
        for (let r = 0; r <= 4; r++) {
          const ry = fy + (fh * r) / 4;
          ctx.moveTo(w * 0.02, ry);
          ctx.lineTo(w * 0.02 + fw, ry);
          if (r < 4) {
            const nextRy = fy + (fh * (r + 1)) / 4;
            ctx.moveTo(w * 0.02, ry);
            ctx.lineTo(w * 0.02 + fw, nextRy);
          }
        }
        ctx.stroke();
      }

      // Sail hub in the middle of the cap
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  },

  // 7. windmill (Top)
  {
    id: 'windmill_top',
    name: 'Windmill & Farm (Top)',
    family: 'windmill',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_mills',
    groupName: 'Windmills & Mills',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#f5f5f4') => {
      ctx.save();
      const w = size;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.38, h * 0.38, 0.25);

      // Conical tower base footprint (outer ring)
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Shaded south/east skirt
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, -Math.PI * 0.25, Math.PI * 0.75);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 25, 20, 0.22)';
      ctx.fill();

      // Conical cap roof
      coneTop(ctx, w * 0.5, h * 0.5, w * 0.22, '#78350f', color, lw);

      // Tail pole
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.68);
      ctx.lineTo(w * 0.5, h * 0.9);
      ctx.stroke();

      // 4 Canvas sails top-down
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.022;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -w * 0.44);
        ctx.stroke();

        ctx.fillStyle = 'rgba(240, 235, 220, 0.85)';
        ctx.fillRect(w * 0.02, -w * 0.42, w * 0.09, w * 0.38);
        ctx.strokeRect(w * 0.02, -w * 0.42, w * 0.09, w * 0.38);
      }
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  },

  // 8. windmill_rustic (Front)
  {
    id: 'windmill_rustic_front',
    name: 'Rustic Windmill (Front)',
    family: 'windmill_rustic',
    view: 'front',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_mills',
    groupName: 'Windmills & Mills',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#2c221e', fill = '#e7e5e4') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;
      const lw = 2.5;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.38, h * 0.06);

      // Round masonry tower base
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.9);
      ctx.lineTo(w * 0.36, h * 0.4);
      ctx.lineTo(w * 0.64, h * 0.4);
      ctx.lineTo(w * 0.72, h * 0.9);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(30, 25, 20, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.4);
      ctx.lineTo(w * 0.64, h * 0.4);
      ctx.lineTo(w * 0.72, h * 0.9);
      ctx.lineTo(w * 0.5, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Tower outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.9);
      ctx.lineTo(w * 0.36, h * 0.4);
      ctx.lineTo(w * 0.64, h * 0.4);
      ctx.lineTo(w * 0.72, h * 0.9);
      ctx.closePath();
      ctx.stroke();

      // Arched door
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.8, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.57, h * 0.9);
      ctx.lineTo(w * 0.43, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Round window
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.52, w * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Conical timber roof cap
      coneRoof(ctx, w * 0.32, h * 0.4, w * 0.5, h * 0.22, w * 0.68, h * 0.4, '#78350f', color, lw);

      // 4 Crossed lattice sails
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -w * 0.4);
        ctx.stroke();

        ctx.fillStyle = 'rgba(250, 245, 235, 0.9)';
        ctx.fillRect(w * 0.02, -w * 0.38, w * 0.1, w * 0.34);
        ctx.strokeRect(w * 0.02, -w * 0.38, w * 0.1, w * 0.34);

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.02, -w * 0.28);
        ctx.lineTo(w * 0.12, -w * 0.28);
        ctx.moveTo(w * 0.02, -w * 0.18);
        ctx.lineTo(w * 0.12, -w * 0.18);
        ctx.stroke();
      }
      // Axle hub
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  },

  // 9. windmill_rustic (Top)
  {
    id: 'windmill_rustic_top',
    name: 'Rustic Windmill (Top)',
    family: 'windmill_rustic',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'civ_mills',
    groupName: 'Windmills & Mills',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#e7e5e4') => {
      ctx.save();
      const w = size;
      const h = size;
      const lw = 2.5;

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.38, h * 0.38, 0.25);

      // Tower base circle
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Right shading on base
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, -Math.PI * 0.25, Math.PI * 0.75);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 25, 20, 0.25)';
      ctx.fill();

      // Conical timber cap roof
      coneTop(ctx, w * 0.5, h * 0.5, w * 0.22, '#78350f', color, lw);

      // Tail pole
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.68);
      ctx.lineTo(w * 0.5, h * 0.92);
      ctx.stroke();

      // 4 Crossed lattice sails
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -w * 0.44);
        ctx.stroke();

        ctx.fillStyle = 'rgba(250, 245, 235, 0.9)';
        ctx.fillRect(w * 0.02, -w * 0.42, w * 0.1, w * 0.36);
        ctx.strokeRect(w * 0.02, -w * 0.42, w * 0.1, w * 0.36);

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.02, -w * 0.3);
        ctx.lineTo(w * 0.12, -w * 0.3);
        ctx.moveTo(w * 0.02, -w * 0.18);
        ctx.lineTo(w * 0.12, -w * 0.18);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  },

  // 10. tower_wizard (Side)
  {
    id: 'tower_wizard_side',
    name: 'Spire of High Sorcery (Side)',
    family: 'tower_wizard',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_wizard',
    groupName: 'Wizard Towers',
    defaultScale: 1.1,
    aspect: 0.7,
    render: (ctx, size, color = '#1e1b4b', fill = '#c7d2fe') => {
      ctx.save();
      const w = size * 0.7;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.42, h * 0.06, 0.3);

      // Slender tower shaft
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.36, h * 0.32, w * 0.28, h * 0.58);

      // Arcane blue shading
      ctx.fillStyle = 'rgba(49, 46, 129, 0.35)';
      ctx.fillRect(w * 0.5, h * 0.32, w * 0.14, h * 0.58);

      // Spiraling arcane stone stairs / buttress rings
      ctx.fillStyle = fill;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 0.7;
      const spiralRungs = [
        [w * 0.32, h * 0.78, w * 0.36, h * 0.06],
        [w * 0.34, h * 0.62, w * 0.34, h * 0.06],
        [w * 0.32, h * 0.46, w * 0.36, h * 0.06]
      ];
      for (const [sx, sy, sw, sh] of spiralRungs) {
        ctx.beginPath();
        ctx.ellipse(sx + sw * 0.5, sy + sh * 0.5, sw * 0.5, sh * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Arched arcane slit window
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(w * 0.42, h * 0.52, w * 0.05, h * 0.1);

      // High spire cone (Indigo)
      coneRoof(ctx, w * 0.3, h * 0.32, w * 0.5, h * 0.05, w * 0.7, h * 0.32, '#4338ca', color, lw, 'rgba(30, 27, 75, 0.35)');

      // Floating arcane crystal orb with magical aura
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.03, w * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.03, w * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inking
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.36, h * 0.32, w * 0.28, h * 0.58);

      ctx.restore();
    }
  },

  // 11. tower_wizard (Top)
  {
    id: 'tower_wizard_top',
    name: 'Spire of High Sorcery (Top)',
    family: 'tower_wizard',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_wizard',
    groupName: 'Wizard Towers',
    defaultScale: 1.1,
    aspect: 1.0,
    render: (ctx, size, color = '#1e1b4b', fill = '#c7d2fe') => {
      ctx.save();
      const w = size;
      const h = size;
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.4, h * 0.4, 0.3);

      // Outer circular tower foundation
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Spiraling buttress notches
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 0.8;
      for (let a = 0; a < Math.PI * 2; a += Math.PI * 0.5) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, w * 0.36, a, a + 0.35);
        ctx.lineTo(w * 0.5 + Math.cos(a + 0.35) * w * 0.28, h * 0.5 + Math.sin(a + 0.35) * h * 0.28);
        ctx.stroke();
      }

      // Conical spire roof
      coneTop(ctx, w * 0.5, h * 0.5, w * 0.26, '#4338ca', color, lw, 'rgba(49, 46, 129, 0.4)');

      // Floating arcane crystal orb radiating energy rings
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }
  },

  // 12. civ_lighthouse (Side)
  {
    id: 'civ_lighthouse_side',
    name: 'Coastal Lighthouse (Side)',
    family: 'civ_lighthouse',
    view: 'side',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_guard',
    groupName: 'Watchtowers & Lighthouses',
    defaultScale: 1.1,
    aspect: 0.85,
    render: (ctx, size, color = '#1c1917', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 0.85;
      const h = size;
      const lw = 2.5;

      // Waves at the foot
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.96);
      for (let i = 0; i <= 6; i++) ctx.quadraticCurveTo(w * (i / 6 + 1 / 24), h * 0.91, w * (i / 6 + 1 / 12), h * 0.96);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        ctx.moveTo(w * (i / 5), h * 0.96);
        ctx.quadraticCurveTo(w * (i / 5 + 1 / 20), h * 0.92, w * (i / 5 + 1 / 10), h * 0.96);
      }
      ctx.stroke();

      // Wide rocky base
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.95);
      ctx.lineTo(w * 0.12, h * 0.86);
      ctx.lineTo(w * 0.25, h * 0.80);
      ctx.lineTo(w * 0.34, h * 0.76);
      ctx.lineTo(w * 0.66, h * 0.76);
      ctx.lineTo(w * 0.78, h * 0.82);
      ctx.lineTo(w * 0.90, h * 0.88);
      ctx.lineTo(w * 0.94, h * 0.95);
      ctx.closePath();
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.76);
      ctx.lineTo(w * 0.66, h * 0.76);
      ctx.lineTo(w * 0.78, h * 0.82);
      ctx.lineTo(w * 0.90, h * 0.88);
      ctx.lineTo(w * 0.94, h * 0.95);
      ctx.lineTo(w * 0.5, h * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Stair path on the rocks
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.0;
      for (const [x1, y1, x2, y2] of [[0.15, 0.91, 0.22, 0.91], [0.20, 0.87, 0.27, 0.87], [0.25, 0.83, 0.32, 0.83], [0.30, 0.79, 0.37, 0.79]]) {
        ctx.beginPath(); ctx.moveTo(w * x1, h * y1); ctx.lineTo(w * x2, h * y2); ctx.stroke();
      }

      // Tall slender tower shaft with three red/white bands
      const bands = [{ y1: 0.28, y2: 0.37, r: true }, { y1: 0.37, y2: 0.46, r: false }, { y1: 0.46, y2: 0.56, r: true }, { y1: 0.56, y2: 0.66, r: false }, { y1: 0.66, y2: 0.76, r: true }];
      for (const b of bands) {
        const x1L = w * (0.38 - (b.y1 - 0.28) * (0.04 / 0.48)), x1R = w * (0.62 + (b.y1 - 0.28) * (0.04 / 0.48));
        const x2L = w * (0.38 - (b.y2 - 0.28) * (0.04 / 0.48)), x2R = w * (0.62 + (b.y2 - 0.28) * (0.04 / 0.48));
        ctx.beginPath(); ctx.moveTo(x1L, h * b.y1); ctx.lineTo(x1R, h * b.y1); ctx.lineTo(x2R, h * b.y2); ctx.lineTo(x2L, h * b.y2); ctx.closePath();
        ctx.fillStyle = b.r ? '#dc2626' : fill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
      }

      // Right shade on tower
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.28);
      ctx.lineTo(w * 0.62, h * 0.28);
      ctx.lineTo(w * 0.66, h * 0.76);
      ctx.lineTo(w * 0.5, h * 0.76);
      ctx.closePath();
      ctx.fill();

      // Keeper's entrance door at tower base
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(w * 0.36, h * 0.68, w * 0.08, h * 0.08);

      // Gallery walkway platform & railing with balusters
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.34, h * 0.26, w * 0.32, h * 0.025);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.34, h * 0.26, w * 0.32, h * 0.025);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.22);
      ctx.lineTo(w * 0.66, h * 0.22);
      for (let bx = 0.36; bx <= 0.65; bx += 0.05) { ctx.moveTo(w * bx, h * 0.26); ctx.lineTo(w * bx, h * 0.22); }
      ctx.stroke();

      // Light beam: two translucent yellow wedges to left and right
      ctx.fillStyle = 'rgba(254, 240, 138, 0.38)';
      ctx.beginPath(); ctx.moveTo(w * 0.40, h * 0.17); ctx.lineTo(0, h * 0.06); ctx.lineTo(0, h * 0.30); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w * 0.60, h * 0.17); ctx.lineTo(w, h * 0.06); ctx.lineTo(w, h * 0.30); ctx.closePath(); ctx.fill();

      // Glassed lantern room
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.40, h * 0.12, w * 0.20, h * 0.10);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.40, h * 0.12, w * 0.20, h * 0.10);
      ctx.beginPath();
      ctx.moveTo(w * 0.47, h * 0.12); ctx.lineTo(w * 0.47, h * 0.22);
      ctx.moveTo(w * 0.53, h * 0.12); ctx.lineTo(w * 0.53, h * 0.22);
      ctx.stroke();

      // Cupola roof and finial
      coneRoof(ctx, w * 0.36, h * 0.12, w * 0.50, h * 0.04, w * 0.64, h * 0.12, '#0f172a', color, lw);
      ctx.beginPath();
      ctx.arc(w * 0.50, h * 0.035, w * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },

  // 13. civ_lighthouse (Top)
  {
    id: 'civ_lighthouse_top',
    name: 'Coastal Lighthouse (Top)',
    family: 'civ_lighthouse',
    view: 'top',
    category: 'world_civilization',
    rotate: 'fixed',
    group: 'cas_guard',
    groupName: 'Watchtowers & Lighthouses',
    defaultScale: 1.1,
    aspect: 1.0,
    render: (ctx, size, color = '#1c1917', fill = '#f5f5f4') => {
      ctx.save();
      const w = size;
      const h = size;
      const lw = 2.5;

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.42, h * 0.42, 0.28);

      // Rocky foundation ring
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#78716c';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Tower body base ring
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      // Red stripe sectors on base
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, 0, Math.PI * 0.5);
      ctx.lineTo(w * 0.5, h * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.34, Math.PI, Math.PI * 1.5);
      ctx.lineTo(w * 0.5, h * 0.5);
      ctx.closePath();
      ctx.fill();

      // Walkway gallery platform
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.stroke();

      // Railing spokes
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + Math.cos(a) * w * 0.18, h * 0.5 + Math.sin(a) * h * 0.18);
        ctx.lineTo(w * 0.5 + Math.cos(a) * w * 0.26, h * 0.5 + Math.sin(a) * h * 0.26);
        ctx.stroke();
      }

      // Lantern room glass ring with warm yellow glow
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Cupola roof (circle top)
      coneTop(ctx, w * 0.5, h * 0.5, w * 0.13, '#0f172a', color, lw);

      // Brass finial ball at center
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }
].map((st) => fitBox(st, FIT_VA[st.id]));
