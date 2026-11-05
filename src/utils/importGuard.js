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

const isLoadedImage = (v) => typeof HTMLImageElement !== 'undefined' && v instanceof HTMLImageElement && !v.src.startsWith('http');

/** Shallow copy of a parsed project with the dangerous parts normalised. */
export function sanitizeProject(d) {
  const p = d && typeof d === 'object' ? d : {};
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);
  return {
    ...p,
    width: clampDim(p.width, 1920),
    grid: sanitizeGrid(p.grid),
    height: clampDim(p.height, 1080),
    landmasses: list(p.landmasses).map((l) => withPoints(l, isPair)),
    brushStrokes: list(p.brushStrokes).map((b) => {
      const out = withPoints(b, isXY);
      return out.runs === undefined || Array.isArray(out.runs) ? out : { ...out, runs: [] };
    }),
    paths: list(p.paths).map((x) => withPoints(x, isPair)),
    texts: list(p.texts),
    stamps: list(p.stamps).map((s) => ({ ...s, customImage: safeImageSrc(s.customImage) || (isLoadedImage(s.customImage) ? s.customImage : null) })),
    customStamps: list(p.customStamps).filter((c) => safeImageSrc(c.dataUrl))
  };
}
