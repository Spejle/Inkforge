// Keyboard and screen-reader regression test in a real browser: dialogs (focus moves in, Tab stays inside, Escape
// closes, focus goes back to the opener, editor shortcuts stay quiet), tab order around the canvas, the panel tabs, the
// stamp library, and an axe-core scan of each screen in every theme.
//
// Needs Playwright with Chromium (not a dependency of this project). Without it the test is skipped, not failed:
//   npm i -g playwright && npx playwright install chromium
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));

let chromium = null;
try { ({ chromium } = require('playwright')); } catch { /* skipped below */ }

let server, browser, base, skip = chromium ? false : 'Playwright is not installed';

before(async () => {
  if (skip) return;
  try {
    browser = await chromium.launch();
  } catch (err) {
    skip = `Chromium did not start: ${err.message.split('\n')[0]}`;
    return;
  }
  const { createServer } = await import('vite');
  server = await createServer({ root, logLevel: 'silent', server: { port: 0, strictPort: false, hmr: false } });
  await server.listen();
  base = server.resolvedUrls.local[0];
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const THEMES = ['dark', 'parchment', 'orbit'];
const axeSource = () => readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function newPage() {
  // reduced motion also stops transitions, so axe never samples a colour half way through one
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); // offline-safe; text falls back to system fonts
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForSelector('.home', { timeout: 30000 });
  return { page, errors };
}

async function openSample(page) {
  await page.getByRole('button', { name: /The Realm of Valoria/ }).click();
  await page.waitForSelector('.header-bar');
}

/** What has focus, as "role name" (role from the tag or role attribute; name as a screen reader gets it). */
const focused = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return 'body';
  const role = a.getAttribute('role') || ({ BUTTON: 'button', INPUT: 'textbox', H1: 'heading' }[a.tagName] || a.tagName.toLowerCase());
  const byId = a.getAttribute('aria-labelledby') && document.getElementById(a.getAttribute('aria-labelledby'));
  const name = a.getAttribute('aria-label') || byId?.textContent || a.labels?.[0]?.textContent || a.textContent || '';
  return `${role} ${name.replace(/\s+/g, ' ').trim()}`;
});
const insideDialog = (page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

async function axe(page, label) {
  await page.evaluate(axeSource());
  const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations
    .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`));
  assert.deepEqual(violations, [], `axe violations on ${label}`);
}

test('dialogs: focus moves in, Tab is trapped, Escape closes and focus returns', async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await newPage();

  // New map, opened from the keyboard on the main menu
  const newMap = page.locator('.home-actions').getByRole('button', { name: 'New map' });
  await newMap.focus();
  await page.keyboard.press('Enter');
  const dlg = page.getByRole('dialog', { name: 'New map' });
  await dlg.waitFor();
  assert.equal(await dlg.getAttribute('aria-modal'), 'true');
  assert.equal(await focused(page), 'textbox Name', 'the name field takes focus');
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    assert.ok(await insideDialog(page), `Tab ${i + 1} left the New map dialog`);
  }
  await page.getByRole('textbox', { name: 'Name' }).focus();
  await page.keyboard.press('Shift+Tab');
  assert.ok(await insideDialog(page), 'Shift+Tab from the first field wraps to the end of the dialog');
  await page.keyboard.press('Escape');
  await dlg.waitFor({ state: 'detached' });
  assert.ok(await newMap.evaluate((el) => el === document.activeElement), 'focus is back on the New map button');

  await openSample(page);
  assert.match(await focused(page), /^heading InkForge editor/, 'opening a map starts at the editor heading');

  // Settings: tabs work with the arrow keys; editor shortcuts do not fire behind the dialog
  const settings = page.getByRole('button', { name: 'Settings', exact: true });
  await settings.focus();
  await page.keyboard.press('Enter');
  const sdlg = page.getByRole('dialog', { name: 'Settings' });
  await sdlg.waitFor();
  assert.ok(await insideDialog(page), 'focus moved into Settings');
  await page.keyboard.press('b'); // Biome brush shortcut
  assert.equal(await page.getByRole('button', { name: 'Select & Transform', exact: true }).getAttribute('aria-pressed'), 'true', 'tool shortcut fired behind the dialog');
  await sdlg.getByRole('tab', { name: 'Appearance' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Layout'));
  assert.equal(await sdlg.getByRole('tab', { name: 'Layout' }).getAttribute('aria-selected'), 'true');
  assert.equal(await sdlg.getByRole('tabpanel').count(), 1);
  assert.deepEqual(await sdlg.getByRole('tab').evaluateAll((els) => els.map((e) => e.tabIndex)), [-1, 0, -1, -1], 'one tab stop for the tab list');
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    assert.ok(await insideDialog(page), `Tab ${i + 1} left the Settings dialog`);
  }
  await page.keyboard.press('Escape');
  await sdlg.waitFor({ state: 'detached' });
  assert.ok(await settings.evaluate((el) => el === document.activeElement), 'focus is back on Settings');

  // Export, and the backdrop click
  const exp = page.getByRole('button', { name: 'Export', exact: true });
  await exp.click();
  const edlg = page.getByRole('dialog', { name: /^Export/ });
  await edlg.waitFor();
  await page.keyboard.press('Escape');
  await edlg.waitFor({ state: 'detached' });
  assert.ok(await exp.evaluate((el) => el === document.activeElement), 'focus is back on Export');
  await exp.click();
  await edlg.waitFor();
  await page.mouse.click(5, 450); // the backdrop
  await edlg.waitFor({ state: 'detached' });

  // a dialog opened from inside another (Export -> Print, a plugin) hands focus back to the first one's opener
  await page.getByRole('button', { name: 'Plugins', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Print at table scale' }).or(page.locator('.plugin-row', { hasText: 'Print at table scale' }).getByRole('button', { name: 'Install' })).first().waitFor();
  const installPrint = page.locator('.plugin-row', { hasText: 'Print at table scale' }).getByRole('button', { name: 'Install' });
  if (await installPrint.count()) await installPrint.click();
  await page.getByRole('button', { name: 'Remove Print at table scale' }).waitFor({ timeout: 30000 });
  await page.keyboard.press('Escape');
  await exp.click();
  await edlg.waitFor();
  await page.getByRole('button', { name: /Print PDF/ }).click();
  const pdlg = page.getByRole('dialog', { name: /^Print/ });
  await pdlg.waitFor();
  assert.ok(await insideDialog(page), 'focus moved into Print');
  await page.keyboard.press('Escape');
  await pdlg.waitFor({ state: 'detached' });
  assert.ok(await exp.evaluate((el) => el === document.activeElement), 'focus is back on Export after Print');

  assert.deepEqual(errors, []);
  await page.close();
});

test('tab order: header, tool rail, panel; the stamp library works from the keyboard', async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await newPage();
  await openSample(page);

  await page.getByRole('textbox', { name: 'Map title' }).focus();
  const order = [];
  for (let i = 0; i < 28; i++) {
    await page.keyboard.press('Tab');
    order.push(await focused(page));
  }
  const tools = ['Landmass Sculptor', 'Biome & Texture', 'Stamps & Props', 'Rivers & Paths', 'Text & Banners', 'Select & Transform', 'Grid & Alignment', 'Atmosphere & Light', 'Eraser', 'Pan Canvas'];
  const at = (name) => order.indexOf(name);
  // header first, in reading order
  for (const [a, b] of [['button Settings', 'button Plugins'], ['button Zoom out', 'button Zoom in'], ['button Grid overlay', 'button Export']]) {
    assert.ok(at(a) >= 0 && at(a) < at(b), `${a} before ${b}: ${order.join(' | ')}`);
  }
  // then every tool, in rail order
  const rail = tools.map((n) => at(`button ${n}`));
  assert.ok(rail.every((i, k) => i > at('button Export') && (k === 0 || i === rail[k - 1] + 1)), `tool rail order: ${order.join(' | ')}`);
  // then the panel: collapse, resize edge, and one stop for the tab list
  const last = rail[rail.length - 1];
  assert.deepEqual(order.slice(last + 1, last + 4), ['button Collapse panel', 'separator Resize panel', 'tab Select & Transform']);

  // tool buttons expose which tool is active
  const stampTool = page.getByRole('button', { name: 'Stamps & Props', exact: true });
  await stampTool.focus();
  await page.keyboard.press('Enter');
  assert.equal(await stampTool.getAttribute('aria-pressed'), 'true');

  // panel tabs: arrows move between them
  const toolTab = page.getByRole('tab', { name: /^Stamps/ });
  await toolTab.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Layers'));
  assert.equal(await page.getByRole('tab', { name: 'Layers & FX' }).getAttribute('aria-selected'), 'true');
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.activeElement?.textContent?.startsWith('Stamps') || document.activeElement?.textContent?.includes(' Stamps'));

  // stamp tiles are buttons: Tab reaches them and Enter picks one
  const tile = page.getByRole('group', { name: 'Stamps' }).getByRole('button').nth(1);
  await tile.focus();
  await page.keyboard.press('Enter');
  assert.equal(await tile.getAttribute('aria-pressed'), 'true');

  // the resize edge answers the arrow keys
  const sep = page.getByRole('separator', { name: 'Resize panel' });
  const w0 = Number(await sep.getAttribute('aria-valuenow'));
  await sep.focus();
  await page.keyboard.press('ArrowLeft'); // the panel is on the right: towards the canvas widens it
  assert.equal(Number(await sep.getAttribute('aria-valuenow')), w0 + 10);

  // a hover tooltip must not take the name off an icon-only button
  await page.getByRole('button', { name: 'Zoom in', exact: true }).hover();
  await page.waitForTimeout(450);
  assert.equal(await page.getByRole('button', { name: 'Zoom in', exact: true }).count(), 1);

  assert.deepEqual(errors, []);
  await page.close();
});

test('axe finds nothing on the main menu, the editor, its panels and dialogs, in every theme', async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await newPage();
  const theme = async (id) => {
    await page.evaluate((x) => { document.documentElement.dataset.theme = x; }, id);
    await page.waitForTimeout(400); // inherited colours settle a frame or two after the switch
  };
  for (const id of THEMES) { await theme(id); await axe(page, `main menu (${id})`); }
  await theme('dark');
  await page.getByRole('button', { name: 'New map' }).first().click();
  await axe(page, 'New map dialog');
  await page.keyboard.press('Escape');

  await openSample(page);
  for (const id of THEMES) {
    await theme(id);
    await axe(page, `editor (${id})`);
    for (const key of ['m', 'b', 's', 't']) {
      await page.keyboard.press(key);
      await axe(page, `editor, tool ${key} (${id})`);
    }
    await page.getByRole('tab', { name: 'Layers & FX' }).click();
    await axe(page, `Layers & FX (${id})`);
  }
  for (const [name, dialog] of [['Settings', 'Settings'], ['Export', /^Export/]]) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('dialog', { name: dialog }).waitFor();
    await axe(page, `${name} dialog`);
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  await page.close();
});
