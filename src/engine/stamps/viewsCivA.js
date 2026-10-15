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

      groundShadow(ctx, w * 0.54, h * 0.54, w * 0.43, h * 0.43, 0.28);

      // Outer curtain wall footprint
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.16, h * 0.16, w * 0.68, h * 0.68);
      // Wall walkway inner shade / courtyard
      ctx.fillStyle = '#baa996';
      ctx.fillRect(w * 0.26, h * 0.26, w * 0.48, h * 0.48);

      // Inner courtyard floor
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.4);

      // Shaded south/east wall walkways
      ctx.fillStyle = 'rgba(30, 25, 20, 0.25)';
      ctx.fillRect(w * 0.16, h * 0.74, w * 0.68, h * 0.1);
      ctx.fillRect(w * 0.74, h * 0.16, w * 0.1, h * 0.68);

      // Gatehouse projection at south
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.42, h * 0.8, w * 0.16, h * 0.1);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(w * 0.47, h * 0.84, w * 0.06, h * 0.06);

      // Outlines for walls
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.16, h * 0.16, w * 0.68, h * 0.68);
      ctx.strokeRect(w * 0.26, h * 0.26, w * 0.48, h * 0.48);
      ctx.strokeRect(w * 0.42, h * 0.8, w * 0.16, h * 0.1);

      // 4 concentric corner bastions (towers)
      const r = w * 0.11;
      const corners = [
        [w * 0.16, h * 0.16],
        [w * 0.84, h * 0.16],
        [w * 0.16, h * 0.84],
        [w * 0.84, h * 0.84]
      ];
      for (const [cx, cy] of corners) {
        coneTop(ctx, cx, cy, r, '#b91c1c', color, lw);
      }

      // Central Great Keep tower
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.38, h * 0.38, w * 0.24, h * 0.24);
      ctx.strokeRect(w * 0.38, h * 0.38, w * 0.24, h * 0.24);
      coneTop(ctx, w * 0.5, h * 0.5, w * 0.15, '#b91c1c', color, lw);

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
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.52, h * 0.54, w * 0.46, h * 0.38, 0.25);

      // Clustered thatched roof silhouettes in top-down tactical view
      const houses = [
        { x: 0.12, y: 0.28, w: 0.36, h: 0.26, roof: '#991b1b', vert: false },
        { x: 0.56, y: 0.2, w: 0.32, h: 0.38, roof: '#854d0e', vert: true },
        { x: 0.34, y: 0.54, w: 0.38, h: 0.26, roof: '#78350f', vert: false }
      ];

      for (const b of houses) {
        const hx = w * b.x;
        const hy = h * b.y;
        const hw = w * b.w;
        const hh = h * b.h;

        // Eaves drop shadow
        groundShadow(ctx, hx + hw * 0.52, hy + hh * 0.54, hw * 0.52, hh * 0.52, 0.2);

        // Wall eaves peek (showing fill tone underneath roof)
        ctx.fillStyle = fill;
        ctx.fillRect(hx + hw * 0.06, hy + hh * 0.06, hw * 0.88, hh * 0.88);

        // Roof slopes: one lit, one shaded
        ctx.fillStyle = b.roof;
        ctx.fillRect(hx, hy, hw, hh);

        if (b.vert) {
          // North-south ridge: left slope lit, right slope shaded
          ctx.fillStyle = 'rgba(30, 20, 15, 0.28)';
          ctx.fillRect(hx + hw * 0.5, hy, hw * 0.5, hh);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.strokeRect(hx, hy, hw, hh);
          // Ridge line
          ctx.beginPath();
          ctx.moveTo(hx + hw * 0.5, hy);
          ctx.lineTo(hx + hw * 0.5, hy + hh);
          ctx.stroke();
          // Chimney
          ctx.fillStyle = '#57534e';
          ctx.fillRect(hx + hw * 0.42, hy + hh * 0.25, hw * 0.16, hh * 0.15);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(hx + hw * 0.46, hy + hh * 0.28, hw * 0.08, hh * 0.09);
        } else {
          // East-west ridge: top slope lit, bottom slope shaded
          ctx.fillStyle = 'rgba(30, 20, 15, 0.28)';
          ctx.fillRect(hx, hy + hh * 0.5, hw, hh * 0.5);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.strokeRect(hx, hy, hw, hh);
          // Ridge line
          ctx.beginPath();
          ctx.moveTo(hx, hy + hh * 0.5);
          ctx.lineTo(hx + hw, hy + hh * 0.5);
          ctx.stroke();
          // Chimney
          ctx.fillStyle = '#57534e';
          ctx.fillRect(hx + hw * 0.25, hy + hh * 0.42, hw * 0.15, hh * 0.16);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(hx + hw * 0.28, hy + hh * 0.46, hw * 0.09, hh * 0.08);
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
      const lw = h * 0.035;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.38, h * 0.06);

      // Symmetrical tapered tower
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.88);
      ctx.lineTo(w * 0.36, h * 0.35);
      ctx.lineTo(w * 0.64, h * 0.35);
      ctx.lineTo(w * 0.72, h * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(30, 25, 20, 0.22)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.35);
      ctx.lineTo(w * 0.64, h * 0.35);
      ctx.lineTo(w * 0.72, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.88);
      ctx.lineTo(w * 0.36, h * 0.35);
      ctx.lineTo(w * 0.64, h * 0.35);
      ctx.lineTo(w * 0.72, h * 0.88);
      ctx.closePath();
      ctx.stroke();

      // Arched wooden door
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.76, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.57, h * 0.88);
      ctx.lineTo(w * 0.43, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // Conical roof cap
      coneRoof(ctx, w * 0.32, h * 0.35, w * 0.5, h * 0.2, w * 0.68, h * 0.35, '#78350f', color, lw);

      // 4 Canvas sails facing front
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.025;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -w * 0.44);
        ctx.stroke();

        ctx.fillStyle = 'rgba(240, 235, 220, 0.85)';
        ctx.fillRect(w * 0.02, -w * 0.42, w * 0.1, w * 0.38);
        ctx.strokeRect(w * 0.02, -w * 0.42, w * 0.1, w * 0.38);
      }
      // Axle hub
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.stroke();
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
    aspect: 0.8,
    render: (ctx, size, color = '#1c1917', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 0.8;
      const h = size;
      const lw = 2.5;

      groundShadow(ctx, w * 0.5, h * 0.94, w * 0.42, h * 0.05);

      // Rocky foundation
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.94);
      ctx.lineTo(w * 0.2, h * 0.84);
      ctx.lineTo(w * 0.8, h * 0.84);
      ctx.lineTo(w * 0.88, h * 0.94);
      ctx.closePath();
      ctx.fillStyle = '#78716c';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();

      // Tower body
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.84);
      ctx.lineTo(w * 0.35, h * 0.28);
      ctx.lineTo(w * 0.65, h * 0.28);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Red stripes
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.7);
      ctx.lineTo(w * 0.31, h * 0.56);
      ctx.lineTo(w * 0.69, h * 0.56);
      ctx.lineTo(w * 0.72, h * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.33, h * 0.42);
      ctx.lineTo(w * 0.35, h * 0.28);
      ctx.lineTo(w * 0.65, h * 0.28);
      ctx.lineTo(w * 0.67, h * 0.42);
      ctx.closePath();
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.28);
      ctx.lineTo(w * 0.65, h * 0.28);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.lineTo(w * 0.5, h * 0.84);
      ctx.closePath();
      ctx.fill();

      // Tower outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.84);
      ctx.lineTo(w * 0.35, h * 0.28);
      ctx.lineTo(w * 0.65, h * 0.28);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.closePath();
      ctx.stroke();

      // Side keeper's door
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(w * 0.32, h * 0.74, w * 0.08, h * 0.1);

      // Walkway platform
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.28, h * 0.26, w * 0.44, h * 0.03);
      ctx.strokeRect(w * 0.28, h * 0.26, w * 0.44, h * 0.03);

      // Railing
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.23);
      ctx.lineTo(w * 0.72, h * 0.23);
      ctx.moveTo(w * 0.3, h * 0.26);
      ctx.lineTo(w * 0.3, h * 0.23);
      ctx.moveTo(w * 0.7, h * 0.26);
      ctx.lineTo(w * 0.7, h * 0.23);
      ctx.stroke();

      // Lantern room
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.36, h * 0.16, w * 0.28, h * 0.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(w * 0.36, h * 0.16, w * 0.28, h * 0.1);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.16);
      ctx.lineTo(w * 0.5, h * 0.26);
      ctx.stroke();

      // Cupola roof
      coneRoof(ctx, w * 0.32, h * 0.16, w * 0.5, h * 0.06, w * 0.68, h * 0.16, '#0f172a', color, lw);

      // Finial
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.05, w * 0.03, 0, Math.PI * 2);
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
];
