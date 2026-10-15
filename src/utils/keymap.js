// Rebindable keyboard shortcuts. A binding is a combo string such as 'V', '[' or 'Ctrl+Shift+Z'; an action has a list of them.

export const ACTIONS = [
  { id: 'tool.select', label: 'Select & Transform', group: 'Tools', keys: ['V'] },
  { id: 'tool.mask', label: 'Landmass Sculptor', group: 'Tools', keys: ['M'] },
  { id: 'tool.brush', label: 'Biome & Texture', group: 'Tools', keys: ['B'] },
  { id: 'tool.stamp', label: 'Stamps & Props', group: 'Tools', keys: ['S'] },
  { id: 'tool.path', label: 'Rivers & Paths', group: 'Tools', keys: ['P'] },
  { id: 'tool.text', label: 'Text & Banners', group: 'Tools', keys: ['T'] },
  { id: 'tool.grid', label: 'Grid & Alignment', group: 'Tools', keys: ['G'] },
  { id: 'tool.atmosphere', label: 'Atmosphere & Light', group: 'Tools', keys: ['A'] },
  { id: 'tool.eraser', label: 'Eraser', group: 'Tools', keys: ['E'] },
  { id: 'tool.hand', label: 'Pan Canvas', group: 'Tools', keys: ['H'] },
  { id: 'mask.swap', label: 'Swap Add Land / Carve Water', group: 'Painting', keys: ['X'] },
  // Shift turns these into 1 degree steps (fine: true); , and . are there because [ and ] need AltGr on many layouts
  { id: 'stamp.rotateCw', label: 'Rotate selected stamp clockwise', group: 'Selection', keys: [']', '.'], fine: true },
  { id: 'stamp.rotateCcw', label: 'Rotate selected stamp counter-clockwise', group: 'Selection', keys: ['[', ','], fine: true },
  { id: 'edit.undo', label: 'Undo', group: 'Edit', keys: ['Ctrl+Z'] },
  { id: 'edit.redo', label: 'Redo', group: 'Edit', keys: ['Ctrl+Shift+Z', 'Ctrl+Y'] },
  { id: 'edit.delete', label: 'Delete selection', group: 'Edit', keys: ['Delete', 'Backspace'] }
];

const KEY = 'inkforge-keys';
const MODIFIER_KEYS = ['Control', 'Shift', 'Alt', 'Meta', 'AltGraph', 'OS'];
// physical keys that produce punctuation: named by what they type on a US layout, so Shift+[ stays '[' with Shift
const CODE_KEYS = { BracketLeft: '[', BracketRight: ']', Comma: ',', Period: '.', Minus: '-', Equal: '=', Slash: '/', Backslash: '\\', Semicolon: ';', Quote: "'", Backquote: '`' };

/** The combo string for a keydown event, or null while only a modifier is held. */
export function comboOf(e) {
  if (!e || MODIFIER_KEYS.includes(e.key)) return null;
  // AltGr reports Ctrl+Alt on Windows: the character it typed ('[' on a Czech layout) is the key, not a chord
  const altGr = typeof e.getModifierState === 'function' && e.getModifierState('AltGraph');
  const ctrl = (e.ctrlKey || e.metaKey) && !altGr;
  const alt = e.altKey && !altGr;
  const code = e.code || '';
  let key;
  if (!altGr && CODE_KEYS[code]) key = CODE_KEYS[code];
  else if (!altGr && /^Digit\d$/.test(code)) key = code.slice(5);
  else if (e.key === ' ') key = 'Space';
  else if (e.key === 'Escape') key = 'Esc';
  else if (e.key.length === 1) key = e.key.toUpperCase();
  else key = e.key; // Delete, Backspace, ArrowLeft, F2 ...
  return [ctrl && 'Ctrl', alt && 'Alt', e.shiftKey && 'Shift', key].filter(Boolean).join('+');
}

export function defaultKeymap() {
  return Object.fromEntries(ACTIONS.map((a) => [a.id, [...a.keys]]));
}

/** Saved bindings over the defaults; anything malformed in storage is ignored. */
export function loadKeymap() {
  const map = defaultKeymap();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const id of Object.keys(map)) {
      if (Array.isArray(saved[id]) && saved[id].every((k) => typeof k === 'string' && k.length < 40)) map[id] = saved[id];
    }
  } catch { /* storage blocked or corrupt: defaults */ }
  return map;
}

export function saveKeymap(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* private mode */ }
}

/**
 * Put `combo` on `id` (replacing slot `index`, or appended when index is -1). A combo lives on one action only, so it is
 * taken away from whichever action had it. Returns the new map and the action it was taken from, if any.
 */
export function bind(map, id, index, combo) {
  const next = {};
  let displaced = null;
  for (const [a, keys] of Object.entries(map)) {
    const kept = keys.filter((k) => k !== combo || a === id);
    if (kept.length !== keys.length) displaced = a;
    next[a] = kept;
  }
  const mine = [...next[id]];
  if (index >= 0 && index < map[id].length) {
    const old = map[id][index];
    const at = mine.indexOf(old);
    if (at >= 0) mine[at] = combo; else mine.push(combo);
  } else mine.push(combo);
  next[id] = [...new Set(mine)];
  return { map: next, displaced };
}

export function unbind(map, id, index) {
  return { ...map, [id]: map[id].filter((_, i) => i !== index) };
}

/** The action a combo triggers: { id, fine }, where fine means a Shift-modified combo of a `fine` action. */
export function actionFor(map, combo) {
  if (!combo) return null;
  for (const [id, keys] of Object.entries(map)) if (keys.includes(combo)) return { id, fine: false };
  if (combo.includes('Shift+')) {
    const plain = combo.replace('Shift+', '');
    for (const a of ACTIONS) if (a.fine && map[a.id].includes(plain)) return { id: a.id, fine: true };
  }
  return null;
}

/** First binding of an action as text for tooltips and badges ('' when unbound). */
export function shortcutOf(map, id) {
  return map[id]?.[0] || '';
}
