import { buildBattle } from './presets/battleDemo.js';
import { buildRegion } from './presets/regionDemo.js';
import { buildCity } from './presets/cityDemo.js';
// Starter Preset Maps to demonstrate world cartography and battlemaps
// Crafted following Eduard Imhof's cartographic principles, hydrological realism, and tectonic mountain spines.

import { getStampById } from './stampsCatalog.js';

// ============================================================================================
// SHOWCASE: THE SUNDERED REALMS  (procedural, fully deterministic: seeded PRNG, no Math.random)
// ============================================================================================
// STAMP ID TABLE: every stamp id the showcase uses lives here. Swap an id (e.g. 'tree_oak' ->
// 'tr_oak_a') and the whole map follows; nothing else in the builder names a stamp directly.
const SS = {
  forest:    ['tr_oak', 'tr_round', 'tr_pine', 'tr_elm', 'tr_spruce'],
  snowPine:  ['tr_snowy_pine', 'tr_snowy_spruce'],
  palm:      ['tr_palm', 'tr_palm_lean'],
  dead:      'tr_dead',
  autumn:    'tr_autumn_gold',
  cactus:    'veg_cactus_saguaro',
  reeds:     'veg_reeds',
  lily:      'nature_lily_pond',
  boulder:   'boulder_cluster',
  mtn:       ['mountain_grand', 'mountain_range'],
  mtnSnow:   'mountain_snow_peak',
  mesa:      'mountain_mesa',
  volcano:   'mountain_volcano',
  volcanoS:  'volcano_lite',
  hills:     'hills_rolling',
  dunes:     'hills_dunes',
  capital:   'set_human_capital',
  fort:      'cas_human_castle',
  village:   'set_human_village',
  mill:      'windmill',
  farm:      'farm_homestead',
  port:      'port_dock',
  temple:    'cas_temple',
  wizard:    'cas_wizard_spire',
  henge:     'cas_standing_stones',
  ruin:      'cas_ruin_tower',
  tent:      'camp_tent',
  lighthouse:'cas_lighthouse',
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
  sett('highcrown', SS.village, 1.71, -85, 30);
  sett('highcrown', SS.mill, 0.85, 80, 38);
  sett('silverport', SS.port, 1.2);
  sett('silverport', SS.village, 1.62, -70, -25);
  sett('silverport', SS.lighthouse, 1.0, 62, 30);
  sett('stonebridge', SS.village, 1.53);
  sett('redcrag', SS.fort, 1.45);
  sett('thornwatch', SS.wizard, 1.3);
  sett('oakhollow', SS.village, 1.8);
  sett('oakhollow', SS.farm, 0.95, 85, 30);
  sett('oakhollow', SS.mill, 0.8, -75, 35);
  sett('wyrdstones', SS.henge, 1.15);
  sett('fenwatch', SS.tent, 0.9);
  sett('fenwatch', SS.ruin, 1.0, 70, -20);
  sett('gullhaven', SS.port, 1.1);
  sett('gullhaven', SS.village, 1.53, -60, 30);
  sett('frosthold', SS.fort, 1.45);
  sett('northhaven', SS.port, 1.05);
  sett('northhaven', SS.village, 1.53, -60, 28);
  sett('winterspire', SS.temple, 1.2);
  sett('sunspire', SS.temple, 1.4);
  sett('sunspire', SS.village, 1.53, -70, 35);
  sett('dunegate', SS.village, 1.71);
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
  place(SS.snowPine[0], 600, 105, 0.6, { free: true, layer: T });

  // 3) forests: spray groves
  groves([[250,400],[340,360],[440,420],[470,520],[500,640],[470,740],[380,740],[300,700],[250,610]], 16, 12, 56, SS.forest, [0.6, 0.85], TREE);
  groves([[870,780],[980,760],[1090,800],[1130,880],[1050,930],[930,900]], 7, 8, 46, [SS.forest[0], SS.forest[1], SS.autumn], [0.6, 0.8], TREE);
  groves([[1500,200],[1700,330],[1850,350],[2000,330],[2130,250],[1950,200],[1750,200]], 12, 7, 52, SS.snowPine, [0.6, 0.85], TREE);
  groves([[1580,380],[1760,420],[1950,370],[2100,330],[1900,310],[1700,340]], 6, 6, 50, SS.snowPine, [0.6, 0.8], TREE);
  scatter([[1560,360],[1700,400],[1850,410],[2000,380]], 3, [SS.hills], [0.8, 1.0], MTN);
  groves([[1800,850],[1900,850],[1900,920],[1800,920]], 2, 4, 28, SS.palm, [0.55, 0.75], TREE);
  scatter([[1700,880],[2000,700],[2050,860],[1650,960]], 6, [SS.cactus], [0.5, 0.7], TREE);
  scatter([[1600,700],[1720,950],[2100,760],[2200,880]], 4, [SS.cactus], [0.5, 0.7], TREE);
  for (const c of [[1405, 860], [1345, 1070]]) groves([[c[0]-50,c[1]-35],[c[0]+50,c[1]-35],[c[0]+50,c[1]+35],[c[0]-50,c[1]+35]], 1, 3, 30, SS.palm, [0.55, 0.7], { layer: T, margin: 20 });
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

// <<OBSIDIAN-BEGIN>>

// ============================================================================================
// STRESS ATLAS: THE OBSIDIAN REACH  (4000 x 2800, ~1500 stamps, every feature of the data model)
// ============================================================================================
// Procedural but fully deterministic (seeded PRNG). Pipeline: land polygons + mask strokes -> raster
// distance field -> rivers/lakes -> settlements -> A* roads & sea lanes -> walls -> terrain/forests ->
// labels -> custom layers (realms, borders, hex region, trade, smoke, fog, sea life, GM, frame).
export function buildObsidianReach() {
  const W = 4000, H = 2800, ST = 8, GW = W / ST, GH = H / ST;
  const rnd = _rng(20261016);
  const R = (a, b) => a + (b - a) * rnd();
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const rd = Math.round;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const polyLen = (p) => { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const flatAng = (a) => { while (a > Math.PI / 2) a -= Math.PI; while (a < -Math.PI / 2) a += Math.PI; return a; };
  const missing = new Set();
  const TONE_JITTER = false; // true = per-stamp tone/hue (see place()); the repaint then takes minutes

  // ---------------- LAND ----------------
  const blob = (cx, cy, rx, ry, rot, n, rough, seed) => {
    const r = _rng(seed);
    const hs = [[2, 1], [3, 1], [5, 0.9], [7, 0.8], [11, 0.6], [17, 0.45], [23, 0.3], [31, 0.2]].map(([k, a]) => [k, (rough * a) / Math.pow(k, 0.5), r() * 6.283]);
    const c = Math.cos(rot), s = Math.sin(rot), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283185;
      let f = 1;
      for (const [k, amp, ph] of hs) f += amp * Math.sin(k * a + ph);
      f = Math.max(0.4, f) * (1 + (r() - 0.5) * 0.05);
      const x = Math.cos(a) * rx * f, y = Math.sin(a) * ry * f;
      pts.push([rd(cx + x * c - y * s), rd(cy + x * s + y * c)]);
    }
    return pts;
  };
  // id, biome, cx, cy, rx, ry, rot, n, roughness, seed
  const LAND = [
    ['valdoria', 'grassland', 1250, 1330, 610, 450, -0.15, 110, 0.2, 11],
    ['silvanreach', 'forest_floor', 720, 470, 500, 230, 0.1, 110, 0.22, 12],
    ['khaz', 'tundra', 1950, 540, 410, 250, -0.05, 96, 0.2, 13],
    ['frostmarch', 'snow', 3180, 380, 580, 220, 0.08, 110, 0.22, 14],
    ['sunscar', 'desert', 3300, 1180, 480, 310, 0.2, 110, 0.2, 15],
    ['gorash', 'badlands', 2340, 1330, 390, 300, 0.3, 96, 0.22, 16],
    ['obsidian', 'ash_waste', 2200, 2170, 440, 300, -0.1, 96, 0.2, 17],
    ['obsidian_core', 'lava_molten', 2240, 2190, 115, 75, 0.2, 28, 0.3, 18],
    ['jade', 'jungle', 3350, 2120, 410, 280, 0.15, 96, 0.2, 19],
    ['mire', 'swamp_mire', 1230, 2260, 370, 230, 0, 90, 0.2, 20],
    ['shire', 'farmland', 330, 1400, 185, 320, 0.2, 48, 0.18, 21],
    ['gnome', 'grassland', 430, 2000, 245, 175, -0.3, 40, 0.22, 22],
    ['dusklands', 'savanna', 560, 2480, 275, 145, -0.1, 48, 0.22, 23],
    ['hoar', 'tundra', 1750, 130, 185, 62, 0, 28, 0.2, 24],
    ['veil', 'parchment', 450, 900, 135, 72, 0.1, 28, 0.2, 25],
    ['atoll_a', 'parchment', 2700, 1060, 70, 48, 0.3, 24, 0.2, 26],
    ['atoll_b', 'parchment', 2810, 1140, 52, 38, -0.3, 22, 0.2, 27],
    ['atoll_c', 'parchment', 2670, 1190, 44, 34, 0.5, 20, 0.2, 28],
    ['atoll_d', 'parchment', 2830, 1020, 36, 28, 0, 18, 0.2, 29],
    ['ember_a', 'ash_waste', 2900, 2570, 85, 52, 0.2, 28, 0.25, 30],
    ['ember_b', 'lava_molten', 3020, 2620, 48, 32, -0.2, 22, 0.25, 31],
    ['teeth_a', 'badlands', 3880, 1030, 36, 58, 0.1, 20, 0.25, 32],
    ['teeth_b', 'badlands', 3910, 1260, 30, 46, 0.2, 18, 0.25, 33],
    ['teeth_c', 'badlands', 3860, 1420, 28, 40, -0.2, 18, 0.25, 34],
    ['drowned', 'swamp_mire', 130, 800, 88, 66, 0.1, 28, 0.22, 35]
  ];
  const landmasses = LAND.map(([id, biome, cx, cy, rx, ry, rot, n, rough, seed]) => ({ id, biome, points: blob(cx, cy, rx, ry, rot, n, rough, seed) }));
  const polyOf = {};
  for (const l of landmasses) polyOf[l.id] = _smoothPoly(l.points, 6);

  // ---------------- MASK STROKES (land add / water carve, smooth + rough) ----------------
  const maskStrokes = [];
  let mi = 0;
  const densify = (pts, sp) => {
    const out = [[...pts[0]]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(d / sp));
      for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    return out;
  };
  const mask = (mode, shape, size, pts, roughness = 0.6, sp = 0) => {
    const p = shape === 'rough' ? densify(pts, sp || Math.max(10, size * 0.4)) : pts;
    maskStrokes.push({ id: 'mk' + ++mi, type: 'mask', mode, shape, size, ...(shape === 'rough' ? { roughness } : {}), points: p.map(([x, y]) => ({ x: rd(x), y: rd(y) })) });
  };

  // ---------------- RASTER FIELD (land mask, distance to coast, connected landmasses) ----------------
  const land = new Uint8Array(GW * GH);
  const field = new Float32Array(GW * GH);
  const comp = new Int16Array(GW * GH);
  const scan = (poly, v) => {
    let y0 = 1e9, y1 = -1e9;
    for (const p of poly) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    for (let gy = Math.max(0, Math.floor(y0 / ST)); gy <= Math.min(GH - 1, Math.ceil(y1 / ST)); gy++) {
      const yy = (gy + 0.5) * ST, xs = [];
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if (yi > yy !== yj > yy) xs.push(xi + ((yy - yi) * (xj - xi)) / (yj - yi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let gx = Math.max(0, Math.ceil(xs[k] / ST - 0.5)); gx <= Math.min(GW - 1, Math.floor(xs[k + 1] / ST - 0.5)); gx++) land[gy * GW + gx] = v;
    }
  };
  const disc = (arr, x, y, r, v) => {
    for (let gy = Math.max(0, Math.floor((y - r) / ST)); gy <= Math.min(GH - 1, Math.floor((y + r) / ST)); gy++)
      for (let gx = Math.max(0, Math.floor((x - r) / ST)); gx <= Math.min(GW - 1, Math.floor((x + r) / ST)); gx++) {
        const dx = (gx + 0.5) * ST - x, dy = (gy + 0.5) * ST - y;
        if (dx * dx + dy * dy <= r * r) arr[gy * GW + gx] = v;
      }
  };
  const dt = (src) => {
    const d = new Float32Array(GW * GH), INF = 1e6;
    for (let i = 0; i < d.length; i++) d[i] = src[i] ? 0 : INF;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = y * GW + x; let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) { v = Math.min(v, d[i - GW] + 1); if (x > 0) v = Math.min(v, d[i - GW - 1] + 1.4142); if (x < GW - 1) v = Math.min(v, d[i - GW + 1] + 1.4142); }
      d[i] = v;
    }
    for (let y = GH - 1; y >= 0; y--) for (let x = GW - 1; x >= 0; x--) {
      const i = y * GW + x; let v = d[i];
      if (x < GW - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < GH - 1) { v = Math.min(v, d[i + GW] + 1); if (x < GW - 1) v = Math.min(v, d[i + GW + 1] + 1.4142); if (x > 0) v = Math.min(v, d[i + GW - 1] + 1.4142); }
      d[i] = v;
    }
    return d;
  };
  const coastCells = [];
  function rebuild() {
    land.fill(0);
    for (const l of landmasses) scan(polyOf[l.id], 1);
    for (const m of maskStrokes) {
      const v = m.mode === 'water' ? 0 : 1;
      const r = (m.size / 2) * (m.shape === 'rough' ? 0.92 : 1);
      if (m.shape === 'rough' || m.points.length === 1) for (const p of m.points) disc(land, p.x, p.y, r, v);
      else {
        const dp = densify(m.points.map((p) => [p.x, p.y]), ST * 0.5);
        for (const p of dp) disc(land, p[0], p[1], r, v);
      }
    }
    const water = new Uint8Array(GW * GH);
    for (let i = 0; i < water.length; i++) water[i] = land[i] ? 0 : 1;
    const dw = dt(water), dl = dt(land);
    for (let i = 0; i < field.length; i++) field[i] = land[i] ? dw[i] * ST - ST / 2 : -(dl[i] * ST - ST / 2);
    comp.fill(0);
    let id = 0;
    const stack = [];
    for (let s = 0; s < land.length; s++) {
      if (!land[s] || comp[s]) continue;
      id++; comp[s] = id; stack.push(s);
      while (stack.length) {
        const i = stack.pop(), x = i % GW, y = (i / GW) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          const ni = ny * GW + nx;
          if (land[ni] && !comp[ni]) { comp[ni] = id; stack.push(ni); }
        }
      }
    }
    coastCells.length = 0;
    for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) {
      const i = y * GW + x;
      if (land[i] && (!land[i - 1] || !land[i + 1] || !land[i - GW] || !land[i + GW])) coastCells.push([(x + 0.5) * ST, (y + 0.5) * ST]);
    }
  }
  const cIdx = (x, y) => clamp(Math.floor(y / ST), 0, GH - 1) * GW + clamp(Math.floor(x / ST), 0, GW - 1);
  const cd = (x, y) => field[cIdx(x, y)];
  const compAt = (x, y) => comp[cIdx(x, y)];
  // first coast crossing along a ray (px) from a land point
  const rayCoast = (cx, cy, a, max = 1400) => {
    let last = [cx, cy];
    for (let d = 0; d < max; d += 6) {
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      if (cd(x, y) < 0) return last;
      last = [x, y];
    }
    return last;
  };

  // zones: rotated ellipses used for every "where does this go" rule
  const Z = (cx, cy, rx, ry, rot = 0) => ({ cx, cy, rx, ry, rot });
  const rndIn = (z) => {
    const a = R(0, 6.283), r = Math.sqrt(rnd()), u = Math.cos(a) * r * z.rx, v = Math.sin(a) * r * z.ry, c = Math.cos(z.rot), s = Math.sin(z.rot);
    return [z.cx + u * c - v * s, z.cy + u * s + v * c];
  };

  // coastal shaping: land bridge, fjords, bays (mask strokes, both modes, both shapes)
  mask('land', 'rough', 170, [[1790, 1320], [1900, 1335], [2000, 1345]], 0.7, 36);
  mask('land', 'smooth', 70, [[2700, 1060], [2760, 1110], [2810, 1140]]);               // atoll causeway
  mask('land', 'rough', 80, [[1010, 760], [1060, 860], [1120, 905]], 0.8, 30);           // Thornspur: Silvan reaches south
  mask('land', 'rough', 60, [[560, 2310], [640, 2250], [720, 2200]], 0.6, 24);           // Dusklands peninsula
  rebuild();
  const bay = (id, cx, cy, a, depth, size, shape = 'rough') => {
    const edge = rayCoast(cx, cy, a), nx = -Math.sin(a), ny = Math.cos(a), sg = shape === 'smooth' ? 1 : 0;
    const pt = (f, wob) => [edge[0] - Math.cos(a) * depth * f + nx * wob * sg, edge[1] - Math.sin(a) * depth * f + ny * wob * sg];
    mask('water', shape, size, [pt(-0.2, 0), pt(0.25, 14), pt(0.5, -16), pt(0.75, 12), pt(1, -6)], 0.7, 26);
  };
  bay('kings', 1250, 1330, Math.PI / 2, 190, 150);            // Bay of Kings (south coast of Valdoria)
  bay('gulls', 1250, 1330, -Math.PI / 2, 120, 110);           // northern gulf
  bay('fjordA', 560, 470, -1.45, 110, 30, 'smooth');          // elven fjords
  bay('fjordB', 930, 470, -1.7, 90, 26, 'smooth');
  bay('fjordC', 2900, 380, -1.4, 100, 30, 'smooth');         // frost fjords
  bay('fjordD', 3400, 380, -1.75, 90, 26, 'smooth');
  bay('fjordE', 3050, 380, 1.7, 100, 30, 'smooth');
  bay('sandbay', 3300, 1180, 1.6, 150, 90);
  bay('ashbay', 2200, 2170, 1.57, 140, 100);
  bay('jadebay', 3350, 2120, -1.57, 140, 90);
  bay('mirebay', 1230, 2260, 1.57, 110, 80);
  rebuild();

  // ---------------- SPATIAL INDEXES ----------------
  const segIndex = () => {
    const m = new Map(), C = 96;
    return {
      add(line, hw) {
        for (let k = 0; k < line.length - 1; k++) {
          const a = line[k], b = line[k + 1], seg = [a, b, hw];
          for (let i = Math.floor(Math.min(a[0], b[0]) / C); i <= Math.floor(Math.max(a[0], b[0]) / C); i++)
            for (let j = Math.floor(Math.min(a[1], b[1]) / C); j <= Math.floor(Math.max(a[1], b[1]) / C); j++) {
              const key = i * 1000 + j;
              if (!m.has(key)) m.set(key, []);
              m.get(key).push(seg);
            }
        }
      },
      // smallest (distance - halfwidth) over nearby segments; 1e9 when none within reach
      near(x, y, r) {
        let best = 1e9;
        for (let i = Math.floor((x - r - 24) / C); i <= Math.floor((x + r + 24) / C); i++)
          for (let j = Math.floor((y - r - 24) / C); j <= Math.floor((y + r + 24) / C); j++) {
            const b = m.get(i * 1000 + j);
            if (!b) continue;
            for (const [p, q, hw] of b) { const d = _distSeg(x, y, p, q) - hw; if (d < best) best = d; }
          }
        return best;
      }
    };
  };
  const roadIdx = segIndex(), riverIdx = segIndex(), wallIdx = segIndex();
  const occB = new Map();
  const OC = 64;
  const hit = (a, b) => ((a.x - b.x) / (a.rx + b.rx)) ** 2 + ((a.y - b.y) / (a.ry + b.ry)) ** 2 < 1;
  const occAdd = (b) => {
    for (let i = Math.floor((b.x - b.rx) / OC); i <= Math.floor((b.x + b.rx) / OC); i++)
      for (let j = Math.floor((b.y - b.ry) / OC); j <= Math.floor((b.y + b.ry) / OC); j++) {
        const k = i * 1000 + j;
        if (!occB.has(k)) occB.set(k, []);
        occB.get(k).push(b);
      }
  };
  const occHit = (b, kinds) => {
    for (let i = Math.floor((b.x - b.rx) / OC); i <= Math.floor((b.x + b.rx) / OC); i++)
      for (let j = Math.floor((b.y - b.ry) / OC); j <= Math.floor((b.y + b.ry) / OC); j++) {
        const l = occB.get(i * 1000 + j);
        if (l) for (const o of l) if ((!kinds || kinds.includes(o.kind)) && hit(b, o)) return true;
      }
    return false;
  };

  // ---------------- STAMP PLACEMENT ENGINE ----------------
  const stamps = [];
  let sid = 0;
  const place = (stampId, x, y, scale, o = {}) => {
    const def = getStampById(stampId);
    if (!def) { missing.add(stampId); return false; }
    const size = 80 * scale, asp = def.aspect || 1, fit = o.fit ?? 1;
    const rx = size * asp * 0.42 * fit + (o.pad || 0), ry = size * 0.4 * fit + (o.pad || 0);
    const box = { x, y: o.anchor === 'base' ? y - size / 2 : y, rx, ry, kind: o.kind || 'stamp' };
    if (!o.free) {
      const c = cd(x, y);
      if (o.water) { if (c > -(o.minW ?? 36) || (o.maxW && c < -o.maxW)) return false; }
      else if (c < (o.margin ?? Math.max(rx * 0.6, ry) + 8)) return false;
      if (!o.onRoad && roadIdx.near(x, y, rx * 0.5 + 6) < rx * 0.5 + 6) return false;
      if (!o.overRiver && riverIdx.near(x, y, rx * 0.55 + 6) < rx * 0.55 + 6) return false;
      if (wallIdx.near(x, y, rx * 0.5) < rx * 0.5) return false;
      if (occHit(box)) return false;
    }
    if (o.dry) return true;
    if (!o.noOcc) occAdd(box);
    const s = { id: 's' + ++sid, stampId, x: rd(x), y: rd(y), scale: +scale.toFixed(2), rotation: +(o.rot || 0).toFixed(2), zIndex: o.z || 0 };
    if (o.layer) s.layer = o.layer;
    if (o.anchor) s.anchor = o.anchor;
    if (o.flipX) s.flipX = true;
    if (o.flipY) s.flipY = true;
    if (o.nat) {          // per-stamp jitter, same fields the Spray tool writes
      s.seed = Math.floor(rnd() * 1e6);
      if (o.flipX === undefined && rnd() < 0.5) s.flipX = true;
      const tone = +(0.92 + rnd() * 0.16).toFixed(2), hue = rd(R(-6, 6));
      // tone/hue go through ctx.filter in the renderer, which costs ~1.8 s PER STAMP at 4000x2800 (measured): off by default
      if (TONE_JITTER) { s.tone = tone; s.hue = hue; }
    }
    if (o.fill) s.fill = typeof o.fill === 'string' ? o.fill : pick(o.fill);
    if (o.color) s.color = o.color;
    stamps.push(s);
    return s;
  };
  // random scatter / grove / ridge placers (all go through place())
  function scatter(zone, n, ids, sc, o = {}) {
    let placed = 0;
    for (let i = 0; i < n * 40 && placed < n; i++) {
      const [x, y] = rndIn(zone);
      if (place(pick(ids), x, y, R(sc[0], sc[1]), { nat: true, ...o, rot: (o.rot ?? 0) + (o.tilt ? R(-o.tilt, o.tilt) : 0) })) placed++;
    }
    return placed;
  }
  function groves(zone, centres, per, spread, ids, sc, o = {}) {
    let c = 0, total = 0;
    for (let i = 0; i < centres * 60 && c < centres; i++) {
      const [cx, cy] = rndIn(zone);
      if (cd(cx, cy) < 30) continue;
      c++;
      for (let k = 0, n = 0; k < per * 8 && n < per; k++) {
        const a = R(0, 6.283), r = spread * Math.sqrt(rnd());
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8;
        if (place(pick(ids), x, y, R(sc[0], sc[1]), { nat: true, fit: 0.42, tilt: 0.1, ...o, rot: R(-0.08, 0.08) })) { n++; total++; }
      }
    }
    return total;
  }
  function along(line, step, ids, sc, jitter, o = {}) {
    const d = _smoothLine(line, 10);
    let acc = step * 0.5, n = 0;
    for (let i = 1; i < d.length; i++) {
      acc += Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]);
      if (acc < step) continue;
      acc = 0;
      if (place(pick(ids), d[i][0] + R(-jitter, jitter), d[i][1] + R(-jitter, jitter) * 0.7, R(sc[0], sc[1]), { nat: true, ...o })) n++;
    }
    return n;
  }

  // ---------------- RIVERS (random-walk to the sea, tributaries, deltas, tapered in chunks) ----------------
  const rivers = [];
  const riverPaths = [];
  const mouths = [];
  const riverMask = new Uint8Array(GW * GH);
  let rvi = 0;
  function walk(src, tgt, o) {
    for (let att = 0; att < 12; att++) {
      let [x, y] = src, hd = ang(src, tgt) + R(-0.4, 0.4), curv = 0;
      const pts = [[x, y]];
      let ok = false;
      for (let i = 0; i < 200; i++) {
        let dh = ang([x, y], tgt) - hd;
        dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        curv = curv * 0.86 + R(-0.15, 0.15) * (o.meander ?? 1); // smoothed curvature: bends, not loops
        hd += dh * (Math.abs(dh) > 0.8 ? 0.35 : 0.07) + curv; // strong pull when it points away: no spirals
        x += Math.cos(hd) * 24; y += Math.sin(hd) * 24;
        const c = cd(x, y);
        if (c < 2) { if (o.toSea) { pts.push([x + Math.cos(hd) * 10, y + Math.sin(hd) * 10]); ok = true; } break; }
        pts.push([x, y]);
        if (o.join) { if (Math.hypot(tgt[0] - x, tgt[1] - y) < 26) { pts.push([...tgt]); ok = true; break; } }
        else if (i > 1 && [0.25, 0.5, 0.75, 1].some((f) => riverIdx.near(x - Math.cos(hd) * 24 * (1 - f), y - Math.sin(hd) * 24 * (1 - f), 10) < 5)) { ok = true; break; }
      }
      if (ok && polyLen(pts) >= (o.minLen || 120)) return pts;
    }
    return null;
  }
  // river: width tapers w0 -> w1 over its length by chunking into separate paths (paths have a single width)
  function addRiver(name, pts, w0, w1, o = {}) {
    const dense = _smoothLine(pts, 5);
    const len = polyLen(dense);
    const r = { id: 'rv' + ++rvi, name, dense, len, w1, depth: o.depth ?? 0, pts };
    rivers.push(r);
    riverIdx.add(dense, Math.max(3, (w0 + w1) / 4));
    for (let i = 0; i < dense.length; i += 3) disc(riverMask, dense[i][0], dense[i][1], Math.max(ST, (w0 + w1) / 4 + 4), Math.max(1, Math.round(w0 + (w1 - w0) * (i / dense.length))));
    const per = Math.max(2, Math.round(len / 90));
    const chunks = [];
    for (let k = 0; k < per; k++) {
      const lo = Math.floor((k / per) * (dense.length - 1)), hi = Math.min(dense.length - 1, Math.floor(((k + 1) / per) * (dense.length - 1)) + 1);
      const sub = dense.slice(lo, hi + 1).filter((_, i, a) => i % 2 === 0 || i === a.length - 1);
      if (sub.length < 2) continue;
      const t = (k + 0.5) / per;
      chunks.push({ id: r.id + '_' + k, type: o.type || 'river', width: Math.round((w0 + (w1 - w0) * Math.pow(t, 0.8)) * 2) / 2, color: o.color || '#2b5c8f', points: sub.map(([x, y]) => [rd(x), rd(y)]), depth: r.depth });
    }
    riverPaths.push(...chunks);
    return r;
  }
  function mainRiver(name, zone, o = {}) {
    for (let att = 0; att < 60; att++) {
      const [sx, sy] = rndIn(o.src || zone);
      if (cd(sx, sy) < (o.inland ?? 120) || riverIdx.near(sx, sy, 60) < 50) continue;
      const cand = [];
      for (let k = 0; k < 500; k++) {
        const cc = coastCells[(rnd() * coastCells.length) | 0];
        const d = Math.hypot(cc[0] - sx, cc[1] - sy);
        if (d < 170 || d > (o.maxLen ?? 800)) continue;
        if (mouths.some((m) => Math.hypot(m[0] - cc[0], m[1] - cc[1]) < 120)) continue;
        cand.push([d, cc]);
      }
      if (!cand.length) continue;
      cand.sort((a, b) => a[0] - b[0]);
      const mouth = cand[Math.min(cand.length - 1, (rnd() * 3) | 0)][1];
      const pts = walk([sx, sy], mouth, { toSea: true, meander: o.meander ?? 1, minLen: o.minLen ?? 220 });
      if (!pts) continue;
      const len = polyLen(pts);
      const w1 = o.w1 ?? clamp(len / 55, 6, 15);
      mouths.push(pts[pts.length - 1]);
      const r = addRiver(name, pts, o.w0 ?? 3, w1, o);
      if (o.delta ?? len > 520) delta(r, o);
      return r;
    }
    return null;
  }
  function tributary(parent, name, o = {}) {
    for (let att = 0; att < 40; att++) {
      const j = Math.floor(parent.dense.length * R(0.25, 0.8)), tgt = parent.dense[j];
      const a = R(0, 6.283), d = R(170, 380);
      const src = [tgt[0] + Math.cos(a) * d, tgt[1] + Math.sin(a) * d];
      if (cd(src[0], src[1]) < 70 || riverIdx.near(src[0], src[1], 60) < 50) continue;
      const pts = walk(src, tgt, { join: true, meander: o.meander ?? 1.1, minLen: 130 });
      if (!pts) continue;
      return addRiver(name, pts, 2.5, clamp(parent.w1 * 0.55, 3.5, 8), { depth: parent.depth + 1, color: o.color, type: o.type });
    }
    return null;
  }
  function delta(r, o) {
    const n = r.dense.length, fork = r.dense[Math.max(0, n - 22)], end = r.dense[n - 1], base = ang(fork, end);
    for (const off of [-0.95, -0.45, 0.45, 0.95]) { // the main channel is the middle one
      const tgt = [fork[0] + Math.cos(base + off) * 230, fork[1] + Math.sin(base + off) * 230];
      const pts = walk(fork, tgt, { toSea: true, meander: 0.35, minLen: 70 });
      if (pts) addRiver(r.name + ' delta', pts, 3, 4, { depth: 3, color: o.color, type: o.type });
    }
  }

  // region ellipses (settlement / terrain / river rules share these)
  const ZN = {
    valdor: Z(1250, 1370, 560, 380, -0.1), eldwood: Z(880, 1250, 190, 250), greenwold: Z(1560, 1500, 230, 170),
    farmland: Z(1260, 1480, 380, 170), redcrag: Z(1250, 1030, 560, 110),
    silvan: Z(720, 470, 450, 190, 0.1), khaz: Z(1950, 540, 360, 210), frost: Z(3180, 390, 520, 180, 0.08),
    sunscar: Z(3300, 1190, 430, 270, 0.2), gorash: Z(2340, 1330, 340, 250, 0.3), obsidian: Z(2200, 2170, 390, 250),
    jade: Z(3350, 2120, 360, 230, 0.15), mire: Z(1230, 2260, 330, 190), shire: Z(330, 1400, 150, 280, 0.2),
    gnome: Z(430, 2000, 215, 140, -0.3), dusk: Z(560, 2480, 240, 105, -0.1), veil: Z(450, 900, 120, 60, 0.1)
  };
  const RIV = [
    // [zone, count, colour, type, opts]
    ['valdor', 7, undefined, 'river', { src: ZN.redcrag }], ['silvan', 5], ['khaz', 3], ['frost', 4], ['sunscar', 2, '#4a86b8', 'river', { meander: 0.6, delta: false }],
    ['gorash', 3, '#3b6a8c'], ['obsidian', 3, '#ea580c', 'road', { meander: 0.8, delta: false, w1: 12, w0: 6 }],
    ['jade', 5, '#2f7a6a'], ['mire', 3, '#3d6b52', 'river', { meander: 1.6 }], ['shire', 2], ['gnome', 1], ['dusk', 2, '#4a86b8']
  ];
  const RNAME = ['Silverrun', 'Greenbrook', 'Alder', 'Whisperwater', 'Rimeflow', 'Ashen Vein', 'Serpentine', 'Moonbrook', 'Hartwater', 'Tarn', 'Oxbow', 'Winding Wye', 'Coldspring', 'Bright Ford', 'Thistle', 'Glassmere', 'Dunmere', 'Saltrun', 'Weeping Wash', 'Stonefall', 'Marrow', 'Amber', 'Kestrel', 'Larkwater', 'Vesper', 'Ironwash', 'Halcyon', 'Rushwater', 'Pilgrim', 'Thornrill', 'Fenwater', 'Gallow', 'Sunderflow', 'Brightwater', 'Crowfoot', 'Hollowbrook', 'Nightrun', 'Emberwash', 'Sable', 'Greywater'];
  let rn = 0;
  for (const [zk, n, col, type, o] of RIV) {
    for (let i = 0; i < n; i++) {
      const r = mainRiver(RNAME[rn++ % RNAME.length], ZN[zk], { color: col, type, ...(o || {}) });
      if (!r) continue;
      for (let t = 0, nt = (rnd() < 0.75 ? 1 : 0) + (rnd() < 0.45 ? 1 : 0) + (r.len > 600 ? 1 : 0); t < nt; t++) tributary(r, r.name + ' tributary', { color: col, type, meander: o && o.meander });
    }
  }
  // draw order: sources of small rivers first so that a larger river always covers the join (deltas, then tributaries, then mains)
  const riverOrder = (a, b) => b.depth - a.depth;
  const paths = [];
  let pi = 0;
  const addPath = (type, width, color, pts, o = {}) => {
    const p = { id: 'p' + ++pi, type, width, color, points: pts.map(([x, y]) => [rd(x), rd(y)]) };
    if (o.dashed) p.dashed = true;
    if (o.layer) p.layer = o.layer;
    paths.push(p);
    return p;
  };
  paths.push(...riverPaths.sort(riverOrder).map((p) => { const { depth: _d, ...rest } = p; return rest; }));

  // lakes sit on rivers (the river simply flows over the carved water), plus alpine tarns
  const lakes = [];
  const lake = (x, y, size, shape = 'smooth', name) => {
    const pts = shape === 'rough' ? [[x - size * 0.25, y], [x + size * 0.25, y + size * 0.1], [x, y - size * 0.2]] : [[x, y], [x + size * 0.35, y + size * 0.12]];
    mask('water', shape, size, pts, 0.9, 14);
    lakes.push({ x, y, r: size / 2, name });
  };
  const LNAME = ['Lake Aldwater', 'Mirrormere', 'Glasswater', 'Lake Hollow', 'Tarn of Sorrows', 'Silverglass', 'Lake Vesper', 'Moonmere', 'The Cold Eye', 'Lake Orrin', 'Dunmere', 'Lake Calder'];
  let ln = 0;
  for (const r of rivers.filter((q) => q.depth === 0 && q.len > 480)) {
    const p = r.dense[Math.floor(r.dense.length * R(0.3, 0.5))];
    if (cd(p[0], p[1]) > 120) lake(p[0], p[1], R(48, 86), rnd() < 0.5 ? 'rough' : 'smooth', LNAME[ln++ % LNAME.length]);
  }
  for (const [zk, n] of [['khaz', 3], ['frost', 2], ['redcrag', 2], ['silvan', 2]]) {
    for (let i = 0, k = 0; i < 80 && k < n; i++) {
      const [x, y] = rndIn(ZN[zk]);
      if (cd(x, y) > 110 && riverIdx.near(x, y, 60) > 55) { lake(x, y, R(34, 52), 'rough', LNAME[ln++ % LNAME.length]); k++; }
    }
  }
  rebuild();

  // ---------------- WALLS + TOWERS (laid before settlements so nothing is built through them) ----------------
  const wallDense = [];
  function wallLine(cx, cy, a, wob = 12) {
    const half = (dir) => {
      const pts = [];
      for (let d = 0; d < 1500; d += 28) {
        const x = cx + Math.cos(a) * d * dir, y = cy + Math.sin(a) * d * dir;
        if (cd(x, y) < 8) break;
        pts.push([x - Math.sin(a) * R(-wob, wob) * 0.45 * (d > 0), y + Math.cos(a) * R(-wob, wob) * 0.45 * (d > 0)]);
      }
      return pts;
    };
    return [...half(-1).reverse(), ...half(1).slice(1)];
  }
  function wall(name, cx, cy, a, width) {
    const pts = wallLine(cx, cy, a);
    if (pts.length < 3) { missing.add('wall:' + name + ' cd=' + Math.round(cd(cx, cy))); return null; }
    addPath('wall', width, '#475569', pts);
    const dense = _smoothLine(pts, 8);
    // towers every ~150 px stand on the wall (anchor 'base' = the placement point is the foot)
    let acc = 70;
    for (let i = 1; i < dense.length; i++) {
      acc += Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
      if (acc < 150) continue;
      acc = 0;
      place('cas_watchtower', dense[i][0], dense[i][1] + 6, 0.6, { free: true, anchor: 'base', z: 2, kind: 'settle', noOcc: false });
    }
    const mid = dense[Math.floor(dense.length / 2)];
    place('cas_outpost', mid[0], mid[1] + 8, 0.85, { free: true, anchor: 'base', z: 2, kind: 'settle' });
    place('cas_beacon_tower', dense[0][0], dense[0][1] + 8, 0.75, { free: true, anchor: 'base', z: 2, kind: 'settle' });
    place('cas_beacon_tower', dense[dense.length - 1][0], dense[dense.length - 1][1] + 8, 0.75, { free: true, anchor: 'base', z: 2, kind: 'settle' });
    wallIdx.add(dense, width / 2 + 3);
    wallDense.push({ name, dense, mid, a });
    return dense;
  }
  wall('The Great Orcwall', 1925, 1335, Math.PI / 2 + 0.05, 17);
  wall('The Northwall', 3420, 400, Math.PI / 2 - 0.1, 11);
  wall('The Dwarven Gatewall', 1720, 520, Math.PI / 2, 12);
  wall('The Dusk Palisade', 560, 2480, Math.PI / 2 + 0.1, 9);
  wall('The Glasswall', 3040, 1170, Math.PI / 2 + 0.2, 10);
  wall('The Black Rampart', 2230, 1990, 0.05, 11);
  wall('The Serpent Wall', 3280, 1960, 0.12, 9);
  wall('The Sand March', 3600, 1150, Math.PI / 2 - 0.1, 8);

  // ---------------- NAMES + LABEL MACHINERY ----------------
  const NAMES = {
    human: [['Oak', 'Stone', 'River', 'High', 'Ash', 'Red', 'White', 'Gold', 'Wolf', 'Raven', 'Thorn', 'Bright', 'Iron', 'Salt', 'Hart', 'Crown', 'Mill', 'Elder'], ['ford', 'bridge', 'haven', 'mere', 'wick', 'ton', 'crest', 'hold', 'gate', 'field', 'stead', 'vale', 'wood', 'port']],
    elf: [['Ael', 'Sil', 'Lor', 'Thal', 'Eru', 'Fae', 'Mir', 'Nym', 'Ilu', 'Cael', 'Ara', 'Vael'], ['anor', 'ethil', 'alas', 'ielle', 'orien', 'wen', 'ithil', 'andel', 'ara', 'imar']],
    dwarf: [['Khaz', 'Dur', 'Bel', 'Thor', 'Grim', 'Kaz', 'Mor', 'Bar', 'Dun', 'Ar'], ['grim', 'dum', 'din', 'bar', 'rak', 'dun', 'heim', 'delve', 'forge', 'gard']],
    orc: [['Gor', 'Mog', 'Zug', 'Krag', 'Urz', 'Bolg', 'Gash', 'Narg', 'Ruk', 'Skar'], ['ash', 'gul', 'nak', 'rot', 'zog', 'mash', 'gat', 'dak', 'ush']],
    halfling: [['Bram', 'Hob', 'Tum', 'Pip', 'Bree', 'Dell', 'Mead', 'Fern', 'Cobb', 'Toad'], ['ford', 'hill', 'wick', 'bottom', 'by', 'end', 'burrow', 'dell', 'ham']],
    gnome: [['Cog', 'Tink', 'Whiz', 'Sprock', 'Gear', 'Fiz', 'Wob', 'Riv', 'Zib'], ['wick', 'ton', 'spindle', 'bolt', 'vale', 'bury', 'spring', 'works']],
    dragonborn: [['Kri', 'Ther', 'Draz', 'Zar', 'Vyr', 'Sar', 'Bhar', 'Kes', 'Rhaz'], ['akh', 'ixx', 'kar', 'shir', 'thrax', 'ak', 'ath', 'ezh']],
    lizardfolk: [['Ssur', 'Zha', 'Ith', 'Xul', 'Ka', 'Chu', 'Oss', 'Tza'], ['tl', 'xotl', 'an', 'ik', 'zoc', 'lac', 'ahn']],
    drow: [['Ched', 'Vel', 'Nar', 'Mol', 'Ilyth', 'Zek', 'Vhae', 'Szor'], ['ar', 'vir', 'noth', 'lyth', 'dros', 'nyl', 'ith']],
    merfolk: [['Thal', 'Nere', 'Coral', 'Pearl', 'Mari', 'Aqua', 'Tide', 'Sirena'], ['assa', 'ine', 'port', 'deep', 'ora', 'keep', 'reef']]
  };
  const usedNames = new Set();
  const mkName = (race) => {
    const [a, b] = NAMES[race];
    for (let i = 0; i < 40; i++) {
      let n = pick(a) + pick(b);
      if (race === 'drow' && rnd() < 0.5) n = pick(a) + "'" + pick(b)[0].toUpperCase() + pick(b).slice(1);
      if (race === 'lizardfolk' && rnd() < 0.35) n = pick(a) + '-' + pick(b);
      n = n[0].toUpperCase() + n.slice(1);
      if (!usedNames.has(n)) { usedNames.add(n); return n; }
    }
    return pick(a) + pick(b) + ' II';
  };
  const texts = [];
  let ti = 0;
  const FW = { Cinzel: 0.74, MedievalSharp: 0.56, 'Pirata One': 0.5, 'Uncial Antiqua': 0.62, Inter: 0.58 };
  const textW = (t, size, font, tracking = 0) => t.length * size * (FW[font] || 0.6) * (t === t.toUpperCase() ? 1.12 : 1) + Math.max(0, t.length - 1) * tracking;
  const lab = (text, x, y, size, o = {}) => {
    const t = { id: 'tx' + ++ti, text, x: rd(x), y: rd(y), size, color: o.color || '#271b12', stroke: o.stroke || '#fef3c7', font: o.font || 'MedievalSharp', curvature: o.curv || 0 };
    if (o.rot) t.rotation = +o.rot.toFixed(3);
    if (o.tracking) t.tracking = o.tracking;
    if (o.layer) t.layer = o.layer;
    texts.push(t);
    return t;
  };
  // put a name next to a stamp: below, above, right, left (first free slot wins); box reserved so nothing grows over it
  function nameLabel(text, st, size, o = {}) {
    const def = getStampById(st.stampId), hw = 40 * st.scale * (def?.aspect || 1), hh = 40 * st.scale;
    const font = o.font || 'MedievalSharp', w = textW(text, size, font, o.tracking || 0);
    const opts = [[0, hh + size * 0.6], [0, -hh - size * 0.6], [hw + w / 2 + 4, 4], [-hw - w / 2 - 4, 4], [0, hh + size * 1.5], [0, -hh - size * 1.5], [hw * 0.6 + w / 2, hh + size * 0.5], [-hw * 0.6 - w / 2, hh + size * 0.5], [hw + w / 2 + 4, hh * 0.8], [-hw - w / 2 - 4, hh * 0.8]];
    for (const [dx, dy] of opts) {
      const box = { x: st.x + dx, y: st.y + dy, rx: (w / 2) * 1.2 + 3, ry: size * 0.72, kind: 'label' };
      if (cd(box.x, box.y) < -40 && !o.sea) continue;
      if (occHit(box)) continue;
      occAdd(box);
      return lab(text, box.x, box.y, size, o);
    }
    return null;
  }

  // ---------------- SETTLEMENTS (every race: hamlet -> village -> town -> city -> capital) ----------------
  const TS = { hamlet: 0.95, village: 1.1, town: 1.3, city: 1.5, capital: 1.75 };
  const RANK = { hamlet: 0, village: 1, town: 2, city: 3, capital: 4 };
  const settle = [];
  const waterBrush = [];
  function addSet(race, tier, zone, o = {}) {
    let id = `set_${race}_${tier}`, sc = TS[tier] * (o.k || 1);
    if (!getStampById(id)) { if (tier === 'capital') { id = `set_${race}_city`; sc = TS.capital; } else return null; }
    const water = race === 'merfolk';
    const po = { pad: 20, z: 1, kind: 'settle', ...(water ? { water: true, minW: 44, maxW: 150 } : o.coast ? { margin: 20 } : {}) };
    let best = null, bs = -1e9;
    for (let k = 0; k < 100; k++) {
      const [x, y] = rndIn(zone), c = cd(x, y);
      if (!water && (o.coast ? c < 22 || c > 56 : c < 48)) continue;
      if (!place(id, x, y, sc, { ...po, dry: true })) continue;
      let s = R(0, 30);
      if (!water) {
        const rv = riverIdx.near(x, y, 180);
        if (RANK[tier] >= 3 && !o.coast) s += clamp(180 - rv, 0, 180) * 0.25 + Math.min(c, 160) * 0.1;
      }
      for (const q of settle) { const d = Math.hypot(q.x - x, q.y - y); if (d < 150) s -= (150 - d) * 0.4; }
      if (s > bs) { bs = s; best = [x, y]; }
    }
    if (!best) return null;
    const st = place(id, best[0], best[1], sc, po);
    if (!st) return null;
    const rec = { x: best[0], y: best[1], tier, race, name: mkName(race), st, port: !!o.coast, comp: compAt(best[0], best[1]), water };
    settle.push(rec);
    if (o.coast) { // dock on the sea side of the town
      const nx = cd(best[0] - ST, best[1]) - cd(best[0] + ST, best[1]), ny = cd(best[0], best[1] - ST) - cd(best[0], best[1] + ST), nl = Math.hypot(nx, ny) || 1;
      rec.dock = [best[0] + (nx / nl) * 62, best[1] + (ny / nl) * 62];
      place('port_dock', rec.dock[0], rec.dock[1], 0.8, { free: true, z: 1, kind: 'settle', noOcc: false });
    }
    if (water) waterBrush.push([best[0], best[1], RANK[tier] >= 3 ? 170 : 115]);
    return rec;
  }
  const SETS = [
    // race, zone, tier counts, ports (first n towns/cities sit on the coast)
    ['human', ZN.valdor, { capital: 1, city: 2, town: 4, village: 6, hamlet: 7 }, 3],
    ['elf', ZN.silvan, { capital: 1, city: 2, town: 3, village: 5, hamlet: 6 }, 1],
    ['dwarf', ZN.khaz, { capital: 1, city: 1, town: 2, village: 4, hamlet: 4 }, 0],
    ['human', ZN.frost, { city: 1, town: 2, village: 4, hamlet: 5 }, 2],
    ['dragonborn', ZN.sunscar, { city: 2, town: 2, village: 4, hamlet: 5 }, 1],
    ['orc', ZN.gorash, { city: 1, town: 2, village: 4, hamlet: 6 }, 0],
    ['drow', ZN.obsidian, { city: 1, town: 2, village: 3, hamlet: 4 }, 1],
    ['lizardfolk', ZN.jade, { city: 1, town: 2, village: 3, hamlet: 5 }, 1],
    ['lizardfolk', ZN.mire, { town: 1, village: 3, hamlet: 4 }, 0],
    ['halfling', ZN.shire, { city: 1, town: 2, village: 4, hamlet: 5 }, 1],
    ['gnome', ZN.gnome, { city: 1, town: 1, village: 2, hamlet: 3 }, 1],
    ['human', ZN.dusk, { town: 2, village: 3, hamlet: 4 }, 1]
  ];
  for (const [race, zone, counts, ports] of SETS) {
    let pn = ports;
    for (const tier of ['capital', 'city', 'town', 'village', 'hamlet']) {
      for (let i = 0; i < (counts[tier] || 0); i++) {
        const coast = (tier === 'city' || tier === 'town') && pn > 0;
        if (addSet(race, tier, zone, { coast }) && coast) pn--;
        else if (coast) addSet(race, tier, zone, {});
      }
    }
  }
  // merfolk: reef cities in shallow water off three coasts
  for (const [zone, counts] of [[Z(2760, 1110, 270, 210), { city: 1, town: 1, village: 3, hamlet: 3 }], [Z(1300, 1900, 430, 70), { town: 1, village: 2, hamlet: 2 }], [Z(950, 830, 320, 55), { town: 1, village: 2, hamlet: 1 }], [Z(3500, 1700, 260, 100), { town: 1, village: 2, hamlet: 2 }]]) {
    for (const tier of ['city', 'town', 'village', 'hamlet']) for (let i = 0; i < (counts[tier] || 0); i++) addSet('merfolk', tier, zone);
  }

  // castles, shrines, ruins, outposts: landmarks that belong to a race / region
  const specials = [];
  const SPECIAL = [
    [ZN.valdor, [['cas_human_castle', 2, 1.35], ['cas_human_keep', 3, 1.15], ['cas_human_fortress', 1, 1.35], ['cas_monastery', 1, 1.2], ['cas_temple', 1, 1.15], ['cas_shrine', 2, 0.95], ['castle_citadel', 1, 1.3], ['fortress_keep', 1, 1.2], ['civ_temple', 1, 1.0], ['cas_ruin_castle', 1, 1.2], ['cas_ruin_village', 1, 1.0], ['cas_standing_stones', 1, 1.0], ['ruins_stonehenge', 1, 1.1], ['cas_beacon_tower', 2, 0.9]]],
    [ZN.silvan, [['cas_elf_citadel', 1, 1.5], ['cas_elf_treehold', 3, 1.2], ['cas_elf_moonspire', 2, 1.2], ['cas_shrine', 1, 0.95], ['cas_standing_stones', 1, 1.0], ['cas_wizard_spire', 1, 1.2], ['tower_wizard', 1, 1.1]]],
    [ZN.khaz, [['cas_dwarf_mountain_hold', 2, 1.4], ['cas_dwarf_forge_hold', 2, 1.3], ['cas_dwarf_gate_hold', 1, 1.3], ['cas_mine_entrance', 4, 1.0], ['cas_wizard_observatory', 1, 1.2]]],
    [ZN.frost, [['cas_human_citadel', 1, 1.4], ['cas_human_fortress', 1, 1.2], ['cas_dragon_lair', 1, 1.4], ['cas_outpost', 2, 1.0], ['cas_ruin_tower', 1, 1.0], ['cas_crypt', 1, 1.0], ['cas_monastery', 1, 1.1]]],
    [ZN.sunscar, [['cas_dragon_temple', 1, 1.4], ['cas_dragon_roost', 3, 1.2], ['camp_tent', 6, 0.9], ['cas_ruin_castle', 1, 1.2], ['cas_standing_stones', 1, 1.0], ['cas_shrine', 1, 1.0]]],
    [ZN.gorash, [['cas_orc_warcamp', 2, 1.3], ['cas_goblin_fort', 3, 1.1], ['cas_orc_fortress', 1, 1.4], ['cas_orc_bone_totem', 3, 1.0], ['cas_mine_entrance', 2, 1.0], ['cas_ruin_tower', 1, 1.0]]],
    [ZN.obsidian, [['cas_drow_spire', 2, 1.3], ['cas_dark_necro_tower', 2, 1.3], ['cas_dark_citadel', 1, 1.5], ['cas_tiefling_keep', 1, 1.3], ['cas_dungeon_entrance', 2, 1.1], ['cas_crypt', 1, 1.1], ['cas_ruin_castle', 1, 1.2]]],
    [ZN.jade, [['cas_ruin_village', 2, 1.1], ['cas_ruin_castle', 1, 1.2], ['cas_shrine', 2, 1.0], ['cas_dragon_temple', 1, 1.2], ['cas_watchtower', 2, 1.0]]],
    [ZN.mire, [['cas_crypt', 1, 1.1], ['cas_ruin_village', 1, 1.0], ['cas_ruin_tower', 2, 1.0], ['cas_dark_necro_tower', 1, 1.2]]],
    [ZN.shire, [['cas_halfling_burrow_hall', 2, 1.3], ['cas_halfling_folly', 2, 1.1], ['farm_homestead', 6, 1.0], ['windmill_rustic', 3, 1.0], ['windmill', 2, 0.95]]],
    [ZN.gnome, [['cas_gnome_workshop', 2, 1.3], ['windmill', 2, 0.95], ['cas_wizard_crystal', 1, 1.1]]],
    [ZN.dusk, [['camp_tent', 4, 0.9], ['cas_outpost', 1, 1.0], ['cas_shrine', 1, 1.0]]]
  ];
  for (const [zone, list] of SPECIAL) {
    for (const [id, n, sc] of list) {
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < 80; k++) {
          const [x, y] = rndIn(zone);
          const st = place(id, x, y, sc * R(0.95, 1.1), { pad: 14, z: 1, kind: 'settle', margin: 40 });
          if (st) { specials.push({ x, y, id, st }); break; }
        }
      }
    }
  }
  // coastal landmarks
  const coastal = (id, n, sc, zones) => {
    for (let i = 0; i < n; i++) for (let k = 0; k < 120; k++) {
      const [x, y] = rndIn(pick(zones)), c = cd(x, y);
      if (c < 14 || c > 38) continue;
      const nx = cd(x - ST, y) - cd(x + ST, y), ny = cd(x, y - ST) - cd(x, y + ST);
      if (place(id, x, y, sc, { pad: 10, z: 1, kind: 'settle', margin: 12, rot: 0 })) { void nx; void ny; break; }
    }
  };
  coastal('cas_lighthouse', 4, 1.0, [ZN.valdor, ZN.silvan, ZN.frost, ZN.dusk]);
  coastal('civ_lighthouse', 2, 0.95, [ZN.sunscar, ZN.jade, ZN.shire]);
  coastal('cas_fishing_pier', 3, 1.0, [ZN.valdor, ZN.gnome, ZN.shire]);
  coastal('cas_harbour_town', 2, 1.1, [ZN.valdor, ZN.silvan]);
  coastal('cas_sea_fortress', 2, 1.2, [ZN.valdor, ZN.sunscar]);
  place('cas_wizard_spire', 450, 880, 1.5, { free: true, z: 1, kind: 'settle' });
  place('cas_wizard_crystal', 400, 925, 1.1, { free: true, z: 1, kind: 'settle' });
  place('cas_wizard_observatory', 505, 925, 1.1, { free: true, z: 1, kind: 'settle' });
  place('cas_ruin_tower', 1750, 120, 1.0, { free: true, z: 1, kind: 'settle' });
  place('cas_beacon_tower', 1690, 135, 0.9, { free: true, z: 1, kind: 'settle' });
  place('cas_crypt', 130, 790, 1.0, { free: true, z: 1, kind: 'settle' });
  place('cas_ruin_village', 2900, 2570, 0.9, { free: true, z: 1, kind: 'settle' });

  // settlement names (biggest first so they get the best slots)
  const LABELFONT = { elf: 'Uncial Antiqua', orc: 'Pirata One', drow: 'Pirata One', dwarf: 'Cinzel' };
  const LABELCOL = {
    drow: ['#f3e8ff', '#2e1065'], orc: ['#fee2e2', '#450a0a'], lizardfolk: ['#ecfccb', '#14532d'], merfolk: ['#e0f2fe', '#0c4a6e'],
    elf: ['#14532d', '#ecfccb'], dwarf: ['#1c1917', '#fde68a'], dragonborn: ['#7c2d12', '#fef3c7'], halfling: ['#3f2a0c', '#fef9c3'], gnome: ['#3b2a14', '#fef3c7'], human: ['#1c1208', '#fef3c7']
  };
  const TSIZE = { capital: 34, city: 27, town: 21, village: 17, hamlet: 14 };
  for (const s of [...settle].sort((a, b) => RANK[b.tier] - RANK[a.tier])) {
    if (s.tier === 'hamlet' && rnd() < 0.45) continue;
    let [color, stroke] = LABELCOL[s.race] || LABELCOL.human;
    const onSnow = s.x > 2600 && s.y < 640;
    if (onSnow && s.race === 'human') { color = '#1e3a5f'; stroke = '#f8fafc'; }
    nameLabel(s.name, s.st, TSIZE[s.tier], { font: RANK[s.tier] >= 3 ? (LABELFONT[s.race] || 'Cinzel') : LABELFONT[s.race] || 'MedievalSharp', color, stroke, sea: s.water });
  }

  // ---------------- TERRAIN: ranges, hills, forests, ground cover ----------------
  const MTN = { fit: 0.45, kind: 'mtn', overRiver: true }, TREE = { fit: 0.34, kind: 'tree' }, GC = { fit: 0.7, kind: 'gc' };
  const MT = ['mountain_grand', 'mountain_range'];
  const shift = (line, dx, dy) => line.map(([x, y]) => [x + dx, y + dy]);
  const range = (line, step, sc, o = {}) => {
    along(line, step * 0.72, MT, sc, 16, { ...MTN, ...o });
    along(shift(line, -10, -46), step * 1.2, ['mountain_snow_peak'], [sc[0] * 0.75, sc[1] * 0.85], 12, { ...MTN, ...o });
    along(shift(line, 6, 58), step * 0.9, ['hills_rolling'], [0.75, 1.0], 14, { ...MTN, ...o });
  };
  // Valdoria: Redcrag Range along the north, Ironback spur in the east
  range([[760, 1090], [880, 1040], [1020, 1010], [1170, 995], [1320, 1010], [1470, 1040], [1600, 1080], [1690, 1130]], 66, [1.15, 1.6]);
  along([[1700, 1150], [1730, 1250], [1760, 1340], [1740, 1450]], 74, MT, [0.95, 1.3], 12, MTN);
  // Khaz Druum: ridges framing the dwarven valley
  range([[1600, 430], [1700, 402], [1830, 388], [1960, 382], [2080, 388], [2200, 402], [2300, 432]], 62, [1.2, 1.7]);
  range([[1590, 668], [1720, 694], [1860, 706], [2000, 708], [2140, 694], [2260, 664]], 62, [1.1, 1.55]);
  along([[1555, 480], [1565, 560], [1585, 630]], 70, MT, [1.0, 1.4], 10, MTN);
  along([[2330, 480], [2340, 560], [2320, 620]], 70, MT, [1.0, 1.4], 10, MTN);
  scatter(ZN.khaz, 14, ['mountain_snow_peak', 'mountain_grand'], [1.0, 1.5], MTN);
  // Frostmarch
  range([[2700, 250], [2850, 230], [3000, 216], [3150, 206], [3300, 210], [3450, 226], [3600, 252]], 64, [1.0, 1.5]);
  along([[2790, 495], [2950, 510], [3120, 520], [3300, 510], [3460, 490]], 80, ['hills_rolling', 'mountain_snow_peak'], [0.9, 1.2], 14, MTN);
  scatter(ZN.frost, 10, ['mountain_snow_peak'], [0.9, 1.3], MTN);
  // Silvan hills, Sunscar mesas + dunes, Gorash crags, Obsidian volcanoes
  range([[540, 300], [660, 285], [790, 288], [910, 300], [1010, 326]], 70, [1.0, 1.4]);
  scatter(ZN.silvan, 14, ['hills_rolling'], [0.85, 1.15], MTN);
  scatter(Z(3100, 1000, 220, 100), 5, ['mountain_mesa'], [1.0, 1.45], MTN);
  scatter(Z(3500, 1060, 230, 90), 5, ['mountain_mesa'], [1.0, 1.45], MTN);
  scatter(ZN.sunscar, 22, ['hills_dunes'], [0.9, 1.3], MTN);
  range([[2080, 1225], [2200, 1185], [2330, 1172], [2450, 1192], [2560, 1236]], 66, [1.0, 1.5], { fit: 0.55 });
  place('mountain_volcano', 2320, 1300, 1.9, { free: true, z: 0, nat: true });
  scatter(ZN.gorash, 10, ['mountain_range', 'boulder_cluster', 'hills_rolling'], [0.9, 1.3], MTN);
  place('mountain_volcano', 2240, 2200, 2.4, { free: true, z: 0, nat: true });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283 + 0.3; place(i % 2 ? 'volcano_lite' : 'mountain_volcano', 2240 + Math.cos(a) * 210, 2200 + Math.sin(a) * 120, i % 2 ? 1.2 : 1.1, { nat: true, ...MTN, margin: 20 }); }
  scatter(ZN.obsidian, 10, ['boulder_cluster', 'volcano_lite'], [0.9, 1.3], MTN);
  scatter(ZN.jade, 8, ['hills_rolling'], [0.85, 1.25], MTN);
  scatter(ZN.shire, 10, ['hills_rolling'], [0.8, 1.1], MTN);
  scatter(ZN.gnome, 6, ['hills_rolling', 'mountain_range'], [0.8, 1.1], MTN);
  scatter(ZN.dusk, 4, ['mountain_mesa', 'boulder_cluster'], [0.8, 1.1], MTN);
  scatter(Z(1750, 130, 150, 40), 3, ['mountain_snow_peak'], [0.8, 1.0], MTN);
  scatter(ZN.valdor, 10, ['hills_rolling'], [0.8, 1.1], MTN);
  scatter(Z(2900, 2570, 80, 40), 2, ['volcano_lite'], [0.8, 1.0], { ...MTN, margin: 10 });

  // extra peaks scattered through the highlands
  for (const [z, n, ids, sc] of [[ZN.redcrag, 22, [...MT, 'mountain_snow_peak'], [1.1, 1.5]], [ZN.khaz, 20, [...MT, 'mountain_snow_peak'], [1.1, 1.6]], [ZN.frost, 14, ['mountain_snow_peak', 'mountain_range'], [1.0, 1.4]], [ZN.silvan, 8, MT, [1.0, 1.3]], [ZN.gorash, 6, ['mountain_range'], [1.0, 1.4]], [ZN.obsidian, 6, ['mountain_range'], [1.0, 1.4]], [ZN.jade, 4, MT, [0.9, 1.3]], [ZN.sunscar, 6, ['mountain_range'], [1.0, 1.4]], [ZN.gnome, 3, MT, [0.9, 1.2]]]) scatter(z, n, ids, sc, MTN);
  // mountains and hills are solid: roads (A*) route around them, forests grow between them
  const mtnCost = new Uint8Array(GW * GH);
  for (const s of stamps) if (/^(mountain_|hills_|volcano)/.test(s.stampId)) disc(mtnCost, s.x, s.y, 34 * s.scale, 1);

  // ---------------- ROADS & SEA LANES (A* over the raster) ----------------
  const NZ = new Float32Array(GW * GH);
  {
    const cs = 6, gw = Math.ceil(GW / cs) + 2, gh = Math.ceil(GH / cs) + 2, g = [];
    for (let i = 0; i < gw * gh; i++) g.push(rnd());
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const fx = x / cs, fy = y / cs, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1], c = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1];
      NZ[y * GW + x] = a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
    }
  }
  const roadMul = new Float32Array(GW * GH).fill(1);
  const pen = new Int16Array(GW * GH);
  settle.forEach((s, i) => { s.pi = i; if (!s.water) disc(pen, s.x, s.y, 40 * s.st.scale * (getStampById(s.st.stampId)?.aspect || 1) * 0.75, i + 1); });
  const gArr = new Float32Array(GW * GH), vArr = new Int32Array(GW * GH), fromArr = new Int32Array(GW * GH);
  let ver = 0;
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  function astar(a, b, mode, ownA = -1, ownB = -1) {
    ver++;
    const s = cIdx(a[0], a[1]), t = cIdx(b[0], b[1]), tx = t % GW, ty = (t / GW) | 0;
    const cost = (i) => {
      if (i === s || i === t) return 1;
      if (mode === 'land') {
        if (!land[i]) return 1e9;
        let c = 1 + NZ[i] * 0.7 + (field[i] < 28 ? (28 - field[i]) * 0.05 : 0);
        if (riverMask[i]) c += 9;
        if (pen[i] && pen[i] - 1 !== ownA && pen[i] - 1 !== ownB) c += 14;
        if (mtnCost[i]) c += 7;
        return c * roadMul[i];
      }
      if (field[i] > -30) return 1e9;
      return (1 + NZ[i] * 0.5 + (field[i] > -70 ? 0.5 : 0)) * roadMul[i];
    };
    const hF = [], hI = [];
    const push = (f, i) => { let k = hF.length; hF.push(f); hI.push(i); while (k > 0) { const p = (k - 1) >> 1; if (hF[p] <= f) break; hF[k] = hF[p]; hI[k] = hI[p]; k = p; } hF[k] = f; hI[k] = i; };
    const pop = () => {
      const i0 = hI[0], f = hF.pop(), i = hI.pop(), n = hF.length;
      if (n) { let k = 0; for (;;) { let c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && hF[c + 1] < hF[c]) c++; if (hF[c] >= f) break; hF[k] = hF[c]; hI[k] = hI[c]; k = c; } hF[k] = f; hI[k] = i; }
      return i0;
    };
    gArr[s] = 0; vArr[s] = ver; fromArr[s] = -1;
    push(0, s);
    let guard = 0;
    while (hI.length && guard++ < 400000) {
      const cur = pop();
      if (cur === t) break;
      const cx = cur % GW, cy = (cur / GW) | 0, cg = gArr[cur];
      for (const [dx, dy, w] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = ny * GW + nx, c = cost(ni);
        if (c >= 1e8) continue;
        const ng = cg + c * w;
        if (vArr[ni] !== ver || ng < gArr[ni]) { vArr[ni] = ver; gArr[ni] = ng; fromArr[ni] = cur; push(ng + 0.85 * Math.hypot(nx - tx, ny - ty), ni); }
      }
    }
    if (vArr[t] !== ver) return null;
    const cells = [];
    for (let i = t; i !== -1; i = fromArr[i]) cells.push(i);
    return cells.reverse();
  }
  const cellPt = (i) => [((i % GW) + 0.5) * ST, (((i / GW) | 0) + 0.5) * ST];
  // thin a cell path to control points (~28 px apart), keeping the ends
  const thin = (cells, every = 4) => cells.filter((_, k) => k % every === 0 || k === cells.length - 1).map(cellPt);
  const bridgeSpots = [];
  const roadDense = [];
  const linked = new Set();
  const RC = { human: '#6b4423', elf: '#d8c670', dwarf: '#4b5563', orc: '#c2662d', halfling: '#8a6a2a', gnome: '#7a5a3a', dragonborn: '#9a5a1a', lizardfolk: '#e0d08a', drow: '#b9a2f5', merfolk: '#2a6a8a' };
  function road(A, B, o = {}) {
    const key = A.pi < B.pi ? A.pi + '-' + B.pi : B.pi + '-' + A.pi;
    if (linked.has(key)) return false;
    const cells = astar([A.x, A.y], [B.x, B.y], 'land', A.pi, B.pi);
    if (!cells || cells.length > 140) return false;
    linked.add(key);
    // bridges where the road enters a river
    for (let k = 1; k < cells.length; k++) {
      if (riverMask[cells[k]] && !riverMask[cells[k - 1]]) {
        let e = k, wmax = riverMask[cells[k]]; while (e < cells.length - 1 && riverMask[cells[e + 1]]) { e++; wmax = Math.max(wmax, riverMask[cells[e]]); }
        if (e - k <= 6 && wmax >= 6) { const m = cellPt(cells[(k + e) >> 1]), p0 = cellPt(cells[Math.max(0, k - 1)]), p1 = cellPt(cells[Math.min(cells.length - 1, e + 1)]); bridgeSpots.push([m[0], m[1], flatAng(ang(p0, p1))]); }
        k = e;
      }
    }
    const pts = thin(cells, 4);
    const dense = _smoothLine(pts, 6);
    roadIdx.add(dense, 3);
    for (const c of cells) roadMul[c] = Math.min(roadMul[c], 0.55);
    roadDense.push(dense);
    const royal = o.royal;
    addPath('road', royal ? 7 : o.w || 5, o.color || RC[A.race] || '#78350f', pts, { dashed: !royal });
    return true;
  }
  // road network: every settlement links to its nearest bigger neighbour on the same landmass; big towns form a mesh
  const landSet = settle.filter((s) => !s.water);
  const byComp = {};
  for (const s of landSet) (byComp[s.comp] ??= []).push(s);
  for (const grp of Object.values(byComp)) {
    const big = grp.filter((s) => RANK[s.tier] >= 3);
    // Prim over cities/capitals: royal roads
    if (big.length > 1) {
      const inT = [big[0]], rest = big.slice(1);
      while (rest.length) {
        let bd = 1e9, bi = -1, bj = -1;
        inT.forEach((a, i) => rest.forEach((b, j) => { const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd) { bd = d; bi = i; bj = j; } }));
        const b = rest.splice(bj, 1)[0];
        road(inT[bi], b, { royal: true });
        inT.push(b);
      }
    }
    for (const s of grp.sort((a, b) => RANK[b.tier] - RANK[a.tier])) {
      if (RANK[s.tier] >= 3 && big.length > 1) continue;
      let cand = grp.filter((q) => q !== s && RANK[q.tier] > RANK[s.tier]);
      if (!cand.length) cand = grp.filter((q) => q !== s && RANK[q.tier] >= RANK[s.tier]);
      cand.sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y));
      for (const q of cand.slice(0, 3)) if (Math.hypot(q.x - s.x, q.y - s.y) < 700 && road(s, q, { w: RANK[s.tier] >= 2 ? 6 : RANK[s.tier] === 1 ? 5 : 4 })) break;
    }
    // a second link for towns, so the network has loops
    for (const s of grp.filter((q) => q.tier === 'town')) {
      const near = grp.filter((q) => q !== s && RANK[q.tier] >= 2).sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[1];
      if (near && Math.hypot(near.x - s.x, near.y - s.y) < 600) road(s, near, { w: 5 });
    }
  }
  // lone castles / roosts get a trail to the nearest village
  specials.filter((_, i) => i % 3 === 0).forEach((sp) => {
    const rec = { x: sp.x, y: sp.y, pi: 5000 + sp.st.id.length * 1000 + (sp.st.x % 997), race: 'human' };
    const near = landSet.filter((q) => RANK[q.tier] >= 1 && compAt(q.x, q.y) === compAt(sp.x, sp.y)).sort((a, b) => Math.hypot(a.x - sp.x, a.y - sp.y) - Math.hypot(b.x - sp.x, b.y - sp.y))[0];
    if (near && Math.hypot(near.x - sp.x, near.y - sp.y) < 420) road(rec, near, { w: 3.5, color: '#8a6a45' });
  });
  // bridges (stone, rotated to the road, scaled to the river)
  for (const [bx, by, ba] of bridgeSpots) place('bridge_stone', bx, by, 0.5, { free: true, rot: ba, z: 0, kind: 'bridge' });

  // sea lanes between ports on different landmasses (c_trade layer)
  const lanes = [];
  const seaSpot = (p) => {
    for (let r = 0; r < 260; r += 8) for (let a = 0; a < 6.28; a += 0.5) {
      const x = p[0] + Math.cos(a) * r, y = p[1] + Math.sin(a) * r;
      if (cd(x, y) < -34) return [x, y];
    }
    return null;
  };
  const ports = settle.filter((s) => s.port || (s.water && RANK[s.tier] >= 2));
  const laneKey = new Set();
  for (const p of ports) {
    const others = ports.filter((q) => q !== p && q.comp !== p.comp && !(p.water && q.water)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    for (const q of others.slice(0, 2)) {
      const key = [p.pi, q.pi].sort().join('-');
      if (laneKey.has(key) || Math.hypot(q.x - p.x, q.y - p.y) > 1500) continue;
      const a = seaSpot(p.dock || [p.x, p.y]), b = seaSpot(q.dock || [q.x, q.y]);
      if (!a || !b) continue;
      const cells = astar(a, b, 'sea');
      if (!cells) continue;
      laneKey.add(key);
      for (const c of cells) roadMul[c] = Math.min(roadMul[c], 0.7);
      const pts = thin(cells, 5);
      lanes.push(pts);
    }
  }


  // forests: tight spray-like groves, every stamp with its own flip / tone / hue / seed (and tinted foliage)
  const ELF = ['tr_oak', 'tr_oak_ancient', 'tr_elm', 'tr_round', 'tr_willow', 'tr_birch', 'tr_grove_oak', 'tr_oak'];
  const ELFTINT = ['#6fae7a', '#5fa08a', '#7cc08a', '#8fbf70', '#58a07a'];
  groves(ZN.silvan, 30, 13, 64, ELF, [0.6, 0.9], { ...TREE, fill: ELFTINT });
  groves(Z(720, 470, 300, 120, 0.1), 6, 11, 70, ['tr_glow', 'tr_oak_ancient', 'tr_willow'], [0.7, 0.95], { ...TREE });
  place('tr_world', 640, 520, 1.5, { z: 1, ...{ nat: true }, margin: 30, fit: 0.9 });
  groves(ZN.eldwood, 13, 12, 58, ['tr_oak', 'tr_round', 'tr_elm', 'tr_autumn_gold', 'tr_oak_ancient', 'tr_grove_oak'], [0.6, 0.85], TREE);
  groves(ZN.greenwold, 10, 11, 58, ['tr_oak', 'tr_round', 'tr_autumn_red', 'tr_birch', 'tr_autumn_gold', 'tr_elm'], [0.6, 0.85], TREE);
  groves(ZN.valdor, 18, 8, 52, ['tr_oak', 'tr_round', 'tr_elm', 'tr_birch'], [0.55, 0.8], TREE);
  groves(ZN.frost, 22, 10, 56, ['tr_snowy_pine', 'tr_snowy_spruce', 'tr_grove_snow', 'tr_snowy_pine'], [0.6, 0.9], TREE);
  groves(ZN.khaz, 9, 8, 52, ['tr_pine', 'tr_spruce', 'tr_snowy_pine', 'tr_fir_squat'], [0.55, 0.8], TREE);
  groves(Z(1750, 130, 150, 40), 2, 5, 30, ['tr_snowy_pine', 'tr_snowy_spruce'], [0.55, 0.7], TREE);
  groves(Z(3300, 1420, 330, 80, 0.1), 10, 6, 48, ['tr_acacia', 'tr_baobab', 'tr_acacia'], [0.6, 0.85], TREE);
  groves(Z(3260, 1260, 70, 50), 2, 6, 34, ['tr_palm', 'tr_palm_lean'], [0.6, 0.8], { ...TREE, margin: 18 });
  groves(ZN.gorash, 14, 6, 48, ['tr_dead', 'tr_gnarled', 'tr_barren'], [0.55, 0.8], TREE);
  groves(ZN.obsidian, 12, 6, 48, ['tr_barren', 'tr_dead', 'tr_gnarled'], [0.55, 0.8], TREE);
  groves(ZN.obsidian, 3, 5, 36, ['tr_crystal', 'tr_glow'], [0.65, 0.9], { ...TREE, color: '#3b0764' });
  groves(ZN.jade, 24, 12, 60, ['tr_palm', 'tr_palm_lean', 'tr_bush', 'tr_willow', 'tr_palm'], [0.6, 0.9], TREE);
  groves(ZN.jade, 4, 4, 40, ['tr_baobab', 'tr_acacia'], [0.7, 0.9], TREE);
  groves(ZN.mire, 16, 8, 50, ['tr_willow', 'tr_dead', 'tr_gnarled', 'tr_willow'], [0.6, 0.85], TREE);
  groves(ZN.shire, 11, 8, 48, ['tr_round', 'tr_bush', 'tr_oak', 'tr_birch'], [0.55, 0.8], TREE);
  groves(ZN.gnome, 8, 7, 46, ['tr_birch', 'tr_fir_squat', 'tr_round'], [0.55, 0.8], TREE);
  groves(ZN.dusk, 11, 6, 46, ['tr_acacia', 'tr_baobab', 'tr_acacia', 'tr_bush'], [0.6, 0.85], TREE);
  groves(Z(450, 900, 100, 45), 2, 4, 28, ['tr_crystal', 'tr_glow'], [0.7, 0.9], { ...TREE, margin: 14 });
  for (const [x, y] of [[2700, 1060], [2810, 1140], [2670, 1190], [2830, 1020]]) groves(Z(x, y, 34, 22), 1, 3, 20, ['tr_palm', 'tr_palm_lean'], [0.55, 0.7], { ...TREE, margin: 10 });
  scatter(Z(130, 800, 70, 50), 4, ['tr_dead', 'tr_gnarled'], [0.55, 0.75], { ...TREE, margin: 12 });
  scatter(Z(2900, 2570, 70, 40), 3, ['tr_dead', 'tr_barren'], [0.5, 0.7], { ...TREE, margin: 10 });
  scatter(Z(3880, 1030, 30, 50), 2, ['boulder_cluster'], [0.5, 0.6], { ...MTN, margin: 8 });

  // ground cover: the small stuff that makes a biome read
  const gcover = (zone, n, ids, sc = [0.4, 0.6]) => scatter(zone, n, ids, sc, GC);
  gcover(ZN.silvan, 30, ['veg_fern', 'veg_mushrooms', 'veg_flowers_patch', 'veg_bush_round', 'veg_stump']);
  gcover(ZN.valdor, 40, ['veg_grass_tuft', 'veg_flowers_patch', 'veg_bush_round', 'veg_bush_berry', 'veg_rock_mossy', 'veg_log_fallen']);
  gcover(ZN.farmland, 16, ['veg_flowers_patch', 'veg_grass_tall']);
  gcover(ZN.frost, 18, ['veg_shrub_low', 'veg_rock_mossy', 'veg_grass_tuft']);
  gcover(ZN.khaz, 14, ['veg_shrub_low', 'veg_rock_mossy', 'veg_thorn_scrub']);
  gcover(ZN.sunscar, 42, ['veg_cactus_saguaro', 'veg_cactus_barrel', 'veg_cactus_prickly', 'veg_thorn_scrub']);
  gcover(ZN.gorash, 18, ['veg_thorn_scrub', 'veg_rock_mossy', 'veg_stump']);
  gcover(ZN.obsidian, 12, ['veg_thorn_scrub', 'veg_mushrooms']);
  gcover(ZN.jade, 36, ['veg_bamboo', 'veg_fern', 'veg_bush_berry', 'veg_mushrooms', 'veg_flowers_patch']);
  gcover(ZN.mire, 28, ['veg_reeds', 'veg_reeds', 'veg_mushrooms', 'veg_log_fallen', 'veg_grass_tall']);
  gcover(ZN.shire, 22, ['veg_flowers_patch', 'veg_grass_tuft', 'veg_bush_berry', 'veg_bush_round']);
  gcover(ZN.gnome, 10, ['veg_flowers_patch', 'veg_shrub_low']);
  gcover(ZN.dusk, 24, ['veg_grass_tall', 'veg_grass_tuft', 'veg_thorn_scrub', 'veg_cactus_barrel']);
  scatter(Z(1200, 2270, 320, 170), 3, ['nature_lily_pond'], [0.6, 0.8], { ...GC, margin: 22 });
  scatter(Z(3300, 1260, 60, 40), 1, ['nature_lily_pond'], [0.6, 0.7], { ...GC, margin: 12 });
  scatter(ZN.farmland, 7, ['farm_homestead', 'windmill'], [0.75, 0.95], { kind: 'stamp', fit: 0.8 });
  scatter(ZN.shire, 4, ['farm_homestead'], [0.75, 0.9], { kind: 'stamp', fit: 0.8 });
  scatter(ZN.valdor, 3, ['village_houses'], [0.8, 1.0], { kind: 'stamp' });
  // lone trees between the groves
  const lone = (zone, n, ids, o = {}) => scatter(zone, n, ids, [0.5, 0.78], { ...TREE, fit: 0.5, ...o });
  lone(ZN.valdor, 70, ['tr_oak', 'tr_round', 'tr_elm', 'tr_birch', 'tr_autumn_gold', 'tr_bush']);
  lone(ZN.silvan, 40, ELF, { fill: ELFTINT });
  lone(ZN.frost, 30, ['tr_snowy_pine', 'tr_snowy_spruce']);
  lone(ZN.khaz, 18, ['tr_pine', 'tr_spruce']);
  lone(ZN.sunscar, 16, ['tr_acacia', 'tr_palm_lean']);
  lone(ZN.shire, 24, ['tr_round', 'tr_oak', 'tr_bush']);
  lone(ZN.jade, 30, ['tr_palm', 'tr_palm_lean', 'tr_willow']);
  lone(ZN.mire, 20, ['tr_willow', 'tr_gnarled']);
  lone(ZN.gnome, 12, ['tr_birch', 'tr_round']);
  lone(ZN.dusk, 20, ['tr_acacia', 'tr_baobab']);

  // ---------------- BIOME BRUSHES (soft transitions, every blend mode, land + water targets) ----------------
  const brushStrokes = [];
  let bi = 0;
  const mkBrush = (biome, size, soft, op, blend, pts, target = 'foreground') => brushStrokes.push({ id: 'bb' + ++bi, type: 'brush', target, biome, size, opacity: op, softness: soft, blendMode: blend, points: pts.map(([x, y]) => ({ x: rd(x), y: rd(y) })) });
  function paintZ(biome, z, size, soft, op, blend = 'source-over', spacing = 0.5) {
    const step = size * spacing, pts = [];
    let dir = 1;
    for (let v = -z.ry; v <= z.ry + 1; v += step) {
      const hw = z.rx * Math.sqrt(Math.max(0, 1 - (v / z.ry) ** 2)), row = [];
      for (let u = -hw; u <= hw + 1; u += step) row.push([u, v]);
      if (!row.length) row.push([0, v]);
      if (dir < 0) row.reverse();
      dir = -dir;
      pts.push(...row);
    }
    const c = Math.cos(z.rot || 0), s = Math.sin(z.rot || 0);
    const w = pts.map(([u, v]) => [z.cx + u * c - v * s + R(-1, 1) * size * 0.1, z.cy + u * s + v * c + R(-1, 1) * size * 0.1]);
    for (let i = 0; i < w.length; i += 24) mkBrush(biome, size, soft, op, blend, w.slice(i, i + 25));
  }
  const SO = 'source-over', MU = 'multiply', OV = 'overlay', SL = 'soft-light';
  // Valdoria
  paintZ('farmland', Z(1280, 1480, 360, 160), 150, 0.85, 0.9, SO);
  paintZ('farmland', Z(900, 1560, 140, 80), 110, 0.8, 0.75, SO);
  paintZ('forest_floor', Z(880, 1250, 170, 230), 120, 0.8, 0.85, SO);
  paintZ('forest_floor', Z(1570, 1500, 200, 150), 120, 0.8, 0.75, SO);
  paintZ('tundra', Z(1250, 1020, 520, 90), 110, 0.85, 0.7, SO);
  paintZ('badlands', Z(1200, 990, 360, 55), 90, 0.85, 0.5, MU);
  paintZ('swamp_mire', Z(1040, 1700, 130, 45), 80, 0.8, 0.85, SO);
  paintZ('parchment', Z(1250, 1330, 420, 300, -0.1), 190, 0.9, 0.3, OV);
  paintZ('savanna', Z(1700, 1600, 110, 90), 90, 0.85, 0.7, SO);
  // Silvanreach
  paintZ('grassland', Z(900, 560, 150, 80), 100, 0.8, 0.7, SO);
  paintZ('jungle', Z(560, 430, 230, 110, 0.1), 130, 0.9, 0.4, OV);
  paintZ('forest_floor', Z(720, 470, 330, 130, 0.1), 140, 0.9, 0.5, MU);
  // Khaz Druum
  paintZ('snow', Z(1950, 500, 330, 140), 120, 0.85, 0.85, SO);
  paintZ('badlands', Z(1760, 640, 140, 70), 90, 0.8, 0.5, MU);
  paintZ('badlands', Z(2200, 470, 120, 80), 90, 0.8, 0.7, SO);
  paintZ('dirt_cave', Z(1980, 560, 90, 55), 60, 0.5, 0.85, SO);
  // Frostmarch
  paintZ('tundra', Z(3050, 440, 420, 130), 130, 0.85, 0.8, SO);
  paintZ('forest_floor', Z(2950, 500, 190, 70), 100, 0.8, 0.5, SO);
  paintZ('dungeon_flagstone', Z(3250, 330, 45, 30), 54, 0.75, 0.8, SO);
  // Sunscar
  paintZ('savanna', Z(3380, 1420, 300, 90, 0.1), 110, 0.85, 0.8, SO);
  paintZ('badlands', Z(3000, 1010, 160, 70), 90, 0.8, 0.6, MU);
  paintZ('grassland', Z(3260, 1260, 70, 50), 60, 0.85, 0.9, SO);
  paintZ('parchment', Z(3450, 1110, 260, 150, 0.2), 150, 0.9, 0.35, SL);
  paintZ('ash_waste', Z(3600, 1280, 110, 70), 80, 0.8, 0.5, MU);
  // Gorash
  paintZ('ash_waste', Z(2340, 1350, 300, 190, 0.3), 130, 0.85, 0.75, SO);
  paintZ('lava_molten', Z(2320, 1300, 55, 38), 45, 0.7, 0.85, SO);
  paintZ('ash_waste', Z(2420, 1450, 170, 90), 100, 0.8, 0.45, MU);
  paintZ('dungeon_flagstone', Z(2080, 1420, 40, 26), 50, 0.75, 0.75, SO);
  // Obsidian Reach
  paintZ('dirt_cave', Z(2200, 2180, 270, 160), 120, 0.85, 0.55, MU);
  paintZ('badlands', Z(2000, 2300, 140, 70), 90, 0.8, 0.5, SO);
  paintZ('dungeon_flagstone', Z(2480, 2080, 44, 28), 50, 0.75, 0.75, SO);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + 0.2, r1 = 80, r2 = R(180, 280); mkBrush('lava_molten', 34, 0.3 * (i % 2), 0.9, SO, [[2240 + Math.cos(a) * r1, 2190 + Math.sin(a) * r1 * 0.7], [2240 + Math.cos(a) * (r1 + r2 * 0.5), 2190 + Math.sin(a) * (r1 + r2 * 0.5) * 0.7], [2240 + Math.cos(a) * (r1 + r2), 2190 + Math.sin(a) * (r1 + r2) * 0.7]]); }
  // Jade Isles
  paintZ('swamp_mire', Z(3250, 2260, 190, 90), 110, 0.85, 0.8, SO);
  paintZ('forest_floor', Z(3500, 2000, 150, 80), 100, 0.8, 0.55, SO);
  paintZ('savanna', Z(3620, 2290, 110, 70), 80, 0.8, 0.6, SO);
  paintZ('wooden_planks', Z(3330, 2110, 36, 22), 44, 0.7, 0.8, SO);
  // Mirewater
  paintZ('forest_floor', Z(1150, 2110, 160, 50), 80, 0.8, 0.6, SO);
  paintZ('shallows', Z(1300, 2300, 150, 55), 70, 0.8, 0.7, SO);
  paintZ('jungle', Z(1180, 2330, 200, 70), 90, 0.9, 0.35, OV);
  // Shire, Tinkers' Isle, Dusklands, atolls
  paintZ('grassland', Z(330, 1300, 100, 190, 0.2), 100, 0.8, 0.6, SO);
  paintZ('forest_floor', Z(300, 1560, 90, 90), 80, 0.8, 0.55, SO);
  paintZ('tundra', Z(440, 1960, 130, 80, -0.3), 90, 0.8, 0.5, SO);
  paintZ('desert', Z(380, 2540, 110, 60), 80, 0.8, 0.6, SO);
  paintZ('grassland', Z(700, 2430, 150, 50), 70, 0.8, 0.5, SO);
  for (const [x, y, r] of [[2700, 1060, 26], [2810, 1140, 20], [2670, 1190, 16]]) mkBrush('shallows', r * 1.6, 0.6, 0.9, SO, [[x, y]]);
  // cobblestone plazas under the great cities
  for (const s of settle.filter((q) => RANK[q.tier] >= 3 && !q.water).slice(0, 8)) mkBrush('cobblestone_town', 78, 0.7, 0.55, SO, [[s.x, s.y + 6]]);
  // water-target strokes (clipped to the sea): shallows haloing every coast, deep-ocean pools in the open sea, reef shallows around merfolk
  const offsetRing = (poly, cx, cy, d) => poly.filter((_, i) => i % 3 === 0).map((p) => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + (dx / l) * d, p[1] + (dy / l) * d]; });
  for (const [id, , , cx, cy] of LAND) {
    if (id === 'obsidian_core') continue;
    const ring = offsetRing(polyOf[id], cx, cy, 28);
    mkBrush('shallows', 58, 0, 0.42, SO, [...ring, ring[0]], 'background');
  }
  for (const [x, y] of [[1600, 1900], [2650, 700], [3550, 1700], [800, 1600], [1550, 700], [2500, 2550], [150, 2200], [3900, 2000]]) mkBrush('deep_ocean', 380, 0, 0.45, MU, [[x, y], [x + 60, y + 30]], 'background');
  for (const [x, y, s] of waterBrush) mkBrush('shallows', s, 0, 0.6, SO, [[x, y]], 'background');
  // a hard-edged foreground stroke (softness 0): the lava cracks above; and one painting 'shallows' onto land for ponds
  mkBrush('lava_molten', 22, 0, 0.9, SO, [[2330, 1250], [2300, 1300], [2350, 1340]]);

  // ---------------- SEA LIFE (custom layer c_sea): ships on the lanes, monsters, whirlpools ----------------
  const SEA = 'c_sea';
  const sea = (id, x, y, sc, o = {}) => place(id, x, y, sc, { free: false, water: true, minW: o.minW ?? 60, layer: SEA, z: 2, kind: 'sea', ...o });
  for (const lane of lanes) {
    const d = _smoothLine(lane, 6);
    const n = Math.max(1, Math.floor(polyLen(d) / 520));
    for (let k = 0; k < n; k++) {
      const i = Math.floor(((k + R(0.25, 0.75)) / n) * (d.length - 2)) + 1, a = ang(d[i - 1], d[i + 1]);
      sea(pick(['ship_caravel', 'ship_galleon']), d[i][0], d[i][1], R(0.85, 1.15), { minW: 30, rot: clamp(Math.sin(a) * 0.35, -0.3, 0.3), flipX: Math.cos(a) < 0, pad: 14 });
    }
  }
  const monsters = [['nautical_kraken', 3, 1.4], ['sea_serpent', 3, 1.3], ['sea_serpent_head', 2, 1.1], ['nautical_whirlpool', 4, 1.2]];
  for (const [id, n, sc] of monsters) for (let i = 0, k = 0; i < 400 && k < n; i++) if (sea(id, R(100, W - 100), R(100, H - 100), sc * R(0.9, 1.15), { minW: 90, rot: R(-0.2, 0.2), pad: 20, flipX: rnd() < 0.5, ...(id === 'nautical_whirlpool' ? { flipY: rnd() < 0.5 } : {}) })) k++;
  sea('compass_rose', 3650, 1650, 2.5, { free: true, water: false, z: 3, kind: 'sea', layer: 'c_frame', noOcc: false });

  // ---------------- CUSTOM LAYERS ----------------
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // fat translucent strokes stacked from wide to narrow = a cheap blur (paths have no blur of their own)
  const wisp = (pts, hex, layer, widths, a) => widths.forEach((w) => addPath('road', w, rgba(hex, a), pts, { layer }));

  // c_realms: one soft colour wash per realm (soft-light)
  const TINT = { valdoria: '#b91c1c', silvanreach: '#047857', khaz: '#92400e', frostmarch: '#1d4ed8', sunscar: '#ea580c', gorash: '#7f1d1d', obsidian: '#6d28d9', jade: '#0f766e', mire: '#4d7c0f', shire: '#ca8a04', gnome: '#0e7490', dusklands: '#b45309' };
  for (const [id, col] of Object.entries(TINT)) {
    const L = LAND.find((q) => q[0] === id), l = landmasses.find((q) => q.id === id), cx = L[2], cy = L[3];
    for (const k of [0.88, 0.66, 0.44, 0.22]) {
      const pts = l.points.filter((_, i) => i % 3 === 0).map(([x, y]) => {
        let px = cx + (x - cx) * k, py = cy + (y - cy) * k;
        for (let t = 0; t < 40 && cd(px, py) < 84; t++) { px += (cx - px) * 0.05; py += (cy - py) * 0.05; }
        return [px, py];
      });
      addPath('road', 160, rgba(col, 0.1), [...pts, pts[0]], { layer: 'c_realms' });
    }
  }
  // c_borders: dashed political borders (chords between two coast points) + a territorial ring
  const border = (cx, cy, a1, a2, col) => {
    const p1 = rayCoast(cx, cy, a1), p2 = rayCoast(cx, cy, a2), pts = [p1];
    for (let t = 1; t < 7; t++) pts.push([p1[0] + ((p2[0] - p1[0]) * t) / 7 + R(-35, 35), p1[1] + ((p2[1] - p1[1]) * t) / 7 + R(-35, 35)]);
    pts.push(p2);
    addPath('road', 3.4, col, pts, { dashed: true, layer: 'c_borders' });
  };
  border(1250, 1330, -2.55, 0.35, '#7f1d1d'); border(1250, 1330, -1.0, 1.9, '#7f1d1d');
  border(720, 470, -1.2, 1.9, '#14532d'); border(1950, 540, 1.6, -1.5, '#78350f');
  border(3180, 380, -1.57, 1.57, '#1e3a8a'); border(3300, 1180, -0.6, 2.4, '#9a3412');
  border(2340, 1330, 0.8, -2.2, '#450a0a'); border(2200, 2170, -0.9, 2.2, '#4c1d95');
  border(3350, 2120, 0.2, -2.9, '#134e4a'); border(1230, 2260, -1.5, 1.7, '#365314');

  // c_hex: a hex-crawl overlay over the Orcwall marches and the Obsidian caldera (pointy hexes, built from 2-point paths, plus coordinates)
  const hexRegion = (cx, cy, rad, size, tag) => {
    const w = Math.sqrt(3) * size, edges = new Map();
    let n = 0;
    for (let row = -Math.ceil(rad / (size * 1.5)); row <= Math.ceil(rad / (size * 1.5)); row++) {
      for (let col = -Math.ceil(rad / w) - 1; col <= Math.ceil(rad / w) + 1; col++) {
        const x = cx + col * w + (row & 1 ? w / 2 : 0), y = cy + row * size * 1.5;
        if (Math.hypot(x - cx, y - cy) > rad) continue;
        const v = [0, 1, 2, 3, 4, 5].map((i) => [x + size * Math.cos(Math.PI / 6 + (i * Math.PI) / 3), y + size * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)]);
        for (let i = 0; i < 6; i++) {
          const a = v[i], b = v[(i + 1) % 6], k = [a, b].map((p) => rd(p[0]) + ',' + rd(p[1])).sort().join('|');
          if (!edges.has(k)) edges.set(k, [a, b]);
        }
        n++;
        lab(tag + String(col + 12).padStart(2, '0') + String(row + 12).padStart(2, '0'), x, y - size * 0.55, 11, { font: 'Inter', color: '#0f172a', stroke: '#f1f5f9', layer: 'c_hex' });
      }
    }
    for (const [a, b] of edges.values()) addPath('road', 2, 'rgba(15,23,42,0.85)', [a, b], { layer: 'c_hex' });
    return n;
  };
  hexRegion(1990, 1335, 330, 50, 'A');
  hexRegion(2240, 2190, 210, 34, 'B');

  // c_trade: sea lanes, plus a glowing caravan corridor between the human capital and the orc city
  for (const pts of lanes) addPath('road', 4.5, '#1d4ed8', pts, { dashed: true, layer: 'c_trade' });
  const hcap = settle.find((s) => s.race === 'human' && s.tier === 'capital'), ocity = settle.find((s) => s.race === 'orc' && RANK[s.tier] >= 3);
  const dcity = settle.filter((s) => s.race === 'dragonborn' && RANK[s.tier] >= 3), dtown = settle.filter((s) => s.race === 'dragonborn' && s.tier === 'town');
  const caravan = (a, b) => {
    if (!a || !b) return;
    const cells = astar([a.x, a.y], [b.x, b.y], 'land', a.pi, b.pi);
    if (!cells) return;
    const pts = thin(cells, 4);
    addPath('road', 13, 'rgba(250,204,21,0.28)', pts, { layer: 'c_trade' });
    addPath('road', 5.5, '#b45309', pts, { dashed: true, layer: 'c_trade' });
  };
  caravan(hcap, ocity);
  if (dcity.length > 1) caravan(dcity[0], dcity[1]);
  if (dcity[0] && dtown[0]) caravan(dcity[0], dtown[0]);

  // c_smoke: volcanic smoke drifting off the two volcanoes (multiply)
  wisp([[2240, 2150], [2380, 2020], [2560, 1930], [2780, 1880], [2960, 1900]], '#1c1917', 'c_smoke', [230, 170, 110, 56], 0.07);
  wisp([[2320, 1280], [2450, 1190], [2620, 1130], [2780, 1120]], '#292524', 'c_smoke', [200, 140, 90, 44], 0.07);
  wisp([[2900, 2560], [3010, 2480], [3150, 2450]], '#292524', 'c_smoke', [150, 100, 56], 0.07);
  // c_fog: magic fog banks (overlay)
  wisp([[160, 880], [330, 940], [470, 880], [620, 950], [780, 900]], '#a78bfa', 'c_fog', [280, 210, 140, 70], 0.08);
  wisp([[260, 800], [440, 830], [640, 810]], '#f0abfc', 'c_fog', [180, 120, 60], 0.07);
  wisp([[1430, 215], [1700, 250], [1950, 215]], '#bae6fd', 'c_fog', [160, 110, 60], 0.09);
  wisp([[980, 2190], [1230, 2260], [1520, 2230]], '#86efac', 'c_fog', [200, 140, 80], 0.07);
  // floating citadels ride above the northern sea (normal blend, on the sea layer)
  place('cas_sky_fortress', 2690, 745, 1.5, { free: true, layer: SEA, z: 4, kind: 'sea' });
  place('cas_sky_spire', 2850, 835, 1.15, { free: true, layer: SEA, z: 4, kind: 'sea' });
  // c_gm: hidden GM layer (visible: false), never exported
  place('cas_dungeon_entrance', 2130, 2290, 0.9, { free: true, layer: 'c_gm', z: 5, kind: 'gm' });
  place('cas_crypt', 1980, 560, 0.8, { free: true, layer: 'c_gm', z: 5, kind: 'gm' });
  place('cas_dragon_lair', 3150, 150, 0.9, { free: true, layer: 'c_gm', z: 5, kind: 'gm' });
  lab('GM: the vault under the caldera', 2130, 2345, 16, { font: 'Inter', color: '#7f1d1d', stroke: '#fef2f2', layer: 'c_gm' });
  lab('GM: Khaz Druum throne-room trap', 1980, 610, 16, { font: 'Inter', color: '#7f1d1d', stroke: '#fef2f2', layer: 'c_gm' });
  lab('GM: wyrm sleeps here', 3150, 200, 16, { font: 'Inter', color: '#7f1d1d', stroke: '#fef2f2', layer: 'c_gm' });

  // ---------------- LABELS: realms, regions, seas, rivers, lakes, walls (auto-placed clear of settlements and each other) ----------------
  // chain of small boxes along the text, so long names are tested against what is really under them
  const segs = (x, y, w, h, rot, curv = 0) => {
    const n = Math.max(1, Math.ceil(w / 60)), out = [], sag = Math.abs(curv) * w * 0.3;
    for (let k = 0; k < n; k++) {
      const t = ((k + 0.5) / n - 0.5) * w;
      out.push({ x: x + Math.cos(rot) * t, y: y + Math.sin(rot) * t, rx: Math.max((w / n) * 0.55, h * 0.5), ry: h * 0.62 + sag * 0.5, kind: 'label' });
    }
    return out;
  };
  function autoLabel(text, ax, ay, size, o = {}) {
    const font = o.font || 'Cinzel', mode = o.mode || 'land', rot = o.rot || 0;
    const w = textW(text, size, font, o.tracking || 0) + (o.curv ? size * 0.3 : 0), h = size * 1.12;
    const cands = [[0, 0]];
    for (let k = 0; k < 700; k++) { const r = Math.sqrt(rnd()) * (o.reach ?? 340), a = R(0, 6.283); cands.push([Math.cos(a) * r, Math.sin(a) * r * 0.8]); }
    cands.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));
    let best = null, bs = 1e9;
    for (const [dx, dy] of cands) {
      const x = ax + dx, y = ay + dy;
      let ok = true;
      for (let t = -0.5; t <= 0.51; t += 0.125) {
        const c = cd(x + Math.cos(rot) * w * t, y + Math.sin(rot) * w * t);
        if (mode === 'land' ? c < (o.minC ?? 10) : c > -(o.minC ?? 34)) { ok = false; break; }
      }
      if (!ok) continue;
      const sg = segs(x, y, w, h, rot, o.curv || 0), kinds = o.kinds || ['settle', 'label', 'bridge'];
      const hits = sg.filter((b) => occHit(b, kinds)).length;
      const score = hits * 500 + Math.hypot(dx, dy);
      if (hits <= (o.allow ?? 0) && score < bs) { bs = score; best = [x, y, sg]; if (hits === 0) break; }
    }
    if (!best) return null;
    best[2].forEach(occAdd);
    return lab(text, best[0], best[1], size, { font, ...o });
  }
  const DK = ['#3b1d0e', '#fde68a'];
  const REALM = [
    // text, anchor x, y, size, colours, tracking, curvature
    ['VALDORIA', 1250, 1250, 66, DK, 24, 0.07], ['SILVANREACH', 720, 400, 56, ['#14532d', '#dcfce7'], 18, 0.08],
    ['KHAZ DRUUM', 1950, 470, 52, ['#3b2412', '#e2e8f0'], 16, 0.07], ['FROSTMARCH', 3180, 330, 58, ['#1e3a5f', '#f1f5f9'], 18, 0.07],
    ['SUNSCAR', 3300, 1170, 60, ['#7c2d12', '#fef3c7'], 24, 0.07], ['GORASH', 2340, 1290, 46, ['#fecaca', '#450a0a'], 14, 0.07],
    ['OBSIDIAN WASTES', 2200, 2050, 44, ['#e9d5ff', '#2e1065'], 12, 0.08], ['THE JADE COAST', 3350, 2050, 46, ['#ecfccb', '#14532d'], 14, 0.07],
    ['MIREWATER', 1230, 2230, 42, ['#ecfccb', '#1a2e05'], 12, 0.07], ['THE SHIRE', 330, 1390, 30, ['#451a03', '#fef3c7'], 8, 0.08],
    ["TINKERS' ISLE", 430, 1985, 26, ['#3b2a14', '#fef3c7'], 7, 0.08], ['DUSKLANDS', 560, 2490, 30, ['#78350f', '#fef3c7'], 10, 0.08],
    ['HOAR ISLE', 1750, 215, 20, ['#e0f2fe', '#0c2a4d'], 6, 0.1]
  ];
  for (const [t, x, y, s, [c, st], tr, cv] of REALM) autoLabel(t, x, y, s * 1.15, { font: 'Cinzel', color: c, stroke: st, tracking: tr, curv: cv, reach: 460, allow: 99, mode: t === 'HOAR ISLE' ? 'sea' : 'land' });
  const SEAC = { color: '#e0f2fe', stroke: '#0c2a4d', font: 'Uncial Antiqua', mode: 'sea' };
  [['The Sundering Sea', 1820, 950, 42, 0.1, 0.1], ['Sea of Sorrows', 1700, 1960, 34, 0.06, -0.05], ['Elvenstrait', 600, 800, 24, 0.05, 0], ['The Whitecap Sea', 1330, 110, 32, 0.08, 0],
    ['Gulf of Gulls', 1250, 930, 16, 0, 1.57], ['Bay of Kings', 1250, 1700, 20, 0, 1.57], ['Typhoon Alley', 2760, 1700, 30, 0.1, 0.1], ['Serpent Sea', 3250, 1740, 30, 0.08, -0.05],
    ['Gulf of Embers', 2640, 2440, 26, 0.08, 0], ['Merrow Narrows', 1300, 1900, 20, 0.04, 0], ["Kraken's Reach", 2900, 650, 26, 0.08, 0], ['The Frozen Reach', 2550, 300, 24, 0.08, 1.2],
    ['The Glass Ocean', 140, 1850, 24, 0.06, -1.3], ['Veilwater', 450, 1010, 18, 0.05, 0], ['Pearl Atolls', 2760, 960, 18, 0.06, 0], ['Ember Isles', 2960, 2690, 18, 0.05, 0], ["Dragon's Teeth", 3960, 1180, 16, 0, 1.57], ['The Drowned Coast', 130, 900, 14, 0.04, 0],
    ['Whalebone Deep', 900, 1620, 22, 0.08, 0.3], ['Cold Sound', 2100, 130, 22, 0.06, 0]]
    .forEach(([t, x, y, s, cv, r]) => autoLabel(t, x, y, s * 1.3, { ...SEAC, curv: cv, rot: r, reach: 480, allow: 1 }));
  const RG = ['MedievalSharp', 'Pirata One', 'Uncial Antiqua'];
  const REG = [
    ['The Eldwood', 880, 1250, 28, ['#14532d', '#dcfce7'], 0, -0.06], ['Greenwold', 1570, 1500, 26, ['#14532d', '#dcfce7'], 0, 0.05], ['Redcrag Range', 1250, 1010, 30, ['#3d2b1f', '#ffffff'], 0, 0.06],
    ['The Golden Fields', 1260, 1490, 26, ['#78350f', '#fef9c3'], 0, 0.05], ['Blackwater Marsh', 1040, 1700, 20, ['#ecfccb', '#1a2e05'], 0, 0.05], ['Whispering Glades', 700, 520, 26, ['#14532d', '#dcfce7'], 2, 0.05],
    ['The Heartwood', 560, 390, 24, ['#14532d', '#dcfce7'], 2, -0.05], ['The Deep Halls', 1950, 580, 26, ['#e2e8f0', '#1c1917'], 0, 0.04], ['Rimecrag Peaks', 3150, 225, 26, ['#1e3a5f', '#f1f5f9'], 0, 0.06],
    ['Frostpine Taiga', 3000, 500, 24, ['#1e3a5f', '#f1f5f9'], 0, 0.05], ['Burning Dunes', 3250, 1090, 28, ['#7c2d12', '#fef3c7'], 0, 0.06], ['Wyrmrest Mesa', 3100, 1000, 22, ['#7c2d12', '#fef3c7'], 1, 0.05],
    ['Ashen Barrens', 2420, 1450, 24, ['#fecaca', '#450a0a'], 1, 0.05], ['The Cinder Steppe', 2150, 1290, 22, ['#fecaca', '#450a0a'], 1, 0.05], ['The Caldera', 2240, 2190, 24, ['#fef08a', '#450a0a'], 1, 0.06],
    ['The Underdark Reaches', 2200, 2310, 22, ['#e9d5ff', '#2e1065'], 1, 0.05], ['Verdant Canopy', 3500, 2000, 26, ['#ecfccb', '#14532d'], 0, 0.05], ['Sunken Gardens', 3250, 2260, 22, ['#ecfccb', '#14532d'], 0, 0.05],
    ['The Weeping Fens', 1200, 2140, 24, ['#ecfccb', '#1a2e05'], 0, 0.05], ['Ironback Spur', 1740, 1300, 22, ['#3d2b1f', '#ffffff'], 0, 0.05], ['Thornspur', 1090, 830, 18, ['#14532d', '#dcfce7'], 0, 0.05],
    ['The Marrow Hills', 330, 1560, 20, ['#451a03', '#fef3c7'], 0, 0.05], ['The Salt Flats', 3600, 1290, 20, ['#7c2d12', '#fef3c7'], 0, 0.05], ['Golden Savanna', 3380, 1420, 22, ['#78350f', '#fef3c7'], 0, 0.05],
    ['Cogwork Hills', 440, 1950, 18, ['#3b2a14', '#fef3c7'], 0, 0.05], ['Grass Sea', 680, 2420, 20, ['#78350f', '#fef3c7'], 0, 0.05], ['Ironwood', 1560, 1430, 18, ['#14532d', '#dcfce7'], 0, 0.05]
  ];
  REG.forEach(([t, x, y, s, [c, st], f, cv]) => autoLabel(t, x, y, s * 1.3, { font: RG[f], color: c, stroke: st, curv: cv, reach: 300, allow: 1 }));
  // rivers: named along their course (rotated to the flow)
  for (const r of rivers.filter((q) => q.depth === 0 && q.len > 360 && !q.name.includes('delta'))) {
    const i = Math.floor(r.dense.length * 0.52), a = flatAng(ang(r.dense[Math.max(0, i - 6)], r.dense[Math.min(r.dense.length - 1, i + 6)]));
    const p = r.dense[i];
    autoLabel(r.name, p[0] + 14, p[1] - 8, 15, { font: 'MedievalSharp', color: '#0c2a4d', stroke: '#e0f2fe', rot: clamp(a, -1.1, 1.1), curv: 0, reach: 70, minC: 4, kinds: ['settle', 'label'] });
  }
  for (const k of lakes.slice(0, 9)) autoLabel(k.name, k.x, k.y + k.r + 14, 13, { font: 'MedievalSharp', color: '#0c2a4d', stroke: '#e0f2fe', reach: 60, minC: -30, kinds: ['settle', 'label'] });
  for (const wl of wallDense) autoLabel(wl.name, wl.mid[0] + 26, wl.mid[1], 17, { font: 'Pirata One', color: '#1e293b', stroke: '#e2e8f0', rot: flatAng(wl.a), reach: 120, minC: 2, kinds: ['settle', 'label'] });

  // ---------------- FRAME: border, title cartouche, legend, scale bar (custom layer c_frame, locked) ----------------
  const FR = 'c_frame';
  const rectPath = (x0, y0, x1, y1, r = 10) => [[x0 + r, y0], [(x0 + x1) / 2, y0], [x1 - r, y0], [x1, y0], [x1, y0 + r], [x1, (y0 + y1) / 2], [x1, y1 - r], [x1, y1], [x1 - r, y1], [(x0 + x1) / 2, y1], [x0 + r, y1], [x0, y1], [x0, y1 - r], [x0, (y0 + y1) / 2], [x0, y0 + r], [x0, y0], [x0 + r, y0]];
  addPath('road', 7, '#2b1a0c', rectPath(26, 26, W - 26, H - 26), { layer: FR });
  addPath('road', 2, '#2b1a0c', rectPath(44, 44, W - 44, H - 44, 8), { layer: FR });
  const pill = (x0, x1, y, h) => {   // a stadium-shaped parchment plate: one fat round-capped stroke over a darker one
    addPath('road', h + 12, '#3b2412', [[x0 + h / 2, y], [x1 - h / 2, y]], { layer: FR });
    addPath('road', h, 'rgba(244,228,188,0.96)', [[x0 + h / 2, y], [x1 - h / 2, y]], { layer: FR });
    addPath('road', h - 22, 'rgba(214,190,140,0.5)', [[x0 + h / 2, y], [x1 - h / 2, y]], { layer: FR });
  };
  pill(1430, 2570, 2655, 172);
  lab('THE OBSIDIAN REACH', 2000, 2628, 62, { font: 'Cinzel', color: '#2b1a0c', stroke: '#fde68a', tracking: 8, curv: 0.04, layer: FR });
  lab('A STRESS ATLAS OF THE SUNDERED CONTINENTS', 2000, 2688, 22, { font: 'Uncial Antiqua', color: '#5b3a1e', stroke: '#fff7d6', tracking: 3, curv: 0.03, layer: FR });
  pill(3060, 3925, 2612, 262);
  lab('LEGEND', 3492, 2512, 24, { font: 'Cinzel', color: '#2b1a0c', stroke: '#fde68a', tracking: 8, curv: 0.04, layer: FR });
  const LEG = [
    [['set_human_capital', 0.55, 'Capital'], ['set_human_city', 0.5, 'City'], ['set_human_town', 0.56, 'Town'], ['set_human_village', 0.64, 'Village']],
    [['cas_human_castle', 0.5, 'Castle'], ['port_dock', 0.42, 'Port'], ['cas_watchtower', 0.5, 'Watchtower'], ['mountain_grand', 0.5, 'Mountains']],
    [['tr_grove_oak', 0.55, 'Forest'], ['mountain_volcano', 0.5, 'Volcano'], ['set_halfling_hamlet', 0.8, 'Hamlet'], ['set_merfolk_town', 0.56, 'Reef town']],
    [['#5b3a1e', 'Royal road', false, 7], ['#7a4a21', 'Trail', true, 5], ['#475569', 'Great wall', false, 9], ['#1d4ed8', 'Sea lane', true, 4]]
  ];
  LEG.forEach((col, ci) => col.forEach((it, ri) => {
    const x = 3150 + ci * 192, y = 2550 + ri * 46;
    if (typeof it[0] === 'string' && it[0][0] === '#') {
      if (it[1] === 'Great wall') addPath('wall', 8, '#475569', [[x - 8, y], [x + 38, y]], { layer: FR });
      else addPath('road', it[3], it[0], [[x - 8, y], [x + 38, y]], { dashed: it[2], layer: FR });
      lab(it[1], x + 52 + textW(it[1], 15, 'Inter') / 2, y, 15, { font: 'Inter', color: '#2b1a0c', stroke: '#fff7d6', layer: FR });
    } else {
      place(it[0], x + 14, y, it[1], { free: true, layer: FR, z: 3, kind: 'legend' });
      lab(it[2], x + 52 + textW(it[2], 15, 'Inter') / 2, y, 15, { font: 'Inter', color: '#2b1a0c', stroke: '#fff7d6', layer: FR });
    }
  }));
  // scale bar (alternating segments) + labels
  [['#1c1208', 140, 240], ['#f4e6c0', 240, 340], ['#1c1208', 340, 440], ['#f4e6c0', 440, 540]].forEach(([c, a, b]) => addPath('road', 9, c, [[a, 2736], [b, 2736]], { layer: FR }));
  [['0', 140], ['100', 340], ['200', 540]].forEach(([t, x]) => lab(t, x, 2712, 14, { font: 'Inter', color: '#fde68a', stroke: '#1c1208', layer: FR }));
  lab('LEAGUES', 340, 2762, 13, { font: 'Inter', color: '#fde68a', stroke: '#1c1208', tracking: 4, curv: 0.03, layer: FR });
  lab('N', 3650, 1520, 22, { font: 'Cinzel', color: '#2b1a0c', stroke: '#fde68a', layer: FR });

  if (missing.size && typeof console !== 'undefined') console.warn('obsidian_reach: unknown stamp ids', [...missing]);
  const LY = (name, visible, opacity, blend, extra = {}) => ({ visible, opacity, blend, name, ...extra });
  return {
    id: 'obsidian_reach',
    title: 'Stress Atlas: The Obsidian Reach',
    type: 'world',
    width: W,
    height: H,
    // a faint league grid over the whole map; the hex regions live on their own layer
    grid: { enabled: true, type: 'square', size: 200, opacity: 0.05, color: '#1e293b', offsetX: 40, offsetY: 25, snap: false },
    atmosphere: { vignette: 0.42, parchmentGrain: 0.34, sepia: 0.22, brightness: 1.03 },
    coastline: {
      ripplesEnabled: true, rippleCount: 5, rippleSpacing: 12, rippleColor: '#7dd3fc', rippleOpacity: 0.26,
      sandEnabled: true, sandWidth: 10, sandColor: '#d9be84', outlineColor: '#2b2318', outlineWidth: 2.6,
      shadowEnabled: true, shadowBlur: 18, shadowColor: 'rgba(4, 18, 38, 0.5)'
    },
    // custom layers, bottom to top
    layers: {
      c_realms: LY('Realm tints', true, 0.55, 'soft-light'),
      c_borders: LY('Political borders', true, 0.85, 'multiply'),
      c_hex: LY('Hex region overlay', true, 0.8, 'multiply'),
      c_trade: LY('Trade routes & sea lanes', true, 0.9, 'source-over'),
      c_smoke: LY('Ash & smoke', true, 0.6, 'multiply'),
      c_fog: LY('Magic fog', true, 0.8, 'overlay'),
      c_sea: LY('Sea life & sky citadels', true, 1, 'source-over'),
      c_gm: LY('GM secrets (hidden)', false, 1, 'source-over'),
      c_frame: LY('Cartouche, legend & frame', true, 1, 'source-over', { locked: true })
    },
    landmasses,
    brushStrokes: [...maskStrokes, ...brushStrokes],
    stamps,
    paths,
    texts
  };
}

// lazy: the builder runs on first access of a heavy field, so app start-up is unaffected
const _lazyPreset = (meta, build) => {
  let cache;
  const o = { ...meta };
  for (const k of ['width', 'height', 'grid', 'atmosphere', 'coastline', 'layers', 'landmasses', 'brushStrokes', 'stamps', 'paths', 'texts']) {
    Object.defineProperty(o, k, { enumerable: true, get: () => (cache ??= build())[k] });
  }
  return o;
};
const OBSIDIAN_META = { id: 'obsidian_reach', title: 'Stress Atlas: The Obsidian Reach', type: 'world', heavy: '4000×2800 · ~1,400 stamps · stress test, opens slowly' };
// <<OBSIDIAN-END>>

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
      // === NORTHERN OCEAN & SKY ===
      { id: 'comp1', stampId: 'compass_rose', x: 1720, y: 190, scale: 1.6, rotation: 0, zIndex: 10 },

      // === MOUNTAIN SPINE: IRONPSIRE RIDGE (Sorted North-to-South) ===
      { id: 'r_tow2', stampId: 'ruined_tower_side', x: 1630, y: 240, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'm_sp1', stampId: 'mountain_snow_peak_diag', x: 420, y: 260, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 'm_gr1', stampId: 'mountain_grand_diag', x: 480, y: 280, scale: 1.45, rotation: 0, zIndex: 0 },
      { id: 'm_rg3', stampId: 'mountain_range_diag', x: 570, y: 280, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'm_rg1', stampId: 'mountain_range_diag', x: 360, y: 290, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'm_gr3', stampId: 'mountain_grand', x: 650, y: 290, scale: 1.55, rotation: 0, zIndex: 0 },
      { id: 'm_sp3', stampId: 'mountain_snow_peak_diag', x: 920, y: 300, scale: 1.4, rotation: 0, zIndex: 0 },
      { id: 'm_gr2', stampId: 'mountain_grand_diag', x: 520, y: 310, scale: 1.5, rotation: 0, zIndex: 0 },
      { id: 'm_gr4', stampId: 'mountain_grand_diag', x: 800, y: 310, scale: 1.6, rotation: 0, zIndex: 0 },
      { id: 'm_rg2', stampId: 'mountain_range', x: 400, y: 330, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'm_sp2', stampId: 'mountain_snow_peak_diag', x: 850, y: 330, scale: 1.5, rotation: 0, zIndex: 0 },
      { id: 'm_gr5', stampId: 'mountain_grand_diag', x: 970, y: 340, scale: 1.45, rotation: 0, zIndex: 0 },
      { id: 'c_tmp2', stampId: 'civ_temple_front', x: 1480, y: 340, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 't_wiz1', stampId: 'tower_wizard_side', x: 780, y: 350, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'c_tent1', stampId: 'camp_tent_front', x: 730, y: 360, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'm_rg4', stampId: 'mountain_range_diag', x: 1040, y: 360, scale: 1.3, rotation: 0, zIndex: 0 },

      // === FOOTHILLS & HIGHLAND VALLEYS ===
      { id: 'h_rd1', stampId: 'hills_rolling_diag', x: 330, y: 380, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'h_r1', stampId: 'hills_rolling', x: 450, y: 380, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'm_rg5', stampId: 'mountain_range', x: 1120, y: 380, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'c_kps1', stampId: 'fortress_keep_side', x: 1550, y: 380, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'h_rd2', stampId: 'hills_rolling_diag', x: 540, y: 390, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'm_gr6', stampId: 'mountain_grand_diag', x: 1180, y: 410, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'v_vlt2', stampId: 'village_houses_top', x: 1630, y: 410, scale: 1.15, rotation: 0.25, zIndex: 0 },
      { id: 'h_rd3', stampId: 'hills_rolling_diag', x: 660, y: 420, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'h_r2', stampId: 'hills_rolling', x: 840, y: 430, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'h_rd4', stampId: 'hills_rolling_diag', x: 940, y: 440, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'h_rd5', stampId: 'hills_rolling_diag', x: 1060, y: 450, scale: 1.0, rotation: 0, zIndex: 0 },

      // === FORESTS, VALES & WOODLAND ANCIENTS ===
      { id: 'f_p1', stampId: 'tree_pine', x: 220, y: 460, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'f_c1', stampId: 'tree_forest_cluster', x: 280, y: 460, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'h_r3', stampId: 'hills_rolling', x: 1150, y: 470, scale: 0.95, rotation: 0, zIndex: 0 },
      { id: 'fm_t3', stampId: 'farm_homestead_top', x: 1500, y: 470, scale: 1.1, rotation: -0.2, zIndex: 0 },
      { id: 'v_vil2', stampId: 'village_houses', x: 1620, y: 490, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'f_o1', stampId: 'tree_oak', x: 300, y: 500, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'f_c2', stampId: 'tree_forest_cluster', x: 450, y: 500, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'f_p2', stampId: 'tree_pine', x: 230, y: 520, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'dk_t2', stampId: 'port_dock_top', x: 1440, y: 530, scale: 1.15, rotation: 0.4, zIndex: 0 },
      { id: 'f_aut1', stampId: 'tree_autumn', x: 760, y: 540, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'f_p4', stampId: 'tree_pine', x: 1140, y: 550, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'f_o6', stampId: 'tree_oak', x: 1630, y: 550, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'v_lgt1', stampId: 'veg_log_fallen_top', x: 380, y: 560, scale: 1.1, rotation: 0.45, zIndex: 0 },
      { id: 'f_o2', stampId: 'tree_oak', x: 500, y: 560, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'f_c5', stampId: 'tree_forest_cluster', x: 840, y: 560, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'v_lgs1', stampId: 'veg_log_fallen_side', x: 250, y: 570, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'v_stp1', stampId: 'veg_stump_side', x: 310, y: 570, scale: 1.0, rotation: 0, zIndex: 0 },
      { id: 'f_c3', stampId: 'tree_forest_cluster', x: 430, y: 570, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'f_c6', stampId: 'tree_forest_cluster', x: 1050, y: 570, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'c_lgt2', stampId: 'civ_lighthouse_side', x: 1410, y: 570, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'h_rd6', stampId: 'hills_rolling_diag', x: 1540, y: 570, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'fm_t1', stampId: 'farm_homestead_top', x: 680, y: 580, scale: 1.15, rotation: 0.2, zIndex: 0 },
      { id: 'f_o4', stampId: 'tree_oak', x: 940, y: 580, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'f_c4', stampId: 'tree_forest_cluster', x: 560, y: 600, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'f_p3', stampId: 'tree_pine', x: 240, y: 630, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'r_sth1', stampId: 'ruins_stonehenge', x: 320, y: 630, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'f_o3', stampId: 'tree_oak', x: 380, y: 640, scale: 1.15, rotation: 0, zIndex: 0 },

      // === PLAINS, SETTLEMENTS & HARBORS ===
      { id: 'sh_glt1', stampId: 'ship_galleon_top', x: 1580, y: 650, scale: 1.15, rotation: 0.75, zIndex: 0 },
      { id: 'fm_t2', stampId: 'farm_homestead_top', x: 700, y: 660, scale: 1.1, rotation: -0.15, zIndex: 0 },
      { id: 'w_fr1', stampId: 'windmill_front', x: 780, y: 670, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'r_tow1', stampId: 'ruined_tower_side', x: 270, y: 680, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'c_cit1', stampId: 'castle_citadel', x: 470, y: 680, scale: 1.5, rotation: 0, zIndex: 0 },
      { id: 'f_o5', stampId: 'tree_oak', x: 960, y: 680, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'w_rf1', stampId: 'windmill_rustic_front', x: 860, y: 690, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'br_s1', stampId: 'bridge_stone_side', x: 610, y: 695, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'c_tmp1', stampId: 'civ_temple_front', x: 340, y: 700, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'c_cits1', stampId: 'castle_citadel_side', x: 440, y: 730, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'sh_gld1', stampId: 'ship_galleon_diag', x: 1320, y: 730, scale: 1.3, rotation: 0, zIndex: 0 },
      { id: 'v_vlt1', stampId: 'village_houses_top', x: 520, y: 740, scale: 1.2, rotation: 0.18, zIndex: 0 },
      { id: 'v_vil1', stampId: 'village_houses', x: 580, y: 740, scale: 1.2, rotation: 0, zIndex: 0 },
      { id: 'dk_s1', stampId: 'port_dock_side', x: 640, y: 770, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'm_msd1', stampId: 'mountain_mesa_diag', x: 1570, y: 770, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'h_dnd1', stampId: 'hills_dunes_diag', x: 1640, y: 770, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'c_lgt1', stampId: 'civ_lighthouse_side', x: 450, y: 780, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'c_tnt2', stampId: 'camp_tent_front', x: 1600, y: 820, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'sh_crv1', stampId: 'ship_caravel', x: 1100, y: 820, scale: 1.15, rotation: 0, zIndex: 0 },
      { id: 'dk_t1', stampId: 'port_dock_top', x: 560, y: 825, scale: 1.1, rotation: 0.1, zIndex: 0 },
      { id: 'sh_crt1', stampId: 'ship_caravel_top', x: 580, y: 845, scale: 1.05, rotation: -0.35, zIndex: 1 },

      // === SOUTHERN SOUND, ATOLLS & DEEP WATERS ===
      { id: 'serp_d1', stampId: 'sea_serpent_diag', x: 240, y: 860, scale: 1.35, rotation: 0, zIndex: 0 },
      { id: 'sh_crd1', stampId: 'ship_caravel_diag', x: 880, y: 900, scale: 1.25, rotation: 0, zIndex: 0 },
      { id: 'm_mst1', stampId: 'mountain_mesa_top', x: 1410, y: 900, scale: 1.2, rotation: 0.3, zIndex: 0 },
      { id: 'h_dnd2', stampId: 'hills_dunes_diag', x: 1460, y: 920, scale: 1.05, rotation: 0, zIndex: 0 },
      { id: 'serp_t1', stampId: 'sea_serpent_top', x: 1740, y: 920, scale: 1.2, rotation: 0.4, zIndex: 0 },
      { id: 'r_tow3', stampId: 'ruined_tower_side', x: 1230, y: 930, scale: 1.1, rotation: 0, zIndex: 0 },
      { id: 'm_vlt1', stampId: 'mountain_volcano_top', x: 450, y: 930, scale: 1.35, rotation: 0.55, zIndex: 0 },
      { id: 'c_tmpt1', stampId: 'civ_temple_top', x: 390, y: 940, scale: 1.1, rotation: 0.25, zIndex: 0 },
      { id: 'h_rd8', stampId: 'hills_rolling_diag', x: 490, y: 950, scale: 0.95, rotation: 0, zIndex: 0 },
      { id: 'h_rd7', stampId: 'hills_rolling_diag', x: 1210, y: 970, scale: 0.95, rotation: 0, zIndex: 0 },
      { id: 'krk_s1', stampId: 'nautical_kraken_side', x: 940, y: 990, scale: 1.4, rotation: 0, zIndex: 0 }
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
].flatMap((p, i) => (i === 0 ? [p, buildSundered(), _lazyPreset(OBSIDIAN_META, buildObsidianReach), buildRegion(), buildCity(), buildBattle()] : [p])); // showcase sits right after the default map
