#!/usr/bin/env node
// Visual regression suite: `npm run test:visual` (see tests/visual/README.md).
//   node tests/visual/run.mjs [--update] [--only=<text>] [--no-pixi] [--no-app] [--keep]
// Renders every scene of tests/visual/harness.js with the Canvas 2D export path, the Canvas 2D live view and the Pixi
// live view, then checks:
//   baseline   export, shrunk to the stored size, against tests/visual/baselines/<scene>.png
//   live2d     the Canvas 2D live view against the export, full size
//   pixi       the Pixi live view against the export, full size
//   export2x   a 2x export shrunk to 1x against the 1x export (things that change with the export scale)
//   pixi2x     the Pixi view at quality 2 (zoomed in), shrunk to 1x, against the 1x export
//   app        in the real editor (?renderer=pixi), the on-screen canvas against the PNG the Export dialog downloads
// Images of every run (and diff images of failures) go to tests/visual/output/, which is not committed.
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Playwright is not a project dependency (it ships its own browser build); require() also searches NODE_PATH
const { chromium } = createRequire(import.meta.url)('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const BASE_DIR = join(here, 'baselines');
const OUT_DIR = join(here, 'output');

const args = process.argv.slice(2);
const flag = (n) => args.includes('--' + n);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const UPDATE = flag('update');
const ONLY = opt('only');
const PIXI = !flag('no-pixi');
const APP = !flag('no-app');

// Tolerances. A pixel "differs" when a channel is off by more than THRESHOLD (0-255); a check fails when more than
// LIMIT of the pixels differ, or when the mean channel difference passes MEAN_LIMIT (a broad tint shift that stays
// under the threshold everywhere, such as a wrong blend formula on a translucent layer).
const BASELINE_MAX_SIDE = 384; // stored baselines: longest side in px (keeps the whole set under 2 MB)
const THRESHOLD = 32;
const LIMIT = {
  baseline: 0.002, // same backend, same code: only font / driver noise
  live2d: 0.0005, // same drawing code, cached vs direct
  pixi: 0.01, // different compositor: antialiasing and texture filtering at edges
  export2x: 0.02, // drawn at twice the density and shrunk: edges and hatching resample differently
  pixi2x: 0.02,
  app: 0.01
};
const MEAN_LIMIT = { baseline: 0.5, live2d: 0.6, pixi: 1.0, export2x: 4.5, pixi2x: 4.5, app: 1.5 };
// The editor checks need a window large enough to show the map at 100 %; the big samples are covered by `pixi` above
const APP_SCENES = ['map_shattered_archipelago', 'map_sundered_realms', 'map_city_demo', 'map_battle_demo'];

const dataUrl = (buf) => 'data:image/png;base64,' + buf.toString('base64');
const fromDataUrl = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
const pct = (f) => (f * 100).toFixed(3) + '%';

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(BASE_DIR, { recursive: true });

  const server = await createServer({ root, configFile: join(root, 'vite.config.js'), logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none']
  });
  const results = [];
  try {
    const page = await newPage(browser, { width: 1280, height: 800 });
    await page.goto(url + 'tests/visual/harness.html');
    await page.waitForFunction(() => window.inkTestReady === true, null, { timeout: 120000 });
    const scenes = (await page.evaluate(() => window.inkTest.scenes())).filter((s) => !ONLY || s.includes(ONLY));
    for (const scene of scenes) await runScene(page, scene, results);
    await page.close();
    if (APP && !UPDATE) for (const scene of APP_SCENES.filter((s) => !ONLY || s.includes(ONLY))) await runApp(browser, url, scene, results);
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('');
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    const what = r.note ? r.note : `${pct(r.fraction)} differ (limit ${pct(r.limit)}), mean ${r.mean?.toFixed(2)} (limit ${r.meanLimit}), max ${r.max}${r.box ? `, box ${r.box.join(',')}` : ''}`;
    console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.check.padEnd(8)} ${r.scene.padEnd(30)} ${what}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed. Images: ${OUT_DIR}`);
  process.exitCode = failed.length ? 1 : 0;
}

async function newPage(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  // only the local server: web fonts would make text depend on the network, so labels use the fallback fonts
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('requestfailed', () => {}); // the blocked web fonts; their console errors are filtered below
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/willReadFrequently|ERR_FAILED/.test(m.text())) console.error(`page ${m.type()}:`, m.text()); });
  return page;
}

function record(results, check, scene, r, limit, files) {
  const ok = !r.sizeMismatch && r.fraction <= limit && r.mean <= MEAN_LIMIT[check];
  results.push({ check, scene, ok, limit, meanLimit: MEAN_LIMIT[check], ...r, diff: undefined, note: r.sizeMismatch ? `size ${r.a} vs ${r.b}` : undefined });
  if (files.diff) return writeFile(join(OUT_DIR, `${scene}.${check}-diff.png`), fromDataUrl(files.diff));
}

async function runScene(page, scene, results) {
  const { width, height } = await page.evaluate((s) => window.inkTest.size(s), scene);
  // 2x only where the editor would go that high (utils/quality.js caps the density at sqrt(36e6 / pixels))
  const hi = width * height * 4 <= 36e6;
  const backends = ['export', 'live2d', ...(hi ? ['export2x'] : []), ...(PIXI ? ['pixi', ...(hi ? ['pixi2x'] : [])] : [])];
  const times = [];
  for (const b of backends) {
    const t = await page.evaluate(([s, b]) => window.inkTest.render(s, b), [scene, b]);
    times.push(`${b} ${t.ms} ms`);
    const img = await page.evaluate(([s, b]) => window.inkTest.image(s, b), [scene, b]);
    await writeFile(join(OUT_DIR, `${scene}.${b}.png`), fromDataUrl(img));
  }
  console.log(`${scene}: ${times.join(', ')}`);

  const basePath = join(BASE_DIR, scene + '.png');
  if (UPDATE || !existsSync(basePath)) {
    const img = await page.evaluate(([s, m]) => window.inkTest.image(s, 'export', m), [scene, BASELINE_MAX_SIDE]);
    await writeFile(basePath, fromDataUrl(img));
    results.push({ check: 'baseline', scene, ok: true, note: UPDATE ? 'baseline written' : 'NEW baseline written (commit it)' });
  } else {
    const base = dataUrl(await readFile(basePath));
    const r = await page.evaluate(([s, u, t]) => window.inkTest.compareBaseline(s, 'export', u, { threshold: t }), [scene, base, THRESHOLD]);
    await record(results, 'baseline', scene, r, LIMIT.baseline, r);
    if (r.fraction > LIMIT.baseline) await writeFile(join(OUT_DIR, `${scene}.baseline-current.png`), fromDataUrl(r.current));
  }
  for (const b of backends.slice(1)) {
    const r = await page.evaluate(([s, b, t]) => window.inkTest.compare(s, 'export', b, { threshold: t }), [scene, b, THRESHOLD]);
    await record(results, b, scene, r, LIMIT[b], r);
  }
  await page.evaluate((s) => window.inkTest.forget(s), scene);
}

/** Opens a sample in the editor on the Pixi view, screenshots the map canvas at 100 % and exports a 1x PNG. */
async function runApp(browser, url, scene, results) {
  const id = scene.replace(/^map_/, '');
  const size = await (async () => {
    const p = await newPage(browser, { width: 800, height: 600 });
    await p.goto(url + 'tests/visual/harness.html');
    await p.waitForFunction(() => window.inkTestReady === true);
    const s = await p.evaluate((sc) => window.inkTest.render(sc, 'export'), scene);
    await p.close();
    return s;
  })();
  // room for the rails, panel and header around a 100 % map (fitToScreen picks min(1, ...))
  const page = await newPage(browser, { width: size.width + 420, height: size.height + 160 });
  try {
    await page.goto(url + '?renderer=pixi');
    const title = await page.evaluate(async (pid) => (await import('/src/engine/presetMaps.js')).PRESET_MAPS.find((p) => p.id === pid).title, id);
    await page.locator('.map-card', { hasText: title }).first().click();
    const canvas = page.locator('canvas.main-map-canvas');
    await canvas.waitFor({ timeout: 120000 });
    await page.mouse.move(1, 1); // no hover ring over the map
    // wait for the view to settle: two equal screenshots in a row
    let prev = null, shot = null;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(500);
      shot = await canvas.screenshot({ animations: 'disabled' });
      if (prev && shot.equals(prev)) break;
      prev = shot;
    }
    const box = await canvas.boundingBox();
    if (Math.round(box.width) !== size.width || Math.round(box.height) !== size.height) {
      results.push({ check: 'app', scene, ok: false, note: `canvas shown at ${box.width}x${box.height}, expected 100 %` });
      return;
    }
    await writeFile(join(OUT_DIR, `${scene}.app-live.png`), shot);
    // export through the dialog: PNG (the default), grid on (the default), 1x (the default is 2x)
    await page.getByRole('button', { name: /export/i }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Export' });
    await dialog.getByRole('button', { name: /^PNG/ }).first().click();
    await dialog.getByRole('button', { name: /^1× ·/ }).click();
    const dl = page.waitForEvent('download', { timeout: 120000 });
    await dialog.getByRole('button', { name: 'Download' }).click();
    const file = await (await dl).path();
    const exported = await readFile(file);
    await writeFile(join(OUT_DIR, `${scene}.app-export.png`), exported);
    const r = await page.evaluate(async ([a, b, t]) => {
      const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const flat = (img) => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, c.width, c.height);
      };
      const A = flat(ia), B = flat(ib);
      if (A.width !== B.width || A.height !== B.height) return { sizeMismatch: true, a: [A.width, A.height], b: [B.width, B.height], fraction: 1 };
      const c = document.createElement('canvas');
      c.width = A.width; c.height = A.height;
      const g = c.getContext('2d');
      const out = g.createImageData(A.width, A.height);
      let bad = 0, sum = 0, max = 0;
      for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
        sum += d; if (d > max) max = d;
        const l = (A.data[i] * 0.3 + A.data[i + 1] * 0.59 + A.data[i + 2] * 0.11) * 0.35 + 165;
        if (d > t) { bad++; out.data.set([230, 20, 20, 255], i); } else out.data.set([l, l, l, 255], i);
      }
      g.putImageData(out, 0, 0);
      return { fraction: bad / (A.width * A.height), mean: sum / (A.width * A.height), max, diff: c.toDataURL('image/png') };
    }, [dataUrl(shot), dataUrl(exported), THRESHOLD]);
    await record(results, 'app', scene, r, LIMIT.app, r);
    console.log(`${scene}: app checked`);
  } catch (e) {
    results.push({ check: 'app', scene, ok: false, note: 'error: ' + e.message.split('\n')[0] });
  } finally {
    await page.close();
  }
}

await main();
