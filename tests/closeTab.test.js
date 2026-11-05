import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, createMap, titleInput, readLibrary } from './helpers/app.js';

test('an edit made just before the tab closes is saved', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const context = await app.browser.newContext();
    const page = await openPage(context, app.url);
    await createMap(page, 'Mine');
    await titleInput(page).fill('Mine, last edit');
    await page.waitForTimeout(200); // well inside the 1.5 s autosave delay
    await page.close({ runBeforeUnload: true });
    const again = await openPage(context, app.url);
    await again.waitForSelector('.home');
    assert.deepEqual((await readLibrary(again)).projects.map((p) => p.title), ['Mine, last edit']);
  } finally {
    await app.close();
  }
});
