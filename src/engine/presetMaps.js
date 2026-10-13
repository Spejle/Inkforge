// Starter Preset Maps to demonstrate world cartography and battlemaps

export const PRESET_MAPS = [
  {
    id: 'shattered_archipelago',
    title: 'The Shattered Archipelago',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 60, opacity: 0.12, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.45, parchmentGrain: 0.35, sepia: 0.2, brightness: 1.0 },
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
      { id: 's1', stampId: 'mountain_grand', x: 480, y: 380, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 's2', stampId: 'mountain_grand', x: 580, y: 410, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 's3', stampId: 'mountain_range', x: 720, y: 440, scale: 1.5, rotation: 0, zIndex: 0 },
      { id: 's4', stampId: 'mountain_grand', x: 840, y: 480, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 's5', stampId: 'hills_rolling', x: 420, y: 480, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 's6', stampId: 'hills_rolling', x: 920, y: 550, scale: 1.1, rotation: 0, zIndex: 0 },

      // Forests
      { id: 's7', stampId: 'tree_forest_cluster', x: 340, y: 580, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 's8', stampId: 'tree_oak', x: 280, y: 620, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 's9', stampId: 'tree_pine', x: 390, y: 640, scale: 0.9, rotation: 0, zIndex: 0 },
      { id: 's10', stampId: 'tree_forest_cluster', x: 620, y: 680, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 's11', stampId: 'tree_oak', x: 730, y: 700, scale: 1.1, rotation: 0, zIndex: 0 },

      // Castles and Towns
      { id: 's12', stampId: 'castle_citadel', x: 520, y: 580, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 's13', stampId: 'village_houses', x: 780, y: 640, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 's14', stampId: 'tower_wizard', x: 1360, y: 320, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 's15', stampId: 'village_houses', x: 1520, y: 450, scale: 1.0, rotation: 0, zIndex: 0 },

      // Ocean embellishments
      { id: 's16', stampId: 'compass_rose', x: 1720, y: 200, scale: 1.5, rotation: 0, zIndex: 10 },
      { id: 's17', stampId: 'ship_caravel', x: 1100, y: 820, scale: 1.2, rotation: 0.1, zIndex: 0 },
      { id: 's18', stampId: 'sea_serpent', x: 260, y: 920, scale: 1.2, rotation: -0.1, zIndex: 0 }
    ],
    paths: [
      {
        id: 'p1',
        type: 'river',
        width: 14,
        color: '#2b5c8f',
        points: [
          [520, 430], [500, 510], [450, 570], [380, 680], [280, 720], [170, 750]
        ]
      },
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
      { id: 't1', text: 'REALM OF VALORIA', x: 540, y: 280, size: 36, color: '#271b12', stroke: '#fef3c7', font: 'Cinzel', curvature: 0.1 },
      { id: 't2', text: 'Ironspire Peaks', x: 650, y: 370, size: 22, color: '#451a03', stroke: '#ffffff', font: 'MedievalSharp', curvature: 0 },
      { id: 't3', text: 'Sunken Barrens', x: 1440, y: 240, size: 28, color: '#78350f', stroke: '#fef08a', font: 'Cinzel', curvature: -0.08 },
      { id: 't4', text: 'Sea of Sorrows', x: 1120, y: 950, size: 28, color: '#1e3a8a', stroke: '#ffffff', font: 'Cinzel', curvature: 0.05 }
    ]
  },
  {
    id: 'sunken_citadel',
    title: 'The Sunken Citadel & Volcanic Caldera',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_pointy', size: 64, opacity: 0.15, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.5, parchmentGrain: 0.4, sepia: 0.25, brightness: 0.95 },
    landmasses: [
      {
        points: [
          [300, 200], [550, 160], [850, 190], [1150, 140], [1450, 220],
          [1650, 360], [1720, 600], [1580, 800], [1300, 880], [980, 850],
          [620, 890], [380, 820], [240, 650], [220, 420]
        ],
        biome: 'swamp_mire'
      },
      {
        points: [
          [650, 320], [880, 280], [1050, 360], [1100, 520], [980, 680],
          [780, 720], [620, 600], [590, 440]
        ],
        biome: 'lava_molten'
      }
    ],
    stamps: [
      { id: 'sc1', stampId: 'mountain_volcano', x: 860, y: 460, scale: 1.6, rotation: 0, zIndex: 0 },
      { id: 'sc2', stampId: 'mountain_mesa', x: 1320, y: 400, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'sc3', stampId: 'ruins_stonehenge', x: 440, y: 420, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'sc4', stampId: 'tree_dead', x: 480, y: 640, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'sc5', stampId: 'tree_dead', x: 560, y: 720, scale: 1.0, rotation: 0.1, zIndex: 0 },
      { id: 'sc6', stampId: 'fortress_keep', x: 1420, y: 560, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'sc7', stampId: 'compass_rose', x: 1720, y: 180, scale: 1.4, rotation: 0, zIndex: 10 }
    ],
    paths: [
      {
        id: 'scp1',
        type: 'river',
        width: 16,
        color: '#15803d',
        points: [
          [860, 580], [750, 680], [650, 780], [520, 840], [350, 880]
        ]
      }
    ],
    texts: [
      { id: 'sct1', text: 'CALDERA OF THE FIRE GOD', x: 860, y: 320, size: 34, color: '#fef08a', stroke: '#7f1d1d', font: 'Cinzel', curvature: 0.15 },
      { id: 'sct2', text: 'Ashen Marshes', x: 480, y: 550, size: 24, color: '#e2e8f0', stroke: '#1c1917', font: 'MedievalSharp', curvature: 0 },
      { id: 'sct3', text: 'Blackstone Bastion', x: 1420, y: 480, size: 24, color: '#f8fafc', stroke: '#0f172a', font: 'Cinzel', curvature: -0.05 }
    ]
  },
  {
    id: 'forgotten_crypt',
    title: 'The Crypt of the Forgotten King',
    type: 'battle',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'square', size: 64, opacity: 0.25, color: '#f8fafc', offsetX: 0, offsetY: 0, snap: true },
    atmosphere: { vignette: 0.65, parchmentGrain: 0.15, sepia: 0.1, brightness: 0.85 },
    landmasses: [
      {
        points: [
          [320, 160], [1600, 160], [1600, 920], [320, 920]
        ],
        biome: 'dungeon_flagstone'
      }
    ],
    stamps: [
      { id: 'c1', stampId: 'dungeon_pillar', x: 640, y: 320, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'c2', stampId: 'dungeon_pillar', x: 960, y: 320, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'c3', stampId: 'dungeon_pillar', x: 1280, y: 320, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'c4', stampId: 'dungeon_pillar', x: 640, y: 768, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'c5', stampId: 'dungeon_pillar', x: 960, y: 768, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'c6', stampId: 'dungeon_pillar', x: 1280, y: 768, scale: 1.0, rotation: 0, zIndex: 0 },

      { id: 'c7', stampId: 'dungeon_door_wooden', x: 320, y: 544, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'c8', stampId: 'dungeon_door_wooden', x: 1600, y: 544, scale: 1.1, rotation: 0, zIndex: 0 },

      { id: 'c9', stampId: 'prop_table_tavern', x: 800, y: 544, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'c10', stampId: 'prop_chest_treasure', x: 1480, y: 240, scale: 1.1, rotation: 0.2, zIndex: 0 },
      { id: 'c11', stampId: 'prop_campfire', x: 1120, y: 544, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'c12', stampId: 'prop_barrel_crate', x: 400, y: 240, scale: 1.1, rotation: 0, zIndex: 0 },

      { id: 'c13', stampId: 'token_hero_warrior', x: 500, y: 544, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c14', stampId: 'token_hero_mage', x: 440, y: 600, scale: 1.0, rotation: 0, zIndex: 10 },
      { id: 'c15', stampId: 'token_monster_dragon', x: 1400, y: 544, scale: 1.6, rotation: -0.2, zIndex: 10 }
    ],
    paths: [],
    texts: [
      { id: 'bt1', text: 'HALL OF THE CRYPT KING', x: 960, y: 220, size: 30, color: '#e2e8f0', stroke: '#0f172a', font: 'Cinzel', curvature: 0 },
      { id: 'bt2', text: 'Outer Gates', x: 340, y: 620, size: 18, color: '#94a3b8', stroke: '#0f172a', font: 'MedievalSharp', curvature: 0 },
      { id: 'bt3', text: 'Lair of the Scaled Terror', x: 1400, y: 440, size: 20, color: '#ef4444', stroke: '#0f172a', font: 'MedievalSharp', curvature: 0 }
    ]
  },
  {
    id: 'blank_canvas',
    title: 'New Blank Canvas',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 64, opacity: 0.15, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.35, parchmentGrain: 0.3, sepia: 0.15, brightness: 1.0 },
    landmasses: [],
    stamps: [],
    paths: [],
    texts: []
  }
];
