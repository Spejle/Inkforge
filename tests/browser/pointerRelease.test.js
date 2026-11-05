import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, newMap, saveProject, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

async function dragFrom(page, mx, my) {
  const a = await mapToScreen(page, mx, my);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) await page.mouse.move(a.x + i * 40, a.y + i * 10);
  return a;
}

test('a brush or mask stroke released outside the canvas (or cancelled) is kept, with an undo step', async () => {
  const page = await openPage(app);
  await newMap(page);

  await pressTool(page, 'b'); // the tool changes after the window listener was set up: it must not see the old one
  let a = await dragFrom(page, 500, 400);
  await page.mouse.move(a.x + 220, 15, { steps: 2 }); // over the header
  await page.mouse.up();
  await page.waitForTimeout(200);
  let { data } = await saveProject(page);
  assert.deepEqual(data.brushStrokes.map((s) => s.type), ['brush']);

  await pressTool(page, 'm');
  a = await dragFrom(page, 500, 700);
  await page.mouse.move(a.x + 220, 15, { steps: 2 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  await dragFrom(page, 900, 300);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel')));
  await page.mouse.up();
  await page.waitForTimeout(200);
  ({ data } = await saveProject(page));
  assert.deepEqual(data.brushStrokes.map((s) => s.type), ['brush', 'mask', 'mask']);

  await page.keyboard.press('Control+z');
  await page.waitForTimeout(200);
  ({ data } = await saveProject(page));
  assert.equal(data.brushStrokes.length, 2, 'each stroke is one undo step');
  assert.deepEqual(page.errors, []);
});
