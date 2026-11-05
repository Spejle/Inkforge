// Drives the real app in a browser for the saving tests: Vite's dev server plus Playwright's Chromium.
// Playwright is not a dependency of the project; when it (or its browser) is missing these tests are skipped.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

export function loadPlaywright() {
  try {
    return createRequire(import.meta.url)('playwright');
  } catch {
    return null;
  }
}

/** Starts the dev server and a browser. `skip` is a reason string when the browser tests cannot run here. */
export async function startApp() {
  const pw = loadPlaywright();
  if (!pw) return { skip: 'playwright is not installed' };
  let browser;
  try {
    browser = await pw.chromium.launch();
  } catch (e) {
    return { skip: 'no browser for playwright: ' + e.message.split('\n')[0] };
  }
  const { createServer } = await import('vite');
  const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  return {
    url,
    browser,
    async close() {
      await browser.close();
      await server.close();
    }
  };
}

/** A page with dialogs recorded (and accepted) and page errors collected. */
export async function openPage(context, url) {
  const page = await context.newPage();
  page.dialogs = [];
  page.errors = [];
  page.on('dialog', (d) => { page.dialogs.push(d.message()); d.accept(); });
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(url);
  return page;
}

/** Every stored project and meta record, straight from IndexedDB. */
export const readLibrary = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  const r = indexedDB.open('inkforge');
  r.onerror = () => reject(r.error);
  r.onsuccess = () => {
    const t = r.result.transaction(['projects', 'meta']);
    const out = {};
    const p = t.objectStore('projects').getAll();
    const m = t.objectStore('meta').getAll();
    t.oncomplete = () => { out.projects = p.result; out.meta = m.result; r.result.close(); resolve(out); };
  };
}));

export const titleInput = (page) => page.locator('input.map-title-input');

/** Creates a blank map from the main menu, names it and waits for its first autosave. */
export async function createMap(page, title) {
  await page.getByText('New map').first().click();
  await page.getByRole('button', { name: /create/i }).click();
  await titleInput(page).fill(title);
  await waitForSave(page);
}

/** Waits until the status bar reports an autosave newer than this call. */
export async function waitForSave(page) {
  await page.waitForTimeout(1700); // autosave debounce is 1.5 s
  await page.waitForFunction(() => /Saved|Save failed|another tab/.test(document.body.innerText), null, { timeout: 5000 });
}

/** Feeds a file into an <input type=file> (the header's or the main menu's). */
export const setFile = (input, name, text) => input.setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
