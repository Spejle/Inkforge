// Preset Map: City - Port of Karrowmere
// Procedurally generated top-down walled harbour city on flat ground.
// Fully deterministic: seeded PRNG only, zero Math.random().

import { getStampById } from '../stampsCatalog.js';

// Seeded PRNG (Mulberry32)
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

// Geometry helpers
const _mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function _quad(p0, c, p1, out, n) {
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]
    ]);
  }
}

function _smoothLine(pts, n = 8) {
  if (pts.length < 3) return pts.map((p) => [...p]);
  const out = [[...pts[0]]];
  let cur = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const nxt = _mid(pts[i], pts[i + 1]);
    _quad(cur, pts[i], nxt, out, n);
    cur = nxt;
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}

function _distSeg(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
}

function _distLine(x, y, line) {
  let m = 1e9;
  for (let i = 0; i < line.length - 1; i++) {
    m = Math.min(m, _distSeg(x, y, line[i], line[i + 1]));
  }
  return m;
}

export function buildCity() {
  const W = 2400, H = 1600;
  const rnd = _rng(20261015);
  const R = (min, max) => min + (max - min) * rnd();
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  // -------------------------------------------------------------------------
  // 1. BASE LANDMASS & GEOGRAPHY (Full canvas coverage, zero dark void)
  // -------------------------------------------------------------------------
  const landmasses = [
    {
      id: 'karrowmere_mainland',
      biome: 'grassland',
      points: [
        [0, 0],
        [2400, 0],
        [2400, 1600],
        [0, 1600]
      ]
    }
  ];

  // -------------------------------------------------------------------------
  // 2. WATER BODIES (RIVER MERE & HARBOUR BASIN)
  // -------------------------------------------------------------------------
  // River Mere flows from the North down through the city into the southern harbour
  const riverPts = [
    [1200, 0],
    [1210, 160],
    [1230, 330],
    [1200, 490],
    [1170, 650],
    [1190, 810],
    [1215, 960],
    [1200, 1120],
    [1180, 1260]
  ];
  const denseRiver = _smoothLine(riverPts, 10);

  // Rectangular harbour basin carved into the south edge between X=460 and X=1940, Y>=1180
  function isHarbourWater(x, y, pad = 0) {
    return x >= (460 - pad) && x <= (1940 + pad) && y >= (1180 - pad);
  }

  function isRiverWater(x, y, pad = 0) {
    return _distLine(x, y, denseRiver) < (28 + pad);
  }

  function isAnyWater(x, y, pad = 0) {
    return isHarbourWater(x, y, pad) || isRiverWater(x, y, pad);
  }

  // -------------------------------------------------------------------------
  // 3. PATHS: RIVER, CITY WALLS, QUAYS & STREET NETWORK
  // -------------------------------------------------------------------------
  const paths = [];

  // Main river watercourse
  paths.push({
    id: 'river_mere',
    type: 'river',
    width: 34,
    color: '#2b5c8f',
    points: riverPts
  });

  // City Wall Segments: thick stone masonry (width 22) continuous with gate gaps ONLY at the 6 named gates
  const WALL_W = 22;
  const addWall = (id, points) => paths.push({ id, type: 'wall', width: WALL_W, points });

  // 1) West Gate north tower -> NW Corner -> North Gate west tower
  addWall('wall_nw', [[520, 645], [520, 360], [680, 340], [830, 330]]);
  // 2) North Gate east tower -> River Water Gate west tower
  addWall('wall_n_mid', [[930, 330], [1050, 330], [1160, 330]]);
  // 3) River Water Gate east tower -> Moor Gate west tower
  addWall('wall_n_river_moor', [[1270, 330], [1420, 335], [1590, 340]]);
  // 4) Moor Gate east tower -> NE Corner -> East Gate north tower
  addWall('wall_ne', [[1690, 340], [1780, 345], [1880, 360], [1880, 520], [1880, 665]]);
  // 5) East Gate south tower -> SE Corner -> River mouth east quay tower
  addWall('wall_se', [[1880, 775], [1875, 940], [1860, 1130], [1650, 1130], [1450, 1130], [1270, 1130]]);
  // 6) River mouth west quay tower -> Harbour Gate east tower
  addWall('wall_s_mid', [[1160, 1130], [1060, 1130], [970, 1130]]);
  // 7) Harbour Gate west tower -> SW Corner -> West Gate south tower
  addWall('wall_sw', [[870, 1130], [700, 1130], [540, 1130], [525, 940], [520, 755]]);

  // Stone Quay Edge along the harbour basin shore (wall path at Y=1180, width 18)
  const addQuay = (id, points) => paths.push({ id, type: 'wall', width: 18, points });
  addQuay('quay_west', [[460, 1180], [700, 1180], [870, 1180], [970, 1180], [1160, 1180]]);
  addQuay('quay_east', [[1240, 1180], [1450, 1180], [1650, 1180], [1860, 1180], [1940, 1180]]);
  addQuay('quay_mole_w', [[460, 1180], [460, 1280]]);
  addQuay('quay_mole_e', [[1940, 1180], [1940, 1280]]);

  // Streets: narrower width 11, dark slate/granite kerb lines (#334155) visible against cobblestone
  const ROAD_W = 11;
  const ROAD_COL = '#334155';
  const streetLines = [];

  const addStreet = (id, points) => {
    paths.push({ id, type: 'road', width: ROAD_W, color: ROAD_COL, points });
    streetLines.push(_smoothLine(points, 6));
  };

  // 1) Main Royal Avenue (West Gate to East Gate across High Bridge)
  addStreet('st_high_west', [[520, 700], [680, 700], [860, 700], [990, 700]]);
  addStreet('st_high_market', [[990, 700], [1130, 700], [1190, 700]]);
  addStreet('st_high_east', [[1205, 700], [1320, 715], [1500, 715], [1700, 715], [1880, 715]]);

  // 2) King's Way (North Gate down to Market Square)
  addStreet('st_kings_way', [[880, 330], [880, 440], [885, 560], [890, 700]]);

  // 3) Harbour Way (Market Square south to Harbour Gate)
  addStreet('st_harbour_way', [[890, 700], [900, 850], [910, 1000], [920, 1130]]);

  // 4) King's Bridge Upper Crossing (connecting Citadel to Temple Ward at Y=540)
  addStreet('st_kings_bridge', [[730, 540], [960, 540], [1130, 540], [1260, 540], [1410, 540], [1570, 540]]);

  // 5) Inner Ring Road (Pomerium inside the city wall)
  addStreet('st_ring_w', [[570, 410], [570, 640], [570, 760], [570, 1080]]);
  addStreet('st_ring_nw', [[570, 410], [680, 390], [840, 390], [880, 390], [1050, 390], [1130, 390]]);
  addStreet('st_ring_ne', [[1260, 390], [1410, 390], [1570, 390], [1710, 390], [1820, 410]]);
  addStreet('st_ring_e', [[1820, 410], [1820, 660], [1820, 780], [1820, 1080]]);
  addStreet('st_quayside_promenade', [[570, 1080], [730, 1080], [920, 1080], [1130, 1080], [1260, 1080], [1410, 1080], [1570, 1080], [1710, 1080], [1820, 1080]]);

  // 6) River Quayside thoroughfares along both banks
  addStreet('st_quay_west', [[1130, 390], [1130, 540], [1130, 700], [1130, 860], [1130, 980], [1130, 1080]]);
  addStreet('st_quay_east', [[1260, 390], [1260, 540], [1260, 715], [1260, 860], [1260, 980], [1260, 1080]]);

  // 7) Temple Avenue (East Bank north-south thoroughfare)
  addStreet('st_temple_ave', [[1640, 340], [1610, 440], [1570, 540], [1570, 715], [1570, 860], [1570, 980], [1570, 1080]]);

  // 8) Urban cross streets
  addStreet('st_citadel_hill', [[570, 460], [640, 460], [730, 460]]);
  addStreet('st_oldtown_lane1', [[570, 860], [730, 860], [890, 860]]);
  addStreet('st_tanners_alley', [[570, 980], [730, 980], [920, 980], [1130, 980]]);
  addStreet('st_merchants_lane', [[890, 460], [990, 460], [1130, 460]]);
  addStreet('st_merchants_alley', [[990, 540], [990, 700], [990, 860]]);
  addStreet('st_coppergate', [[1260, 860], [1410, 860], [1570, 860], [1710, 860], [1820, 860]]);
  addStreet('st_artisan_lane', [[1260, 980], [1410, 980], [1570, 980], [1710, 980], [1820, 980]]);
  addStreet('st_cloisters_walk', [[1410, 390], [1410, 540], [1410, 715], [1410, 860], [1410, 980], [1410, 1080]]);
  addStreet('st_weavers_row', [[1710, 390], [1710, 540], [1710, 715], [1710, 860], [1710, 980], [1710, 1080]]);

  // 9) Outer Roads leaving the gates (earthy dirt track, width 11)
  const addOuterRoad = (id, points) => paths.push({ id, type: 'road', width: ROAD_W, color: '#78350f', points });
  addOuterRoad('rd_out_west', [[520, 700], [380, 690], [220, 700], [40, 720]]);
  addOuterRoad('rd_out_mill', [[380, 690], [350, 560], [340, 460]]);
  addOuterRoad('rd_out_southmeadow', [[380, 690], [330, 820], [280, 960], [240, 1080]]);
  addOuterRoad('rd_out_north', [[880, 330], [870, 220], [850, 120], [830, 30]]);
  addOuterRoad('rd_out_moor', [[1640, 340], [1680, 220], [1740, 120], [1800, 30]]);
  addOuterRoad('rd_out_east', [[1880, 720], [2020, 710], [2180, 690], [2360, 670]]);
  addOuterRoad('rd_out_sunfields', [[2020, 710], [2100, 840], [2180, 960]]);

  // -------------------------------------------------------------------------
  // 4. BRUSH STROKES: FULL RECTANGULAR LAND, HARBOUR CARVING & BIOME PAINTING
  // -------------------------------------------------------------------------
  let bi = 0;
  const brush = (biome, size, soft, op, pts, target = 'foreground') => ({
    id: 'bb_' + (++bi),
    type: 'brush',
    target,
    biome,
    size,
    opacity: op,
    softness: soft,
    blendMode: 'source-over',
    points: pts.map(([x, y]) => ({ x, y }))
  });

  const brushStrokes = [];

  // A) Full Canvas Land Coverage: tiled land mask strokes ensuring 100% rectangle coverage (zero dark void)
  brushStrokes.push({
    id: 'mask_land_top',
    type: 'mask',
    mode: 'land',
    size: 950,
    points: [{ x: 0, y: 450 }, { x: 2400, y: 450 }]
  });
  brushStrokes.push({
    id: 'mask_land_bot',
    type: 'mask',
    mode: 'land',
    size: 950,
    points: [{ x: 0, y: 1150 }, { x: 2400, y: 1150 }]
  });

  // B) Carve Harbour Basin: rectangular water polygon along south shore (Y=1180 to 1600, X=460 to 1940)
  // Straight south shore cutline (Y=1220 with size 80 reaches top Y=1180 exactly)
  for (let x = 460; x <= 1940; x += 25) {
    brushStrokes.push({
      id: 'water_carve_shore_' + (++bi),
      type: 'mask',
      mode: 'water',
      size: 80,
      points: [{ x, y: 1220 }]
    });
  }
  // Deep interior basin carving strokes
  for (let y = 1260; y <= 1600; y += 50) {
    brushStrokes.push({
      id: 'water_carve_basin_' + (++bi),
      type: 'mask',
      mode: 'water',
      size: 90,
      points: [{ x: 460, y }, { x: 1940, y }]
    });
  }
  // West & East basin boundary carving strokes
  brushStrokes.push({
    id: 'water_carve_west_wall',
    type: 'mask',
    mode: 'water',
    size: 80,
    points: [{ x: 460, y: 1220 }, { x: 460, y: 1600 }]
  });
  brushStrokes.push({
    id: 'water_carve_east_wall',
    type: 'mask',
    mode: 'water',
    size: 80,
    points: [{ x: 1940, y: 1220 }, { x: 1940, y: 1600 }]
  });

  // C) Water Biome Brushes inside carved basin (target: 'background', clipped outside land)
  brushStrokes.push(brush('deep_ocean', 180, 0.25, 0.96, [
    [500, 1420], [900, 1440], [1300, 1440], [1700, 1430], [1900, 1420]
  ], 'background'));
  brushStrokes.push(brush('deep_ocean', 200, 0.2, 0.98, [
    [500, 1540], [1000, 1550], [1500, 1550], [1900, 1540]
  ], 'background'));
  brushStrokes.push(brush('shallows', 140, 0.3, 0.95, [
    [480, 1240], [800, 1220], [1200, 1220], [1600, 1220], [1920, 1240]
  ], 'background'));
  brushStrokes.push(brush('shallows', 160, 0.35, 0.92, [
    [500, 1340], [950, 1330], [1450, 1330], [1900, 1340]
  ], 'background'));

  // D) River Mere watercourse shallows
  brushStrokes.push(brush('shallows', 55, 0.2, 0.95, riverPts));

  // E) Walled Interior: Paint whole walled town with cobblestone_town (large soft strokes, opacity 0.6)
  for (let y = 420; y <= 1140; y += 140) {
    brushStrokes.push(brush('cobblestone_town', 240, 0.45, 0.6, [
      [580, y], [850, y], [1100, y], [1350, y], [1600, y], [1820, y]
    ]));
  }
  // Extra cobblestone saturation around Grand Market Square & quays
  brushStrokes.push(brush('cobblestone_town', 160, 0.3, 0.6, [[1030, 760]]));
  brushStrokes.push(brush('cobblestone_town', 100, 0.3, 0.6, [[700, 1160], [1000, 1160], [1400, 1160], [1700, 1160]]));

  // Lighter second layer using parchment biome at opacity 0.35 over the interior so streets look warm stone, not blue
  for (let y = 420; y <= 1140; y += 140) {
    brushStrokes.push(brush('parchment', 240, 0.45, 0.35, [
      [580, y], [850, y], [1100, y], [1350, y], [1600, y], [1820, y]
    ]));
  }
  brushStrokes.push(brush('parchment', 160, 0.3, 0.35, [[1030, 760]]));
  brushStrokes.push(brush('parchment', 100, 0.3, 0.35, [[700, 1160], [1000, 1160], [1400, 1160], [1700, 1160]]));

  // F) Outside the walls: Farmland & rolling grasslands
  // West crop fields (Oakhaven Meadows)
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[160, 560], [280, 560], [380, 570]]));
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[140, 660], [260, 660], [360, 670]]));
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[160, 780], [280, 780], [380, 790]]));
  brushStrokes.push(brush('farmland', 100, 0.4, 0.88, [[200, 900], [320, 910], [420, 920]]));
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[220, 1020], [340, 1030], [440, 1040]]));

  // North pastures
  brushStrokes.push(brush('farmland', 85, 0.4, 0.88, [[1350, 160], [1480, 160], [1580, 170]]));
  brushStrokes.push(brush('farmland', 85, 0.4, 0.88, [[1650, 150], [1780, 160], [1880, 170]]));

  // East crop fields (Sunfields)
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[2000, 520], [2140, 520], [2260, 530]]));
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[2020, 640], [2160, 640], [2280, 650]]));
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[2020, 780], [2160, 790], [2280, 800]]));
  brushStrokes.push(brush('farmland', 95, 0.4, 0.88, [[2000, 900], [2140, 910], [2260, 920]]));

  // Outer grassland washes
  brushStrokes.push(brush('grassland', 120, 0.5, 0.7, [[260, 360], [380, 380]]));
  brushStrokes.push(brush('grassland', 120, 0.5, 0.7, [[2100, 360], [2220, 380]]));

  // -------------------------------------------------------------------------
  // 5. STAMP PLACEMENT ENGINE & SPATIAL OCCUPANCY
  // -------------------------------------------------------------------------
  const stamps = [];
  const occ = [];
  let sid = 0;

  const dim = (stampId, scale) => {
    const asp = getStampById(stampId)?.aspect || 1.0;
    const baseSize = 80 * scale;
    return { rx: baseSize * asp * 0.45, ry: baseSize * 0.4 };
  };

  const hit = (a, b) => {
    const dx = a.x - b.x, dy = a.y - b.y;
    const rx = a.rx + b.rx, ry = a.ry + b.ry;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 0.68;
  };

  function place(stampId, x, y, scale, o = {}) {
    const d = dim(stampId, scale);
    const box = { x, y, rx: d.rx * (o.fit || 1) + (o.pad || 0), ry: d.ry * (o.fit || 1) + (o.pad || 0) };

    // Canvas boundary check
    if (x - d.rx < 25 || x + d.rx > W - 25 || y - d.ry < 25 || y + d.ry > H - 25) {
      return false;
    }

    if (!o.free) {
      // Land stamps NEVER go in water!
      if (!o.isWaterStamp) {
        if (isAnyWater(x, y, Math.max(d.rx, d.ry) * 0.4)) return false;
      }

      // Check distance to roads (keep carriage-ways clear)
      if (!o.onRoad) {
        const roadPad = o.roadPad !== undefined ? o.roadPad : (d.rx * 0.45 + 10);
        for (const line of streetLines) {
          if (_distLine(x, y, line) < roadPad) return false;
        }
      }

      // Check collision with already placed stamps
      for (const b of occ) {
        if (hit(box, b)) return false;
      }
    }

    occ.push(box);
    stamps.push({
      id: 'st_' + (++sid),
      stampId,
      x: Math.round(x),
      y: Math.round(y),
      scale: Number(scale.toFixed(2)),
      rotation: Number((o.rot || 0).toFixed(3)),
      zIndex: o.z || 0,
      ...(o.layer ? { layer: o.layer } : {}),
      ...(o.flipX ? { flipX: true } : {})
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // 6. LANDMARKS & CITY INFRASTRUCTURE
  // -------------------------------------------------------------------------
  // A) Citadel / Castle on Citadel Hill (Northwest district)
  // Single castle with two flanking watchtowers with 1 square (60px) of space between
  place('cas_watchtower', 600, 430, 0.9, { free: true, z: 1 });
  place('cas_human_castle', 720, 430, 1.25, { free: true, z: 2 });
  place('cas_watchtower', 840, 430, 0.9, { free: true, z: 1 });

  // B) The Great Temple of the Sun (Northeast district)
  place('cas_temple', 1580, 480, 1.35, { free: true, z: 2 });
  place('cas_shrine', 1505, 450, 0.9, { free: true, z: 1 });
  place('cas_shrine', 1655, 450, 0.9, { free: true, z: 1 });
  place('cas_standing_stones', 1580, 400, 0.85, { free: true, z: 1 });

  // C) City Wall Bastions & Gate Towers (flanking the 6 named gates)
  // Corner bastions
  place('cas_human_keep', 520, 360, 1.15, { free: true, z: 2 });
  place('cas_human_keep', 1880, 360, 1.15, { free: true, z: 2 });
  place('cas_human_keep', 1860, 1130, 1.15, { free: true, z: 2 });
  place('cas_human_keep', 540, 1130, 1.15, { free: true, z: 2 });

  // Quayside defensive fort
  place('cas_human_keep', 1450, 1130, 1.1, { free: true, z: 2 });

  // 1. West Gate towers (Y=700)
  place('cas_watchtower', 520, 645, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 520, 755, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 520, 500, 0.9, { free: true, z: 1 });
  place('cas_watchtower', 525, 940, 0.9, { free: true, z: 1 });

  // 2. North Gate towers (X=880)
  place('cas_watchtower', 830, 330, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 930, 330, 0.95, { free: true, z: 2 });

  // 3. River Water Gate towers (X=1215)
  place('cas_watchtower', 1160, 330, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 1270, 330, 0.95, { free: true, z: 2 });

  // 4. Moor Gate towers (X=1640)
  place('cas_watchtower', 1590, 340, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 1690, 340, 0.95, { free: true, z: 2 });

  // 5. East Gate towers (Y=720)
  place('cas_watchtower', 1880, 665, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 1880, 775, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 1880, 520, 0.9, { free: true, z: 1 });
  place('cas_watchtower', 1875, 940, 0.9, { free: true, z: 1 });

  // 6. Harbour Gate towers (X=920)
  place('cas_watchtower', 870, 1130, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 970, 1130, 0.95, { free: true, z: 2 });

  // South river exit watchtowers
  place('cas_watchtower', 1160, 1130, 0.95, { free: true, z: 2 });
  place('cas_watchtower', 1270, 1130, 0.95, { free: true, z: 2 });

  // D) Bridges crossing the River Mere
  place('bridge_stone', 1195, 540, 0.65, { free: true, isWaterStamp: true, z: 1 });
  place('bridge_stone', 1195, 700, 0.65, { free: true, isWaterStamp: true, z: 1 });

  // E) The Grand Market Square (Clear open cobble square with central obelisk & 10 perimeter stalls)
  place('prop_altar_stone', 1030, 760, 1.05, { free: true, z: 2 });
  // North stalls
  place('prop_table_tavern', 990, 725, 0.85, { free: true, z: 1, rot: 0 });
  place('prop_barrel_stack', 1030, 720, 0.8, { free: true, z: 1, rot: 0 });
  place('prop_table_tavern', 1070, 725, 0.85, { free: true, z: 1, rot: 0 });
  // East stalls
  place('prop_barrel_stack', 1085, 760, 0.8, { free: true, z: 1, rot: 1.57 });
  place('prop_table_tavern', 1085, 790, 0.85, { free: true, z: 1, rot: 1.57 });
  // South stalls
  place('prop_table_tavern', 1070, 805, 0.85, { free: true, z: 1, rot: 0 });
  place('prop_barrel_stack', 1030, 805, 0.8, { free: true, z: 1, rot: 0 });
  place('prop_table_tavern', 990, 805, 0.85, { free: true, z: 1, rot: 0 });
  // West stalls
  place('prop_barrel_stack', 975, 775, 0.8, { free: true, z: 1, rot: 1.57 });
  place('prop_table_tavern', 975, 745, 0.85, { free: true, z: 1, rot: 1.57 });

  // F) Docks along the Stone Quay (projecting into harbour water at Y=1180, rot 1.57)
  place('port_dock', 600, 1180, 1.15, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 740, 1180, 1.2, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 880, 1180, 1.2, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 1020, 1180, 1.25, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  // River enters harbour between X=1160 and X=1240
  place('port_dock', 1320, 1180, 1.25, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 1460, 1180, 1.25, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 1600, 1180, 1.2, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 1740, 1180, 1.15, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });
  place('port_dock', 1860, 1180, 1.1, { free: true, isWaterStamp: true, z: 1, rot: 1.57 });

  // G) Ships anchored inside the Harbour Basin
  place('ship_galleon', 920, 1340, 1.25, { free: true, isWaterStamp: true, z: 2, rot: 0.08 });
  place('ship_caravel', 720, 1400, 1.05, { free: true, isWaterStamp: true, z: 2, rot: -0.12 });
  place('ship_caravel', 1100, 1400, 1.05, { free: true, isWaterStamp: true, z: 2, rot: -0.15 });
  place('ship_galleon', 1420, 1350, 1.2, { free: true, isWaterStamp: true, z: 2, rot: -0.05 });
  place('ship_caravel', 1640, 1380, 1.0, { free: true, isWaterStamp: true, z: 2, rot: 0.12 });
  place('ship_caravel', 1760, 1450, 0.95, { free: true, isWaterStamp: true, z: 2, rot: -0.08 });
  place('ship_galleon', 1200, 1480, 1.3, { free: true, isWaterStamp: true, z: 2, rot: 0.02 });

  // H) Harbour Breakwater Lighthouse & East Mole Tower
  place('cas_lighthouse', 460, 1280, 1.25, { free: true, isWaterStamp: true, z: 2 });
  place('cas_watchtower', 1940, 1280, 1.0, { free: true, isWaterStamp: true, z: 2 });

  // I) Outer Farms and Windmills outside the walls
  place('windmill', 340, 440, 1.05, { free: true, z: 1 });
  place('farm_homestead', 300, 620, 0.95, { free: true, z: 1 });
  place('farm_homestead', 260, 840, 1.0, { free: true, z: 1 });
  place('farm_homestead', 380, 980, 0.95, { free: true, z: 1 });
  place('farm_homestead', 1440, 190, 0.95, { free: true, z: 1 });
  place('windmill', 1780, 180, 1.0, { free: true, z: 1 });
  place('farm_homestead', 1880, 220, 0.9, { free: true, z: 1 });
  place('farm_homestead', 2120, 840, 1.0, { free: true, z: 1 });
  place('farm_homestead', 2220, 600, 0.95, { free: true, z: 1 });

  // -------------------------------------------------------------------------
  // 7. DENSE URBAN CITY BLOCKS ON JITTERED LATTICES
  // -------------------------------------------------------------------------

  // A) Compute city block bounding rectangles directly from street coordinates
  const blocks = [];

  // West Bank Columns & Rows
  const wCols = [
    [570, 730],
    [730, 890],
    [890, 990],
    [990, 1130]
  ];
  const wRows = [
    [390, 540],
    [540, 700],
    [700, 860],
    [860, 980],
    [980, 1080]
  ];

  for (let c = 0; c < wCols.length; c++) {
    for (let r = 0; r < wRows.length; r++) {
      // The Grand Market Square occupies [990, 1130] x [700, 860] (open square)
      if (c === 3 && r === 2) continue;
      const isCitadel = (c <= 1 && r === 0);
      blocks.push({
        id: `blk_w_${c}_${r}`,
        x0: wCols[c][0],
        x1: wCols[c][1],
        y0: wRows[r][0],
        y1: wRows[r][1],
        district: isCitadel ? 'citadel' : 'west'
      });
    }
  }

  // East Bank Columns & Rows
  const eCols = [
    [1260, 1410],
    [1410, 1570],
    [1570, 1710],
    [1710, 1820]
  ];
  const eRows = [
    [390, 540],
    [540, 715],
    [715, 860],
    [860, 980],
    [980, 1080]
  ];

  for (let c = 0; c < eCols.length; c++) {
    for (let r = 0; r < eRows.length; r++) {
      const isTemple = (c === 1 || c === 2) && r === 0;
      blocks.push({
        id: `blk_e_${c}_${r}`,
        x0: eCols[c][0],
        x1: eCols[c][1],
        y0: eRows[r][0],
        y1: eRows[r][1],
        district: isTemple ? 'temple' : 'east'
      });
    }
  }

  // B) Populate residential city blocks on a regular lattice with pitch 84 px
  const pitch = 84;
  const houseStamps = [];

  for (const blk of blocks) {
    // Keep citadel, temple, and market blocks free
    if (blk.district === 'citadel' || blk.district === 'temple' || blk.district === 'market') {
      continue;
    }

    const margin = 16;
    const bx0 = blk.x0 + margin;
    const bx1 = blk.x1 - margin;
    const by0 = blk.y0 + margin;
    const by1 = blk.y1 - margin;
    const bw = bx1 - bx0;
    const bh = by1 - by0;

    const nx = bw >= pitch ? Math.floor(bw / pitch) + 1 : 1;
    const ny = bh >= pitch ? Math.floor(bh / pitch) + 1 : 1;

    const startX = bx0 + (bw - pitch * (nx - 1)) / 2;
    const startY = by0 + (bh - pitch * (ny - 1)) / 2;

    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        // No random skips except 10%
        if (rnd() < 0.10) continue;

        const cx = startX + ix * pitch;
        const cy = startY + iy * pitch;

        // Bounded deterministic jitter +-3 px
        const jx = cx + R(-3, 3);
        const jy = cy + R(-3, 3);

        // Mix: 60% set_human_village, 25% set_human_town, 15% set_human_hamlet at scale 2.2
        const roll = rnd();
        let stampId, sc;
        if (roll < 0.60) {
          stampId = 'set_human_village';
          sc = Number(R(1.5, 1.8).toFixed(2));
        } else if (roll < 0.85) {
          stampId = 'set_human_town';
          sc = Number(R(1.5, 1.8).toFixed(2));
        } else {
          stampId = 'set_human_hamlet';
          sc = 2.2;
        }

        houseStamps.push({
          stampId,
          x: jx,
          y: jy,
          scale: sc
        });
      }
    }
  }

  // Sort stamps by y so lower ones draw over upper ones
  houseStamps.sort((a, b) => a.y - b.y);

  for (const h of houseStamps) {
    place(h.stampId, h.x, h.y, h.scale, { free: true, rot: 0, z: 0 });
  }

  // -------------------------------------------------------------------------
  // 8. RURAL WOODLANDS, ORCHARDS & COUNTRYSIDE DRESSING
  // -------------------------------------------------------------------------
  const ruralTrees = ['tr_oak', 'tr_round', 'tr_elm', 'tr_pine', 'tr_autumn_gold'];

  function plantGrove(cx, cy, radius, n, stampList) {
    let placed = 0;
    for (let i = 0; i < n * 12 && placed < n; i++) {
      const a = R(0, Math.PI * 2);
      const r = radius * Math.sqrt(rnd());
      const gx = cx + Math.cos(a) * r;
      const gy = cy + Math.sin(a) * r;
      if (place(pick(stampList), gx, gy, R(0.55, 0.85))) {
        placed++;
      }
    }
  }

  // West countryside groves (Oakhaven Woods)
  plantGrove(200, 360, 120, 14, ruralTrees);
  plantGrove(420, 360, 80, 8, ruralTrees);
  plantGrove(160, 720, 80, 8, ['tr_oak', 'tr_round']);
  plantGrove(180, 980, 90, 10, ['tr_oak', 'tr_round']);

  // North rolling hill woods
  plantGrove(650, 160, 110, 12, ['tr_pine', 'tr_oak', 'tr_elm']);
  plantGrove(1020, 150, 90, 10, ['tr_oak', 'tr_round']);
  plantGrove(1600, 120, 100, 10, ['tr_pine', 'tr_oak']);

  // East countryside woods (Sunfields Border)
  plantGrove(2150, 360, 120, 14, ruralTrees);
  plantGrove(2280, 760, 90, 10, ['tr_oak', 'tr_autumn_gold']);
  plantGrove(2180, 1080, 100, 10, ['tr_oak', 'tr_round']);

  // Riverbank willows and reeds north of the city
  for (let y = 40; y < 290; y += 45) {
    place('tr_willow', 1145 + R(-10, 8), y + R(-8, 8), R(0.7, 0.9));
    place('tr_willow', 1265 + R(-8, 10), y + R(-8, 8), R(0.7, 0.9));
  }

  // -------------------------------------------------------------------------
  // 9. LABELS (RICH CARTOGRAPHIC LABELS, ALL INSIDE CANVAS)
  // -------------------------------------------------------------------------
  let ti = 0;
  const label = (text, x, y, size, o = {}) => ({
    id: 'tx_' + (++ti),
    text,
    content: text,
    x: Math.round(x),
    y: Math.round(y),
    size,
    color: o.color || '#1e293b',
    stroke: o.stroke || '#f8fafc',
    font: o.font || 'Cinzel',
    curvature: o.curv || 0,
    ...(o.rot ? { rotation: o.rot } : {}),
    ...(o.tracking ? { tracking: o.tracking } : {})
  });

  const texts = [
    // 1. Map Title & Main Branding
    label('City: Port of Karrowmere', 1200, 1545, 42, {
      color: '#0f172a',
      stroke: '#f8fafc',
      tracking: 4
    }),

    // 2. Arced Harbour Name
    label('The Harbour of Karrowmere', 1200, 1390, 30, {
      color: '#0369a1',
      stroke: '#e0f2fe',
      curv: 0.12,
      tracking: 3
    }),

    // 3. Bay Sub-label
    label('Karrowmere Sound', 1580, 1475, 22, {
      font: 'MedievalSharp',
      color: '#075985',
      stroke: '#bae6fd'
    }),

    // 4. Citadel Hill & Castle Keep
    label('Citadel Hill', 720, 370, 22, {
      color: '#1e1b4b',
      stroke: '#fef3c7'
    }),
    label('High Keep of Karrow', 720, 495, 16, {
      font: 'MedievalSharp',
      color: '#312e81',
      stroke: '#ffffff'
    }),

    // 5. The Grand Market Square
    label('The Grand Market', 1030, 735, 20, {
      color: '#78350f',
      stroke: '#fef3c7'
    }),

    // 6. Temple Ward & Cathedral
    label('Temple Ward', 1580, 395, 22, {
      color: '#451a03',
      stroke: '#fef3c7'
    }),
    label('Cathedral of the Sun', 1580, 535, 16, {
      font: 'MedievalSharp',
      color: '#78350f',
      stroke: '#ffffff'
    }),

    // 7. City Districts
    label('Oldtown District', 740, 860, 22, {
      color: '#1c1917',
      stroke: '#fef3c7'
    }),
    label("Merchant's Quarter", 980, 570, 20, {
      color: '#1c1917',
      stroke: '#fef3c7'
    }),
    label("Artisans' Row", 1460, 720, 20, {
      color: '#1c1917',
      stroke: '#fef3c7'
    }),
    label("Fishermen's Wharf", 1480, 1030, 20, {
      color: '#1c1917',
      stroke: '#fef3c7'
    }),
    label('The Royal Docks', 960, 1155, 20, {
      color: '#0c4a6e',
      stroke: '#f0fdf4'
    }),
    label("Weaver's Green", 1660, 840, 17, {
      font: 'MedievalSharp',
      color: '#1c1917',
      stroke: '#fef3c7'
    }),

    // 8. River Mere & Bridges
    label('River Mere', 1220, 220, 18, {
      font: 'MedievalSharp',
      color: '#075985',
      stroke: '#e0f2fe',
      curv: 0.08
    }),
    label("King's Bridge", 1170, 515, 15, {
      font: 'MedievalSharp',
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('High Bridge', 1200, 675, 15, {
      font: 'MedievalSharp',
      color: '#1e293b',
      stroke: '#f8fafc'
    }),

    // 9. The 6 Named City Gates & Bastions
    label('West Gate', 470, 700, 16, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('North Gate', 880, 285, 16, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('River Water Gate', 1215, 295, 15, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('Moor Gate', 1640, 295, 16, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('East Gate', 1930, 720, 16, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('Harbour Gate', 920, 1095, 16, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('High Bastion', 1840, 320, 15, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),
    label('South Fort', 1840, 1170, 15, {
      color: '#1e293b',
      stroke: '#f8fafc'
    }),

    // 10. Nautical & Countryside Features
    label('Karrow Light', 460, 1340, 16, {
      font: 'MedievalSharp',
      color: '#0369a1',
      stroke: '#f0fdf4'
    }),
    label("Miller's Rise", 340, 380, 18, {
      font: 'MedievalSharp',
      color: '#3f6212',
      stroke: '#fefce8'
    }),
    label('Oakhaven Meadows', 280, 760, 20, {
      font: 'MedievalSharp',
      color: '#3f6212',
      stroke: '#fefce8'
    }),
    label('Sunfields', 2080, 560, 20, {
      font: 'MedievalSharp',
      color: '#3f6212',
      stroke: '#fefce8'
    }),
    label('The Kingsroad', 790, 140, 18, {
      font: 'MedievalSharp',
      color: '#78350f',
      stroke: '#fef3c7',
      curv: -0.06
    }),
    label('South Anchorage', 820, 1430, 18, {
      font: 'MedievalSharp',
      color: '#075985',
      stroke: '#e0f2fe'
    })
  ];

  // -------------------------------------------------------------------------
  // 10. PRESET RETURN OBJECT
  // -------------------------------------------------------------------------
  return {
    id: 'city_demo',
    title: 'City: Port of Karrowmere',
    type: 'battle',
    template: 'town',
    width: W,
    height: H,
    grid: {
      enabled: true,
      type: 'square',
      size: 60,
      opacity: 0.18,
      color: '#94a3b8',
      offsetX: 0,
      offsetY: 0,
      snap: true
    },
    atmosphere: {
      vignette: 0.15,
      parchmentGrain: 0.05,
      sepia: 0,
      brightness: 1.0
    },
    coastline: {
      ripplesEnabled: false,
      rippleCount: 3,
      rippleSpacing: 10,
      rippleColor: '#38bdf8',
      rippleOpacity: 0.25,
      sandEnabled: false,
      sandWidth: 6,
      sandColor: '#d4b276',
      outlineColor: '#2b2318',
      outlineWidth: 2.0,
      shadowEnabled: true,
      shadowBlur: 12,
      shadowColor: 'rgba(0, 0, 0, 0.4)'
    },
    layers: {
      c_terrain: { visible: true, opacity: 1, blend: 'source-over', name: 'Terrain & streets' },
      c_buildings: { visible: true, opacity: 1, blend: 'source-over', name: 'Buildings & structures' },
      c_water: { visible: true, opacity: 1, blend: 'source-over', name: 'Harbour & ships' }
    },
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts
  };
}
