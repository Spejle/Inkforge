// Shared setup for the browser tests: a Vite dev server for the app and a headless Chromium driving it.
// Run with `npm run test:browser` (needs Playwright and a Chromium it can launch).
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Playwright is not a project dependency: use a local install if there is one, else the machine's global one (NODE_PATH).
const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));

export async function startApp() {
  const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  const { port } = server.httpServer.address();
  const browser = await chromium.launch();
  return {
    url: `http://127.0.0.1:${port}/`,
    browser,
    async close() {
      await browser.close();
      await server.close();
    }
  };
}

/** A fresh page (empty storage) on the app's main menu. `init` runs before the app's own scripts. */
export async function openPage(app, { init, query = '', hasTouch = false } = {}) {
  const context = await app.browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 }, hasTouch });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e));
  page.on('dialog', (d) => d.accept());
  await page.goto(app.url + query);
  return page;
}

/** Main menu -> New map -> Create, waiting for the editor. */
export async function newMap(page, title = 'Test map') {
  await page.getByRole('button', { name: 'New map' }).first().click();
  await page.getByRole('dialog', { name: 'New map' }).getByRole('textbox').fill(title);
  await page.getByRole('button', { name: 'Create map' }).click();
  await page.locator('.canvas-viewport').waitFor();
  await page.waitForTimeout(300);
}

/** Click Save and return the parsed .inkforge file plus its name. */
export async function saveProject(page) {
  const [dl] = await Promise.all([page.waitForEvent('download'), byTip(page, 'Save editable project file (.inkforge)').click()]);
  const text = await readFile(await dl.path(), 'utf8');
  return { name: dl.suggestedFilename(), data: JSON.parse(text), text };
}

/** An element by its tooltip text: the app's Tooltip moves `title` to `data-tip` once the pointer has been over it. */
export function byTip(page, text) {
  const q = JSON.stringify(text);
  return page.locator(`[title=${q}], [data-tip=${q}]`).first();
}

/** Screen position of map point (x, y) in canvas pixels. */
export async function mapToScreen(page, x, y) {
  return page.evaluate(([mx, my]) => {
    const el = document.querySelector('.canvas-transform-wrapper > *');
    const r = el.getBoundingClientRect();
    const w = parseFloat(el.style.width) || el.clientWidth;
    const h = parseFloat(el.style.height) || el.clientHeight;
    return { x: r.left + (mx / w) * r.width, y: r.top + (my / h) * r.height };
  }, [x, y]);
}

export async function pressTool(page, key) {
  await page.locator('.canvas-viewport').hover();
  await page.keyboard.press(key);
}
