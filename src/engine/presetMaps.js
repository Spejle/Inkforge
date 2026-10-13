// Starter Preset Maps to demonstrate world cartography and battlemaps

export const PRESET_MAPS = [
  {
    id: 'shattered_archipelago',
    title: 'The Shattered Archipelago',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 60, opacity: 0.12, color: '#1e293b' },
    atmosphere: { vignette: 0.45, parchmentGrain: 0.35, sepia: 0.2, brightness: 1.0 },
    // Pre-computed land polygons
    landmasses: [
      {
        points: [
          [200, 300], [320, 220], [540, 240], [680, 180], [860, 210],
          [980, 320], [1050, 480], [1010, 640], [920, 750], [740, 820],
          [560, 800], [420, 720], [310, 780], [220, 680], [180, 500], [160, 380]
        ],
        biome: 'grassland'
      },
      {
        points: [
          [1180, 200], [1320, 150], [1520, 180], [1680, 280], [1720, 420],
          [1650, 580], [1480, 650], [1340, 620], [1240, 520], [1160, 360]
        ],
        biome: 'desert'
      },
      {
        points: [
          [780, 850], [920, 820], [1020, 890], [1120, 980], [980, 1040],
          [820, 1020], [720, 940]
        ],
        biome: 'parchment'
      }
    ],
    stamps: [
      // Main Continent Mountain Ridge
      { id: 's1', stampId: 'mountain_grand', x: 480, y: 380, scale: 1.3, rotation: 0, zIndex: 10 },
      { id: 's2', stampId: 'mountain_grand', x: 580, y: 410, scale: 1.4, rotation: 0, zIndex: 11 },
      { id: 's3', stampId: 'mountain_range', x: 720, y: 440, scale: 1.5, rotation: 0, zIndex: 12 },
      { id: 's4', stampId: 'mountain_grand', x: 840, y: 480, scale: 1.2, rotation: 0, zIndex: 13 },
      { id: 's5', stampId: 'hills_rolling', x: 420, y: 480, scale: 1.0, rotation: 0, zIndex: 14 },
      { id: 's6', stampId: 'hills_rolling', x: 920, y: 550, scale: 1.1, rotation: 0, zIndex: 15 },

      // Forests
      { id: 's7', stampId: 'tree_forest_cluster', x: 340, y: 580, scale: 1.2, rotation: 0, zIndex: 20 },
      { id: 's8', stampId: 'tree_oak', x: 280, y: 620, scale: 1.0, rotation: 0, zIndex: 21 },
      { id: 's9', stampId: 'tree_pine', x: 390, y: 640, scale: 0.9, rotation: 0, zIndex: 22 },
      { id: 's10', stampId: 'tree_forest_cluster', x: 620, y: 680, scale: 1.3, rotation: 0, zIndex: 23 },
      { id: 's11', stampId: 'tree_oak', x: 730, y: 700, scale: 1.1, rotation: 0, zIndex: 24 },

      // Castles and Towns
      { id: 's12', stampId: 'castle_citadel', x: 520, y: 580, scale: 1.4, rotation: 0, zIndex: 30 },
      { id: 's13', stampId: 'village_houses', x: 780, y: 640, scale: 1.1, rotation: 0, zIndex: 31 },
      { id: 's14', stampId: 'tower_wizard', x: 1360, y: 320, scale: 1.2, rotation: 0, zIndex: 32 },
      { id: 's15', stampId: 'village_houses', x: 1520, y: 450, scale: 1.0, rotation: 0, zIndex: 33 },

      // Ocean embellishments
      { id: 's16', stampId: 'compass_rose', x: 1720, y: 200, scale: 1.5, rotation: 0, zIndex: 40 },
      { id: 's17', stampId: 'ship_caravel', x: 1100, y: 820, scale: 1.2, rotation: 0.1, zIndex: 41 },
      { id: 's18', stampId: 'sea_serpent', x: 260, y: 920, scale: 1.2, rotation: -0.1, zIndex: 42 }
    ],
    paths: [
      // River flowing from mountains to sea
      {
        id: 'p1',
        type: 'river',
        width: 14,
        color: '#2b5c8f',
        points: [
          [520, 430], [500, 510], [450, 570], [380, 680], [280, 720], [170, 750]
        ]
      },
      // King's Highway
      {
        id: 'p2',
        type: 'road',
        width: 6,
        color: '#78350f',
        dashed: true,
        points: [
          [530, 610], [610, 630], [700, 640], [770, 645]
        ]
      }
    ],
    texts: [
      { id: 't1', text: 'REALM OF VALORIA', x: 540, y: 280, size: 36, color: '#271b12', stroke: '#fef3c7', font: 'Cinzel', curved: false },
      { id: 't2', text: 'Ironspire Peaks', x: 650, y: 370, size: 22, color: '#451a03', stroke: '#ffffff', font: 'MedievalSharp', curved: false },
      { id: 't3', text: 'Sunken Barrens', x: 1440, y: 240, size: 28, color: '#78350f', stroke: '#fef08a', font: 'Cinzel', curved: false },
      { id: 't4', text: 'Sea of Sorrows', x: 1120, y: 950, size: 28, color: '#1e3a8a', stroke: '#ffffff', font: 'Cinzel', curved: false }
    ]
  },
  {
    id: 'forgotten_crypt',
    title: 'The Crypt of the Forgotten King',
    type: 'battle',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'square', size: 64, opacity: 0.25, color: '#f8fafc' },
    atmosphere: { vignette: 0.65, parchmentGrain: 0.15, sepia: 0.1, brightness: 0.85 },
    landmasses: [
      // Dungeon stone foundation
      {
        points: [
          [320, 160], [1600, 160], [1600, 920], [320, 920]
        ],
        biome: 'dungeon_flagstone'
      }
    ],
    stamps: [
      // Dungeon pillars in great hall
      { id: 'c1', stampId: 'dungeon_pillar', x: 640, y: 320, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c2', stampId: 'dungeon_pillar', x: 960, y: 320, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c3', stampId: 'dungeon_pillar', x: 1280, y: 320, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c4', stampId: 'dungeon_pillar', x: 640, y: 768, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c5', stampId: 'dungeon_pillar', x: 960, y: 768, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c6', stampId: 'dungeon_pillar', x: 1280, y: 768, scale: 1.0, rotation: 0, zIndex: 10 },

      // Heavy doors at entry and chambers
      { id: 'c7', stampId: 'dungeon_door_wooden', x: 320, y: 544, scale: 1.1, rotation: 0, zIndex: 15 },
      { id: 'c8', stampId: 'dungeon_door_wooden', x: 1600, y: 544, scale: 1.1, rotation: 0, zIndex: 15 },

      // Furnishings
      { id: 'c9', stampId: 'prop_table_tavern', x: 800, y: 544, scale: 1.2, rotation: 0, zIndex: 20 },
      { id: 'c10', stampId: 'prop_chest_treasure', x: 1480, y: 240, scale: 1.1, rotation: 0.2, zIndex: 21 },
      { id: 'c11', stampId: 'prop_campfire', x: 1120, y: 544, scale: 1.2, rotation: 0, zIndex: 22 },
      { id: 'c12', stampId: 'prop_barrel_crate', x: 400, y: 240, scale: 1.1, rotation: 0, zIndex: 23 },

      // Tokens
      { id: 'c13', stampId: 'token_hero_warrior', x: 500, y: 544, scale: 1.0, rotation: 0, zIndex: 30 },
      { id: 'c14', stampId: 'token_hero_mage', x: 440, y: 600, scale: 1.0, rotation: 0, zIndex: 30 },
      { id: 'c15', stampId: 'token_monster_dragon', x: 1400, y: 544, scale: 1.6, rotation: -0.2, zIndex: 35 }
    ],
    paths: [],
    texts: [
      { id: 'bt1', text: 'HALL OF THE CRYPT KING', x: 960, y: 220, size: 30, color: '#e2e8f0', stroke: '#0f172a', font: 'Cinzel', curved: false },
      { id: 'bt2', text: 'Outer Gates', x: 340, y: 620, size: 18, color: '#94a3b8', stroke: '#0f172a', font: 'MedievalSharp', curved: false },
      { id: 'bt3', text: 'Lair of the Scaled Terror', x: 1400, y: 440, size: 20, color: '#ef4444', stroke: '#0f172a', font: 'MedievalSharp', curved: false }
    ]
  },
  {
    id: 'blank_canvas',
    title: 'New Blank Canvas',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 64, opacity: 0.15, color: '#1e293b' },
    atmosphere: { vignette: 0.35, parchmentGrain: 0.3, sepia: 0.15, brightness: 1.0 },
    landmasses: [],
    stamps: [],
    paths: [],
    texts: []
  }
];
