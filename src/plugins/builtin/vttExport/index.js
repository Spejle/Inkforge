// VTT export: Universal VTT (.dd2vtt / .uvtt) for Foundry VTT, Roll20 and Fantasy Grounds.
import { maxExportScale, renderExportCanvas, toBlob, download } from '../../../utils/exportUtils.js';
// the light stamps and reach the Dynamic lighting plugin uses, so what you see is what the VTT gets (bundled in a shared
// chunk: exporting lights does not need that plugin installed)
import { isLightStamp, lightRange, blockerOutline } from '../lighting/index.js';
import { getStampById } from '../../../engine/stampsCatalog.js';
import { stampAspect } from '../../../engine/renderer.js';

// Wall-like stamps that become line-of-sight walls in the VTT (doors become portals; furniture and trees stay walkable).
const VTT_WALL_GROUP = /^dungeon_(walls|pillars)$/;

/**
 * Walls, doors and lights in Universal VTT grid units. Coordinates are world grid units (grid lines on integers, so the
 * VTT grid lines up with ours, offset included); `origin` is where the image's top-left corner sits in those units.
 */
export function buildVttGeometry({ stamps = [], paths = [], grid = {} }) {
  const gridSize = grid.size || 60;
  const offX = grid.offsetX || 0, offY = grid.offsetY || 0;
  const n = (v) => Number(v.toFixed(3));
  const pt = (x, y) => ({ x: n((x - offX) / gridSize), y: n((y - offY) / gridSize) });

  const lineOfSight = [];
  for (const w of paths) {
    if (w.type !== 'wall' || !w.points || w.points.length < 2) continue;
    lineOfSight.push(w.points.map(([x, y]) => pt(x, y)));
  }
  // wall and pillar stamps (the Dungeon template's default brush): their traced footprint, the same one that casts shadows
  for (const s of stamps) {
    if (!VTT_WALL_GROUP.test(getStampById(s.stampId)?.group || '')) continue;
    const ring = blockerOutline(s);
    if (ring && ring.length > 1) lineOfSight.push(ring.map(([x, y]) => pt(x, y)));
  }

  // doors: a portal across the door leaf, turned with the stamp
  const portals = [];
  for (const d of stamps) {
    if (!(d.stampId || '').includes('door')) continue;
    const half = (80 * (d.scale || 1) * stampAspect(d)) / 2;
    const rot = d.rotation || 0;
    const dx = Math.cos(rot) * half, dy = Math.sin(rot) * half;
    portals.push({
      position: pt(d.x, d.y),
      bounds: [pt(d.x - dx, d.y - dy), pt(d.x + dx, d.y + dy)],
      rotation: n(rot),
      closed: true,
      freestanding: false
    });
  }

  const lights = stamps.filter(isLightStamp).map((l) => ({
    position: pt(l.x, l.y),
    range: Number((lightRange(l, grid) / gridSize).toFixed(2)),
    intensity: 0.8,
    color: 'ffff9933',
    shadows: true
  }));

  return { lineOfSight, portals, lights, origin: { x: n(-offX / gridSize), y: n(-offY / gridSize) } };
}

/**
 * The `resolution` block for an image of imgW x imgH px. Universal VTT importers size the scene as map_size *
 * pixels_per_grid, so map_size must match the image exactly (fractional when the map is not a whole number of cells):
 * rounding it stretched the image against the walls.
 */
export function vttResolution(imgW, imgH, gridSize, scale, origin) {
  const ppg = Math.max(1, Math.round(gridSize * scale));
  return { map_origin: origin, map_size: { x: Number((imgW / ppg).toFixed(4)), y: Number((imgH / ppg).toFixed(4)) }, pixels_per_grid: ppg };
}

export async function exportToUniversalVtt({ mapState, scale = 1, imageFormat = 'png', quality = 0.92, filename = 'battlemap.dd2vtt' }) {
  const { mapWidth, mapHeight, stamps, paths, grid, atmosphere } = mapState;
  const gridSize = grid.size || 60;
  const { lineOfSight, portals, lights, origin } = buildVttGeometry({ stamps, paths, grid });

  // clean ungridded base image; the VTT does the darkness itself, from the lights above
  scale = Math.min(scale, maxExportScale(mapWidth, mapHeight));
  const vttCanvas = renderExportCanvas(mapState, { scale, includeGrid: false, atmosphere: { ...atmosphere, darkness: 0 } });
  const imgBlob = await toBlob(vttCanvas, imageFormat, quality);
  const base64Data = await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.readAsDataURL(imgBlob);
  });

  const uvttData = {
    format: 0.3,
    resolution: vttResolution(vttCanvas.width, vttCanvas.height, gridSize, scale, origin),
    line_of_sight: lineOfSight,
    portals: portals,
    environment: {
      baked_lighting: true,
      ambient_light: 'ffffffff'
    },
    lights: lights,
    image: base64Data
  };

  download(new Blob([JSON.stringify(uvttData)], { type: 'application/json' }), filename);
}
