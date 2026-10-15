// Additional viewing directions for battlemap stamps (viewsBattle workstream).
// Matches existing art style, palette, outline weight, and light direction (light from upper-left).

// ---------- Colour & Drawing Helpers ----------
const hexToRgb = (h) => {
  if (typeof h !== 'string' || !/^#[0-9a-f]{3,6}$/i.test(h)) return [128, 128, 128];
  const s = h.slice(1);
  const full = s.length === 3 ? [...s].map((x) => x + x).join('') : s;
  return [0, 2, 4].map((i) => parseInt(full.substr(i, 2), 16));
};

const mix = (c1, c2, t) => {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
};

const lighten = (c, t = 0.25) => mix(c, '#ffffff', t);
const darken = (c, t = 0.3) => mix(c, '#000000', t);

const groundShadow = (ctx, cx, cy, rx, ry, alpha = 0.35) => {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fill();
  ctx.restore();
};

const poly = (ctx, pts, fillStyle, strokeStyle, lineWidth) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

export const STAMPS_VIEWS_BATTLE = [
  // =========================================================================
  // 1. dungeon_wall_block (Base view: Top)
  // =========================================================================
  {
    id: 'dungeon_wall_block_side',
    name: 'Stone Wall Section (Side)',
    family: 'dungeon_wall_block',
    view: 'side',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_walls',
    groupName: 'Dungeon Walls',
    defaultScale: 1.0,
    aspect: 1.2,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.9, w * 0.44, h * 0.06, 0.35);

      const x = w * 0.1;
      const y = h * 0.22;
      const bw = w * 0.8;
      const bh = h * 0.66;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, bw, bh);

      const ch = bh / 3;
      ctx.fillStyle = lighten(fill, 0.15);
      ctx.fillRect(x, y, bw, h * 0.02);
      ctx.fillRect(x, y + ch, bw, h * 0.02);
      ctx.fillRect(x, y + ch * 2, bw, h * 0.02);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.beginPath();
      ctx.moveTo(x, y + ch);
      ctx.lineTo(x + bw, y + ch);
      ctx.moveTo(x, y + ch * 2);
      ctx.lineTo(x + bw, y + ch * 2);

      ctx.moveTo(x + bw * 0.35, y);
      ctx.lineTo(x + bw * 0.35, y + ch);
      ctx.moveTo(x + bw * 0.72, y);
      ctx.lineTo(x + bw * 0.72, y + ch);

      ctx.moveTo(x + bw * 0.5, y + ch);
      ctx.lineTo(x + bw * 0.5, y + ch * 2);

      ctx.moveTo(x + bw * 0.3, y + ch * 2);
      ctx.lineTo(x + bw * 0.3, y + bh);
      ctx.moveTo(x + bw * 0.68, y + ch * 2);
      ctx.lineTo(x + bw * 0.68, y + bh);
      ctx.stroke();

      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(x, y, bw, bh);

      const capX = w * 0.07;
      const capY = h * 0.12;
      const capW = w * 0.86;
      const capH = h * 0.11;
      ctx.fillStyle = lighten(fill, 0.2);
      ctx.fillRect(capX, capY, capW, capH);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(capX + w * 0.02, capY + h * 0.015, capW - w * 0.04, capH * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(capX, capY, capW, capH);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_wall_block_diag',
    name: 'Stone Wall Section (Diag)',
    family: 'dungeon_wall_block',
    view: 'diag',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_walls',
    groupName: 'Dungeon Walls',
    defaultScale: 1.0,
    aspect: 1.2,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      poly(ctx, [
        [w * 0.45, h * 0.86],
        [w * 0.95, h * 0.68],
        [w * 0.98, h * 0.76],
        [w * 0.5, h * 0.94]
      ], 'rgba(0, 0, 0, 0.35)');

      const pTopL = [w * 0.15, h * 0.32];
      const pTopM = [w * 0.55, h * 0.16];
      const pTopR = [w * 0.88, h * 0.28];
      const pFrontM = [w * 0.48, h * 0.44];

      const pBotL = [w * 0.15, h * 0.74];
      const pBotM = [w * 0.48, h * 0.86];
      const pBotR = [w * 0.88, h * 0.7];

      poly(ctx, [pFrontM, pTopR, pBotR, pBotM], darken(fill, 0.35), color, h * 0.03);
      poly(ctx, [pTopL, pFrontM, pBotM, pBotL], fill, color, h * 0.03);
      poly(ctx, [pTopL, pTopM, pTopR, pFrontM], lighten(fill, 0.3), color, h * 0.03);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      const h1L = [w * 0.15, h * 0.46], h1R = [w * 0.48, h * 0.58];
      const h2L = [w * 0.15, h * 0.6], h2R = [w * 0.48, h * 0.72];
      ctx.moveTo(h1L[0], h1L[1]); ctx.lineTo(h1R[0], h1R[1]);
      ctx.moveTo(h2L[0], h2L[1]); ctx.lineTo(h2R[0], h2R[1]);

      ctx.moveTo(w * 0.32, h * 0.38); ctx.lineTo(w * 0.32, h * 0.52);
      ctx.moveTo(w * 0.28, h * 0.53); ctx.lineTo(w * 0.28, h * 0.66);
      ctx.moveTo(w * 0.36, h * 0.66); ctx.lineTo(w * 0.36, h * 0.8);

      ctx.moveTo(w * 0.48, h * 0.58); ctx.lineTo(w * 0.88, h * 0.42);
      ctx.moveTo(w * 0.48, h * 0.72); ctx.lineTo(w * 0.88, h * 0.56);
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // 2. dungeon_door_wooden (Base view: Top)
  // =========================================================================
  {
    id: 'dungeon_door_wooden_front',
    name: 'Iron-Banded Wood Door (Front)',
    family: 'dungeon_door_wooden',
    view: 'front',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_doors',
    groupName: 'Dungeon Doors',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#1c1917', fill = '#78350f') => {
      ctx.save();
      const s = size;

      groundShadow(ctx, s * 0.5, s * 0.92, s * 0.44, s * 0.06, 0.35);

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(s * 0.12, s * 0.9);
      ctx.lineTo(s * 0.12, s * 0.45);
      ctx.arc(s * 0.5, s * 0.45, s * 0.38, Math.PI, 0, false);
      ctx.lineTo(s * 0.88, s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.22, s * 0.9);
      ctx.lineTo(s * 0.22, s * 0.45);
      ctx.arc(s * 0.5, s * 0.45, s * 0.28, Math.PI, 0, false);
      ctx.lineTo(s * 0.78, s * 0.9);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.025;
      const plankXs = [0.36, 0.5, 0.64];
      for (const px of plankXs) {
        ctx.beginPath();
        ctx.moveTo(s * px, s * 0.9);
        const yTop = 0.45 - Math.sqrt(Math.max(0, 0.28 * 0.28 - (px - 0.5) * (px - 0.5)));
        ctx.lineTo(s * px, s * yTop);
        ctx.stroke();
      }

      poly(ctx, [[s * 0.44, s * 0.07], [s * 0.56, s * 0.07], [s * 0.54, s * 0.2], [s * 0.46, s * 0.2]], '#64748b', color, s * 0.025);

      ctx.fillStyle = '#475569';
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.02;
      const hingeYs = [0.48, 0.75];
      for (const hy of hingeYs) {
        ctx.fillRect(s * 0.18, s * hy, s * 0.45, s * 0.06);
        ctx.strokeRect(s * 0.18, s * hy, s * 0.45, s * 0.06);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(s * 0.25, s * (hy + 0.03), s * 0.015, 0, Math.PI * 2);
        ctx.arc(s * 0.55, s * (hy + 0.03), s * 0.015, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
      }

      ctx.beginPath();
      ctx.arc(s * 0.68, s * 0.65, s * 0.05, 0, Math.PI * 2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = s * 0.025;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.015;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'dungeon_door_wooden_side',
    name: 'Iron-Banded Wood Door (Side)',
    family: 'dungeon_door_wooden',
    view: 'side',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_doors',
    groupName: 'Dungeon Doors',
    defaultScale: 1.0,
    aspect: 0.6,
    render: (ctx, size, color = '#1c1917', fill = '#78350f') => {
      ctx.save();
      const w = size * 0.6;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.44, h * 0.06, 0.35);

      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.15, h * 0.85, w * 0.7, h * 0.07);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(w * 0.15, h * 0.85, w * 0.7, h * 0.07);

      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.22, h * 0.15, w * 0.56, h * 0.7);
      ctx.strokeStyle = color;
      ctx.strokeRect(w * 0.22, h * 0.15, w * 0.56, h * 0.7);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.38, h * 0.18, w * 0.24, h * 0.67);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.strokeRect(w * 0.38, h * 0.18, w * 0.24, h * 0.67);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(w * 0.12, h * 0.09, w * 0.76, h * 0.07);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(w * 0.12, h * 0.09, w * 0.76, h * 0.07);

      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.26, h * 0.32, w * 0.14, h * 0.06);
      ctx.fillRect(w * 0.26, h * 0.68, w * 0.14, h * 0.06);

      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.55, h * 0.04, 0, Math.PI * 2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = h * 0.02;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'dungeon_door_wooden_diag',
    name: 'Iron-Banded Wood Door (Diag)',
    family: 'dungeon_door_wooden',
    view: 'diag',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_doors',
    groupName: 'Dungeon Doors',
    defaultScale: 1.0,
    aspect: 1.1,
    render: (ctx, size, color = '#1c1917', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      groundShadow(ctx, w * 0.55, h * 0.9, w * 0.42, h * 0.07, 0.35);

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.88);
      ctx.lineTo(w * 0.15, h * 0.42);
      ctx.quadraticCurveTo(w * 0.45, h * 0.08, w * 0.75, h * 0.4);
      ctx.lineTo(w * 0.75, h * 0.86);
      ctx.lineTo(w * 0.6, h * 0.86);
      ctx.lineTo(w * 0.6, h * 0.44);
      ctx.quadraticCurveTo(w * 0.45, h * 0.22, w * 0.3, h * 0.45);
      ctx.lineTo(w * 0.3, h * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.45);
      ctx.lineTo(w * 0.42, h * 0.4);
      ctx.lineTo(w * 0.42, h * 0.84);
      ctx.lineTo(w * 0.3, h * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.84);
      ctx.lineTo(w * 0.42, h * 0.4);
      ctx.quadraticCurveTo(w * 0.58, h * 0.24, w * 0.7, h * 0.42);
      ctx.lineTo(w * 0.7, h * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.moveTo(w * 0.52, h * 0.83); ctx.lineTo(w * 0.52, h * 0.35);
      ctx.moveTo(w * 0.62, h * 0.825); ctx.lineTo(w * 0.62, h * 0.38);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.38, h * 0.48, w * 0.28, h * 0.05);
      ctx.fillRect(w * 0.38, h * 0.7, w * 0.28, h * 0.05);

      poly(ctx, [[w * 0.4, h * 0.1], [w * 0.52, h * 0.09], [w * 0.5, h * 0.2], [w * 0.42, h * 0.21]], '#64748b', color, h * 0.025);

      ctx.restore();
    }
  },

  // =========================================================================
  // 3. dungeon_pillar (Base view: Top)
  // =========================================================================
  {
    id: 'dungeon_pillar_side',
    name: 'Carved Dungeon Pillar (Side)',
    family: 'dungeon_pillar',
    view: 'side',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_pillars',
    groupName: 'Pillars & Columns',
    defaultScale: 1.0,
    aspect: 0.75,
    render: (ctx, size, color = '#0f172a', fill = '#475569') => {
      ctx.save();
      const w = size * 0.75;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.93, w * 0.44, h * 0.06, 0.4);

      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.12, h * 0.86, w * 0.76, h * 0.07);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.12, h * 0.86, w * 0.76, h * 0.07);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.18, h * 0.78, w * 0.64, h * 0.08);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(w * 0.2, h * 0.79, w * 0.6, h * 0.02);
      ctx.strokeStyle = color;
      ctx.strokeRect(w * 0.18, h * 0.78, w * 0.64, h * 0.08);

      const colX = w * 0.28;
      const colW = w * 0.44;
      const colY = h * 0.22;
      const colH = h * 0.56;

      const grad = ctx.createLinearGradient(colX, 0, colX + colW, 0);
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.35, fill);
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(colX, colY, colW, colH);

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = h * 0.015;
      ctx.beginPath();
      ctx.moveTo(colX + colW * 0.25, colY); ctx.lineTo(colX + colW * 0.25, colY + colH);
      ctx.moveTo(colX + colW * 0.5, colY); ctx.lineTo(colX + colW * 0.5, colY + colH);
      ctx.moveTo(colX + colW * 0.75, colY); ctx.lineTo(colX + colW * 0.75, colY + colH);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(colX, colY, colW, colH);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.22, h * 0.18, w * 0.56, h * 0.04);
      ctx.strokeRect(w * 0.22, h * 0.18, w * 0.56, h * 0.04);

      poly(ctx, [[w * 0.24, h * 0.18], [w * 0.76, h * 0.18], [w * 0.84, h * 0.12], [w * 0.16, h * 0.12]], '#64748b', color, h * 0.035);

      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.12, h * 0.06, w * 0.76, h * 0.06);
      ctx.strokeRect(w * 0.12, h * 0.06, w * 0.76, h * 0.06);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_pillar_diag',
    name: 'Carved Dungeon Pillar (Diag)',
    family: 'dungeon_pillar',
    view: 'diag',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_pillars',
    groupName: 'Pillars & Columns',
    defaultScale: 1.0,
    aspect: 0.85,
    render: (ctx, size, color = '#0f172a', fill = '#475569') => {
      ctx.save();
      const w = size * 0.85;
      const h = size;

      groundShadow(ctx, w * 0.52, h * 0.9, w * 0.42, h * 0.08, 0.4);

      const cx = w * 0.5;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.86, w * 0.38, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.8, w * 0.32, h * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const r = w * 0.22;
      const topY = h * 0.25;
      const botY = h * 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - r, topY);
      ctx.lineTo(cx - r, botY);
      ctx.ellipse(cx, botY, r, h * 0.05, 0, Math.PI, 0, true);
      ctx.lineTo(cx + r, topY);
      ctx.closePath();

      const grad = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.4, fill);
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = h * 0.015;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.4, topY); ctx.lineTo(cx - r * 0.4, botY);
      ctx.moveTo(cx, topY); ctx.lineTo(cx, botY);
      ctx.moveTo(cx + r * 0.4, topY); ctx.lineTo(cx + r * 0.4, botY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.18, w * 0.34, h * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.12, w * 0.38, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // 4. dungeon_stairs_down (Base view: Top)
  // =========================================================================
  {
    id: 'dungeon_stairs_down_side',
    name: 'Descending Stone Stairs (Side)',
    family: 'dungeon_stairs_down',
    view: 'side',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_stairs',
    groupName: 'Stairs & Ladders',
    defaultScale: 1.1,
    aspect: 1.3,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w * 0.6, h * 0.5, w * 0.35, h * 0.42);

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.22);
      ctx.lineTo(w * 0.25, h * 0.22);
      const steps = 5;
      let curX = w * 0.25;
      let curY = h * 0.22;
      const dx = (w * 0.6) / steps;
      const dy = (h * 0.6) / steps;
      for (let i = 0; i < steps; i++) {
        curY += dy;
        ctx.lineTo(curX, curY);
        curX += dx;
        ctx.lineTo(curX, curY);
      }
      ctx.lineTo(w * 0.85, h * 0.92);
      ctx.lineTo(w * 0.08, h * 0.92);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      curX = w * 0.25;
      curY = h * 0.22;
      for (let i = 0; i < steps; i++) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curX - h * 0.01, curY, h * 0.02, dy);
        curY += dy;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(curX, curY - h * 0.02, dx, h * 0.02);
        curX += dx;
      }

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.55); ctx.lineTo(w * 0.55, h * 0.55);
      ctx.moveTo(w * 0.08, h * 0.75); ctx.lineTo(w * 0.75, h * 0.75);
      ctx.moveTo(w * 0.32, h * 0.55); ctx.lineTo(w * 0.32, h * 0.75);
      ctx.moveTo(w * 0.55, h * 0.75); ctx.lineTo(w * 0.55, h * 0.92);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'dungeon_stairs_down_diag',
    name: 'Descending Stone Stairs (Diag)',
    family: 'dungeon_stairs_down',
    view: 'diag',
    category: 'battle_rooms',
    rotate: 'free',
    group: 'dungeon_stairs',
    groupName: 'Stairs & Ladders',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      poly(ctx, [[w * 0.2, h * 0.2], [w * 0.8, h * 0.2], [w * 0.85, h * 0.82], [w * 0.25, h * 0.82]], '#090d16');

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.04;
      ctx.strokeRect(w * 0.15, h * 0.15, w * 0.7, h * 0.72);

      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const stepY = h * (0.22 + t * 0.55);
        const stepH = h * 0.1;
        const darkness = Math.round(90 - i * 16);

        ctx.fillStyle = `rgb(${darkness + 10}, ${darkness + 15}, ${darkness + 20})`;
        ctx.fillRect(w * 0.2, stepY, w * 0.6, stepH * 0.6);
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.02;
        ctx.strokeRect(w * 0.2, stepY, w * 0.6, stepH * 0.6);

        ctx.fillStyle = `rgb(${darkness - 15}, ${darkness - 10}, ${darkness - 5})`;
        ctx.fillRect(w * 0.2, stepY + stepH * 0.6, w * 0.6, stepH * 0.4);
        ctx.strokeRect(w * 0.2, stepY + stepH * 0.6, w * 0.6, stepH * 0.4);
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 5. prop_table_tavern (Base view: Top)
  // =========================================================================
  {
    id: 'prop_table_tavern_side',
    name: 'Long Tavern Feast Table (Side)',
    family: 'prop_table_tavern',
    view: 'side',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_tables',
    groupName: 'Tables & Desks',
    defaultScale: 1.1,
    aspect: 1.8,
    render: (ctx, size, color = '#2c1810', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.8;
      const h = size;

      groundShadow(ctx, w * 0.24, h * 0.9, w * 0.12, h * 0.04, 0.35);
      groundShadow(ctx, w * 0.76, h * 0.9, w * 0.12, h * 0.04, 0.35);

      ctx.fillStyle = '#54300a';
      ctx.fillRect(w * 0.28, h * 0.44, w * 0.06, h * 0.46);
      ctx.fillRect(w * 0.66, h * 0.44, w * 0.06, h * 0.46);

      ctx.fillStyle = '#713f12';
      ctx.fillRect(w * 0.18, h * 0.68, w * 0.64, h * 0.07);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(w * 0.18, h * 0.68, w * 0.64, h * 0.07);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.2, h * 0.44, w * 0.07, h * 0.46);
      ctx.fillRect(w * 0.73, h * 0.44, w * 0.07, h * 0.46);
      ctx.strokeRect(w * 0.2, h * 0.44, w * 0.07, h * 0.46);
      ctx.strokeRect(w * 0.73, h * 0.44, w * 0.07, h * 0.46);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.08, h * 0.34, w * 0.84, h * 0.11);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(w * 0.08, h * 0.34, w * 0.84, h * 0.03);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.08, h * 0.34, w * 0.84, h * 0.11);

      ctx.restore();
    }
  },
  {
    id: 'prop_table_tavern_diag',
    name: 'Long Tavern Feast Table (Diag)',
    family: 'prop_table_tavern',
    view: 'diag',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_tables',
    groupName: 'Tables & Desks',
    defaultScale: 1.1,
    aspect: 1.6,
    render: (ctx, size, color = '#2c1810', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.6;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.42, h * 0.08, 0.35);

      ctx.fillStyle = '#54300a';
      ctx.fillRect(w * 0.38, h * 0.46, w * 0.05, h * 0.38);
      ctx.fillRect(w * 0.8, h * 0.4, w * 0.05, h * 0.34);

      poly(ctx, [[w * 0.22, h * 0.72], [w * 0.76, h * 0.62], [w * 0.76, h * 0.68], [w * 0.22, h * 0.78]], '#713f12', color, h * 0.025);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.18, h * 0.52, w * 0.06, h * 0.38);
      ctx.fillRect(w * 0.68, h * 0.5, w * 0.06, h * 0.38);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(w * 0.18, h * 0.52, w * 0.06, h * 0.38);
      ctx.strokeRect(w * 0.68, h * 0.5, w * 0.06, h * 0.38);

      poly(ctx, [[w * 0.1, h * 0.42], [w * 0.64, h * 0.42], [w * 0.64, h * 0.49], [w * 0.1, h * 0.49]], fill, color, h * 0.035);
      poly(ctx, [[w * 0.64, h * 0.42], [w * 0.88, h * 0.28], [w * 0.88, h * 0.35], [w * 0.64, h * 0.49]], '#54300a', color, h * 0.035);
      poly(ctx, [[w * 0.1, h * 0.42], [w * 0.34, h * 0.28], [w * 0.88, h * 0.28], [w * 0.64, h * 0.42]], '#a16207', color, h * 0.035);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.37); ctx.lineTo(w * 0.72, h * 0.37);
      ctx.moveTo(w * 0.26, h * 0.33); ctx.lineTo(w * 0.8, h * 0.33);
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // 6. prop_chest_treasure (Base view: Diag)
  // =========================================================================
  {
    id: 'prop_chest_treasure_top',
    name: 'Gilded Treasure Chest (Top)',
    family: 'prop_chest_treasure',
    view: 'top',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_chests',
    groupName: 'Chests & Containers',
    defaultScale: 0.9,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#92400e') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.52, w * 0.44, h * 0.34, 0.35);

      const x = w * 0.14;
      const y = h * 0.22;
      const bw = w * 0.72;
      const bh = h * 0.56;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, bw, bh);

      ctx.fillStyle = '#b45309';
      ctx.fillRect(x, y + bh * 0.35, bw, bh * 0.3);

      ctx.fillStyle = '#eab308';
      const bands = [0.22, 0.46, 0.7];
      for (const bx of bands) {
        ctx.fillRect(w * bx, y, w * 0.08, bh);
      }

      const cr = w * 0.08;
      ctx.fillRect(x, y, cr, cr);
      ctx.fillRect(x + bw - cr, y, cr, cr);
      ctx.fillRect(x, y + bh - cr, cr, cr);
      ctx.fillRect(x + bw - cr, y + bh - cr, cr, cr);

      ctx.fillStyle = '#fde047';
      ctx.fillRect(w * 0.46, y + bh - h * 0.08, w * 0.08, h * 0.1);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(x, y, bw, bh);
      for (const bx of bands) {
        ctx.strokeRect(w * bx, y, w * 0.08, bh);
      }

      ctx.fillStyle = '#fef08a';
      for (const bx of bands) {
        ctx.beginPath();
        ctx.arc(w * (bx + 0.04), y + bh * 0.2, w * 0.012, 0, Math.PI * 2);
        ctx.arc(w * (bx + 0.04), y + bh * 0.8, w * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'prop_chest_treasure_side',
    name: 'Gilded Treasure Chest (Side)',
    family: 'prop_chest_treasure',
    view: 'side',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_chests',
    groupName: 'Chests & Containers',
    defaultScale: 0.9,
    aspect: 0.95,
    render: (ctx, size, color = '#271c19', fill = '#92400e') => {
      ctx.save();
      const w = size * 0.95;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.4, h * 0.08, 0.35);

      const bx = w * 0.18;
      const by = h * 0.45;
      const bw = w * 0.64;
      const bh = h * 0.38;
      ctx.fillStyle = fill;
      ctx.fillRect(bx, by, bw, bh);

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, bx + bw, by);
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.fill();

      ctx.fillStyle = '#eab308';
      ctx.fillRect(bx, by, w * 0.09, bh);
      ctx.fillRect(bx + bw - w * 0.09, by, w * 0.09, bh);

      ctx.lineWidth = h * 0.035;
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, bx + bw, by);
      ctx.stroke();

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(w * 0.42, h * 0.54, w * 0.16, h * 0.06);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.63, w * 0.07, 0, Math.PI * 2);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = h * 0.03;
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, bx + bw, by);
      ctx.stroke();

      ctx.restore();
    }
  },

  // =========================================================================
  // 7. prop_chest_wood (Base view: Diag)
  // =========================================================================
  {
    id: 'prop_chest_wood_top',
    name: 'Dungeon Chest (Top)',
    family: 'prop_chest_wood',
    view: 'top',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_chests',
    groupName: 'Chests & Containers',
    defaultScale: 0.9,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.52, w * 0.44, h * 0.34, 0.35);

      const x = w * 0.14;
      const y = h * 0.22;
      const bw = w * 0.72;
      const bh = h * 0.56;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, bw, bh);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.moveTo(x, y + bh * 0.33); ctx.lineTo(x + bw, y + bh * 0.33);
      ctx.moveTo(x, y + bh * 0.66); ctx.lineTo(x + bw, y + bh * 0.66);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      const bands = [0.2, 0.46, 0.72];
      for (const bx of bands) {
        ctx.fillRect(w * bx, y, w * 0.08, bh);
      }

      const cr = w * 0.07;
      ctx.fillRect(x, y, cr, cr);
      ctx.fillRect(x + bw - cr, y, cr, cr);
      ctx.fillRect(x, y + bh - cr, cr, cr);
      ctx.fillRect(x + bw - cr, y + bh - cr, cr, cr);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.47, y + bh - h * 0.07, w * 0.06, h * 0.09);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(x, y, bw, bh);
      for (const bx of bands) {
        ctx.strokeRect(w * bx, y, w * 0.08, bh);
      }

      ctx.fillStyle = '#cbd5e1';
      for (const bx of bands) {
        ctx.beginPath();
        ctx.arc(w * (bx + 0.04), y + bh * 0.18, w * 0.012, 0, Math.PI * 2);
        ctx.arc(w * (bx + 0.04), y + bh * 0.82, w * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'prop_chest_wood_side',
    name: 'Dungeon Chest (Side)',
    family: 'prop_chest_wood',
    view: 'side',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_chests',
    groupName: 'Chests & Containers',
    defaultScale: 0.9,
    aspect: 0.95,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 0.95;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.4, h * 0.08, 0.35);

      const bx = w * 0.16;
      const by = h * 0.44;
      const bw = w * 0.68;
      const bh = h * 0.38;
      ctx.fillStyle = fill;
      ctx.fillRect(bx, by, bw, bh);

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, bx + bw, by);
      ctx.closePath();
      ctx.fillStyle = '#92400e';
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(bx, by, w * 0.08, bh);
      ctx.fillRect(bx + bw - w * 0.08, by, w * 0.08, bh);

      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.42, h * 0.54, w * 0.16, h * 0.06);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.63, w * 0.065, 0, Math.PI * 2);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = h * 0.025;
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, bx + bw, by);
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(bx + w * 0.04, by + bh * 0.2, w * 0.012, 0, Math.PI * 2);
      ctx.arc(bx + bw - w * 0.04, by + bh * 0.2, w * 0.012, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  // =========================================================================
  // 8. prop_barrel_crate (Base view: Top)
  // =========================================================================
  {
    id: 'prop_barrel_crate_side',
    name: 'Storage Crates & Barrels (Side)',
    family: 'prop_barrel_crate',
    view: 'side',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_storage',
    groupName: 'Barrels & Crates',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      groundShadow(ctx, w * 0.32, h * 0.88, w * 0.22, h * 0.06, 0.35);
      groundShadow(ctx, w * 0.74, h * 0.88, w * 0.2, h * 0.06, 0.35);

      const cx = w * 0.12;
      const cy = h * 0.35;
      const cw = w * 0.4;
      const ch = h * 0.52;
      ctx.fillStyle = fill;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + cw, cy + ch);
      ctx.moveTo(cx + cw, cy); ctx.lineTo(cx, cy + ch);
      ctx.stroke();

      const bx = w * 0.58;
      const by = h * 0.32;
      const bw = w * 0.34;
      const bh = h * 0.55;

      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.15, by);
      ctx.lineTo(bx + bw * 0.85, by);
      ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
      ctx.lineTo(bx + bw * 0.15, by + bh);
      ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.5, bx + bw * 0.15, by);
      ctx.closePath();
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.fillRect(bx + bw * 0.1, by + bh * 0.12, bw * 0.8, bh * 0.07);
      ctx.fillRect(bx + bw * 0.04, by + bh * 0.36, bw * 0.92, bh * 0.07);
      ctx.fillRect(bx + bw * 0.04, by + bh * 0.56, bw * 0.92, bh * 0.07);
      ctx.fillRect(bx + bw * 0.1, by + bh * 0.8, bw * 0.8, bh * 0.07);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + bw * 0.48, by + bh * 0.47, bw * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_crate_diag',
    name: 'Storage Crates & Barrels (Diag)',
    family: 'prop_barrel_crate',
    view: 'diag',
    category: 'battle_props',
    rotate: 'free',
    group: 'prop_storage',
    groupName: 'Barrels & Crates',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      groundShadow(ctx, w * 0.32, h * 0.88, w * 0.24, h * 0.08, 0.35);
      groundShadow(ctx, w * 0.74, h * 0.86, w * 0.22, h * 0.08, 0.35);

      const pTopL = [w * 0.1, h * 0.42];
      const pTopM = [w * 0.28, h * 0.32];
      const pTopR = [w * 0.48, h * 0.4];
      const pFrontM = [w * 0.3, h * 0.5];

      const pBotL = [w * 0.1, h * 0.76];
      const pBotM = [w * 0.3, h * 0.84];
      const pBotR = [w * 0.48, h * 0.74];

      poly(ctx, [pTopL, pFrontM, pBotM, pBotL], fill, color, h * 0.03);
      ctx.beginPath();
      ctx.moveTo(pTopL[0], pTopL[1]); ctx.lineTo(pBotM[0], pBotM[1]);
      ctx.moveTo(pFrontM[0], pFrontM[1]); ctx.lineTo(pBotL[0], pBotL[1]);
      ctx.stroke();

      poly(ctx, [pFrontM, pTopR, pBotR, pBotM], darken(fill, 0.3), color, h * 0.03);
      poly(ctx, [pTopL, pTopM, pTopR, pFrontM], lighten(fill, 0.2), color, h * 0.03);

      const bx = w * 0.56;
      const by = h * 0.3;
      const bw = w * 0.36;
      const bh = h * 0.54;

      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.15, by + bh * 0.1);
      ctx.lineTo(bx + bw * 0.85, by + bh * 0.1);
      ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.55, bx + bw * 0.85, by + bh);
      ctx.lineTo(bx + bw * 0.15, by + bh);
      ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.55, bx + bw * 0.15, by + bh * 0.1);
      ctx.closePath();
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.03;
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.fillRect(bx + bw * 0.08, by + bh * 0.35, bw * 0.84, bh * 0.06);
      ctx.fillRect(bx + bw * 0.06, by + bh * 0.7, bw * 0.88, bh * 0.06);

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(bx + bw * 0.5, by + bh * 0.1, bw * 0.38, bh * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + bw * 0.5, by + bh * 0.1, bw * 0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  // =========================================================================
  // 9. prop_barrel_stack (Base view: Side)
  // =========================================================================
  {
    id: 'prop_barrel_stack_top',
    name: 'Barrel Stack (Top)',
    family: 'prop_barrel_stack',
    view: 'top',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_storage',
    groupName: 'Barrels & Crates',
    defaultScale: 1.0,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.54, w * 0.44, h * 0.38, 0.35);

      const drawBarrelTop = (cx, cy, r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#854d0e';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.035;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.76, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.02;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - r * 0.7, cy);
        ctx.lineTo(cx + r * 0.7, cy);
        ctx.stroke();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(cx + r * 0.25, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBarrelTop(w * 0.5, h * 0.32, w * 0.22);
      drawBarrelTop(w * 0.32, h * 0.65, w * 0.22);
      drawBarrelTop(w * 0.68, h * 0.65, w * 0.22);

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_stack_diag',
    name: 'Barrel Stack (Diag)',
    family: 'prop_barrel_stack',
    view: 'diag',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_storage',
    groupName: 'Barrels & Crates',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.44, h * 0.08, 0.35);

      const drawIsoBarrel = (bx, by, bw, bh) => {
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, by + bh * 0.1);
        ctx.lineTo(bx + bw * 0.85, by + bh * 0.1);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.55, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.15, by + bh);
        ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.55, bx + bw * 0.15, by + bh * 0.1);
        ctx.closePath();
        ctx.fillStyle = '#854d0e';
        ctx.fill();

        ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.5, by + bh * 0.1);
        ctx.lineTo(bx + bw * 0.85, by + bh * 0.1);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.55, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.5, by + bh);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + bw * 0.08, by + bh * 0.32, bw * 0.84, bh * 0.08);
        ctx.fillRect(bx + bw * 0.06, by + bh * 0.68, bw * 0.88, bh * 0.08);

        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.03;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, by + bh * 0.1);
        ctx.lineTo(bx + bw * 0.85, by + bh * 0.1);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.55, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.15, by + bh);
        ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.55, bx + bw * 0.15, by + bh * 0.1);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.ellipse(bx + bw * 0.5, by + bh * 0.1, bw * 0.38, bh * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bx + bw * 0.5, by + bh * 0.1, bw * 0.05, 0, Math.PI * 2);
        ctx.fill();
      };

      drawIsoBarrel(w * 0.08, h * 0.44, w * 0.4, h * 0.44);
      drawIsoBarrel(w * 0.52, h * 0.44, w * 0.4, h * 0.44);
      drawIsoBarrel(w * 0.3, h * 0.12, w * 0.4, h * 0.44);

      ctx.restore();
    }
  },

  // =========================================================================
  // 10. prop_throne_royal (Base view: Front)
  // =========================================================================
  {
    id: 'prop_throne_royal_top',
    name: 'Gilded Royal Throne (Top)',
    family: 'prop_throne_royal',
    view: 'top',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_seating',
    groupName: 'Chairs & Thrones',
    defaultScale: 1.1,
    aspect: 1.0,
    render: (ctx, size, color = '#1c1917', fill = '#b91c1c') => {
      ctx.save();
      const s = size;

      groundShadow(ctx, s * 0.5, s * 0.52, s * 0.42, s * 0.38, 0.35);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(s * 0.16, s * 0.12, s * 0.68, s * 0.16);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.035;
      ctx.strokeRect(s * 0.16, s * 0.12, s * 0.68, s * 0.16);

      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.24, s * 0.18, s * 0.52, s * 0.1);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(s * 0.14, s * 0.28, s * 0.14, s * 0.48);
      ctx.fillRect(s * 0.72, s * 0.28, s * 0.14, s * 0.48);
      ctx.strokeRect(s * 0.14, s * 0.28, s * 0.14, s * 0.48);
      ctx.strokeRect(s * 0.72, s * 0.28, s * 0.14, s * 0.48);

      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.28, s * 0.28, s * 0.44, s * 0.48);
      ctx.strokeRect(s * 0.28, s * 0.28, s * 0.44, s * 0.48);

      ctx.fillStyle = '#fef08a';
      const tufts = [
        [0.4, 0.4], [0.6, 0.4],
        [0.5, 0.52],
        [0.4, 0.64], [0.6, 0.64]
      ];
      for (const [tx, ty] of tufts) {
        ctx.beginPath();
        ctx.arc(s * tx, s * ty, s * 0.015, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(s * 0.28, s * 0.74, s * 0.44, s * 0.06);
      ctx.strokeRect(s * 0.28, s * 0.74, s * 0.44, s * 0.06);

      ctx.restore();
    }
  },
  {
    id: 'prop_throne_royal_side',
    name: 'Gilded Royal Throne (Side)',
    family: 'prop_throne_royal',
    view: 'side',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_seating',
    groupName: 'Chairs & Thrones',
    defaultScale: 1.1,
    aspect: 0.85,
    render: (ctx, size, color = '#1c1917', fill = '#b91c1c') => {
      ctx.save();
      const w = size * 0.85;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.92, w * 0.4, h * 0.06, 0.35);

      poly(ctx, [[w * 0.18, h * 0.12], [w * 0.3, h * 0.1], [w * 0.34, h * 0.58], [w * 0.22, h * 0.58]], '#eab308', color, h * 0.035);

      ctx.beginPath();
      ctx.arc(w * 0.24, h * 0.08, w * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.stroke();

      poly(ctx, [[w * 0.26, h * 0.16], [w * 0.32, h * 0.16], [w * 0.34, h * 0.56], [w * 0.28, h * 0.56]], fill);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.26, h * 0.56, w * 0.52, h * 0.12);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.26, h * 0.56, w * 0.52, h * 0.12);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.24, h * 0.68, w * 0.08, h * 0.24);
      ctx.strokeRect(w * 0.24, h * 0.68, w * 0.08, h * 0.24);
      poly(ctx, [[w * 0.68, h * 0.68], [w * 0.78, h * 0.68], [w * 0.74, h * 0.92], [w * 0.64, h * 0.92]], '#eab308', color, h * 0.03);

      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.38);
      ctx.quadraticCurveTo(w * 0.5, h * 0.36, w * 0.72, h * 0.48);
      ctx.lineTo(w * 0.72, h * 0.56);
      ctx.lineTo(w * 0.64, h * 0.56);
      ctx.quadraticCurveTo(w * 0.46, h * 0.44, w * 0.28, h * 0.44);
      ctx.closePath();
      ctx.fillStyle = '#eab308';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'prop_throne_royal_diag',
    name: 'Gilded Royal Throne (Diag)',
    family: 'prop_throne_royal',
    view: 'diag',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_seating',
    groupName: 'Chairs & Thrones',
    defaultScale: 1.1,
    aspect: 1.05,
    render: (ctx, size, color = '#1c1917', fill = '#b91c1c') => {
      ctx.save();
      const w = size * 1.05;
      const h = size;

      groundShadow(ctx, w * 0.55, h * 0.9, w * 0.42, h * 0.08, 0.35);

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(w * 0.3, h * 0.68, w * 0.06, h * 0.22);
      ctx.fillRect(w * 0.7, h * 0.64, w * 0.06, h * 0.22);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.24, h * 0.72, w * 0.06, h * 0.2);
      ctx.fillRect(w * 0.66, h * 0.72, w * 0.06, h * 0.2);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.strokeRect(w * 0.24, h * 0.72, w * 0.06, h * 0.2);
      ctx.strokeRect(w * 0.66, h * 0.72, w * 0.06, h * 0.2);

      poly(ctx, [[w * 0.25, h * 0.12], [w * 0.5, h * 0.06], [w * 0.75, h * 0.15], [w * 0.75, h * 0.58], [w * 0.25, h * 0.55]], '#eab308', color, h * 0.035);
      poly(ctx, [[w * 0.3, h * 0.16], [w * 0.5, h * 0.11], [w * 0.7, h * 0.19], [w * 0.7, h * 0.54], [w * 0.3, h * 0.52]], fill);

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(w * 0.42, h * 0.28, w * 0.015, 0, Math.PI * 2);
      ctx.arc(w * 0.58, h * 0.32, w * 0.015, 0, Math.PI * 2);
      ctx.arc(w * 0.5, h * 0.42, w * 0.015, 0, Math.PI * 2);
      ctx.fill();

      poly(ctx, [[w * 0.22, h * 0.56], [w * 0.68, h * 0.54], [w * 0.78, h * 0.64], [w * 0.32, h * 0.66]], fill, color, h * 0.03);
      poly(ctx, [[w * 0.22, h * 0.56], [w * 0.32, h * 0.66], [w * 0.32, h * 0.72], [w * 0.22, h * 0.62]], '#991b1b', color, h * 0.025);
      poly(ctx, [[w * 0.32, h * 0.66], [w * 0.78, h * 0.64], [w * 0.78, h * 0.7], [w * 0.32, h * 0.72]], '#7f1d1d', color, h * 0.025);

      poly(ctx, [[w * 0.22, h * 0.44], [w * 0.32, h * 0.5], [w * 0.32, h * 0.66], [w * 0.22, h * 0.56]], '#eab308', color, h * 0.03);
      poly(ctx, [[w * 0.68, h * 0.42], [w * 0.78, h * 0.48], [w * 0.78, h * 0.64], [w * 0.68, h * 0.54]], '#ca8a04', color, h * 0.03);

      ctx.restore();
    }
  },

  // =========================================================================
  // 11. prop_altar_stone (Base view: Diag)
  // =========================================================================
  {
    id: 'prop_altar_stone_top',
    name: 'Ritual Stone Altar (Top)',
    family: 'prop_altar_stone',
    view: 'top',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_altars',
    groupName: 'Altars & Shrines',
    defaultScale: 1.1,
    aspect: 1.4,
    render: (ctx, size, color = '#1c1917', fill = '#64748b') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.52, w * 0.44, h * 0.34, 0.35);

      const sx = w * 0.12;
      const sy = h * 0.22;
      const sw = w * 0.76;
      const sh = h * 0.56;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sx, sy, sw, sh);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = h * 0.02;
      ctx.strokeRect(sx + w * 0.04, sy + h * 0.04, sw - w * 0.08, sh - h * 0.08);

      ctx.fillStyle = '#991b1b';
      ctx.fillRect(w * 0.42, sy - h * 0.02, w * 0.16, sh + h * 0.04);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.42, sy - h * 0.02, w * 0.16, h * 0.03);
      ctx.fillRect(w * 0.42, sy + sh - h * 0.01, w * 0.16, h * 0.03);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.strokeRect(w * 0.42, sy - h * 0.02, w * 0.16, sh + h * 0.04);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.04, 0, Math.PI * 2);
      ctx.moveTo(w * 0.48, h * 0.47); ctx.lineTo(w * 0.52, h * 0.53);
      ctx.stroke();

      const candles = [0.22, 0.78];
      for (const cx of candles) {
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(w * cx, h * 0.5, w * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.02;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w * cx, h * 0.5, w * 0.02, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(w * cx, h * 0.5, w * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(sx, sy, sw, sh);

      ctx.restore();
    }
  },
  {
    id: 'prop_altar_stone_side',
    name: 'Ritual Stone Altar (Side)',
    family: 'prop_altar_stone',
    view: 'side',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_altars',
    groupName: 'Altars & Shrines',
    defaultScale: 1.1,
    aspect: 0.95,
    render: (ctx, size, color = '#1c1917', fill = '#64748b') => {
      ctx.save();
      const w = size * 0.95;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.88, w * 0.42, h * 0.06, 0.4);

      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.15, h * 0.76, w * 0.7, h * 0.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.15, h * 0.76, w * 0.7, h * 0.1);

      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.22, h * 0.46, w * 0.56, h * 0.3);
      ctx.strokeStyle = color;
      ctx.strokeRect(w * 0.22, h * 0.46, w * 0.56, h * 0.3);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(w * 0.14, h * 0.38, w * 0.72, h * 0.08);
      ctx.strokeRect(w * 0.14, h * 0.38, w * 0.72, h * 0.08);

      ctx.fillStyle = '#991b1b';
      ctx.fillRect(w * 0.38, h * 0.38, w * 0.24, h * 0.44);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.38, h * 0.8, w * 0.24, h * 0.02);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.strokeRect(w * 0.38, h * 0.38, w * 0.24, h * 0.44);

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(w * 0.46, h * 0.32, w * 0.08, h * 0.06);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.48, h * 0.24, w * 0.04, h * 0.08);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.16);
      ctx.quadraticCurveTo(w * 0.54, h * 0.22, w * 0.5, h * 0.24);
      ctx.quadraticCurveTo(w * 0.46, h * 0.22, w * 0.5, h * 0.16);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  },

  // =========================================================================
  // 12. prop_bookshelf (Base view: Front)
  // =========================================================================
  {
    id: 'prop_bookshelf_top',
    name: 'Library Bookshelf (Top)',
    family: 'prop_bookshelf',
    view: 'top',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_shelves',
    groupName: 'Bookshelves & Storage',
    defaultScale: 1.1,
    aspect: 1.6,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.6;
      const h = size;

      groundShadow(ctx, w * 0.5, h * 0.52, w * 0.44, h * 0.25, 0.35);

      const x = w * 0.12;
      const y = h * 0.3;
      const bw = w * 0.76;
      const bh = h * 0.4;

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, bw, bh);

      ctx.fillStyle = '#3e2723';
      ctx.fillRect(x + w * 0.03, y + h * 0.06, bw - w * 0.06, bh - h * 0.12);

      ctx.fillStyle = '#92400e';
      ctx.fillRect(w * 0.48, y + h * 0.06, w * 0.04, bh - h * 0.12);

      const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#ea580c', '#0284c7', '#059669', '#d97706', '#4338ca'];
      const slotW = (bw - w * 0.12) / 2;

      const leftCount = 5;
      for (let i = 0; i < leftCount; i++) {
        const bkX = x + w * 0.04 + (slotW / leftCount) * i;
        const bkW = (slotW / leftCount) * 0.85;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bkX, y + h * 0.08, bkW, bh * 0.45);
        ctx.fillStyle = bookColors[i % bookColors.length];
        ctx.fillRect(bkX, y + h * 0.08 + bh * 0.45, bkW, bh * 0.18);
      }

      const rightCount = 5;
      for (let i = 0; i < rightCount; i++) {
        const bkX = w * 0.53 + (slotW / rightCount) * i;
        const bkW = (slotW / rightCount) * 0.85;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(bkX, y + h * 0.08, bkW, bh * 0.45);
        ctx.fillStyle = bookColors[(i + 4) % bookColors.length];
        ctx.fillRect(bkX, y + h * 0.08 + bh * 0.45, bkW, bh * 0.18);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(x, y, bw, bh);

      ctx.fillStyle = lighten(fill, 0.2);
      ctx.fillRect(x, y + bh - h * 0.05, bw, h * 0.05);
      ctx.strokeRect(x, y + bh - h * 0.05, bw, h * 0.05);

      ctx.restore();
    }
  },
  {
    id: 'prop_bookshelf_diag',
    name: 'Library Bookshelf (Diag)',
    family: 'prop_bookshelf',
    view: 'diag',
    category: 'battle_props',
    rotate: 'fixed',
    group: 'prop_shelves',
    groupName: 'Bookshelves & Storage',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      groundShadow(ctx, w * 0.55, h * 0.9, w * 0.42, h * 0.08, 0.35);

      poly(ctx, [[w * 0.18, h * 0.18], [w * 0.42, h * 0.12], [w * 0.84, h * 0.18], [w * 0.6, h * 0.25]], lighten(fill, 0.15), color, h * 0.035);
      poly(ctx, [[w * 0.18, h * 0.18], [w * 0.6, h * 0.25], [w * 0.6, h * 0.88], [w * 0.18, h * 0.82]], fill, color, h * 0.035);
      poly(ctx, [[w * 0.6, h * 0.25], [w * 0.84, h * 0.18], [w * 0.84, h * 0.82], [w * 0.6, h * 0.88]], '#3e2723', color, h * 0.035);

      const shelfYs = [0.44, 0.64, 0.84];
      for (const sy of shelfYs) {
        poly(ctx, [[w * 0.6, h * sy], [w * 0.84, h * (sy - 0.07)], [w * 0.84, h * (sy - 0.04)], [w * 0.6, h * (sy + 0.03)]], '#92400e', color, h * 0.02);
      }

      const colors1 = ['#dc2626', '#2563eb', '#ca8a04', '#16a34a'];
      for (let i = 0; i < 4; i++) {
        const bx = w * (0.62 + i * 0.05);
        const by = h * (0.42 - i * 0.015);
        ctx.fillStyle = colors1[i];
        ctx.fillRect(bx, by - h * 0.12, w * 0.04, h * 0.12);
        ctx.strokeRect(bx, by - h * 0.12, w * 0.04, h * 0.12);
      }

      poly(ctx, [[w * 0.64, h * 0.58], [w * 0.78, h * 0.54], [w * 0.78, h * 0.57], [w * 0.64, h * 0.61]], '#fef08a', color, h * 0.02);

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.76, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }
];
