import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, saveProject, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

const pathsOf = async (page) => (await saveProject(page)).data.paths;
const undo = async (page) => { await page.keyboard.press('Control+z'); await page.waitForTimeout(150); };
const redo = async (page) => { await page.keyboard.press('Control+y'); await page.waitForTimeout(150); };

test('a generated river and a spine double-click edit are each one undo step', async () => {
  const page = await openPage(app, { init: () => localStorage.setItem('inkforge.plugins', '["riverGen"]') });
  await page.locator('.map-card', { hasText: 'The Realm of Valoria' }).last().click(); // a sample with land
  await page.locator('.canvas-viewport').waitFor();
  const start = await pathsOf(page);

  await pressTool(page, 'p');
  await page.getByRole('button', { name: 'River', exact: true }).click();
  await page.getByRole('button', { name: 'Generate on click' }).click();
  const at = await mapToScreen(page, 700, 450);
  await page.mouse.click(at.x, at.y);
  await page.waitForTimeout(300);
  const withRiver = await pathsOf(page);
  assert.equal(withRiver.length, start.length + 1);
  const river = withRiver.at(-1);

  await undo(page);
  assert.deepEqual(await pathsOf(page), start, 'undo removes just the river');
  await redo(page);
  assert.deepEqual(await pathsOf(page), withRiver, 'redo brings the river back');

  // double-click a spine point of the selected river to delete it (selected from the Objects tab: a click on the map
  // could land on a stamp, the course is random)
  await pressTool(page, 'v');
  await page.getByRole('button', { name: 'Objects' }).click();
  await page.getByPlaceholder('Filter…').fill('river');
  await page.locator('.obj-row').last().click();
  await page.locator('.spine-point').first().waitFor();
  const [vx, vy] = river.points[Math.floor(river.points.length / 2)];
  const v = await mapToScreen(page, vx, vy);
  await page.mouse.dblclick(v.x, v.y);
  await page.waitForTimeout(300);
  assert.equal((await pathsOf(page)).at(-1).points.length, river.points.length - 1);
  await undo(page);
  assert.deepEqual(await pathsOf(page), withRiver, 'undo restores the deleted spine point');
  assert.deepEqual(page.errors, []);
});
