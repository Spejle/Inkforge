// InkForge Rendering Pipeline — High Performance Canvas 2D Engine
import { getStampById } from './stampsCatalog.js';
import { getBiomeById, getBiomePattern } from './biomesCatalog.js';

// Cache for static background & noise buffers
let backgroundCache = null;
let lastBgKey = '';
let noisePatternCache = null;

/**
 * Main draw loop: renders the composite map into destination canvas.
 */
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
  selectedStampId = null,
  selectedTextId = null,
  selectedPathId = null,
  layerVisibility = { background: true, land: true, paths: true, stamps: true, text: true, grid: true, atmosphere: true }
}) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. BASE BACKGROUND (Ocean or Dungeon Void)
  if (layerVisibility.background) {
    if (mapType === 'world') {
      renderOceanBackground(ctx, width, height);
    } else {
      renderDungeonVoid(ctx, width, height);
    }
  }

  // 2. LANDMASSES & TERRAIN SCULPTING (True Dual-Layer Masking + Dynamic Coastlines)
  if (layerVisibility.land) {
    renderLandmasses(ctx, width, height, landmasses, brushStrokes, mapType);
  }

  // 3. PATHS, RIVERS & WALLS
  if (layerVisibility.paths) {
    renderPaths(ctx, paths, selectedPathId);
  }

  // 4. STAMPS (Y-Sorted for proper isometric depth)
  if (layerVisibility.stamps) {
    renderStamps(ctx, stamps, selectedStampId);
  }

  // 5. ATMOSPHERE POST-PROCESSING (Applies to world art before text/grid overlays)
  if (layerVisibility.atmosphere) {
    renderAtmosphere(ctx, width, height, atmosphere);
  }

  // 6. TEXT LABELS & BANNERS (With curved arc projection)
  if (layerVisibility.text) {
    renderTexts(ctx, texts, selectedTextId);
  }

  // 7. GRID OVERLAY (Square, Hex, Isometric)
  if (layerVisibility.grid && grid.enabled) {
    renderGrid(ctx, width, height, grid);
  }

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

/** Render landmasses with true dual-layer sculpting, coastlines, and beach fringes */
function renderLandmasses(ctx, width, height, landmasses, brushStrokes, mapType) {
  if ((!landmasses || landmasses.length === 0) && (!brushStrokes || brushStrokes.length === 0)) return;

  // Pass 1: Coastal ripple rings (only for world maps)
  if (mapType === 'world') {
    ctx.save();
    for (const land of landmasses) {
      if (!land.points || land.points.length < 3) continue;

      const rippleDistances = [18, 10, 4];
      const rippleAlphas = [0.08, 0.16, 0.35];

      rippleDistances.forEach((d, idx) => {
        ctx.beginPath();
        drawSmoothPolygon(ctx, land.points);
        ctx.strokeStyle = `rgba(164, 219, 232, ${rippleAlphas[idx]})`;
        ctx.lineWidth = d * 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  // Pass 2: Beach / Sand fringe
  if (mapType === 'world') {
    ctx.save();
    for (const land of landmasses) {
      if (!land.points || land.points.length < 3) continue;
      ctx.beginPath();
      drawSmoothPolygon(ctx, land.points);
      ctx.strokeStyle = '#d4be8d'; // Sand color
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  // Pass 3: Landmass Core Fills
  for (const land of landmasses) {
    if (!land.points || land.points.length < 3) continue;

    ctx.save();
    ctx.beginPath();
    drawSmoothPolygon(ctx, land.points);
    ctx.fillStyle = getBiomePattern(ctx, land.biome || 'grassland');
    ctx.fill();

    // Coastline border line
    ctx.strokeStyle = mapType === 'world' ? '#4a3b2c' : '#1e293b';
    ctx.lineWidth = mapType === 'world' ? 2.5 : 4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  // Pass 4: Freehand Brush Strokes (Terrain sculpting / biomes)
  if (brushStrokes && brushStrokes.length > 0) {
    ctx.save();
    for (const stroke of brushStrokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      const isWater = stroke.mode === 'water';

      ctx.save();
      ctx.globalAlpha = stroke.opacity || 0.85;

      if (isWater) {
        // Water carving mode
        ctx.strokeStyle = mapType === 'world' ? '#204060' : '#0f172a';
        ctx.fillStyle = ctx.strokeStyle;
      } else {
        ctx.strokeStyle = getBiomePattern(ctx, stroke.biome || 'grassland');
        ctx.fillStyle = ctx.strokeStyle;
      }

      ctx.lineWidth = stroke.size || 40;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 40) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        drawSmoothPolyline(ctx, stroke.points.map(p => [p.x, p.y]));
        ctx.stroke();
      }

      // If sculpting new land in world map, add fine coastline edge
      if (stroke.mode === 'land' && mapType === 'world') {
        ctx.strokeStyle = 'rgba(74, 59, 44, 0.3)';
        ctx.lineWidth = (stroke.size || 40) + 4;
        ctx.stroke();
      }

      ctx.restore();
    }
    ctx.restore();
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

    const aspect = (def && def.aspect) ? def.aspect : 1.0;
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
    ctx.translate(-finalW / 2, -finalH / 2);

    // Custom image stamp or procedural vector stamp
    if (s.customImage) {
      if (typeof s.customImage === 'string') {
        // Base64 string fallback
        const img = new Image();
        img.src = s.customImage;
        s.customImage = img; // hydrate for next frame
      }
      if (s.customImage.complete || s.customImage.tagName === 'IMG') {
        ctx.drawImage(s.customImage, 0, 0, finalW, finalH);
      }
    } else if (def && def.render) {
      def.render(ctx, finalSize, s.color, s.fill);
    }

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
      // Arched curved text along circular radius
      const chars = t.text.split('');
      const totalW = ctx.measureText(t.text).width;
      const radius = totalW / (curvature * Math.PI);
      let curX = -totalW / 2;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const charW = ctx.measureText(char).width;
        const charMidX = curX + charW / 2;
        const theta = charMidX / radius;

        ctx.save();
        ctx.rotate(theta);
        ctx.translate(0, -radius);

        // Shadow & Stroke & Fill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
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
        curX += charW;
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
