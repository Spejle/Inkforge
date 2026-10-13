// Starter Preset Maps to demonstrate world cartography and battlemaps
// Crafted following Eduard Imhof's cartographic principles, hydrological realism, and tectonic mountain spines.

export const PRESET_MAPS = [
  {
    id: 'shattered_archipelago',
    title: 'The Realm of Valoria & The Shattered Reach',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 64, opacity: 0.12, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.42, parchmentGrain: 0.32, sepia: 0.18, brightness: 1.02 },
    landmasses: [
      // 1. Great Continental Mainland of Valoria (with bays, fjords, and peninsulas)
      {
        id: 'valoria_mainland',
        biome: 'grassland',
        points: [
          [160, 240], [280, 180], [440, 190], [580, 140], [760, 160], [920, 130],
          [1060, 190], [1180, 260], [1280, 360], [1340, 480], [1300, 600], [1220, 680],
          [1140, 660], [1060, 720], [980, 780], [860, 840], [740, 860], [620, 820],
          [520, 840], [420, 810], [340, 750], [280, 780], [200, 710], [160, 580],
          [190, 460], [140, 360]
        ]
      },
      // 2. The Sunken Isle of Eldoria (Protective Crescent Island)
      {
        id: 'eldoria_isle',
        biome: 'grassland',
        points: [
          [1380, 220], [1480, 180], [1620, 210], [1720, 310], [1740, 460],
          [1680, 580], [1560, 640], [1460, 610], [1400, 500], [1430, 360]
        ]
      },
      // 3. The Dragon's Teeth Archipelago (Southeastern Barrier Islets)
      {
        id: 'barrier_isle_1',
        biome: 'desert',
        points: [
          [1520, 740], [1620, 710], [1700, 760], [1680, 840], [1580, 860], [1500, 810]
        ]
      },
      {
        id: 'barrier_isle_2',
        biome: 'desert',
        points: [
          [1360, 880], [1440, 850], [1500, 900], [1460, 960], [1380, 970], [1330, 930]
        ]
      },
      {
        id: 'barrier_isle_3',
        biome: 'parchment',
        points: [
          [1160, 900], [1240, 880], [1290, 930], [1260, 990], [1180, 1010], [1130, 960]
        ]
      },
      // 4. Southern Misty Atoll
      {
        id: 'southern_atoll',
        biome: 'parchment',
        points: [
          [360, 890], [460, 870], [540, 910], [510, 980], [420, 1010], [330, 960]
        ]
      }
    ],
    stamps: [
      // === TECTONIC MOUNTAIN SPINE (Sorted strictly North-to-South for isometric depth) ===
      { id: 'm1', stampId: 'mountain_grand', x: 520, y: 260, scale: 1.45, rotation: 0, zIndex: 0 },
      { id: 'm2', stampId: 'mountain_grand', x: 660, y: 280, scale: 1.55, rotation: 0, zIndex: 0 },
      { id: 'm3', stampId: 'mountain_grand', x: 800, y: 310, scale: 1.6, rotation: 0, zIndex: 0 },
      { id: 'm4', stampId: 'mountain_range', x: 420, y: 320, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'm5', stampId: 'mountain_grand', x: 940, y: 340, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 'm6', stampId: 'mountain_range', x: 590, y: 350, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'm7', stampId: 'mountain_range', x: 740, y: 380, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 'm8', stampId: 'mountain_range', x: 880, y: 390, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'm9', stampId: 'mountain_range', x: 1040, y: 400, scale: 1.2, rotation: 0, zIndex: 0 },
      // Foothills & Rolling Slopes
      { id: 'h1', stampId: 'hills_rolling', x: 340, y: 380, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'h2', stampId: 'hills_rolling', x: 480, y: 410, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'h3', stampId: 'hills_rolling', x: 670, y: 440, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'h4', stampId: 'hills_rolling', x: 820, y: 450, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'h5', stampId: 'hills_rolling', x: 970, y: 460, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'h6', stampId: 'hills_rolling', x: 1120, y: 470, scale: 0.95, rotation: 0, zIndex: 0 },

      // === WHISPERING WOODS & DEEP CANOPY FORESTS ===
      { id: 'f1', stampId: 'tree_forest_cluster', x: 280, y: 460, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'f2', stampId: 'tree_pine', x: 220, y: 520, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'f3', stampId: 'tree_oak', x: 330, y: 520, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'f4', stampId: 'tree_forest_cluster', x: 420, y: 560, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 'f5', stampId: 'tree_forest_cluster', x: 550, y: 590, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'f6', stampId: 'tree_oak', x: 630, y: 640, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'f7', stampId: 'tree_autumn', x: 740, y: 620, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'f8', stampId: 'tree_forest_cluster', x: 860, y: 650, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'f9', stampId: 'tree_oak', x: 970, y: 670, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'f10', stampId: 'tree_forest_cluster', x: 1080, y: 600, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'f11', stampId: 'tree_pine', x: 1180, y: 560, scale: 1.05, rotation: 0, zIndex: 0 },

      // === CIVILIZATION, FORTS & SETTLEMENTS ===
      // High King's Citadel guarding Kingsport Bay
      { id: 'c1', stampId: 'castle_citadel', x: 480, y: 680, scale: 1.5, rotation: 0, zIndex: 0 },
      // Kingsport Trading Village & Harbor Docks
      { id: 'v1', stampId: 'village_houses', x: 640, y: 730, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'w1', stampId: 'windmill_stone', x: 730, y: 750, scale: 1.0, rotation: 0, zIndex: 0 },
      // Mountain Watchtower guarding Ironspire Pass
      { id: 't1', stampId: 'tower_wizard', x: 780, y: 340, scale: 1.3, rotation: 0, zIndex: 0 },
      // Ancient Megalith Stone Circle in the enchanted glade
      { id: 'r1', stampId: 'ruins_stonehenge', x: 320, y: 620, scale: 1.25, rotation: 0, zIndex: 0 },
      // Eastern Desert Oasis & Citadel
      { id: 'c2', stampId: 'fortress_keep', x: 1540, y: 380, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'v2', stampId: 'village_houses', x: 1640, y: 480, scale: 1.1, rotation: 0, zIndex: 0 },

      // === OCEAN NAUTICAL EMBELLISHMENTS ===
      // Ornate Golden Compass Rose
      { id: 'comp1', stampId: 'compass_rose', x: 1720, y: 190, scale: 1.6, rotation: 0, zIndex: 10 },
      // Imperial Caravels & Galleons
      { id: 'sh1', stampId: 'ship_caravel', x: 880, y: 880, scale: 1.25, rotation: 0.12, zIndex: 0 },
      { id: 'sh2', stampId: 'ship_caravel', x: 1320, y: 750, scale: 1.1, rotation: -0.15, zIndex: 0 },
      // Sea Monsters & Deep Leviathans
      { id: 'serp1', stampId: 'sea_serpent', x: 240, y: 860, scale: 1.3, rotation: -0.1, zIndex: 0 },
      { id: 'dr1', stampId: 'dragon_wyrm', x: 1020, y: 220, scale: 1.4, rotation: 0.15, zIndex: 10 }
    ],
    paths: [
      // The Great Silverflow River (Hydrologically correct: High Peak runoff -> Meanders -> Bay Delta)
      {
        id: 'r_silverflow',
        type: 'river',
        width: 14,
        color: '#2b5c8f',
        points: [
          [780, 290], [740, 350], [670, 420], [590, 480], [530, 540],
          [580, 610], [620, 680], [590, 760], [540, 830]
        ]
      },
      // Eastern Tributary merging into the Silverflow
      {
        id: 'r_tributary',
        type: 'river',
        width: 9,
        color: '#2b5c8f',
        points: [
          [880, 420], [800, 500], [710, 560], [620, 610]
        ]
      },
      // King's Trade Highway linking Kingsport to Ironspire Pass
      {
        id: 'p_trade_road',
        type: 'road',
        width: 6,
        color: '#78350f',
        dashed: true,
        points: [
          [500, 710], [580, 720], [660, 710], [710, 670], [750, 580],
          [770, 470], [780, 370]
        ]
      }
    ],
    texts: [
      { id: 't1', text: 'THE REALM OF VALORIA', x: 620, y: 200, size: 40, color: '#271b12', stroke: '#fef3c7', font: 'Cinzel', curvature: 0.12 },
      { id: 't2', text: 'Ironspire Mountain Ridge', x: 740, y: 260, size: 24, color: '#3d2b1f', stroke: '#ffffff', font: 'MedievalSharp', curvature: 0.04 },
      { id: 't3', text: 'The Whispering Woods', x: 380, y: 520, size: 22, color: '#14532d', stroke: '#dcfce7', font: 'MedievalSharp', curvature: -0.06 },
      { id: 't4', text: 'Kingsport Bay & Sound', x: 620, y: 880, size: 26, color: '#1e3a8a', stroke: '#e0f2fe', font: 'Cinzel', curvature: 0.08 },
      { id: 't5', text: 'Sunken Isle of Eldoria', x: 1560, y: 270, size: 28, color: '#78350f', stroke: '#fef08a', font: 'Cinzel', curvature: -0.08 },
      { id: 't6', text: 'Sea of Sorrows', x: 1140, y: 950, size: 30, color: '#1e3a8a', stroke: '#ffffff', font: 'Cinzel', curvature: 0.05 }
    ]
  },
  {
    id: 'sunken_citadel',
    title: 'The Sunken Citadel & Volcanic Caldera',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_pointy', size: 64, opacity: 0.15, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.52, parchmentGrain: 0.4, sepia: 0.25, brightness: 0.95 },
    landmasses: [
      {
        id: 'caldera_main',
        biome: 'swamp_mire',
        points: [
          [280, 220], [540, 160], [840, 180], [1160, 140], [1460, 220],
          [1680, 360], [1740, 600], [1600, 820], [1320, 900], [980, 870],
          [620, 910], [360, 840], [220, 660], [200, 420]
        ]
      },
      {
        id: 'caldera_basin',
        biome: 'lava_molten',
        points: [
          [640, 340], [880, 290], [1080, 370], [1120, 540], [990, 700],
          [780, 740], [620, 620], [580, 460]
        ]
      }
    ],
    stamps: [
      { id: 'sc1', stampId: 'mountain_volcano', x: 860, y: 460, scale: 1.7, rotation: 0, zIndex: 0 },
      { id: 'sc2', stampId: 'mountain_mesa', x: 1340, y: 390, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'sc3', stampId: 'ruins_stonehenge', x: 440, y: 410, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'sc4', stampId: 'tree_dead', x: 480, y: 640, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'sc5', stampId: 'tree_dead', x: 560, y: 720, scale: 1.1, rotation: 0.1, zIndex: 0 },
      { id: 'sc6', stampId: 'fortress_keep', x: 1440, y: 560, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 'sc7', stampId: 'compass_rose', x: 1720, y: 180, scale: 1.5, rotation: 0, zIndex: 10 }
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
      { id: 'sct1', text: 'CALDERA OF THE FIRE GOD', x: 860, y: 310, size: 36, color: '#fef08a', stroke: '#7f1d1d', font: 'Cinzel', curvature: 0.14 },
      { id: 'sct2', text: 'The Ashen Mire', x: 480, y: 540, size: 24, color: '#e2e8f0', stroke: '#1c1917', font: 'MedievalSharp', curvature: 0 },
      { id: 'sct3', text: 'Blackstone Bastion', x: 1440, y: 470, size: 26, color: '#f8fafc', stroke: '#0f172a', font: 'Cinzel', curvature: -0.06 }
    ]
  },
  {
    id: 'forgotten_crypt',
    title: 'The Crypt of the Forgotten King',
    type: 'battle',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'square', size: 64, opacity: 0.25, color: '#f8fafc', offsetX: 0, offsetY: 0, snap: true },
    atmosphere: { vignette: 0.65, parchmentGrain: 0.15, sepia: 0.1, brightness: 0.88 },
    landmasses: [
      {
        id: 'crypt_hall',
        biome: 'dungeon_flagstone',
        points: [
          [320, 160], [1600, 160], [1600, 920], [320, 920]
        ]
      },
      {
        id: 'inner_dais',
        biome: 'wooden_planks',
        points: [
          [760, 320], [1160, 320], [1160, 760], [760, 760]
        ]
      }
    ],
    stamps: [
      { id: 'fc1', stampId: 'throne_royal', x: 960, y: 420, scale: 1.5, rotation: 0, zIndex: 0 },
      { id: 'fc2', stampId: 'brazier_flame', x: 840, y: 400, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'fc3', stampId: 'brazier_flame', x: 1080, y: 400, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'fc4', stampId: 'brazier_flame', x: 840, y: 680, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'fc5', stampId: 'brazier_flame', x: 1080, y: 680, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'fc6', stampId: 'dagger_sacrificial', x: 960, y: 560, scale: 1.1, rotation: 0.78, zIndex: 0 }
    ],
    paths: [
      {
        id: 'fcp1',
        type: 'wall',
        width: 14,
        points: [
          [320, 160], [1600, 160], [1600, 920], [320, 920], [320, 160]
        ]
      }
    ],
    texts: [
      { id: 'fct1', text: 'TOMB OF HIGH KING OSWYDD', x: 960, y: 240, size: 32, color: '#f59e0b', stroke: '#1e293b', font: 'Cinzel', curvature: 0 }
    ]
  },
  {
    id: 'blank_canvas',
    title: 'New Realm (Blank Slate)',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 60, opacity: 0.12, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.35, parchmentGrain: 0.25, sepia: 0.15, brightness: 1.0 },
    landmasses: [],
    stamps: [],
    paths: [],
    texts: []
  }
];
