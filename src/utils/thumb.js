import { renderMap } from '../engine/renderer.js';
import { DEFAULT_LAYERS } from '../components/LayersPanel.jsx';

/** Small JPEG data URL of a project, for the main menu. */
export function makeThumb(project, maxW = 420) {
  const s = Math.min(1, maxW / project.width);
  const c = document.createElement('canvas');
  c.width = Math.round(project.width * s);
  c.height = Math.round(project.height * s);
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  const layers = { ...DEFAULT_LAYERS, ...(project.layers || {}) };
  try {
    renderMap({
      ctx, width: project.width, height: project.height, mapType: project.type || 'world',
      landmasses: project.landmasses || [], brushStrokes: project.brushStrokes || [],
      stamps: project.stamps || [], paths: project.paths || [], texts: project.texts || [],
      grid: project.grid, atmosphere: project.atmosphere, coastline: project.coastline,
      layerVisibility: { ...Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.visible])), atmosphere: true },
      layerStyle: layers
    });
  } catch { return null; }
  return c.toDataURL('image/jpeg', 0.72);
}
