// Fantasy and Tactical Stamp Catalog
// Renders vector-sharp cartography and battlemap assets

export const STAMP_CATEGORIES = [
  { id: 'world_nature', name: 'Nature & Land', type: 'world' },
  { id: 'world_civilization', name: 'Settlements & Structures', type: 'world' },
  { id: 'world_nautical', name: 'Nautical & Icons', type: 'world' },
  { id: 'battle_rooms', name: 'Dungeon & Structures', type: 'battle' },
  { id: 'battle_props', name: 'Furniture & Props', type: 'battle' },
  { id: 'battle_tokens', name: 'Creatures & Heroes', type: 'battle' },
];

export const STAMPS = [
  // ---------------- WORLD: MOUNTAINS & HILLS ----------------
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
      ctx.lineTo(w * 0.3, h * 0.35);
      ctx.lineTo(w * 0.55, h * 0.85);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      // Draw secondary peak right
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.85);
      ctx.lineTo(w * 0.75, h * 0.38);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      // Draw primary main peak center
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.85);
      ctx.lineTo(w * 0.5, h * 0.18);
      ctx.lineTo(w * 0.78, h * 0.85);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      // Primary ridge line
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.18);
      ctx.quadraticCurveTo(w * 0.52, h * 0.5, w * 0.56, h * 0.85);
      ctx.stroke();

      // Shading on center peak
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.18);
      ctx.quadraticCurveTo(w * 0.52, h * 0.5, w * 0.56, h * 0.85);
      ctx.lineTo(w * 0.78, h * 0.85);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 40, 35, 0.25)';
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'hills_rolling',
    name: 'Rolling Hills',
    category: 'world_nature',
    defaultScale: 1.0,
    aspect: 1.3,
    render: (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
      ctx.save();
      const w = size * 1.3;
      const h = size;

      // Hill 1
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.75, h * 0.4, Math.PI, 0, false);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = h * 0.035;
      ctx.stroke();

      // Hill 2
      ctx.beginPath();
      ctx.arc(w * 0.68, h * 0.75, h * 0.35, Math.PI, 0, false);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      // Detail stipple lines
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.75, h * 0.32, Math.PI * 1.15, Math.PI * 1.45, false);
      ctx.lineWidth = h * 0.02;
      ctx.stroke();

      ctx.restore();
    }
  },

  // ---------------- WORLD: TREES & FORESTS ----------------
  {
    id: 'tree_pine',
    name: 'Evergreen Pine',
    category: 'world_nature',
    defaultScale: 0.8,
    aspect: 0.8,
    render: (ctx, size, color = '#1f3823', fill = '#3f6844') => {
      ctx.save();
      const s = size;

      // Trunk
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(s * 0.44, s * 0.75, s * 0.12, s * 0.2);

      // Layered pine triangles
      const layers = [
        { top: s * 0.1, bot: s * 0.42, w: s * 0.42 },
        { top: s * 0.3, bot: s * 0.62, w: s * 0.58 },
        { top: s * 0.48, bot: s * 0.82, w: s * 0.74 }
      ];

      layers.forEach((l) => {
        ctx.beginPath();
        ctx.moveTo(s * 0.5, l.top);
        ctx.lineTo(s * 0.5 - l.w / 2, l.bot);
        ctx.lineTo(s * 0.5 + l.w / 2, l.bot);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
      });

      ctx.restore();
    }
  },
  {
    id: 'tree_oak',
    name: 'Ancient Oak',
    category: 'world_nature',
    defaultScale: 0.9,
    aspect: 0.9,
    render: (ctx, size, color = '#2a3b1f', fill = '#638c47') => {
      ctx.save();
      const s = size;

      // Trunk
      ctx.beginPath();
      ctx.moveTo(s * 0.42, s * 0.6);
      ctx.lineTo(s * 0.4, s * 0.92);
      ctx.lineTo(s * 0.6, s * 0.92);
      ctx.lineTo(s * 0.58, s * 0.6);
      ctx.fillStyle = '#543d2b';
      ctx.fill();
      ctx.strokeStyle = '#2d2015';
      ctx.lineWidth = s * 0.025;
      ctx.stroke();

      // Puffy foliage puffs
      ctx.fillStyle = fill;
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;

      const puffs = [
        { x: s * 0.35, y: s * 0.45, r: s * 0.24 },
        { x: s * 0.65, y: s * 0.45, r: s * 0.24 },
        { x: s * 0.5, y: s * 0.3, r: s * 0.26 },
        { x: s * 0.5, y: s * 0.5, r: s * 0.28 }
      ];

      puffs.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    }
  },
  {
    id: 'tree_forest_cluster',
    name: 'Dense Forest Grove',
    category: 'world_nature',
    defaultScale: 1.2,
    aspect: 1.4,
    render: (ctx, size, color = '#1a331c', fill = '#4a7541') => {
      ctx.save();
      const w = size * 1.4;
      const h = size;

      const trees = [
        { x: w * 0.25, y: h * 0.4, s: h * 0.7 },
        { x: w * 0.75, y: h * 0.4, s: h * 0.7 },
        { x: w * 0.5, y: h * 0.3, s: h * 0.8 },
        { x: w * 0.38, y: h * 0.55, s: h * 0.65 },
        { x: w * 0.62, y: h * 0.55, s: h * 0.65 }
      ];

      trees.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.s * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = h * 0.03;
        ctx.stroke();
      });

      ctx.restore();
    }
  },

  // ---------------- WORLD: CIVILIZATION & STRUCTURES ----------------
  {
    id: 'castle_citadel',
    name: 'Grand Fortress Citadel',
    category: 'world_civilization',
    defaultScale: 1.3,
    aspect: 1.2,
    render: (ctx, size, color = '#23201d', fill = '#d4cbb8') => {
      ctx.save();
      const s = size;
      ctx.fillStyle = fill;
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.03;

      // Central keep
      ctx.fillRect(s * 0.35, s * 0.3, s * 0.3, s * 0.55);
      ctx.strokeRect(s * 0.35, s * 0.3, s * 0.3, s * 0.55);

      // Left Tower
      ctx.fillRect(s * 0.18, s * 0.22, s * 0.18, s * 0.63);
      ctx.strokeRect(s * 0.18, s * 0.22, s * 0.18, s * 0.63);

      // Right Tower
      ctx.fillRect(s * 0.64, s * 0.22, s * 0.18, s * 0.63);
      ctx.strokeRect(s * 0.64, s * 0.22, s * 0.18, s * 0.63);

      // Conical roofs
      ctx.fillStyle = '#8b2626'; // Deep red roof
      // Left roof
      ctx.beginPath();
      ctx.moveTo(s * 0.15, s * 0.22);
      ctx.lineTo(s * 0.27, s * 0.05);
      ctx.lineTo(s * 0.39, s * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right roof
      ctx.beginPath();
      ctx.moveTo(s * 0.61, s * 0.22);
      ctx.lineTo(s * 0.73, s * 0.05);
      ctx.lineTo(s * 0.85, s * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center roof
      ctx.beginPath();
      ctx.moveTo(s * 0.32, s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.12);
      ctx.lineTo(s * 0.68, s * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Portcullis / arched gate
      ctx.fillStyle = '#3a2e24';
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.72, s * 0.08, Math.PI, 0, false);
      ctx.lineTo(s * 0.58, s * 0.85);
      ctx.lineTo(s * 0.42, s * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Arrow slits
      ctx.fillStyle = '#222';
      ctx.fillRect(s * 0.25, s * 0.38, s * 0.04, s * 0.1);
      ctx.fillRect(s * 0.71, s * 0.38, s * 0.04, s * 0.1);
      ctx.fillRect(s * 0.48, s * 0.42, s * 0.04, s * 0.1);

      ctx.restore();
    }
  },
  {
    id: 'village_houses',
    name: 'Village Hamlet',
    category: 'world_civilization',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#23201d', fill = '#dcd4c0') => {
      ctx.save();
      const s = size;
      ctx.lineWidth = s * 0.03;

      const houses = [
        { x: s * 0.15, y: s * 0.45, w: s * 0.32, h: s * 0.35, roofH: s * 0.2 },
        { x: s * 0.53, y: s * 0.4, w: s * 0.35, h: s * 0.4, roofH: s * 0.22 }
      ];

      houses.forEach(h => {
        // Base
        ctx.fillStyle = fill;
        ctx.fillRect(h.x, h.y + h.roofH * 0.7, h.w, h.h - h.roofH * 0.7);
        ctx.strokeRect(h.x, h.y + h.roofH * 0.7, h.w, h.h - h.roofH * 0.7);

        // Roof
        ctx.fillStyle = '#9e472a';
        ctx.beginPath();
        ctx.moveTo(h.x - s * 0.03, h.y + h.roofH * 0.7);
        ctx.lineTo(h.x + h.w / 2, h.y);
        ctx.lineTo(h.x + h.w + s * 0.03, h.y + h.roofH * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Door
        ctx.fillStyle = '#42281a';
        ctx.fillRect(h.x + h.w * 0.4, h.y + h.h * 0.65, h.w * 0.2, h.h * 0.35);
      });

      ctx.restore();
    }
  },
  {
    id: 'tower_wizard',
    name: 'Spire Tower',
    category: 'world_civilization',
    defaultScale: 1.1,
    aspect: 0.7,
    render: (ctx, size, color = '#23201d', fill = '#ccc4b0') => {
      ctx.save();
      const s = size;
      ctx.lineWidth = s * 0.03;

      // Shaft
      ctx.fillStyle = fill;
      ctx.fillRect(s * 0.35, s * 0.28, s * 0.3, s * 0.62);
      ctx.strokeRect(s * 0.35, s * 0.28, s * 0.3, s * 0.62);

      // Top parapet
      ctx.fillRect(s * 0.3, s * 0.22, s * 0.4, s * 0.08);
      ctx.strokeRect(s * 0.3, s * 0.22, s * 0.4, s * 0.08);

      // Sharp roof
      ctx.fillStyle = '#4338ca'; // Arcane blue roof
      ctx.beginPath();
      ctx.moveTo(s * 0.28, s * 0.22);
      ctx.lineTo(s * 0.5, s * 0.03);
      ctx.lineTo(s * 0.72, s * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing crystal orb on top
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.03, s * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },

  // ---------------- WORLD: NAUTICAL & CARTOGRAPHY ----------------
  {
    id: 'compass_rose',
    name: 'Cartographer Compass Rose',
    category: 'world_nautical',
    defaultScale: 1.4,
    aspect: 1,
    render: (ctx, size, color = '#2c221e', fill = '#dfd2b5') => {
      ctx.save();
      const s = size;
      const c = s / 2;
      const r = s * 0.44;

      // Outer rings
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.025;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(c, c, r * 0.8, 0, Math.PI * 2);
      ctx.lineWidth = s * 0.015;
      ctx.stroke();

      // 4 Main Cardinal Points (N, S, E, W)
      const points = [
        { angle: -Math.PI / 2, len: r * 0.95, label: 'N' },
        { angle: 0, len: r * 0.95, label: 'E' },
        { angle: Math.PI / 2, len: r * 0.95, label: 'S' },
        { angle: Math.PI, len: r * 0.95, label: 'W' }
      ];

      points.forEach(p => {
        const perp = p.angle + Math.PI / 2;
        const w = s * 0.07;
        const tipX = c + Math.cos(p.angle) * p.len;
        const tipY = c + Math.sin(p.angle) * p.len;
        const baseLX = c + Math.cos(perp) * w;
        const baseLY = c + Math.sin(perp) * w;
        const baseRX = c - Math.cos(perp) * w;
        const baseRY = c - Math.sin(perp) * w;

        // Dark half
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseLX, baseLY);
        ctx.closePath();
        ctx.fillStyle = '#2c221e';
        ctx.fill();

        // Light half
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseRX, baseRY);
        ctx.closePath();
        ctx.fillStyle = '#d4af37'; // Antique gold
        ctx.fill();
        ctx.stroke();
      });

      // Center gem
      ctx.beginPath();
      ctx.arc(c, c, s * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#8b2626';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'ship_caravel',
    name: 'Galleon / Caravel',
    category: 'world_nautical',
    defaultScale: 1.1,
    aspect: 1.2,
    render: (ctx, size, color = '#23201d', fill = '#5a3d28') => {
      ctx.save();
      const s = size;
      ctx.lineWidth = s * 0.03;

      // Hull
      ctx.beginPath();
      ctx.moveTo(s * 0.1, s * 0.65);
      ctx.quadraticCurveTo(s * 0.45, s * 0.85, s * 0.9, s * 0.6);
      ctx.lineTo(s * 0.85, s * 0.72);
      ctx.quadraticCurveTo(s * 0.45, s * 0.92, s * 0.15, s * 0.75);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();

      // Masts
      ctx.beginPath();
      ctx.moveTo(s * 0.35, s * 0.68);
      ctx.lineTo(s * 0.35, s * 0.2);
      ctx.moveTo(s * 0.62, s * 0.66);
      ctx.lineTo(s * 0.62, s * 0.15);
      ctx.stroke();

      // Billowing Sails
      ctx.fillStyle = '#f5f0e1';
      // Fore sail
      ctx.beginPath();
      ctx.moveTo(s * 0.35, s * 0.25);
      ctx.quadraticCurveTo(s * 0.48, s * 0.38, s * 0.35, s * 0.52);
      ctx.quadraticCurveTo(s * 0.22, s * 0.38, s * 0.35, s * 0.25);
      ctx.fill();
      ctx.stroke();

      // Main sail
      ctx.beginPath();
      ctx.moveTo(s * 0.62, s * 0.2);
      ctx.quadraticCurveTo(s * 0.77, s * 0.35, s * 0.62, s * 0.52);
      ctx.quadraticCurveTo(s * 0.48, s * 0.35, s * 0.62, s * 0.2);
      ctx.fill();
      ctx.stroke();

      // Water waves under ship
      ctx.beginPath();
      ctx.moveTo(s * 0.05, s * 0.82);
      ctx.quadraticCurveTo(s * 0.25, s * 0.78, s * 0.5, s * 0.82);
      ctx.quadraticCurveTo(s * 0.75, s * 0.86, s * 0.95, s * 0.8);
      ctx.strokeStyle = '#29527a';
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'sea_serpent',
    name: 'Mythic Sea Monster',
    category: 'world_nautical',
    defaultScale: 1.2,
    aspect: 1.3,
    render: (ctx, size, color = '#1a332d', fill = '#265449') => {
      ctx.save();
      const s = size;
      ctx.lineWidth = s * 0.035;

      // Serpent coils rising from the deep
      // Coil 1
      ctx.beginPath();
      ctx.arc(s * 0.25, s * 0.7, s * 0.16, Math.PI, 0, false);
      ctx.strokeStyle = color;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      // Coil 2
      ctx.beginPath();
      ctx.arc(s * 0.55, s * 0.7, s * 0.2, Math.PI, 0, false);
      ctx.fill();
      ctx.stroke();

      // Dragon/Serpent Head rising up
      ctx.beginPath();
      ctx.moveTo(s * 0.75, s * 0.7);
      ctx.quadraticCurveTo(s * 0.8, s * 0.4, s * 0.78, s * 0.25);
      ctx.lineTo(s * 0.92, s * 0.2); // snout
      ctx.lineTo(s * 0.82, s * 0.32); // jaw
      ctx.quadraticCurveTo(s * 0.86, s * 0.5, s * 0.82, s * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eye
      ctx.beginPath();
      ctx.arc(s * 0.82, s * 0.24, s * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // Water ripples
      ctx.strokeStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(s * 0.05, s * 0.72);
      ctx.lineTo(s * 0.95, s * 0.72);
      ctx.stroke();

      ctx.restore();
    }
  },

  // ---------------- BATTLEMAP: DUNGEON STRUCTURES ----------------
  {
    id: 'dungeon_wall_block',
    name: 'Stone Wall Section',
    category: 'battle_rooms',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      // Stone masonry block
      ctx.fillStyle = '#3a3d40';
      ctx.fillRect(0, 0, s, s);

      // Inner brick lines
      ctx.strokeStyle = '#1e2022';
      ctx.lineWidth = s * 0.06;
      ctx.strokeRect(s * 0.03, s * 0.03, s * 0.94, s * 0.94);

      // Brick pattern
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.lineTo(s, s * 0.5);
      ctx.moveTo(s * 0.5, 0);
      ctx.lineTo(s * 0.5, s * 0.5);
      ctx.moveTo(s * 0.25, s * 0.5);
      ctx.lineTo(s * 0.25, s);
      ctx.moveTo(s * 0.75, s * 0.5);
      ctx.lineTo(s * 0.75, s);
      ctx.stroke();

      // Highlight bevel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.moveTo(s * 0.05, s * 0.05);
      ctx.lineTo(s * 0.95, s * 0.05);
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'dungeon_door_wooden',
    name: 'Heavy Reinforced Door',
    category: 'battle_rooms',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      // Wooden door leaf
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(s * 0.1, s * 0.2, s * 0.8, s * 0.6);

      // Planks
      ctx.strokeStyle = '#321e10';
      ctx.lineWidth = s * 0.03;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(s * (0.1 + i * 0.2), s * 0.2);
        ctx.lineTo(s * (0.1 + i * 0.2), s * 0.8);
        ctx.stroke();
      }

      // Iron hinges / bands
      ctx.fillStyle = '#222';
      ctx.fillRect(s * 0.08, s * 0.3, s * 0.84, s * 0.08);
      ctx.fillRect(s * 0.08, s * 0.62, s * 0.84, s * 0.08);

      // Door outline
      ctx.strokeRect(s * 0.1, s * 0.2, s * 0.8, s * 0.6);

      ctx.restore();
    }
  },
  {
    id: 'dungeon_pillar',
    name: 'Carved Stone Pillar',
    category: 'battle_rooms',
    defaultScale: 0.9,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      const c = s / 2;
      const r = s * 0.4;

      // Base shadow
      ctx.beginPath();
      ctx.arc(c + s * 0.04, c + s * 0.04, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = s * 0.05;
      ctx.stroke();

      // Inner fluted ring
      ctx.beginPath();
      ctx.arc(c, c, r * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.stroke();

      // Center core
      ctx.beginPath();
      ctx.arc(c, c, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },

  // ---------------- BATTLEMAP: PROPS & FURNITURE ----------------
  {
    id: 'prop_table_tavern',
    name: 'Tavern Long Table',
    category: 'battle_props',
    defaultScale: 1.1,
    aspect: 1.8,
    render: (ctx, size) => {
      ctx.save();
      const w = size * 1.8;
      const h = size;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(w * 0.08, h * 0.18, w * 0.88, h * 0.72);

      // Wood top
      ctx.fillStyle = '#7c5335';
      ctx.fillRect(w * 0.05, h * 0.15, w * 0.9, h * 0.7);
      ctx.strokeStyle = '#382212';
      ctx.lineWidth = h * 0.05;
      ctx.strokeRect(w * 0.05, h * 0.15, w * 0.9, h * 0.7);

      // Wood plank lines
      ctx.strokeStyle = '#4e311b';
      ctx.lineWidth = h * 0.025;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.38);
      ctx.lineTo(w * 0.95, h * 0.38);
      ctx.moveTo(w * 0.05, h * 0.62);
      ctx.lineTo(w * 0.95, h * 0.62);
      ctx.stroke();

      // Tankards & Map on table
      ctx.fillStyle = '#fef3c7'; // map parchment
      ctx.fillRect(w * 0.35, h * 0.3, w * 0.3, h * 0.4);
      ctx.strokeRect(w * 0.35, h * 0.3, w * 0.3, h * 0.4);

      ctx.restore();
    }
  },
  {
    id: 'prop_chest_treasure',
    name: 'Gilded Treasure Chest',
    category: 'battle_props',
    defaultScale: 0.8,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(s * 0.15, s * 0.25, s * 0.75, s * 0.55);

      // Chest body
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(s * 0.12, s * 0.2, s * 0.76, s * 0.55);
      ctx.strokeStyle = '#27170a';
      ctx.lineWidth = s * 0.04;
      ctx.strokeRect(s * 0.12, s * 0.2, s * 0.76, s * 0.55);

      // Gold bands
      ctx.fillStyle = '#eab308';
      ctx.fillRect(s * 0.2, s * 0.2, s * 0.09, s * 0.55);
      ctx.fillRect(s * 0.71, s * 0.2, s * 0.09, s * 0.55);

      // Gold lock
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.48, s * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'prop_campfire',
    name: 'Roaring Campfire',
    category: 'battle_props',
    defaultScale: 0.9,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      const c = s / 2;

      // Outer stones
      const stoneCount = 8;
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = s * 0.03;
      for (let i = 0; i < stoneCount; i++) {
        const ang = (i / stoneCount) * Math.PI * 2;
        const sx = c + Math.cos(ang) * (s * 0.34);
        const sy = c + Math.sin(ang) * (s * 0.34);
        ctx.beginPath();
        ctx.arc(sx, sy, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Fire glow gradient
      const grad = ctx.createRadialGradient(c, c, s * 0.05, c, c, s * 0.4);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.3, '#f97316');
      grad.addColorStop(0.7, '#ef4444');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c, c, s * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Fire embers
      ctx.beginPath();
      ctx.arc(c, c, s * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  },
  {
    id: 'prop_barrel_crate',
    name: 'Ale Barrel & Crate Stack',
    category: 'battle_props',
    defaultScale: 0.9,
    aspect: 1.1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;

      // Wooden Crate
      ctx.fillStyle = '#855c39';
      ctx.fillRect(s * 0.1, s * 0.25, s * 0.45, s * 0.45);
      ctx.strokeStyle = '#3d2512';
      ctx.lineWidth = s * 0.035;
      ctx.strokeRect(s * 0.1, s * 0.25, s * 0.45, s * 0.45);
      // X brace
      ctx.beginPath();
      ctx.moveTo(s * 0.1, s * 0.25);
      ctx.lineTo(s * 0.55, s * 0.7);
      ctx.moveTo(s * 0.55, s * 0.25);
      ctx.lineTo(s * 0.1, s * 0.7);
      ctx.stroke();

      // Barrel (Round top-down)
      ctx.beginPath();
      ctx.arc(s * 0.72, s * 0.5, s * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#6d4827';
      ctx.fill();
      ctx.stroke();
      // Barrel metal hoop
      ctx.beginPath();
      ctx.arc(s * 0.72, s * 0.5, s * 0.17, 0, Math.PI * 2);
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      ctx.restore();
    }
  },

  // ---------------- BATTLEMAP: TOKENS & CREATURES ----------------
  {
    id: 'token_hero_warrior',
    name: 'Paladin / Warrior Token',
    category: 'battle_tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      const c = s / 2;
      const r = s * 0.42;

      // Token gold border
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = s * 0.07;
      ctx.stroke();

      // Shield & Sword crest
      ctx.beginPath();
      ctx.moveTo(c, s * 0.22);
      ctx.lineTo(s * 0.7, s * 0.32);
      ctx.lineTo(s * 0.65, s * 0.6);
      ctx.lineTo(c, s * 0.78);
      ctx.lineTo(s * 0.35, s * 0.6);
      ctx.lineTo(s * 0.3, s * 0.32);
      ctx.closePath();
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      // Cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c - s * 0.03, s * 0.35, s * 0.06, s * 0.32);
      ctx.fillRect(s * 0.38, s * 0.45, s * 0.24, s * 0.06);

      ctx.restore();
    }
  },
  {
    id: 'token_hero_mage',
    name: 'Arcane Wizard Token',
    category: 'battle_tokens',
    defaultScale: 1.0,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      const c = s / 2;
      const r = s * 0.42;

      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = '#2e1065';
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = s * 0.07;
      ctx.stroke();

      // Arcane star / pentagram
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAng = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const ox = c + Math.cos(outerAng) * (r * 0.6);
        const oy = c + Math.sin(outerAng) * (r * 0.6);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = s * 0.04;
      ctx.stroke();

      ctx.restore();
    }
  },
  {
    id: 'token_monster_dragon',
    name: 'Red Dragon Beast Token',
    category: 'battle_tokens',
    defaultScale: 1.3,
    aspect: 1,
    render: (ctx, size) => {
      ctx.save();
      const s = size;
      const c = s / 2;
      const r = s * 0.44;

      // Fiery menacing border
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = '#450a0a';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = s * 0.08;
      ctx.stroke();

      // Dragon Silhouette / Horns
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(c, s * 0.2); // snout
      ctx.lineTo(s * 0.65, s * 0.35);
      ctx.lineTo(s * 0.82, s * 0.15); // right horn
      ctx.lineTo(s * 0.68, s * 0.48);
      ctx.lineTo(s * 0.72, s * 0.78);
      ctx.lineTo(c, s * 0.68);
      ctx.lineTo(s * 0.28, s * 0.78);
      ctx.lineTo(s * 0.32, s * 0.48);
      ctx.lineTo(s * 0.18, s * 0.15); // left horn
      ctx.lineTo(s * 0.35, s * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = s * 0.03;
      ctx.stroke();

      // Slit Eyes
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(s * 0.42, s * 0.42, s * 0.03, s * 0.06, 0.2, 0, Math.PI * 2);
      ctx.ellipse(s * 0.58, s * 0.42, s * 0.03, s * 0.06, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
];

export function getStampById(id) {
  return STAMPS.find(s => s.id === id) || STAMPS[0];
}
