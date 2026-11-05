import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProject, sanitizeMeta } from '../src/utils/importGuard.js';
import { startApp, openPage, readLibrary, setFile, titleInput } from './helpers/app.js';

test('text fields of the wrong type are made safe to show', () => {
  const p = sanitizeProject({
    title: { evil: 1 }, template: ['x'], type: 7,
    texts: [{ id: 't', text: { a: 1 } }, { id: 'u', text: 42 }],
    paths: [{ id: 'p', points: [[1, 2], [3, 4]] }, { id: 'q', type: '', points: [[1, 2], [3, 4]] }, { id: 'r', type: 'wall', points: [[1, 2], [3, 4]] }],
    layers: { land: null, c_1: { name: { x: 1 }, visible: true }, c_2: { name: 'Ruins' }, c_3: 'x' }
  });
  assert.equal(p.title, undefined);
  assert.equal(p.template, undefined);
  assert.equal(p.type, '7');
  assert.deepEqual(p.texts.map((t) => t.text), ['', '42']);
  assert.deepEqual(p.paths.map((x) => x.type), ['road', 'road', 'wall']);
  assert.deepEqual(p.layers, { c_1: { visible: true }, c_2: { name: 'Ruins' } });
  // library records already written by an earlier version
  const m = sanitizeMeta({ id: 'map_1', title: { evil: 1 }, template: {}, width: 'x', thumb: 'https://evil.example/t.png', updated: 5 });
  assert.deepEqual([m.title, m.template, m.width, m.thumb, m.updated], ['Untitled map', undefined, 1920, null, 5]);
});

test('a map file with an object as its title does not blank the main menu', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const page = await openPage(await app.browser.newContext(), app.url);
    await page.waitForSelector('.home');
    await setFile(page.locator('.home input[type=file]'), 'evil.inkforge', JSON.stringify({ title: { evil: 1 }, landmasses: [] }));
    await titleInput(page).waitFor();
    await page.locator('button[title="Main menu: all your maps"]').click();
    await page.reload();
    await page.locator('.map-card', { hasText: 'Imported Realm' }).waitFor({ timeout: 5000 });
    assert.deepEqual(page.errors, []);
    assert.deepEqual((await readLibrary(page)).meta.map((m) => m.title), ['Imported Realm']);
  } finally {
    await app.close();
  }
});
