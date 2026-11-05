import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage } from './helpers/app.js';

const seed = () => new Promise((resolve) => {
  const r = indexedDB.open('inkforge', 2);
  r.onupgradeneeded = () => { for (const n of ['kv', 'projects', 'meta']) if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n); };
  r.onsuccess = () => {
    const tx = r.result.transaction(['projects', 'meta', 'kv'], 'readwrite');
    tx.objectStore('projects').put({ title: 'Existing', template: 'world', landmasses: [] }, 'map_a');
    tx.objectStore('meta').put({ id: 'map_a', title: 'Existing', template: 'world', width: 800, height: 600, updated: Date.now() }, 'map_a');
    tx.objectStore('kv').put({ title: 'Legacy autosave', type: 'world', landmasses: [] }, 'autosave'); // single-map autosave from 1.5/1.6
    tx.oncomplete = () => { r.result.close(); resolve(); };
  };
});
const legacyKept = () => new Promise((resolve) => {
  const r = indexedDB.open('inkforge');
  r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('autosave'); q.onsuccess = () => resolve(!!q.result); };
});

test('a failed migration of the 1.5/1.6 autosave does not hide the map library', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const context = await app.browser.newContext();
    const page = await openPage(context, app.url);
    await page.waitForSelector('.home');
    await page.evaluate(seed);
    // storage is full: saving a project fails
    await context.addInitScript(() => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...a) {
        if (this.name === 'projects') throw new DOMException('Quota exceeded', 'QuotaExceededError');
        return put.apply(this, a);
      };
    });
    await page.reload();
    await page.locator('.map-card', { hasText: 'Existing' }).waitFor({ timeout: 5000 });
    assert.equal(await page.getByText('No maps yet').count(), 0);
    assert.equal(await page.evaluate(legacyKept), true, 'the old autosave is kept for a later retry');
  } finally {
    await app.close();
  }
});
