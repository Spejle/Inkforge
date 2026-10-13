// Export and Import utilities for InkForge
import { renderMap } from '../engine/renderer.js';

/** Standard 1x PNG download */
export function exportToPng(canvas, filename = 'fantasy_map.png') {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * High-Resolution Multi-Scale PNG Exporter (1x, 2x / 4K, 4x / 8K Print Quality)
 */
export function exportToHighResPng({
  mapState,
  scaleFactor = 1,
  includeGrid = true,
  filename = 'fantasy_map_highres.png'
}) {
  const {
    mapWidth,
    mapHeight,
    mapType,
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts,
    grid,
    atmosphere
  } = mapState;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = mapWidth * scaleFactor;
  exportCanvas.height = mapHeight * scaleFactor;
  const ctx = exportCanvas.getContext('2d');

  ctx.scale(scaleFactor, scaleFactor);

  // Render complete scene
  renderMap({
    ctx,
    width: mapWidth,
    height: mapHeight,
    mapType,
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts,
    grid: { ...grid, enabled: includeGrid && grid.enabled },
    atmosphere,
    selectedStampId: null,
    selectedTextId: null,
    selectedPathId: null
  });

  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Universal VTT (.dd2vtt / .uvtt) Exporter for Foundry VTT, Roll20, and Fantasy Grounds
 */
export function exportToUniversalVtt({ mapState, filename = 'battlemap.dd2vtt' }) {
  const {
    mapWidth,
    mapHeight,
    mapType,
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts,
    grid,
    atmosphere
  } = mapState;

  const gridSize = grid.size || 60;

  // Extract wall lines from paths
  const lineOfSight = [];
  const wallPaths = paths.filter((p) => p.type === 'wall');
  for (const w of wallPaths) {
    if (!w.points || w.points.length < 2) continue;
    const wallSegments = [];
    for (const pt of w.points) {
      wallSegments.push({
        x: Number((pt[0] / gridSize).toFixed(3)),
        y: Number((pt[1] / gridSize).toFixed(3))
      });
    }
    lineOfSight.push(wallSegments);
  }

  // Extract portals (doors)
  const portals = [];
  const doorStamps = stamps.filter((s) => s.stampId.includes('door'));
  for (const d of doorStamps) {
    const half = (d.scale || 1.0) * 0.5;
    portals.push({
      position: {
        x: Number((d.x / gridSize).toFixed(3)),
        y: Number((d.y / gridSize).toFixed(3))
      },
      bounds: [
        { x: Number(((d.x - 30 * half) / gridSize).toFixed(3)), y: Number((d.y / gridSize).toFixed(3)) },
        { x: Number(((d.x + 30 * half) / gridSize).toFixed(3)), y: Number((d.y / gridSize).toFixed(3)) }
      ],
      closed: true,
      freestanding: false
    });
  }

  // Extract light sources (braziers, campfires)
  const lights = [];
  const lightStamps = stamps.filter((s) => s.stampId.includes('campfire') || s.stampId.includes('brazier'));
  for (const l of lightStamps) {
    lights.push({
      position: {
        x: Number((l.x / gridSize).toFixed(3)),
        y: Number((l.y / gridSize).toFixed(3))
      },
      range: 6.0,
      intensity: 0.8,
      color: 'ff9933'
    });
  }

  // Render clean ungridded base image
  const vttCanvas = document.createElement('canvas');
  vttCanvas.width = mapWidth;
  vttCanvas.height = mapHeight;
  const ctx = vttCanvas.getContext('2d');

  renderMap({
    ctx,
    width: mapWidth,
    height: mapHeight,
    mapType,
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts,
    grid: { ...grid, enabled: false },
    atmosphere,
    selectedStampId: null,
    selectedTextId: null
  });

  const base64Data = vttCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

  const uvttData = {
    format: 0.2,
    resolution: {
      map_origin: { x: 0, y: 0 },
      map_size: {
        x: Math.round(mapWidth / gridSize),
        y: Math.round(mapHeight / gridSize)
      },
      pixels_per_grid: gridSize
    },
    line_of_sight: lineOfSight,
    portals: portals,
    environment: {
      baked_lighting: true,
      ambient_light: '#ffffff'
    },
    lights: lights,
    image: base64Data
  };

  const jsonStr = JSON.stringify(uvttData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
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
        const parsed = JSON.parse(e.target.result);

        // Hydrate custom images
        if (Array.isArray(parsed.stamps)) {
          parsed.stamps = parsed.stamps.map((s) => {
            if (typeof s.customImage === 'string' && s.customImage.startsWith('data:')) {
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
