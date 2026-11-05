import { sanitizeMeta } from './importGuard.js';

// Map library in IndexedDB (localStorage's ~5 MB quota is too small once custom stamps are embedded).
// `projects` holds the full map, `meta` a small record per map so the main menu lists fast.
const DB = 'inkforge';
const OLD_KEY = 'autosave'; // single-map autosave from v1.5/1.6, migrated on first list

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of ['kv', 'projects', 'meta']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const r = fn(...stores.map((s) => t.objectStore(s)));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const newMapId = () => 'map_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Thrown by saveMap when the stored map is not at the revision the caller expected (another tab saved it). */
export class SaveConflictError extends Error {
  constructor(rev) {
    super('This map was saved from another tab');
    this.name = 'SaveConflictError';
    this.rev = rev; // the revision now stored
  }
}

/**
 * Saves a map and its meta record in one transaction and resolves to the new revision.
 * With `expectRev` the save only happens when the stored revision is still that one (0 = not stored yet); otherwise it
 * rejects with SaveConflictError and nothing is written. Without it the map is written unconditionally.
 */
export async function saveMap(id, project, meta, expectRev) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(['projects', 'meta'], 'readwrite');
    const m = t.objectStore('meta');
    let rev, conflict = null;
    const cur = m.get(id);
    cur.onsuccess = () => {
      const stored = (cur.result && cur.result.rev) || 0;
      if (expectRev !== undefined && stored !== expectRev) {
        conflict = new SaveConflictError(stored);
        t.abort();
        return;
      }
      rev = stored + 1;
      t.objectStore('projects').put(project, id);
      m.put({ ...meta, id, updated: Date.now(), rev }, id);
    };
    t.oncomplete = () => resolve(rev);
    t.onabort = () => reject(conflict || t.error || new Error('Save failed'));
  });
}

export const loadMap = (id) => tx(['projects'], 'readonly', (p) => p.get(id)).catch(() => null);

/** The stored map with the revision it is at, or null. */
export async function loadMapRecord(id) {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const t = db.transaction(['projects', 'meta']);
      const p = t.objectStore('projects').get(id);
      const m = t.objectStore('meta').get(id);
      t.oncomplete = () => resolve(p.result ? { project: p.result, rev: (m.result && m.result.rev) || 0 } : null);
      t.onabort = () => reject(t.error);
    });
  } catch {
    return null;
  }
}

export const deleteMap = (id) =>
  tx(['projects', 'meta'], 'readwrite', (p, m) => {
    p.delete(id);
    return m.delete(id);
  });

export async function listMaps() {
  const old = await tx(['kv'], 'readonly', (k) => k.get(OLD_KEY)).catch(() => null);
  if (old && typeof old === 'object') {
    // A failure here (storage full) must not hide the rest of the library: the old entry stays and is retried next time
    try {
      const id = newMapId();
      await saveMap(id, old, { title: old.title || 'Restored map', template: old.template || old.type || 'world', width: old.width, height: old.height, thumb: null });
      await tx(['kv'], 'readwrite', (k) => k.delete(OLD_KEY));
    } catch { /* keep OLD_KEY */ }
  }
  const all = await tx(['meta'], 'readonly', (m) => m.getAll()).catch(() => []);
  return (all || []).map(sanitizeMeta).sort((a, b) => b.updated - a.updated); // records from older versions are not trusted either
}

/** Stamps saved with an embedded data URL get their Image back (the renderer also accepts strings). */
export function hydrateStamps(stamps) {
  return stamps.map((s) => {
    if (typeof s.customImage === 'string' && s.customImage.startsWith('data:')) {
      const img = new Image();
      img.src = s.customImage;
      return { ...s, customImage: img };
    }
    return s;
  });
}
