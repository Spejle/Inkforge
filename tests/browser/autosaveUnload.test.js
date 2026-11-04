import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, newMap, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

const savedStrokes = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  const r = indexedDB.open('inkforge', 2);
  r.onerror = () => reject(r.error);
  r.onsuccess = () => {
    const q = r.result.transaction('projects').objectStore('projects').getAll();
    q.onsuccess = () => resolve(q.result.map((p) => p.brushStrokes.length));
  };
}));

test('an edit made just before the page is reloaded is autosaved', async () => {
  const page = await openPage(app);
  await newMap(page);
  await page.waitForTimeout(1800); // the new, empty map has been saved
  await pressTool(page, 'b');
  const a = await mapToScreen(page, 400, 400);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 3; i++) await page.mouse.move(a.x + i * 40, a.y);
  await page.mouse.up();
  await page.waitForTimeout(100); // well inside autosave's 1.5 s wait
  await page.reload();
  await page.locator('.map-card').first().waitFor();
  assert.deepEqual(await savedStrokes(page), [1]);
});
