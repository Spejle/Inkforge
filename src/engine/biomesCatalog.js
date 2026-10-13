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
 * Creates or retrieves a seamless procedural CanvasPattern for textured biome rendering
 */
export function getBiomePattern(ctx, biomeId) {
  if (patternCache.has(biomeId)) {
    return patternCache.get(biomeId);
  }

  const biome = getBiomeById(biomeId);
  const size = 64;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const octx = offscreen.getContext('2d');

  // Base fill
  octx.fillStyle = biome.color;
  octx.fillRect(0, 0, size, size);

  if (biome.pattern === 'flagstone') {
    // Mortar lines and stone pavers
    octx.strokeStyle = biome.secondaryColor;
    octx.lineWidth = 2;
    octx.strokeRect(2, 2, size / 2 - 4, size / 2 - 4);
    octx.strokeRect(size / 2 + 2, 2, size / 2 - 4, size / 2 - 4);
    octx.strokeRect(2, size / 2 + 2, size / 2 - 4, size / 2 - 4);
    octx.strokeRect(size / 2 + 2, size / 2 + 2, size / 2 - 4, size / 2 - 4);
  } else if (biome.pattern === 'planks') {
    // Wood plank horizontal lines & nail dots
    octx.strokeStyle = biome.secondaryColor;
    octx.lineWidth = 2;
    for (let y = 16; y < size; y += 16) {
      octx.beginPath();
      octx.moveTo(0, y);
      octx.lineTo(size, y);
      octx.stroke();
    }
  } else if (biome.pattern === 'cobble') {
    // Rounded cobblestones
    octx.fillStyle = biome.secondaryColor;
    for (let x = 8; x < size; x += 16) {
      for (let y = 8; y < size; y += 16) {
        octx.beginPath();
        octx.arc(x, y, 5, 0, Math.PI * 2);
        octx.fill();
      }
    }
  } else {
    // Organic stipple noise flecks
    octx.fillStyle = biome.secondaryColor;
    for (let i = 0; i < 28; i++) {
      const rx = (i * 17 + 5) % size;
      const ry = (i * 29 + 11) % size;
      octx.fillRect(rx, ry, 2, 2);
    }
  }

  const pattern = ctx.createPattern(offscreen, 'repeat');
  if (pattern) {
    patternCache.set(biomeId, pattern);
  }
  return pattern || biome.color;
}
