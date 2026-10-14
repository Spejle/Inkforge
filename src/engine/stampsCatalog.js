// Fantasy and Tactical Stamp Catalog
// Renders vector-sharp cartography and battlemap assets with consistent aspect ratios and lighting

import { EXTRA_STAMPS } from './stamps/index.js';

export const STAMP_CATEGORIES = [
  { id: 'world_nature', name: 'Nature & Land', type: 'world' },
  { id: 'world_civilization', name: 'Settlements & Structures', type: 'world' },
  { id: 'world_nautical', name: 'Nautical & Icons', type: 'world' },
  { id: 'battle_rooms', name: 'Dungeon & Structures', type: 'battle' },
  { id: 'battle_props', name: 'Furniture & Props', type: 'battle' },
  { id: 'battle_tokens', name: 'Creatures & Heroes', type: 'battle' },
];

export const STAMPS = [
  // =========================================================================
  // 1. WORLD: NATURE & LAND (Mountains, Hills, Trees, Flora)
  // =========================================================================
  {
    id: 'mountain_grand',
    name: 'Grand Mountain Peak',
    category: 'world_nature',
    defaultScale: 1.2,
    aspect: 1,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      ctx.save();
      const s = size;
      // Mountain base shape
      ctx.beginPath();
      ctx.moveTo(s * 0.1, s * 0.85);
      ctx.lineTo(s * 0.5, s * 0.15); // Peak
      ctx.lineTo(s * 0.9, s * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shaded ridge / side (Shadow side)
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.15);
      ctx.quadraticCurveTo(s * 0.52, s * 0.45, s * 0.58, s * 0.85);
      ctx.lineTo(s * 0.9, s * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.28)';
      ctx.fill();

      // Ridge spine line
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.15);
      ctx.quadraticCurveTo(s * 0.48, s * 0.45, s * 0.58, s * 0.85);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.035;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Contour shading lines on shadow side
      ctx.beginPath();
      ctx.moveTo(s * 0.53, s * 0.35);
      ctx.lineTo(s * 0.65, s * 0.45);
      ctx.moveTo(s * 0.55, s * 0.5);
      ctx.lineTo(s * 0.72, s * 0.62);
      ctx.moveTo(s * 0.57, s * 0.68);
      ctx.lineTo(s * 0.8, s * 0.78);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.02;
      ctx.stroke();

      // Mountain outline
      ctx.beginPath();
      ctx.moveTo(s * 0.1, s * 0.85);
      ctx.lineTo(s * 0.5, s * 0.15);
      ctx.lineTo(s * 0.9, s * 0.85);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      // Snow cap
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.15);
      ctx.lineTo(s * 0.4, s * 0.32);
      ctx.lineTo(s * 0.45, s * 0.35);
      ctx.lineTo(s * 0.5, s * 0.3);
      ctx.lineTo(s * 0.55, s * 0.36);
      ctx.lineTo(s * 0.6, s * 0.32);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'mountain_range',
    name: 'Mountain Ridge Cluster',
    category: 'world_nature',
    defaultScale: 1.4,
    aspect: 1.5,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      ctx.save();
      const w = size * 1.5;
      const h = size;

      // Draw secondary peak left
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.85);
      ctx.lineTo(w * 0.28, h * 0.35);
      ctx.lineTo(w * 0.52, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Left peak shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.35);
      ctx.lineTo(w * 0.35, h * 0.85);
      ctx.lineTo(w * 0.52, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.fill();

      // Secondary peak right
      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.85);
      ctx.lineTo(w * 0.75, h * 0.3);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right peak shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.75, h * 0.3);
      ctx.lineTo(w * 0.82, h * 0.85);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.fill();

      // Center grand peak in front
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.9);
      ctx.lineTo(w * 0.5, h * 0.15);
      ctx.lineTo(w * 0.8, h * 0.9);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Center shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.15);
      ctx.quadraticCurveTo(w * 0.52, h * 0.45, w * 0.58, h * 0.9);
      ctx.lineTo(w * 0.8, h * 0.9);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.3)';
      ctx.fill();

      // Inking all spines and outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left outline
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.85);
      ctx.lineTo(w * 0.28, h * 0.35);
      ctx.lineTo(w * 0.36, h * 0.55);
      ctx.stroke();

      // Right outline
      ctx.beginPath();
      ctx.moveTo(w * 0.65, h * 0.52);
      ctx.lineTo(w * 0.75, h * 0.3);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.stroke();

      // Center outline & spine
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.9);
      ctx.lineTo(w * 0.5, h * 0.15);
      ctx.lineTo(w * 0.8, h * 0.9);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.15);
      ctx.quadraticCurveTo(w * 0.52, h * 0.45, w * 0.58, h * 0.9);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'mountain_snow_peak',
    name: 'Glacial Horn Peak',
    category: 'world_nature',
    defaultScale: 1.2,
    aspect: 1,
    render: (ctx, size, color = '#1e293b', fill = '#f8fafc') => {
      ctx.save();
      const s = size;
      // Main sharp horn
      ctx.beginPath();
      ctx.moveTo(s * 0.15, s * 0.85);
      ctx.lineTo(s * 0.48, s * 0.12);
      ctx.lineTo(s * 0.88, s * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Icy deep blue shadow face
      ctx.beginPath();
      ctx.moveTo(s * 0.48, s * 0.12);
      ctx.lineTo(s * 0.56, s * 0.85);
      ctx.lineTo(s * 0.88, s * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 110, 168, 0.38)';
      ctx.fill();

      // Blue ice crevasse fissures
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = s * 0.02;
      ctx.beginPath();
      ctx.moveTo(s * 0.52, s * 0.4);
      ctx.lineTo(s * 0.68, s * 0.52);
      ctx.moveTo(s * 0.55, s * 0.6);
      ctx.lineTo(s * 0.76, s * 0.72);
      ctx.stroke();

      // Dark ink outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.038;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.15, s * 0.85);
      ctx.lineTo(s * 0.48, s * 0.12);
      ctx.lineTo(s * 0.88, s * 0.85);
      ctx.moveTo(s * 0.48, s * 0.12);
      ctx.lineTo(s * 0.56, s * 0.85);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'mountain_volcano',
    name: 'Volcanic Caldera',
    category: 'world_nature',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#4a3f35') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Base truncated cone
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.85);
      ctx.lineTo(w * 0.38, h * 0.28);
      ctx.lineTo(w * 0.62, h * 0.28);
      ctx.lineTo(w * 0.9, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Dark basalt shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.28);
      ctx.lineTo(w * 0.6, h * 0.85);
      ctx.lineTo(w * 0.9, h * 0.85);
      ctx.lineTo(w * 0.62, h * 0.28);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 15, 12, 0.45)';
      ctx.fill();

      // Glowing lava crater
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.28, w * 0.14, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = h * 0.02;
      ctx.stroke();

      // Lava streaks down flanks
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.32);
      ctx.lineTo(w * 0.4, h * 0.6);
      ctx.lineTo(w * 0.32, h * 0.85);
      ctx.moveTo(w * 0.54, h * 0.32);
      ctx.lineTo(w * 0.58, h * 0.55);
      ctx.lineTo(w * 0.65, h * 0.85);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = h * 0.025;
      ctx.stroke();

      // Smoke billow plume
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.18, w * 0.06, 0, Math.PI * 2);
      ctx.arc(w * 0.44, h * 0.12, w * 0.08, 0, Math.PI * 2);
      ctx.arc(w * 0.54, h * 0.1, w * 0.09, 0, Math.PI * 2);
      ctx.arc(w * 0.48, h * 0.04, w * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 95, 90, 0.45)';
      ctx.fill();

      // Outline
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.85);
      ctx.lineTo(w * 0.38, h * 0.28);
      ctx.moveTo(w * 0.62, h * 0.28);
      ctx.lineTo(w * 0.9, h * 0.85);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'mountain_mesa',
    name: 'Desert Mesa Plateau',
    category: 'world_nature',
    defaultScale: 1.3,
    aspect: 1.4,
    render: (ctx, size, color = '#451a03', fill = '#d97706') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Flat mesa top and stepped slopes
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.85);
      ctx.lineTo(w * 0.25, h * 0.32);
      ctx.lineTo(w * 0.75, h * 0.32);
      ctx.lineTo(w * 0.92, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shadow side
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.32);
      ctx.lineTo(w * 0.55, h * 0.85);
      ctx.lineTo(w * 0.92, h * 0.85);
      ctx.lineTo(w * 0.75, h * 0.32);
      ctx.closePath();
      ctx.fillStyle = 'rgba(70, 20, 10, 0.35)';
      ctx.fill();

      // Sedimentary horizontal stratum lines
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = h * 0.02;
      for (let y = 0.45; y < 0.8; y += 0.12) {
        ctx.beginPath();
        ctx.moveTo(w * (0.08 + (0.85 - y) * 0.25), h * y);
        ctx.lineTo(w * (0.92 - (0.85 - y) * 0.25), h * y);
        ctx.stroke();
      }

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.25, h * 0.32, w * 0.5, 0); // Flat top line
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.85);
      ctx.lineTo(w * 0.25, h * 0.32);
      ctx.lineTo(w * 0.75, h * 0.32);
      ctx.lineTo(w * 0.92, h * 0.85);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'hills_rolling',
    name: 'Rolling Green Hills',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#2c221e', fill = '#dbe5c5') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Draw mounds
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.8);
      ctx.quadraticCurveTo(w * 0.35, h * 0.3, w * 0.65, h * 0.8);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.4, h * 0.8);
      ctx.quadraticCurveTo(w * 0.7, h * 0.4, w * 0.95, h * 0.8);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Hill shadow curves
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.3);
      ctx.quadraticCurveTo(w * 0.45, h * 0.55, w * 0.65, h * 0.8);
      ctx.strokeStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.lineWidth = h * 0.08;
      ctx.stroke();

      // Inking
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.8);
      ctx.quadraticCurveTo(w * 0.35, h * 0.3, w * 0.65, h * 0.8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.65);
      ctx.quadraticCurveTo(w * 0.7, h * 0.4, w * 0.95, h * 0.8);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'hills_dunes',
    name: 'Desert Sand Dunes',
    category: 'world_nature',
    defaultScale: 1.1,
    aspect: 1.4,
    render: (ctx, size, color = '#78350f', fill = '#fde68a') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Crescent barchan dune curve
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.75);
      ctx.quadraticCurveTo(w * 0.45, h * 0.35, w * 0.85, h * 0.75);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Windward shadow face
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.35);
      ctx.quadraticCurveTo(w * 0.62, h * 0.55, w * 0.85, h * 0.75);
      ctx.lineTo(w * 0.45, h * 0.75);
      ctx.closePath();
      ctx.fillStyle = 'rgba(180, 83, 9, 0.28)';
      ctx.fill();

      // Crest lines
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.75);
      ctx.quadraticCurveTo(w * 0.45, h * 0.35, w * 0.85, h * 0.75);
      ctx.stroke();

      // Second dune ridge
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.8);
      ctx.quadraticCurveTo(w * 0.7, h * 0.5, w * 0.95, h * 0.85);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'tree_pine',
    name: 'Evergreen Pine',
    category: 'world_nature',
    defaultScale: 0.9,
    aspect: 0.8,
    render: (ctx, size, color = '#2c221e', fill = '#4a6741') => {
      ctx.save();
      const s = size;
      const trunkColor = '#5c4033';

      // Trunk
      ctx.fillStyle = trunkColor;
      ctx.fillRect(s * 0.36, s * 0.65, s * 0.08, s * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.strokeRect(s * 0.36, s * 0.65, s * 0.08, s * 0.25);

      // Layered pine boughs
      const boughs = [
        { top: 0.15, bot: 0.38, w: 0.45 },
        { top: 0.3, bot: 0.52, w: 0.6 },
        { top: 0.44, bot: 0.7, w: 0.75 }
      ];

      for (const b of boughs) {
        ctx.beginPath();
        ctx.moveTo(s * 0.4, s * b.top);
        ctx.lineTo(s * (0.4 - b.w / 2), s * b.bot);
        ctx.lineTo(s * 0.4, s * (b.bot - 0.06));
        ctx.lineTo(s * (0.4 + b.w / 2), s * b.bot);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        // Shaded right half
        ctx.beginPath();
        ctx.moveTo(s * 0.4, s * b.top);
        ctx.lineTo(s * 0.4, s * (b.bot - 0.06));
        ctx.lineTo(s * (0.4 + b.w / 2), s * b.bot);
        ctx.closePath();
        ctx.fillStyle = 'rgba(20, 40, 20, 0.3)';
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'tree_oak',
    name: 'Ancient Oak',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#2c221e', fill = '#557a46') => {
      ctx.save();
      const s = size;

      // Trunk with roots
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.moveTo(s * 0.42, s * 0.55);
      ctx.lineTo(s * 0.4, s * 0.88);
      ctx.lineTo(s * 0.32, s * 0.95);
      ctx.lineTo(s * 0.68, s * 0.95);
      ctx.lineTo(s * 0.6, s * 0.88);
      ctx.lineTo(s * 0.58, s * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      // Canopy foliage clouds
      const foliageBlobs = [
        { x: 0.5, y: 0.35, r: 0.28 },
        { x: 0.32, y: 0.45, r: 0.2 },
        { x: 0.68, y: 0.45, r: 0.2 },
        { x: 0.45, y: 0.22, r: 0.18 }
      ];

      for (const f of foliageBlobs) {
        ctx.beginPath();
        ctx.arc(s * f.x, s * f.y, s * f.r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        // Shading bottom-right
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.arc(s * (f.x + 0.08), s * (f.y + 0.08), s * f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(25, 45, 20, 0.35)';
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'tree_autumn',
    name: 'Autumn Maple',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#3f2212', fill = '#d97706') => {
      ctx.save();
      const s = size;

      // Trunk
      ctx.fillStyle = '#5c3d2e';
      ctx.fillRect(s * 0.44, s * 0.55, s * 0.12, s * 0.38);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.strokeRect(s * 0.44, s * 0.55, s * 0.12, s * 0.38);

      // Amber and red canopy lobes
      const lobes = [
        { x: 0.5, y: 0.32, r: 0.26, col: '#ea580c' },
        { x: 0.34, y: 0.42, r: 0.19, col: '#d97706' },
        { x: 0.66, y: 0.42, r: 0.19, col: '#b91c1c' }
      ];

      for (const l of lobes) {
        ctx.beginPath();
        ctx.arc(s * l.x, s * l.y, s * l.r, 0, Math.PI * 2);
        ctx.fillStyle = l.col;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'tree_dead',
    name: 'Gnarled Dead Tree',
    category: 'world_nature',
    defaultScale: 0.9,
    aspect: 0.9,
    render: (ctx, size, color = '#1c1917', fill = '#44403c') => {
      ctx.save();
      const s = size;
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.045;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Twisted trunk and bare branches
      ctx.beginPath();
      ctx.moveTo(s * 0.45, s * 0.92);
      ctx.quadraticCurveTo(s * 0.42, s * 0.6, s * 0.48, s * 0.4);
      // Main fork left
      ctx.lineTo(s * 0.25, s * 0.22);
      ctx.moveTo(s * 0.32, s * 0.28);
      ctx.lineTo(s * 0.2, s * 0.38);
      // Main fork right
      ctx.moveTo(s * 0.48, s * 0.4);
      ctx.lineTo(s * 0.72, s * 0.2);
      ctx.moveTo(s * 0.62, s * 0.27);
      ctx.lineTo(s * 0.78, s * 0.36);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'tree_forest_cluster',
    name: 'Dense Woodland Canopy',
    category: 'world_nature',
    defaultScale: 1.2,
    aspect: 1.4,
    render: (ctx, size, color = '#2c221e', fill = '#557a46') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Cluster of 6 overlapping tree canopy mounds
      const trees = [
        { x: 0.25, y: 0.65, r: 0.22, f: '#486b3a' },
        { x: 0.75, y: 0.65, r: 0.22, f: '#486b3a' },
        { x: 0.35, y: 0.42, r: 0.25, f: fill },
        { x: 0.65, y: 0.42, r: 0.25, f: fill },
        { x: 0.5, y: 0.3, r: 0.28, f: '#5c864b' }
      ];

      for (const t of trees) {
        ctx.beginPath();
        ctx.arc(w * t.x, h * t.y, h * t.r, 0, Math.PI * 2);
        ctx.fillStyle = t.f;
        ctx.fill();

        // Shadow bottom-right
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.arc(w * (t.x + 0.05), h * (t.y + 0.05), h * t.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 40, 15, 0.35)';
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.035;
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 2. WORLD: SETTLEMENTS & CIVILIZATION
  // =========================================================================
  {
    id: 'castle_citadel',
    name: 'Royal Citadel & Keep',
    category: 'world_civilization',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#e2d9cc') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Central Great Tower
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.38, h * 0.25, w * 0.24, h * 0.65);
      // Left tower
      ctx.fillRect(w * 0.15, h * 0.45, w * 0.18, h * 0.45);
      // Right tower
      ctx.fillRect(w * 0.67, h * 0.45, w * 0.18, h * 0.45);

      // Shaded right sides of towers
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.fillRect(w * 0.5, h * 0.25, w * 0.12, h * 0.65);
      ctx.fillRect(w * 0.76, h * 0.45, w * 0.09, h * 0.45);

      // Roof conical caps (Crimson roofs)
      ctx.fillStyle = '#b91c1c';
      // Center roof
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.25);
      ctx.lineTo(w * 0.5, h * 0.05);
      ctx.lineTo(w * 0.66, h * 0.25);
      ctx.closePath();
      ctx.fill();
      // Left roof
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.45);
      ctx.lineTo(w * 0.24, h * 0.28);
      ctx.lineTo(w * 0.36, h * 0.45);
      ctx.closePath();
      ctx.fill();
      // Right roof
      ctx.beginPath();
      ctx.moveTo(w * 0.64, h * 0.45);
      ctx.lineTo(w * 0.76, h * 0.28);
      ctx.lineTo(w * 0.88, h * 0.45);
      ctx.closePath();
      ctx.fill();

      // Gate archway
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.78, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.57, h * 0.9);
      ctx.lineTo(w * 0.43, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.38, h * 0.25, w * 0.24, h * 0.65);
      ctx.strokeRect(w * 0.15, h * 0.45, w * 0.18, h * 0.45);
      ctx.strokeRect(w * 0.67, h * 0.45, w * 0.18, h * 0.45);

      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.25);
      ctx.lineTo(w * 0.5, h * 0.05);
      ctx.lineTo(w * 0.66, h * 0.25);
      ctx.moveTo(w * 0.12, h * 0.45);
      ctx.lineTo(w * 0.24, h * 0.28);
      ctx.lineTo(w * 0.36, h * 0.45);
      ctx.moveTo(w * 0.64, h * 0.45);
      ctx.lineTo(w * 0.76, h * 0.28);
      ctx.lineTo(w * 0.88, h * 0.45);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'fortress_keep',
    name: 'Stone Bastion Keep',
    category: 'world_civilization',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#1c1917', fill = '#cbd5e1') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      // Heavy square battlement keep
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.55);

      // Crenellations
      const creneCount = 5;
      const cw = (w * 0.5) / (creneCount * 2 - 1);
      for (let i = 0; i < creneCount; i++) {
        ctx.fillRect(w * 0.25 + i * cw * 2, h * 0.27, cw, h * 0.08);
      }

      // Shadow side
      ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.fillRect(w * 0.5, h * 0.35, w * 0.25, h * 0.55);

      // Arrow slits
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w * 0.36, h * 0.45, w * 0.03, h * 0.12);
      ctx.fillRect(w * 0.61, h * 0.45, w * 0.03, h * 0.12);

      // Inking
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.25, h * 0.35, w * 0.5, h * 0.55);

      ctx.restore();
    }
  },
  {
    id: 'village_houses',
    name: 'Village Settlement',
    category: 'world_civilization',
    defaultScale: 1.1,
    aspect: 1.3,
    render: (ctx, size, color = '#2c221e', fill = '#dcd4c0') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      const houses = [
        { x: 0.15, y: 0.5, w: 0.28, h: 0.35, roof: '#991b1b' },
        { x: 0.55, y: 0.45, w: 0.32, h: 0.4, roof: '#854d0e' },
        { x: 0.38, y: 0.6, w: 0.26, h: 0.32, roof: '#78350f' }
      ];

      for (const b of houses) {
        // Walls
        ctx.fillStyle = fill;
        ctx.fillRect(w * b.x, h * b.y, w * b.w, h * b.h);

        // Gable Roof
        ctx.fillStyle = b.roof;
        ctx.beginPath();
        ctx.moveTo(w * (b.x - 0.04), h * b.y);
        ctx.lineTo(w * (b.x + b.w / 2), h * (b.y - 0.22));
        ctx.lineTo(w * (b.x + b.w + 0.04), h * b.y);
        ctx.closePath();
        ctx.fill();

        // Door
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(w * (b.x + b.w * 0.35), h * (b.y + b.h * 0.55), w * (b.w * 0.3), h * (b.h * 0.45));

        // Inking
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.035;
        ctx.strokeRect(w * b.x, h * b.y, w * b.w, h * b.h);
        ctx.beginPath();
        ctx.moveTo(w * (b.x - 0.04), h * b.y);
        ctx.lineTo(w * (b.x + b.w / 2), h * (b.y - 0.22));
        ctx.lineTo(w * (b.x + b.w + 0.04), h * b.y);
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'windmill',
    name: 'Windmill & Farm',
    category: 'world_civilization',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#2c221e', fill = '#f5f5f4') => {
      ctx.save();
      const s = size;

      // Tapered tower
      ctx.beginPath();
      ctx.moveTo(s * 0.32, s * 0.88);
      ctx.lineTo(s * 0.38, s * 0.35);
      ctx.lineTo(s * 0.52, s * 0.35);
      ctx.lineTo(s * 0.58, s * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.035;
      ctx.stroke();

      // Conical cap
      ctx.beginPath();
      ctx.moveTo(s * 0.35, s * 0.35);
      ctx.lineTo(s * 0.45, s * 0.22);
      ctx.lineTo(s * 0.55, s * 0.35);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.stroke();

      // 4 Windmill lattice sails
      ctx.save();
      ctx.translate(s * 0.45, s * 0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.025;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s * 0.32);
        ctx.stroke();
        // Lattice sail cloth
        ctx.fillStyle = 'rgba(240, 235, 220, 0.85)';
        ctx.fillRect(s * 0.02, -s * 0.3, s * 0.08, s * 0.26);
        ctx.strokeRect(s * 0.02, -s * 0.3, s * 0.08, s * 0.26);
      }
      ctx.restore();

      ctx.restore();
    }
  },
  {
    id: 'tower_wizard',
    name: 'Spire of High Sorcery',
    category: 'world_civilization',
    defaultScale: 1.1,
    aspect: 0.7,
    render: (ctx, size, color = '#1e1b4b', fill = '#c7d2fe') => {
      ctx.save();
      const w = size * 0.7;
      const h = size;

      // Tall slender tower
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.36, h * 0.32, w * 0.28, h * 0.58);

      // Arcane blue shading
      ctx.fillStyle = 'rgba(49, 46, 129, 0.35)';
      ctx.fillRect(w * 0.5, h * 0.32, w * 0.14, h * 0.58);

      // High spire cone (Indigo)
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.32);
      ctx.lineTo(w * 0.5, h * 0.05);
      ctx.lineTo(w * 0.7, h * 0.32);
      ctx.closePath();
      ctx.fillStyle = '#4338ca';
      ctx.fill();

      // Floating arcane crystal orb
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.03, w * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Inking
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.36, h * 0.32, w * 0.28, h * 0.58);
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.32);
      ctx.lineTo(w * 0.5, h * 0.05);
      ctx.lineTo(w * 0.7, h * 0.32);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'ruins_stonehenge',
    name: 'Ancient Megalith Circle',
    category: 'world_civilization',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#292524', fill = '#a8a29e') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Three trilithon stone arches
      const stones = [
        { x: 0.15, h: 0.4 },
        { x: 0.42, h: 0.5 },
        { x: 0.72, h: 0.42 }
      ];

      for (const s of stones) {
        // Vertical pillars
        ctx.fillStyle = fill;
        ctx.fillRect(w * s.x, h * (0.85 - s.h), w * 0.08, h * s.h);
        ctx.fillRect(w * (s.x + 0.12), h * (0.85 - s.h), w * 0.08, h * s.h);

        // Capstone horizontal slab
        ctx.fillRect(w * (s.x - 0.02), h * (0.85 - s.h - 0.08), w * 0.24, h * 0.08);

        // Outlines
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.032;
        ctx.strokeRect(w * s.x, h * (0.85 - s.h), w * 0.08, h * s.h);
        ctx.strokeRect(w * (s.x + 0.12), h * (0.85 - s.h), w * 0.08, h * s.h);
        ctx.strokeRect(w * (s.x - 0.02), h * (0.85 - s.h - 0.08), w * 0.24, h * 0.08);
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 3. WORLD: NAUTICAL & ICONS (Compass, Ships, Monsters)
  // =========================================================================
  {
    id: 'compass_rose',
    name: 'Nautical Compass Rose',
    category: 'world_nautical',
    defaultScale: 1.5,
    aspect: 1,
    render: (ctx, size, color = '#2c221e', fill = '#d4af37') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;
      const r = s * 0.42;

      // Outer rings
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();

      // 8-Point Compass Star
      const points = 8;
      for (let i = 0; i < points; i++) {
        const isMajor = i % 2 === 0;
        const len = isMajor ? r * 0.95 : r * 0.65;
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const nextAngle = angle + Math.PI / points;

        // Left half (Dark shade)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.lineTo(cx + Math.cos(nextAngle) * (r * 0.22), cy + Math.sin(nextAngle) * (r * 0.22));
        ctx.closePath();
        ctx.fillStyle = isMajor ? '#78350f' : '#b45309';
        ctx.fill();
        ctx.stroke();

        // Right half (Gold/Light)
        const prevAngle = angle - Math.PI / points;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.lineTo(cx + Math.cos(prevAngle) * (r * 0.22), cy + Math.sin(prevAngle) * (r * 0.22));
        ctx.closePath();
        ctx.fillStyle = isMajor ? fill : '#fef08a';
        ctx.fill();
        ctx.stroke();
      }

      // Fleur-de-lis / North Arrow indicator
      ctx.font = `bold ${Math.round(s * 0.16)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = color;
      ctx.fillText('N', cx, cy - r * 0.98);

      ctx.restore();
    }
  },
  {
    id: 'ship_caravel',
    name: 'Merchant Caravel',
    category: 'world_nautical',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#2c221e', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Wooden Hull
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.65);
      ctx.lineTo(w * 0.85, h * 0.65);
      ctx.quadraticCurveTo(w * 0.95, h * 0.72, w * 0.82, h * 0.85);
      ctx.lineTo(w * 0.22, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      // Masts
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.65);
      ctx.lineTo(w * 0.45, h * 0.15); // Main mast
      ctx.moveTo(w * 0.7, h * 0.65);
      ctx.lineTo(w * 0.7, h * 0.25); // Foremast
      ctx.stroke();

      // Billowed White Sails
      ctx.fillStyle = fill;
      // Main sail
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.22);
      ctx.quadraticCurveTo(w * 0.45, h * 0.35, w * 0.58, h * 0.22);
      ctx.lineTo(w * 0.58, h * 0.55);
      ctx.quadraticCurveTo(w * 0.45, h * 0.68, w * 0.32, h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'sea_serpent',
    name: 'Mythic Leviathan',
    category: 'world_nautical',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#0f172a', fill = '#0d9488') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Coils rising above ocean waves
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.045;
      ctx.lineCap = 'round';

      // Serpent Head & Yawning Maw
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.7);
      ctx.quadraticCurveTo(w * 0.18, h * 0.3, w * 0.28, h * 0.25);
      ctx.lineTo(w * 0.38, h * 0.2); // Snout
      ctx.lineTo(w * 0.32, h * 0.35); // Lower jaw
      ctx.quadraticCurveTo(w * 0.25, h * 0.45, w * 0.22, h * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Monster eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.28, h * 0.03, 0, Math.PI * 2);
      ctx.fill();

      // Body coils
      const coils = [
        { x: 0.45, y: 0.75, r: 0.18 },
        { x: 0.72, y: 0.75, r: 0.15 }
      ];

      for (const c of coils) {
        ctx.beginPath();
        ctx.arc(w * c.x, h * c.y, h * c.r, Math.PI, 0);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 4. BATTLEMAP: DUNGEON & STRUCTURES
  // =========================================================================
  {
    id: 'dungeon_wall_block',
    name: 'Stone Wall Section',
    category: 'battle_rooms',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const s = size;

      // Outer drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(s * 0.1, s * 0.1, s * 0.85, s * 0.85);

      // Thick masonry wall cap
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.05, s * 0.05, s * 0.85, s * 0.85);

      // Inner bevel highlight
      ctx.fillStyle = '#64748b';
      ctx.fillRect(s * 0.1, s * 0.1, s * 0.75, s * 0.06);

      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.05;
      ctx.strokeRect(s * 0.05, s * 0.05, s * 0.85, s * 0.85);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_door_wooden',
    name: 'Iron-Banded Wood Door',
    category: 'battle_rooms',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1c1917', fill = '#78350f') => {
      ctx.save();
      const s = size;

      // Wooden door leaf
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.15, s * 0.35, s * 0.7, s * 0.3);

      // Iron strapping
      ctx.fillStyle = '#475569';
      ctx.fillRect(s * 0.25, s * 0.35, s * 0.08, s * 0.3);
      ctx.fillRect(s * 0.65, s * 0.35, s * 0.08, s * 0.3);

      // Iron ring handle
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.5, s * 0.06, 0, Math.PI * 2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.strokeRect(s * 0.15, s * 0.35, s * 0.7, s * 0.3);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_pillar',
    name: 'Carved Dungeon Pillar',
    category: 'battle_rooms',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#475569') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Circular shadow
      ctx.beginPath();
      ctx.arc(cx + s * 0.05, cy + s * 0.05, s * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Outer plinth
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      // Inner capital ring
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'dungeon_stairs_down',
    name: 'Descending Stone Stairs',
    category: 'battle_rooms',
    defaultScale: 1.1,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#334155') => {
      ctx.save();
      const s = size;

      // Receding steps (progressively darker downwards)
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const y = s * (0.15 + i * 0.11);
        const darkness = Math.round(75 - i * 11);
        ctx.fillStyle = `rgb(${darkness}, ${darkness + 5}, ${darkness + 10})`;
        ctx.fillRect(s * 0.15, y, s * 0.7, s * 0.11);
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.strokeRect(s * 0.15, y, s * 0.7, s * 0.11);
      }

      ctx.restore();
    }
  },

  // =========================================================================
  // 5. BATTLEMAP: FURNITURE & PROPS
  // =========================================================================
  {
    id: 'prop_table_tavern',
    name: 'Long Tavern Feast Table',
    category: 'battle_props',
    defaultScale: 1.1,
    aspect: 1.8,
    render: (ctx, size, color = '#2c1810', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.8;
      const h = size;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.14, h * 0.28, w * 0.75, h * 0.55);

      // Wood table planks
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.1, h * 0.22, w * 0.75, h * 0.55);

      // Plank grooves
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.025;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.4);
      ctx.lineTo(w * 0.85, h * 0.4);
      ctx.moveTo(w * 0.1, h * 0.58);
      ctx.lineTo(w * 0.85, h * 0.58);
      ctx.stroke();

      ctx.lineWidth = h * 0.04;
      ctx.strokeRect(w * 0.1, h * 0.22, w * 0.75, h * 0.55);

      ctx.restore();
    }
  },
  {
    id: 'prop_chest_treasure',
    name: 'Gilded Treasure Chest',
    category: 'battle_props',
    defaultScale: 0.9,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#92400e') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Wood body
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.5);

      // Gold bands
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.1, h * 0.5);
      ctx.fillRect(w * 0.75, h * 0.3, w * 0.1, h * 0.5);
      // Keyhole escutcheon
      ctx.fillRect(w * 0.46, h * 0.45, w * 0.08, h * 0.15);

      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.04;
      ctx.strokeRect(w * 0.15, h * 0.3, w * 0.7, h * 0.5);

      ctx.restore();
    }
  },
  {
    id: 'prop_campfire',
    name: 'Roaring Campfire',
    category: 'battle_props',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#2c221e') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Warm radial glow
      const glow = ctx.createRadialGradient(cx, cy, s * 0.1, cx, cy, s * 0.48);
      glow.addColorStop(0, 'rgba(249, 115, 22, 0.75)');
      glow.addColorStop(0.6, 'rgba(234, 88, 12, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // Stone ring
      ctx.fillStyle = '#64748b';
      const stones = 8;
      for (let i = 0; i < stones; i++) {
        const a = (Math.PI * 2 / stones) * i;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (s * 0.3), cy + Math.sin(a) * (s * 0.3), s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.02;
        ctx.stroke();
      }

      // Crossed burning logs
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.22, cy - s * 0.22);
      ctx.lineTo(cx + s * 0.22, cy + s * 0.22);
      ctx.moveTo(cx + s * 0.22, cy - s * 0.22);
      ctx.lineTo(cx - s * 0.22, cy + s * 0.22);
      ctx.stroke();

      // Flame core
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_crate',
    name: 'Storage Crates & Barrels',
    category: 'battle_props',
    defaultScale: 1.0,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Wooden square crate
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.15, h * 0.25, w * 0.42, h * 0.55);
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.strokeRect(w * 0.15, h * 0.25, w * 0.42, h * 0.55);
      // Crate cross-brace
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.25);
      ctx.lineTo(w * 0.57, h * 0.8);
      ctx.moveTo(w * 0.57, h * 0.25);
      ctx.lineTo(w * 0.15, h * 0.8);
      ctx.stroke();

      // Round barrel beside it
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.52, w * 0.18, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'prop_throne_royal',
    name: 'Gilded Royal Throne',
    category: 'battle_props',
    defaultScale: 1.1,
    aspect: 1,
    render: (ctx, size, color = '#1c1917', fill = '#b91c1c') => {
      ctx.save();
      const s = size;

      // High backrest
      ctx.fillStyle = fill; // Crimson velvet
      ctx.fillRect(s * 0.3, s * 0.15, s * 0.4, s * 0.45);

      // Gold frame & finials
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = s * 0.05;
      ctx.strokeRect(s * 0.28, s * 0.12, s * 0.44, s * 0.5);

      // Seat cushion
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.25, s * 0.58, s * 0.5, s * 0.28);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.035;
      ctx.strokeRect(s * 0.25, s * 0.58, s * 0.5, s * 0.28);

      ctx.restore();
    }
  },
  {
    id: 'prop_brazier_lit',
    name: 'Iron Fire Brazier',
    category: 'battle_props',
    defaultScale: 0.9,
    aspect: 1,
    render: (ctx, size, color = '#0f172a') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Glow halo
      const grad = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.45);
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.75)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Tripod iron bowl
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      // Embers
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  // =========================================================================
  // 6. BATTLEMAP: CREATURES & TOKENS
  // =========================================================================
  {
    id: 'token_hero_warrior',
    name: 'Knight Hero Token',
    category: 'battle_tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e293b', fill = '#3b82f6') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Base token circular disk
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Golden ornate rim
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Knight sword crest
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.25);
      ctx.lineTo(cx, cy + s * 0.25); // Blade
      ctx.moveTo(cx - s * 0.12, cy - s * 0.08);
      ctx.lineTo(cx + s * 0.12, cy - s * 0.08); // Guard
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'token_hero_mage',
    name: 'Arcanist Mage Token',
    category: 'battle_tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#1e1b4b', fill = '#8b5cf6') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Arcane star icon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s * 0.035;
      const pts = 8;
      for (let i = 0; i < pts; i++) {
        const a = (Math.PI * 2 / pts) * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * (s * 0.24), cy + Math.sin(a) * (s * 0.24));
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'token_hero_rogue',
    name: 'Shadow Rogue Token',
    category: 'battle_tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#0f172a', fill = '#15803d') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Crossed daggers
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.18, cy - s * 0.18);
      ctx.lineTo(cx + s * 0.18, cy + s * 0.18);
      ctx.moveTo(cx + s * 0.18, cy - s * 0.18);
      ctx.lineTo(cx - s * 0.18, cy + s * 0.18);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'token_monster_dragon',
    name: 'Elder Red Dragon',
    category: 'battle_tokens',
    defaultScale: 1.5,
    aspect: 1,
    render: (ctx, size, color = '#450a0a', fill = '#dc2626') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      // Colossal Boss Token
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Blood red spikes rim
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = s * 0.08;
      ctx.stroke();

      // Dragon Silhouette Crest
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.2, cy - s * 0.1);
      ctx.lineTo(cx, cy - s * 0.28);
      ctx.lineTo(cx + s * 0.2, cy - s * 0.1);
      ctx.lineTo(cx + s * 0.12, cy + s * 0.15);
      ctx.lineTo(cx, cy + s * 0.28);
      ctx.lineTo(cx - s * 0.12, cy + s * 0.15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'token_skull_marker',
    name: 'Boss / Skull Marker',
    category: 'battle_tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size, color = '#18181b', fill = '#f43f5e') => {
      ctx.save();
      const s = size;
      const cx = s * 0.5;
      const cy = s * 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = '#881337';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();

      // Skull face
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.05, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - s * 0.1, cy + s * 0.05, s * 0.2, s * 0.12);

      // Eye sockets
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx - s * 0.07, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.07, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL WORLD NATURE STAMPS
  // =========================================================================
  {
    id: 'tree_dead_barren',
    name: 'Dead Tree',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#1c1917', fill = '#57534e') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Base roots spreading on ground
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.9);
      ctx.quadraticCurveTo(w * 0.35, h * 0.82, w * 0.42, h * 0.75);
      ctx.lineTo(w * 0.38, h * 0.52);
      // Left major limb
      ctx.lineTo(w * 0.18, h * 0.38);
      ctx.lineTo(w * 0.12, h * 0.22);
      ctx.lineTo(w * 0.18, h * 0.24);
      ctx.lineTo(w * 0.26, h * 0.36);
      ctx.lineTo(w * 0.35, h * 0.2);
      ctx.lineTo(w * 0.39, h * 0.22);
      ctx.lineTo(w * 0.34, h * 0.42);
      // Trunk center fork
      ctx.lineTo(w * 0.46, h * 0.32);
      ctx.lineTo(w * 0.48, h * 0.14);
      ctx.lineTo(w * 0.52, h * 0.15);
      ctx.lineTo(w * 0.51, h * 0.32);
      // Right major limb
      ctx.lineTo(w * 0.62, h * 0.25);
      ctx.lineTo(w * 0.78, h * 0.18);
      ctx.lineTo(w * 0.86, h * 0.22);
      ctx.lineTo(w * 0.76, h * 0.27);
      ctx.lineTo(w * 0.84, h * 0.38);
      ctx.lineTo(w * 0.78, h * 0.4);
      ctx.lineTo(w * 0.68, h * 0.36);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.75);
      // Right roots
      ctx.quadraticCurveTo(w * 0.64, h * 0.82, w * 0.78, h * 0.9);
      ctx.lineTo(w * 0.62, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.84);
      ctx.lineTo(w * 0.36, h * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shading on trunk right side
      ctx.fillStyle = 'rgba(20, 15, 10, 0.3)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.52);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.75);
      ctx.quadraticCurveTo(w * 0.64, h * 0.82, w * 0.78, h * 0.9);
      ctx.lineTo(w * 0.62, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.84);
      ctx.closePath();
      ctx.fill();

      // Inked outline & bark contour lines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.9);
      ctx.quadraticCurveTo(w * 0.35, h * 0.82, w * 0.42, h * 0.75);
      ctx.lineTo(w * 0.38, h * 0.52);
      ctx.lineTo(w * 0.18, h * 0.38);
      ctx.lineTo(w * 0.12, h * 0.22);
      ctx.moveTo(w * 0.18, h * 0.24);
      ctx.lineTo(w * 0.26, h * 0.36);
      ctx.moveTo(w * 0.24, h * 0.33);
      ctx.lineTo(w * 0.35, h * 0.2);
      ctx.moveTo(w * 0.34, h * 0.42);
      ctx.lineTo(w * 0.46, h * 0.32);
      ctx.lineTo(w * 0.48, h * 0.14);
      ctx.moveTo(w * 0.51, h * 0.32);
      ctx.lineTo(w * 0.62, h * 0.25);
      ctx.lineTo(w * 0.78, h * 0.18);
      ctx.lineTo(w * 0.86, h * 0.22);
      ctx.moveTo(w * 0.74, h * 0.23);
      ctx.lineTo(w * 0.84, h * 0.38);
      ctx.moveTo(w * 0.68, h * 0.36);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.75);
      ctx.quadraticCurveTo(w * 0.64, h * 0.82, w * 0.78, h * 0.9);
      ctx.stroke();

      // Trunk wood grain fissures
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.78);
      ctx.lineTo(w * 0.45, h * 0.56);
      ctx.moveTo(w * 0.5, h * 0.74);
      ctx.lineTo(w * 0.51, h * 0.6);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'tree_palm',
    name: 'Palm Tree',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#15803d') => {
      ctx.save();
      const s = size;

      // Curved slender trunk leaning right
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.92);
      ctx.quadraticCurveTo(s * 0.44, s * 0.65, s * 0.6, s * 0.34);
      ctx.lineTo(s * 0.67, s * 0.34);
      ctx.quadraticCurveTo(s * 0.53, s * 0.65, s * 0.48, s * 0.92);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();

      // Trunk segments
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      const segCount = 6;
      for (let i = 1; i <= segCount; i++) {
        const t = i / (segCount + 1);
        const tx1 = 0.38 * (1 - t) + 0.6 * t;
        const ty1 = 0.92 * (1 - t) + 0.34 * t;
        const tx2 = 0.48 * (1 - t) + 0.67 * t;
        const ty2 = 0.92 * (1 - t) + 0.34 * t;
        ctx.beginPath();
        ctx.moveTo(s * tx1, s * ty1);
        ctx.lineTo(s * tx2, s * ty2);
        ctx.stroke();
      }

      // Trunk outline
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.92);
      ctx.quadraticCurveTo(s * 0.44, s * 0.65, s * 0.6, s * 0.34);
      ctx.moveTo(s * 0.67, s * 0.34);
      ctx.quadraticCurveTo(s * 0.53, s * 0.65, s * 0.48, s * 0.92);
      ctx.stroke();

      // Palm fronds fanning from apex
      const cx = s * 0.64;
      const cy = s * 0.34;
      const fronds = [
        { endX: s * 0.18, endY: s * 0.42, cpX: s * 0.32, cpY: s * 0.16 },
        { endX: s * 0.32, endY: s * 0.16, cpX: s * 0.48, cpY: s * 0.1 },
        { endX: s * 0.65, endY: s * 0.08, cpX: s * 0.64, cpY: s * 0.12 },
        { endX: s * 0.92, endY: s * 0.22, cpX: s * 0.82, cpY: s * 0.12 },
        { endX: s * 0.94, endY: s * 0.45, cpX: s * 0.86, cpY: s * 0.32 },
        { endX: s * 0.48, endY: s * 0.44, cpX: s * 0.54, cpY: s * 0.36 }
      ];

      for (const f of fronds) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(f.cpX, f.cpY, f.endX, f.endY);
        ctx.quadraticCurveTo(f.cpX + (f.endY - cy) * 0.2, f.cpY + (cx - f.endX) * 0.15, cx, cy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(f.cpX, f.cpY, f.endX, f.endY);
        ctx.stroke();
      }

      // Coconuts cluster
      ctx.fillStyle = '#451a03';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      const coconuts = [
        { x: cx - s * 0.03, y: cy + s * 0.02 },
        { x: cx + s * 0.03, y: cy + s * 0.02 },
        { x: cx, y: cy + s * 0.05 }
      ];
      for (const c of coconuts) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, s * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'cactus_saguaro',
    name: 'Desert Cactus',
    category: 'world_nature',
    defaultScale: 0.9,
    aspect: 0.8,
    render: (ctx, size, color = '#1c1917', fill = '#166534') => {
      ctx.save();
      const w = size * 0.8;
      const h = size;

      // Base desert mound
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.92, w * 0.38, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d97706';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Main trunk and arms
      ctx.fillStyle = fill;

      // Main trunk
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.92);
      ctx.lineTo(w * 0.38, h * 0.18);
      ctx.arc(w * 0.5, h * 0.18, w * 0.12, Math.PI, 0);
      ctx.lineTo(w * 0.62, h * 0.92);
      ctx.closePath();
      ctx.fill();

      // Left arm
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.22, h * 0.6);
      ctx.arc(w * 0.22, h * 0.52, w * 0.08, Math.PI * 0.5, Math.PI);
      ctx.lineTo(w * 0.14, h * 0.32);
      ctx.arc(w * 0.21, h * 0.32, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.28, h * 0.52);
      ctx.arc(w * 0.36, h * 0.52, w * 0.08, Math.PI, Math.PI * 0.5, true);
      ctx.lineTo(w * 0.38, h * 0.52);
      ctx.closePath();
      ctx.fill();

      // Right arm
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.5);
      ctx.lineTo(w * 0.78, h * 0.5);
      ctx.arc(w * 0.78, h * 0.42, w * 0.08, Math.PI * 0.5, 0, true);
      ctx.lineTo(w * 0.86, h * 0.24);
      ctx.arc(w * 0.79, h * 0.24, w * 0.07, 0, Math.PI, true);
      ctx.lineTo(w * 0.72, h * 0.42);
      ctx.arc(w * 0.64, h * 0.42, w * 0.08, 0, Math.PI * 0.5);
      ctx.lineTo(w * 0.62, h * 0.42);
      ctx.closePath();
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(10, 30, 15, 0.25)';
      ctx.fillRect(w * 0.5, h * 0.18, w * 0.12, h * 0.74);
      ctx.fillRect(w * 0.79, h * 0.24, w * 0.07, h * 0.2);

      // Inked outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left arm outline
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.22, h * 0.6);
      ctx.arc(w * 0.22, h * 0.52, w * 0.08, Math.PI * 0.5, Math.PI);
      ctx.lineTo(w * 0.14, h * 0.32);
      ctx.arc(w * 0.21, h * 0.32, w * 0.07, Math.PI, 0);
      ctx.lineTo(w * 0.28, h * 0.5);
      ctx.stroke();

      // Right arm outline
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.5);
      ctx.lineTo(w * 0.78, h * 0.5);
      ctx.arc(w * 0.78, h * 0.42, w * 0.08, Math.PI * 0.5, 0, true);
      ctx.lineTo(w * 0.86, h * 0.24);
      ctx.arc(w * 0.79, h * 0.24, w * 0.07, 0, Math.PI, true);
      ctx.lineTo(w * 0.72, h * 0.42);
      ctx.stroke();

      // Trunk outline
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.92);
      ctx.lineTo(w * 0.38, h * 0.6);
      ctx.moveTo(w * 0.38, h * 0.52);
      ctx.lineTo(w * 0.38, h * 0.18);
      ctx.arc(w * 0.5, h * 0.18, w * 0.12, Math.PI, 0);
      ctx.lineTo(w * 0.62, h * 0.42);
      ctx.moveTo(w * 0.62, h * 0.5);
      ctx.lineTo(w * 0.62, h * 0.92);
      ctx.stroke();

      // Rib lines
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.18);
      ctx.lineTo(w * 0.44, h * 0.9);
      ctx.moveTo(w * 0.5, h * 0.12);
      ctx.lineTo(w * 0.5, h * 0.9);
      ctx.moveTo(w * 0.56, h * 0.18);
      ctx.lineTo(w * 0.56, h * 0.9);
      ctx.moveTo(w * 0.21, h * 0.28);
      ctx.lineTo(w * 0.21, h * 0.52);
      ctx.moveTo(w * 0.79, h * 0.2);
      ctx.lineTo(w * 0.79, h * 0.42);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'boulder_cluster',
    name: 'Boulder Cluster',
    category: 'world_nature',
    defaultScale: 1.1,
    aspect: 1.4,
    render: (ctx, size, color = '#2c221e', fill = '#a8a29e') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Contact shadow
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.88, w * 0.44, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.fill();

      // Left boulder
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.84);
      ctx.lineTo(w * 0.12, h * 0.54);
      ctx.lineTo(w * 0.28, h * 0.46);
      ctx.lineTo(w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.36, h * 0.84);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.46);
      ctx.lineTo(w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.36, h * 0.84);
      ctx.lineTo(w * 0.24, h * 0.84);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 15, 10, 0.28)';
      ctx.fill();

      // Central large boulder
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.86);
      ctx.lineTo(w * 0.32, h * 0.4);
      ctx.lineTo(w * 0.48, h * 0.26);
      ctx.lineTo(w * 0.68, h * 0.38);
      ctx.lineTo(w * 0.74, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.26);
      ctx.lineTo(w * 0.52, h * 0.52);
      ctx.lineTo(w * 0.58, h * 0.86);
      ctx.lineTo(w * 0.74, h * 0.86);
      ctx.lineTo(w * 0.68, h * 0.38);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 15, 10, 0.32)';
      ctx.fill();

      // Right boulder
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.86);
      ctx.lineTo(w * 0.68, h * 0.52);
      ctx.lineTo(w * 0.84, h * 0.48);
      ctx.lineTo(w * 0.94, h * 0.72);
      ctx.lineTo(w * 0.9, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.84, h * 0.48);
      ctx.lineTo(w * 0.94, h * 0.72);
      ctx.lineTo(w * 0.9, h * 0.86);
      ctx.lineTo(w * 0.78, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 15, 10, 0.3)';
      ctx.fill();

      // Foreground pebble
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.88);
      ctx.lineTo(w * 0.42, h * 0.74);
      ctx.lineTo(w * 0.54, h * 0.72);
      ctx.lineTo(w * 0.58, h * 0.88);
      ctx.closePath();
      ctx.fillStyle = '#78716c';
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Left boulder outline
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.84);
      ctx.lineTo(w * 0.12, h * 0.54);
      ctx.lineTo(w * 0.28, h * 0.46);
      ctx.lineTo(w * 0.38, h * 0.6);
      ctx.stroke();

      // Center boulder outline & ridge
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.86);
      ctx.lineTo(w * 0.32, h * 0.4);
      ctx.lineTo(w * 0.48, h * 0.26);
      ctx.lineTo(w * 0.68, h * 0.38);
      ctx.lineTo(w * 0.74, h * 0.86);
      ctx.moveTo(w * 0.48, h * 0.26);
      ctx.lineTo(w * 0.52, h * 0.52);
      ctx.lineTo(w * 0.58, h * 0.86);
      ctx.stroke();

      // Right boulder outline & ridge
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.86);
      ctx.lineTo(w * 0.68, h * 0.52);
      ctx.lineTo(w * 0.84, h * 0.48);
      ctx.lineTo(w * 0.94, h * 0.72);
      ctx.lineTo(w * 0.9, h * 0.86);
      ctx.moveTo(w * 0.84, h * 0.48);
      ctx.lineTo(w * 0.82, h * 0.86);
      ctx.stroke();

      // Small stone outline
      ctx.strokeRect(w * 0.38, h * 0.74, w * 0.18, h * 0.14);

      // Fracture crack
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.44);
      ctx.lineTo(w * 0.42, h * 0.54);
      ctx.lineTo(w * 0.4, h * 0.64);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'nature_reeds',
    name: 'Freshwater Reeds',
    category: 'world_nature',
    defaultScale: 0.9,
    aspect: 0.8,
    render: (ctx, size, color = '#2c221e', fill = '#4d7c0f') => {
      ctx.save();
      const w = size * 0.8;
      const h = size;

      // Water ripples at base
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.9, w * 0.38, h * 0.05, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.84, w * 0.26, h * 0.04, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Reed blades
      const blades = [
        { startX: 0.36, startY: 0.88, cpX: 0.18, cpY: 0.52, endX: 0.1, endY: 0.32 },
        { startX: 0.44, startY: 0.88, cpX: 0.3, cpY: 0.45, endX: 0.26, endY: 0.22 },
        { startX: 0.52, startY: 0.88, cpX: 0.58, cpY: 0.42, endX: 0.56, endY: 0.18 },
        { startX: 0.58, startY: 0.88, cpX: 0.72, cpY: 0.48, endX: 0.76, endY: 0.24 },
        { startX: 0.64, startY: 0.88, cpX: 0.85, cpY: 0.58, endX: 0.9, endY: 0.38 }
      ];

      for (const b of blades) {
        ctx.beginPath();
        ctx.moveTo(w * b.startX, h * b.startY);
        ctx.quadraticCurveTo(w * b.cpX, h * b.cpY, w * b.endX, h * b.endY);
        ctx.quadraticCurveTo(w * (b.cpX + 0.04), h * b.cpY, w * (b.startX + 0.05), h * b.startY);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * b.startX, h * b.startY);
        ctx.quadraticCurveTo(w * b.cpX, h * b.cpY, w * b.endX, h * b.endY);
        ctx.stroke();
      }

      // 3 Cattail stalks
      const cattails = [
        { x: 0.34, topY: 0.24, headH: 0.16 },
        { x: 0.5, topY: 0.14, headH: 0.18 },
        { x: 0.68, topY: 0.22, headH: 0.15 }
      ];

      for (const c of cattails) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * c.x, h * 0.88);
        ctx.lineTo(w * c.x, h * c.topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * c.x, h * c.topY);
        ctx.lineTo(w * c.x, h * (c.topY - 0.06));
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        const rx = w * 0.045;
        const ry = h * c.headH * 0.5;
        ctx.ellipse(w * c.x, h * (c.topY + c.headH * 0.5), rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  {
    id: 'nature_lily_pond',
    name: 'Lily Pond',
    category: 'world_nature',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#1e293b', fill = '#38bdf8') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Pond water shape
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.5);
      ctx.bezierCurveTo(w * 0.12, h * 0.25, w * 0.45, h * 0.18, w * 0.72, h * 0.22);
      ctx.bezierCurveTo(w * 0.94, h * 0.26, w * 0.92, h * 0.65, w * 0.78, h * 0.78);
      ctx.bezierCurveTo(w * 0.62, h * 0.9, w * 0.28, h * 0.86, w * 0.15, h * 0.5);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shore outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Water ripple ring
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(w * 0.52, h * 0.52, w * 0.28, h * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3 Lily Pads
      const pads = [
        { x: w * 0.36, y: h * 0.42, r: w * 0.12, rot: 0.4 },
        { x: w * 0.68, y: h * 0.48, r: w * 0.1, rot: 2.2 },
        { x: w * 0.48, y: h * 0.68, r: w * 0.11, rot: -1.0 }
      ];

      for (const p of pads) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0.35, Math.PI * 2 - 0.35);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      // Lotus flower
      const fx = w * 0.36;
      const fy = h * 0.42;
      const petals = 6;
      for (let i = 0; i < petals; i++) {
        const ang = (Math.PI * 2 / petals) * i;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(ang) * (w * 0.038), fy + Math.sin(ang) * (w * 0.038), w * 0.038, w * 0.02, ang, 0, Math.PI * 2);
        ctx.fillStyle = '#fce7f3';
        ctx.fill();
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(fx, fy, w * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'volcano_lite',
    name: 'Volcano',
    category: 'world_nature',
    defaultScale: 1.2,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#57534e') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Volcanic cone
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.86);
      ctx.quadraticCurveTo(w * 0.32, h * 0.62, w * 0.42, h * 0.42);
      ctx.lineTo(w * 0.58, h * 0.42);
      ctx.quadraticCurveTo(w * 0.68, h * 0.62, w * 0.88, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right slope shadow
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.42);
      ctx.lineTo(w * 0.58, h * 0.42);
      ctx.quadraticCurveTo(w * 0.68, h * 0.62, w * 0.88, h * 0.86);
      ctx.lineTo(w * 0.55, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = 'rgba(25, 18, 15, 0.35)';
      ctx.fill();

      // Magma crater
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.42, w * 0.09, h * 0.035, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Lava flow trickle
      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.44);
      ctx.quadraticCurveTo(w * 0.44, h * 0.58, w * 0.38, h * 0.75);
      ctx.lineTo(w * 0.36, h * 0.86);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Smoke plume
      ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.32, w * 0.05, 0, Math.PI * 2);
      ctx.arc(w * 0.46, h * 0.24, w * 0.07, 0, Math.PI * 2);
      ctx.arc(w * 0.54, h * 0.18, w * 0.08, 0, Math.PI * 2);
      ctx.arc(w * 0.48, h * 0.1, w * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // Inked cone edges
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.86);
      ctx.quadraticCurveTo(w * 0.32, h * 0.62, w * 0.42, h * 0.42);
      ctx.moveTo(w * 0.58, h * 0.42);
      ctx.quadraticCurveTo(w * 0.68, h * 0.62, w * 0.88, h * 0.86);
      ctx.stroke();

      // Ridge spine
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.42);
      ctx.quadraticCurveTo(w * 0.51, h * 0.64, w * 0.55, h * 0.86);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'tree_snowy_pine',
    name: 'Snowy Pine',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#1c1917', fill = '#14532d') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Wooden trunk
      ctx.fillStyle = '#451a03';
      ctx.fillRect(w * 0.44, h * 0.78, w * 0.12, h * 0.14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.44, h * 0.78, w * 0.12, h * 0.14);

      // 3 Pine tiers
      const tiers = [
        { topY: 0.52, botY: 0.8, leftX: 0.15, rightX: 0.85 },
        { topY: 0.32, botY: 0.6, leftX: 0.24, rightX: 0.76 },
        { topY: 0.14, botY: 0.4, leftX: 0.32, rightX: 0.68 }
      ];

      for (const t of tiers) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * t.rightX, h * t.botY);
        ctx.lineTo(w * 0.5, h * (t.botY - 0.05));
        ctx.lineTo(w * t.leftX, h * t.botY);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.fillStyle = 'rgba(5, 30, 15, 0.3)';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * t.rightX, h * t.botY);
        ctx.lineTo(w * 0.5, h * (t.botY - 0.05));
        ctx.closePath();
        ctx.fill();

        // Snow cap
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * (t.rightX - 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.quadraticCurveTo(w * 0.65, h * (t.topY + 0.1), w * 0.5, h * (t.topY + 0.08));
        ctx.quadraticCurveTo(w * 0.35, h * (t.topY + 0.1), w * (t.leftX + 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * t.topY);
        ctx.lineTo(w * t.rightX, h * t.botY);
        ctx.lineTo(w * 0.5, h * (t.botY - 0.05));
        ctx.lineTo(w * t.leftX, h * t.botY);
        ctx.closePath();
        ctx.stroke();

        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(w * (t.leftX + 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.quadraticCurveTo(w * 0.35, h * (t.topY + 0.1), w * 0.5, h * (t.topY + 0.08));
        ctx.quadraticCurveTo(w * 0.65, h * (t.topY + 0.1), w * (t.rightX - 0.04), h * (t.topY + (t.botY - t.topY) * 0.45));
        ctx.stroke();
      }

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL WORLD CIVILIZATION STAMPS
  // =========================================================================
  {
    id: 'windmill_rustic',
    name: 'Rustic Windmill',
    category: 'world_civilization',
    defaultScale: 1.0,
    aspect: 0.9,
    render: (ctx, size, color = '#2c221e', fill = '#e7e5e4') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

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
      ctx.fillRect(w * 0.5, h * 0.4, w * 0.22, h * 0.5);

      // Conical timber roof cap
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.4);
      ctx.lineTo(w * 0.5, h * 0.22);
      ctx.lineTo(w * 0.68, h * 0.4);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();

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

      // Tower outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.9);
      ctx.lineTo(w * 0.36, h * 0.4);
      ctx.lineTo(w * 0.64, h * 0.4);
      ctx.lineTo(w * 0.72, h * 0.9);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.4);
      ctx.lineTo(w * 0.5, h * 0.22);
      ctx.lineTo(w * 0.68, h * 0.4);
      ctx.closePath();
      ctx.stroke();

      // 4 Crossed lattice sails
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
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
      ctx.restore();

      // Axle hub
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, w * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'civ_lighthouse',
    name: 'Coastal Lighthouse',
    category: 'world_civilization',
    defaultScale: 1.1,
    aspect: 0.8,
    render: (ctx, size, color = '#1c1917', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 0.8;
      const h = size;

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
      ctx.lineWidth = 2.5;
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
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.84);
      ctx.lineTo(w * 0.35, h * 0.28);
      ctx.lineTo(w * 0.65, h * 0.28);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.closePath();
      ctx.stroke();

      // Walkway platform
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.28, h * 0.26, w * 0.44, h * 0.03);
      ctx.strokeRect(w * 0.28, h * 0.26, w * 0.44, h * 0.03);

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
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.36, h * 0.16, w * 0.28, h * 0.1);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.16);
      ctx.lineTo(w * 0.5, h * 0.26);
      ctx.stroke();

      // Cupola roof
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.16);
      ctx.lineTo(w * 0.5, h * 0.06);
      ctx.lineTo(w * 0.68, h * 0.16);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.stroke();

      // Finial
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.05, w * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'ruined_tower',
    name: 'Ruined Tower',
    category: 'world_civilization',
    defaultScale: 1.1,
    aspect: 0.9,
    render: (ctx, size, color = '#271c19', fill = '#d6d3d1') => {
      ctx.save();
      const w = size * 0.9;
      const h = size;

      // Crumbled watchtower main wall
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.88);
      ctx.lineTo(w * 0.26, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.34);
      ctx.lineTo(w * 0.42, h * 0.34);
      ctx.lineTo(w * 0.44, h * 0.46);
      ctx.lineTo(w * 0.54, h * 0.46);
      ctx.lineTo(w * 0.56, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.38);
      ctx.lineTo(w * 0.68, h * 0.54);
      ctx.lineTo(w * 0.74, h * 0.6);
      ctx.lineTo(w * 0.76, h * 0.88);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Right shadow
      ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.46);
      ctx.lineTo(w * 0.56, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.38);
      ctx.lineTo(w * 0.68, h * 0.54);
      ctx.lineTo(w * 0.74, h * 0.6);
      ctx.lineTo(w * 0.76, h * 0.88);
      ctx.lineTo(w * 0.5, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // Wall breach
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.6);
      ctx.quadraticCurveTo(w * 0.42, h * 0.52, w * 0.48, h * 0.6);
      ctx.lineTo(w * 0.46, h * 0.74);
      ctx.lineTo(w * 0.38, h * 0.74);
      ctx.closePath();
      ctx.fill();

      // Ivy patch
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.48, w * 0.05, 0, Math.PI * 2);
      ctx.arc(w * 0.26, h * 0.56, w * 0.06, 0, Math.PI * 2);
      ctx.arc(w * 0.3, h * 0.64, w * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Fallen rubble stones
      const rubble = [
        { x: w * 0.72, y: h * 0.84, w: w * 0.08, h: h * 0.06 },
        { x: w * 0.8, y: h * 0.86, w: w * 0.07, h: h * 0.05 },
        { x: w * 0.75, y: h * 0.79, w: w * 0.06, h: h * 0.05 }
      ];
      ctx.fillStyle = '#a8a29e';
      for (const r of rubble) {
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.88);
      ctx.lineTo(w * 0.26, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.26);
      ctx.lineTo(w * 0.34, h * 0.34);
      ctx.lineTo(w * 0.42, h * 0.34);
      ctx.lineTo(w * 0.44, h * 0.46);
      ctx.lineTo(w * 0.54, h * 0.46);
      ctx.lineTo(w * 0.56, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.38);
      ctx.lineTo(w * 0.68, h * 0.54);
      ctx.lineTo(w * 0.74, h * 0.6);
      ctx.lineTo(w * 0.76, h * 0.88);
      ctx.stroke();

      for (const r of rubble) {
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      }

      // Masonry lines
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.4);
      ctx.lineTo(w * 0.4, h * 0.4);
      ctx.moveTo(w * 0.52, h * 0.65);
      ctx.lineTo(w * 0.68, h * 0.65);
      ctx.moveTo(w * 0.48, h * 0.8);
      ctx.lineTo(w * 0.62, h * 0.8);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'bridge_stone',
    name: 'Stone Arch Bridge',
    category: 'world_civilization',
    defaultScale: 1.2,
    aspect: 1.6,
    render: (ctx, size, color = '#271c19', fill = '#cbd5e1') => {
      ctx.save();
      const w = size * 1.6;
      const h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.82);
      ctx.lineTo(w * 0.9, h * 0.82);
      ctx.moveTo(w * 0.2, h * 0.88);
      ctx.lineTo(w * 0.8, h * 0.88);
      ctx.stroke();

      // Stone Bridge body
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.95, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.8);
      ctx.lineTo(w * 0.88, h * 0.8);
      ctx.arc(w * 0.7, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.48, h * 0.8);
      ctx.arc(w * 0.3, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.05, h * 0.8);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Pier shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.fillRect(w * 0.46, h * 0.6, w * 0.08, h * 0.2);

      // Parapet
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.52);
      ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.95, h * 0.52);
      ctx.lineTo(w * 0.95, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.05, h * 0.58);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.52);
      ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.95, h * 0.52);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.58);
      ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.95, h * 0.58);
      ctx.lineTo(w * 0.95, h * 0.8);
      ctx.lineTo(w * 0.88, h * 0.8);
      ctx.arc(w * 0.7, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.48, h * 0.8);
      ctx.arc(w * 0.3, h * 0.8, w * 0.18, 0, Math.PI, true);
      ctx.lineTo(w * 0.05, h * 0.8);
      ctx.closePath();
      ctx.stroke();

      // Keystones
      ctx.lineWidth = 1.8;
      ctx.strokeRect(w * 0.28, h * 0.59, w * 0.04, h * 0.06);
      ctx.strokeRect(w * 0.68, h * 0.59, w * 0.04, h * 0.06);

      ctx.restore();
    }
  },
  {
    id: 'farm_homestead',
    name: 'Farm Homestead',
    category: 'world_civilization',
    defaultScale: 1.2,
    aspect: 1.4,
    render: (ctx, size, color = '#2c221e', fill = '#fde68a') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Furrows
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const fy = h * (0.68 + i * 0.06);
        ctx.moveTo(w * 0.58, fy);
        ctx.lineTo(w * 0.94, fy);
      }
      ctx.stroke();

      // Silo
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(w * 0.14, h * 0.44, w * 0.14, h * 0.4);
      ctx.beginPath();
      ctx.arc(w * 0.21, h * 0.44, w * 0.07, Math.PI, 0);
      ctx.fillStyle = '#64748b';
      ctx.fill();

      // House wall
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.26, h * 0.52, w * 0.32, h * 0.32);

      // House shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
      ctx.fillRect(w * 0.42, h * 0.52, w * 0.16, h * 0.32);

      // Roof
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.52);
      ctx.lineTo(w * 0.42, h * 0.28);
      ctx.lineTo(w * 0.62, h * 0.52);
      ctx.closePath();
      ctx.fillStyle = '#d97706';
      ctx.fill();

      // Chimney
      ctx.fillStyle = '#78350f';
      ctx.fillRect(w * 0.46, h * 0.25, w * 0.06, h * 0.12);

      // Door and window
      ctx.fillStyle = '#451a03';
      ctx.fillRect(w * 0.32, h * 0.68, w * 0.06, h * 0.16);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.44, h * 0.62, w * 0.06, h * 0.06);

      // Fence
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.88);
      ctx.lineTo(w * 0.54, h * 0.88);
      ctx.moveTo(w * 0.08, h * 0.84);
      ctx.lineTo(w * 0.54, h * 0.84);
      for (let i = 0; i < 5; i++) {
        const px = w * (0.1 + i * 0.1);
        ctx.moveTo(px, h * 0.82);
        ctx.lineTo(px, h * 0.92);
      }
      ctx.stroke();

      // Outlines
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.14, h * 0.44, w * 0.14, h * 0.4);
      ctx.beginPath();
      ctx.arc(w * 0.21, h * 0.44, w * 0.07, Math.PI, 0);
      ctx.stroke();

      ctx.strokeRect(w * 0.26, h * 0.52, w * 0.32, h * 0.32);
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.52);
      ctx.lineTo(w * 0.42, h * 0.28);
      ctx.lineTo(w * 0.62, h * 0.52);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeRect(w * 0.46, h * 0.25, w * 0.06, h * 0.12);

      ctx.restore();
    }
  },
  {
    id: 'port_dock',
    name: 'Port Dock',
    category: 'world_civilization',
    defaultScale: 1.2,
    aspect: 1.5,
    render: (ctx, size, color = '#271c19', fill = '#854d0e') => {
      ctx.save();
      const w = size * 1.5;
      const h = size;

      // Water ripples
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.84);
      ctx.lineTo(w * 0.95, h * 0.84);
      ctx.moveTo(w * 0.35, h * 0.9);
      ctx.lineTo(w * 0.88, h * 0.9);
      ctx.stroke();

      // Quay stone wall
      ctx.fillStyle = '#64748b';
      ctx.fillRect(w * 0.05, h * 0.35, w * 0.22, h * 0.52);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.05, h * 0.35, w * 0.22, h * 0.52);

      // Pilings
      const pilings = [0.38, 0.56, 0.74, 0.88];
      ctx.fillStyle = '#451a03';
      for (const px of pilings) {
        ctx.fillRect(w * px, h * 0.52, w * 0.04, h * 0.34);
        ctx.strokeRect(w * px, h * 0.52, w * 0.04, h * 0.34);
      }

      // Pier deck
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.22, h * 0.46, w * 0.72, h * 0.1);
      ctx.strokeRect(w * 0.22, h * 0.46, w * 0.72, h * 0.1);

      // Planks
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const plankCount = 8;
      for (let i = 1; i < plankCount; i++) {
        const lx = w * (0.22 + (0.72 / plankCount) * i);
        ctx.moveTo(lx, h * 0.46);
        ctx.lineTo(lx, h * 0.56);
      }
      ctx.stroke();

      // Bollards
      ctx.fillStyle = '#1c1917';
      const bollards = [0.32, 0.62, 0.9];
      for (const bx of bollards) {
        ctx.fillRect(w * bx, h * 0.4, w * 0.03, h * 0.07);
        ctx.beginPath();
        ctx.arc(w * (bx + 0.015), h * 0.4, w * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crates
      ctx.fillStyle = '#d97706';
      ctx.fillRect(w * 0.44, h * 0.36, w * 0.08, h * 0.1);
      ctx.strokeRect(w * 0.44, h * 0.36, w * 0.08, h * 0.1);
      ctx.fillRect(w * 0.51, h * 0.38, w * 0.07, h * 0.08);
      ctx.strokeRect(w * 0.51, h * 0.38, w * 0.07, h * 0.08);

      ctx.restore();
    }
  },
  {
    id: 'civ_temple',
    name: 'Ancient Temple',
    category: 'world_civilization',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#f5f5f4') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Plinth base
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.08, h * 0.82, w * 0.84, h * 0.06);
      ctx.fillRect(w * 0.12, h * 0.77, w * 0.76, h * 0.05);
      ctx.fillRect(w * 0.16, h * 0.72, w * 0.68, h * 0.05);

      // Sanctuary dark interior
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.22, h * 0.38, w * 0.56, h * 0.34);

      // Columns
      const cols = [0.22, 0.38, 0.54, 0.7];
      for (const cx of cols) {
        ctx.fillStyle = fill;
        ctx.fillRect(w * cx, h * 0.38, w * 0.08, h * 0.34);
        ctx.fillStyle = 'rgba(20, 15, 10, 0.2)';
        ctx.fillRect(w * (cx + 0.04), h * 0.38, w * 0.04, h * 0.34);
      }

      // Entablature
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.16, h * 0.32, w * 0.68, h * 0.06);

      // Pediment
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.32);
      ctx.lineTo(w * 0.5, h * 0.14);
      ctx.lineTo(w * 0.86, h * 0.32);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Relief emblem
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.24, w * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.strokeRect(w * 0.08, h * 0.82, w * 0.84, h * 0.06);
      ctx.strokeRect(w * 0.12, h * 0.77, w * 0.76, h * 0.05);
      ctx.strokeRect(w * 0.16, h * 0.72, w * 0.68, h * 0.05);

      for (const cx of cols) {
        ctx.strokeRect(w * cx, h * 0.38, w * 0.08, h * 0.34);
      }

      ctx.strokeRect(w * 0.16, h * 0.32, w * 0.68, h * 0.06);

      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.32);
      ctx.lineTo(w * 0.5, h * 0.14);
      ctx.lineTo(w * 0.86, h * 0.32);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.24, w * 0.04, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'camp_tent',
    name: 'Camp Tent',
    category: 'world_civilization',
    defaultScale: 1.0,
    aspect: 1.1,
    render: (ctx, size, color = '#2c221e', fill = '#fde047') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      // Contact shadow
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.86, w * 0.42, h * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(25, 20, 15, 0.3)';
      ctx.fill();

      // Side canvas panel
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.84, h * 0.46);
      ctx.lineTo(w * 0.76, h * 0.84);
      ctx.lineTo(w * 0.42, h * 0.84);
      ctx.closePath();
      ctx.fillStyle = '#eab308';
      ctx.fill();

      // Front triangular facade
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.14, h * 0.84);
      ctx.lineTo(w * 0.42, h * 0.84);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Flap opening
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.42);
      ctx.lineTo(w * 0.28, h * 0.84);
      ctx.lineTo(w * 0.42, h * 0.84);
      ctx.closePath();
      ctx.fill();

      // Lantern glow inside
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.74, w * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Guy-lines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.06, h * 0.88);
      ctx.moveTo(w * 0.84, h * 0.46);
      ctx.lineTo(w * 0.94, h * 0.82);
      ctx.stroke();

      // Pegs
      ctx.fillStyle = '#78350f';
      ctx.fillRect(w * 0.04, h * 0.85, w * 0.03, h * 0.06);
      ctx.fillRect(w * 0.93, h * 0.79, w * 0.03, h * 0.06);

      // Outlines
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.14, h * 0.84);
      ctx.lineTo(w * 0.42, h * 0.84);
      ctx.closePath();
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.84, h * 0.46);
      ctx.lineTo(w * 0.76, h * 0.84);
      ctx.lineTo(w * 0.42, h * 0.84);
      ctx.stroke();

      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.28, h * 0.84);
      ctx.moveTo(w * 0.62, h * 0.39);
      ctx.lineTo(w * 0.58, h * 0.84);
      ctx.stroke();

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL WORLD NAUTICAL STAMPS
  // =========================================================================
  {
    id: 'nautical_kraken',
    name: 'Giant Kraken',
    category: 'world_nautical',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#1e1b4b', fill = '#4338ca') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Foaming water
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.82);
      ctx.quadraticCurveTo(w * 0.25, h * 0.76, w * 0.5, h * 0.82);
      ctx.quadraticCurveTo(w * 0.75, h * 0.76, w * 0.95, h * 0.82);
      ctx.stroke();

      // Mantle head
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.82);
      ctx.quadraticCurveTo(w * 0.36, h * 0.42, w * 0.5, h * 0.38);
      ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.62, h * 0.82);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Shadow on mantle
      ctx.fillStyle = 'rgba(15, 10, 40, 0.35)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.38);
      ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.62, h * 0.82);
      ctx.lineTo(w * 0.5, h * 0.82);
      ctx.closePath();
      ctx.fill();

      // Yellow eye
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w * 0.45, h * 0.58, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(w * 0.445, h * 0.555, w * 0.01, h * 0.05);

      // Tentacles
      const tentacles = [
        { sx: 0.38, sy: 0.8, c1x: 0.1, c1y: 0.6, c2x: 0.05, c2y: 0.25, ex: 0.18, ey: 0.16 },
        { sx: 0.42, sy: 0.78, c1x: 0.26, c1y: 0.45, c2x: 0.24, c2y: 0.2, ex: 0.34, ey: 0.12 },
        { sx: 0.58, sy: 0.78, c1x: 0.74, c1y: 0.45, c2x: 0.76, c2y: 0.2, ex: 0.66, ey: 0.12 },
        { sx: 0.62, sy: 0.8, c1x: 0.9, c1y: 0.6, c2x: 0.95, c2y: 0.25, ex: 0.82, ey: 0.16 }
      ];

      ctx.strokeStyle = fill;
      ctx.lineWidth = w * 0.05;
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
        const mx = (t.c1x + t.c2x) * 0.5;
        const my = (t.c1y + t.c2y) * 0.5;
        ctx.beginPath();
        ctx.arc(w * mx, h * my, w * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.82);
      ctx.quadraticCurveTo(w * 0.36, h * 0.42, w * 0.5, h * 0.38);
      ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.62, h * 0.82);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'ship_galleon',
    name: 'War Galleon',
    category: 'world_nautical',
    defaultScale: 1.3,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#fafafa') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Wooden hull
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.58);
      ctx.lineTo(w * 0.22, h * 0.65);
      ctx.lineTo(w * 0.72, h * 0.65);
      ctx.lineTo(w * 0.84, h * 0.58);
      ctx.lineTo(w * 0.94, h * 0.52);
      ctx.lineTo(w * 0.82, h * 0.72);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.lineTo(w * 0.16, h * 0.84);
      ctx.quadraticCurveTo(w * 0.08, h * 0.72, w * 0.1, h * 0.58);
      ctx.closePath();
      ctx.fillStyle = '#78350f';
      ctx.fill();

      // Gunports
      ctx.fillStyle = '#1c1917';
      const ports = [0.28, 0.4, 0.52, 0.64];
      for (const px of ports) {
        ctx.fillRect(w * px, h * 0.7, w * 0.04, h * 0.04);
      }

      // Hull outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.58);
      ctx.lineTo(w * 0.22, h * 0.65);
      ctx.lineTo(w * 0.72, h * 0.65);
      ctx.lineTo(w * 0.84, h * 0.58);
      ctx.lineTo(w * 0.94, h * 0.52);
      ctx.moveTo(w * 0.84, h * 0.58);
      ctx.lineTo(w * 0.82, h * 0.72);
      ctx.lineTo(w * 0.74, h * 0.84);
      ctx.lineTo(w * 0.16, h * 0.84);
      ctx.quadraticCurveTo(w * 0.08, h * 0.72, w * 0.1, h * 0.58);
      ctx.stroke();

      // 3 Masts
      const masts = [
        { x: 0.25, topY: 0.26, sW: 0.16, sH: 0.14 },
        { x: 0.48, topY: 0.14, sW: 0.24, sH: 0.18 },
        { x: 0.7, topY: 0.22, sW: 0.2, sH: 0.16 }
      ];

      for (const m of masts) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * m.x, h * 0.65);
        ctx.lineTo(w * m.x, h * m.topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * (m.x - m.sW * 0.5), h * (m.topY + 0.06));
        ctx.quadraticCurveTo(w * m.x, h * (m.topY + 0.08), w * (m.x + m.sW * 0.5), h * (m.topY + 0.06));
        ctx.lineTo(w * (m.x + m.sW * 0.45), h * (m.topY + 0.06 + m.sH));
        ctx.quadraticCurveTo(w * m.x, h * (m.topY + 0.09 + m.sH), w * (m.x - m.sW * 0.45), h * (m.topY + 0.06 + m.sH));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(w * m.x, h * m.topY);
        ctx.lineTo(w * (m.x - 0.06), h * (m.topY + 0.02));
        ctx.lineTo(w * m.x, h * (m.topY + 0.04));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Water wake
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.86);
      ctx.lineTo(w * 0.88, h * 0.86);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'nautical_whirlpool',
    name: 'Maelstrom Whirlpool',
    category: 'world_nautical',
    defaultScale: 1.2,
    aspect: 1.2,
    render: (ctx, size, color = '#0f172a', fill = '#0284c7') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Base water
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.46, h * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // Abyss core
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.12, h * 0.09, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#082f49';
      ctx.fill();

      // Spiral arms
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      const arms = 4;
      for (let i = 0; i < arms; i++) {
        const baseAng = (Math.PI * 2 / arms) * i;
        ctx.beginPath();
        for (let step = 0; step <= 30; step++) {
          const t = step / 30;
          const rX = w * (0.42 * (1 - t) + 0.1 * t);
          const rY = h * (0.36 * (1 - t) + 0.08 * t);
          const ang = baseAng + t * Math.PI * 2.2;
          const px = cx + Math.cos(ang) * rX;
          const py = cy + Math.sin(ang) * rY;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Foam spray
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < arms; i++) {
        const baseAng = (Math.PI * 2 / arms) * i + Math.PI / 4;
        ctx.beginPath();
        for (let step = 0; step <= 15; step++) {
          const t = step / 15;
          const rX = w * (0.32 * (1 - t) + 0.14 * t);
          const rY = h * (0.28 * (1 - t) + 0.11 * t);
          const ang = baseAng + t * Math.PI * 1.4;
          const px = cx + Math.cos(ang) * rX;
          const py = cy + Math.sin(ang) * rY;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Boundary stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.46, h * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'sea_serpent_head',
    name: 'Sea Serpent Head',
    category: 'world_nautical',
    defaultScale: 1.2,
    aspect: 1.1,
    render: (ctx, size, color = '#0f172a', fill = '#047857') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      // Sea waves
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.88);
      ctx.quadraticCurveTo(w * 0.3, h * 0.82, w * 0.5, h * 0.88);
      ctx.quadraticCurveTo(w * 0.7, h * 0.82, w * 0.9, h * 0.88);
      ctx.stroke();

      // Dorsal frill
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.86);
      ctx.lineTo(w * 0.14, h * 0.72);
      ctx.lineTo(w * 0.24, h * 0.68);
      ctx.lineTo(w * 0.16, h * 0.54);
      ctx.lineTo(w * 0.28, h * 0.48);
      ctx.lineTo(w * 0.22, h * 0.36);
      ctx.lineTo(w * 0.36, h * 0.36);
      ctx.lineTo(w * 0.38, h * 0.86);
      ctx.closePath();
      ctx.fill();

      // Head and neck body
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.86);
      ctx.quadraticCurveTo(w * 0.28, h * 0.52, w * 0.44, h * 0.34);
      ctx.lineTo(w * 0.56, h * 0.26);
      ctx.lineTo(w * 0.78, h * 0.28);
      ctx.lineTo(w * 0.58, h * 0.44);
      ctx.lineTo(w * 0.72, h * 0.52);
      ctx.lineTo(w * 0.48, h * 0.52);
      ctx.quadraticCurveTo(w * 0.44, h * 0.68, w * 0.52, h * 0.86);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Mouth interior
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.44);
      ctx.lineTo(w * 0.74, h * 0.36);
      ctx.lineTo(w * 0.5, h * 0.48);
      ctx.closePath();
      ctx.fill();

      // Forked tongue
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(w * 0.54, h * 0.46);
      ctx.lineTo(w * 0.82, h * 0.42);
      ctx.lineTo(w * 0.88, h * 0.38);
      ctx.moveTo(w * 0.82, h * 0.42);
      ctx.lineTo(w * 0.88, h * 0.46);
      ctx.stroke();

      // Fangs
      ctx.fillStyle = '#ffffff';
      const fangs = [
        { x1: 0.72, y1: 0.3, x2: 0.74, y2: 0.36, x3: 0.7, y3: 0.3 },
        { x1: 0.64, y1: 0.34, x2: 0.65, y2: 0.4, x3: 0.62, y3: 0.34 },
        { x1: 0.68, y1: 0.5, x2: 0.69, y2: 0.44, x3: 0.66, y3: 0.5 }
      ];
      for (const f of fangs) {
        ctx.beginPath();
        ctx.moveTo(w * f.x1, h * f.y1);
        ctx.lineTo(w * f.x2, h * f.y2);
        ctx.lineTo(w * f.x3, h * f.y3);
        ctx.closePath();
        ctx.fill();
      }

      // Eye
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w * 0.54, h * 0.33, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(w * 0.54, h * 0.33, w * 0.015, 0, Math.PI * 2);
      ctx.fill();

      // Inked outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.86);
      ctx.lineTo(w * 0.14, h * 0.72);
      ctx.lineTo(w * 0.24, h * 0.68);
      ctx.lineTo(w * 0.16, h * 0.54);
      ctx.lineTo(w * 0.28, h * 0.48);
      ctx.lineTo(w * 0.22, h * 0.36);
      ctx.lineTo(w * 0.36, h * 0.36);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.86);
      ctx.quadraticCurveTo(w * 0.28, h * 0.52, w * 0.44, h * 0.34);
      ctx.lineTo(w * 0.56, h * 0.26);
      ctx.lineTo(w * 0.78, h * 0.28);
      ctx.lineTo(w * 0.58, h * 0.44);
      ctx.lineTo(w * 0.72, h * 0.52);
      ctx.lineTo(w * 0.48, h * 0.52);
      ctx.quadraticCurveTo(w * 0.44, h * 0.68, w * 0.52, h * 0.86);
      ctx.stroke();

      ctx.restore();
    }
  },
  // =========================================================================
  // ADDITIONAL BATTLEMAP PROPS STAMPS
  // =========================================================================
  {
    id: 'prop_chest_wood',
    name: 'Dungeon Chest',
    category: 'battle_props',
    defaultScale: 0.9,
    aspect: 1.1,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.1;
      const h = size;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.16, h * 0.34, w * 0.72, h * 0.5);

      // Wooden box
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.14, h * 0.38, w * 0.72, h * 0.42);

      // Curved lid
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.38);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, w * 0.86, h * 0.38);
      ctx.closePath();
      ctx.fillStyle = '#92400e';
      ctx.fill();

      // Iron strapping
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.18, h * 0.28, w * 0.08, h * 0.52);
      ctx.fillRect(w * 0.46, h * 0.25, w * 0.08, h * 0.55);
      ctx.fillRect(w * 0.74, h * 0.28, w * 0.08, h * 0.52);

      // Padlock
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.47, h * 0.42, w * 0.06, h * 0.1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(w * 0.495, h * 0.45, w * 0.012, h * 0.04);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.38);
      ctx.quadraticCurveTo(w * 0.5, h * 0.22, w * 0.86, h * 0.38);
      ctx.stroke();

      ctx.strokeRect(w * 0.14, h * 0.38, w * 0.72, h * 0.42);
      ctx.strokeRect(w * 0.18, h * 0.28, w * 0.08, h * 0.52);
      ctx.strokeRect(w * 0.46, h * 0.25, w * 0.08, h * 0.55);
      ctx.strokeRect(w * 0.74, h * 0.28, w * 0.08, h * 0.52);

      // Rivets
      ctx.fillStyle = '#cbd5e1';
      const rivetY = [0.32, 0.48, 0.65, 0.74];
      for (const ry of rivetY) {
        ctx.beginPath();
        ctx.arc(w * 0.22, h * ry, w * 0.012, 0, Math.PI * 2);
        ctx.arc(w * 0.78, h * ry, w * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_stack',
    name: 'Barrel Stack',
    category: 'battle_props',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#271c19', fill = '#a16207') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Contact shadow
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.88, w * 0.44, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      const drawBarrel = (bx, by, bw, bh) => {
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, by);
        ctx.lineTo(bx + bw * 0.85, by);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.15, by + bh);
        ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.5, bx + bw * 0.15, by);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.fillStyle = 'rgba(20, 15, 10, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.5, by);
        ctx.lineTo(bx + bw * 0.85, by);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.5, by + bh);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + bw * 0.1, by + bh * 0.12, bw * 0.8, bh * 0.08);
        ctx.fillRect(bx + bw * 0.04, by + bh * 0.38, bw * 0.92, bh * 0.08);
        ctx.fillRect(bx + bw * 0.04, by + bh * 0.54, bw * 0.92, bh * 0.08);
        ctx.fillRect(bx + bw * 0.1, by + bh * 0.8, bw * 0.8, bh * 0.08);

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(bx + bw * 0.45, by + bh * 0.47, bw * 0.04, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.15, by);
        ctx.lineTo(bx + bw * 0.85, by);
        ctx.quadraticCurveTo(bx + bw * 1.05, by + bh * 0.5, bx + bw * 0.85, by + bh);
        ctx.lineTo(bx + bw * 0.15, by + bh);
        ctx.quadraticCurveTo(bx - bw * 0.05, by + bh * 0.5, bx + bw * 0.15, by);
        ctx.closePath();
        ctx.stroke();
      };

      drawBarrel(w * 0.08, h * 0.46, w * 0.4, h * 0.4);
      drawBarrel(w * 0.52, h * 0.46, w * 0.4, h * 0.4);
      drawBarrel(w * 0.3, h * 0.14, w * 0.4, h * 0.4);

      ctx.restore();
    }
  },
  {
    id: 'prop_altar_stone',
    name: 'Ritual Stone Altar',
    category: 'battle_props',
    defaultScale: 1.1,
    aspect: 1.4,
    render: (ctx, size, color = '#1c1917', fill = '#64748b') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      // Contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(w * 0.12, h * 0.46, w * 0.76, h * 0.44);

      // Bottom plinth
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.15, h * 0.76, w * 0.7, h * 0.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.15, h * 0.76, w * 0.7, h * 0.1);

      // Altar block
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.2, h * 0.46, w * 0.6, h * 0.3);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(w * 0.5, h * 0.46, w * 0.3, h * 0.3);
      ctx.strokeStyle = color;
      ctx.strokeRect(w * 0.2, h * 0.46, w * 0.6, h * 0.3);

      // Slab table top
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(w * 0.14, h * 0.38, w * 0.72, h * 0.08);
      ctx.strokeRect(w * 0.14, h * 0.38, w * 0.72, h * 0.08);

      // Crimson cloth runner
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(w * 0.42, h * 0.38, w * 0.16, h * 0.4);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(w * 0.42, h * 0.76, w * 0.16, h * 0.02);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.strokeRect(w * 0.42, h * 0.38, w * 0.16, h * 0.4);

      // Carved rune
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.58, w * 0.035, 0, Math.PI * 2);
      ctx.moveTo(w * 0.48, h * 0.54);
      ctx.lineTo(w * 0.52, h * 0.62);
      ctx.stroke();

      // Candlesticks with flames
      const candles = [0.22, 0.74];
      for (const cx of candles) {
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(w * (cx - 0.02), h * 0.32, w * 0.04, h * 0.06);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(w * (cx - 0.01), h * 0.24, w * 0.02, h * 0.08);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(w * cx, h * 0.16);
        ctx.quadraticCurveTo(w * (cx + 0.02), h * 0.22, w * cx, h * 0.24);
        ctx.quadraticCurveTo(w * (cx - 0.02), h * 0.22, w * cx, h * 0.16);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  },
  {
    id: 'prop_bookshelf',
    name: 'Library Bookshelf',
    category: 'battle_props',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#271c19', fill = '#78350f') => {
      ctx.save();
      const w = size * 1.2;
      const h = size;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.14, h * 0.18, w * 0.74, h * 0.74);

      // Bookcase frame
      ctx.fillStyle = fill;
      ctx.fillRect(w * 0.12, h * 0.14, w * 0.76, h * 0.74);

      // Interior backing
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(w * 0.18, h * 0.18, w * 0.64, h * 0.66);

      // Top shelf books
      const topBooks = [
        { x: 0.2, w: 0.04, h: 0.16, color: '#dc2626' },
        { x: 0.24, w: 0.05, h: 0.18, color: '#2563eb' },
        { x: 0.29, w: 0.04, h: 0.15, color: '#16a34a' },
        { x: 0.33, w: 0.06, h: 0.17, color: '#ca8a04' },
        { x: 0.39, w: 0.04, h: 0.14, color: '#9333ea' },
        { x: 0.43, w: 0.05, h: 0.18, color: '#ea580c' },
        { x: 0.48, w: 0.05, h: 0.16, color: '#0284c7' }
      ];
      for (const b of topBooks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * (0.38 - b.h), w * b.w, h * b.h);
      }

      // Middle shelf books & scrolls
      const midBooks = [
        { x: 0.2, w: 0.05, h: 0.17, color: '#b91c1c' },
        { x: 0.25, w: 0.06, h: 0.16, color: '#0d9488' },
        { x: 0.31, w: 0.04, h: 0.18, color: '#d97706' }
      ];
      for (const b of midBooks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * (0.6 - b.h), w * b.w, h * b.h);
      }
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w * 0.52, h * 0.54, w * 0.24, h * 0.05);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(w * 0.55, h * 0.49, w * 0.18, h * 0.05);

      // Bottom shelf books & flask
      const botBooks = [
        { x: 0.2, w: 0.07, h: 0.18, color: '#4338ca' },
        { x: 0.27, w: 0.06, h: 0.17, color: '#059669' },
        { x: 0.33, w: 0.08, h: 0.19, color: '#7c2d12' }
      ];
      for (const b of botBooks) {
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * (0.84 - b.h), w * b.w, h * b.h);
      }
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(w * 0.68, h * 0.77, w * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.665, h * 0.7, w * 0.03, h * 0.04);

      // Wooden dividers
      ctx.fillStyle = '#92400e';
      ctx.fillRect(w * 0.16, h * 0.38, w * 0.68, h * 0.04);
      ctx.fillRect(w * 0.16, h * 0.6, w * 0.68, h * 0.04);
      ctx.fillRect(w * 0.16, h * 0.84, w * 0.68, h * 0.04);

      // Outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.strokeRect(w * 0.12, h * 0.14, w * 0.76, h * 0.74);
      ctx.strokeRect(w * 0.16, h * 0.38, w * 0.68, h * 0.04);
      ctx.strokeRect(w * 0.16, h * 0.6, w * 0.68, h * 0.04);
      ctx.strokeRect(w * 0.16, h * 0.84, w * 0.68, h * 0.04);

      // Crown molding
      ctx.fillStyle = '#b45309';
      ctx.fillRect(w * 0.1, h * 0.11, w * 0.8, h * 0.04);
      ctx.strokeRect(w * 0.1, h * 0.11, w * 0.8, h * 0.04);

      ctx.restore();
    }
  }
].concat(EXTRA_STAMPS);

export function getStampById(id) {
  return STAMPS.find((s) => s.id === id);
}
