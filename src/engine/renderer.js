// InkForge Rendering Pipeline — High Performance Canvas 2D Engine
import { getStampById } from './stampsCatalog.js';
import { getBiomePattern } from './biomesCatalog.js';
import { safeImageSrc } from '../utils/importGuard.js';
import { feature } from '../plugins/features.js';
import { simplifyPath } from '../utils/pathSmooth.js';

/** Paints a mask-fill stroke's row runs, grown by one cell so it meets the antialiased edge it was bounded by. Core, not
 * part of the Mask fill plugin: a map with fills must still draw after the plugin is removed. */
export function drawFillRuns(ctx, stroke) {
  const k = stroke.cell || 2;
  ctx.beginPath();
  for (const r of stroke.runs || []) {
    if (!Array.isArray(r) || r.length < 3) continue;
    ctx.rect((r[1] - 1) * k, (r[0] - 1) * k, (r[2] - r[1] + 3) * k, 3 * k);
  }
  ctx.fill();
}

// Cache for static background & noise buffers
let backgroundCache = null;
let lastBgKey = '';

// Custom stamp images: decoded once per data URL, never written back onto the stamp.
// The canvas repaints via onImageLoad when a still-loading image arrives.
const imageCache = new Map();
const watched = new WeakSet();
let imageLoadHandler = null;
let imageEpoch = 0; // bumps when any custom image finishes decoding, so cached stamp layers repaint
export function onImageLoad(fn) {
  imageLoadHandler = fn;
}
export function stampImage(src) {
  if (typeof src === 'string' && !safeImageSrc(src)) return null; // never fetch a remote URL for a stamp
  let img = typeof src === 'string' ? imageCache.get(src) : src;
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  if (!img.complete && !watched.has(img)) {
    watched.add(img);
    img.addEventListener('load', () => { imageEpoch++; imageLoadHandler && imageLoadHandler(); }, { once: true });
  }
  return img.complete && img.naturalWidth ? img : null;
}

/** Width / height of a placed stamp: its own (custom uploads) or the catalogue definition's. */
export function stampAspect(s) {
  return s.aspect || getStampById(s.stampId)?.aspect || 1.0;
}

/**
 * The map as an ordered list of layers, each made of parts, with the inputs that decide when a part must be redrawn.
 * Both the Canvas 2D path (renderMap) and the Pixi live view consume it, so layer order and cache keys live in one place.
 *  - { kind: 'layer', name, style, parts }  parts: { kind: 'raster', deps, draw(c) } | { kind: 'stamps', deps, stamps, selectedId, draw(c) }
 *  - { kind: 'live', style, stroke }        stroke being painted: cheap preview above the land layer
 *  - { kind: 'atmosphere', atmosphere }     post-processing over everything below it
 */
export function buildPlan({
  width,
  height,
  mapType = 'world',
  landmasses = [],
  brushStrokes = [], // freehand land & texture strokes
  liveStroke = null, // stroke still being painted: cheap outline preview
  landStroke = null, // stroke still being painted, rendered for real into the land layer at reduced scale (live preview)
  stamps = [],
  paths = [],
  texts = [],
  grid = { enabled: true, type: 'hex_flat', size: 60, opacity: 0.15, color: '#1e293b', offsetX: 0, offsetY: 0 },
  atmosphere = { vignette: 0.4, parchmentGrain: 0.35, sepia: 0.2, brightness: 1.0 },
  coastline = { ripplesEnabled: true, rippleCount: 4, rippleSpacing: 11, rippleColor: '#bae6fd', rippleOpacity: 0.35, sandEnabled: true, sandWidth: 14, sandColor: '#d4be8d', outlineColor: '#3d2b1f', outlineWidth: 2.5, shadowEnabled: true, shadowBlur: 10 },
  selectedStampId = null,
  selectedTextId = null,
  selectedPathId = null,
  layerVisibility = { background: true, land: true, paths: true, stamps: true, text: true, grid: true, atmosphere: true },
  layerStyle = {} // { [layerKey]: { opacity, blend } }
}) {
  const st = (k) => layerStyle[k];
  // objects belong to a custom layer when `layer` names one that still exists; otherwise to their built-in layer
  const onLayer = (key) => (o) => o.layer === key;
  const onBase = (o) => !o.layer || !layerStyle[o.layer];
  const customKeys = Object.keys(layerStyle).filter((k) => k.startsWith('c_'));
  const customSig = customKeys.join(',');

  const raster = (deps, draw, empty = false) => ({ kind: 'raster', deps, draw, empty });
  const stampPart = (list, selectedId, extra) => ({
    kind: 'stamps',
    deps: [stamps, selectedId, imageEpoch, ...extra],
    stamps: list,
    selectedId,
    epoch: imageEpoch,
    draw: (c) => renderStamps(c, list, selectedId)
  });
  const items = [];
  const layer = (name, ...parts) => items.push({ kind: 'layer', name, style: st(name), parts });

  // 1. BASE BACKGROUND (Ocean or Dungeon Void)
  if (layerVisibility.background) {
    layer('background', raster([mapType, width, height], (c) => {
      if (mapType === 'world') renderOceanBackground(c, width, height);
      else renderDungeonVoid(c, width, height);
    }));
  }

  // 2. LANDMASSES & TERRAIN SCULPTING (True Dual-Layer Masking + Dynamic Coastlines)
  if (layerVisibility.land) {
    // while stroking, the in-progress stroke is a new input every frame (so the cache key changes) and the pass runs at
    // liveScale; on release landStroke is null again, the key returns to the committed arrays and one full-quality pass runs
    const strokes = withLiveStroke(brushStrokes, landStroke);
    layer('land', raster([landmasses, strokes, coastline, mapType, width, height],
      (c) => renderLandmasses(c, width, height, landmasses, strokes, mapType, coastline, landStroke ? liveScale(width, height) : 1)));
    if (liveStroke) items.push({ kind: 'live', style: st('land'), stroke: liveStroke });
  }

  // 3. PATHS, RIVERS & WALLS
  if (layerVisibility.paths) {
    const list = paths.filter(onBase);
    layer('paths', raster([paths, selectedPathId, customSig, landmasses, brushStrokes], (c) => renderPaths(c, list, selectedPathId, { width, height, landmasses, brushStrokes }), list.length === 0));
  }

  // 4. STAMPS (Y-Sorted for proper isometric depth)
  if (layerVisibility.stamps) {
    layer('stamps', stampPart(stamps.filter(onBase), selectedStampId, [customSig]));
  }

  // 4b. CUSTOM LAYERS, bottom to top: each draws its own paths, stamps and labels
  for (const key of customKeys) {
    if (layerVisibility[key] === false) continue;
    const pl = paths.filter(onLayer(key)), tl = texts.filter(onLayer(key));
    layer(key,
      raster([paths, selectedPathId, landmasses, brushStrokes], (c) => renderPaths(c, pl, selectedPathId, { width, height, landmasses, brushStrokes }), pl.length === 0),
      stampPart(stamps.filter(onLayer(key)), selectedStampId, []),
      raster([texts, selectedTextId], (c) => renderTexts(c, tl, selectedTextId), tl.length === 0));
  }

  // 5. ATMOSPHERE POST-PROCESSING (Applies to world art before text/grid overlays)
  if (layerVisibility.atmosphere) items.push({ kind: 'atmosphere', atmosphere: feature('lighting')?.withLighting(atmosphere, stamps, paths, grid) ?? atmosphere });

  // 6. TEXT LABELS & BANNERS (With curved arc projection)
  if (layerVisibility.text) {
    const list = texts.filter(onBase);
    layer('text', raster([texts, selectedTextId, customSig], (c) => renderTexts(c, list, selectedTextId), list.length === 0));
  }

  // 7. GRID OVERLAY (Square, Hex, Isometric)
  if (layerVisibility.grid && grid.enabled) {
    layer('grid', raster([grid, width, height], (c) => renderGrid(c, width, height, grid)));
  }
  return { width, height, items };
}

// half resolution, less on big maps so a live frame stays near 1.5 megapixels of mask
export const liveScale = (w, h) => Math.min(0.5, Math.sqrt(1.5e6 / (w * h)));
/** Committed strokes plus the one being painted; the committed array itself when nothing is being painted. */
export function withLiveStroke(brushStrokes, stroke) {
  return stroke ? [...brushStrokes, stroke] : brushStrokes;
}

/**
 * Main draw loop: renders the composite map into destination canvas.
 * `cache` is for the live canvas only: it keeps each layer's raster between repaints (exports must not share it).
 */
export function renderMap({ ctx, cache = false, ...props }) {
  const { width, height, items } = buildPlan(props);
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  for (const it of items) {
    if (it.kind === 'layer') {
      const { name, style, parts } = it;
      cachedPass(cache, ctx, name, parts.flatMap((p) => p.deps), style, (c) => parts.forEach((p) => p.draw(c)));
    } else if (it.kind === 'live') {
      layerPass(ctx, it.style, (c) => drawLiveStroke(c, it.stroke));
    } else {
      renderAtmosphere(ctx, width, height, it.atmosphere);
    }
  }
  ctx.restore();
}

/** Quick look at a stroke mid-drag: no coast ripples, sand or outline until it is committed. */
export function drawLiveStroke(c, s) {
  const pts = s.points;
  if (!pts || pts.length === 0) return;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = s.size;
  const trace = () => {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) c.lineTo(pts[0].x + 0.01, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  };
  if (s.type === 'brush') {
    c.globalAlpha = s.opacity ?? 1;
    c.globalCompositeOperation = s.blendMode || 'source-over';
    c.strokeStyle = getBiomePattern(c, s.biome || 'grassland');
    trace();
    c.stroke();
  } else if (s.mode === 'water') {
    c.globalAlpha = 0.85;
    c.strokeStyle = '#1e3f66';
    trace();
    c.stroke();
  } else {
    c.globalAlpha = 0.9;
    c.strokeStyle = '#3d2b1f';
    c.lineWidth = s.size + 5;
    trace();
    c.stroke();
    c.strokeStyle = '#7da35a';
    c.lineWidth = s.size;
    trace();
    c.stroke();
  }
  c.restore();
}

// Offscreen layer for a pass that may run scaled (zoomed live view, high-resolution export): `s` canvas pixels per map
// unit, so masks and coastlines stay sharp. The scale is capped by area so a 16K export cannot allocate gigabytes; above
// the cap the pass falls back to scaling up, as it always did.
const MAX_LAYER_PX = 24e6;
export function layerScale(ctx, width, height) {
  const t = ctx.getTransform();
  const S = Math.hypot(t.a, t.b) || 1;
  return S <= 1 ? S : Math.min(S, Math.max(1, Math.sqrt(MAX_LAYER_PX / (width * height))));
}
export function makeLayer(width, height, s) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width * s));
  c.height = Math.max(1, Math.round(height * s));
  const g = c.getContext('2d');
  g.scale(c.width / width, c.height / height); // everything on it is still drawn in map units
  return { c, g };
}

// Each layer is rasterised into its own canvas and only redrawn when its inputs change (compared by identity),
// so dragging a stamp or drawing a path repaints one layer and composites the rest. Only the 1:1 preview is
// cached when it is a uniform scale; exports render directly.
// ponytail: one full-size canvas per layer (~45 MB each at 4000x2800); merge into below/above bitmaps if memory bites.
const layerCache = new Map();
function cachedPass(cache, ctx, name, deps, style, draw) {
  const t = ctx.getTransform();
  // a uniform scale (the zoomed live view) is cached too, keyed by the transform so a zoom change redraws
  if (!cache || t.b || t.c || t.a !== t.d) return layerPass(ctx, style, draw);
  const { width: w, height: h } = ctx.canvas;
  let e = layerCache.get(name);
  if (!e || e.canvas.width !== w || e.canvas.height !== h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    e = { canvas, deps: null };
    layerCache.set(name, e);
  }
  const key = [...deps, t.a, t.e, t.f];
  if (!e.deps || e.deps.length !== key.length || e.deps.some((d, i) => !Object.is(d, key[i]))) {
    const g = e.canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(t);
    draw(g);
    e.deps = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = style?.opacity ?? 1;
  ctx.globalCompositeOperation = style?.blend || 'source-over';
  ctx.drawImage(e.canvas, 0, 0);
  ctx.restore();
}

/**
 * Draws one layer through an offscreen buffer when it has non-default opacity or blend,
 * so passes that set their own globalAlpha still honour the layer setting.
 */
const layerScratch = new Map();
function layerPass(ctx, style, draw) {
  const opacity = style?.opacity ?? 1;
  const blend = style?.blend || 'source-over';
  if (opacity >= 1 && blend === 'source-over') return draw(ctx);
  // one scratch canvas per size, reused: allocating a full-size canvas per layer per frame was ~45 ms each
  const key = ctx.canvas.width + 'x' + ctx.canvas.height;
  let off = layerScratch.get(key);
  if (!off) {
    off = document.createElement('canvas');
    off.width = ctx.canvas.width;
    off.height = ctx.canvas.height;
    if (layerScratch.size > 3) layerScratch.clear();
    layerScratch.set(key, off);
  }
  const octx = off.getContext('2d');
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.globalAlpha = 1;
  octx.globalCompositeOperation = 'source-over';
  octx.clearRect(0, 0, off.width, off.height);
  octx.setTransform(ctx.getTransform());
  draw(octx);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = blend;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

/** Ocean / Sea background with navigational rhumb lines and ripples */
function renderOceanBackground(ctx, width, height) {
  const sc = layerScale(ctx, width, height);
  const bgKey = `${width}x${height}@${sc.toFixed(3)}`;
  if (!backgroundCache || lastBgKey !== bgKey) {
    const layer = makeLayer(width, height, sc);
    backgroundCache = layer.c;
    const bctx = layer.g;

    // Gradient ocean base
    const oceanGrad = bctx.createLinearGradient(0, 0, width, height);
    oceanGrad.addColorStop(0, '#2b5175');
    oceanGrad.addColorStop(0.5, '#204060');
    oceanGrad.addColorStop(1, '#18314c');
    bctx.fillStyle = oceanGrad;
    bctx.fillRect(0, 0, width, height);

    // Subtle wave contour ripples
    bctx.save();
    bctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    bctx.lineWidth = 1.5;
    for (let y = 40; y < height; y += 75) {
      bctx.beginPath();
      for (let x = 0; x < width; x += 120) {
        bctx.moveTo(x + 10, y);
        bctx.quadraticCurveTo(x + 35, y - 6, x + 60, y);
        bctx.moveTo(x + 70, y + 12);
        bctx.quadraticCurveTo(x + 95, y + 6, x + 120, y + 12);
      }
      bctx.stroke();
    }
    bctx.restore();

    // Navigational Rhumb Lines
    bctx.save();
    bctx.strokeStyle = 'rgba(212, 190, 141, 0.08)';
    bctx.lineWidth = 1;
    const centers = [
      { x: width * 0.25, y: height * 0.3 },
      { x: width * 0.75, y: height * 0.7 }
    ];
    for (const c of centers) {
      for (let a = 0; a < 16; a++) {
        const rad = (Math.PI * 2 / 16) * a;
        bctx.beginPath();
        bctx.moveTo(c.x, c.y);
        bctx.lineTo(c.x + Math.cos(rad) * 2200, c.y + Math.sin(rad) * 2200);
        bctx.stroke();
      }
    }
    bctx.restore();

    lastBgKey = bgKey;
  }

  ctx.drawImage(backgroundCache, 0, 0, width, height);
}

/** Tactical Battlemap Dungeon Void */
function renderDungeonVoid(ctx, width, height) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Subtle floor dust noise
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const y = (i * 47) % height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Shallow-water halo as a distance field from the finished land mask: ring i covers water within 5 + i * spacing px of
 * land with alpha rippleOpacity * e^(-0.55 i), the same bands the geometric rings draw. Works at half resolution
 * (chamfer 5-7 distance, two passes) and is scaled up smoothly.
 */
function drawMaskHalo(ctx, maskCanvas, width, height, cl, strength) {
  const S = 0.5;
  const w = Math.max(1, Math.round(width * S));
  const h = Math.max(1, Math.round(height * S));
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const sg = small.getContext('2d', { willReadFrequently: true });
  sg.drawImage(maskCanvas, 0, 0, w, h);
  const px = sg.getImageData(0, 0, w, h).data;

  const INF = 65535;
  const D = new Uint16Array(w * h);
  for (let i = 0; i < D.length; i++) D[i] = px[i * 4 + 3] > 127 ? 0 : INF;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = D[i];
      if (!v) continue;
      if (x > 0) v = Math.min(v, D[i - 1] + 5);
      if (y > 0) {
        v = Math.min(v, D[i - w] + 5);
        if (x > 0) v = Math.min(v, D[i - w - 1] + 7);
        if (x < w - 1) v = Math.min(v, D[i - w + 1] + 7);
      }
      D[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = D[i];
      if (!v) continue;
      if (x < w - 1) v = Math.min(v, D[i + 1] + 5);
      if (y < h - 1) {
        v = Math.min(v, D[i + w] + 5);
        if (x < w - 1) v = Math.min(v, D[i + w + 1] + 7);
        if (x > 0) v = Math.min(v, D[i + w - 1] + 7);
      }
      D[i] = v;
    }
  }

  // alpha by distance, with all rings that still reach that far composited
  const count = Math.min(6, Math.max(1, cl.rippleCount || 4));
  const spacing = cl.rippleSpacing || 11;
  const base = (cl.rippleOpacity || 0.35) * strength;
  const cMax = Math.ceil((5 + (count - 1) * spacing) * S * 5) + 8;
  const lut = new Uint8Array(cMax + 1);
  for (let c = 1; c <= cMax; c++) {
    const d = c / (5 * S); // full-resolution pixels
    let clear = 1;
    for (let i = 0; i < count; i++) if (d <= 5 + i * spacing) clear *= 1 - base * Math.exp(-0.55 * i);
    lut[c] = Math.round(255 * (1 - clear));
  }

  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const tg = tmp.getContext('2d', { willReadFrequently: true });
  tg.fillStyle = cl.rippleColor || '#bae6fd';
  tg.fillRect(0, 0, 1, 1);
  const [r, g, b] = tg.getImageData(0, 0, 1, 1).data;

  const img = new ImageData(w, h);
  for (let i = 0; i < D.length; i++) {
    const c = D[i];
    const o = i * 4;
    img.data[o] = r;
    img.data[o + 1] = g;
    img.data[o + 2] = b;
    img.data[o + 3] = c > cMax ? 0 : lut[c];
  }
  small.getContext('2d').putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, width, height);
  ctx.restore();
}

/** Paints the land mask (white = land) from the preset polygons and the add-land / carve-water strokes. */
export function drawLandMask(mctx, landmasses, brushStrokes) {
  // Draw preset polygon landmasses onto mask
  mctx.fillStyle = '#ffffff';
  for (const land of landmasses) {
    if (!land.points || land.points.length < 3) continue;
    mctx.beginPath();
    drawSmoothPolygon(mctx, land.points);
    mctx.fill();
  }

  // Apply Mask sculpting strokes (Add land or Carve water)
  for (const stroke of (brushStrokes || [])) {
    if (stroke.type !== 'mask') continue;
    if (!stroke.points || stroke.points.length === 0) continue;

    mctx.save();
    if (stroke.mode === 'water') {
      // True non-destructive water carving!
      mctx.globalCompositeOperation = 'destination-out';
    } else {
      mctx.globalCompositeOperation = 'source-over';
      mctx.fillStyle = '#ffffff';
      mctx.strokeStyle = '#ffffff';
    }

    mctx.lineWidth = stroke.size || 40;
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';

    if (stroke.shape === 'fill') {
      drawFillRuns(mctx, stroke);
    } else if (stroke.shape === 'rough') {
      // Fractal jagged coastline brush (Inkarnate Edgy/Rough brush style)
      const r = (stroke.size || 40) / 2;
      const roughness = stroke.roughness || 0.6;
      for (const pt of stroke.points) {
        mctx.beginPath();
        const numSides = 10;
        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / numSides) {
          const pseudoNoise = (Math.sin(pt.x * 0.05 + a * 4) * Math.cos(pt.y * 0.05 + a * 3)) * roughness;
          const rad = r * (1.0 + pseudoNoise * 0.4);
          const jx = pt.x + Math.cos(a) * rad;
          const jy = pt.y + Math.sin(a) * rad;
          if (a === 0) mctx.moveTo(jx, jy);
          else mctx.lineTo(jx, jy);
        }
        mctx.closePath();
        mctx.fill();
      }
    } else {
      // Smooth round brush
      if (stroke.points.length === 1) {
        mctx.beginPath();
        mctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 40) / 2, 0, Math.PI * 2);
        mctx.fill();
      } else {
        mctx.beginPath();
        drawSmoothPolyline(mctx, stroke.points.map(p => [p.x, p.y]));
        mctx.stroke();
      }
    }
    mctx.restore();
  }
}

/**
 * Render landmasses with true dual-layer sculpting, coastlines, and beach fringes.
 * Uses an offscreen Land Mask Buffer and an offscreen Terrain Buffer for authentic
 * Inkarnate clipping and non-destructive water carving.
 */
function renderLandmasses(ctx, width, height, landmasses, brushStrokes, mapType, coastline, quality = 1) {
  if ((!landmasses || landmasses.length === 0) && (!brushStrokes || brushStrokes.length === 0)) return;
  if (quality < 1) {
    // live preview: the whole pipeline runs on a small buffer and is upscaled once, so the many full-size
    // blits (shadow, sand, outline) are not paid at the destination's resolution
    const { c, g } = makeLayer(width, height, layerScale(ctx, width, height) * quality);
    renderLandmasses(g, width, height, landmasses, brushStrokes, mapType, coastline);
    ctx.drawImage(c, 0, 0, width, height);
    return;
  }

  const cl = {
    ripplesEnabled: true,
    rippleCount: 4,
    rippleSpacing: 11,
    rippleColor: '#bae6fd',
    rippleOpacity: 0.35,
    sandEnabled: true,
    sandWidth: 14,
    sandColor: '#d4be8d',
    outlineColor: '#3d2b1f',
    outlineWidth: 2.5,
    shadowEnabled: true,
    shadowBlur: 10,
    ...(coastline || {})
  };

  // 1. Build the Offscreen Land Mask Canvas (at the scale this pass is drawn at, so the coast stays sharp when zoomed)
  const ls = layerScale(ctx, width, height);
  const { c: maskCanvas, g: mctx } = makeLayer(width, height, ls);

  drawLandMask(mctx, landmasses, brushStrokes);

  // 2. Coastal Ripple Rings (Water-lining) & Shallows Halo
  // The rings below follow the land shapes as they were drawn, so once water has been carved out of land they would
  // keep haloing land that is gone. With carving present the halo is measured from the finished mask instead.
  // fills (plugins/builtin/maskFill) have no brush outline to echo, so they also take the finished-mask halo
  const carved = (brushStrokes || []).some((st) => st.type === 'mask' && (st.shape === 'fill' || (st.mode === 'water' && st.points && st.points.length > 0)));
  if (mapType === 'world' && cl.ripplesEnabled && carved) {
    const hasPolygons = landmasses.some((l) => l.points && l.points.length >= 3);
    drawMaskHalo(ctx, maskCanvas, width, height, cl, hasPolygons ? 1 : 0.7); // brush land halos are drawn 30% lighter
  } else if (mapType === 'world' && cl.ripplesEnabled) {
    ctx.save();
    const count = Math.min(6, Math.max(1, cl.rippleCount || 4));
    const spacing = cl.rippleSpacing || 11;
    const baseOpacity = cl.rippleOpacity || 0.35;

    for (let i = count - 1; i >= 0; i--) {
      const dist = 5 + i * spacing;
      const alpha = baseOpacity * Math.exp(-0.55 * i);

      // Draw dilated polygon boundaries as ripple echoes
      for (const land of landmasses) {
        if (!land.points || land.points.length < 3) continue;
        ctx.beginPath();
        drawSmoothPolygon(ctx, land.points);
        ctx.strokeStyle = cl.rippleColor || '#bae6fd';
        ctx.globalAlpha = alpha;
        ctx.lineWidth = dist * 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Also render ripples for additive mask strokes
      for (const stroke of (brushStrokes || [])) {
        if (stroke.type === 'mask' && stroke.mode === 'land' && stroke.points && stroke.points.length > 0) {
          ctx.beginPath();
          if (stroke.points.length === 1) {
            ctx.arc(stroke.points[0].x, stroke.points[0].y, ((stroke.size || 40) + dist * 2) / 2, 0, Math.PI * 2);
          } else {
            drawSmoothPolyline(ctx, stroke.points.map(p => [p.x, p.y]));
          }
          ctx.strokeStyle = cl.rippleColor || '#bae6fd';
          ctx.globalAlpha = alpha * 0.7;
          ctx.lineWidth = (stroke.size || 40) + dist * 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 3. 3D Land Elevation Drop Shadow
  if (cl.shadowEnabled) {
    ctx.save();
    ctx.shadowColor = mapType === 'world' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = cl.shadowBlur || 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(maskCanvas, 0, 0, width, height);
    ctx.restore();
  }

  // 4a. Draw Background / Water Brush Strokes (Clipped outside land)
  const waterBrushStrokes = (brushStrokes || []).filter(s => s.type === 'brush' && s.target === 'background');
  if (waterBrushStrokes.length > 0) {
    const { c: waterCanvas, g: wctx } = makeLayer(width, height, ls);

    for (const stroke of waterBrushStrokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      wctx.save();
      wctx.globalAlpha = stroke.opacity || 0.85;
      wctx.globalCompositeOperation = stroke.blendMode || 'source-over';
      wctx.strokeStyle = getBiomePattern(wctx, stroke.biome || 'deep_ocean');
      wctx.fillStyle = wctx.strokeStyle;
      wctx.lineWidth = stroke.size || 40;
      wctx.lineCap = 'round';
      wctx.lineJoin = 'round';
      if (stroke.points.length === 1) {
        wctx.beginPath();
        wctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 40) / 2, 0, Math.PI * 2);
        wctx.fill();
      } else {
        wctx.beginPath();
        drawSmoothPolyline(wctx, stroke.points.map(p => [p.x, p.y]));
        wctx.stroke();
      }
      wctx.restore();
    }

    // Clip to outside land
    wctx.save();
    wctx.globalCompositeOperation = 'destination-out';
    wctx.drawImage(maskCanvas, 0, 0, width, height);
    wctx.restore();

    ctx.drawImage(waterCanvas, 0, 0, width, height);
  }

  // 4b. Build the Offscreen Terrain Buffer (Base Biomes + FG Brush Strokes)
  const { c: terrainCanvas, g: tctx } = makeLayer(width, height, ls);

  // Default base terrain wash
  tctx.fillStyle = getBiomePattern(tctx, 'grassland');
  tctx.fillRect(0, 0, width, height);

  // Paint landmass-specific base biomes
  for (const land of landmasses) {
    if (!land.points || land.points.length < 3) continue;
    tctx.save();
    tctx.beginPath();
    drawSmoothPolygon(tctx, land.points);
    tctx.fillStyle = getBiomePattern(tctx, land.biome || 'grassland');
    tctx.fill();
    tctx.restore();
  }

  // Paint Freehand Foreground Biome Brush Strokes
  const fgBrushStrokes = (brushStrokes || []).filter(s => s.type === 'brush' && s.target !== 'background');
  for (const stroke of fgBrushStrokes) {
    if (!stroke.points || stroke.points.length === 0) continue;

    tctx.save();
    tctx.globalAlpha = stroke.opacity || 0.85;
    tctx.globalCompositeOperation = stroke.blendMode || 'source-over';

    if (stroke.softness && stroke.softness > 0.1) {
      // Soft-falloff feathered airbrush dabs: build the alpha mask in a bbox-sized buffer,
      // then fill it with the biome texture (a gradient can't carry a pattern directly).
      const r = (stroke.size || 40) / 2;
      const xs = stroke.points.map((pt) => pt.x);
      const ys = stroke.points.map((pt) => pt.y);
      const minX = Math.floor(Math.min(...xs) - r);
      const minY = Math.floor(Math.min(...ys) - r);
      const bw = Math.ceil(Math.max(...xs) + r) - minX;
      const bh = Math.ceil(Math.max(...ys) + r) - minY;
      const { c: sc, g: sctx } = makeLayer(bw, bh, ls);
      sctx.translate(-minX, -minY);
      for (const pt of stroke.points) {
        const grad = sctx.createRadialGradient(pt.x, pt.y, r * (1 - stroke.softness), pt.x, pt.y, r);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        sctx.fillStyle = grad;
        sctx.beginPath();
        sctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.globalCompositeOperation = 'source-in';
      sctx.fillStyle = getBiomePattern(sctx, stroke.biome || 'grassland');
      sctx.fillRect(minX, minY, bw, bh);
      tctx.drawImage(sc, minX, minY, bw, bh);
    } else {
      tctx.strokeStyle = getBiomePattern(tctx, stroke.biome || 'grassland');
      tctx.fillStyle = tctx.strokeStyle;
      tctx.lineWidth = stroke.size || 40;
      tctx.lineCap = 'round';
      tctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        tctx.beginPath();
        tctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 40) / 2, 0, Math.PI * 2);
        tctx.fill();
      } else {
        tctx.beginPath();
        drawSmoothPolyline(tctx, stroke.points.map(p => [p.x, p.y]));
        tctx.stroke();
      }
    }
    tctx.restore();
  }

  // 5. CLIP Terrain Buffer to Land Mask Buffer (True Masking!)
  tctx.save();
  tctx.globalCompositeOperation = 'destination-in';
  tctx.drawImage(maskCanvas, 0, 0, width, height);
  tctx.restore();

  // Draw the clipped terrain onto the destination canvas
  ctx.drawImage(terrainCanvas, 0, 0, width, height);

  // 6. Beach / Sand Fringe along the inner coastline of ALL land (presets, added land, carved bays):
  // dilate the water (inverse mask) inward by half the beach width, keep the part that lies on land.
  if (mapType === 'world' && cl.sandEnabled && cl.sandWidth > 0) {
    const { c: water, g: wc } = makeLayer(width, height, ls);
    wc.fillStyle = '#fff';
    wc.fillRect(0, 0, width, height);
    wc.globalCompositeOperation = 'destination-out';
    wc.drawImage(maskCanvas, 0, 0, width, height);
    const { c: sand, g: sc } = makeLayer(width, height, ls);
    const reach = cl.sandWidth / 2;
    sc.drawImage(water, 0, 0, width, height);
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      sc.drawImage(water, Math.cos(ang) * reach, Math.sin(ang) * reach, width, height);
    }
    sc.globalCompositeOperation = 'source-in';
    sc.fillStyle = cl.sandColor || '#d4be8d';
    sc.fillRect(0, 0, width, height);
    sc.globalCompositeOperation = 'destination-in';
    sc.drawImage(maskCanvas, 0, 0, width, height);
    ctx.drawImage(sand, 0, 0, width, height);
  }

  // 7. Crisp Ink Coastline Contour: the true edge of the land mask (presets, added land and carved water)
  if (cl.outlineWidth > 0) {
    const { c: ring, g: rctx } = makeLayer(width, height, ls);
    const reach = cl.outlineWidth;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      rctx.drawImage(maskCanvas, Math.cos(ang) * reach, Math.sin(ang) * reach, width, height);
    }
    rctx.globalCompositeOperation = 'source-in';
    rctx.fillStyle = cl.outlineColor || (mapType === 'world' ? '#3d2b1f' : '#1e293b');
    rctx.fillRect(0, 0, width, height);
    rctx.globalCompositeOperation = 'destination-out';
    rctx.drawImage(maskCanvas, 0, 0, width, height);
    ctx.drawImage(ring, 0, 0, width, height);
  }
}

/**
 * C1-continuous closed spline smoothing starting at midpoint of (points[N-1], points[0])
 * Completely eliminates corner pinch / cusps at vertex 0!
 */
export function drawSmoothPolygon(ctx, points) {
  if (!points || points.length < 3) return;
  const n = points.length;
  const startMidX = (points[n - 1][0] + points[0][0]) / 2;
  const startMidY = (points[n - 1][1] + points[0][1]) / 2;

  ctx.moveTo(startMidX, startMidY);
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    const midX = (curr[0] + next[0]) / 2;
    const midY = (curr[1] + next[1]) / 2;
    ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
  }
  ctx.closePath();
}

/** Smooth polyline with midpoint quadratic interpolation for rivers and roads */
export function drawSmoothPolyline(ctx, points) {
  if (!points || points.length < 2) return;
  if (points.length === 2) {
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.lineTo(points[1][0], points[1][1]);
    return;
  }

  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0[0] + p1[0]) / 2;
    const midY = (p0[1] + p1[1]) / 2;
    ctx.quadraticCurveTo(p0[0], p0[1], midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
}

/** Render rivers, roads, and walls */
// Rivers stop at the coast: they are drawn on their own canvas and cut to the land mask. Maps with no land at all
// (dungeons, battle maps) have nothing to clip against, so their rivers are left whole.
export function hasLand(landmasses, brushStrokes) {
  return (landmasses || []).some((l) => l.points && l.points.length >= 3)
    || (brushStrokes || []).some((st) => st.type === 'mask' && st.mode !== 'water' && st.points && st.points.length);
}

function renderPaths(ctx, paths, selectedPathId, world) {
  if (!paths || paths.length === 0) return;
  if (world && hasLand(world.landmasses, world.brushStrokes) && paths.some((p) => p.type === 'river')) {
    const ls = layerScale(ctx, world.width, world.height);
    const { c: rc, g: rg } = makeLayer(world.width, world.height, ls);
    drawPaths(rg, paths.filter((p) => p.type === 'river'), selectedPathId);
    const { c: mc, g: mg } = makeLayer(world.width, world.height, ls);
    drawLandMask(mg, world.landmasses, world.brushStrokes);
    rg.save();
    rg.setTransform(1, 0, 0, 1, 0, 0);
    rg.globalCompositeOperation = 'destination-in';
    rg.drawImage(mc, 0, 0);
    rg.restore();
    // river first, then roads and walls on top: same order as before only when rivers were listed first, so keep list order for the rest
    ctx.drawImage(rc, 0, 0, world.width, world.height);
    drawPaths(ctx, paths.filter((p) => p.type !== 'river'), selectedPathId);
    return;
  }
  drawPaths(ctx, paths, selectedPathId);
}

function drawPaths(ctx, paths, selectedPathId) {
  for (const path of paths) {
    if (!path.points || path.points.length < 2) continue;

    ctx.save();

    if (path.type === 'river') {
      // River: outer shoreline banks + inner blue watercourse
      ctx.beginPath();
      drawSmoothPolyline(ctx, path.points);
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = (path.width || 12) + 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.beginPath();
      drawSmoothPolyline(ctx, path.points);
      ctx.strokeStyle = path.color || '#3b82f6';
      ctx.lineWidth = path.width || 12;
      ctx.stroke();
    } else if (path.type === 'road') {
      // Road: dashed or dirt trail
      ctx.beginPath();
      drawSmoothPolyline(ctx, path.points);
      ctx.strokeStyle = path.color || '#78350f';
      ctx.lineWidth = path.width || 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (path.dashed) {
        ctx.setLineDash([8, 8]);
      }
      ctx.stroke();
    } else if (path.type === 'wall') {
      // Dungeon wall: thick masonry outline
      ctx.beginPath();
      drawSmoothPolyline(ctx, path.points);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = (path.width || 14) + 6;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.stroke();

      ctx.beginPath();
      drawSmoothPolyline(ctx, path.points);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = path.width || 14;
      ctx.stroke();
    }

    // Path selection indicator
    if (path.id === selectedPathId) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Stamps are vector code; drawing them once into a small sprite makes repaints cheap, gives each stamp
// ONE soft shadow (not one per sub-path) and keeps per-stamp tone/hue filters off the big canvas.
const spriteCache = new Map();
export function stampSprite(ctx, def, s, size, w, h) {
  const a = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) || 1;
  const k = Math.min(4, Math.max(0.25, 2 ** Math.ceil(Math.log2(a))));
  const key = [s.stampId, Math.round(size), k, s.color, s.fill, s.seed, s.tone, s.hue, !!s.flipX, !!s.flipY].join('|');
  let sp = spriteCache.get(key);
  if (sp) {
    spriteCache.delete(key); // refresh LRU order
    spriteCache.set(key, sp);
    return sp;
  }
  const sc = s.scale || 1.0;
  const pad = Math.max(Math.ceil(size * 0.15), Math.ceil(16 * sc));
  const cw = Math.max(1, Math.ceil((w + pad * 2) * k));
  const ch = Math.max(1, Math.ceil((h + pad * 2) * k));
  const raw = document.createElement('canvas');
  raw.width = cw;
  raw.height = ch;
  const g = raw.getContext('2d');
  g.scale(k, k);
  g.translate(pad, pad);
  if (s.tone) g.filter = `brightness(${s.tone}) hue-rotate(${s.hue || 0}deg)`; // small canvas: cheap
  def.render(g, size, s.color, s.fill, s.seed);
  // Cartographic NW light: ONE soft drop shadow baked into the sprite, so the big canvas never blurs
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const sg = c.getContext('2d');
  sg.shadowColor = 'rgba(20, 15, 10, 0.35)';
  sg.shadowBlur = Math.max(3, 6 * sc) * k;
  // a flipped stamp is drawn mirrored, so mirror the baked offset to keep the light falling the same way
  sg.shadowOffsetX = 2 * sc * k * (s.flipX ? -1 : 1);
  sg.shadowOffsetY = 4 * sc * k * (s.flipY ? -1 : 1);
  sg.drawImage(raw, 0, 0);
  sp = { canvas: c, pad, k };
  spriteCache.set(key, sp);
  if (spriteCache.size > 700) spriteCache.delete(spriteCache.keys().next().value);
  return sp;
}

/** Selection box and transform handles, in the stamp's own frame (origin = top-left of its w x h box). */
export function drawStampSelection(ctx, finalW, finalH) {
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-4, -4, finalW + 8, finalH + 8);
  ctx.setLineDash([]);

  // Corner handles (TL, TR, BL, BR)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-8, -8, 8, 8);
  ctx.fillRect(finalW, -8, 8, 8);
  ctx.fillRect(-8, finalH, 8, 8);
  ctx.fillRect(finalW, finalH, 8, 8);

  // Top Rotation Handle Stem
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(finalW / 2, -4);
  ctx.lineTo(finalW / 2, -22);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(finalW / 2, -22, 5, 0, Math.PI * 2);
  ctx.fill();
}

/** Render stamps with true aspect ratio centering, handles, and isometric Y-sorting */
function renderStamps(ctx, stamps, selectedStampId) {
  if (!stamps || stamps.length === 0) return;

  // Strict isometric Y-sorting
  const sorted = [...stamps].sort((a, b) => {
    const za = a.zIndex || 0;
    const zb = b.zIndex || 0;
    if (za !== zb) return za - zb;
    return a.y - b.y;
  });

  for (const s of sorted) {
    const def = getStampById(s.stampId);
    if (!def && !s.customImage) continue;

    const aspect = stampAspect(s);
    const baseSize = 80;
    const finalSize = baseSize * (s.scale || 1.0);
    const finalW = finalSize * aspect;
    const finalH = finalSize;

    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.rotation) {
      ctx.rotate(s.rotation);
    }
    if (s.flipX || s.flipY) {
      ctx.scale(s.flipX ? -1 : 1, s.flipY ? -1 : 1);
    }

    // Centered translation about the true visual origin
    // anchor 'base': the placement point is the bottom-centre, so the stamp stands on the ground
    ctx.translate(-finalW / 2, s.anchor === 'base' ? -finalH : -finalH / 2);

    // Custom image stamp or procedural vector stamp (procedural sprites carry their own baked shadow)
    if (s.customImage) {
      ctx.shadowColor = 'rgba(20, 15, 10, 0.35)';
      ctx.shadowBlur = Math.max(3, 6 * (s.scale || 1.0));
      ctx.shadowOffsetX = 2 * (s.scale || 1.0);
      ctx.shadowOffsetY = 4 * (s.scale || 1.0);
      const img = stampImage(s.customImage);
      if (img) ctx.drawImage(img, 0, 0, finalW, finalH);
    } else if (def && def.render) {
      const sp = stampSprite(ctx, def, s, finalSize, finalW, finalH);
      ctx.drawImage(sp.canvas, -sp.pad, -sp.pad, finalW + sp.pad * 2, finalH + sp.pad * 2);
    }

    // Reset shadow before drawing selection indicator
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (s.id === selectedStampId) drawStampSelection(ctx, finalW, finalH);

    ctx.restore();
  }
}

/** Render text labels with curvature and fantasy outlines */
function renderTexts(ctx, texts, selectedTextId) {
  if (!texts || texts.length === 0) return;

  for (const t of texts) {
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.rotation) {
      ctx.rotate(t.rotation);
    }

    const fontSize = t.size || 28;
    const fontName = t.font || 'Cinzel';
    ctx.font = `bold ${fontSize}px "${fontName}", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const curvature = t.curvature || 0; // -0.5 to +0.5

    if (Math.abs(curvature) > 0.02) {
      // Arched curved text along circular radius anchored at (t.x, t.y)
      const chars = t.text.split('');
      const tracking = t.tracking || 0;
      const totalW = ctx.measureText(t.text).width + (chars.length - 1) * tracking;
      const radius = totalW / (curvature * Math.PI);
      let curX = -totalW / 2;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const charW = ctx.measureText(char).width;
        const charMidX = curX + charW / 2;
        const theta = charMidX / radius;

        ctx.save();
        // Displace along circle such that the center character anchors at (0, 0)
        const charX = Math.sin(theta) * radius;
        const charY = radius - Math.cos(theta) * radius;
        ctx.translate(charX, charY);
        ctx.rotate(theta);

        // Shadow & Stroke & Fill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText(char, 2, 3);
        if (t.stroke) {
          ctx.strokeStyle = t.stroke;
          ctx.lineWidth = Math.max(3, fontSize * 0.16);
          ctx.lineJoin = 'round';
          ctx.strokeText(char, 0, 0);
        }
        ctx.fillStyle = t.color || '#271b12';
        ctx.fillText(char, 0, 0);

        ctx.restore();
        curX += charW + tracking;
      }
    } else {
      // Standard linear text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillText(t.text, 2, 3);

      if (t.stroke) {
        ctx.strokeStyle = t.stroke;
        ctx.lineWidth = Math.max(3, fontSize * 0.16);
        ctx.lineJoin = 'round';
        ctx.strokeText(t.text, 0, 0);
      }

      ctx.fillStyle = t.color || '#271b12';
      ctx.fillText(t.text, 0, 0);
    }

    // Selection highlight
    if (t.id === selectedTextId) {
      const metrics = ctx.measureText(t.text);
      const textW = metrics.width;
      const textH = fontSize * 1.3;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-textW / 2 - 8, -textH / 2, textW + 16, textH);
    }

    ctx.restore();
  }
}

/** Render Square, Hexagonal (Flat & Pointy), or Isometric grid */
function renderGrid(ctx, width, height, grid) {
  const size = grid.size || 60;
  const offX = grid.offsetX || 0;
  const offY = grid.offsetY || 0;

  ctx.save();
  ctx.strokeStyle = grid.color || '#ffffff';
  ctx.globalAlpha = grid.opacity || 0.15;
  ctx.lineWidth = 1.2;

  ctx.beginPath();

  if (grid.type === 'square') {
    for (let x = offX % size; x <= width; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offY % size; y <= height; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
  } else if (grid.type === 'isometric') {
    // 30-degree / 60-degree Diamond Isometric Grid
    const stepX = size * 2;
    for (let x = -height; x <= width + height; x += stepX) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * 2, height);
      ctx.moveTo(x, 0);
      ctx.lineTo(x - height * 2, height);
    }
  } else if (grid.type === 'hex_pointy') {
    // Pointy-topped hexes
    const r = size;
    const hStep = r * 1.5;
    const wStep = r * Math.sqrt(3);

    for (let row = 0; row * hStep < height + r * 2; row++) {
      for (let col = 0; col * wStep < width + wStep * 2; col++) {
        const cx = col * wStep + (row % 2 === 1 ? wStep / 2 : 0) + offX;
        const cy = row * hStep + offY;

        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + Math.PI / 6;
          const hx = cx + r * Math.cos(angle);
          const hy = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
      }
    }
  } else {
    // Flat-topped hexes (default hex_flat)
    const r = size;
    const h = r * Math.sqrt(3);
    const wStep = r * 1.5;
    const hStep = h;

    for (let col = 0; col * wStep < width + r * 2; col++) {
      for (let row = 0; row * hStep < height + h * 2; row++) {
        const cx = col * wStep + offX;
        const cy = row * hStep + (col % 2 === 1 ? hStep / 2 : 0) + offY;

        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + r * Math.cos(angle);
          const hy = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
      }
    }
  }

  // Single GPU draw call for all lines
  ctx.stroke();
  ctx.restore();
}

/** Atmospheric post-processing: Vignette, Parchment Grain, Sepia warmth, and Brightness */
// 128px parchment noise tile, built once
let noiseCanvas = null;
export function getNoiseCanvas() {
  if (!noiseCanvas) {
    const nSize = 128;
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = nSize;
    noiseCanvas.height = nSize;
    const nctx = noiseCanvas.getContext('2d');
    const imgData = nctx.createImageData(nSize, nSize);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = 120 + Math.floor(Math.random() * 80);
      imgData.data[i] = val;
      imgData.data[i + 1] = val - 10;
      imgData.data[i + 2] = val - 20;
      imgData.data[i + 3] = 45; // subtle alpha
    }
    nctx.putImageData(imgData, 0, 0);
  }
  return noiseCanvas;
}

/** The atmosphere as drawing steps: grain tile (multiply), flat tints (multiply / screen), vignette (normal). */
export function atmosphereOps(a) {
  const ops = [];
  if (a.parchmentGrain > 0) ops.push({ type: 'grain', alpha: Math.min(1.0, a.parchmentGrain * 0.45) });
  if (a.sepia > 0) ops.push({ type: 'solid', rgb: [196, 154, 108], alpha: a.sepia * 0.28, blend: 'multiply' });
  if (a.brightness !== undefined && a.brightness !== 1.0) {
    if (a.brightness > 1.0) ops.push({ type: 'solid', rgb: [255, 255, 255], alpha: (a.brightness - 1.0) * 0.4, blend: 'screen' });
    else ops.push({ type: 'solid', rgb: [0, 0, 0], alpha: (1.0 - a.brightness) * 0.6, blend: 'multiply' });
  }
  if (a.tint && a.tintAmount > 0) ops.push({ type: 'solid', rgb: a.tint, alpha: a.tintAmount, blend: a.tintBlend || 'multiply' });
  if (a.weather && a.weatherAmount > 0 && feature('weather')) ops.push({ type: 'weather', kind: a.weather, amount: a.weatherAmount });
  if (a.darkness > 0 && feature('lighting')) ops.push({ type: 'lighting', darkness: a.darkness, lights: a.lights || [], walls: a.walls || [], blocks: a.blocks || [] });
  if (a.vignette > 0) ops.push({ type: 'vignette', vignette: a.vignette });
  return ops;
}

export function drawVignette(ctx, width, height, vignette) {
  const maxDim = Math.max(width, height);
  const grad = ctx.createRadialGradient(width / 2, height / 2, maxDim * 0.28, width / 2, height / 2, maxDim * 0.72);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.7, `rgba(15, 10, 5, ${vignette * 0.45})`);
  grad.addColorStop(1, `rgba(5, 3, 2, ${vignette * 0.95})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function renderAtmosphere(ctx, width, height, atmosphere) {
  ctx.save();
  for (const op of atmosphereOps(atmosphere)) {
    ctx.save();
    if (op.type === 'grain') {
      ctx.globalAlpha = op.alpha;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = ctx.createPattern(getNoiseCanvas(), 'repeat');
      ctx.fillRect(0, 0, width, height);
    } else if (op.type === 'solid') {
      ctx.fillStyle = `rgba(${op.rgb.join(', ')}, ${op.alpha})`;
      ctx.globalCompositeOperation = op.blend;
      ctx.fillRect(0, 0, width, height);
    } else if (op.type === 'weather') {
      feature('weather')?.drawWeather(ctx, width, height, op.kind, op.amount);
    } else if (op.type === 'lighting') {
      feature('lighting')?.drawLighting(ctx, width, height, op);
    } else {
      drawVignette(ctx, width, height, op.vignette);
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Grid snapping helper for battlemaps and tactical alignments */
export function snapToGrid(x, y, grid) {
  if (!grid || !grid.enabled) return { x, y };
  const size = grid.size || 60;
  const offX = grid.offsetX || 0;
  const offY = grid.offsetY || 0;

  if (grid.type === 'square' || grid.type === 'isometric') {
    const snappedX = Math.round((x - offX) / size) * size + offX;
    const snappedY = Math.round((y - offY) / size) * size + offY;
    return { x: snappedX, y: snappedY };
  } else {
    // Hex center snapping
    const h = size * Math.sqrt(3);
    const wStep = size * 1.5;
    const col = Math.round((x - offX) / wStep);
    const rowOffset = col % 2 === 1 ? h / 2 : 0;
    const row = Math.round((y - offY - rowOffset) / h);
    return {
      x: col * wStep + offX,
      y: row * h + rowOffset + offY
    };
  }
}

