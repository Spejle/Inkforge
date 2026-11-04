// When an autosave must render a fresh library thumbnail. The thumbnail is a full map render, so autosave reuses the last
// one for a while, but only for the same map: a thumbnail taken of another map must never be written into this one's entry.
export const THUMB_EVERY_MS = 30000;

/** prev: { id, at } of the last thumbnail taken; force: the caller wants a fresh one (leaving to the menu, a new map). */
export function thumbDue(prev, id, now, force = false) {
  return !!force || !prev || prev.id !== id || now - prev.at > THUMB_EVERY_MS;
}
