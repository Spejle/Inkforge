// End-to-end brush drag in the real editor: node tests/bench/runAppStroke.mjs [--map "Stress Atlas"] [--tool B|M] [--moves 40]
// Opens the app (Vite dev server, headless Chromium, ?renderer=2d), opens a sample map by title, picks the Biome brush (B)
// or the Landmass Sculptor (M) and drags across the map with one pointer move per animation frame. Reports the time
// between painted frames during the drag (React, plan and render included) and the frame after release.
import { createServer } from 'vite';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const title = arg('map', 'Stress Atlas');
const tool = arg('tool', 'B');
const moves = +arg('moves', 40);

const server = await createServer({ server: { port: 0 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(server.resolvedUrls.local[0] + '?renderer=2d');
  await page.getByText(title, { exact: false }).first().click();
  const canvas = page.locator('canvas.main-map-canvas');
  await canvas.waitFor({ timeout: 120000 });
  await page.waitForTimeout(8000); // first paint of a big map, fonts, autosave
  await page.keyboard.press(tool);
  const box = await canvas.boundingBox();
  const x0 = box.x + box.width * 0.35, y0 = box.y + box.height * 0.4;
  // frame clock: timestamps of painted frames
  await page.evaluate(() => { window.__frames = []; const tick = (t) => { window.__frames.push(t); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  const t0 = await page.evaluate(() => performance.now());
  for (let i = 1; i <= moves; i++) {
    await page.mouse.move(x0 + i * 6, y0 + i * 2.5);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  }
  const t1 = await page.evaluate(() => performance.now());
  await page.mouse.up();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  const t2 = await page.evaluate(() => performance.now());
  const f = await page.evaluate(() => window.__frames);
  const during = f.filter((t) => t > t0 && t <= t1);
  const gaps = during.slice(1).map((t, i) => t - during[i]).sort((a, b) => a - b);
  const med = gaps[Math.floor(gaps.length / 2)], p90 = gaps[Math.floor(gaps.length * 0.9)];
  console.log(JSON.stringify({ title, tool, moves, dragMs: Math.round(t1 - t0), msPerMove: +((t1 - t0) / moves).toFixed(1), frameGapMedian: +med.toFixed(1), frameGapP90: +p90.toFixed(1), releaseMs: Math.round(t2 - t1) }));
} finally {
  await browser.close();
  await server.close();
}
