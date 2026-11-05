// Projects come from files other people can send, so nothing in one is trusted: sizes are clamped, lists must be lists,
// and images may only be embedded data (a remote URL would make the viewer's browser contact that server on open).

const SAFE_IMAGE = /^data:image\/(png|jpeg|webp|gif|svg\+xml)[;,]/i;

/** The string when it is an embedded image, otherwise null. */
export function safeImageSrc(v) {
  return typeof v === 'string' && SAFE_IMAGE.test(v) ? v : null;
}

export const MAP_MIN = 64;
export const MAP_MAX = 8000;
export function clampDim(v, fallback) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(MAP_MAX, Math.max(MAP_MIN, n)) : fallback;
}

const finite = (v, lo, hi, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

/** The grid drawing loops step by `size`: zero, negative or tiny sizes would never finish. Not an object: dropped. */
function sanitizeGrid(g) {
  if (!g || typeof g !== 'object' || Array.isArray(g)) return undefined;
  return {
    ...g,
    enabled: !!g.enabled,
    size: finite(g.size, 16, 1000, 60),
    opacity: finite(g.opacity, 0, 1, 0.15),
    offsetX: finite(g.offsetX, -MAP_MAX, MAP_MAX, 0),
    offsetY: finite(g.offsetY, -MAP_MAX, MAP_MAX, 0),
    color: typeof g.color === 'string' ? g.color.slice(0, 64) : undefined
  };
}

// The renderer and the editing tools index these directly, so one bad entry would crash the whole editor.
const isPair = (pt) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1]); // landmasses, paths
const isXY = (pt) => !!pt && typeof pt === 'object' && Number.isFinite(pt.x) && Number.isFinite(pt.y); // brush strokes
const withPoints = (o, ok) => (o.points === undefined ? o : { ...o, points: Array.isArray(o.points) ? o.points.filter(ok) : [] });

// Fields shown as text in the UI (title on the main menu, labels, layer and object names). React throws on an object
// child, and the main menu shows every map's title, so one bad title would blank the app on every start.
const str = (v, max = 1000) => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' && Number.isFinite(v) ? String(v) : undefined);
const PATH_TYPES = ['river', 'road', 'wall'];

/** Layer settings by key; custom layers carry a name. Entries that are not objects are dropped. */
function sanitizeLayers(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out = {};
  for (const [k, l] of Object.entries(v)) {
    if (!l || typeof l !== 'object' || Array.isArray(l)) continue;
    const name = str(l.name, 80);
    const { name: _drop, ...rest } = l;
    out[k] = name === undefined ? rest : { ...rest, name };
  }
  return out;
}

/** A library meta record as the main menu shows it. */
export function sanitizeMeta(m) {
  const o = m && typeof m === 'object' ? m : {};
  return {
    ...o,
    title: str(o.title, 200) || 'Untitled map',
    template: str(o.template, 80),
    width: clampDim(o.width, 1920),
    height: clampDim(o.height, 1080),
    updated: Number.isFinite(o.updated) ? o.updated : 0,
    thumb: safeImageSrc(o.thumb)
  };
}

const isLoadedImage = (v) => typeof HTMLImageElement !== 'undefined' && v instanceof HTMLImageElement && !v.src.startsWith('http');

/** Shallow copy of a parsed project with the dangerous parts normalised. */
export function sanitizeProject(d) {
  const p = d && typeof d === 'object' ? d : {};
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);
  return {
    ...p,
    title: str(p.title, 200),
    template: str(p.template, 80),
    type: str(p.type, 80),
    layers: sanitizeLayers(p.layers),
    width: clampDim(p.width, 1920),
    grid: sanitizeGrid(p.grid),
    height: clampDim(p.height, 1080),
    landmasses: list(p.landmasses).map((l) => withPoints(l, isPair)),
    brushStrokes: list(p.brushStrokes).map((b) => {
      const out = withPoints(b, isXY);
      return out.runs === undefined || Array.isArray(out.runs) ? out : { ...out, runs: [] };
    }),
    paths: list(p.paths).map((x) => (x.points === undefined || PATH_TYPES.includes(x.type) ? withPoints(x, isPair) : { ...withPoints(x, isPair), type: 'road' })),
    texts: list(p.texts).map((t) => ({ ...t, text: str(t.text, 5000) ?? '' })),
    stamps: list(p.stamps).map((s) => ({ ...s, customImage: safeImageSrc(s.customImage) || (isLoadedImage(s.customImage) ? s.customImage : null) })),
    customStamps: list(p.customStamps).filter((c) => safeImageSrc(c.dataUrl))
  };
}
