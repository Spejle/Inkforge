// VTT export: Universal VTT (.dd2vtt / .uvtt) for Foundry VTT, Roll20 and Fantasy Grounds.
import { maxExportScale, renderExportCanvas, toBlob, download } from '../../../utils/exportUtils.js';
// the light stamps and reach the Dynamic lighting plugin uses, so what you see is what the VTT gets (bundled in a shared
// chunk: exporting lights does not need that plugin installed)
import { isLightStamp, lightRange } from '../lighting/index.js';

export async function exportToUniversalVtt({ mapState, scale = 1, imageFormat = 'png', quality = 0.92, filename = 'battlemap.dd2vtt' }) {
  const { mapWidth, mapHeight, stamps, paths, grid, atmosphere } = mapState;

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
    resolution: {
      map_origin: { x: 0, y: 0 },
      map_size: {
        x: Math.round(mapWidth / gridSize),
        y: Math.round(mapHeight / gridSize)
      },
      pixels_per_grid: Math.round(gridSize * scale)
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

  download(new Blob([JSON.stringify(uvttData)], { type: 'application/json' }), filename);
}
