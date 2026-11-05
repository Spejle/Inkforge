import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, readLibrary, createMap, titleInput, waitForSave } from './helpers/app.js';

test('the same map edited in two tabs keeps both versions', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const context = await app.browser.newContext();
    const tab1 = await openPage(context, app.url);
    await createMap(tab1, 'Shared');
    const tab2 = await openPage(context, app.url);
    await tab2.locator('.map-card', { hasText: 'Shared' }).first().click();
    await waitForSave(tab2); // opening a map saves it once: that alone must not count as a change
    await titleInput(tab1).fill('Edited in tab 1');
    await waitForSave(tab1);
    assert.deepEqual(tab1.dialogs, [], 'a plain re-save in the other tab is not a conflict');
    await titleInput(tab2).fill('Edited in tab 2');
    await waitForSave(tab2);
    await tab2.waitForTimeout(500);
    const titles = (await readLibrary(tab2)).projects.map((p) => p.title).sort();
    assert.deepEqual(titles, ['Edited in tab 1', 'Edited in tab 2 (copy from another tab)']);
    assert.match(tab2.dialogs.join('\n'), /changed in another tab/);
    assert.equal(await titleInput(tab2).inputValue(), 'Edited in tab 2 (copy from another tab)');
    assert.deepEqual([...tab1.errors, ...tab2.errors], []);
  } finally {
    await app.close();
  }
});
