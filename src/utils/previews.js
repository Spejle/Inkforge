import { BIOMES, getBiomeById, getBiomePattern } from '../engine/biomesCatalog.js';

// ---------------------------------------------------------------------------
// Pure geometry helpers (No DOM / document references - safe for node tests)
// ---------------------------------------------------------------------------

/**
 * Returns the 6 vertices of a regular hexagon.
 * @param {number} cx Center X
 * @param {number} cy Center Y
 * @param {number} r Radius
 * @param {'flat'|'pointy'} orientation Flat-topped or Pointy-topped
 * @returns {Array<[number, number]>} Array of 6 [x, y] coordinates
 */
export function getHexVertices(cx, cy, r, orientation = 'flat') {
  const vertices = [];
  const offset = orientation === 'pointy' ? Math.PI / 6 : 0;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + offset;
    vertices.push([
      cx + r * Math.cos(angle),
      cy + r * Math.sin(angle)
    ]);
  }
  return vertices;
}

/**
 * Generates grid lines or cell polygons matching InkForge renderer.js renderGrid.
 * @param {number} width Canvas width
 * @param {number} height Canvas height
 * @param {'square'|'hex_flat'|'hex_pointy'|'isometric'} type Grid type
 * @param {object} [options] Optional size and offset overrides
 * @returns {Array<Array<[number, number]>>} Array of paths (each path is an array of [x, y] points)
 */
export function getGridLines(width, height, type, options = {}) {
  const lines = [];

  if (type === 'square') {
    const size = options.size || Math.max(10, Math.round(width / 4));
    for (let x = 0; x <= width + 0.1; x += size) {
      lines.push([[x, 0], [x, height]]);
    }
    for (let y = 0; y <= height + 0.1; y += size) {
      lines.push([[0, y], [width, y]]);
    }
  } else if (type === 'isometric') {
    const size = options.size || Math.max(10, Math.round(width / 4));
    const stepX = size * 2;
    for (let x = -height; x <= width + height * 2; x += stepX) {
      lines.push([[x, 0], [x + height * 2, height]]);
      lines.push([[x, 0], [x - height * 2, height]]);
    }
  } else if (type === 'hex_pointy') {
    const r = options.size || Math.max(8, Math.round(height / 3.4));
    const hStep = r * 1.5;
    const wStep = r * Math.sqrt(3);
    for (let row = 0; row * hStep < height + r * 2; row++) {
      for (let col = -1; col * wStep < width + wStep * 2; col++) {
        const cx = col * wStep + (row % 2 === 1 ? wStep / 2 : 0);
        const cy = row * hStep;
        lines.push(getHexVertices(cx, cy, r, 'pointy'));
      }
    }
  } else {
    // hex_flat
    const r = options.size || Math.max(8, Math.round(width / 4.2));
    const h = r * Math.sqrt(3);
    const wStep = r * 1.5;
    const hStep = h;
    for (let col = 0; col * wStep < width + r * 2; col++) {
      for (let row = -1; row * hStep < height + h * 2; row++) {
        const cx = col * wStep;
        const cy = row * hStep + (col % 2 === 1 ? hStep / 2 : 0);
        lines.push(getHexVertices(cx, cy, r, 'flat'));
      }
    }
  }

  return lines;
}

/**
 * Generates rough fractal polygon points for Landmass Sculptor brush dabs.
 * Matches renderer.js drawLandMask rough fractal algorithm.
 * @param {number} cx Center X
 * @param {number} cy Center Y
 * @param {number} r Radius
 * @param {number} [roughness=0.6] Roughness factor
 * @param {number} [numSides=10] Number of polygon vertices
 * @returns {Array<[number, number]>} Array of [x, y] coordinates
 */
export function getRoughPolygonPoints(cx, cy, r, roughness = 0.6, numSides = 10) {
  const points = [];
  const tau = Math.PI * 2;
  for (let i = 0; i < numSides; i++) {
    const a = (tau / numSides) * i;
    const pseudoNoise = (Math.sin(cx * 0.05 + a * 4) * Math.cos(cy * 0.05 + a * 3)) * roughness;
    const rad = r * (1.0 + pseudoNoise * 0.4);
    points.push([
      cx + Math.cos(a) * rad,
      cy + Math.sin(a) * rad
    ]);
  }
  return points;
}

/**
 * Generates wavy stroke points across a thumbnail.
 * @param {number} w Width
 * @param {number} h Height
 * @param {number} [count=24] Number of sample points
 * @param {number} [margin=10] Horizontal margin
 * @returns {Array<{x: number, y: number}>} Array of points
 */
export function getWavyStrokePoints(w, h, count = 24, margin = 10) {
  const points = [];
  const startX = margin;
  const endX = w - margin;
  const midY = h / 2;
  const amp = h * 0.18;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = startX + t * (endX - startX);
    const y = midY + Math.sin(t * Math.PI * 2) * amp;
    points.push({ x, y });
  }

  return points;
}

/**
 * Scales a brush size value into a proportional preview radius for thumbnails.
 * @param {number} size Brush size
 * @param {number} h Thumbnail height
 * @returns {number} Clamped preview radius
 */
export function scaleBrushSizeForPreview(size, h) {
  const s = typeof size === 'number' && !isNaN(size) ? size : 40;
  return Math.max(3, Math.min(h * 0.38, 4 + (s / 240) * (h * 0.3)));
}

/**
 * Path helper for rounded rectangles fallback.
 */
export function drawRoundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Canvas 2D Thumbnail Drawing Helpers
// ---------------------------------------------------------------------------

/**
 * Draws a rounded-rect swatch of a biome using its real procedural pattern (or fallback color).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w Width
 * @param {number} h Height
 * @param {string} biomeId Biome ID (e.g. 'grassland', 'desert')
 */
export function drawBiomePreview(ctx, w, h, biomeId) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  const biome = getBiomeById(biomeId);
  const pad = 2;
  const rw = Math.max(1, w - pad * 2);
  const rh = Math.max(1, h - pad * 2);
  const radius = Math.min(6, rw / 4, rh / 4);

  let fillStyle = biome ? biome.color : '#658d4a';
  if (biomeId && typeof document !== 'undefined') {
    try {
      fillStyle = getBiomePattern(ctx, biomeId) || fillStyle;
    } catch {
      // Fall back to solid biome color
    }
  }

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(pad, pad, rw, rh, radius);
  } else {
    drawRoundRectPath(ctx, pad, pad, rw, rh, radius);
  }

  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a wavy stroke painted like the Biome brush (soft-falloff airbrush dabs).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w Width
 * @param {number} h Height
 * @param {object} opts Brush settings
 * @param {string} [opts.biomeId='grassland'] Biome ID
 * @param {number} [opts.size=40] Brush size
 * @param {number} [opts.softness=0.4] Softness factor (0.0 - 1.0)
 * @param {number} [opts.opacity=0.85] Opacity (0.0 - 1.0)
 * @param {string} [opts.blend='source-over'] Global composite operation
 */
export function drawBrushPreview(ctx, w, h, opts = {}) {
  const {
    biomeId = 'grassland',
    size = 40,
    softness = 0.4,
    opacity = 0.85,
    blend = 'source-over'
  } = opts;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Neutral background with subtle two-tone contrast to highlight opacity & blend mode
  ctx.fillStyle = '#221c17';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#2d251f';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Fine neutral grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 12; x < w; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  const points = getWavyStrokePoints(w, h, 24, 8);
  const r = scaleBrushSizeForPreview(size, h);

  if (softness > 0.05 && typeof document !== 'undefined') {
    // Soft-falloff feathered airbrush dabs using offscreen alpha mask
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const octx = offscreen.getContext('2d');

      if (octx) {
        for (const pt of points) {
          const innerR = Math.max(0, r * (1 - softness));
          const grad = octx.createRadialGradient(pt.x, pt.y, innerR, pt.x, pt.y, r);
          grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          octx.fillStyle = grad;
          octx.beginPath();
          octx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
          octx.fill();
        }

        octx.globalCompositeOperation = 'source-in';
        let pattern = biomeId;
        try {
          pattern = getBiomePattern(octx, biomeId);
        } catch {
          const b = getBiomeById(biomeId);
          pattern = b ? b.color : '#658d4a';
        }
        octx.fillStyle = pattern;
        octx.fillRect(0, 0, w, h);

        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = blend;
        ctx.drawImage(offscreen, 0, 0);
      }
    } catch {
      // Fallback if offscreen canvas throws
    }
  } else {
    // Sharp round stroke
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blend;

    let pattern = biomeId;
    if (typeof document !== 'undefined') {
      try {
        pattern = getBiomePattern(ctx, biomeId);
      } catch {
        const b = getBiomeById(biomeId);
        pattern = b ? b.color : '#658d4a';
      }
    } else {
      const b = getBiomeById(biomeId);
      pattern = b ? b.color : '#658d4a';
    }

    ctx.strokeStyle = pattern;
    ctx.lineWidth = r * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a dab/stroke of the Landmass Sculptor brush on a sea-blue background, land green, with a coastline outline.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w Width
 * @param {number} h Height
 * @param {object} opts Sculptor settings
 * @param {'round'|'circle'|'rough'} [opts.shape='rough'] Mask shape
 * @param {number} [opts.roughness=0.6] Fractal roughness
 * @param {'land'|'water'} [opts.mode='land'] Sculpting mode
 */
export function drawMaskShapePreview(ctx, w, h, opts = {}) {
  const {
    shape = 'rough',
    roughness = 0.6,
    mode = 'land'
  } = opts;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  const seaColor = '#1e3a5f';
  const landColor = '#658d4a';
  const isWaterMode = mode === 'water';

  // Base canvas background
  ctx.fillStyle = isWaterMode ? landColor : seaColor;
  ctx.fillRect(0, 0, w, h);

  const dabFill = isWaterMode ? seaColor : landColor;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;

  ctx.save();
  ctx.beginPath();

  if (shape === 'rough') {
    // Overlapping fractal dabs for a realistic natural landmass sculpt
    const pts1 = getRoughPolygonPoints(cx - w * 0.08, cy, r, roughness, 12);
    const pts2 = getRoughPolygonPoints(cx + w * 0.08, cy, r * 0.9, roughness, 12);

    pts1.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    pts2.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    // Smooth round circle dab
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }

  ctx.fillStyle = dabFill;
  ctx.fill();

  // Coastline outline (outer dark coast line and sand ripple)
  ctx.strokeStyle = '#3d2b1f';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.strokeStyle = '#d4be8d';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Subtle vignette / border outline around the preview thumbnail
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  ctx.restore();
}

/**
 * Draws two overlapping coloured gradient discs on a neutral ground composited with blend mode.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w Width
 * @param {number} h Height
 * @param {'source-over'|'multiply'|'overlay'|'soft-light'} blend Blend mode
 */
export function drawBlendPreview(ctx, w, h, blend = 'source-over') {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Neutral background
  ctx.fillStyle = '#221c17';
  ctx.fillRect(0, 0, w, h);

  // Subtle mid-split to demonstrate background interaction
  ctx.fillStyle = '#2b231d';
  ctx.fillRect(w / 2, 0, w / 2, h);

  const r = Math.min(w, h) * 0.34;
  const cx1 = w * 0.38;
  const cy1 = h * 0.5;
  const cx2 = w * 0.62;
  const cy2 = h * 0.5;

  // Disc 1: Warm amber / ruby radial gradient
  const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r);
  g1.addColorStop(0, '#f59e0b');
  g1.addColorStop(1, '#d9604c');
  ctx.fillStyle = g1;
  ctx.beginPath();
  ctx.arc(cx1, cy1, r, 0, Math.PI * 2);
  ctx.fill();

  // Disc 2: Cool cyan / indigo radial gradient with globalCompositeOperation
  ctx.save();
  ctx.globalCompositeOperation = blend || 'source-over';
  const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
  g2.addColorStop(0, '#38bdf8');
  g2.addColorStop(1, '#6366f1');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  ctx.restore();
}

/**
 * Draws grid lines representing square, hex, or isometric cells.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w Width
 * @param {number} h Height
 * @param {'square'|'hex_flat'|'hex_pointy'|'isometric'} type Grid type
 */
export function drawGridTypePreview(ctx, w, h, type = 'square') {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Dark ground for high legibility
  ctx.fillStyle = '#1c1712';
  ctx.fillRect(0, 0, w, h);

  const lines = getGridLines(w, h, type);

  ctx.beginPath();
  for (const poly of lines) {
    if (!poly || poly.length < 2) continue;
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    if (poly.length > 2) {
      ctx.closePath();
    }
  }

  ctx.strokeStyle = '#e2d5be';
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  ctx.restore();
}
