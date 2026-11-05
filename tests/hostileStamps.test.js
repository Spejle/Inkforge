import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProject } from '../src/utils/importGuard.js';
import { PRESET_MAPS } from '../src/engine/presetMaps.js';
import { startApp, openPage, setFile, titleInput } from './helpers/app.js';

const hostile = {
  title: 'Hostile stamps',
  stamps: [{ id: 's', stampId: 'tree_oak', x: 10, y: 10, scale: 1e300, rotation: 'x', aspect: 1e9 }, { id: 's2', stampId: { a: 1 }, x: 'a', y: null }],
  customStamps: [{ id: 'c', dataUrl: 'data:image/png;base64,AAAA', name: { a: 1 }, aspect: -1 }]
};

test('stamp sizes and names from a map file are bounded and made safe', () => {
  const p = sanitizeProject(hostile);
  assert.deepEqual(p.stamps.map((s) => [s.scale, s.rotation, s.aspect, s.stampId, s.x, s.y]), [[10, 0, 5, 'tree_oak', 10, 10], [1, 0, undefined, undefined, 0, 0]]);
  assert.deepEqual(p.customStamps.map((c) => [c.name, c.aspect]), [['Custom stamp', 0.2]]);
  for (const m of PRESET_MAPS) { // ordinary stamps keep every value they had
    sanitizeProject(m).stamps.forEach((s, i) => { for (const [k, v] of Object.entries(m.stamps[i])) assert.deepEqual(s[k], v, `${m.id} ${k}`); });
  }
});

test('a map with hostile stamps opens without crashing the editor', async (t) => {
  const app = await startApp();
  if (app.skip) return t.skip(app.skip);
  try {
    const page = await openPage(await app.browser.newContext(), app.url);
    await page.waitForSelector('.home');
    await setFile(page.locator('.home input[type=file]'), 'stamps.inkforge', JSON.stringify(hostile));
    await titleInput(page).waitFor({ timeout: 8000 });
    await page.getByText('Objects', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    assert.deepEqual(page.errors, []);
    assert.equal(await titleInput(page).inputValue(), 'Hostile stamps');
  } finally {
    await app.close();
  }
});
