// Installed plugin packs: persisted in IndexedDB (the existing "inkforge" db, "kv" store), merged into the live catalogs.
import { validatePack } from './schema.js';
import { makeRender, preloadImage } from './vectorRender.js';
import { syncPluginStamps } from '../engine/stampsCatalog.js';
import { syncPluginBiomes } from '../engine/biomesCatalog.js';
import pkg from '../../package.json';
import { useSyncExternalStore } from 'react';

const KEY = 'plugins';
let installed = []; // [{ pack, enabled }]
let version = 0;
const subs = new Set();

export const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
export const getVersion = () => version;
export const listPacks = () => installed.map((e) => ({ ...e }));

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('inkforge', 2);
    req.onupgradeneeded = () => {
      for (const n of ['kv', 'projects', 'meta']) if (!req.result.objectStoreNames.contains(n)) req.result.createObjectStore(n);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function persist() {
  try {
    const db = await open();
    db.transaction('kv', 'readwrite').objectStore('kv').put(installed, KEY);
  } catch { /* private mode etc.: packs then last for the session */ }
}

function apply() {
  const on = installed.filter((e) => e.enabled).map((e) => e.pack);
  const cats = on.filter((p) => p.contributes.stamps.length).map((p) => ({ id: `plugin_${p.id}`, name: `Plugins: ${p.name}`, type: 'plugin' }));
  const stamps = on.flatMap((p) => p.contributes.stamps.map((s) => {
    if (s.image) preloadImage(s.image, () => { version++; subs.forEach((f) => f()); });
    return { ...s, category: `plugin_${p.id}`, plugin: p.id, render: makeRender(s) };
  }));
  syncPluginStamps(stamps, cats);
  syncPluginBiomes(on.flatMap((p) => p.contributes.biomes));
  version++;
  subs.forEach((f) => f());
}

/** Validates and installs (replaces a pack with the same id). Returns validatePack's result. */
export function installPack(input) {
  const r = validatePack(input, { appVersion: pkg.version });
  if (!r.ok) return r;
  installed = [...installed.filter((e) => e.pack.id !== r.pack.id), { pack: r.pack, enabled: true }];
  apply(); persist();
  return r;
}
export function removePack(id) { installed = installed.filter((e) => e.pack.id !== id); apply(); persist(); }
export function setEnabled(id, enabled) { installed = installed.map((e) => (e.pack.id === id ? { ...e, enabled } : e)); apply(); persist(); }

/** Called once at start-up; stored packs are re-validated, so a tampered store cannot smuggle anything in. */
export async function loadInstalled() {
  try {
    const db = await open();
    const stored = await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(KEY); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    installed = (Array.isArray(stored) ? stored : []).map((e) => ({ r: validatePack(e && e.pack, { appVersion: pkg.version }), enabled: !!(e && e.enabled) })).filter((e) => e.r.ok).map((e) => ({ pack: e.r.pack, enabled: e.enabled }));
    apply();
  } catch { /* no IndexedDB */ }
}

const on = () => installed.filter((e) => e.enabled).map((e) => e.pack);
export const pluginStamps = () => on().flatMap((p) => p.contributes.stamps);
export const pluginBiomes = () => on().flatMap((p) => p.contributes.biomes);
export const pluginMapTemplates = () => on().flatMap((p) => p.contributes.mapTemplates);
/** { 'Pack: Name': atmosphere } shaped like LIGHT_PRESETS. */
const CLEAR = { tint: undefined, tintAmount: 0, tintBlend: 'multiply', weather: undefined, weatherAmount: 0, darkness: 0 }; // same reset as LIGHT_PRESETS
export const pluginLightPresets = () => Object.fromEntries(on().flatMap((p) => p.contributes.lightPresets.map((l) => [`${l.name} (${p.name})`, { ...CLEAR, ...l.atmosphere }])));

/** React hook: re-renders the caller whenever packs change. */
export const usePluginVersion = () => useSyncExternalStore(subscribe, getVersion);
