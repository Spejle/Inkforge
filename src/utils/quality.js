// How many canvas pixels the live view uses per map unit, chosen from the zoom so vector art stays sharp when you zoom in.

const LEVELS = [1, 1.5, 2, 3, 4];

/** Most pixels per map unit the live canvas may use for this map: 36M pixels, 8192 on a side, never above 4. */
export function qualityCap(width, height) {
  return Math.max(1, Math.min(4, Math.sqrt(36e6 / (width * height)), 8192 / width, 8192 / height));
}

/**
 * The quality to use now. `want` is zoom x devicePixelRatio. Rises to the smallest level that is nearly enough, and only
 * falls once the wanted value is under half of the current one, so zooming back and forth does not redraw every time.
 */
export function pickQuality(want, current, width, height) {
  const cap = qualityCap(width, height);
  const target = Math.min(want, cap);
  const next = Math.min(LEVELS.find((l) => l >= target * 0.95) ?? 4, cap);
  if (next > current) return next;
  if (next < current && target < current / 2) return Math.max(1, next);
  return Math.min(current, cap);
}
