// viewsTokens.js - Additional viewing directions (front, side) for battle tokens.
// InkForge battle tokens: light from upper-left, soft ground shadow, crisp dark outlines.

const hexToRgb = (h) => {
  if (typeof h !== 'string' || !/^#[0-9a-f]{3,6}$/i.test(h)) return [128, 128, 128];
  let s = h.slice(1);
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.substring(i, i + 2), 16));
};

const mix = (c1, c2, t) => {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const r = a.map((v, i) => Math.round(Math.max(0, Math.min(255, v + (b[i] - v) * t))));
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
};

const light = (c, t = 0.3) => mix(c, '#ffffff', t);
const dark = (c, t = 0.35) => mix(c, '#000000', t);

const stroke = (ctx, color, lw = 0.03) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

const drawShadow = (ctx, cx = 0.5, cy = 0.9, rx = 0.34, ry = 0.065) => {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.fill();
  ctx.restore();
};

// Seeded PRNG for deterministic rendering variations if needed
export const prng = (seed = 42) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const STAMPS_VIEWS_TOKENS = [
  // =========================================================================
  // 1. KNIGHT HERO TOKEN (token_hero_warrior)
  // =========================================================================
  {
    id: 'token_hero_warrior_front',
    name: 'Knight Hero Token (Front)',
    family: 'token_hero_warrior',
    view: 'front',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes',
    groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e293b', fill = '#3b82f6') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.35, 0.06);

      // Torso / tabard
      ctx.beginPath();
      ctx.moveTo(0.32, 0.52);
      ctx.lineTo(0.68, 0.52);
      ctx.lineTo(0.70, 0.85);
      ctx.lineTo(0.30, 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Central gold tabard stripe
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0.46, 0.52, 0.08, 0.33);
      stroke(ctx, color, 0.02);

      // Pauldrons (shoulders)
      ctx.beginPath();
      ctx.arc(0.28, 0.52, 0.11, Math.PI * 0.7, Math.PI * 1.8);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      stroke(ctx, color, 0.03);

      ctx.beginPath();
      ctx.arc(0.72, 0.52, 0.11, Math.PI * 1.2, Math.PI * 2.3);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Sword upright on knight's right (viewer's left)
      ctx.beginPath();
      ctx.moveTo(0.18, 0.15);
      ctx.lineTo(0.21, 0.20);
      ctx.lineTo(0.21, 0.58);
      ctx.lineTo(0.15, 0.58);
      ctx.lineTo(0.15, 0.20);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      stroke(ctx, color, 0.025);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(0.12, 0.58, 0.12, 0.04);
      stroke(ctx, color, 0.02);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0.165, 0.62, 0.03, 0.07);

      // Heater shield on knight's left (viewer's right)
      ctx.beginPath();
      ctx.moveTo(0.62, 0.46);
      ctx.lineTo(0.88, 0.46);
      ctx.bezierCurveTo(0.88, 0.68, 0.82, 0.80, 0.75, 0.86);
      ctx.bezierCurveTo(0.68, 0.80, 0.62, 0.68, 0.62, 0.46);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 0.035;
      ctx.stroke();
      stroke(ctx, color, 0.02);

      // Shield crest (white cross)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.03;
      ctx.beginPath();
      ctx.moveTo(0.75, 0.52);
      ctx.lineTo(0.75, 0.76);
      ctx.moveTo(0.68, 0.60);
      ctx.lineTo(0.82, 0.60);
      ctx.stroke();

      // Armored helmet
      ctx.beginPath();
      ctx.moveTo(0.38, 0.48);
      ctx.lineTo(0.38, 0.32);
      ctx.bezierCurveTo(0.38, 0.19, 0.62, 0.19, 0.62, 0.32);
      ctx.lineTo(0.62, 0.48);
      ctx.lineTo(0.50, 0.54);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Visor slit
      ctx.beginPath();
      ctx.moveTo(0.40, 0.35);
      ctx.lineTo(0.60, 0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.035;
      ctx.stroke();

      // Plume
      ctx.beginPath();
      ctx.moveTo(0.50, 0.21);
      ctx.bezierCurveTo(0.44, 0.11, 0.52, 0.07, 0.50, 0.05);
      ctx.bezierCurveTo(0.58, 0.08, 0.56, 0.15, 0.50, 0.21);
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.02);

      ctx.restore();
    }
  },
  {
    id: 'token_hero_warrior_side',
    name: 'Knight Hero Token (Side)',
    family: 'token_hero_warrior',
    view: 'side',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes',
    groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e293b', fill = '#3b82f6') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.33, 0.06);

      // Cape flowing down back (left)
      ctx.beginPath();
      ctx.moveTo(0.36, 0.48);
      ctx.bezierCurveTo(0.24, 0.58, 0.20, 0.72, 0.22, 0.85);
      ctx.lineTo(0.42, 0.85);
      ctx.lineTo(0.48, 0.54);
      ctx.closePath();
      ctx.fillStyle = dark(fill, 0.25);
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Torso / breastplate profile
      ctx.beginPath();
      ctx.moveTo(0.40, 0.48);
      ctx.lineTo(0.62, 0.52);
      ctx.bezierCurveTo(0.66, 0.64, 0.62, 0.76, 0.58, 0.85);
      ctx.lineTo(0.38, 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Helmet profile (facing right)
      ctx.beginPath();
      ctx.moveTo(0.32, 0.48);
      ctx.lineTo(0.32, 0.32);
      ctx.bezierCurveTo(0.34, 0.19, 0.54, 0.17, 0.58, 0.27);
      ctx.lineTo(0.68, 0.35);
      ctx.lineTo(0.62, 0.48);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Eye visor slit looking right
      ctx.beginPath();
      ctx.moveTo(0.50, 0.35);
      ctx.lineTo(0.66, 0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.035;
      ctx.stroke();

      // Plume arching back
      ctx.beginPath();
      ctx.moveTo(0.46, 0.19);
      ctx.bezierCurveTo(0.38, 0.11, 0.26, 0.11, 0.20, 0.15);
      ctx.bezierCurveTo(0.28, 0.21, 0.38, 0.21, 0.44, 0.21);
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.02);

      // Heater shield side profile
      ctx.beginPath();
      ctx.moveTo(0.56, 0.46);
      ctx.lineTo(0.78, 0.48);
      ctx.bezierCurveTo(0.80, 0.66, 0.74, 0.78, 0.66, 0.85);
      ctx.bezierCurveTo(0.58, 0.78, 0.56, 0.66, 0.56, 0.46);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 0.035;
      ctx.stroke();
      stroke(ctx, color, 0.02);

      // Shield crest vertical line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.03;
      ctx.beginPath();
      ctx.moveTo(0.68, 0.52);
      ctx.lineTo(0.68, 0.76);
      ctx.stroke();

      // Sword pommel at hip
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0.34, 0.68, 0.08, 0.04);
      stroke(ctx, color, 0.02);

      ctx.restore();
    }
  },

  // =========================================================================
  // 2. ARCANIST MAGE TOKEN (token_hero_mage)
  // =========================================================================
  {
    id: 'token_hero_mage_front',
    name: 'Arcanist Mage Token (Front)',
    family: 'token_hero_mage',
    view: 'front',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes',
    groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e1b4b', fill = '#8b5cf6') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.35, 0.06);

      // Flowing robes
      ctx.beginPath();
      ctx.moveTo(0.30, 0.50);
      ctx.lineTo(0.70, 0.50);
      ctx.lineTo(0.76, 0.87);
      ctx.lineTo(0.24, 0.87);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Deep robe fold shadow
      ctx.beginPath();
      ctx.moveTo(0.44, 0.56);
      ctx.lineTo(0.50, 0.87);
      ctx.lineTo(0.56, 0.56);
      ctx.fillStyle = dark(fill, 0.35);
      ctx.fill();

      // Cyan mantle trim
      ctx.beginPath();
      ctx.moveTo(0.34, 0.50);
      ctx.lineTo(0.50, 0.64);
      ctx.lineTo(0.66, 0.50);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 0.03;
      ctx.stroke();

      // Arcane talisman gem at neck
      ctx.beginPath();
      ctx.arc(0.50, 0.64, 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      stroke(ctx, color, 0.02);

      // Arcane cowl / hood
      ctx.beginPath();
      ctx.moveTo(0.32, 0.50);
      ctx.bezierCurveTo(0.30, 0.34, 0.40, 0.12, 0.50, 0.08);
      ctx.bezierCurveTo(0.60, 0.12, 0.70, 0.34, 0.68, 0.50);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Dark shadow recess under hood
      ctx.beginPath();
      ctx.ellipse(0.50, 0.38, 0.12, 0.14, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Glowing cyan eyes
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0.45, 0.37, 0.025, 0.015, 0, 0, Math.PI * 2);
      ctx.ellipse(0.55, 0.37, 0.025, 0.015, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arcane staff on viewer's right
      const sx = 0.82;
      ctx.beginPath();
      ctx.moveTo(sx, 0.88);
      ctx.lineTo(sx, 0.22);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.035;
      ctx.stroke();
      stroke(ctx, color, 0.015);

      // Staff head: 8-pointed star crystal
      const sy = 0.17;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.09, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.025;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * 0.08, sy + Math.sin(a) * 0.08);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(sx, sy, 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Left hand casting spark
      ctx.beginPath();
      ctx.arc(0.22, 0.62, 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'token_hero_mage_side',
    name: 'Arcanist Mage Token (Side)',
    family: 'token_hero_mage',
    view: 'side',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes',
    groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e1b4b', fill = '#8b5cf6') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.33, 0.06);

      // Flowing robes trailing behind (left)
      ctx.beginPath();
      ctx.moveTo(0.38, 0.44);
      ctx.bezierCurveTo(0.22, 0.54, 0.16, 0.70, 0.18, 0.87);
      ctx.lineTo(0.52, 0.87);
      ctx.lineTo(0.58, 0.56);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Cyan trim along hem
      ctx.beginPath();
      ctx.moveTo(0.18, 0.87);
      ctx.lineTo(0.52, 0.87);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 0.03;
      ctx.stroke();

      // Hood profile (facing right)
      ctx.beginPath();
      ctx.moveTo(0.24, 0.46);
      ctx.bezierCurveTo(0.22, 0.30, 0.34, 0.12, 0.40, 0.08);
      ctx.bezierCurveTo(0.48, 0.12, 0.62, 0.24, 0.66, 0.34);
      ctx.lineTo(0.50, 0.48);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Dark face recess inside hood
      ctx.beginPath();
      ctx.moveTo(0.64, 0.34);
      ctx.lineTo(0.54, 0.48);
      ctx.lineTo(0.46, 0.42);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Glowing eye looking right
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0.54, 0.38, 0.025, 0, Math.PI * 2);
      ctx.fill();

      // Forward sleeve holding staff
      ctx.beginPath();
      ctx.moveTo(0.46, 0.54);
      ctx.lineTo(0.68, 0.58);
      ctx.lineTo(0.66, 0.68);
      ctx.lineTo(0.44, 0.64);
      ctx.closePath();
      ctx.fillStyle = dark(fill, 0.2);
      ctx.fill();
      stroke(ctx, color, 0.025);

      // Vertical staff
      const sx = 0.72;
      ctx.beginPath();
      ctx.moveTo(sx, 0.88);
      ctx.lineTo(sx, 0.20);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.035;
      ctx.stroke();
      stroke(ctx, color, 0.015);

      // Staff star head
      const sy = 0.15;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.08, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.025;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * 0.075, sy + Math.sin(a) * 0.075);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(sx, sy, 0.025, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      ctx.restore();
    }
  },

  // =========================================================================
  // 3. SHADOW ROGUE TOKEN (token_hero_rogue)
  // =========================================================================
  {
    id: 'token_hero_rogue_front',
    name: 'Shadow Rogue Token (Front)',
    family: 'token_hero_rogue',
    view: 'front',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes',
    groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#15803d') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.34, 0.06);

      // Cloak mantle and shoulders
      ctx.beginPath();
      ctx.moveTo(0.30, 0.52);
      ctx.lineTo(0.70, 0.52);
      ctx.lineTo(0.74, 0.87);
      ctx.lineTo(0.26, 0.87);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Leather vest / chest
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0.40, 0.54, 0.20, 0.33);

      // Crossed emerald strap harness
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 0.025;
      ctx.beginPath();
      ctx.moveTo(0.38, 0.56);
      ctx.lineTo(0.62, 0.78);
      ctx.moveTo(0.62, 0.56);
      ctx.lineTo(0.38, 0.78);
      ctx.stroke();

      // Emerald central belt buckle
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0.47, 0.64, 0.06, 0.06);
      stroke(ctx, color, 0.015);

      // Cowl / hood
      ctx.beginPath();
      ctx.moveTo(0.32, 0.48);
      ctx.bezierCurveTo(0.32, 0.26, 0.42, 0.16, 0.50, 0.16);
      ctx.bezierCurveTo(0.58, 0.16, 0.68, 0.26, 0.68, 0.48);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Face opening (eye slit band)
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(0.38, 0.32, 0.24, 0.10);

      // Narrowed rogue eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0.42, 0.35, 0.05, 0.025);
      ctx.fillRect(0.53, 0.35, 0.05, 0.025);

      // Dark face mask covering lower face
      ctx.beginPath();
      ctx.moveTo(0.36, 0.38);
      ctx.lineTo(0.50, 0.42);
      ctx.lineTo(0.64, 0.38);
      ctx.lineTo(0.60, 0.52);
      ctx.lineTo(0.40, 0.52);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      stroke(ctx, color, 0.02);

      // Left dagger (pointing up/out)
      ctx.save();
      ctx.translate(0.22, 0.58);
      ctx.rotate(-0.35);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0.02, -0.30);
      ctx.lineTo(-0.02, -0.30);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      stroke(ctx, color, 0.02);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-0.05, 0, 0.10, 0.03);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-0.02, 0.03, 0.04, 0.06);
      ctx.restore();

      // Right dagger (pointing up/out)
      ctx.save();
      ctx.translate(0.78, 0.58);
      ctx.rotate(0.35);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0.02, -0.30);
      ctx.lineTo(-0.02, -0.30);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      stroke(ctx, color, 0.02);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-0.05, 0, 0.10, 0.03);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-0.02, 0.03, 0.04, 0.06);
      ctx.restore();

      ctx.restore();
    }
  },
  {
    id: 'token_hero_rogue_side',
    name: 'Shadow Rogue Token (Side)',
    family: 'token_hero_rogue',
    view: 'side',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_heroes',
    groupName: 'Hero Tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#15803d') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.32, 0.06);

      // Cloak trailing backward to the left
      ctx.beginPath();
      ctx.moveTo(0.38, 0.44);
      ctx.bezierCurveTo(0.22, 0.52, 0.14, 0.68, 0.18, 0.86);
      ctx.lineTo(0.46, 0.86);
      ctx.lineTo(0.54, 0.56);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      ctx.beginPath();
      ctx.moveTo(0.18, 0.86);
      ctx.lineTo(0.46, 0.86);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 0.025;
      ctx.stroke();

      // Torso profile in dark leather
      ctx.beginPath();
      ctx.moveTo(0.42, 0.50);
      ctx.lineTo(0.64, 0.56);
      ctx.lineTo(0.58, 0.86);
      ctx.lineTo(0.40, 0.86);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      stroke(ctx, color, 0.025);

      // Hood profile
      ctx.beginPath();
      ctx.moveTo(0.28, 0.44);
      ctx.bezierCurveTo(0.26, 0.28, 0.36, 0.18, 0.48, 0.18);
      ctx.bezierCurveTo(0.56, 0.18, 0.64, 0.24, 0.66, 0.30);
      ctx.lineTo(0.46, 0.48);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Mask & jawline profile
      ctx.beginPath();
      ctx.moveTo(0.64, 0.30);
      ctx.lineTo(0.70, 0.38);
      ctx.lineTo(0.62, 0.48);
      ctx.lineTo(0.48, 0.46);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      stroke(ctx, color, 0.02);

      // Keen eye looking right
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0.56, 0.32, 0.03, 0.015, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0.57, 0.32, 0.012, 0, Math.PI * 2);
      ctx.fill();

      // Lead arm & horizontal dagger thrust forward
      ctx.strokeStyle = fill;
      ctx.lineWidth = 0.06;
      ctx.beginPath();
      ctx.moveTo(0.52, 0.58);
      ctx.lineTo(0.68, 0.58);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0.70, 0.58);
      ctx.lineTo(0.92, 0.58);
      ctx.lineTo(0.88, 0.55);
      ctx.lineTo(0.70, 0.56);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      stroke(ctx, color, 0.02);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0.68, 0.54, 0.03, 0.09);

      // Secondary reverse-grip dagger at hip
      ctx.save();
      ctx.translate(0.40, 0.68);
      ctx.rotate(0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0.02, 0.18);
      ctx.lineTo(-0.02, 0.18);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      stroke(ctx, color, 0.02);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-0.04, -0.02, 0.08, 0.03);
      ctx.restore();

      ctx.restore();
    }
  },

  // =========================================================================
  // 4. ELDER RED DRAGON (token_monster_dragon)
  // =========================================================================
  {
    id: 'token_monster_dragon_front',
    name: 'Elder Red Dragon (Front)',
    family: 'token_monster_dragon',
    view: 'front',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_monsters',
    groupName: 'Monster Tokens',
    defaultScale: 1.5,
    aspect: 1,
    render: (ctx, size, color = '#450a0a', fill = '#dc2626') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.40, 0.07);

      // Muscular neck expanding to base
      ctx.beginPath();
      ctx.moveTo(0.32, 0.60);
      ctx.lineTo(0.68, 0.60);
      ctx.lineTo(0.78, 0.88);
      ctx.lineTo(0.22, 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.035);

      // Neck spikes along sides
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(0.28, 0.62); ctx.lineTo(0.18, 0.68); ctx.lineTo(0.26, 0.74);
      ctx.moveTo(0.24, 0.76); ctx.lineTo(0.14, 0.82); ctx.lineTo(0.22, 0.88);
      ctx.moveTo(0.72, 0.62); ctx.lineTo(0.82, 0.68); ctx.lineTo(0.74, 0.74);
      ctx.moveTo(0.76, 0.76); ctx.lineTo(0.86, 0.82); ctx.lineTo(0.78, 0.88);
      ctx.stroke();

      // Ventral throat plates (orange segmented scales)
      ctx.fillStyle = '#f97316';
      for (let y = 0.64; y <= 0.84; y += 0.06) {
        ctx.beginPath();
        ctx.ellipse(0.50, y, 0.12, 0.025, 0, 0, Math.PI * 2);
        ctx.fill();
        stroke(ctx, color, 0.02);
      }

      // Great sweeping horns (yellow/gold)
      ctx.beginPath();
      ctx.moveTo(0.38, 0.34);
      ctx.bezierCurveTo(0.28, 0.28, 0.16, 0.18, 0.10, 0.08);
      ctx.bezierCurveTo(0.18, 0.18, 0.30, 0.28, 0.34, 0.38);
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      stroke(ctx, color, 0.03);

      ctx.beginPath();
      ctx.moveTo(0.62, 0.34);
      ctx.bezierCurveTo(0.72, 0.28, 0.84, 0.18, 0.90, 0.08);
      ctx.bezierCurveTo(0.82, 0.18, 0.70, 0.28, 0.66, 0.38);
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Cheek horns
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0.30, 0.48); ctx.lineTo(0.16, 0.52); ctx.lineTo(0.30, 0.56);
      ctx.closePath(); ctx.fill(); stroke(ctx, color, 0.025);

      ctx.beginPath();
      ctx.moveTo(0.70, 0.48); ctx.lineTo(0.84, 0.52); ctx.lineTo(0.70, 0.56);
      ctx.closePath(); ctx.fill(); stroke(ctx, color, 0.025);

      // Armored dragon head
      ctx.beginPath();
      ctx.moveTo(0.32, 0.36);
      ctx.lineTo(0.42, 0.22);
      ctx.lineTo(0.58, 0.22);
      ctx.lineTo(0.68, 0.36);
      ctx.lineTo(0.66, 0.52);
      ctx.lineTo(0.58, 0.60);
      ctx.lineTo(0.42, 0.60);
      ctx.lineTo(0.34, 0.52);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.035);

      // Brow ridges
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(0.36, 0.34); ctx.lineTo(0.46, 0.34); ctx.lineTo(0.44, 0.38); ctx.lineTo(0.34, 0.38); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0.64, 0.34); ctx.lineTo(0.54, 0.34); ctx.lineTo(0.56, 0.38); ctx.lineTo(0.66, 0.38); ctx.closePath(); ctx.fill();

      // Golden reptilian eyes with slit pupils
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(0.40, 0.38, 0.04, 0.025, -0.2, 0, Math.PI * 2);
      ctx.ellipse(0.60, 0.38, 0.04, 0.025, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(0.395, 0.36, 0.012, 0.04);
      ctx.fillRect(0.595, 0.36, 0.012, 0.04);

      // Flared nostrils
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(0.45, 0.54, 0.02, 0.015, 0, 0, Math.PI * 2);
      ctx.ellipse(0.55, 0.54, 0.02, 0.015, 0, 0, Math.PI * 2);
      ctx.fill();

      // Menacing jaws with sharp fangs
      ctx.beginPath();
      ctx.moveTo(0.38, 0.60);
      ctx.lineTo(0.62, 0.60);
      ctx.lineTo(0.58, 0.68);
      ctx.lineTo(0.42, 0.68);
      ctx.closePath();
      ctx.fillStyle = '#450a0a';
      ctx.fill();
      stroke(ctx, color, 0.025);

      ctx.fillStyle = '#fffbeb';
      // Upper fangs
      ctx.beginPath();
      ctx.moveTo(0.42, 0.60); ctx.lineTo(0.44, 0.65); ctx.lineTo(0.46, 0.60);
      ctx.moveTo(0.48, 0.60); ctx.lineTo(0.50, 0.65); ctx.lineTo(0.52, 0.60);
      ctx.moveTo(0.54, 0.60); ctx.lineTo(0.56, 0.65); ctx.lineTo(0.58, 0.60);
      // Lower fangs
      ctx.moveTo(0.45, 0.68); ctx.lineTo(0.47, 0.63); ctx.lineTo(0.49, 0.68);
      ctx.moveTo(0.51, 0.68); ctx.lineTo(0.53, 0.63); ctx.lineTo(0.55, 0.68);
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'token_monster_dragon_side',
    name: 'Elder Red Dragon (Side)',
    family: 'token_monster_dragon',
    view: 'side',
    category: 'battle_tokens',
    rotate: 'free',
    group: 'token_monsters',
    groupName: 'Monster Tokens',
    defaultScale: 1.5,
    aspect: 1,
    render: (ctx, size, color = '#450a0a', fill = '#dc2626') => {
      ctx.save();
      ctx.scale(size, size);

      drawShadow(ctx, 0.5, 0.89, 0.38, 0.07);

      // Neck profile
      ctx.beginPath();
      ctx.moveTo(0.42, 0.44);
      ctx.bezierCurveTo(0.50, 0.60, 0.58, 0.74, 0.66, 0.88);
      ctx.lineTo(0.24, 0.88);
      ctx.bezierCurveTo(0.20, 0.70, 0.24, 0.52, 0.34, 0.36);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.035);

      // Dorsal spinal spikes running down neck
      ctx.fillStyle = '#f59e0b';
      const spines = [
        [0.32, 0.38, 0.20, 0.34],
        [0.28, 0.50, 0.16, 0.48],
        [0.25, 0.62, 0.12, 0.62],
        [0.23, 0.74, 0.10, 0.76],
      ];
      spines.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1 - 0.03);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y1 + 0.03);
        ctx.closePath();
        ctx.fill();
        stroke(ctx, color, 0.02);
      });

      // Ventral throat plates
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0.44, 0.48);
      ctx.bezierCurveTo(0.52, 0.62, 0.58, 0.74, 0.66, 0.88);
      ctx.lineTo(0.52, 0.88);
      ctx.bezierCurveTo(0.46, 0.74, 0.40, 0.62, 0.36, 0.48);
      ctx.closePath();
      ctx.fill();
      stroke(ctx, color, 0.02);

      // Primary horn arching back and up
      ctx.beginPath();
      ctx.moveTo(0.46, 0.28);
      ctx.bezierCurveTo(0.34, 0.20, 0.22, 0.14, 0.12, 0.08);
      ctx.bezierCurveTo(0.24, 0.16, 0.36, 0.26, 0.40, 0.36);
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      stroke(ctx, color, 0.035);

      // Secondary cheek horn
      ctx.beginPath();
      ctx.moveTo(0.42, 0.38);
      ctx.lineTo(0.26, 0.38);
      ctx.lineTo(0.40, 0.44);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      stroke(ctx, color, 0.025);

      // Upper snout and skull
      ctx.beginPath();
      ctx.moveTo(0.38, 0.36);
      ctx.lineTo(0.48, 0.24);
      ctx.lineTo(0.68, 0.32);
      ctx.lineTo(0.88, 0.40);
      ctx.lineTo(0.68, 0.44);
      ctx.lineTo(0.50, 0.46);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(ctx, color, 0.035);

      // Lower snarling jaw
      ctx.beginPath();
      ctx.moveTo(0.50, 0.46);
      ctx.lineTo(0.82, 0.52);
      ctx.lineTo(0.72, 0.58);
      ctx.lineTo(0.44, 0.52);
      ctx.closePath();
      ctx.fillStyle = dark(fill, 0.25);
      ctx.fill();
      stroke(ctx, color, 0.03);

      // Dark interior of open mouth
      ctx.beginPath();
      ctx.moveTo(0.52, 0.46);
      ctx.lineTo(0.78, 0.45);
      ctx.lineTo(0.76, 0.51);
      ctx.closePath();
      ctx.fillStyle = '#450a0a';
      ctx.fill();

      // Sharp white fangs
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.moveTo(0.84, 0.41); ctx.lineTo(0.82, 0.46); ctx.lineTo(0.80, 0.41);
      ctx.moveTo(0.74, 0.43); ctx.lineTo(0.72, 0.48); ctx.lineTo(0.70, 0.43);
      ctx.moveTo(0.78, 0.51); ctx.lineTo(0.77, 0.46); ctx.lineTo(0.75, 0.51);
      ctx.fill();

      // Golden reptilian eye with slit pupil
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(0.54, 0.30, 0.04, 0.025, 0.2, 0, Math.PI * 2);
      ctx.fill();
      stroke(ctx, color, 0.015);
      ctx.fillStyle = color;
      ctx.fillRect(0.54, 0.28, 0.012, 0.04);

      // Nostril
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0.80, 0.38, 0.02, 0.012, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
];
