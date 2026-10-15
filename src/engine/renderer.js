// InkForge Rendering Pipeline — High Performance Canvas 2D Engine
import { getStampById } from './stampsCatalog.js';
import { getBiomePattern } from './biomesCatalog.js';

// Cache for static background & noise buffers
let backgroundCache = null;
let lastBgKey = '';
let noisePatternCache = null;

// Custom stamp images: decoded once per data URL, never written back onto the stamp.
// The canvas repaints via onImageLoad when a still-loading image arrives.
const imageCache = new Map();
const watched = new WeakSet();
let imageLoadHandler = null;
export function onImageLoad(fn) {
  imageLoadHandler = fn;
}
function stampImage(src) {
  let img = typeof src === 'string' ? imageCache.get(src) : src;
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  if (!img.complete && !watched.has(img)) {
    watched.add(img);
    img.addEventListener('load', () => imageLoadHandler && imageLoadHandler(), { once: true });
  }
  return img.complete && img.naturalWidth ? img : null;
}

/**
 * Main draw loop: renders the composite map into destination canvas.
 */
/** Width / height of a placed stamp: its own (custom uploads) or the catalogue definition's. */
export function stampAspect(s) {
  return s.aspect || getStampById(s.stampId)?.aspect || 1.0;
}

export function renderMap({
  ctx,
  width,
  height,
  mapType = 'world',
  landmasses = [],
  brushStrokes = [], // freehand land & texture strokes
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
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const st = (k) => layerStyle[k];

  // 1. BASE BACKGROUND (Ocean or Dungeon Void)
  if (layerVisibility.background) {
    layerPass(ctx, st('background'), (c) => {
      if (mapType === 'world') renderOceanBackground(c, width, height);
      else renderDungeonVoid(c, width, height);
    });
  }

  // 2. LANDMASSES & TERRAIN SCULPTING (True Dual-Layer Masking + Dynamic Coastlines)
  if (layerVisibility.land) {
    layerPass(ctx, st('land'), (c) => landLayer(c, width, height, landmasses, brushStrokes, mapType, coastline));
  }

  // objects belong to a custom layer when `layer` names one that still exists; otherwise to their built-in layer
  const onLayer = (key) => (o) => o.layer === key;
  const onBase = (o) => !o.layer || !layerStyle[o.layer];
  const customKeys = Object.keys(layerStyle).filter((k) => k.startsWith('c_'));

  // 3. PATHS, RIVERS & WALLS
  if (layerVisibility.paths) {
    layerPass(ctx, st('paths'), (c) => renderPaths(c, paths.filter(onBase), selectedPathId));
  }

  // 4. STAMPS (Y-Sorted for proper isometric depth)
  if (layerVisibility.stamps) {
    layerPass(ctx, st('stamps'), (c) => renderStamps(c, stamps.filter(onBase), selectedStampId));
  }

  // 4b. CUSTOM LAYERS, bottom to top: each draws its own paths, stamps and labels
  for (const key of customKeys) {
    if (layerVisibility[key] === false) continue;
    layerPass(ctx, st(key), (c) => {
      renderPaths(c, paths.filter(onLayer(key)), selectedPathId);
      renderStamps(c, stamps.filter(onLayer(key)), selectedStampId);
      renderTexts(c, texts.filter(onLayer(key)), selectedTextId);
    });
  }

  // 5. ATMOSPHERE POST-PROCESSING (Applies to world art before text/grid overlays)
  if (layerVisibility.atmosphere) {
    renderAtmosphere(ctx, width, height, atmosphere);
  }

  // 6. TEXT LABELS & BANNERS (With curved arc projection)
  if (layerVisibility.text) {
    layerPass(ctx, st('text'), (c) => renderTexts(c, texts.filter(onBase), selectedTextId));
  }

  // 7. GRID OVERLAY (Square, Hex, Isometric)
  if (layerVisibility.grid && grid.enabled) {
    layerPass(ctx, st('grid'), (c) => renderGrid(c, width, height, grid));
  }

  ctx.restore();
}

// The land pass (mask, ripples, terrain, sand, outline) is the expensive one and does not change while
// stamps, paths or labels are being dragged, so keep its last result keyed by the state it was built from.
let landCache = null;
function landLayer(c, width, height, landmasses, brushStrokes, mapType, coastline) {
  // only the 1:1 preview is cached; scaled exports render directly so they stay sharp
  if (c.getTransform().a !== 1) return renderLandmasses(c, width, height, landmasses, brushStrokes, mapType, coastline);
  const k = landCache;
  if (!(k && k.landmasses === landmasses && k.brushStrokes === brushStrokes && k.coastline === coastline &&
        k.mapType === mapType && k.width === width && k.height === height)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    renderLandmasses(canvas.getContext('2d'), width, height, landmasses, brushStrokes, mapType, coastline);
    landCache = { landmasses, brushStrokes, coastline, mapType, width, height, canvas };
  }
  c.drawImage(landCache.canvas, 0, 0);
}

/**
 * Draws one layer through an offscreen buffer when it has non-default opacity or blend,
 * so passes that set their own globalAlpha still honour the layer setting.
 */
function layerPass(ctx, style, draw) {
  const opacity = style?.opacity ?? 1;
  const blend = style?.blend || 'source-over';
  if (opacity >= 1 && blend === 'source-over') return draw(ctx);
  const off = document.createElement('canvas');
  off.width = ctx.canvas.width;
  off.height = ctx.canvas.height;
  const octx = off.getContext('2d');
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
  const bgKey = `${width}x${height}`;
  if (!backgroundCache || lastBgKey !== bgKey) {
    backgroundCache = document.createElement('canvas');
    backgroundCache.width = width;
    backgroundCache.height = height;
    const bctx = backgroundCache.getContext('2d');

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

  ctx.drawImage(backgroundCache, 0, 0);
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
 * Render landmasses with true dual-layer sculpting, coastlines, and beach fringes.
 * Uses an offscreen Land Mask Buffer and an offscreen Terrain Buffer for authentic
 * Inkarnate clipping and non-destructive water carving.
 */
function renderLandmasses(ctx, width, height, landmasses, brushStrokes, mapType, coastline) {
  if ((!landmasses || landmasses.length === 0) && (!brushStrokes || brushStrokes.length === 0)) return;

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

  // 1. Build the Offscreen Land Mask Canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mctx = maskCanvas.getContext('2d');

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

    if (stroke.shape === 'rough') {
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

  // 2. Coastal Ripple Rings (Water-lining) & Shallows Halo
  if (mapType === 'world' && cl.ripplesEnabled) {
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
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();
  }

  // 4a. Draw Background / Water Brush Strokes (Clipped outside land)
  const waterBrushStrokes = (brushStrokes || []).filter(s => s.type === 'brush' && s.target === 'background');
  if (waterBrushStrokes.length > 0) {
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = width;
    waterCanvas.height = height;
    const wctx = waterCanvas.getContext('2d');

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
    wctx.drawImage(maskCanvas, 0, 0);
    wctx.restore();

    ctx.drawImage(waterCanvas, 0, 0);
  }

  // 4b. Build the Offscreen Terrain Buffer (Base Biomes + FG Brush Strokes)
  const terrainCanvas = document.createElement('canvas');
  terrainCanvas.width = width;
  terrainCanvas.height = height;
  const tctx = terrainCanvas.getContext('2d');

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
      const sc = document.createElement('canvas');
      sc.width = Math.max(1, bw);
      sc.height = Math.max(1, bh);
      const sctx = sc.getContext('2d');
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
      tctx.drawImage(sc, minX, minY);
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
  tctx.drawImage(maskCanvas, 0, 0);
  tctx.restore();

  // Draw the clipped terrain onto the destination canvas
  ctx.drawImage(terrainCanvas, 0, 0);

  // 6. Beach / Sand Fringe along the inner coastline of ALL land (presets, added land, carved bays):
  // dilate the water (inverse mask) inward by half the beach width, keep the part that lies on land.
  if (mapType === 'world' && cl.sandEnabled && cl.sandWidth > 0) {
    const water = document.createElement('canvas');
    water.width = width;
    water.height = height;
    const wc = water.getContext('2d');
    wc.fillStyle = '#fff';
    wc.fillRect(0, 0, width, height);
    wc.globalCompositeOperation = 'destination-out';
    wc.drawImage(maskCanvas, 0, 0);
    const sand = document.createElement('canvas');
    sand.width = width;
    sand.height = height;
    const sc = sand.getContext('2d');
    const reach = cl.sandWidth / 2;
    sc.drawImage(water, 0, 0);
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      sc.drawImage(water, Math.cos(ang) * reach, Math.sin(ang) * reach);
    }
    sc.globalCompositeOperation = 'source-in';
    sc.fillStyle = cl.sandColor || '#d4be8d';
    sc.fillRect(0, 0, width, height);
    sc.globalCompositeOperation = 'destination-in';
    sc.drawImage(maskCanvas, 0, 0);
    ctx.drawImage(sand, 0, 0);
  }

  // 7. Crisp Ink Coastline Contour: the true edge of the land mask (presets, added land and carved water)
  if (cl.outlineWidth > 0) {
    const ring = document.createElement('canvas');
    ring.width = width;
    ring.height = height;
    const rctx = ring.getContext('2d');
    const reach = cl.outlineWidth;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      rctx.drawImage(maskCanvas, Math.cos(ang) * reach, Math.sin(ang) * reach);
    }
    rctx.globalCompositeOperation = 'source-in';
    rctx.fillStyle = cl.outlineColor || (mapType === 'world' ? '#3d2b1f' : '#1e293b');
    rctx.fillRect(0, 0, width, height);
    rctx.globalCompositeOperation = 'destination-out';
    rctx.drawImage(maskCanvas, 0, 0);
    ctx.drawImage(ring, 0, 0);
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
function renderPaths(ctx, paths, selectedPathId) {
  if (!paths || paths.length === 0) return;

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
function stampSprite(ctx, def, s, size, w, h) {
  const a = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) || 1;
  const k = Math.min(4, Math.max(0.25, 2 ** Math.ceil(Math.log2(a))));
  const key = [s.stampId, Math.round(size), k, s.color, s.fill, s.seed, s.tone, s.hue].join('|');
  let sp = spriteCache.get(key);
  if (sp) {
    spriteCache.delete(key); // refresh LRU order
    spriteCache.set(key, sp);
    return sp;
  }
  const pad = Math.ceil(size * 0.15);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil((w + pad * 2) * k));
  c.height = Math.max(1, Math.ceil((h + pad * 2) * k));
  const g = c.getContext('2d');
  g.scale(k, k);
  g.translate(pad, pad);
  if (s.tone) g.filter = `brightness(${s.tone}) hue-rotate(${s.hue || 0}deg)`; // small canvas: cheap
  def.render(g, size, s.color, s.fill, s.seed);
  sp = { canvas: c, pad };
  spriteCache.set(key, sp);
  if (spriteCache.size > 700) spriteCache.delete(spriteCache.keys().next().value);
  return sp;
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

    // Cartographic 315° Northwest illumination & contact drop shadow
    ctx.shadowColor = 'rgba(20, 15, 10, 0.35)';
    ctx.shadowBlur = Math.max(3, 6 * (s.scale || 1.0));
    ctx.shadowOffsetX = 2 * (s.scale || 1.0);
    ctx.shadowOffsetY = 4 * (s.scale || 1.0);

    // Custom image stamp or procedural vector stamp
    if (s.customImage) {
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

    // Selection box highlight & transform handles
    if (s.id === selectedStampId) {
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
function renderAtmosphere(ctx, width, height, atmosphere) {
  ctx.save();

  // 1. Procedural Parchment Grain noise pattern
  if (atmosphere.parchmentGrain > 0) {
    if (!noisePatternCache) {
      const nSize = 128;
      const nCanvas = document.createElement('canvas');
      nCanvas.width = nSize;
      nCanvas.height = nSize;
      const nctx = nCanvas.getContext('2d');

      const imgData = nctx.createImageData(nSize, nSize);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const val = 120 + Math.floor(Math.random() * 80);
        imgData.data[i] = val;
        imgData.data[i + 1] = val - 10;
        imgData.data[i + 2] = val - 20;
        imgData.data[i + 3] = 45; // subtle alpha
      }
      nctx.putImageData(imgData, 0, 0);
      noisePatternCache = ctx.createPattern(nCanvas, 'repeat');
    }

    if (noisePatternCache) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, atmosphere.parchmentGrain * 0.45);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = noisePatternCache;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  // 2. Sepia Warmth Tint
  if (atmosphere.sepia > 0) {
    ctx.fillStyle = `rgba(196, 154, 108, ${atmosphere.sepia * 0.28})`;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Brightness / Exposure overlay
  if (atmosphere.brightness !== undefined && atmosphere.brightness !== 1.0) {
    if (atmosphere.brightness > 1.0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(atmosphere.brightness - 1.0) * 0.4})`;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = `rgba(0, 0, 0, ${(1.0 - atmosphere.brightness) * 0.6})`;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // 4. Vignette radial gradient
  if (atmosphere.vignette > 0) {
    const maxDim = Math.max(width, height);
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, maxDim * 0.28,
      width / 2, height / 2, maxDim * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, `rgba(15, 10, 5, ${atmosphere.vignette * 0.45})`);
    grad.addColorStop(1, `rgba(5, 3, 2, ${atmosphere.vignette * 0.95})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
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
