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

export const saveMap = (id, project, meta) =>
  tx(['projects', 'meta'], 'readwrite', (p, m) => {
    p.put(project, id);
    return m.put({ ...meta, id, updated: Date.now() }, id);
  });

export const loadMap = (id) => tx(['projects'], 'readonly', (p) => p.get(id)).catch(() => null);

export const deleteMap = (id) =>
  tx(['projects', 'meta'], 'readwrite', (p, m) => {
    p.delete(id);
    return m.delete(id);
  });

export async function listMaps() {
  const old = await tx(['kv'], 'readonly', (k) => k.get(OLD_KEY)).catch(() => null);
  if (old) {
    const id = newMapId();
    await saveMap(id, old, { title: old.title || 'Restored map', template: old.template || old.type || 'world', width: old.width, height: old.height, thumb: null });
    await tx(['kv'], 'readwrite', (k) => k.delete(OLD_KEY));
  }
  const all = await tx(['meta'], 'readonly', (m) => m.getAll()).catch(() => []);
  return (all || []).sort((a, b) => b.updated - a.updated);
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
