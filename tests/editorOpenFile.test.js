import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, readLibrary, createMap, setFile, waitForSave } from './helpers/app.js';

test('opening a file from the editor adds a map and keeps the one that was open', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const page = await openPage(await app.browser.newContext(), app.url);
    await createMap(page, 'Mine');
    await setFile(page.locator('header input[type=file]'), 'other.inkforge', JSON.stringify({ title: 'Other', width: 640, height: 480, landmasses: [] }));
    await page.waitForFunction(() => document.querySelector('input.map-title-input')?.value === 'Other');
    await waitForSave(page);
    const { projects } = await readLibrary(page);
    assert.deepEqual(projects.map((p) => p.title).sort(), ['Mine', 'Other']);
    assert.deepEqual(page.errors, []);
  } finally {
    await app.close();
  }
});
