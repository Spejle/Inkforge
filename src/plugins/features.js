// Plugin marketplace: first-party feature plugins, each in its own folder under plugins/builtin/ and its own build chunk.
// Nothing here is in the main bundle: installing a plugin downloads its chunk (same origin, so the CSP still allows no
// remote or eval'd script) and remembers the choice. Content packs (registry.js) are separate: they add data, not code.
import { useSyncExternalStore } from 'react';
import { listMaps } from '../utils/autosave.js';

// `load` is a dynamic import, so Vite splits every plugin into a chunk fetched only on install.
export const FEATURES = [
  {
    id: 'lighting',
    name: 'Dynamic lighting',
    kind: 'Look',
    description: 'Darkness slider in the Atmosphere tool; campfires and braziers light the map, walls and objects cast soft shadows.',
    load: () => import('./builtin/lighting/index.js')
  },
  {
    id: 'riverGen',
    name: 'River generation',
    kind: 'Tool',
    description: '"Generate on click" in the Rivers & Paths tool: a river meanders from the clicked spot to the sea.',
    load: () => import('./builtin/riverGen/index.js')
  },
  {
    id: 'weather',
    name: 'Weather',
    kind: 'Look',
    description: 'Rain and snow over the map, set in the Atmosphere tool and by light presets.',
    load: () => import('./builtin/weather/index.js')
  },
  {
    id: 'maskFill',
    name: 'Mask fill',
    kind: 'Tool',
    description: 'Bucket fill in the Landmass Sculptor: fill an enclosed sea with land, or a landmass with water.',
    load: () => import('./builtin/maskFill/index.js')
  },
  {
    id: 'vttExport',
    name: 'VTT export',
    kind: 'Export',
    description: 'Universal VTT (.dd2vtt) for Foundry, Roll20 and Fantasy Grounds, with walls, doors and lights.',
    load: () => import('./builtin/vttExport/index.js')
  },
  {
    id: 'print',
    name: 'Print at table scale',
    kind: 'Export',
    description: 'A PDF tiled across A4, Letter, A3 or poster sheets at 1 inch per square, with cut marks and an assembly guide.',
    load: () => import('./builtin/print/index.js')
  },
  {
    id: 'layersZip',
    name: 'Layers ZIP',
    kind: 'Export',
    description: 'One transparent PNG per layer plus the flattened map, zipped for an image editor or a VTT.',
    load: () => import('./builtin/layersZip/index.js')
  }
];

const KEY = 'inkforge.plugins'; // installed ids
const OLD_KEY = 'inkforge.features'; // 1.13: { id: on } with everything on by default

const read = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : null; } catch { return null; }
};
let installed = read() || [];
const mods = {}; // id -> loaded module
const errors = {}; // id -> message of a failed load
const pending = new Set();
const subs = new Set();
let version = 0;

const bump = () => { version++; subs.forEach((f) => f()); };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(installed)); } catch { /* private mode: lasts for the session */ } };

/** The plugin's module once installed and loaded, else null. Call sites use it as `feature('x')?.fn(...)`. */
export const feature = (id) => mods[id] || null;
export const isFeatureOn = (id) => !!mods[id];
export const isInstalled = (id) => installed.includes(id);
export const isPending = (id) => pending.has(id);
export const loadError = (id) => errors[id] || null;

async function load(id) {
  const f = FEATURES.find((x) => x.id === id);
  if (!f) return;
  pending.add(id);
  delete errors[id];
  bump();
  try {
    mods[id] = await f.load();
  } catch (e) {
    errors[id] = e?.message || 'Could not download the plugin';
  } finally {
    pending.delete(id);
    bump();
  }
}

export async function install(id) {
  if (!installed.includes(id)) installed = [...installed, id];
  save();
  await load(id);
}
export function uninstall(id) {
  installed = installed.filter((x) => x !== id);
  delete mods[id];
  delete errors[id];
  save();
  bump();
}

/** Called once at start-up, before the first render, so maps draw with their plugins from the first frame. */
export async function loadFeatures() {
  if (!read()) {
    // First run of the marketplace. Someone who used 1.13 had every feature on unless they switched it off: keep that.
    let old = null;
    try { old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null'); } catch { /* corrupt: ignore */ }
    let existing = !!old;
    try { existing ||= Object.keys(localStorage).some((k) => k.startsWith('inkforge')); } catch { /* blocked */ }
    if (!existing) existing = (await listMaps().catch(() => [])).length > 0;
    installed = existing ? FEATURES.map((f) => f.id).filter((id) => !old || old[id] !== false) : [];
    save();
  }
  await Promise.all(installed.map(load));
}

const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
/** React hook: true while the plugin is loaded; re-renders when it is installed or removed. */
export const useFeature = (id) => useSyncExternalStore(subscribe, () => isFeatureOn(id));
export const useFeatureVersion = () => useSyncExternalStore(subscribe, () => version);
