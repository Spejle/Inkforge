// Battle Preset: Ambush at Ravenford
// Tactical 28x20 square grid battlemap encounter at a river ford on a forest road.
// Fully deterministic seeded PRNG, strictly grid-aligned props & tokens, clean 2-square lanes.

function _rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildBattle() {
  const W = 1960;
  const H = 1400;
  const GRID_SIZE = 70; // 28 cols x 20 rows
  const COLS = 28;
  const ROWS = 20;

  const rnd = _rng(20261015);
  const R = (a, b) => a + (b - a) * rnd();

  // Grid square centre calculator
  const cx = (i) => GRID_SIZE * i + 35;
  const cy = (j) => GRID_SIZE * j + 35;

  // ---------------- BASE TERRAIN & LANDMASS ----------------
  // Base landmass covering the full canvas, corner bevels keep all points strictly inside [0, 1960] x [0, 1400]
  const landmasses = [
    {
      id: 'ravenford_ground',
      biome: 'grassland',
      points: [
        [0, 0], [10, 0], [980, 0], [1950, 0], [1960, 0],
        [1960, 10], [1960, 700], [1960, 1390], [1960, 1400],
        [1950, 1400], [980, 1400], [10, 1400], [0, 1400],
        [0, 1390], [0, 700], [0, 10]
      ]
    }
  ];

  // ---------------- BIOME BRUSHES (Soft Transitions & River) ----------------
  let bi = 0;
  const brush = (biome, size, soft, op, pts, target = 'foreground') => ({
    id: 'bb_' + ++bi,
    type: 'brush',
    target,
    biome,
    size,
    opacity: op,
    softness: soft,
    blendMode: 'source-over',
    points: pts.map(([x, y]) => ({ x, y }))
  });

  // ---------------- RIVER CENTRELINE & GEOMETRY ----------------
  // Gently winding centreline with seeded sine offset
  const seedPhase = rnd() * Math.PI * 2;
  const riverX = (y) => {
    const t = y / H;
    const s1 = Math.sin(t * Math.PI * 2.2 + seedPhase);
    const s2 = Math.sin(t * Math.PI * 4.4 + seedPhase * 1.7);
    return Math.round(1025 + 36 * s1 + 16 * s2);
  };

  // Continuous river: many (40+) overlapping shallows water brush strokes
  // Each size ~150 px, softness 0.15, opacity 1.0
  // Spanning 3 overlapping lanes across width (~280 px wide / ~4 grid squares)
  const riverShallowsStrokes = [];
  const riverWidthOffsets = [-70, 0, 70];
  const riverStepY = 25;
  for (let y = 0; y <= H; y += riverStepY) {
    const rx = riverX(y);
    for (const ox of riverWidthOffsets) {
      const px = Math.max(0, Math.min(W, rx + ox));
      const py = Math.max(0, Math.min(H, y));
      riverShallowsStrokes.push(
        brush('shallows', 150, 0.15, 1.0, [[px, py]])
      );
    }
  }

  // Darker deep_ocean core along the centreline
  // Present along the river EXCEPT at the ford (y between 560 and 770) where only shallows remains
  const riverDeepStrokes = [];
  const fordMinY = 560;
  const fordMaxY = 770;
  for (let y = 0; y <= H; y += riverStepY) {
    if (y >= fordMinY && y <= fordMaxY) {
      continue; // Ford crossing: shallow water only
    }
    const rx = riverX(y);
    const px = Math.max(0, Math.min(W, rx));
    const py = Math.max(0, Math.min(H, y));
    riverDeepStrokes.push(
      brush('deep_ocean', 120, 0.20, 0.95, [[px, py]])
    );
  }

  const brushStrokes = [
    // Soft forest floor understory under tree canopies
    brush('forest_floor', 280, 0.85, 0.82, [[210, 210], [350, 315], [490, 420]]),
    brush('forest_floor', 260, 0.85, 0.80, [[140, 910], [280, 980], [420, 1050]]),
    brush('forest_floor', 280, 0.85, 0.85, [[1400, 140], [1540, 210], [1680, 280], [1820, 350]]),
    brush('forest_floor', 260, 0.85, 0.80, [[1260, 1050], [1400, 1120], [1540, 1190]]),
    brush('forest_floor', 200, 0.80, 0.75, [[700, 420], [840, 490]]),
    brush('forest_floor', 220, 0.80, 0.75, [[840, 1050], [910, 1120], [910, 1260]]),

    // Muddy/marshy banks along river verge
    brush('swamp_mire', 100, 0.85, 0.55, [[945, 350], [945, 490]]),
    brush('swamp_mire', 100, 0.85, 0.55, [[1085, 350], [1085, 490]]),
    brush('swamp_mire', 100, 0.85, 0.55, [[910, 840], [910, 1050]]),
    brush('swamp_mire', 100, 0.85, 0.55, [[1050, 840], [1050, 1050]]),

    // Tall grass patches / wild verge
    brush('savanna', 130, 0.85, 0.50, [[420, 770], [560, 840]]),
    brush('savanna', 120, 0.85, 0.50, [[1260, 420], [1330, 490]]),

    // Continuous river: shallows water strokes (~4 squares wide barrier)
    ...riverShallowsStrokes,

    // Darker deep_ocean core along centreline (interrupted at ford)
    ...riverDeepStrokes
  ];

  // ---------------- PATHS (Dirt Road Crossing Diagonally) ----------------
  // Road stops at the river banks with crossing handled by stepping stones
  const paths = [
    {
      id: 'road_ravenford_west',
      type: 'road',
      width: 70, // Exactly 1 square wide tactical road
      color: '#6e4526', // Dirt brown
      dashed: false,
      points: [
        [70, 1330],
        [210, 1260],
        [350, 1120],
        [490, 1015],
        [630, 910],
        [770, 805],
        [910, 735] // West riverbank approach
      ]
    },
    {
      id: 'road_ravenford_east',
      type: 'road',
      width: 70,
      color: '#6e4526',
      dashed: false,
      points: [
        [1165, 610], // East riverbank departure
        [1295, 525],
        [1435, 435],
        [1575, 330],
        [1715, 225],
        [1890, 105]
      ]
    }
  ];

  // ---------------- STAMPS & TOKENS ENGINE ----------------
  const stamps = [];
  let sid = 0;

  // Helper: align every prop, token, tree, and stamp strictly to square centres (x = 70*i + 35)
  function placeAt(stampId, i, j, scale = 1.0, o = {}) {
    stamps.push({
      id: 'st_' + ++sid,
      stampId,
      x: cx(i),
      y: cy(j),
      scale: +scale.toFixed(2),
      rotation: o.rot || 0,
      flipX: !!o.flipX,
      anchor: o.anchor || 'center',
      zIndex: o.z || 0
    });
  }

  // 1. HERO TOKENS (On the Road, marching toward the Ford)
  // Aligned strictly to square centres, zIndex 10 for prominent visibility
  placeAt('token_hero_warrior', 12, 10, 1.0, { z: 10 }); // Point guard at road bend before the ford
  placeAt('token_hero_rogue',   11, 11, 1.0, { z: 10 }); // Scout flanking closely behind
  placeAt('token_hero_mage',     9, 12, 1.0, { z: 10 }); // Arcanist taking cover near the burned wagon

  // 2. MONSTER / ENEMY TOKENS (Hidden in the tree clusters)
  // Aligned strictly to square centres, no stamp overlapping these cells
  placeAt('token_skull_marker', 18,  3, 1.0, { z: 10 }); // Ridge Sniper 1 (High ground overlooking the road)
  placeAt('token_skull_marker', 23,  2, 1.0, { z: 10 }); // Camp Lookout (Guarding ambusher ridge)
  placeAt('token_skull_marker', 16,  6, 1.0, { z: 10 }); // Ambush Leader (East riverbank overlooking the ford)
  placeAt('token_skull_marker', 16, 12, 1.0, { z: 10 }); // Southern Flanker (Hidden in deep river woods)
  placeAt('token_skull_marker', 11,  8, 1.0, { z: 10 }); // West Woods Skirmisher (Flanking between watchtower & ford)

  // 3. TACTICAL COVER PROPS
  // Burned wagon, crates, table, and fallen logs providing cover along the road
  placeAt('prop_barrel_crate',     10, 13, 0.95, { z: 2, rot:  0.26 });
  placeAt('veg_log_fallen_top',     9, 13, 1.00, { z: 1, rot: -0.52 });
  placeAt('prop_barrel_stack_top', 10, 14, 0.95, { z: 2, rot:  0.52 });
  placeAt('prop_table_tavern',      8, 13, 0.95, { z: 2, rot: -0.78 }); // Overturned merchant table
  placeAt('prop_chest_wood_top',    8, 14, 0.85, { z: 2, rot:  0.52 }); // Spilled cargo chest
  placeAt('prop_barrel_stack_top',  9, 14, 0.90, { z: 2, rot: -0.26 }); // Spilled supply barrels
  placeAt('prop_barrel_crate',     10, 12, 0.90, { z: 2, rot:  0.78 }); // Roadside crate cover
  placeAt('prop_barrel_crate',      8, 12, 0.90, { z: 2, rot: -0.52 }); // Merchant caravan cargo
  placeAt('prop_barrel_crate',     12,  9, 0.85, { z: 2, rot:  0.26 }); // Roadside barrel cover before ford

  // Ruined Watchtower providing heavy stone cover & elevation on northwest ridge
  placeAt('ruined_tower_top',       9,  6, 1.25, { z: 3, rot:  0.26 });
  placeAt('boulder_cluster',        8,  6, 0.95, { z: 2 });
  placeAt('veg_rock_mossy',        10,  6, 0.85, { z: 2 });
  placeAt('prop_altar_stone_top',   9,  5, 0.95, { z: 2, rot:  0.26 }); // Ancient stone altar at ruins

  // Ambusher Camp on the Ridge (Campfire, tents, supply crates, loot chests)
  placeAt('camp_tent_top',         20,  2, 1.05, { z: 2, rot: -0.26 });
  placeAt('prop_campfire',         21,  2, 0.95, { z: 2 });
  placeAt('camp_tent_top',         22,  2, 1.05, { z: 2, rot:  0.26 });
  placeAt('prop_chest_wood_top',   21,  1, 0.85, { z: 2, rot: -0.26 });
  placeAt('prop_barrel_crate',     20,  1, 0.90, { z: 2, rot:  0.52 });
  placeAt('camp_tent_top',         20,  0, 1.00, { z: 2, rot:  0.26 }); // Northern scout tent
  placeAt('prop_barrel_stack_top', 21,  0, 0.90, { z: 2, rot: -0.26 }); // Ridge supply barrels
  placeAt('prop_barrel_crate',     22,  0, 0.85, { z: 2, rot:  0.52 }); // Ridge supply crates
  placeAt('prop_chest_treasure_top',22, 1, 0.90, { z: 2, rot:  0.26 }); // Bandits' locked loot chest
  placeAt('prop_barrel_crate',     18,  4, 0.85, { z: 2, rot:  0.26 }); // Sniper's cover crate on ridge

  // The Ford Crossing: 6 stepping-stone boulder stamps across shallow water
  const fordStones = [
    { x: 950,  y: 715, scale: 0.85, rot: 0.10, flipX: false },
    { x: 990,  y: 695, scale: 0.90, rot: -0.15, flipX: true },
    { x: 1030, y: 675, scale: 0.95, rot: 0.05, flipX: false },
    { x: 1070, y: 655, scale: 0.88, rot: -0.10, flipX: true },
    { x: 1110, y: 635, scale: 0.92, rot: 0.20, flipX: false },
    { x: 1150, y: 615, scale: 0.82, rot: -0.05, flipX: true }
  ];
  for (const s of fordStones) {
    stamps.push({
      id: 'st_' + ++sid,
      stampId: 'boulder_cluster',
      x: s.x,
      y: s.y,
      scale: +s.scale.toFixed(2),
      rotation: s.rot,
      flipX: s.flipX,
      anchor: 'center',
      zIndex: 2,
      isFordStone: true
    });
  }

  // 4. TREE CLUSTERS, BOULDERS & VEGETATION (Creating chokepoints and clear 2-square lanes)
  // Northwest Deep Forest
  placeAt('tr_pine',            1,  1, 0.95);
  placeAt('tr_oak',             2,  1, 1.05);
  placeAt('tr_pine',            4,  1, 1.00);
  placeAt('tr_spruce',          6,  1, 0.95);
  placeAt('tr_oak',             7,  1, 1.00);
  placeAt('veg_rock_mossy',     1,  2, 0.85);
  placeAt('tr_oak',             3,  2, 1.10);
  placeAt('tr_pine',            5,  2, 1.00);
  placeAt('tr_round',           7,  2, 0.90);
  placeAt('veg_bush_round',     8,  2, 0.75);
  placeAt('tr_pine',            2,  3, 1.05);
  placeAt('boulder_cluster',    4,  3, 0.90);
  placeAt('tr_oak',             6,  3, 1.15);
  placeAt('tr_pine',            8,  3, 0.95);
  placeAt('tr_spruce',          1,  4, 1.00);
  placeAt('veg_log_fallen',     3,  4, 0.90);
  placeAt('tr_round',           5,  4, 0.95);
  placeAt('veg_bush_berry',     7,  4, 0.75);
  placeAt('veg_shrub_low',      2,  5, 0.70);
  placeAt('tr_oak',             4,  5, 1.00);
  placeAt('veg_stump',          6,  5, 0.80);
  placeAt('veg_bush_round',     8,  5, 0.75);

  // Watchtower Hill Outskirts
  placeAt('veg_thorn_scrub',    7,  6, 0.70);
  placeAt('tr_pine',           11,  5, 0.95);
  placeAt('tr_oak',            12,  5, 1.05);
  placeAt('veg_bush_round',    13,  5, 0.75);
  placeAt('veg_bush_berry',    12,  6, 0.70);
  placeAt('tr_spruce',         13,  6, 0.95);
  placeAt('veg_grass_tuft',    11,  7, 0.70);
  placeAt('veg_rock_mossy',    12,  7, 0.80);
  placeAt('tr_pine',           13,  7, 0.95);
  placeAt('veg_grass_tall',    13,  8, 0.75);

  // Southwest Forest Barrier
  placeAt('tr_oak',             1, 14, 1.05);
  placeAt('tr_pine',            3, 14, 0.95);
  placeAt('veg_bush_berry',     5, 14, 0.75);
  placeAt('tr_pine',            2, 15, 1.00);
  placeAt('tr_oak',             4, 15, 1.10);
  placeAt('boulder_cluster',    1, 16, 0.90);
  placeAt('tr_spruce',          3, 16, 0.95);
  placeAt('veg_rock_mossy',     5, 16, 0.85);
  placeAt('veg_grass_tall',     2, 17, 0.75);
  placeAt('tr_oak',             4, 17, 1.00);
  placeAt('tr_pine',            1, 18, 0.95);
  placeAt('veg_log_fallen',     3, 18, 0.90);
  placeAt('tr_round',           5, 18, 0.90);
  placeAt('veg_bush_round',     2, 19, 0.75);
  placeAt('tr_pine',            4, 19, 1.00);
  placeAt('tr_oak',             6, 19, 1.05);

  // South Central Forest (East of Wagon, West of River)
  placeAt('tr_oak',            12, 14, 1.05);
  placeAt('veg_bush_round',    13, 14, 0.75);
  placeAt('veg_rock_mossy',    11, 15, 0.85);
  placeAt('tr_pine',           12, 15, 1.00);
  placeAt('tr_spruce',         13, 15, 0.95);
  placeAt('tr_round',          11, 16, 0.90);
  placeAt('boulder_cluster',   12, 16, 0.90);
  placeAt('veg_log_fallen',    11, 17, 0.90);
  placeAt('tr_oak',            12, 17, 1.00);
  placeAt('tr_pine',           12, 18, 0.95);

  // Northeast Ridge Canopies (Behind Ambush Ridge & Camp)
  placeAt('tr_pine',           16,  1, 0.95);
  placeAt('boulder_cluster',   17,  1, 0.85);
  placeAt('tr_oak',            18,  1, 1.05);
  placeAt('tr_pine',           19,  1, 0.95);
  placeAt('tr_spruce',         23,  1, 0.95);
  placeAt('veg_bush_round',    24,  1, 0.75);
  placeAt('tr_oak',            25,  1, 1.05);
  placeAt('tr_pine',           26,  1, 1.00);
  placeAt('veg_rock_mossy',    16,  2, 0.85);
  placeAt('tr_oak',            17,  2, 1.10);
  placeAt('veg_bush_berry',    18,  2, 0.75);
  placeAt('veg_thorn_scrub',   19,  2, 0.70);
  placeAt('tr_pine',           24,  2, 1.00);
  placeAt('tr_round',          25,  2, 0.90);
  placeAt('boulder_cluster',   26,  2, 0.90);
  placeAt('tr_pine',           16,  3, 0.95);
  placeAt('veg_grass_tall',    17,  3, 0.75);
  placeAt('boulder_cluster',   19,  3, 0.85);
  placeAt('veg_bush_round',    20,  3, 0.75);
  placeAt('veg_rock_mossy',    21,  3, 0.80);
  placeAt('veg_shrub_low',     22,  3, 0.70);
  placeAt('tr_oak',            23,  3, 1.05);
  placeAt('tr_pine',           24,  3, 1.00);
  placeAt('veg_bush_berry',    25,  3, 0.75);
  placeAt('veg_grass_tall',    17,  4, 0.75);
  placeAt('veg_bush_round',    19,  4, 0.75);
  placeAt('tr_pine',           20,  4, 0.95);
  placeAt('veg_thorn_scrub',   21,  4, 0.70);
  placeAt('veg_rock_mossy',    23,  4, 0.85);
  placeAt('tr_oak',            24,  4, 1.00);
  placeAt('tr_pine',           25,  4, 0.95);
  placeAt('veg_grass_tall',    17,  5, 0.75);
  placeAt('tr_pine',           18,  5, 0.95);
  placeAt('veg_bush_round',    19,  5, 0.75);
  placeAt('veg_bush_berry',    22,  5, 0.75);
  placeAt('tr_spruce',         24,  5, 0.95);

  // East Riverbank Woods (Lining eastern choke & shallows)
  placeAt('veg_bush_round',    17,  7, 0.75);
  placeAt('tr_pine',           18,  7, 1.00);
  placeAt('veg_bush_berry',    18,  8, 0.70);
  placeAt('veg_grass_tall',    16,  9, 0.75);
  placeAt('veg_rock_mossy',    17,  9, 0.85);
  placeAt('tr_oak',            18,  9, 1.05);
  placeAt('veg_grass_tall',    16, 10, 0.75);
  placeAt('boulder_cluster',   17, 10, 0.85);
  placeAt('tr_pine',           18, 10, 0.95);
  placeAt('tr_oak',            17, 11, 1.05);
  placeAt('veg_bush_round',    18, 11, 0.75);
  placeAt('tr_pine',           17, 12, 1.00);
  placeAt('veg_log_fallen',    18, 12, 0.90);
  placeAt('veg_grass_tall',    16, 13, 0.75);
  placeAt('tr_spruce',         17, 13, 0.95);
  placeAt('tr_oak',            18, 13, 1.05);

  // Southeast Flanking Woods (Guarding east road exit)
  placeAt('tr_oak',            20,  8, 1.05);
  placeAt('tr_pine',           21,  8, 0.95);
  placeAt('tr_spruce',         23,  8, 0.95);
  placeAt('tr_oak',            25,  8, 1.00);
  placeAt('veg_bush_round',    19,  9, 0.75);
  placeAt('boulder_cluster',   21,  9, 0.90);
  placeAt('tr_oak',            23,  9, 1.10);
  placeAt('tr_pine',           25,  9, 1.00);
  placeAt('tr_pine',           20, 10, 1.00);
  placeAt('veg_log_fallen',    22, 10, 0.90);
  placeAt('tr_oak',            24, 10, 1.05);
  placeAt('veg_bush_berry',    26, 10, 0.75);
  placeAt('tr_oak',            19, 11, 1.05);
  placeAt('tr_pine',           21, 11, 0.95);
  placeAt('veg_rock_mossy',    23, 11, 0.85);
  placeAt('tr_spruce',         25, 11, 1.00);
  placeAt('veg_bush_round',    20, 12, 0.75);
  placeAt('tr_oak',            22, 12, 1.05);
  placeAt('tr_pine',           24, 12, 0.95);
  placeAt('boulder_cluster',   26, 12, 0.85);

  // Meadow Tall Grass & Scrub
  placeAt('veg_grass_tall',     5,  8, 0.75);
  placeAt('veg_grass_tuft',     6,  9, 0.70);
  placeAt('veg_grass_tall',     7, 10, 0.75);
  placeAt('veg_grass_tall',     5, 11, 0.75);
  placeAt('veg_grass_tuft',     6, 12, 0.70);
  placeAt('veg_grass_tall',     7, 13, 0.75);

  // ---------------- TEXT LABELS & ENCOUNTER MARKERS ----------------
  let ti = 0;
  const label = (text, x, y, size, o = {}) => ({
    id: 'tx_' + ++ti,
    text,
    content: text,
    x: Math.round(x),
    y: Math.round(y),
    size,
    color: o.color || '#271b12',
    stroke: o.stroke || '#fef3c7',
    font: o.font || 'Cinzel',
    curvature: o.curv || 0,
    ...(o.rot ? { rotation: o.rot } : {}),
    ...(o.tracking ? { tracking: o.tracking } : {})
  });

  const texts = [
    // Main Title Banner
    label('BATTLE: AMBUSH AT RAVENFORD', 980, 48, 30, { color: '#fef3c7', stroke: '#1c1917', tracking: 4 }),

    // 10 Tactically Descriptive Area Labels
    label('Ravenford Crossing',  1050,  620, 22, { font: 'Cinzel', color: '#38bdf8', stroke: '#0c2a4d', tracking: 2 }),
    label('Ambush Ridge',        1470,  280, 22, { font: 'Cinzel', color: '#f87171', stroke: '#450a0a', tracking: 2 }),
    label('Burned Wagon',         735,  980, 20, { font: 'Cinzel', color: '#ea580c', stroke: '#1c1917', tracking: 1 }),
    label('Ruined Watchtower',    665,  500, 22, { font: 'Cinzel', color: '#e2e8f0', stroke: '#1e293b', tracking: 1 }),
    label("High King's Road",     350, 1190, 20, { font: 'MedievalSharp', color: '#d4b276', stroke: '#271c19' }),
    label('Deep River (North)',  1050,  180, 18, { font: 'MedievalSharp', color: '#38bdf8', stroke: '#0c2a4d' }),
    label('Deep River (South)',  1015, 1260, 18, { font: 'MedievalSharp', color: '#38bdf8', stroke: '#0c2a4d' }),
    label('Bandit Ridge Camp',   1505,   70, 19, { font: 'Cinzel', color: '#fca5a5', stroke: '#450a0a', tracking: 1 }),
    label('Shadowed Woods',       350,  460, 20, { font: 'MedievalSharp', color: '#86efac', stroke: '#14532d' }),
    label('Tall Grass Verge',     490,  840, 18, { font: 'MedievalSharp', color: '#bef264', stroke: '#1a2e05' }),

    // 8 Numbered Encounter Markers (Gold markers with dark outline placed at encounter locations)
    label('1',  175, 1155, 24, { color: '#f59e0b', stroke: '#18181b' }), // Road approach
    label('2',  665,  385, 24, { color: '#f59e0b', stroke: '#18181b' }), // Ruined watchtower
    label('3',  735,  875, 24, { color: '#f59e0b', stroke: '#18181b' }), // Burned wagon cover
    label('4', 1085,  665, 24, { color: '#f59e0b', stroke: '#18181b' }), // Ravenford crossing
    label('5', 1295,  175, 24, { color: '#f59e0b', stroke: '#18181b' }), // Ambush ridge
    label('6', 1505,  245, 24, { color: '#f59e0b', stroke: '#18181b' }), // Ambusher camp
    label('7', 1015,  875, 24, { color: '#f59e0b', stroke: '#18181b' }), // Deep river reach
    label('8', 1785,  245, 24, { color: '#f59e0b', stroke: '#18181b' }), // East forest exit

    // Legend Box (Neatly stacked in bottom-right corner: cols 23-27, rows 14-19)
    label('ENCOUNTER KEY',        1740,  980, 18, { font: 'Cinzel', color: '#fef08a', stroke: '#0f172a', tracking: 2 }),
    label('1: Road Approach',     1740, 1025, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('2: Ruined Watchtower', 1740, 1065, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('3: Burned Wagon Cover',1740, 1105, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('4: Ravenford Crossing',1740, 1145, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('5: Ambush Ridge',      1740, 1185, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('6: Bandit Camp',       1740, 1225, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('7: Deep River Choke',  1740, 1265, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' }),
    label('8: East Forest Exit',  1740, 1305, 14, { font: 'Cinzel', color: '#f1f5f9', stroke: '#0f172a' })
  ];

  // ---------------- TREE & ROCK RIVER CORRIDOR FILTER ----------------
  // Remove any tree or rock stamp whose centre is within 200 px of the river centreline,
  // except ford stones (and keeping tactical tokens, camp props, and watchtower).
  const isTreeOrRock = (id) =>
    id.startsWith('tr_') ||
    id.startsWith('veg_') ||
    id === 'boulder_cluster';

  const finalStamps = stamps
    .filter((s) => {
      if (s.isFordStone) return true;
      if (!isTreeOrRock(s.stampId)) return true;
      return Math.abs(s.x - riverX(s.y)) >= 200;
    })
    .map(({ isFordStone, ...rest }) => rest);

  return {
    id: 'battle_demo',
    title: 'Battle: Ambush at Ravenford',
    type: 'battle',
    template: 'battle',
    width: W,
    height: H,
    grid: {
      enabled: true,
      type: 'square',
      size: GRID_SIZE,
      opacity: 0.22,
      color: '#f8fafc',
      offsetX: 0,
      offsetY: 0,
      snap: true
    },
    atmosphere: {
      vignette: 0.35,
      parchmentGrain: 0.2,
      sepia: 0.1,
      brightness: 1.0
    },
    coastline: {
      outlineWidth: 0,
      ripplesEnabled: false,
      sandEnabled: false,
      shadowEnabled: false
    },
    landmasses,
    brushStrokes,
    paths,
    stamps: finalStamps,
    texts
  };
}
