// InkForge Rendering Pipeline
import { getStampById } from './stampsCatalog.js';
import { getBiomeById } from './biomesCatalog.js';

/**
 * Main draw loop: renders the composite map into the destination canvas.
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
  grid = { enabled: true, type: 'hex_flat', size: 60, opacity: 0.15, color: '#1e293b' },
  atmosphere = { vignette: 0.4, parchmentGrain: 0.3, sepia: 0.2, brightness: 1.0 },
  selectedStampId = null,
  selectedTextId = null,
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

  // 2. LANDMASSES & TERRAIN
  if (layerVisibility.land) {
    renderLandmasses(ctx, width, height, landmasses, brushStrokes, mapType);
  }

  // 3. PATHS, RIVERS & WALLS
  if (layerVisibility.paths) {
    renderPaths(ctx, paths);
  }

  // 4. STAMPS (Y-Sorted for proper isometric depth)
  if (layerVisibility.stamps) {
    renderStamps(ctx, stamps, selectedStampId);
  }

  // 5. TEXT LABELS & BANNERS
  if (layerVisibility.text) {
    renderTexts(ctx, texts, selectedTextId);
  }

  // 6. GRID OVERLAY
  if (layerVisibility.grid && grid.enabled) {
    renderGrid(ctx, width, height, grid);
  }

  // 7. ATMOSPHERE & POST-PROCESSING
  if (layerVisibility.atmosphere) {
    renderAtmosphere(ctx, width, height, atmosphere);
  }

  ctx.restore();
}

/** Ocean / Sea background with navigational rhumb lines and ripples */
function renderOceanBackground(ctx, width, height) {
  // Gradient ocean base
  const oceanGrad = ctx.createLinearGradient(0, 0, width, height);
  oceanGrad.addColorStop(0, '#2b5175');
  oceanGrad.addColorStop(0.5, '#204060');
  oceanGrad.addColorStop(1, '#18314c');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle wave contour ripples
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1.5;
  const waveSpacing = 70;
  for (let y = 30; y < height; y += waveSpacing) {
    ctx.beginPath();
    for (let x = 0; x < width; x += 120) {
      ctx.moveTo(x + 10, y);
      ctx.quadraticCurveTo(x + 40, y - 6, x + 70, y);
      ctx.quadraticCurveTo(x + 100, y + 6, x + 130, y);
    }
    ctx.stroke();
  }

  // Cartographic Rhumb navigation lines from center
  ctx.strokeStyle = 'rgba(218, 195, 150, 0.045)';
  ctx.lineWidth = 1;
  const cx = width * 0.75;
  const cy = height * 0.35;
  for (let i = 0; i < 16; i++) {
    const ang = (i * Math.PI * 2) / 16;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * width * 1.5, cy + Math.sin(ang) * width * 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

/** Void background for tactical battlemaps */
function renderDungeonVoid(ctx, width, height) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Crosshatch dark pattern
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Render landmasses with coastal rings and sand fringes */
function renderLandmasses(ctx, width, height, landmasses, brushStrokes, mapType) {
  // If no landmasses, return
  if ((!landmasses || landmasses.length === 0) && (!brushStrokes || brushStrokes.length === 0)) return;

  // Pass 1: Coastal ripple rings (only for world maps)
  if (mapType === 'world') {
    ctx.save();
    for (const land of landmasses) {
      if (!land.points || land.points.length < 3) continue;

      // Outer wave ripples
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
      ctx.lineWidth = 10;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  // Pass 3: Landmass Core Fills
  for (const land of landmasses) {
    if (!land.points || land.points.length < 3) continue;
    const biome = getBiomeById(land.biome || 'grassland');

    ctx.save();
    ctx.beginPath();
    drawSmoothPolygon(ctx, land.points);
    ctx.fillStyle = biome.color;
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
      const biome = getBiomeById(stroke.biome || 'grassland');

      ctx.beginPath();
      ctx.strokeStyle = stroke.mode === 'water' ? '#204060' : biome.color;
      ctx.lineWidth = stroke.size || 40;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity || 0.8;

      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 40) / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawSmoothPolygon(ctx, points) {
  if (points.length < 3) return;
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const midX = (curr[0] + next[0]) / 2;
    const midY = (curr[1] + next[1]) / 2;
    ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
  }
  ctx.closePath();
}

/** Render rivers, roads, and walls */
function renderPaths(ctx, paths) {
  if (!paths || paths.length === 0) return;

  for (const path of paths) {
    if (!path.points || path.points.length < 2) continue;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(path.points[0][0], path.points[0][1]);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i][0], path.points[i][1]);
    }

    if (path.type === 'river') {
      // River: outer shoreline banks + inner blue
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = (path.width || 12) + 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = path.color || '#3b82f6';
      ctx.lineWidth = path.width || 12;
      ctx.stroke();
    } else if (path.type === 'road') {
      // Road: dashed or dirt trail
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
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = (path.width || 14) + 6;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = path.width || 14;
      ctx.stroke();
    }

    ctx.restore();
  }
}

/** Render stamps with Y-sorting (stamps behind are drawn before stamps in front) */
function renderStamps(ctx, stamps, selectedStampId) {
  if (!stamps || stamps.length === 0) return;

  // Clone and sort by (zIndex || 0) and then by y position for depth
  const sorted = [...stamps].sort((a, b) => {
    const za = a.zIndex || 0;
    const zb = b.zIndex || 0;
    if (za !== zb) return za - zb;
    return a.y - b.y;
  });

  for (const s of sorted) {
    const def = getStampById(s.stampId);
    if (!def) continue;

    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.rotation) {
      ctx.rotate(s.rotation);
    }
    if (s.flipX || s.flipY) {
      ctx.scale(s.flipX ? -1 : 1, s.flipY ? -1 : 1);
    }

    const baseSize = 80;
    const finalSize = baseSize * (s.scale || 1.0);

    // Custom image stamp or vector stamp
    if (s.customImage) {
      ctx.drawImage(s.customImage, -finalSize / 2, -finalSize / 2, finalSize, finalSize);
    } else if (def.render) {
      // Vector rendered stamp centered at origin
      ctx.translate(-finalSize / 2, -finalSize / 2);
      def.render(ctx, finalSize, s.color, s.fill);
    }

    // Selection box highlight
    if (s.id === selectedStampId) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      if (def.render && !s.customImage) {
        ctx.strokeRect(-4, -4, finalSize + 8, finalSize + 8);
      } else {
        ctx.strokeRect(-finalSize / 2 - 4, -finalSize / 2 - 4, finalSize + 8, finalSize + 8);
      }

      // Corner handles
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-finalSize / 2 - 8, -finalSize / 2 - 8, 8, 8);
      ctx.fillRect(finalSize / 2, -finalSize / 2 - 8, 8, 8);
      ctx.fillRect(-finalSize / 2 - 8, finalSize / 2, 8, 8);
      ctx.fillRect(finalSize / 2, finalSize / 2, 8, 8);
    }

    ctx.restore();
  }
}

/** Render text labels with thick fantasy outline & shadow */
function renderTexts(ctx, texts, selectedTextId) {
  if (!texts || texts.length === 0) return;

  for (const t of texts) {
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.rotation) {
      ctx.rotate(t.rotation);
    }

    ctx.font = `bold ${t.size || 24}px "${t.font || 'Cinzel'}", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(t.text, 2, 3);

    // Thick contrast stroke outline
    if (t.stroke) {
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth = Math.max(3, (t.size || 24) * 0.16);
      ctx.lineJoin = 'round';
      ctx.strokeText(t.text, 0, 0);
    }

    // Main text fill
    ctx.fillStyle = t.color || '#271b12';
    ctx.fillText(t.text, 0, 0);

    // Selection highlight
    if (t.id === selectedTextId) {
      const metrics = ctx.measureText(t.text);
      const textW = metrics.width;
      const textH = (t.size || 24) * 1.2;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-textW / 2 - 8, -textH / 2, textW + 16, textH);
    }

    ctx.restore();
  }
}

/** Render square or hexagonal coordinate grid */
function renderGrid(ctx, width, height, grid) {
  const size = grid.size || 60;
  ctx.save();
  ctx.strokeStyle = grid.color || '#ffffff';
  ctx.globalAlpha = grid.opacity || 0.15;
  ctx.lineWidth = 1.2;

  if (grid.type === 'square') {
    ctx.beginPath();
    for (let x = 0; x <= width; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (grid.type === 'hex_flat' || grid.type === 'hex_pointy') {
    // Hexagonal grid
    const r = size;
    const h = r * Math.sqrt(3);
    const wStep = r * 1.5;
    const hStep = h;

    for (let col = 0; col * wStep < width + r * 2; col++) {
      for (let row = 0; row * hStep < height + h * 2; row++) {
        const cx = col * wStep;
        const cy = row * hStep + (col % 2 === 1 ? hStep / 2 : 0);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + r * Math.cos(angle);
          const hy = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/** Atmospheric post-processing: Vignette and Parchment fibers */
function renderAtmosphere(ctx, width, height, atmosphere) {
  ctx.save();

  // 1. Vignette gradient
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

  // 2. Parchment Warmth / Sepia Tint
  if (atmosphere.sepia > 0) {
    ctx.fillStyle = `rgba(196, 154, 108, ${atmosphere.sepia * 0.25})`;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}
