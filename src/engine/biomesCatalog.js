// Biome and Texture Palettes for Map Painting

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
    pattern: 'grid',
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
    id: 'dirt_cave',
    name: 'Cave Soil / Dirt',
    category: 'battle',
    color: '#574130',
    secondaryColor: '#3d2c20',
    roughness: 0.7,
    preview: '#574130',
    description: 'Cavern floors, muddy roads, and earthen burrows'
  },
  {
    id: 'lava_cracks',
    name: 'Lava Magma',
    category: 'battle',
    color: '#b91c1c',
    secondaryColor: '#f97316',
    roughness: 0.8,
    preview: '#b91c1c',
    description: 'Infernal fire caverns and molten hazards'
  }
];

export function getBiomeById(id) {
  return BIOMES.find(b => b.id === id) || BIOMES[0];
}
