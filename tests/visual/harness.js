// Visual regression harness, loaded by tests/visual/run.mjs in headless Chromium through the Vite dev server.
// It renders one scene at a time with each backend and compares images in the page, so only small PNGs leave it:
//   export  renderExportCanvas, the path PNG / WebP / JPG export, print and VTT use (Canvas 2D)
//   live2d  renderMap with the layer cache, what CanvasArea draws when it falls back to Canvas 2D
//   pixi    PixiMapView, the live view on a GPU, read back with extract()
//   export2x, pixi2x  the same at 2 pixels per map unit, shrunk back to 1x
// Scenes: every sample map, plus synthetic sheets: all stamps, stamp transforms, and layer blending.
import { buildPlan, renderMap, stampImage } from '../../src/engine/renderer.js';
import { renderExportCanvas } from '../../src/utils/exportUtils.js';
import { PRESET_MAPS } from '../../src/engine/presetMaps.js';
import { STAMPS } from '../../src/engine/stampsCatalog.js';
import { DEFAULT_LAYERS } from '../../src/components/LayersPanel.jsx';
import { getTemplate } from '../../src/engine/mapTemplates.js';

const NO_ATMO = { vignette: 0, parchmentGrain: 0, sepia: 0, brightness: 1 };
const NO_GRID = { enabled: false, type: 'square', size: 60, opacity: 0, color: '#000', offsetX: 0, offsetY: 0 };

/** The document the editor would hold after opening a sample (App.adoptProject + the layer memo). */
function fromProject(p) {
  const layers = { ...DEFAULT_LAYERS, ...(p.layers || {}) };
  return {
    width: p.width || 1920,
    height: p.height || 1080,
    mapType: getTemplate(p.template || p.type).mode,
    landmasses: p.landmasses || [],
    brushStrokes: p.brushStrokes || [],
    stamps: p.stamps || [],
    paths: p.paths || [],
    texts: p.texts || [],
    ...(p.grid ? { grid: p.grid } : {}),
    ...(p.atmosphere ? { atmosphere: p.atmosphere } : {}),
    ...(p.coastline ? { coastline: p.coastline } : {}),
    layerVisibility: { ...Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.visible])), atmosphere: true },
    layerStyle: layers
  };
}

const sheetLayers = (over = {}) => {
  const layers = { ...DEFAULT_LAYERS, ...over };
  return {
    layerStyle: layers,
    layerVisibility: { ...Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.visible])), atmosphere: true }
  };
};

/** Every catalogue stamp at scale 1 in a grid of 110 x 110 cells. */
function stampSheet() {
  const cell = 110, cols = 20;
  const rows = Math.ceil(STAMPS.length / cols);
  const stamps = STAMPS.map((d, i) => ({
    id: 'st' + i,
    stampId: d.id,
    x: (i % cols) * cell + cell / 2,
    y: Math.floor(i / cols) * cell + cell / 2,
    scale: Math.min(1, 1.2 / (d.aspect || 1)), // keep wide stamps inside their cell
    rotation: 0,
    zIndex: 0,
    seed: 7
  }));
  return {
    width: cols * cell,
    height: rows * cell,
    mapType: 'battle',
    stamps,
    grid: NO_GRID,
    atmosphere: NO_ATMO,
    ...sheetLayers() // opaque tabletop: over transparent pixels Pixi's readback (extract) is not exact, the screen is
  };
}

// An asymmetric custom image (an "F" with a red corner) so flips and rotations show
let customSrc = null;
function customImage() {
  if (customSrc) return customSrc;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#1d4ed8';
  g.fillRect(8, 8, 14, 80);
  g.fillRect(8, 8, 48, 14);
  g.fillRect(8, 40, 34, 12);
  g.fillStyle = '#dc2626';
  g.fillRect(44, 70, 16, 22);
  customSrc = c.toDataURL('image/png');
  return customSrc;
}

let customObj = null;
function customImageObject() {
  if (!customObj) {
    customObj = new Image();
    customObj.src = customImage();
  }
  return customObj;
}

/** A few stamps (square, wide, tall, custom image) under each transform a placed stamp can carry. */
function transformSheet() {
  const kinds = [
    { stampId: 'mountain_grand' },
    { stampId: 'mountain_range' },
    { stampId: 'tower_wizard' },
    { stampId: 'compass_rose' },
    { stampId: 'custom_img', customImage: customImage(), aspect: 64 / 96 },
    { stampId: 'custom_img', customImage: customImageObject(), aspect: 64 / 96 } // as the editor holds a placed one
  ];
  const variants = [
    {},
    { rotation: 0.6 },
    { rotation: -2.2 },
    { flipX: true },
    { flipY: true },
    { flipX: true, rotation: 0.9 },
    { anchor: 'base' },
    { anchor: 'base', rotation: 0.5, flipX: true },
    { scale: 0.5 },
    { scale: 1.7 },
    { tone: 0.8, hue: 40 },
    { color: '#7c2d12', fill: '#fde68a' }
  ];
  const cell = 170;
  const stamps = [];
  kinds.forEach((k, r) =>
    variants.forEach((v, c) =>
      stamps.push({ id: `t${r}_${c}`, x: c * cell + cell / 2, y: r * cell + cell / 2, scale: 1, rotation: 0, zIndex: 0, seed: 3, ...k, ...v })));
  // overlapping pair: zIndex beats y order
  stamps.push({ id: 'zlow', stampId: 'mountain_grand', x: 90, y: kinds.length * cell + 90, scale: 1.4, zIndex: 1 });
  stamps.push({ id: 'zhigh', stampId: 'tower_wizard', x: 120, y: kinds.length * cell + 60, scale: 1.4, zIndex: 0 });
  return {
    width: variants.length * cell,
    height: (kinds.length + 1) * cell,
    mapType: 'battle',
    stamps,
    grid: NO_GRID,
    atmosphere: NO_ATMO,
    ...sheetLayers() // opaque tabletop: over transparent pixels Pixi's readback (extract) is not exact, the screen is
  };
}

/** Built-in and custom layers with opacity and each blend mode, over an ocean, land, a river and labels. */
function layerSheet() {
  const blends = [
    ['c_mul', 'multiply', 1],
    ['c_scr', 'screen', 0.8],
    ['c_ovl', 'overlay', 1],
    ['c_sft', 'soft-light', 1],
    ['c_half', 'source-over', 0.45]
  ];
  const stamps = [], paths = [], texts = [];
  const over = { stamps: { visible: true, opacity: 0.6, blend: 'source-over' }, paths: { visible: true, opacity: 0.7, blend: 'multiply' } };
  // built-in stamps layer (opacity 0.6): overlapping stamps must not show through each other
  for (let i = 0; i < 4; i++) stamps.push({ id: 'b' + i, stampId: 'tree_oak', x: 120 + i * 30, y: 120 + (i % 2) * 18, scale: 1.2, zIndex: 0 });
  paths.push({ id: 'p0', type: 'river', width: 14, color: '#2b5c8f', points: [[40, 260], [300, 240], [600, 300], [900, 260], [1180, 300]] });
  blends.forEach(([key, blend, opacity], i) => {
    over[key] = { visible: true, opacity, blend, name: key };
    const x = 160 + i * 220;
    for (let j = 0; j < 3; j++) stamps.push({ id: `${key}_${j}`, stampId: j === 1 ? 'mountain_grand' : 'tree_pine', x: x + j * 28 - 28, y: 420 + j * 10, scale: 1.3, zIndex: 0, layer: key });
    paths.push({ id: key + 'p', type: 'road', width: 8, color: '#7c2d12', points: [[x - 80, 520], [x + 80, 540]], layer: key });
    // a wide, nearly transparent wash over sea and land, like the fog / realm tint layers of the samples
    paths.push({ id: key + 'w', type: 'road', width: 70, color: 'rgba(167, 139, 250, 0.12)', points: [[x - 90, 200], [x - 60, 380], [x + 60, 470]], layer: key });
    texts.push({ id: key + 't', text: blend, x, y: 580, size: 26, color: '#111827', stroke: '#fef3c7', font: 'serif', curvature: 0, layer: key });
  });
  texts.push({ id: 'base_t', text: 'Layer blending', x: 600, y: 60, size: 40, color: '#271b12', stroke: '#fef3c7', font: 'serif', curvature: 0.1 });
  return {
    width: 1200,
    height: 640,
    mapType: 'world',
    landmasses: [{ id: 'l', biome: 'grassland', points: [[80, 320], [400, 340], [700, 330], [1100, 340], [1150, 620], [60, 620]] }],
    stamps,
    paths,
    texts,
    grid: { enabled: true, type: 'hex_flat', size: 60, opacity: 0.2, color: '#1e293b', offsetX: 0, offsetY: 0 },
    atmosphere: { vignette: 0.3, parchmentGrain: 0.3, sepia: 0.2, brightness: 1.05 },
    ...sheetLayers(over)
  };
}

const SCENES = {
  ...Object.fromEntries(PRESET_MAPS.map((p) => ['map_' + p.id, () => fromProject(p)])),
  sheet_stamps: stampSheet,
  sheet_transforms: transformSheet,
  sheet_layers: layerSheet
};

const canvases = new Map(); // `${scene}|${backend}` -> canvas, flattened on white

function flatten(src, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  g.drawImage(src, 0, 0, w, h);
  return c;
}

async function imagesReady(scene) {
  // custom image stamps decode asynchronously; the first stampImage call starts the load
  for (const s of scene.stamps || []) {
    if (!s.customImage) continue;
    for (let i = 0; i < 100 && !stampImage(s.customImage); i++) await new Promise((r) => setTimeout(r, 20));
  }
}

async function renderPixi(props, q = 1) {
  const { PixiMapView } = await import('../../src/engine/pixiView.ts');
  const view = await PixiMapView.create(props.width, props.height);
  try {
    view.setQuality(q, props.width, props.height);
    view.render(buildPlan(props));
    const c = view.extract();
    if (c.width !== Math.round(props.width * q)) throw new Error(`pixi extract is ${c.width} px wide, expected ${props.width * q}`);
    return q === 1 ? flatten(c, props.width, props.height) : shrink(flatten(c, c.width, c.height), Math.max(props.width, props.height));
  } finally {
    view.destroy();
  }
}

function render(props, backend) {
  const { width, height } = props;
  if (backend === 'export') {
    const c = renderExportCanvas({ ...props, mapWidth: width, mapHeight: height });
    return flatten(c, width, height);
  }
  if (backend === 'live2d') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    renderMap({ ctx, cache: true, ...props });
    return flatten(c, width, height);
  }
  if (backend === 'export2x') {
    // a 2x export shrunk back to 1x: what changes with the export scale shows up here
    const c = renderExportCanvas({ ...props, mapWidth: width, mapHeight: height }, { scale: 2 });
    return shrink(flatten(c, c.width, c.height), Math.max(width, height));
  }
  if (backend === 'pixi') return renderPixi(props);
  if (backend === 'pixi2x') return renderPixi(props, 2); // the live view zoomed in (quality 2), shrunk back to 1x
  throw new Error('unknown backend ' + backend);
}

/** Box-filtered copy whose longest side is `max` px (the size baselines are stored at). */
function shrink(c, max) {
  const k = Math.min(1, max / Math.max(c.width, c.height));
  const w = Math.max(1, Math.round(c.width * k)), h = Math.max(1, Math.round(c.height * k));
  // halve repeatedly, then one final step, so every source pixel contributes
  let cur = c;
  while (cur.width / 2 >= w && cur.height / 2 >= h) {
    const n = document.createElement('canvas');
    n.width = Math.round(cur.width / 2);
    n.height = Math.round(cur.height / 2);
    const g = n.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(cur, 0, 0, n.width, n.height);
    cur = n;
  }
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const g = out.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(cur, 0, 0, w, h);
  return out;
}

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not decode image'));
    img.src = url;
  });

/**
 * Per-pixel comparison. A pixel differs when any channel is off by more than `threshold` (0-255). Returns the share of
 * differing pixels, the mean channel difference, the bounding box of the differences, and a diff image (the first image
 * faded, differing pixels red).
 */
function compareCanvases(a, b, threshold) {
  const w = a.width, h = a.height;
  if (b.width !== w || b.height !== h) return { sizeMismatch: true, a: [w, h], b: [b.width, b.height], fraction: 1 };
  const da = a.getContext('2d').getImageData(0, 0, w, h).data;
  const db = b.getContext('2d').getImageData(0, 0, w, h).data;
  const diff = document.createElement('canvas');
  diff.width = w;
  diff.height = h;
  const dg = diff.getContext('2d');
  const out = dg.createImageData(w, h);
  const o = out.data;
  let bad = 0, sum = 0, maxd = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0, p = 0; i < da.length; i += 4, p++) {
    const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
    sum += d;
    if (d > maxd) maxd = d;
    const lum = (da[i] * 0.3 + da[i + 1] * 0.59 + da[i + 2] * 0.11) * 0.35 + 165;
    if (d > threshold) {
      bad++;
      const x = p % w, y = (p / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      o[i] = 230; o[i + 1] = 20; o[i + 2] = 20;
    } else {
      o[i] = o[i + 1] = o[i + 2] = lum;
    }
    o[i + 3] = 255;
  }
  dg.putImageData(out, 0, 0);
  return {
    fraction: bad / (w * h),
    mean: sum / (w * h),
    max: maxd,
    box: bad ? [x0, y0, x1, y1] : null,
    diff
  };
}

const png = (c) => c.toDataURL('image/png');

window.inkTest = {
  scenes: () => Object.keys(SCENES),
  props: (scene) => SCENES[scene](),
  size(scene) {
    const { width, height } = SCENES[scene]();
    return { width, height };
  },
  /** Renders `scene` with `backend`, keeps the full-size result in the page, returns its size and the time taken. */
  async render(scene, backend) {
    const props = SCENES[scene]();
    await imagesReady(props);
    const t = performance.now();
    const c = await render(props, backend);
    canvases.set(scene + '|' + backend, c);
    return { width: c.width, height: c.height, ms: Math.round(performance.now() - t) };
  },
  /** Renders ad-hoc props (for investigating a difference), stored under `name` like a scene. */
  async renderProps(name, props, backend) {
    await imagesReady(props);
    const c = await render({ ...sheetLayers(), ...props }, backend);
    canvases.set(name + '|' + backend, c);
    return { width: c.width, height: c.height };
  },
  /** A rendered result as PNG, full size or shrunk to `max` px on the longest side. */
  image(scene, backend, max = 0) {
    const c = canvases.get(scene + '|' + backend);
    return png(max ? shrink(c, max) : c);
  },
  /** Compare two rendered results at full size, or both shrunk to `max`. */
  compare(scene, a, b, { threshold = 32, max = 0 } = {}) {
    let ca = canvases.get(scene + '|' + a), cb = canvases.get(scene + '|' + b);
    if (max) { ca = shrink(ca, max); cb = shrink(cb, max); }
    const r = compareCanvases(ca, cb, threshold);
    return { ...r, diff: r.diff ? png(r.diff) : null };
  },
  /** Compare a rendered result, shrunk to the baseline's size, with a stored baseline PNG. */
  async compareBaseline(scene, backend, baselineUrl, { threshold = 32 } = {}) {
    const img = await loadImage(baselineUrl);
    const base = flatten(img, img.naturalWidth, img.naturalHeight);
    const cur = shrink(canvases.get(scene + '|' + backend), Math.max(img.naturalWidth, img.naturalHeight));
    const r = compareCanvases(cur, base, threshold);
    return { ...r, diff: r.diff ? png(r.diff) : null, current: png(cur) };
  },
  forget(scene) {
    for (const k of [...canvases.keys()]) if (k.startsWith(scene + '|')) canvases.delete(k);
  }
};
window.inkTestReady = true;
