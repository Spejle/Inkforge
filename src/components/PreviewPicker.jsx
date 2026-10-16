import React, { useEffect, useRef } from 'react';
import './previews.css';
import { BIOMES } from '../engine/biomesCatalog.js';
import {
  drawBiomePreview,
  drawBrushPreview,
  drawMaskShapePreview,
  drawBlendPreview,
  drawGridTypePreview
} from '../utils/previews.js';

// Module-level thumbnail cache so re-renders across components never redraw
const thumbnailCache = new Map();

/**
 * Thumbnail canvas sub-component that draws once via useEffect and caches into thumbnailCache.
 */
function ThumbnailCanvas({ draw, width, height, cacheKey }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !draw) return;

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const cw = Math.round(width * dpr);
    const ch = Math.round(height * dpr);

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const key = `${cacheKey || ''}@${width}x${height}@${dpr}`;
    if (thumbnailCache.has(key)) {
      const cached = thumbnailCache.get(key);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(cached, 0, 0);
      return;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    draw(ctx, width, height);
    ctx.restore();

    if (typeof document !== 'undefined') {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = cw;
        offscreen.height = ch;
        const octx = offscreen.getContext('2d');
        if (octx) {
          octx.drawImage(canvas, 0, 0);
          thumbnailCache.set(key, offscreen);
        }
      } catch {
        // Silently skip caching if offscreen creation fails
      }
    }
  }, [draw, width, height, cacheKey]);

  return <canvas ref={canvasRef} className="preview-picker-canvas" />;
}

/**
 * Generic accessible visual picker component.
 * @param {object} props
 * @param {Array<{value: string, label: string, draw?: Function, text?: string, fontFamily?: string}>} props.options
 * @param {string} props.value Currently selected value
 * @param {(value: string) => void} props.onChange Selection callback
 * @param {number} [props.columns=3] Grid column count
 * @param {number} [props.thumbW=64] Thumbnail width
 * @param {number} [props.thumbH=44] Thumbnail height
 * @param {string} [props.label] Optional accessible label/title
 */
export function PreviewPicker({
  options = [],
  value,
  onChange,
  columns = 3,
  thumbW = 64,
  thumbH = 44,
  label
}) {
  const buttonRefs = useRef([]);

  // Find index of currently selected item or match aliases (e.g. circle / round)
  const selectedIndex = options.findIndex((opt) => {
    if (opt.value === value) return true;
    if ((opt.value === 'circle' && value === 'round') || (opt.value === 'round' && value === 'circle')) {
      return true;
    }
    return false;
  });

  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const handleKeyDown = (e, index) => {
    const count = options.length;
    if (count === 0) return;

    let targetIndex = null;

    switch (e.key) {
      case 'ArrowRight':
        targetIndex = (index + 1) % count;
        break;
      case 'ArrowLeft':
        targetIndex = (index - 1 + count) % count;
        break;
      case 'ArrowDown':
        targetIndex = (index + columns) % count;
        break;
      case 'ArrowUp':
        targetIndex = (index - columns + count) % count;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = count - 1;
        break;
      default:
        return;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      const nextOpt = options[targetIndex];
      if (nextOpt) {
        onChange?.(nextOpt.value);
        buttonRefs.current[targetIndex]?.focus();
      }
    }
  };

  return (
    <div className="preview-picker-wrapper">
      {label && <span className="preview-picker-label">{label}</span>}
      <div
        className="preview-picker-grid"
        role="radiogroup"
        aria-label={label || 'Option picker'}
        style={{ '--preview-picker-cols': columns }}
      >
        {options.map((opt, idx) => {
          const isSelected =
            opt.value === value ||
            (opt.value === 'circle' && value === 'round') ||
            (opt.value === 'round' && value === 'circle');

          // Roving tabIndex: only selected (or active fallback) receives focus via tab
          const tabIndex = isSelected ? 0 : (selectedIndex === -1 && idx === 0 ? 0 : -1);

          return (
            <button
              key={opt.value}
              ref={(el) => (buttonRefs.current[idx] = el)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabIndex}
              className={`preview-picker-btn ${isSelected ? 'selected' : ''}`}
              title={opt.label}
              onClick={() => onChange?.(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              <div
                className="preview-picker-thumb-box"
                style={{ width: `${thumbW}px`, height: `${thumbH}px` }}
              >
                {opt.draw ? (
                  <ThumbnailCanvas
                    draw={opt.draw}
                    width={thumbW}
                    height={thumbH}
                    cacheKey={opt.cacheKey || `${opt.value}_${thumbW}x${thumbH}`}
                  />
                ) : opt.text ? (
                  <span
                    className="preview-picker-text-sample"
                    style={{ fontFamily: opt.fontFamily || 'inherit' }}
                  >
                    {opt.text}
                  </span>
                ) : null}
              </div>
              <span className="preview-picker-caption">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ready-made Wrappers
// ---------------------------------------------------------------------------

/**
 * Visual Biome Swatch Picker.
 */
export function BiomePicker({
  biomes = BIOMES,
  value,
  onChange,
  columns = 4,
  thumbW = 56,
  thumbH = 38,
  label = 'Biome'
}) {
  const options = (biomes || BIOMES).map((b) => ({
    value: b.id,
    label: b.name,
    draw: (ctx, w, h) => drawBiomePreview(ctx, w, h, b.id),
    cacheKey: `biome_${b.id}`
  }));

  return (
    <PreviewPicker
      options={options}
      value={value}
      onChange={onChange}
      columns={columns}
      thumbW={thumbW}
      thumbH={thumbH}
      label={label}
    />
  );
}

/**
 * Visual Font Picker displaying text sample in each typeface.
 */
export function FontPicker({
  value,
  onChange,
  columns = 1,
  thumbW = 140,
  thumbH = 34,
  label = 'Font'
}) {
  const fontList = [
    { value: 'Cinzel', label: 'Cinzel (Regal)', fontFamily: 'Cinzel' },
    { value: 'MedievalSharp', label: 'MedievalSharp', fontFamily: 'MedievalSharp' },
    { value: 'Pirata One', label: 'Pirata One (Gothic)', fontFamily: 'Pirata One' },
    { value: 'Uncial Antiqua', label: 'Uncial Antiqua', fontFamily: 'Uncial Antiqua' },
    { value: 'Inter', label: 'Inter (Sans)', fontFamily: 'Inter' }
  ];

  const options = fontList.map((f) => ({
    value: f.value,
    label: f.label,
    text: 'Aa Ravenford',
    fontFamily: f.fontFamily
  }));

  return (
    <PreviewPicker
      options={options}
      value={value}
      onChange={onChange}
      columns={columns}
      thumbW={thumbW}
      thumbH={thumbH}
      label={label}
    />
  );
}

/**
 * Visual Blend Mode Picker with dual overlapping discs.
 */
export function BlendPicker({
  value,
  onChange,
  columns = 2,
  thumbW = 64,
  thumbH = 40,
  label = 'Blend Mode'
}) {
  const blends = [
    { value: 'source-over', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'soft-light', label: 'Soft Light' }
  ];

  const options = blends.map((b) => ({
    value: b.value,
    label: b.label,
    draw: (ctx, w, h) => drawBlendPreview(ctx, w, h, b.value),
    cacheKey: `blend_${b.value}`
  }));

  return (
    <PreviewPicker
      options={options}
      value={value}
      onChange={onChange}
      columns={columns}
      thumbW={thumbW}
      thumbH={thumbH}
      label={label}
    />
  );
}

/**
 * Visual Grid Type Picker displaying miniature grid cells.
 */
export function GridTypePicker({
  value,
  onChange,
  columns = 2,
  thumbW = 64,
  thumbH = 40,
  label = 'Grid Type'
}) {
  const gridTypes = [
    { value: 'square', label: 'Square' },
    { value: 'hex_flat', label: 'Flat Hex' },
    { value: 'hex_pointy', label: 'Pointy Hex' },
    { value: 'isometric', label: 'Isometric' }
  ];

  const options = gridTypes.map((g) => ({
    value: g.value,
    label: g.label,
    draw: (ctx, w, h) => drawGridTypePreview(ctx, w, h, g.value),
    cacheKey: `grid_${g.value}`
  }));

  return (
    <PreviewPicker
      options={options}
      value={value}
      onChange={onChange}
      columns={columns}
      thumbW={thumbW}
      thumbH={thumbH}
      label={label}
    />
  );
}

/**
 * Visual Mask Shape Picker for Landmass Sculptor brush.
 */
export function MaskShapePicker({
  value,
  onChange,
  roughness = 0.6,
  mode = 'land',
  columns = 2,
  thumbW = 64,
  thumbH = 40,
  label = 'Mask Shape'
}) {
  const shapes = [
    { value: 'circle', label: 'Circle', shape: 'round' },
    { value: 'rough', label: 'Rough Edgy', shape: 'rough' }
  ];

  const options = shapes.map((s) => ({
    value: s.value,
    label: s.label,
    draw: (ctx, w, h) => drawMaskShapePreview(ctx, w, h, { shape: s.shape, roughness, mode }),
    cacheKey: `mask_${s.value}_${roughness}_${mode}`
  }));

  return (
    <PreviewPicker
      options={options}
      value={value}
      onChange={onChange}
      columns={columns}
      thumbW={thumbW}
      thumbH={thumbH}
      label={label}
    />
  );
}

/**
 * Live brush preview banner showing current brush stroke.
 */
export function BrushPreview({
  biomeId = 'grassland',
  size = 40,
  softness = 0.4,
  opacity = 0.85,
  blend = 'source-over',
  width = 120,
  height = 44,
  className = ''
}) {
  const draw = (ctx, w, h) => {
    drawBrushPreview(ctx, w, h, { biomeId, size, softness, opacity, blend });
  };

  const cacheKey = `brush_${biomeId}_${size}_${softness}_${opacity}_${blend}`;

  return (
    <div className={`brush-preview-card ${className}`}>
      <ThumbnailCanvas
        draw={draw}
        width={width}
        height={height}
        cacheKey={cacheKey}
      />
    </div>
  );
}

export default PreviewPicker;
