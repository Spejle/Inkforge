import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProjectText, migrateProject, FORMAT_VERSION } from '../src/utils/projectFormat.js';
import { startApp, openPage, readLibrary } from './helpers/app.js';

const message = (text) => { try { parseProjectText(text); } catch (e) { return e.message; } return 'accepted'; };

test('older map files are migrated and newer ones are refused instead of being opened half-understood', () => {
  // 1.5/1.6 file: no version, `type` only
  const v16 = parseProjectText(JSON.stringify({ title: 'Old', type: 'battle', width: 1200, height: 900, landmasses: [], stamps: [] }));
  assert.equal(v16.template, 'battle');
  assert.equal(v16.formatVersion, FORMAT_VERSION);
  // 1.7-1.14 file: version "1.1.0", no formatVersion
  const v114 = parseProjectText(JSON.stringify({ version: '1.1.0', app: 'InkForge', title: 'Mid', type: 'world', template: 'region', landmasses: [] }));
  assert.equal(v114.template, 'region');
  assert.equal(v114.formatVersion, FORMAT_VERSION);
  // current file round-trips
  assert.equal(parseProjectText(JSON.stringify({ formatVersion: FORMAT_VERSION, title: 'Now', template: 'world' })).title, 'Now');
  assert.match(message(JSON.stringify({ formatVersion: FORMAT_VERSION + 1, title: 'Future' })), /newer version of InkForge.*Nothing was changed/);
  for (const v of ['2', 0, -1, 1.5, null]) assert.match(message(JSON.stringify({ formatVersion: v, title: 'x' })), /unknown format version/, String(v));
  assert.deepEqual(migrateProject({ title: 't' }).formatVersion, FORMAT_VERSION);
});

test('a library entry saved by a newer InkForge is not opened and not overwritten', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const page = await openPage(await app.browser.newContext(), app.url);
    await page.waitForSelector('.home');
    const future = { formatVersion: 99, title: 'From the future', template: 'world', width: 800, height: 600, landmasses: [], newThing: { keep: true } };
    await page.evaluate((p) => new Promise((resolve) => {
      const r = indexedDB.open('inkforge', 2);
      r.onupgradeneeded = () => { for (const n of ['kv', 'projects', 'meta']) if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n); };
      r.onsuccess = () => {
        const tx = r.result.transaction(['projects', 'meta'], 'readwrite');
        tx.objectStore('projects').put(p, 'map_future');
        tx.objectStore('meta').put({ id: 'map_future', title: p.title, template: 'world', width: 800, height: 600, updated: Date.now(), rev: 3 }, 'map_future');
        tx.oncomplete = () => { r.result.close(); resolve(); };
      };
    }), future);
    await page.reload();
    await page.locator('.map-card', { hasText: 'From the future' }).click();
    await page.waitForTimeout(2500); // longer than the autosave delay
    assert.match(page.dialogs.join('\n'), /newer version of InkForge/);
    assert.equal(await page.locator('.home').count(), 1, 'stays on the main menu');
    const { projects } = await readLibrary(page);
    assert.deepEqual(projects, [future]);
  } finally {
    await app.close();
  }
});
