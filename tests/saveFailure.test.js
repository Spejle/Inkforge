import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, readLibrary, createMap, titleInput } from './helpers/app.js';

test('leaving the editor when the map cannot be saved keeps it open and says so', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const page = await openPage(await app.browser.newContext({ acceptDownloads: true }), app.url);
    await createMap(page, 'Mine');
    await titleInput(page).fill('Mine, edited');
    // storage full from here on
    await page.evaluate(() => { IDBObjectStore.prototype.put = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
    const download = page.waitForEvent('download');
    await page.locator('button[title="Main menu: all your maps"]').click();
    assert.equal((await download).suggestedFilename(), 'mine__edited.inkforge');
    assert.equal(await page.locator('.home').count(), 0, 'still in the editor');
    assert.equal(await titleInput(page).inputValue(), 'Mine, edited');
    assert.match(page.dialogs.join('\n'), /could not be saved/);
    assert.deepEqual((await readLibrary(page)).projects.map((p) => p.title), ['Mine']); // the last good save is untouched
  } finally {
    await app.close();
  }
});
