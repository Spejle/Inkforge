// Feature plugins: first-party code shipped with InkForge, each in its own folder under plugins/builtin/, switched on or
// off in Settings > Plugins. Data packs (registry.js) are separate: they add content, these add behaviour.
import { useSyncExternalStore } from 'react';

// Metadata lives here, not in the plugin folders: the renderer imports the plugins and they import isFeatureOn, so
// pulling the manifests from them would be an import cycle.
export const FEATURES = [
  {
    id: 'maskFill',
    name: 'Mask fill',
    description: 'Bucket fill in the Landmass Sculptor: fill an enclosed area with land, or a landmass with water.',
    defaultOn: true
  },
  {
    id: 'lighting',
    name: 'Dynamic lighting',
    description: 'Darkness slider; campfires and braziers light the map, walls and objects cast soft shadows. Off: darkness is ignored.',
    defaultOn: true
  },
  {
    id: 'riverGen',
    name: 'River generation',
    description: '"Generate on click" in the Rivers & Paths tool: a river flows from the clicked spot to the sea.',
    defaultOn: true
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Rain and snow over the map, set in the Atmosphere tool and by light presets.',
    defaultOn: true
  }
];

const KEY = 'inkforge.features';
let state = (() => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
})();
const subs = new Set();
let version = 0;

export const isFeatureOn = (id) => state[id] ?? FEATURES.find((f) => f.id === id)?.defaultOn ?? false;
export function setFeature(id, on) {
  state = { ...state, [id]: on };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: lasts for the session */ }
  version++;
  subs.forEach((f) => f());
}
const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
/** React hook: true while the feature is on; re-renders when it is toggled. */
export const useFeature = (id) => useSyncExternalStore(subscribe, () => isFeatureOn(id));
export const useFeatureVersion = () => useSyncExternalStore(subscribe, () => version);
