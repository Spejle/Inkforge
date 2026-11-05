// When an autosave must render a fresh library thumbnail. The thumbnail is a full map render, so autosave reuses the last
// one for a while, but only for the same map: a thumbnail taken of another map must never be written into this one's entry.
export const THUMB_EVERY_MS = 30000;

/** prev: { id, at } of the last thumbnail taken; force: true when the caller wants a fresh one (leaving to the menu, a new
 *  map), 'cached' to reuse this map's thumbnail however old (the page is being hidden: no time for a full render). */
export function thumbDue(prev, id, now, force = false) {
  if (force === 'cached') return !prev || prev.id !== id;
  return !!force || !prev || prev.id !== id || now - prev.at > THUMB_EVERY_MS;
}
