// Autosave in IndexedDB (localStorage's ~5 MB quota is too small once custom stamps are embedded).
const DB = 'inkforge';
const STORE = 'kv';
const KEY = 'autosave';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const saveAutosave = (project) => tx('readwrite', (s) => s.put(project, KEY));
export const loadAutosave = () => tx('readonly', (s) => s.get(KEY)).catch(() => null);

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
