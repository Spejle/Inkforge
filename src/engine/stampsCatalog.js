// Fantasy and Tactical Stamp Catalog
// Renders vector-sharp cartography and battlemap assets with consistent aspect ratios and lighting

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
  }
];

export function getStampById(id) {
  return STAMPS.find((s) => s.id === id);
}
