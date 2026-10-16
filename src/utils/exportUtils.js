// Export and Import utilities for InkForge
import { sanitizeProject } from './importGuard.js';
import { renderMap, isLightStamp, lightRange } from '../engine/renderer.js';

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
    atmosphere,
    layerVisibility,
    layerStyle
  } = mapState;

  // browsers cap canvases (~16384 px a side, ~270 Mpx); stay under a safe bound instead of failing silently
  const maxScale = Math.min(16384 / Math.max(mapWidth, mapHeight), Math.sqrt(190e6 / (mapWidth * mapHeight)));
  if (scaleFactor > maxScale) {
    scaleFactor = Math.max(1, Math.floor(maxScale * 100) / 100);
    alert(`Map is too large for that scale; exporting at ${scaleFactor}x instead.`);
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = Math.round(mapWidth * scaleFactor);
  exportCanvas.height = Math.round(mapHeight * scaleFactor);
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
    coastline: mapState.coastline,
    ...(layerVisibility && { layerVisibility }),
    layerStyle,
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
    atmosphere,
    coastline,
    layerVisibility,
    layerStyle
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
      rotation: 0,
      closed: true,
      freestanding: false
    });
  }

  // Extract light sources (braziers, campfires)
  const lights = [];
  const lightStamps = stamps.filter(isLightStamp);
  for (const l of lightStamps) {
    lights.push({
      position: {
        x: Number((l.x / gridSize).toFixed(3)),
        y: Number((l.y / gridSize).toFixed(3))
      },
      range: Number((lightRange(l, grid) / gridSize).toFixed(2)),
      intensity: 0.8,
      color: 'ffff9933',
      shadows: true
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
    atmosphere: { ...atmosphere, darkness: 0 }, // the VTT does the darkness itself, from the lights above
    coastline,
    ...(layerVisibility && { layerVisibility }),
    layerStyle,
    selectedStampId: null,
    selectedTextId: null
  });

  const base64Data = vttCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

  const uvttData = {
    format: 0.3,
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
      ambient_light: 'ffffffff'
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

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Minimal store-only ZIP writer (PNGs are already compressed). files: [{ name, data: Uint8Array }] */
export function buildZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  const u16 = (n) => [n & 255, (n >> 8) & 255];
  const u32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const head = Uint8Array.from([
      0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0)
    ]);
    chunks.push(head, name, f.data);
    central.push(Uint8Array.from([
      0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset)
    ]), name);
    offset += head.length + name.length + f.data.length;
  }
  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = Uint8Array.from([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), 0, 0]);
  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

const toPngBytes = (canvas) =>
  new Promise((resolve) => canvas.toBlob(async (b) => resolve(new Uint8Array(await b.arrayBuffer())), 'image/png'));

/**
 * One transparent PNG per layer (sea, land, rivers, stamps, each custom layer, labels, grid) plus the
 * flattened map, bundled in a ZIP, so the layers can be recombined in an image editor or a VTT.
 */
export async function exportLayersZip({ mapState, scaleFactor = 1, includeGrid = true, filename = 'map_layers.zip' }) {
  const { mapWidth, mapHeight, layerVisibility = {}, layerStyle = {} } = mapState;
  const keys = [
    'background', 'land', 'paths', 'stamps',
    ...Object.keys(layerStyle).filter((k) => k.startsWith('c_')),
    'text', 'grid'
  ];
  const label = (k) => (k.startsWith('c_') ? layerStyle[k]?.name || k : k);
  const render = (visible) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(mapWidth * scaleFactor);
    canvas.height = Math.round(mapHeight * scaleFactor);
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
    renderMap({
      ...mapState,
      ctx,
      width: mapWidth,
      height: mapHeight,
      grid: { ...mapState.grid, enabled: includeGrid && mapState.grid.enabled },
      layerVisibility: visible,
      selectedStampId: null,
      selectedTextId: null,
      selectedPathId: null
    });
    return canvas;
  };
  const files = [{ name: 'flattened.png', data: await toPngBytes(render({ ...layerVisibility, atmosphere: true })) }];
  let n = 1;
  for (const k of keys) {
    if (layerVisibility[k] === false) continue;
    const only = Object.fromEntries(Object.keys(layerVisibility).map((x) => [x, false]));
    only[k] = true;
    files.push({
      name: `${String(n++).padStart(2, '0')}_${label(k).replace(/[^a-zA-Z0-9_-]+/g, '_')}.png`,
      data: await toPngBytes(render(only))
    });
  }
  const url = URL.createObjectURL(buildZip(files));
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}
