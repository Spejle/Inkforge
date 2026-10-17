import { fitBox } from './settlementsA.js';
import { CAS_KIT as K } from './settlementsB.js';
import { inkPoly, inkShadow, inkStroke, inkHatch } from './inkHelpers.js';
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

// measured ink bounds of the stamps that overflow their box (see fitBox)
const FIT_VA = { windmill_front: [0.077, 0.823, -0.092, 0.98], tower_wizard_side: [0.055, 0.642, -0.052, 0.98], civ_lighthouse_side: [-0.003, 0.938, 0.005, 1] };


// Draw in the 100-unit space of the cas_* settlement art (settlementsB), so the
// castle/keep/spire views share its palette, ink weight and lighting.
function casView(ctx, size, color, fill, aspect, seed, draw) {
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  draw(ctx, K.pal(color, fill), 100 * aspect, 100, K.rng(seed));
  ctx.restore();
}
// Conical tower roof seen from above: lit north-west half, shaded south-east, shingle rays.
function casConeTop(c, P, cx, cy, r, col, tip = [cx, cy]) {
  c.beginPath(); c.arc(cx, cy, r, 0, K.TAU); c.fillStyle = K.dk(col, 0.3); c.fill();
  c.save(); c.clip();
  c.beginPath(); c.moveTo(cx - r * 2, cy + r * 2); c.lineTo(cx + r * 2, cy - r * 2); c.lineTo(cx - r * 2, cy - r * 2); c.closePath();
  c.fillStyle = K.lt(col, 0.22); c.fill();
  c.globalAlpha = 0.28; c.lineWidth = 0.5; c.strokeStyle = P.ink; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * K.TAU; c.moveTo(tip[0], tip[1]); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  c.stroke(); c.restore();
  c.beginPath(); c.arc(cx, cy, r, 0, K.TAU); K.ink(c, P);
  c.beginPath(); c.arc(tip[0], tip[1], 1.2, 0, K.TAU); c.fillStyle = P.ink; c.fill();
}
// Hipped roof seen from above: north/west faces lit, south/east shaded.
function casHipTop(c, P, x, y, w, h, col) {
  const m = [x + w / 2, y + h / 2];
  const faces = [[[x, y], [x + w, y], m, 0.22], [[x, y], [x, y + h], m, 0.12], [[x + w, y], [x + w, y + h], m, -0.2], [[x, y + h], [x + w, y + h], m, -0.32]];
  for (const [a, b, mm, t] of faces) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(mm[0], mm[1]); c.closePath(); c.fillStyle = t > 0 ? K.lt(col, t) : K.dk(col, -t); c.fill(); }
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.strokeStyle = P.ink; c.globalAlpha = 0.6; c.lineWidth = 0.8; c.stroke(); c.globalAlpha = 1;
  c.beginPath(); c.rect(x, y, w, h); K.ink(c, P);
}
// Curtain wall seen from above: stone wall-walk band with merlon teeth on the outer edge.
function casWallTop(c, P, x, y, w, h, t) {
  c.beginPath(); c.rect(x, y, w, h); c.rect(x + t, y + t, w - 2 * t, h - 2 * t);
  c.fillStyle = P.lit; c.fill('evenodd');
  c.fillStyle = P.dk; c.fillRect(x + w - t, y, t, h); c.fillRect(x, y + h - t, w, t);
  c.fillStyle = P.dd;
  for (let k = x + 2; k < x + w - 2; k += 4) { c.fillRect(k, y, 2, t * 0.35); c.fillRect(k, y + h - t * 0.35, 2, t * 0.35); }
  for (let k = y + 2; k < y + h - 2; k += 4) { c.fillRect(x, k, t * 0.35, 2); c.fillRect(x + w - t * 0.35, k, t * 0.35, 2); }
  c.beginPath(); c.rect(x, y, w, h); K.ink(c, P);
  c.beginPath(); c.rect(x + t, y + t, w - 2 * t, h - 2 * t); K.ink(c, P, 1.2);
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
      // cas_human_castle seen from its flank: keep and blue inner tower behind, curtain wall, red corner towers
      casView(ctx, size, color, fill, 1.2, 11, (c, P, W, H, r) => {
        K.shadow(c, 62, 91, 50, 6);
        K.tufts(c, P, r, 8, 112, 91, 12);
        K.tower(c, P, 74, 78, 28, 42, { rnd: r, roof: K.RED, rh: 21, slits: 2, flag: K.RED, flagH: 9, cyl: false, ov: 3 });
        K.tower(c, P, 42, 78, 12, 40, { rnd: r, roof: K.BLUE, rh: 16, slits: 1 });
        K.wall(c, P, 18, 102, 90, 22, { rnd: r, slits: 6 });
        K.gate(c, P, 58, 90, 8, 12, { port: true });
        K.tower(c, P, 100, 86, 14, 46, { rnd: r, roof: K.RED, rh: 19, slits: 2, flag: K.GOLD, flagH: 8, fdir: -1 });
        K.tower(c, P, 18, 90, 17, 52, { rnd: r, roof: K.RED, rh: 22, slits: 2, flag: K.GOLD, flagH: 9 });
      });
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
      // cas_human_castle from above: walled courtyard, red-roofed keep, red front / blue back towers, gatehouse
      casView(ctx, size, color, fill, 1.0, 11, (c, P) => {
        K.shadow(c, 54, 56, 44, 40, 0.28);
        c.fillStyle = '#b8a77c'; c.fillRect(18, 18, 64, 64);
        c.fillStyle = 'rgba(76,122,62,0.35)'; c.fillRect(18, 18, 64, 64);
        casWallTop(c, P, 14, 14, 72, 72, 7);
        casHipTop(c, P, 36, 26, 28, 26, K.RED);
        K.flag(c, P, 50, 39, 0.1, K.RED, { w: 10, h: 4 });
        c.fillStyle = P.lit; c.fillRect(41, 76, 18, 14); c.fillStyle = P.dk; c.fillRect(52, 76, 7, 14);
        c.fillStyle = K.VOID; c.fillRect(46, 84, 8, 6);
        c.beginPath(); c.rect(41, 76, 18, 14); K.ink(c, P);
        casConeTop(c, P, 18, 18, 8, K.BLUE);
        casConeTop(c, P, 82, 18, 8, K.BLUE);
        casConeTop(c, P, 17, 83, 11, K.RED);
        casConeTop(c, P, 83, 83, 11, K.RED);
      });
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
      // cas_human_keep from the flank: the twin red towers line up, one in front of the other
      casView(ctx, size, color, fill, 1.1, 11, (c, P, W, H, r) => {
        K.shadow(c, 58, 90, 44, 6);
        K.tufts(c, P, r, 12, 100, 90, 10);
        K.tower(c, P, 34, 84, 12, 54, { rnd: r, roof: K.RED, rh: 16, slits: 1 });
        K.body(c, P, 36, 38, 54, 50, { rnd: r });
        K.merl(c, P, 36, 38, 54);
        K.slit(c, P, 52, 50, 2.4, 8); K.slit(c, P, 66, 50, 2.4, 8, K.GLOW); K.slit(c, P, 80, 50, 2.4, 8);
        K.gate(c, P, 72, 88, 7, 11, { glow: '#2a1d14' });
        K.flag(c, P, 63, 33, 20, K.RED, { dot: K.GOLD });
        K.tower(c, P, 28, 88, 14, 58, { rnd: r, roof: K.RED, rh: 17, slits: 1, flag: K.BLUE, flagH: 9 });
      });
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
      // cas_human_keep from above: square keep with wall-walk, two red-capped towers flanking the gate
      casView(ctx, size, color, fill, 1.0, 11, (c, P) => {
        K.shadow(c, 54, 54, 40, 36, 0.28);
        c.fillStyle = P.dk; c.fillRect(26, 22, 48, 46);
        casWallTop(c, P, 26, 22, 48, 46, 7);
        c.fillStyle = '#56607a'; c.fillRect(46, 40, 8, 8); c.beginPath(); c.rect(46, 40, 8, 8); K.ink(c, P, 1);
        K.flag(c, P, 50, 34, 0.1, K.RED, { w: 11, h: 4.5, dot: K.GOLD });
        c.fillStyle = K.VOID; c.fillRect(45, 68, 10, 6); c.beginPath(); c.rect(45, 68, 10, 6); K.ink(c, P, 1);
        casConeTop(c, P, 29, 70, 11, K.RED);
        casConeTop(c, P, 71, 70, 11, K.RED);
      });
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
      const w = size * 1.3, h = size;
      ctx.save();
      // the base's three gabled houses from above: ridge roofs, lit north slope, shaded south slope
      ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.62); ctx.bezierCurveTo(w * 0.35, h * 0.5, w * 0.6, h * 0.62, w * 0.95, h * 0.5);
      ctx.strokeStyle = 'rgba(150,120,80,0.45)'; ctx.lineWidth = h * 0.08; ctx.lineCap = 'round'; ctx.stroke();
      const house = (x, y, rw, rd, roof) => {
        inkShadow(ctx, x + rw * 0.56, y + rd * 0.62, rw * 0.6, rd * 0.62, 0.24);
        inkPoly(ctx, [[x, y], [x + rw, y], [x + rw, y + rd / 2], [x, y + rd / 2]]); ctx.fillStyle = roof; ctx.fill(); ctx.fillStyle = 'rgba(255,246,220,0.25)'; ctx.fill();
        inkPoly(ctx, [[x, y + rd / 2], [x + rw, y + rd / 2], [x + rw, y + rd], [x, y + rd]]); ctx.fillStyle = roof; ctx.fill(); ctx.fillStyle = 'rgba(50,35,25,0.35)'; ctx.fill();
        const segs = []; for (let k = 1; k < 6; k++) { const xx = x + (rw * k) / 6; segs.push([xx, y, xx, y + rd]); }
        inkHatch(ctx, color, h * 0.008, segs, 0.4);
        ctx.fillStyle = '#6b5a4a'; ctx.fillRect(x + rw * 0.72, y + rd * 0.12, rw * 0.1, rd * 0.22);
        inkPoly(ctx, [[x, y], [x + rw, y], [x + rw, y + rd], [x, y + rd]]); inkStroke(ctx, color, h * 0.024);
        inkPoly(ctx, [[x, y + rd / 2], [x + rw, y + rd / 2]], false); inkStroke(ctx, color, h * 0.014);
      };
      house(w * 0.08, h * 0.16, w * 0.3, h * 0.26, '#9a3b2a');
      house(w * 0.58, h * 0.14, w * 0.28, h * 0.24, '#6b4a2b');
      house(w * 0.32, h * 0.58, w * 0.34, h * 0.3, '#b4532a');
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
        ctx.fillStyle = 'rgba(240, 235, 220, 0.85)';
        ctx.fillRect(w * 0.02, fy, fw, fh);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * 0.7;
        ctx.strokeRect(w * 0.02, fy, fw, fh);

        // Plain sail cloth like the base windmill (no lattice hatching)
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
      // cas_wizard_spire turned: same tapered tower, balconies, crooked blue hat and orb, tree behind on the other side
      casView(ctx, size, color, fill, 0.7, 7, (c, P, W, H, r) => {
        const Z = K.tone(P, '#9aa0c8', 0.28);
        K.shadow(c, 36, 92, 28, 5);
        K.tree(c, P, 12, 90, 20, { col: '#4f8a6a' });
        K.taper(c, P, 36, 90, 26, 18, 52, Z, r);
        [[66, 28], [46, 24]].forEach(([y, w]) => { c.fillStyle = Z.dk; c.fillRect(36 - w / 2 - 2, y, w + 4, 3); c.beginPath(); c.rect(36 - w / 2 - 2, y, w + 4, 3); K.ink(c, P, 1.1); for (let k = 0; k < 6; k++) { c.fillStyle = Z.mid; c.fillRect(36 - w / 2 - 1.5 + k * ((w + 3) / 6), y - 2, 2.4, 2.2); } });
        K.slit(c, P, 30, 72, 3, 8, K.GLOW); K.slit(c, P, 42, 54, 3, 8, K.GLOW); K.slit(c, P, 36, 36, 2.6, 7, K.ARCANE);
        K.cone(c, P, 36, 34, 24, 30, '#4a4fb0', { ov: 4, tx: 30, cv: 1 });
        K.stars(c, 36, 22, 3, r);
        c.beginPath(); c.arc(24, 5, 3, 0, K.TAU); c.fillStyle = K.ARCANE; c.fill(); K.ink(c, P, 1); K.glowAt(c, 24, 5, 11, 'rgba(110,214,255,0.5)');
        c.strokeStyle = 'rgba(111,214,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.ellipse(36, 56, 18, 3, 0, 0, K.TAU); c.stroke();
      });
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
      // cas_wizard_spire from above: balcony ring, crooked blue hat, glowing orb, floating ring, tree beside it
      casView(ctx, size, color, fill, 1.0, 7, (c, P, W, H, r) => {
        const Z = K.tone(P, '#9aa0c8', 0.28);
        K.shadow(c, 50, 52, 30, 28, 0.3);
        c.beginPath(); c.arc(78, 76, 14, 0, K.TAU); c.fillStyle = '#4f8a6a'; c.fill();
        c.save(); c.clip(); c.beginPath(); c.arc(82, 80, 14, 0, K.TAU); c.fillStyle = K.dk('#4f8a6a', 0.3); c.fill(); c.restore();
        c.beginPath(); c.arc(78, 76, 14, 0, K.TAU); K.ink(c, P);
        c.beginPath(); c.arc(48, 50, 26, 0, K.TAU); c.fillStyle = Z.dk; c.fill(); K.ink(c, P, 1.1);
        c.fillStyle = Z.mid;
        for (let k = 0; k < 16; k++) { const a = (k / 16) * K.TAU; c.fillRect(48 + Math.cos(a) * 24 - 1.2, 50 + Math.sin(a) * 24 - 1.2, 2.4, 2.4); }
        casConeTop(c, P, 48, 50, 20, '#4a4fb0', [54, 44]);
        K.stars(c, 40, 40, 3, r);
        c.beginPath(); c.arc(60, 34, 3.5, 0, K.TAU); c.fillStyle = K.ARCANE; c.fill(); K.ink(c, P, 1); K.glowAt(c, 60, 34, 12, 'rgba(110,214,255,0.5)');
        c.strokeStyle = 'rgba(111,214,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.arc(48, 50, 34, 0, K.TAU); c.stroke();
      });
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
