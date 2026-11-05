import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startApp, openPage, newMap, saveProject, byTip } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

test('dismissing the missing-plugin bar on one map does not hide it on the next map', async () => {
  const page = await openPage(app);
  await newMap(page, 'Dark map');
  const { data } = await saveProject(page);
  const file = join(await mkdtemp(join(tmpdir(), 'inkforge-')), 'dark.inkforge');
  await writeFile(file, JSON.stringify({ ...data, atmosphere: { ...data.atmosphere, darkness: 0.8 } })); // needs Dynamic lighting
  await byTip(page, 'Main menu: all your maps').click();

  const openFile = async () => {
    await page.locator('.home input[type=file]').setInputFiles(file);
    await page.locator('.canvas-viewport').waitFor();
    await page.waitForTimeout(200);
  };
  await openFile();
  assert.equal(await page.locator('.plugin-banner').count(), 1);
  await page.locator('.plugin-banner').getByRole('button', { name: 'Dismiss' }).click();
  assert.equal(await page.locator('.plugin-banner').count(), 0);

  await byTip(page, 'Main menu: all your maps').click();
  await openFile();
  assert.equal(await page.locator('.plugin-banner').count(), 1, 'the bar shows again for another map');
  assert.deepEqual(page.errors, []);
});
