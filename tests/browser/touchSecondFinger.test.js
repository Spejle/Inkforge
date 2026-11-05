import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, openPage, newMap, saveProject, mapToScreen, pressTool } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

test('a second finger while panning with one finger does not make the view jump', async () => {
  const page = await openPage(app, { hasTouch: true });
  await newMap(page);
  const pan = async () => {
    const t = await page.locator('.canvas-transform-wrapper').evaluate((el) => el.style.transform);
    return t.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/).slice(1).map(Number);
  };
  const [x0, y0] = await pan();
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  const a = await mapToScreen(page, 300, 300);
  const far = await mapToScreen(page, 800, 700);
  await touch('touchStart', [[a.x, a.y]]);
  for (let i = 1; i <= 3; i++) await touch('touchMove', [[a.x + i * 20, a.y]]);
  await touch('touchStart', [[a.x + 60, a.y], [far.x, far.y]]); // second finger lands far away
  for (let i = 4; i <= 6; i++) await touch('touchMove', [[a.x + i * 20, a.y], [far.x + i * 5, far.y]]);
  await touch('touchEnd', [[far.x + 30, far.y]]);
  await touch('touchEnd', []);
  await page.waitForTimeout(200);
  const [x1, y1] = await pan();
  const x = x1 - x0, y = y1 - y0;
  // the first finger moved 120 px right; the second barely moved
  assert.ok(Math.abs(x - 120) <= 40 && Math.abs(y) <= 40, `view panned to ${x}, ${y}`);
  assert.equal((await saveProject(page)).data.brushStrokes.length, 0);
  assert.deepEqual(page.errors, []);
});
