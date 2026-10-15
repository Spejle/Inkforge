import test from 'node:test';
import assert from 'node:assert/strict';
import { safeImageSrc, clampDim, sanitizeProject } from '../src/utils/importGuard.js';

test('safeImageSrc: only embedded images pass', () => {
  assert.equal(safeImageSrc('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
  assert.equal(safeImageSrc('data:image/svg+xml;utf8,<svg/>') !== null, true);
  for (const bad of ['https://evil.example/x.png', '//evil.example/x.png', 'javascript:alert(1)', 'data:text/html;base64,AAAA', '', null, {}, 5]) {
    assert.equal(safeImageSrc(bad), null, String(bad));
  }
});

test('clampDim: sizes are bounded, junk falls back', () => {
  assert.equal(clampDim(1e9, 1920), 8000);
  assert.equal(clampDim(-5, 1920), 64);
  assert.equal(clampDim('2400', 1920), 2400);
  assert.equal(clampDim('abc', 1080), 1080);
  assert.equal(clampDim(undefined, 1080), 1080);
});

test('sanitizeProject: malformed and hostile projects are neutralised', () => {
  const p = sanitizeProject({
    width: 1e12, height: 'x', landmasses: 'oops', paths: [null, 7, { a: 1 }], texts: { length: 3 },
    stamps: [{ id: 'a', customImage: 'https://evil.example/t.gif' }, { id: 'b', customImage: { src: 'https://evil.example/t.gif' } }, { id: 'c', customImage: 'data:image/png;base64,AAAA' }],
    customStamps: [{ dataUrl: 'https://evil.example/t.gif' }, { dataUrl: 'data:image/webp;base64,AAAA' }]
  });
  assert.equal(p.width, 8000);
  assert.equal(p.height, 1080);
  assert.deepEqual(p.landmasses, []);
  assert.deepEqual(p.paths, [{ a: 1 }]);
  assert.deepEqual(p.texts, []);
  assert.deepEqual(p.stamps.map((s) => s.customImage), [null, null, 'data:image/png;base64,AAAA']);
  assert.equal(p.customStamps.length, 1);
  assert.deepEqual(sanitizeProject(null).landmasses, []);
});
