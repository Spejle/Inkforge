// Starter Preset Maps to demonstrate world cartography and battlemaps
// Crafted following Eduard Imhof's cartographic principles, hydrological realism, and tectonic mountain spines.

import { getStampById } from './stampsCatalog.js';

// ============================================================================================
// SHOWCASE: THE SUNDERED REALMS  (procedural, fully deterministic: seeded PRNG, no Math.random)
// ============================================================================================
// STAMP ID TABLE: every stamp id the showcase uses lives here. Swap an id (e.g. 'tree_oak' ->
// 'tr_oak_a') and the whole map follows; nothing else in the builder names a stamp directly.
const SS = {
  forest:    ['tree_oak', 'tree_pine', 'tree_forest_cluster'],
  snowPine:  'tree_snowy_pine',
  palm:      'tree_palm',
  dead:      'tree_dead',
  autumn:    'tree_autumn',
  cactus:    'cactus_saguaro',
  reeds:     'nature_reeds',
  lily:      'nature_lily_pond',
  boulder:   'boulder_cluster',
  mtn:       ['mountain_grand', 'mountain_range'],
  mtnSnow:   'mountain_snow_peak',
  mesa:      'mountain_mesa',
  volcano:   'mountain_volcano',
  volcanoS:  'volcano_lite',
  hills:     'hills_rolling',
  dunes:     'hills_dunes',
  capital:   'castle_citadel',
  fort:      'fortress_keep',
  village:   'village_houses',
  mill:      'windmill',
  farm:      'farm_homestead',
  port:      'port_dock',
  temple:    'civ_temple',
  wizard:    'tower_wizard',
  henge:     'ruins_stonehenge',
  ruin:      'ruined_tower',
  tent:      'camp_tent',
  lighthouse:'civ_lighthouse',
  bridge:    'bridge_stone',
  compass:   'compass_rose',
  ships:     ['ship_caravel', 'ship_galleon'],
  kraken:    'nautical_kraken',
  serpent:   'sea_serpent',
  serpentHd: 'sea_serpent_head',
  whirlpool: 'nautical_whirlpool'
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
function _cross(l1, l2) {
  for (let i = 0; i < l1.length - 1; i++) for (let j = 0; j < l2.length - 1; j++) {
    const [a, b, c, d] = [l1[i], l1[i + 1], l2[j], l2[j + 1]];
    const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
    if (!den) continue;
    const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
    const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  return null;
}

export function buildSundered() {
  const W = 2400, H = 1500;
  const rnd = _rng(20261014);
  const R = (a, b) => a + (b - a) * rnd();
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  // ---------------- LAND ----------------
  const L = (id, biome, points) => ({ id, biome, points });
  const landmasses = [
    L('aldermark', 'grassland', [[170,420],[230,330],[340,290],[420,210],[560,190],[690,240],[800,200],[930,230],[1010,320],[1090,380],[1150,430],[1120,500],[1210,540],[1230,620],[1190,690],[1250,770],[1210,880],[1120,940],[1060,1040],[950,1100],[880,1200],[760,1230],[690,1150],[580,1170],[470,1110],[400,1000],[300,960],[240,860],[280,760],[190,680],[150,560]]),
    L('frostmarch', 'snow', [[1380,130],[1520,90],[1680,110],[1790,70],[1950,110],[2080,90],[2230,160],[2290,270],[2220,370],[2100,430],[1980,400],[1900,470],[1760,440],[1650,490],[1540,430],[1450,350],[1360,260]]),
    L('sunscar', 'desert', [[1560,640],[1680,590],[1820,620],[1940,560],[2080,600],[2210,680],[2270,820],[2200,940],[2090,1000],[1990,1090],[1850,1060],[1740,1100],[1620,1030],[1560,920],[1480,820],[1500,720]]),
    L('emberhold', 'badlands', [[1560,1260],[1680,1210],[1820,1230],[1930,1300],[1960,1400],[1860,1450],[1720,1430],[1600,1400],[1530,1330]]),
    L('emberhold_core', 'lava_molten', [[1700,1310],[1780,1285],[1850,1320],[1835,1385],[1765,1405],[1700,1370]]),
    L('mirewater', 'swamp_mire', [[420,1340],[520,1300],[640,1310],[720,1370],[680,1440],[560,1460],[450,1430]]),
    L('pearl_a', 'grassland', [[1350,820],[1420,790],[1470,840],[1440,900],[1370,910]]),
    L('pearl_b', 'grassland', [[1300,1050],[1360,1020],[1400,1070],[1350,1120],[1290,1100]]),
    L('hoarisle', 'snow', [[540,50],[640,40],[730,80],[690,140],[580,140]]),
    L('greywatch', 'badlands', [[1130,120],[1220,100],[1290,150],[1250,210],[1160,220]])
  ];
  const land = landmasses.map((l) => ({ id: l.id, poly: _smoothPoly(l.points) }));
  const mainLand = land.filter((l) => !l.id.endsWith('_core'));
  const coastDist = (x, y) => {
    for (const l of mainLand) if (_inPoly(x, y, l.poly)) return _distPoly(x, y, l.poly);
    return -1;
  };

  // lakes carved from the land mask (round-brush water strokes) + blobs for exclusion
  const lakes = [
    { id: 'lake_ald', pts: [[690,500],[740,520]], size: 66 },
    { id: 'lake_tarn', pts: [[350,610],[390,625]], size: 50 },
    { id: 'lake_oasis', pts: [[1850,820],[1880,832]], size: 44 },
    { id: 'lake_frost', pts: [[1900,260],[1960,270]], size: 56 }
  ];
  const lakeBlobs = lakes.map((k) => ({ x: (k.pts[0][0] + k.pts[1][0]) / 2, y: (k.pts[0][1] + k.pts[1][1]) / 2, r: k.size / 2 + 20 }));

  // ---------------- RIVERS ----------------
  const paths = [];
  const rivers = [];
  const addRiver = (id, width, pts, joinTo) => {
    let p = pts;
    if (joinTo) { const last = pts[pts.length - 1]; p = [...pts.slice(0, -1), _nearestOn(last[0], last[1], joinTo.dense)]; }
    paths.push({ id, type: 'river', width, color: '#2b5c8f', points: p });
    const r = { id, width, dense: _smoothLine(p) };
    rivers.push(r);
    return r;
  };
  const silver = addRiver('r_silverrun', 13, [[600,330],[640,400],[700,470],[705,540],[770,610],[800,690],[790,780],[850,860],[890,950],[960,1020],[1010,1070]]);
  addRiver('r_t_mist', 7, [[470,380],[520,450],[580,520],[650,560],[720,620]], silver);
  addRiver('r_t_dun', 8, [[1000,560],[950,610],[890,640],[830,690]], silver);
  addRiver('r_t_west', 7, [[330,880],[430,880],[540,860],[660,820],[780,790]], silver);
  addRiver('r_greenbrook', 9, [[960,430],[1040,470],[1100,500],[1150,530]]);
  addRiver('r_tarn', 6, [[390,625],[320,640],[240,650],[180,650]]);
  addRiver('r_wadi_in', 6, [[1960,640],[1930,720],[1880,820]]);
  addRiver('r_wadi', 9, [[1880,832],[1900,900],[1880,970],[1850,1060]]);
  addRiver('r_frost', 8, [[1960,270],[2010,320],[2090,400],[2100,430]]);
  addRiver('r_snow2', 7, [[1520,300],[1560,350],[1590,420],[1650,480]]);

  // ---------------- SETTLEMENTS ----------------
  const P = {};
  const defPlace = (key, name, x, y) => (P[key] = { key, name, x, y });
  defPlace('highcrown', 'Highcrown', 850, 720);
  defPlace('silverport', 'Silverport', 960, 1030);
  defPlace('stonebridge', 'Stonebridge', 790, 640);
  defPlace('redcrag', 'Redcrag Keep', 1010, 450);
  defPlace('thornwatch', 'Thornwatch', 520, 330);
  defPlace('oakhollow', 'Oakhollow', 560, 790);
  defPlace('wyrdstones', 'Wyrdstones', 320, 540);
  defPlace('fenwatch', 'Fenwatch', 520, 1040);
  defPlace('gullhaven', 'Gullhaven', 1120, 590);
  defPlace('frosthold', 'Frosthold', 1780, 250);
  defPlace('northhaven', 'Northhaven', 2150, 300);
  defPlace('winterspire', 'Winterspire', 1560, 280);
  defPlace('sunspire', 'Sunspire', 2040, 790);
  defPlace('dunegate', 'Dunegate', 1700, 760);
  defPlace('oasis', 'Oasis Camp', 1830, 880);
  defPlace('sandport', 'Sandport', 2160, 900);
  defPlace('ember', 'Emberkeep', 1630, 1330);

  // ---------------- ROADS ----------------
  const road = (id, pts, sea) => paths.push({ id, type: 'road', width: sea ? 4 : 6, color: sea ? '#7c4a2a' : '#78350f', dashed: true, points: pts });
  const A = (k) => [P[k].x, P[k].y];
  road('rd_a1', [A('thornwatch'), [560,420],[610,520],[690,600],A('stonebridge')]);
  road('rd_a2', [A('stonebridge'), [820,680], A('highcrown')]);
  road('rd_a3', [A('highcrown'), [880,800],[920,900],A('silverport')]);
  road('rd_a4', [A('highcrown'), [930,640],[1020,600], A('gullhaven')]);
  road('rd_a5', [A('gullhaven'), [1060,520], A('redcrag')]);
  road('rd_a6', [A('highcrown'), [740,770], [640,790], A('oakhollow')]);
  road('rd_a7', [A('oakhollow'), [470,700],[380,620],A('wyrdstones')]);
  road('rd_a8', [A('oakhollow'), [520,900],[500,980], A('fenwatch')]);
  road('rd_a9', [A('silverport'), [800,1050],[650,1060], A('fenwatch')]);
  road('rd_f1', [A('winterspire'), [1650,260], A('frosthold')]);
  road('rd_f2', [A('frosthold'), [1950,230],[2050,290], A('northhaven')]);
  road('rd_s1', [A('dunegate'), [1860,750],[1960,780], A('sunspire')]);
  road('rd_s2', [A('sunspire'), [2100,850], A('sandport')]);
  road('rd_s3', [A('dunegate'), [1760,830], A('oasis')]);
  road('rd_s4', [A('oasis'), [1950,860], A('sunspire')]);

  // bridge sites: where a land road meets a river
  const roadsDense = paths.filter((p) => p.type === 'road').map((p) => ({ id: p.id, dense: _smoothLine(p.points) }));
  const bridges = [];
  for (const rd of roadsDense) for (const rv of rivers) {
    const c = _cross(rd.dense, rv.dense);
    if (c && rv.width >= 7) bridges.push({ x: c[0], y: c[1] });
  }

  // sea routes (thin, drawn after the land roads were measured so stamps ignore them)
  road('sea_1', [[990,1060],[1100,1130],[1230,1180],[1330,1230],[1450,1280],[1560,1320]], true);
  road('sea_2', [[1150,610],[1260,700],[1330,780],[1420,830]], true);
  road('sea_3', [[2160,930],[2130,1060],[2000,1200],[1900,1280]], true);
  road('sea_4', [[1120,570],[1240,420],[1330,330],[1420,280]], true);

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
  // o: free (skip land/road/overlap checks), layer, margin, pad, onRoad, z, rot, flipX
  function place(stampId, x, y, scale, o = {}) {
    const d = dim(stampId, scale);
    const fit = o.fit || 1;
    const box = { x, y, rx: d.rx * fit + (o.pad || 0), ry: d.ry * fit + (o.pad || 0) };
    if (!o.free) {
      if (coastDist(x, y) < (o.margin ?? Math.max(d.rx, d.ry) + 16)) return false;
      if (!o.onRoad) for (const l of roadLines) if (_distLine(x, y, l) < d.rx * 0.5 + 8) return false;
      for (const r of riverLines) if (_distLine(x, y, r.d) < d.rx * 0.55 + r.w / 2 + 6) return false;
      for (const k of lakeBlobs) if (Math.hypot(x - k.x, y - k.y) < k.r + d.rx * 0.5) return false;
      for (const b of occ) if (hit(box, b)) return false;
    }
    occ.push(box);
    stamps.push({
      id: 'st' + ++sid, stampId, x: Math.round(x), y: Math.round(y), scale: +scale.toFixed(2),
      rotation: o.rot || 0, zIndex: o.z || 0, ...(o.layer ? { layer: o.layer } : {}), ...(o.flipX ? { flipX: true } : {})
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
    for (let i = 0; i < n * 40 && placed < n; i++) {
      const x = R(x0, x1), y = R(y0, y1);
      if (!_inPoly(x, y, poly)) continue;
      if (place(pick(ids), x, y, R(sc[0], sc[1]), o)) placed++;
    }
  }
  // spray-like groves: tight blobs of trees around random centres inside a polygon
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

  // 1) settlements first (they claim space)
  const sett = (key, stampId, scale, dx = 0, dy = 0) => place(stampId, P[key].x + dx, P[key].y + dy, scale, { free: true, z: 1, pad: 12 });
  sett('highcrown', SS.capital, 1.55);
  sett('highcrown', SS.village, 0.95, -85, 30);
  sett('highcrown', SS.mill, 0.85, 80, 38);
  sett('silverport', SS.port, 1.2);
  sett('silverport', SS.village, 0.9, -70, -25);
  sett('silverport', SS.lighthouse, 1.0, 62, 30);
  sett('stonebridge', SS.village, 0.85);
  sett('redcrag', SS.fort, 1.45);
  sett('thornwatch', SS.wizard, 1.3);
  sett('oakhollow', SS.village, 1.0);
  sett('oakhollow', SS.farm, 0.95, 85, 30);
  sett('oakhollow', SS.mill, 0.8, -75, 35);
  sett('wyrdstones', SS.henge, 1.15);
  sett('fenwatch', SS.tent, 0.9);
  sett('fenwatch', SS.ruin, 1.0, 70, -20);
  sett('gullhaven', SS.port, 1.1);
  sett('gullhaven', SS.village, 0.85, -60, 30);
  sett('frosthold', SS.fort, 1.45);
  sett('northhaven', SS.port, 1.05);
  sett('northhaven', SS.village, 0.85, -60, 28);
  sett('winterspire', SS.temple, 1.2);
  sett('sunspire', SS.temple, 1.4);
  sett('sunspire', SS.village, 0.85, -70, 35);
  sett('dunegate', SS.village, 0.95);
  sett('dunegate', SS.tent, 0.7, 60, 28);
  sett('oasis', SS.tent, 0.8);
  sett('sandport', SS.port, 1.1);
  sett('ember', SS.fort, 1.3);
  bridges.forEach((b) => place(SS.bridge, b.x, b.y, 0.55, { free: true, z: 0 }));

  // 2) mountains
  along([[580,280],[610,300],[700,300],[800,300],[890,330],[980,380]], 64, SS.mtn, [1.0, 1.35], 14, MTN);
  along([[610,235],[700,240],[790,250],[880,275]], 70, SS.mtn, [0.8, 1.05], 10, MTN);
  along([[420,340],[510,355],[610,380],[690,355],[790,360],[880,395],[960,435]], 90, [SS.hills], [0.8, 1.0], 12, MTN);
  along([[1440,190],[1540,170],[1640,170],[1730,150],[1850,160],[1960,180],[2090,170]], 70, [SS.mtnSnow], [0.9, 1.25], 12, MTN);
  scatter([[1400,300],[1500,360],[1470,400],[1400,340]], 3, [SS.mtnSnow], [0.8, 1.0], MTN);
  scatter([[1640,660],[1760,640],[1780,700],[1640,720]], 3, [SS.mesa], [0.9, 1.2], MTN);
  scatter([[1960,930],[2120,920],[2140,990],[1960,1020]], 3, [SS.mesa], [0.9, 1.2], MTN);
  scatter([[1580,820],[1700,880],[1680,1000],[1590,950]], 5, [SS.dunes], [0.85, 1.15], MTN);
  scatter([[1890,650],[2150,660],[2200,780],[1900,730]], 5, [SS.dunes], [0.85, 1.15], MTN);
  place(SS.volcano, 1775, 1330, 1.8, { free: true, layer: T });
  scatter([[1580,1290],[1670,1260],[1680,1380],[1590,1370]], 2, [SS.volcanoS, SS.boulder], [0.8, 1.0], MTN);
  scatter([[1880,1310],[1930,1340],[1900,1410],[1850,1400]], 2, [SS.volcanoS, SS.boulder], [0.8, 1.0], MTN);
  place(SS.ruin, 1205, 175, 1.0, { free: true, layer: T });
  place(SS.lighthouse, 640, 100, 0.9, { free: true, layer: T });
  place(SS.snowPine, 600, 105, 0.6, { free: true, layer: T });

  // 3) forests: spray groves
  groves([[250,400],[340,360],[440,420],[470,520],[500,640],[470,740],[380,740],[300,700],[250,610]], 16, 12, 56, SS.forest, [0.6, 0.85], TREE);
  groves([[870,780],[980,760],[1090,800],[1130,880],[1050,930],[930,900]], 7, 8, 46, [SS.forest[0], SS.forest[1], SS.autumn], [0.6, 0.8], TREE);
  groves([[1500,200],[1700,330],[1850,350],[2000,330],[2130,250],[1950,200],[1750,200]], 12, 7, 52, [SS.snowPine], [0.6, 0.85], TREE);
  groves([[1580,380],[1760,420],[1950,370],[2100,330],[1900,310],[1700,340]], 6, 6, 50, [SS.snowPine], [0.6, 0.8], TREE);
  scatter([[1560,360],[1700,400],[1850,410],[2000,380]], 3, [SS.hills], [0.8, 1.0], MTN);
  groves([[1800,850],[1900,850],[1900,920],[1800,920]], 2, 4, 28, [SS.palm], [0.55, 0.75], TREE);
  scatter([[1700,880],[2000,700],[2050,860],[1650,960]], 6, [SS.cactus], [0.5, 0.7], TREE);
  scatter([[1600,700],[1720,950],[2100,760],[2200,880]], 4, [SS.cactus], [0.5, 0.7], TREE);
  for (const c of [[1405, 860], [1345, 1070]]) groves([[c[0]-50,c[1]-35],[c[0]+50,c[1]-35],[c[0]+50,c[1]+35],[c[0]-50,c[1]+35]], 1, 3, 30, [SS.palm], [0.55, 0.7], { layer: T, margin: 20 });
  // swamp
  const fens = [[400,960],[480,1000],[560,1000],[640,1060],[580,1120],[470,1100],[410,1040]];
  scatter(fens, 6, [SS.dead], [0.55, 0.75], TREE);
  scatter(fens, 4, [SS.reeds], [0.5, 0.65], TREE);
  scatter([[460,1340],[560,1320],[650,1350],[620,1420],[500,1410]], 3, [SS.dead, SS.reeds], [0.55, 0.7], { layer: T, margin: 18 });
  place(SS.lily, 600, 1370, 0.8, { layer: T, margin: 18 });
  scatter([[880,420],[1000,520],[1080,560],[960,560]], 4, [SS.boulder], [0.55, 0.75], TREE);
  // farmland + meadow dressing
  scatter([[600,700],[700,720],[700,780],[620,800]], 2, [SS.farm], [0.75, 0.9]);
  place(SS.mill, 330, 830, 0.8);
  place(SS.farm, 380, 870, 0.8);
  scatter([[250,780],[400,830],[500,900],[420,940],[300,900]], 5, SS.forest.slice(0, 2), [0.5, 0.65], TREE);
  scatter([[1000,900],[1080,830],[1170,780],[1180,700],[1100,650]], 6, SS.forest.slice(0, 2), [0.5, 0.65], TREE);
  scatter([[620,230],[720,250],[780,230],[700,200]], 3, SS.forest.slice(0, 2), [0.5, 0.65], TREE);

  // 4) sea life, compass
  const sea = (id, x, y, sc, rot = 0, flip = false) => place(id, x, y, sc, { free: true, layer: SEA, z: 2, rot, flipX: flip });
  sea(SS.ships[0], 1090, 1180, 1.0, 0.08);
  sea(SS.ships[1], 1260, 1215, 1.0, -0.06);
  sea(SS.ships[0], 1285, 650, 0.95, 0.1);
  sea(SS.ships[1], 1300, 340, 1.0, -0.05, true);
  sea(SS.ships[0], 2080, 1130, 0.95, 0.12);
  sea(SS.kraken, 1040, 1330, 1.3);
  sea(SS.serpent, 250, 1130, 1.25, -0.08);
  sea(SS.serpentHd, 1470, 590, 1.0);
  sea(SS.whirlpool, 1400, 1380, 1.2);
  sea(SS.whirlpool, 960, 90, 0.9);
  sea(SS.ships[1], 150, 330, 0.9, 0.2);
  sea(SS.compass, 215, 1255, 1.9);
  sea(SS.serpent, 2260, 560, 1.0, 0.1, true);

  // ---------------- BIOME BRUSHES (soft transitions) + lake masks ----------------
  let bi = 0;
  const brush = (biome, size, soft, op, pts) => ({ id: 'bb' + ++bi, type: 'brush', target: 'foreground', biome, size, opacity: op, softness: soft, blendMode: 'source-over', points: pts.map(([x, y]) => ({ x, y })) });
  const brushStrokes = [
    ...lakes.map((k) => ({ id: k.id, type: 'mask', mode: 'water', size: k.size, points: k.pts.map(([x, y]) => ({ x, y })) })),
    brush('swamp_mire', 150, 0.85, 0.9, [[440,1000],[520,1040],[600,1070]]),
    brush('swamp_mire', 110, 0.8, 0.8, [[360,950],[420,990]]),
    brush('badlands', 140, 0.85, 0.5, [[900,400],[990,470],[1080,560]]),
    brush('badlands', 120, 0.8, 0.8, [[1620,1300],[1640,1370]]),
    brush('snow', 80, 0.8, 0.5, [[520,250],[620,280],[720,280]]),
    brush('desert', 130, 0.85, 0.75, [[1000,940],[1090,860]]),
        brush('badlands', 110, 0.85, 0.4, [[2090,620],[2200,700],[2230,790]]),
    brush('grassland', 70, 0.85, 0.85, [[1860,845],[1900,850]]),
    brush('parchment', 90, 0.85, 0.55, [[1450,360],[1580,420]]),
    brush('parchment', 110, 0.9, 0.5, [[600,760],[720,820],[860,880]])
  ];

  // ---------------- LABELS ----------------
  // scheme: REALMS in spaced capitals (-mark/-march/-scar/-hold), regions in MedievalSharp, seas "Sea/Gulf/Strait of ...", towns small
  let ti = 0;
  const label = (text, x, y, size, o = {}) => ({ id: 'tx' + ++ti, text, x, y, size, color: o.color || '#271b12', stroke: o.stroke || '#fef3c7', font: o.font || 'Cinzel', curvature: o.curv || 0, ...(o.rot ? { rotation: o.rot } : {}), ...(o.tracking ? { tracking: o.tracking } : {}) });
  const sea1 = { color: '#e0f2fe', stroke: '#0c2a4d' };
  const texts = [
    label('THE SUNDERED REALMS', 1200, 1440, 54, { color: '#3b2412', stroke: '#fde68a', curv: 0.1, tracking: 4 }),
    label('ALDERMARK', 660, 950, 36, { tracking: 14, curv: 0.12 }),
    label('FROSTMARCH', 1850, 120, 40, { color: '#1e3a5f', stroke: '#e0f2fe', tracking: 10, curv: 0.08 }),
    label('SUNSCAR', 2010, 720, 40, { color: '#7c2d12', stroke: '#fef3c7', tracking: 12, curv: 0.08 }),
    label('EMBERHOLD', 1750, 1190, 26, { color: '#fef08a', stroke: '#450a0a', tracking: 6 }),
    label('MIREWATER', 570, 1275, 22, { color: '#ecfccb', stroke: '#1a2e05', tracking: 6 }),
    label('The Eldwood', 340, 480, 26, { font: 'MedievalSharp', color: '#14532d', stroke: '#dcfce7', curv: -0.06 }),
    label('Redcrag Highlands', 960, 360, 22, { font: 'MedievalSharp', color: '#7c2d12', stroke: '#fef3c7' }),
    label('Spine of Orhn', 650, 262, 22, { font: 'MedievalSharp', color: '#3d2b1f', stroke: '#ffffff', curv: 0.05 }),
    label('Weeping Fens', 430, 985, 22, { font: 'MedievalSharp', color: '#365314', stroke: '#ecfccb' }),
    label('Greenwold', 1000, 860, 22, { font: 'MedievalSharp', color: '#14532d', stroke: '#dcfce7' }),
    label('The Frostpines', 1960, 400, 22, { font: 'MedievalSharp', color: '#1e3a5f', stroke: '#e0f2fe' }),
    label('Burning Dunes', 1700, 970, 22, { font: 'MedievalSharp', color: '#7c2d12', stroke: '#fef3c7' }),
    label('The Pearl Isles', 1380, 960, 20, { font: 'MedievalSharp', color: '#78350f', stroke: '#fef9c3' }),
    label('The Sundering Sea', 1280, 560, 28, { ...sea1, curv: 0.1, rot: 0.25 }),
    label('Gulf of Gulls', 1180, 480, 20, { ...sea1, font: 'MedievalSharp' }),
    label('Ashen Strait', 1560, 1150, 22, sea1),
    label('Sea of Sorrows', 1050, 1260, 24, { ...sea1, curv: 0.06 }),
    label('Lake Aldwater', 715, 468, 15, { font: 'MedievalSharp', color: '#0c2a4d', stroke: '#e0f2fe' }),
    ...Object.values(P).map((p) => label(p.name, p.x, p.y + (p.key === 'highcrown' ? 92 : 58), p.key === 'highcrown' || p.key === 'sunspire' ? 22 : 16, { font: p.key === 'highcrown' ? 'Cinzel' : 'MedievalSharp', color: '#1c1208' }))
  ];

  return {
    id: 'sundered_realms',
    title: 'Showcase: The Sundered Realms',
    type: 'world',
    width: W,
    height: H,
    grid: { enabled: false, type: 'hex_flat', size: 64, opacity: 0.08, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.4, parchmentGrain: 0.3, sepia: 0.2, brightness: 1.03 },
    coastline: {
      ripplesEnabled: true, rippleCount: 4, rippleSpacing: 11, rippleColor: '#38bdf8', rippleOpacity: 0.3,
      sandEnabled: true, sandWidth: 9, sandColor: '#d4b276', outlineColor: '#2b2318', outlineWidth: 2.5,
      shadowEnabled: true, shadowBlur: 16, shadowColor: 'rgba(4, 18, 38, 0.48)'
    },
    // custom layers, drawn above the built-in ones, bottom to top
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

export const PRESET_MAPS = [

  {
    id: 'shattered_archipelago',
    title: 'The Realm of Valoria & The Shattered Reach',
    type: 'world',
    width: 1920,
    height: 1080,
    grid: { enabled: true, type: 'hex_flat', size: 64, opacity: 0.12, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false },
    atmosphere: { vignette: 0.42, parchmentGrain: 0.32, sepia: 0.18, brightness: 1.02 },
    coastline: {
      ripplesEnabled: true,
      rippleCount: 4,
      rippleSpacing: 10,
      rippleColor: '#38bdf8',
      rippleOpacity: 0.32,
      sandEnabled: true,
      sandWidth: 8,
      sandColor: '#d4b276',
      outlineColor: '#2b2318',
      outlineWidth: 2.5,
      shadowEnabled: true,
      shadowBlur: 16,
      shadowColor: 'rgba(4, 18, 38, 0.48)'
    },
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
    coastline: {
      ripplesEnabled: true,
      rippleCount: 3,
      rippleSpacing: 12,
      rippleColor: '#f97316',
      rippleOpacity: 0.28,
      sandEnabled: true,
      sandWidth: 6,
      sandColor: '#78350f',
      outlineColor: '#1c1917',
      outlineWidth: 2.5,
      shadowEnabled: true,
      shadowBlur: 16,
      shadowColor: 'rgba(20, 10, 5, 0.6)'
    },
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
].flatMap((p, i) => (i === 0 ? [p, buildSundered()] : [p])); // showcase sits right after the default map
