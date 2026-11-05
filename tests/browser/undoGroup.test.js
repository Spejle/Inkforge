import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, newMap, saveProject, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

test('undo clears a multi-stamp selection', async () => {
  const page = await openPage(app);
  await newMap(page);
  await pressTool(page, 's');
  for (const x of [400, 600, 900]) {
    const at = await mapToScreen(page, x, 400);
    await page.mouse.click(at.x, at.y);
    await page.waitForTimeout(100);
  }
  assert.equal((await saveProject(page)).data.stamps.length, 3);

  await pressTool(page, 'v');
  const a = await mapToScreen(page, 300, 250);
  const b = await mapToScreen(page, 750, 550);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Objects' }).click();
  assert.equal(await page.locator('.obj-row.on').count(), 2, 'the rubber band picked two stamps');

  await page.keyboard.press('Control+z'); // removes the third stamp
  await page.waitForTimeout(150);
  assert.equal((await saveProject(page)).data.stamps.length, 2);
  assert.equal(await page.locator('.obj-row.on').count(), 0, 'nothing is selected after undo');
  assert.deepEqual(page.errors, []);
});
