// Pixel comparison of two folders of PNGs written by runLiveBrush.mjs --png (same file names):
//   node tests/bench/diffPng.mjs <dirA> <dirB> [pattern]
// Prints, per file, how many pixels differ, the largest channel difference and how many differ by more than 2 / 255.
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const [a, b, pattern = ''] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: node tests/bench/diffPng.mjs <dirA> <dirB> [pattern]');
  process.exit(2);
}
const files = readdirSync(a).filter((f) => f.endsWith('.png') && f.includes(pattern) && existsSync(join(b, f))).sort();
const browser = await chromium.launch();
const page = await browser.newPage();
let worst = 0;
for (const f of files) {
  const urls = [a, b].map((d) => 'data:image/png;base64,' + readFileSync(join(d, f)).toString('base64'));
  const r = await page.evaluate(async ([ua, ub]) => {
    const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const [ia, ib] = await Promise.all([load(ua), load(ub)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
    const px = (img) => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, c.width, c.height).data;
    };
    const da = px(ia), db = px(ib);
    let diff = 0, over2 = 0, max = 0;
    for (let i = 0; i < da.length; i += 4) {
      let m = 0;
      for (let k = 0; k < 4; k++) m = Math.max(m, Math.abs(da[i + k] - db[i + k]));
      if (m) diff++;
      if (m > 2) over2++;
      if (m > max) max = m;
    }
    return { w: ia.width, h: ia.height, diff, over2, max };
  }, urls);
  if (r.size) console.log(`${f}: size differs ${r.size}`);
  else console.log(`${f}: ${r.diff} px differ (${(100 * r.diff / (r.w * r.h)).toFixed(4)}%), ${r.over2} by > 2, max ${r.max}`);
  worst = Math.max(worst, r.size ? 255 : r.max);
}
await browser.close();
process.exitCode = worst > 0 ? 1 : 0;
