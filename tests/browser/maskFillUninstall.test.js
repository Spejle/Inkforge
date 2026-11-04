import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, newMap, saveProject, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

test('removing Mask fill while Fill is the brush shape: the sculptor paints Rough strokes again', async () => {
  const page = await openPage(app, { init: () => localStorage.setItem('inkforge.plugins', '["maskFill"]') });
  await newMap(page);
  await pressTool(page, 'm');
  await page.getByRole('button', { name: 'Fill' }).click();

  await page.getByRole('button', { name: 'Plugins' }).click();
  await page.getByRole('button', { name: 'Remove Mask fill' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  assert.match(await page.getByRole('button', { name: 'Rough Edgy' }).getAttribute('class'), /active/);

  const a = await mapToScreen(page, 500, 400);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 4; i++) await page.mouse.move(a.x + i * 40, a.y + i * 10);
  await page.mouse.up();
  await page.waitForTimeout(200);
  const { data } = await saveProject(page);
  assert.deepEqual(data.brushStrokes.map((s) => [s.type, s.shape]), [['mask', 'rough']]);
  assert.deepEqual(page.errors, []);
});
