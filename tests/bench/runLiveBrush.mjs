// Live brush benchmark: node tests/bench/runLiveBrush.mjs [--maps a,b] [--tools mask,brush] [--runs 3] [--frames 30] [--png dir]
// Starts a Vite dev server, opens tests/bench/liveBrush.html in headless Chromium (Playwright) and replays brush drags.
// Prints per-frame live render time (median and p90 over the drag, then median over runs), the first full render and the
// release (full-quality pass after the stroke is committed). With --png, writes the final and last live frame of each
// case so two builds can be compared with tests/bench/diffPng.mjs.
// Headless Chromium here renders Canvas 2D in software; a real GPU-composited browser is faster overall.
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Playwright is not a project dependency: use the one installed with the browser (or `npm i -D playwright`)
const { chromium } = createRequire(import.meta.url)('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const maps = arg('maps', 'shattered_archipelago,obsidian_reach').split(',');
const tools = arg('tools', 'mask,brush').split(',');
const runs = +arg('runs', 3);
const frames = +arg('frames', 30);
const pngDir = arg('png', null);

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const p90 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]; };

const server = await createServer({ server: { port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0] + 'tests/bench/liveBrush.html';
const browser = await chromium.launch();
const rows = [];
try {
  for (const map of maps) {
    for (const tool of tools) {
      const acc = { live: [], p90: [], first: [], release: [] };
      let info;
      for (let r = 0; r < runs; r++) {
        const page = await browser.newPage(); // fresh page: no caches carried over between runs
        page.on('pageerror', (e) => console.error('page error:', e.message));
        await page.goto(url);
        await page.waitForFunction(() => window.benchReady, null, { timeout: 120000 });
        info = await page.evaluate((o) => window.bench(o), { map, tool, frames, png: !!pngDir && r === 0 });
        const live = info.live.slice(1); // the first frame also builds the stroke's caches; report it apart
        acc.live.push(median(live));
        acc.p90.push(p90(live));
        acc.first.push(info.first);
        acc.release.push(info.release);
        if (pngDir && r === 0) {
          mkdirSync(pngDir, { recursive: true });
          for (const k of ['final', 'lastLive']) writeFileSync(join(pngDir, `${map}_${tool}_${k}.png`), Buffer.from(info[k].split(',')[1], 'base64'));
        }
        await page.close();
      }
      const row = { map: `${map} ${info.W}x${info.H}`, tool, livePerFrame: median(acc.live), liveP90: median(acc.p90), firstFrame: info.live[0], release: median(acc.release), fullRender: median(acc.first) };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
} finally {
  await browser.close();
  await server.close();
}
console.log('\n| map | tool | live ms/frame (median) | live p90 | release ms | first full render ms |');
console.log('|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.map} | ${r.tool} | ${r.livePerFrame.toFixed(0)} | ${r.liveP90.toFixed(0)} | ${r.release.toFixed(0)} | ${r.fullRender.toFixed(0)} |`);
