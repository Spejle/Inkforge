// InkForge Region Preset: The Marchlands of Verrin
// A single-kingdom regional cartography preset with realistic hydrology,
// coastal shelf, settlements, roads, mountain spines, and rich nomenclature.
// Deterministic seeded PRNG (no Math.random).

import { getStampById } from '../stampsCatalog.js';

// STAMP ID TABLE: centralized reference mapping canonical visual elements to catalog stamps
const SS = {
  forest:     ['tr_oak', 'tr_round', 'tr_elm', 'tr_birch'],
  ancientOak: 'tr_oak_ancient',
  thicket:    'tr_thicket',
  snowPine:   ['tr_snowy_pine', 'tr_snowy_spruce'],
  pine:       ['tr_pine', 'tr_spruce'],
  willow:     'tr_willow',
  dead:       'tr_dead',
  autumn:     'tr_autumn_gold',
  reeds:      'veg_reeds',
  lily:       'nature_lily_pond',
  boulder:    'boulder_cluster',

  mtn:        ['mountain_grand', 'mountain_range'],
  mtnSnow:    'mountain_snow_peak',
  hills:      'hills_rolling',

  city:       'set_human_city',
  town:       'set_human_town',
  village:    'set_human_village',
  elfHamlet:  'set_elf_hamlet',
  dwarfHold:  'set_dwarf_village',

  castle:     'cas_human_castle',
  ruinCastle: 'cas_ruin_castle',
  ruinTower:  'cas_ruin_tower',
  dwarfGate:  'cas_dwarf_mountain_hold',
  elfTreehold:'cas_elf_treehold',
  watchtower: 'cas_watchtower',
  mine:       'cas_mine_entrance',
  stones:     'cas_standing_stones',
  lighthouse: 'cas_lighthouse',

  mill:       'windmill',
  millR:      'windmill_rustic',
  farm:       'farm_homestead',
  port:       'port_dock',
  bridge:     'bridge_stone',

  compass:    'compass_rose',
  ships:      ['ship_caravel', 'ship_galleon'],
  kraken:     'nautical_kraken',
  serpent:    'sea_serpent',
  whirlpool:  'nautical_whirlpool'
};

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

// dense sampling of the renderer's midpoint-quadratic smoothing (closed polygon / open polyline)
function _quad(p0, c, p1, out, n) {
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
}
const _mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function _smoothPoly(pts, n = 6) {
  const out = [], N = pts.length;
  let cur = _mid(pts[N - 1], pts[0]);
  out.push(cur);
  for (let i = 0; i < N; i++) {
    const nxt = _mid(pts[i], pts[(i + 1) % N]);
    _quad(cur, pts[i], nxt, out, n);
    cur = nxt;
  }
  return out;
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
function _inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function _distSeg(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
}
function _distPoly(x, y, poly) {
  let m = 1e9;
  for (let i = 0; i < poly.length; i++) m = Math.min(m, _distSeg(x, y, poly[i], poly[(i + 1) % poly.length]));
  return m;
}
function _distLine(x, y, line) {
  let m = 1e9;
  for (let i = 0; i < line.length - 1; i++) m = Math.min(m, _distSeg(x, y, line[i], line[i + 1]));
  return m;
}
function _nearestOn(x, y, line) {
  let best = null, bd = 1e9;
  for (const p of line) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = p; } }
  return best;
}
function _allCrossings(l1, l2) {
  const crossings = [];
  for (let i = 0; i < l1.length - 1; i++) {
    for (let j = 0; j < l2.length - 1; j++) {
      const [a, b, c, d] = [l1[i], l1[i + 1], l2[j], l2[j + 1]];
      const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
      if (Math.abs(den) < 1e-6) continue;
      const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
      const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        crossings.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    }
  }
  return crossings;
}

export function buildRegion() {
  const W = 2800, H = 1800;
  const rnd = _rng(20261015);
  const R = (a, b) => a + (b - a) * rnd();
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  // ---------------- LANDMASSES ----------------
  // Organic single kingdom landmass with open sea touching south and west shores,
  // featuring coastal bays, headlands, prominent peninsulas, inlets, and ragged northern/eastern edges.
  const L = (id, biome, points) => ({ id, biome, points });
  const landmasses = [
    L('verrin_mainland', 'grassland', [
      // 1. Northwest Coast & Headlands
      [420, 70], [380, 140], [430, 210], [370, 270],
      // 2. The Deep Inlet (Silver Sound) reaching east toward Hermit's Tor
      [350, 320], [410, 345], [470, 360], [430, 395], [360, 430],
      // 3. The West Peninsula (Talon Peninsula) jutting westward into the ocean
      [330, 490], [270, 540], [250, 600], [260, 640], [300, 680], [340, 720],
      // 4. Mist Cove & North Headland of the Bay of Verrin
      [390, 760], [410, 810], [370, 860], [430, 885],
      // 5. Bay of Verrin: sheltered northern shore, port entrance, and inner cove
      [520, 905], [630, 915], [740, 930], [840, 960], [910, 985],
      // Shoreline curving at Verrinport and river mouth
      [935, 1025], [925, 1070], [860, 1095], [770, 1125], [660, 1140], [540, 1145], [440, 1155],
      // 6. South Headland of the Bay (Cape Verrin)
      [360, 1190], [300, 1250], [330, 1310], [370, 1370], [400, 1420],
      // 7. Southwest Dunwater Delta Estuary (Mire of Sorrows mouth)
      [430, 1465], [480, 1495], [550, 1520], [630, 1510], [700, 1490], [750, 1525], [800, 1555],
      // 8. South Coast (Sea of Storms): organic bays, headlands, and coves
      [860, 1575], [920, 1530], [990, 1515], [1070, 1535],
      [1150, 1590], [1220, 1625], [1290, 1610],
      [1370, 1560], [1450, 1540], [1530, 1550], [1620, 1590],
      [1710, 1635], [1790, 1655], [1870, 1630],
      [1950, 1575], [2040, 1560], [2120, 1595],
      [2200, 1640], [2280, 1615], [2360, 1570], [2450, 1585],
      [2540, 1630], [2620, 1600], [2700, 1565], [2740, 1520],
      // 9. Eastern Land Border: ragged coast fading out with sounds and rocky capes
      [2755, 1450], [2680, 1395], [2720, 1335], [2765, 1275], [2740, 1210],
      [2675, 1145], [2655, 1075], [2725, 1010], [2760, 940], [2725, 870],
      [2680, 800], [2735, 730], [2765, 650], [2720, 570], [2685, 490],
      [2735, 410], [2765, 330], [2720, 250], [2745, 170], [2720, 95],
      // 10. Northern Land Border: ragged coast fading out with alpine fjords and cliffs
      [2640, 65], [2560, 95], [2490, 135], [2410, 85], [2330, 55],
      [2250, 85], [2170, 125], [2090, 75], [2010, 65],
      [1920, 105], [1840, 65], [1750, 95], [1660, 55], [1570, 85],
      [1480, 115], [1390, 65], [1300, 85], [1210, 125], [1120, 65],
      [1020, 85], [920, 115], [820, 65], [710, 95], [610, 65], [510, 105]
    ]),
    // Coastal island guarding the Bay of Verrin entrance
    L('isle_lantern', 'grassland', [
      [360, 990], [410, 960], [450, 1000], [420, 1050], [350, 1030]
    ]),
    // Small rocky islet in the southern waters
    L('isle_merrow', 'grassland', [
      [560, 1660], [620, 1630], [670, 1670], [630, 1720], [550, 1700]
    ])
  ];

  const land = landmasses.map((l) => ({ id: l.id, poly: _smoothPoly(l.points) }));
  const mainLand = land.filter((l) => !l.id.endsWith('_core'));
  const coastDist = (x, y) => {
    for (const l of mainLand) if (_inPoly(x, y, l.poly)) return _distPoly(x, y, l.poly);
    return -1;
  };

  // Lake carved from the land mask + exclusion blob for stamps
  const lakes = [
    { id: 'lake_mirren', pts: [[1810, 640], [1880, 670], [1950, 650]], size: 100 }
  ];
  const lakeBlobs = lakes.map((k) => ({
    x: (k.pts[0][0] + k.pts[k.pts.length - 1][0]) / 2,
    y: (k.pts[0][1] + k.pts[k.pts.length - 1][1]) / 2,
    r: k.size / 2 + 30
  }));

  // ---------------- HYDROLOGY: TWO REALISTIC RIVER SYSTEMS ----------------
  // Meandering river generator using sine-wave lateral offsets that grow downstream plus seeded noise
  function makeRiver(waypoints, targetPoints = 75, meanderAmp = 22, freq = 3.5, seed = 12345) {
    const rng = _rng(seed);
    const baseSpine = _smoothLine(waypoints, 12);
    const spineLens = [];
    let spineTotal = 0;
    for (let i = 0; i < baseSpine.length - 1; i++) {
      const d = Math.hypot(baseSpine[i + 1][0] - baseSpine[i][0], baseSpine[i + 1][1] - baseSpine[i][1]);
      spineLens.push(d);
      spineTotal += d;
    }

    const pts = [];
    const phase1 = rng() * Math.PI * 2;
    const phase2 = rng() * Math.PI * 2;

    for (let i = 0; i < targetPoints; i++) {
      const t = i / (targetPoints - 1);
      const targetDist = t * spineTotal;

      let accum = 0;
      for (let j = 0; j < spineLens.length; j++) {
        if (accum + spineLens[j] >= targetDist || j === spineLens.length - 1) {
          const p0 = baseSpine[j];
          const p1 = baseSpine[j + 1] || p0;
          const subT = spineLens[j] > 0 ? (targetDist - accum) / spineLens[j] : 0;
          const bx = p0[0] + subT * (p1[0] - p0[0]);
          const by = p0[1] + subT * (p1[1] - p0[1]);

          const dx = p1[0] - p0[0];
          const dy = p1[1] - p0[1];
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;

          const growth = Math.pow(t, 1.15);
          const s1 = Math.sin(t * freq * Math.PI * 2 + phase1);
          const s2 = Math.sin(t * freq * 2.1 * Math.PI * 2 + phase2) * 0.4;
          const noise = (rng() - 0.5) * 0.35;
          const latOffset = (i === 0 || i === targetPoints - 1) ? 0 : (s1 + s2 + noise) * meanderAmp * growth;

          pts.push([Math.round(bx + nx * latOffset), Math.round(by + ny * latOffset)]);
          break;
        }
        accum += spineLens[j];
      }
    }
    pts[0] = [waypoints[0][0], waypoints[0][1]];
    pts[pts.length - 1] = [waypoints[waypoints.length - 1][0], waypoints[waypoints.length - 1][1]];
    return pts;
  }

  const paths = [];
  const rivers = [];

  const addSegmentedRiver = (id, pts, widths) => {
    const numSegs = widths.length;
    const n = pts.length;
    for (let s = 0; s < numSegs; s++) {
      const startIdx = Math.floor((s / numSegs) * n);
      const i0 = Math.max(0, startIdx > 0 ? startIdx - 1 : 0);
      const i1 = s === numSegs - 1 ? n : Math.min(n, Math.floor(((s + 1) / numSegs) * n) + 1);
      const segPts = pts.slice(i0, i1);
      const segId = `${id}_s${s + 1}`;
      paths.push({ id: segId, type: 'river', width: widths[s], color: '#2b5c8f', points: segPts });
      rivers.push({ id: segId, width: widths[s], dense: _smoothLine(segPts) });
    }
  };

  // RIVER SYSTEM 1: River Celadon (Mountain runoff -> Lake Mirren -> Bay of Verrin)
  // 1a. Upper Celadon: mountain runoff flowing into Lake Mirren (65 points, widening downstream)
  const celadonUpperPts = makeRiver([
    [2380, 340], [2250, 410], [2120, 500], [2020, 570], [1950, 650]
  ], 65, 14, 3.2, 301);
  addSegmentedRiver('r_celadon_upper', celadonUpperPts, [7, 10]);

  // 1b. Celadon Main: leaves Lake Mirren, meanders west, reaches Bay of Verrin with mouth IN the sea (85 points)
  const celadonMainPts = makeRiver([
    [1810, 640], [1710, 680], [1590, 730], [1460, 770], [1330, 810], [1210, 850], [1100, 890], [1010, 940], [940, 1000], [880, 1035]
  ], 85, 24, 3.8, 302);
  addSegmentedRiver('r_celadon_main', celadonMainPts, [9, 14, 20]);

  // 1c. Tributary Silverbrook: starts in northern crags, joins Celadon main exactly on its polyline (65 points)
  const silverJoinPt = _nearestOn(1360, 790, celadonMainPts);
  const silverbrookPts = makeRiver([
    [1380, 260], [1360, 390], [1330, 520], [1360, 660], silverJoinPt
  ], 65, 16, 3.4, 303);
  silverbrookPts[silverbrookPts.length - 1] = silverJoinPt;
  addSegmentedRiver('r_silverbrook', silverbrookPts, [6, 9]);

  // 1d. Tributary Whisper Creek: leaves Whisperwood, joins Celadon main exactly on its polyline (65 points)
  const whisperJoinPt = _nearestOn(1120, 880, celadonMainPts);
  const whisperPts = makeRiver([
    [880, 480], [960, 580], [1040, 680], [1090, 790], whisperJoinPt
  ], 65, 15, 3.5, 304);
  whisperPts[whisperPts.length - 1] = whisperJoinPt;
  addSegmentedRiver('r_whisper_creek', whisperPts, [6, 9]);

  // RIVER SYSTEM 2: River Dunwater (Eastern plateau -> Southern valley -> Delta marshland IN the sea)
  // 2a. Dunwater Main: starts in eastern highlands, flows west, ends IN the sea past delta (105 points)
  const dunwaterMainPts = makeRiver([
    [2550, 880], [2380, 950], [2180, 1030], [1950, 1100], [1720, 1170], [1490, 1230], [1260, 1290], [1040, 1340], [840, 1400], [660, 1450], [500, 1500], [340, 1540]
  ], 105, 26, 4.2, 401);
  addSegmentedRiver('r_dunwater_main', dunwaterMainPts, [10, 15, 22]);

  // 2b. Tributary Highland Beck: starts in Cragspire slopes, joins Dunwater main exactly on its polyline (65 points)
  const beckJoinPt = _nearestOn(1820, 1140, dunwaterMainPts);
  const beckPts = makeRiver([
    [2180, 720], [2080, 820], [1980, 930], [1890, 1040], beckJoinPt
  ], 65, 16, 3.6, 402);
  beckPts[beckPts.length - 1] = beckJoinPt;
  addSegmentedRiver('r_highland_beck', beckPts, [7, 10]);

  // 2c. Tributary Broadwater Fork: starts south of Oakhaven, joins Dunwater main exactly on its polyline (65 points)
  const forkJoinPt = _nearestOn(1310, 1280, dunwaterMainPts);
  const forkPts = makeRiver([
    [1420, 990], [1370, 1070], [1330, 1160], forkJoinPt
  ], 65, 15, 3.4, 403);
  forkPts[forkPts.length - 1] = forkJoinPt;
  addSegmentedRiver('r_broadwater_fork', forkPts, [6, 9]);

  // ---------------- SETTLEMENTS & SITES ----------------
  const P = {};
  const defPlace = (key, name, x, y) => (P[key] = { key, name, x, y });
  defPlace('verrinport', 'Verrinport', 980, 1020);           // 1 City: Port city
  defPlace('oakhaven', 'Oakhaven', 1420, 860);               // Town 1: Central trade crossroad
  defPlace('ironford', 'Ironford', 1060, 1320);              // Town 2: Southern river town
  defPlace('eldershade', 'Eldershade', 720, 520);            // Village 1: Elven forest hamlet
  defPlace('stonepeak', 'Stonepeak Hold', 2240, 390);        // Village 2: Dwarven mountain hold
  defPlace('briarglen', 'Briar Glen', 1740, 1120);           // Village 3: Human farming village
  defPlace('castle_verrin', 'Castle Verrin', 1180, 720);     // 1 Castle: Royal seat
  defPlace('duskfell', 'Duskfell Keep', 1960, 880);          // 1 Ruined Castle
  defPlace('lantern_pt', 'Lantern Point', 400, 1000);        // Lighthouse island
  defPlace('hermits_tor', 'Hermit\'s Tor', 540, 360);        // Ancient standing stones
  defPlace('mirewatch', 'Mirewatch', 620, 1420);             // Marshland watchtower

  // ---------------- ROADS & BRIDGES ----------------
  const road = (id, pts, sea = false) => paths.push({
    id,
    type: 'road',
    width: sea ? 4 : (id.startsWith('rd_trade') ? 6 : 5),
    color: sea ? '#7c4a2a' : (id.startsWith('rd_trade') ? '#78350f' : '#8a5a36'),
    dashed: true,
    points: pts
  });
  const A = (k) => [P[k].x, P[k].y];

  // Helper to build a gently curving road between waypoints with small seeded lateral offsets
  const makeCurvingRoad = (waypoints, subdivisions = 3, curveAmp = 9, seed = 54321) => {
    const rng = _rng(seed);
    const out = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[i];
      const p1 = waypoints[i + 1];
      if (i === 0) out.push([p0[0], p0[1]]);

      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const sign = rng() > 0.5 ? 1 : -1;

      for (let s = 1; s <= subdivisions; s++) {
        const t = s / (subdivisions + 1);
        const bx = p0[0] + t * dx;
        const by = p0[1] + t * dy;
        const curve = Math.sin(t * Math.PI) * curveAmp * sign + (rng() - 0.5) * (curveAmp * 0.4);
        out.push([Math.round(bx + nx * curve), Math.round(by + ny * curve)]);
      }
      out.push([p1[0], p1[1]]);
    }
    return out;
  };

  // Primary Trade Roads (Curving highways connecting settlements exactly)
  road('rd_trade_port_castle', makeCurvingRoad([A('verrinport'), [1050, 930], [1120, 820], A('castle_verrin')], 3, 10, 101));
  road('rd_trade_castle_oak', makeCurvingRoad([A('castle_verrin'), [1260, 760], [1340, 800], A('oakhaven')], 3, 9, 102));
  road('rd_trade_oak_stonepeak', makeCurvingRoad([A('oakhaven'), [1580, 820], [1740, 770], [1880, 730], [2040, 610], [2150, 490], A('stonepeak')], 3, 10, 103));
  road('rd_trade_oak_briar', makeCurvingRoad([A('oakhaven'), [1520, 940], [1630, 1020], A('briarglen')], 3, 9, 104));
  road('rd_trade_briar_ironford', makeCurvingRoad([A('briarglen'), [1580, 1170], [1410, 1210], [1230, 1260], A('ironford')], 3, 10, 105));
  road('rd_trade_ironford_port', makeCurvingRoad([A('ironford'), [1030, 1220], [1000, 1120], A('verrinport')], 3, 9, 106));

  // Secondary Dirt Roads (Gently curving country tracks)
  road('rd_dirt_castle_elder', makeCurvingRoad([A('castle_verrin'), [1040, 670], [880, 590], A('eldershade')], 3, 8, 201));
  road('rd_dirt_elder_tor', makeCurvingRoad([A('eldershade'), [630, 440], A('hermits_tor')], 3, 8, 202));
  road('rd_dirt_oak_duskfell', makeCurvingRoad([A('oakhaven'), [1600, 870], [1780, 880], A('duskfell')], 3, 8, 203));
  road('rd_dirt_ironford_mire', makeCurvingRoad([A('ironford'), [910, 1360], [760, 1390], A('mirewatch')], 3, 8, 204));
  road('rd_dirt_mountain_pass', makeCurvingRoad([A('stonepeak'), [2360, 340], [2480, 290], [2600, 250]], 3, 8, 205));

  // Sea routes (shipping lanes from Verrinport into open water)
  road('sea_lane_west', [[920, 1020], [780, 1010], [620, 1030], [460, 1010], [300, 980], [140, 940]], true);
  road('sea_lane_south', [[460, 1010], [320, 1160], [240, 1340], [210, 1540]], true);

  // Bridges computed exactly from intersections where land roads cross rivers
  const roadsDense = paths
    .filter((p) => p.type === 'road' && !p.id.startsWith('sea_'))
    .map((p) => ({ id: p.id, dense: _smoothLine(p.points) }));
  const bridges = [];
  for (const rd of roadsDense) {
    for (const rv of rivers) {
      if (rv.width < 7) continue;
      const crossings = _allCrossings(rd.dense, rv.dense);
      for (const c of crossings) {
        if (!bridges.some((b) => Math.hypot(b.x - c[0], b.y - c[1]) < 30)) {
          bridges.push({ x: Math.round(c[0]), y: Math.round(c[1]) });
        }
      }
    }
  }

  // ---------------- STAMP PLACEMENT ENGINE ----------------
  const stamps = [];
  const occ = [];
  const roadLines = roadsDense.map((r) => r.dense);
  const riverLines = rivers.map((r) => ({ d: r.dense, w: r.width }));
  let sid = 0;

  const dim = (stampId, scale) => {
    const asp = getStampById(stampId)?.aspect || 1;
    const size = 80 * scale;
    return { rx: size * asp * 0.42, ry: size * 0.4 };
  };
  const hit = (a, b) => ((a.x - b.x) / (a.rx + b.rx)) ** 2 + ((a.y - b.y) / (a.ry + b.ry)) ** 2 < 1;

  function place(stampId, x, y, scale, o = {}) {
    const d = dim(stampId, scale);
    const fit = o.fit || 1;
    const box = { x, y, rx: d.rx * fit + (o.pad || 0), ry: d.ry * fit + (o.pad || 0) };

    // Canvas boundary safety: keep every stamp comfortably within canvas limits
    if (x < d.rx + 8 || x > W - d.rx - 8 || y < d.ry + 8 || y > H - d.ry - 8) return false;

    if (!o.free) {
      // Land stamps must stay safely inside landmass and off coastlines
      if (coastDist(x, y) < (o.margin ?? Math.max(d.rx, d.ry) + 16)) return false;
      // Clearance from roads, rivers, and carved lake water
      if (!o.onRoad) for (const l of roadLines) if (_distLine(x, y, l) < d.rx * 0.5 + 8) return false;
      for (const r of riverLines) if (_distLine(x, y, r.d) < d.rx * 0.55 + r.w / 2 + 6) return false;
      for (const k of lakeBlobs) if (Math.hypot(x - k.x, y - k.y) < k.r + d.rx * 0.5) return false;
      for (const b of occ) if (hit(box, b)) return false;
    }
    occ.push(box);
    stamps.push({
      id: 'st' + ++sid,
      stampId,
      x: Math.round(x),
      y: Math.round(y),
      scale: +scale.toFixed(2),
      rotation: o.rot || 0,
      zIndex: o.z || 0,
      ...(o.layer ? { layer: o.layer } : {}),
      ...(o.flipX ? { flipX: true } : {})
    });
    return true;
  }

  const bbox = (poly) => {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  };

  function scatter(poly, n, ids, sc, o = {}) {
    const [x0, x1, y0, y1] = bbox(poly);
    let placed = 0;
    for (let i = 0; i < n * 45 && placed < n; i++) {
      const x = R(x0, x1), y = R(y0, y1);
      if (!_inPoly(x, y, poly)) continue;
      if (place(pick(ids), x, y, R(sc[0], sc[1]), o)) placed++;
    }
  }

  function groves(poly, centres, perGrove, spread, ids, sc, o = {}) {
    const [x0, x1, y0, y1] = bbox(poly);
    let c = 0;
    for (let i = 0; i < centres * 60 && c < centres; i++) {
      const cx = R(x0, x1), cy = R(y0, y1);
      if (!_inPoly(cx, cy, poly)) continue;
      c++;
      for (let k = 0, n = 0; k < perGrove * 8 && n < perGrove; k++) {
        const a = R(0, 6.283), r = spread * Math.sqrt(rnd());
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8;
        if (_inPoly(x, y, poly) && place(pick(ids), x, y, R(sc[0], sc[1]), o)) n++;
      }
    }
  }

  function along(line, step, ids, sc, jitter, o = {}) {
    const d = _smoothLine(line, 10);
    let acc = 0;
    for (let i = 1; i < d.length; i++) {
      acc += Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]);
      if (acc < step) continue;
      acc = 0;
      place(pick(ids), d[i][0] + R(-jitter, jitter), d[i][1] + R(-jitter, jitter) * 0.7, R(sc[0], sc[1]), o);
    }
  }

  const T = 'c_terrain', SEA = 'c_sea';
  const TREE = { layer: T, fit: 0.5 }, MTN = { layer: T, fit: 0.6 };

  // 1. SETTLEMENTS & CASTLES (Scaled up ~1.6x for prominent cartographic visibility)
  const sett = (key, stampId, scale, dx = 0, dy = 0) => place(stampId, P[key].x + dx, P[key].y + dy, scale, { free: true, z: 1, pad: 12 });

  // 1 City: Verrinport (Bay port metropolis) - scale raised 1.6x (1.6 -> 2.56)
  sett('verrinport', SS.city, 2.56);
  sett('verrinport', SS.mill, 0.85, 105, -100);
  sett('verrinport', SS.farm, 0.8, 135, -35);
  place(SS.port, 920, 1025, 1.25, { free: true, layer: SEA, z: 1 });

  // 2 Towns: Oakhaven & Ironford - scales raised 1.6x (1.55 -> 2.48)
  sett('oakhaven', SS.town, 2.48);
  sett('oakhaven', SS.mill, 0.85, -105, -55);
  sett('oakhaven', SS.farm, 0.85, 110, 35);

  sett('ironford', SS.town, 2.48);
  sett('ironford', SS.millR, 0.85, -110, -70);
  sett('ironford', SS.farm, 0.85, 110, 45);

  // 3 Villages: Eldershade (Elven), Stonepeak Hold (Dwarven), Briar Glen (Human)
  sett('eldershade', SS.elfHamlet, 2.56);
  sett('eldershade', SS.elfTreehold, 1.84, 95, -50);

  sett('stonepeak', SS.dwarfHold, 2.56);
  sett('stonepeak', SS.dwarfGate, 1.92, 105, -50);
  sett('stonepeak', SS.mine, 1.44, -95, -60);

  sett('briarglen', SS.village, 2.40);
  sett('briarglen', SS.farm, 0.85, 105, 45);
  sett('briarglen', SS.millR, 0.85, -95, -60);

  // 1 Castle: Castle Verrin - scale raised 1.6x (1.5 -> 2.40)
  sett('castle_verrin', SS.castle, 2.40);
  sett('castle_verrin', SS.watchtower, 1.44, -95, -55);

  // 1 Ruined Castle: Duskfell Keep - scale raised 1.6x (1.5 -> 2.40)
  sett('duskfell', SS.ruinCastle, 2.40);
  sett('duskfell', SS.ruinTower, 1.52, 95, -45);

  // Outlying landmarks & towers - scales raised 1.6x
  sett('lantern_pt', SS.lighthouse, 1.76);
  sett('hermits_tor', SS.stones, 1.92);
  sett('mirewatch', SS.watchtower, 1.60);

  // Stone arch bridges placed exactly at computed road/river intersections
  bridges.forEach((b) => place(SS.bridge, b.x, b.y, 0.65, { free: true, z: 1 }));

  // 2. NORTH-EAST BORDER MOUNTAINS (Cragspire Range)
  along([[1760, 520], [1940, 440], [2140, 360], [2340, 260], [2520, 180], [2660, 140]], 72, SS.mtn, [1.1, 1.45], 16, MTN);
  along([[1920, 340], [2120, 250], [2320, 170], [2490, 115]], 80, [SS.mtnSnow], [1.0, 1.3], 12, MTN);
  along([[1620, 620], [1800, 550], [2020, 480], [2220, 420], [2440, 350], [2600, 300]], 90, [SS.hills], [0.85, 1.15], 16, MTN);
  scatter([[2100, 300], [2400, 240], [2450, 400], [2150, 450]], 5, [SS.boulder], [0.7, 0.95], MTN);

  // Rolling hills in the north and along valley rims
  scatter([[1240, 420], [1320, 380], [1400, 440], [1300, 500]], 4, [SS.hills], [0.8, 1.05], MTN);
  scatter([[1880, 840], [1980, 820], [2060, 900], [1920, 940]], 4, [SS.hills], [0.85, 1.1], MTN);
  scatter([[460, 280], [520, 240], [580, 300], [480, 360]], 3, [SS.hills], [0.8, 1.0], MTN);

  // 3. FORESTS (The Whisperwood and woodland groves)
  groves([[540, 320], [740, 260], [920, 300], [1080, 440], [1060, 620], [920, 680], [720, 660], [560, 540]], 22, 14, 65, SS.forest, [0.65, 0.95], TREE);
  scatter([[620, 380], [840, 350], [980, 480], [800, 580]], 8, [SS.ancientOak, SS.forest[3]], [0.8, 1.15], TREE);
  scatter([[580, 460], [700, 400], [860, 500], [740, 600]], 6, [SS.thicket], [0.7, 0.95], TREE);

  // Southern river valley groves & autumn woods
  groves([[1450, 1300], [1650, 1260], [1850, 1220], [1780, 1350], [1550, 1380]], 6, 7, 50, SS.forest, [0.6, 0.85], TREE);
  groves([[780, 1240], [920, 1200], [960, 1280], [820, 1320]], 4, 6, 45, [SS.forest[0], SS.forest[1], SS.autumn], [0.6, 0.8], TREE);

  // High mountain conifers
  groves([[2000, 220], [2250, 160], [2450, 120], [2300, 250]], 4, 5, 45, SS.snowPine, [0.6, 0.85], TREE);

  // Marshland flora at River Dunwater mouth
  scatter([[420, 1440], [540, 1400], [660, 1420], [680, 1500], [560, 1530], [440, 1510]], 8, [SS.dead], [0.6, 0.85], TREE);
  scatter([[450, 1460], [560, 1420], [640, 1440], [620, 1500], [500, 1510]], 10, [SS.reeds], [0.55, 0.75], TREE);
  scatter([[480, 1440], [580, 1410], [650, 1460], [560, 1490]], 4, [SS.willow], [0.65, 0.85], TREE);
  place(SS.lily, 530, 1480, 0.85, { layer: T, margin: 16 });

  // 4. NAUTICAL DRESSING & SEA LIFE (in bay and western/southern waters)
  const sea = (id, x, y, sc, rot = 0, flip = false) => place(id, x, y, sc, { free: true, layer: SEA, z: 2, rot, flipX: flip });
  sea(SS.ships[0], 840, 1000, 1.05, 0.1);
  sea(SS.ships[1], 760, 1050, 1.1, -0.08);
  sea(SS.ships[0], 660, 980, 0.95, 0.15);
  sea(SS.ships[1], 540, 1030, 1.0, -0.05, true);
  sea(SS.compass, 220, 1620, 2.0);
  sea(SS.serpent, 190, 620, 1.2, 0.12);
  sea(SS.kraken, 950, 1680, 1.25);
  sea(SS.whirlpool, 180, 360, 1.0);

  // ---------------- BIOME BRUSHES (Visible feathered transitions across landscape) ----------------
  let bi = 0;
  const brush = (biome, size, soft, op, pts) => ({
    id: 'bb' + ++bi,
    type: 'brush',
    target: 'foreground',
    biome,
    size,
    opacity: op,
    softness: soft,
    blendMode: 'source-over',
    points: pts.map(([x, y]) => ({ x, y }))
  });

  const brushStrokes = [
    // Lake water carving mask
    ...lakes.map((k) => ({
      id: k.id,
      type: 'mask',
      mode: 'water',
      size: k.size,
      points: k.pts.map(([x, y]) => ({ x, y }))
    })),

    // 1. Farmland patches around towns, city, and agricultural plain
    // Around Oakhaven (central market town)
    brush('farmland', 170, 0.85, 0.85, [[1340, 810], [1420, 780], [1500, 810], [1540, 860]]),
    brush('farmland', 180, 0.85, 0.85, [[1420, 880], [1500, 920], [1560, 960], [1480, 1000]]),
    brush('farmland', 160, 0.85, 0.80, [[1340, 890], [1380, 940], [1440, 980]]),
    // Around Verrinport (port city hinterland)
    brush('farmland', 170, 0.85, 0.85, [[1020, 940], [1090, 970], [1160, 1000], [1120, 1060]]),
    brush('farmland', 160, 0.85, 0.80, [[1040, 1030], [1110, 1070], [1170, 1110]]),
    // Around Ironford (southern river town)
    brush('farmland', 170, 0.85, 0.85, [[970, 1260], [1050, 1280], [1130, 1290], [1190, 1310]]),
    brush('farmland', 165, 0.85, 0.85, [[1010, 1340], [1080, 1370], [1150, 1390]]),
    // Around Briar Glen (farming village)
    brush('farmland', 170, 0.85, 0.85, [[1660, 1080], [1730, 1100], [1810, 1120], [1860, 1160]]),
    brush('farmland', 160, 0.85, 0.80, [[1700, 1150], [1760, 1190], [1820, 1220]]),
    // The Golden Weald central cultivation belt
    brush('farmland', 190, 0.85, 0.82, [[1420, 990], [1510, 1040], [1600, 1080], [1530, 1140], [1440, 1110]]),

    // 2. Forest floor under the Whisperwood and valley woodlands
    brush('forest_floor', 230, 0.88, 0.75, [[600, 360], [720, 330], [860, 350], [980, 400]]),
    brush('forest_floor', 240, 0.88, 0.78, [[660, 450], [790, 440], [920, 480], [1010, 520]]),
    brush('forest_floor', 230, 0.88, 0.75, [[620, 550], [750, 560], [880, 590], [960, 630]]),
    brush('forest_floor', 180, 0.85, 0.70, [[680, 490], [740, 520], [780, 550]]),
    // Southern river valley forest floors
    brush('forest_floor', 190, 0.85, 0.68, [[1480, 1290], [1620, 1270], [1760, 1250], [1840, 1280]]),
    brush('forest_floor', 170, 0.85, 0.65, [[820, 1240], [910, 1220], [950, 1280]]),

    // 3. Tundra and alpine snow near the Cragspire Mountains
    // High peaks: crisp snow
    brush('snow', 130, 0.85, 0.85, [[1980, 310], [2140, 230], [2300, 160], [2460, 100], [2580, 70]]),
    brush('snow', 110, 0.85, 0.80, [[2100, 270], [2260, 190], [2420, 130], [2520, 90]]),
    // Mountain flanks & foothills: mossy tundra transition
    brush('tundra', 170, 0.85, 0.80, [[1840, 430], [2020, 350], [2220, 270], [2400, 200], [2560, 140]]),
    brush('tundra', 180, 0.85, 0.75, [[1740, 510], [1920, 440], [2120, 380], [2320, 310], [2500, 240]]),
    brush('tundra', 140, 0.85, 0.70, [[1900, 840], [1980, 870], [2060, 910]]),
    // Badlands rocky bluffs
    brush('badlands', 150, 0.85, 0.60, [[1920, 460], [2100, 390], [2300, 300], [2480, 220]]),

    // 4. Swamp mire at the Dunwater delta (Mire of Sorrows)
    brush('swamp_mire', 210, 0.85, 0.92, [[400, 1510], [480, 1480], [580, 1460], [670, 1470], [620, 1530]]),
    brush('swamp_mire', 180, 0.85, 0.88, [[460, 1440], [550, 1420], [640, 1420], [710, 1450]]),
    brush('swamp_mire', 160, 0.85, 0.90, [[360, 1530], [440, 1520], [520, 1540]])
  ];

  // ---------------- LABELS & TYPOGRAPHY ----------------
  let ti = 0;
  const label = (text, x, y, size, o = {}) => ({
    id: 'tx' + ++ti,
    text,
    content: text,
    x,
    y,
    size,
    color: o.color || '#271b12',
    stroke: o.stroke || '#fef3c7',
    font: o.font || 'Cinzel',
    curvature: o.curv || o.curvature || 0,
    ...(o.rot ? { rotation: o.rot } : {}),
    ...(o.tracking ? { tracking: o.tracking } : {})
  });

  const sea1 = { color: '#e0f2fe', stroke: '#0c2a4d' };

  const texts = [
    // Title Banner
    label('THE MARCHLANDS OF VERRIN', 1400, 140, 52, { color: '#3b2412', stroke: '#fde68a', curv: 0.08, tracking: 5 }),

    // Major Geographic Features & Realms
    label('CRAGSPIRE MOUNTAINS', 2220, 210, 34, { color: '#3d2b1f', stroke: '#ffffff', curv: -0.06, tracking: 8 }),
    label('The Whisperwood', 800, 360, 30, { font: 'MedievalSharp', color: '#14532d', stroke: '#dcfce7', curv: 0.06 }),
    label('Bay of Verrin', 650, 1020, 28, { ...sea1, curv: 0.08 }),
    label('Lake Mirren', 1880, 600, 20, { font: 'MedievalSharp', color: '#0c2a4d', stroke: '#e0f2fe' }),
    label('River Celadon', 1520, 720, 19, { font: 'MedievalSharp', color: '#1e3a8a', stroke: '#dbeafe', curv: -0.05 }),
    label('The Dunwater River', 1480, 1220, 20, { font: 'MedievalSharp', color: '#1e3a8a', stroke: '#dbeafe', curv: 0.04 }),
    label('Mire of Sorrows', 540, 1460, 22, { font: 'MedievalSharp', color: '#365314', stroke: '#ecfccb', curv: 0.05 }),
    label('The Golden Weald', 1440, 1070, 24, { font: 'MedievalSharp', color: '#78350f', stroke: '#fef3c7', curv: 0.05 }),
    label('The Western Reach', 220, 780, 28, { ...sea1, curv: 0.1, rot: -0.15 }),
    label('Sea of Storms', 1420, 1680, 28, { ...sea1, curv: 0.06 }),
    label('High Crags of Morhn', 1320, 360, 20, { font: 'MedievalSharp', color: '#7c2d12', stroke: '#fef3c7' }),
    label('Wyrmtooth Pass', 2420, 310, 18, { font: 'MedievalSharp', color: '#3d2b1f', stroke: '#ffffff', curv: 0.05 }),

    // Settlements & Cultural Sites: labels offset cleanly below each stamp by its height to prevent overlap
    label('Verrinport', P.verrinport.x, P.verrinport.y + 130, 22, { font: 'Cinzel', color: '#1c1208', stroke: '#fef3c7' }),
    label('Oakhaven', P.oakhaven.x, P.oakhaven.y + 125, 19, { font: 'MedievalSharp', color: '#1c1208', stroke: '#fef3c7' }),
    label('Ironford', P.ironford.x, P.ironford.y + 125, 19, { font: 'MedievalSharp', color: '#1c1208', stroke: '#fef3c7' }),
    label('Eldershade', P.eldershade.x, P.eldershade.y + 130, 18, { font: 'MedievalSharp', color: '#14532d', stroke: '#dcfce7' }),
    label('Stonepeak Hold', P.stonepeak.x, P.stonepeak.y + 130, 19, { font: 'Cinzel', color: '#271b12', stroke: '#fef3c7' }),
    label('Briar Glen', P.briarglen.x, P.briarglen.y + 125, 18, { font: 'MedievalSharp', color: '#1c1208', stroke: '#fef3c7' }),
    label('Castle Verrin', P.castle_verrin.x, P.castle_verrin.y + 125, 20, { font: 'Cinzel', color: '#3d2b1f', stroke: '#fef3c7' }),
    label('Duskfell Keep (Ruins)', P.duskfell.x, P.duskfell.y + 125, 18, { font: 'MedievalSharp', color: '#450a0a', stroke: '#fecaca' }),
    label('Lantern Point', P.lantern_pt.x, P.lantern_pt.y + 95, 16, { font: 'MedievalSharp', ...sea1 }),
    label('Hermit\'s Tor', P.hermits_tor.x, P.hermits_tor.y + 105, 16, { font: 'MedievalSharp', color: '#3f3f46', stroke: '#f4f4f5' }),
    label('Mirewatch', P.mirewatch.x, P.mirewatch.y + 95, 16, { font: 'MedievalSharp', color: '#271b12', stroke: '#fef3c7' })
  ];

  return {
    id: 'region_demo',
    title: 'Region: The Marchlands of Verrin',
    type: 'world',
    template: 'region',
    width: W,
    height: H,
    grid: { enabled: true, type: 'hex_flat', size: 48, opacity: 0.1, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.4, parchmentGrain: 0.3, sepia: 0.2, brightness: 1.03 },
    coastline: {
      ripplesEnabled: true,
      rippleCount: 4,
      rippleSpacing: 11,
      rippleColor: '#38bdf8',
      rippleOpacity: 0.3,
      sandEnabled: true,
      sandWidth: 9,
      sandColor: '#d4b276',
      outlineColor: '#2b2318',
      outlineWidth: 2.5,
      shadowEnabled: true,
      shadowBlur: 16,
      shadowColor: 'rgba(4, 18, 38, 0.48)'
    },
    layers: {
      c_terrain: { visible: true, opacity: 1, blend: 'source-over', name: 'Terrain & forests' },
      c_sea: { visible: true, opacity: 1, blend: 'source-over', name: 'Sea life & compass' }
    },
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts
  };
}
