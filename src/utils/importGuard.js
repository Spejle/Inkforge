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

const isLoadedImage = (v) => typeof HTMLImageElement !== 'undefined' && v instanceof HTMLImageElement && !v.src.startsWith('http');

/** Shallow copy of a parsed project with the dangerous parts normalised. */
export function sanitizeProject(d) {
  const p = d && typeof d === 'object' ? d : {};
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);
  return {
    ...p,
    width: clampDim(p.width, 1920),
    height: clampDim(p.height, 1080),
    landmasses: list(p.landmasses),
    brushStrokes: list(p.brushStrokes),
    paths: list(p.paths),
    texts: list(p.texts),
    stamps: list(p.stamps).map((s) => ({ ...s, customImage: safeImageSrc(s.customImage) || (isLoadedImage(s.customImage) ? s.customImage : null) })),
    customStamps: list(p.customStamps).filter((c) => safeImageSrc(c.dataUrl))
  };
}
