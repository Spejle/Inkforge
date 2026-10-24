// Export and Import utilities for InkForge
import { sanitizeProject } from './importGuard.js';
import { renderMap } from '../engine/renderer.js';

export const IMAGE_FORMATS = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg' };

/** Largest scale the browser can allocate for this map (~16384 px a side, ~270 Mpx; we stay under 190 Mpx). */
export function maxExportScale(mapWidth, mapHeight) {
  return Math.min(16384 / Math.max(mapWidth, mapHeight), Math.sqrt(190e6 / (mapWidth * mapHeight)));
}

/** Render the map onto a fresh canvas at `scale` pixels per map unit. */
export function renderExportCanvas(mapState, { scale = 1, includeGrid = true, atmosphere = mapState.atmosphere } = {}) {
  const { mapWidth, mapHeight } = mapState;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(mapWidth * scale);
  canvas.height = Math.round(mapHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  renderMap({
    ...mapState,
    ctx,
    width: mapWidth,
    height: mapHeight,
    grid: { ...mapState.grid, enabled: includeGrid && mapState.grid.enabled },
    atmosphere,
    selectedStampId: null,
    selectedTextId: null,
    selectedPathId: null
  });
  return canvas;
}

export const toBlob = (canvas, format, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The browser could not encode the image.'))), IMAGE_FORMATS[format], quality));

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** PNG / WebP / JPG export. `quality` (0-1) applies to WebP and JPG; PNG is lossless. */
export async function exportImage({ mapState, format = 'png', quality = 0.92, scale = 1, includeGrid = true, filename }) {
  const canvas = renderExportCanvas(mapState, { scale: Math.min(scale, maxExportScale(mapState.mapWidth, mapState.mapHeight)), includeGrid });
  if (format === 'jpg') {
    // JPG has no alpha; transparent pixels would turn black
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const fctx = flat.getContext('2d');
    fctx.fillStyle = '#fff';
    fctx.fillRect(0, 0, flat.width, flat.height);
    fctx.drawImage(canvas, 0, 0);
    return download(await toBlob(flat, format, quality), filename);
  }
  download(await toBlob(canvas, format, quality), filename);
}

/** Project serialization (.inkforge JSON format v1.1.0) */
export function exportToJson(mapData, filename = 'fantasy_map_project.inkforge') {
  // Convert any image stamp objects to serializable dataUrls
  const serializedStamps = (mapData.stamps || []).map((s) => {
    if (s.customImage && s.customImage.src) {
      return { ...s, customImage: s.customImage.src };
    }
    return s;
  });

  const payload = {
    version: '1.1.0',
    app: 'InkForge',
    savedAt: new Date().toISOString(),
    ...mapData,
    stamps: serializedStamps
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/** Project deserialization with image hydration */
export function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = sanitizeProject(JSON.parse(e.target.result));

        // Hydrate custom images
        if (Array.isArray(parsed.stamps)) {
          parsed.stamps = parsed.stamps.map((s) => {
            if (typeof s.customImage === 'string') { // sanitizeProject has already kept only embedded images
              const img = new Image();
              img.src = s.customImage;
              return { ...s, customImage: img };
            }
            return s;
          });
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
