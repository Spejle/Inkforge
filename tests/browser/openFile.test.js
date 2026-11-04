import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startApp, openPage, newMap, saveProject, byTip } from './harness.js';

let app;
test.before(async () => { app = await startApp(); });
test.after(async () => { await app?.close(); });

const libraryTitles = (page) => page.locator('.map-grid').first().locator('.map-card:not(.new) b').allTextContents();

test('Open (.inkforge) in the editor adds the file as a new map and keeps the one being edited', async () => {
  const page = await openPage(app);
  await newMap(page, 'From a file');
  const file = join(await mkdtemp(join(tmpdir(), 'inkforge-')), 'other.inkforge');
  await writeFile(file, (await saveProject(page)).text);
  await byTip(page, 'Main menu: all your maps').click();

  await newMap(page, 'Being edited');
  await page.locator('header input[type=file]').setInputFiles(file);
  await page.locator('.map-title-input').and(page.locator('[value="From a file"]')).waitFor();
  await page.waitForTimeout(300);
  await byTip(page, 'Main menu: all your maps').click();
  await page.locator('.map-grid').first().waitFor();

  assert.deepEqual((await libraryTitles(page)).sort(), ['Being edited', 'From a file', 'From a file']);
  assert.deepEqual(page.errors, []);
});
