import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, setFile } from './helpers/app.js';

const pack = (id, extra = {}) => ({ format: 'inkforge-plugin', version: 1, id, name: id, contributes: { biomes: [{ id: 'b', color: '#336699' }] }, ...extra });
const storeKv = (value) => new Promise((resolve) => {
  const r = indexedDB.open('inkforge', 2);
  r.onupgradeneeded = () => { for (const n of ['kv', 'projects', 'meta']) if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n); };
  r.onsuccess = () => { const t = r.result.transaction('kv', 'readwrite'); t.objectStore('kv').put(value, 'plugins'); t.oncomplete = () => { r.result.close(); resolve(); }; };
});
const storedIds = () => new Promise((resolve) => {
  const r = indexedDB.open('inkforge');
  r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('plugins'); q.onsuccess = () => resolve(q.result.map((e) => e.pack.id).sort()); };
});

test('a stored pack this version cannot use survives installing another pack', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const page = await openPage(await app.browser.newContext(), app.url);
    await page.waitForSelector('.home');
    // installed under an older InkForge, declares it only works there
    await page.evaluate(storeKv, [{ pack: pack('oldpack', { inkforgeVersion: '<1.14.0' }), enabled: true }]);
    await page.reload();
    await page.waitForSelector('.home');
    await page.getByText('Settings').first().click();
    await page.getByText('Plugins', { exact: true }).first().click();
    await setFile(page.getByTestId('plugin-file'), 'new.json', JSON.stringify(pack('newpack')));
    await page.getByText('not usable in this version, kept').waitFor({ timeout: 3000 });
    await page.waitForTimeout(500);
    assert.deepEqual(await page.evaluate(storedIds), ['newpack', 'oldpack']);
    assert.deepEqual(page.errors, []);
  } finally {
    await app.close();
  }
});
