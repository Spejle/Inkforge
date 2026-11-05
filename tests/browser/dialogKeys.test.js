import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, newMap, saveProject, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

test('editing shortcuts do nothing while a dialog is open', async () => {
  const page = await openPage(app);
  await newMap(page);
  await pressTool(page, 's');
  const at = await mapToScreen(page, 500, 400);
  await page.mouse.click(at.x, at.y);
  await page.waitForTimeout(200);
  await pressTool(page, 'v');
  await page.mouse.click(at.x, at.y); // select it
  await page.waitForTimeout(200);
  assert.equal((await saveProject(page)).data.stamps.length, 1);

  for (const open of [
    () => page.getByRole('button', { name: 'Settings' }).click(),
    () => page.locator('[title="Export image (PNG, WebP, JPG) or Universal VTT"]').click()
  ]) {
    await open();
    await page.getByRole('dialog').waitFor();
    for (const key of ['Delete', 'Backspace', 'Control+z', 'b']) await page.keyboard.press(key);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.waitForTimeout(150);
    assert.equal((await saveProject(page)).data.stamps.length, 1, 'the selected stamp survived the dialog');
  }
  await page.keyboard.press('Delete');
  await page.waitForTimeout(150);
  assert.equal((await saveProject(page)).data.stamps.length, 0, 'Delete still works once the dialog is closed');
  assert.deepEqual(page.errors, []);
});
