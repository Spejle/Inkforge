import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, byTip } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

const thumbs = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  const r = indexedDB.open('inkforge', 2);
  r.onerror = () => reject(r.error);
  r.onsuccess = () => {
    const q = r.result.transaction('meta').objectStore('meta').getAll();
    q.onsuccess = () => resolve(Object.fromEntries(q.result.map((m) => [m.title, m.thumb])));
  };
}));

test("autosave keeps each map's own thumbnail when maps are switched quickly", async () => {
  const page = await openPage(app);
  const home = () => byTip(page, 'Main menu: all your maps').click();
  const open = async (title, which) => { // library cards come before the sample cards
    await page.locator('.map-card', { hasText: title })[which]().click();
    await page.locator('.canvas-viewport').waitFor();
  };
  await open('City: Port', 'last'); // samples: opens a copy in the library
  await home();
  await open('Battle: Ambush', 'last');
  await home();
  const before = await thumbs(page);
  await open('City: Port', 'first'); // the library copy, within 10 s of Battle's thumbnail
  await page.waitForTimeout(2200); // autosave
  const after = await thumbs(page);
  assert.notEqual(before['City: Port of Karrowmere'], before['Battle: Ambush at Ravenford']);
  assert.notEqual(after['City: Port of Karrowmere'], after['Battle: Ambush at Ravenford'], 'City got the Battle map thumbnail');
  assert.deepEqual(page.errors, []);
});
