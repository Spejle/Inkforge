// Biome and Texture Palettes for Map Painting with Procedural Patterns

export const BIOMES = [
  {
    id: 'grassland',
    name: 'Verdant Meadow',
    category: 'world',
    color: '#658d4a',
    secondaryColor: '#53753b',
    roughness: 0.4,
    preview: '#658d4a',
    description: 'Lush rolling hills and fantasy forests'
  },
  {
    id: 'parchment',
    name: 'Antique Parchment',
    category: 'world',
    color: '#dfd2b5',
    secondaryColor: '#c7b795',
    roughness: 0.2,
    preview: '#dfd2b5',
    description: 'Classic Tolkienesque hand-drawn map parchment'
  },
  {
    id: 'desert',
    name: 'Sunbaked Sands',
    category: 'world',
    color: '#dfb76c',
    secondaryColor: '#c99e52',
    roughness: 0.3,
    preview: '#dfb76c',
    description: 'Vast dunes and arid wastelands'
  },
  {
    id: 'snow',
    name: 'Glacial Tundra',
    category: 'world',
    color: '#e2e8f0',
    secondaryColor: '#cbd5e1',
    roughness: 0.2,
    preview: '#e2e8f0',
    description: 'Frozen peaks and icy wastes'
  },
  {
    id: 'badlands',
    name: 'Volcanic Moor',
    category: 'world',
    color: '#473c38',
    secondaryColor: '#2b2422',
    roughness: 0.6,
    preview: '#473c38',
    description: 'Dark obsidian, crags, and grim wilderness'
  },
  {
    id: 'swamp_mire',
    name: 'Murky Mire / Swamp',
    category: 'world',
    color: '#3d4a36',
    secondaryColor: '#283324',
    roughness: 0.5,
    preview: '#3d4a36',
    description: 'Stagnant bog, mossy peat, and wetland reeds'
  },
  {
    id: 'lava_molten',
    name: 'Molten Magma Fields',
    category: 'world',
    color: '#b91c1c',
    secondaryColor: '#7f1d1d',
    roughness: 0.7,
    preview: '#b91c1c',
    description: 'Lava fissures and scorched basalt'
  },
  {
    id: 'shallows',
    name: 'Coastal Shallows',
    category: 'world',
    color: '#4fa3a5',
    secondaryColor: '#368285',
    roughness: 0.15,
    preview: '#4fa3a5',
    description: 'Turquoise coastal shelf and lagoons'
  },
  {
    id: 'deep_ocean',
    name: 'Abyssal Deep',
    category: 'world',
    color: '#1e3a5f',
    secondaryColor: '#122540',
    roughness: 0.1,
    preview: '#1e3a5f',
    description: 'Dark depths of the endless ocean'
  },
  // Battlemap Floors
  {
    id: 'dungeon_flagstone',
    name: 'Carved Flagstone',
    category: 'battle',
    color: '#4b5563',
    secondaryColor: '#374151',
    roughness: 0.5,
    pattern: 'flagstone',
    preview: '#4b5563',
    description: 'Ancient dungeon masonry and fortress floors'
  },
  {
    id: 'wooden_planks',
    name: 'Tavern Planks',
    category: 'battle',
    color: '#78502c',
    secondaryColor: '#5c391b',
    roughness: 0.4,
    pattern: 'planks',
    preview: '#78502c',
    description: 'Wooden floors for taverns, ships, and cabins'
  },
  {
    id: 'cobblestone_town',
    name: 'Town Cobblestone',
    category: 'battle',
    color: '#64748b',
    secondaryColor: '#475569',
    roughness: 0.45,
    pattern: 'cobble',
    preview: '#64748b',
    description: 'Paved market squares and dungeon alleys'
  },
  {
    id: 'dirt_cave',
    name: 'Cave Soil / Dirt',
    category: 'battle',
    color: '#5c4033',
    secondaryColor: '#422817',
    roughness: 0.6,
    preview: '#5c4033',
    description: 'Damp cavern floor, mud, and packed earth'
  }
];

export function getBiomeById(id) {
  return BIOMES.find((b) => b.id === id) || BIOMES[0];
}

// In-memory pattern cache
const patternCache = new Map();

/**
 * Creates or retrieves a rich, seamless procedural CanvasPattern for textured biome rendering
 */
export function getBiomePattern(ctx, biomeId) {
  if (patternCache.has(biomeId)) {
    return patternCache.get(biomeId);
  }

  const biome = getBiomeById(biomeId);
  const size = 128; // Higher resolution texture tile
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const octx = offscreen.getContext('2d');

  // Base fill
  octx.fillStyle = biome.color;
  octx.fillRect(0, 0, size, size);

  if (biome.pattern === 'flagstone') {
    // Ancient beveled flagstone masonry with cracked stone textures & mortar
    octx.fillStyle = biome.secondaryColor;
    octx.fillRect(0, 0, size, size);

    const pavers = [
      { x: 4, y: 4, w: 56, h: 36 },
      { x: 66, y: 4, w: 58, h: 56 },
      { x: 4, y: 46, w: 56, h: 78 },
      { x: 66, y: 66, w: 58, h: 58 }
    ];

    for (const p of pavers) {
      // Paver body
      octx.fillStyle = biome.color;
      octx.fillRect(p.x, p.y, p.w, p.h);
      // Top/Left bevel highlight
      octx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      octx.lineWidth = 2;
      octx.beginPath();
      octx.moveTo(p.x, p.y + p.h);
      octx.lineTo(p.x, p.y);
      octx.lineTo(p.x + p.w, p.y);
      octx.stroke();
      // Bottom/Right bevel shadow
      octx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      octx.beginPath();
      octx.moveTo(p.x + p.w, p.y);
      octx.lineTo(p.x + p.w, p.y + p.h);
      octx.lineTo(p.x, p.y + p.h);
      octx.stroke();
      // Stone grain flecks
      octx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let i = 0; i < 16; i++) {
        const sx = p.x + (i * 13) % p.w;
        const sy = p.y + (i * 19) % p.h;
        octx.fillRect(sx, sy, 3, 2);
      }
    }
  } else if (biome.pattern === 'planks') {
    // Rich wooden floorboards with grain striations and nail pegs
    const plankH = 32;
    for (let y = 0; y < size; y += plankH) {
      octx.fillStyle = (y / plankH) % 2 === 0 ? biome.color : biome.secondaryColor;
      octx.fillRect(0, y, size, plankH);

      // Plank seam shadow
      octx.fillStyle = 'rgba(20, 10, 5, 0.4)';
      octx.fillRect(0, y + plankH - 2, size, 2);
      // Highlight line
      octx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      octx.fillRect(0, y, size, 1);

      // Wood grain lines
      octx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      octx.lineWidth = 1;
      for (let g = 8; g < plankH; g += 8) {
        octx.beginPath();
        octx.moveTo(0, y + g);
        octx.bezierCurveTo(size * 0.3, y + g - 2, size * 0.7, y + g + 2, size, y + g);
        octx.stroke();
      }

      // Nail rivets
      octx.fillStyle = '#1e140d';
      octx.beginPath();
      octx.arc(8, y + plankH / 2, 1.8, 0, Math.PI * 2);
      octx.arc(size - 8, y + plankH / 2, 1.8, 0, Math.PI * 2);
      octx.fill();
    }
  } else if (biome.pattern === 'cobble') {
    // Interlocking cobblestones
    octx.fillStyle = biome.secondaryColor;
    octx.fillRect(0, 0, size, size);

    for (let row = 0; row < 6; row++) {
      const y = row * 22;
      const xOffset = (row % 2) * 16;
      for (let col = 0; col < 6; col++) {
        const x = col * 32 + xOffset;
        octx.fillStyle = biome.color;
        octx.beginPath();
        octx.roundRect(x + 2, y + 2, 28, 18, 6);
        octx.fill();
        octx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        octx.stroke();
      }
    }
  } else if (biome.id === 'desert') {
    // Desert wind-blown sand dunes & warm ripple bands
    octx.strokeStyle = biome.secondaryColor;
    octx.lineWidth = 2;
    for (let y = 10; y < size; y += 20) {
      octx.beginPath();
      octx.moveTo(0, y);
      octx.quadraticCurveTo(size * 0.35, y - 5, size * 0.7, y + 3);
      octx.quadraticCurveTo(size * 0.85, y + 6, size, y);
      octx.stroke();
    }
    // Sand grit
    octx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    for (let i = 0; i < 40; i++) {
      octx.fillRect((i * 23) % size, (i * 37) % size, 2, 2);
    }
  } else if (biome.id === 'lava_molten') {
    // Basalt rock with incandescent magma fissures
    octx.fillStyle = '#221919';
    octx.fillRect(0, 0, size, size);

    // Glowing fissures
    octx.strokeStyle = '#ef4444';
    octx.lineWidth = 5;
    octx.beginPath();
    octx.moveTo(0, 20);
    octx.lineTo(40, 50);
    octx.lineTo(80, 45);
    octx.lineTo(size, 80);
    octx.stroke();

    octx.strokeStyle = '#f59e0b';
    octx.lineWidth = 2;
    octx.stroke();

    octx.strokeStyle = '#fef08a';
    octx.lineWidth = 1;
    octx.stroke();
  } else if (biome.id === 'snow') {
    // Glacial ice sparkles & subtle drift shadows
    octx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    octx.lineWidth = 2;
    for (let y = 20; y < size; y += 32) {
      octx.beginPath();
      octx.moveTo(0, y);
      octx.bezierCurveTo(size * 0.4, y - 4, size * 0.8, y + 4, size, y);
      octx.stroke();
    }
    // Crystalline frost flecks
    octx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 30; i++) {
      octx.fillRect((i * 19) % size, (i * 31) % size, 2, 2);
    }
  } else {
    // High-frequency organic terrain dapples (grassland, moor, swamp, parchment)
    octx.fillStyle = biome.secondaryColor;
    for (let i = 0; i < 60; i++) {
      const rx = (i * 29 + 7) % size;
      const ry = (i * 47 + 13) % size;
      const rw = 2 + (i % 3);
      const rh = 2 + (i % 2);
      octx.fillRect(rx, ry, rw, rh);
    }
    // Subtle lighter highlights
    octx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 35; i++) {
      const hx = (i * 37 + 19) % size;
      const hy = (i * 53 + 23) % size;
      octx.fillRect(hx, hy, 2, 2);
    }
  }

  const pattern = ctx.createPattern(offscreen, 'repeat');
  if (pattern) {
    patternCache.set(biomeId, pattern);
  }
  return pattern || biome.color;
}
