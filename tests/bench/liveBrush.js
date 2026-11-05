// Live brush benchmark page, driven by tests/bench/runLiveBrush.mjs (also usable by hand from `npm run dev`:
// /tests/bench/liveBrush.html, then call window.bench({...}) in the console).
// It replays a Landmass Sculptor or Biome brush drag through the same calls the editor makes: one renderMap per frame
// with the in-progress stroke as `landStroke` (Canvas 2D view, cache on), then the release (stroke committed, full pass).
import { renderMap } from '../../src/engine/renderer.js';
import { PRESET_MAPS } from '../../src/engine/presetMaps.js';
import { DEFAULT_LAYERS } from '../../src/components/LayersPanel.jsx';

// same defaults as App.jsx
const STROKES = {
  mask: (x, y) => ({ id: 'bench_mask', type: 'mask', mode: 'land', shape: 'rough', roughness: 0.5, size: 60, opacity: 0.85, points: [{ x, y }] }),
  water: (x, y) => ({ id: 'bench_water', type: 'mask', mode: 'water', shape: 'rough', roughness: 0.5, size: 60, opacity: 0.85, points: [{ x, y }] }),
  brush: (x, y) => ({ id: 'bench_brush', type: 'brush', target: 'foreground', biome: 'forest', size: 60, opacity: 0.85, softness: 0.4, blendMode: 'source-over', points: [{ x, y }] }),
  hardbrush: (x, y) => ({ id: 'bench_hard', type: 'brush', target: 'foreground', biome: 'desert', size: 60, opacity: 0.85, softness: 0, blendMode: 'source-over', points: [{ x, y }] })
};

function mapProps(id) {
  const p = PRESET_MAPS.find((m) => m.id === id);
  if (!p) throw new Error('no preset ' + id);
  const layers = { ...DEFAULT_LAYERS, ...(p.layers || {}) };
  return {
    width: p.width, height: p.height, mapType: p.type,
    landmasses: p.landmasses || [], brushStrokes: p.brushStrokes || [], stamps: p.stamps || [], paths: p.paths || [], texts: p.texts || [],
    grid: p.grid, atmosphere: p.atmosphere, coastline: p.coastline,
    layerVisibility: { ...Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.visible])), atmosphere: true },
    layerStyle: layers, memo: new Map()
  };
}

// a pointer move, as CanvasArea.handleMouseMove adds it
function addPoint(stroke, tx, ty) {
  const pts = stroke.points;
  const last = pts[pts.length - 1];
  const dist = Math.hypot(tx - last.x, ty - last.y);
  const step = Math.max(4, Math.floor(stroke.size / 4));
  if (dist > step) {
    const n = Math.min(20, Math.floor(dist / step));
    for (let i = 1; i <= n; i++) pts.push({ x: Math.round(last.x + (tx - last.x) * (i / n)), y: Math.round(last.y + (ty - last.y) * (i / n)) });
  } else pts.push({ x: tx, y: ty });
}

const flush = (ctx) => ctx.getImageData(0, 0, 1, 1); // Canvas 2D defers drawing; a read forces it to finish

window.bench = async ({ map, tool, frames = 30, step = 24, quality = 1, png = false }) => {
  const props = mapProps(map);
  const { width: W, height: H } = props;
  // CanvasArea's Canvas 2D view density
  const dq = Math.max(1, Math.min(quality, Math.sqrt(12e6 / (W * H))));
  document.body.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * dq);
  canvas.height = Math.round(H * dq);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const draw = (extra) => {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    const t0 = performance.now();
    renderMap({ ctx, cache: true, ...props, ...extra });
    flush(ctx);
    return performance.now() - t0;
  };
  const tFirst = draw({});
  draw({}); // warm: everything cached
  // a diagonal drag through the middle of the map, one pointer move per frame
  const x0 = Math.round(W * 0.35), y0 = Math.round(H * 0.4);
  const stroke = STROKES[tool](x0, y0);
  const live = [];
  for (let f = 0; f < frames; f++) {
    if (f) addPoint(stroke, Math.round(x0 + f * step), Math.round(y0 + f * step * 0.45));
    live.push(draw({ landStroke: { ...stroke, points: stroke.points } }));
    await new Promise((r) => setTimeout(r, 0));
  }
  const lastLive = png ? canvas.toDataURL('image/png') : null;
  props.brushStrokes = [...props.brushStrokes, stroke];
  const tRelease = draw({});
  const out = { map, tool, W, H, canvas: [canvas.width, canvas.height], points: stroke.points.length, first: tFirst, release: tRelease, live };
  if (png) { out.final = canvas.toDataURL('image/png'); out.lastLive = lastLive; }
  return out;
};
window.benchReady = true;
