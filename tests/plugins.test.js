import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePack, satisfies } from '../src/plugins/schema.js';

const example = JSON.parse(readFileSync(new URL('../docs/plugins/examplePack.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(example);
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const withStamp = (s) => { const p = clone(); p.contributes.stamps = [{ id: 'a', name: 'A', ...s }]; return validatePack(p); };

test('accepts the example pack and namespaces every id', () => {
  const r = validatePack(JSON.stringify(example), { appVersion: '1.12.0' });
  assert.ok(r.ok, r.errors.join('; '));
  assert.deepEqual(r.pack.contributes.stamps.map((s) => s.id), ['example-pack:crystal', 'example-pack:standing-stone', 'example-pack:campfire']);
  assert.equal(r.pack.contributes.stamps[2].group, 'example-pack:camp');
  assert.equal(r.pack.contributes.biomes[0].id, 'example-pack:moss');
});

test('rejects malformed JSON and non-objects', () => {
  assert.equal(validatePack('{nope').ok, false);
  assert.equal(validatePack('[]').ok, false);
  assert.equal(validatePack(null).ok, false);
});

test('rejects bad ids, including a namespace-escaping colon', () => {
  for (const id of ['Bad Id', '../x', 'a:b', '', 'x'.repeat(60)]) assert.equal(withStamp({ id, vector: [{ type: 'circle', cx: 5, cy: 5, r: 3 }] }).ok, false, id);
  const p = clone(); p.id = 'evil:pack'; assert.equal(validatePack(p).ok, false);
});

test('accepts an image data URL, rejects scripts and other URLs', () => {
  assert.ok(withStamp({ image: PNG }).ok);
  for (const image of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'data:image/svg+xml;utf8,<svg onload=alert(1)>', 'https://evil.example/x.png', 'data:image/png;base64,AA" onerror="x']) {
    assert.equal(withStamp({ image }).ok, false, image);
  }
});

test('rejects oversize images and packs', () => {
  assert.equal(withStamp({ image: 'data:image/png;base64,' + 'A'.repeat(300 * 1024) }).ok, false);
  assert.equal(validatePack('x'.repeat(6 * 1024 * 1024)).ok, false);
});

test('rejects bad colours, shape types and path data', () => {
  const shape = (o) => withStamp({ vector: [{ type: 'circle', cx: 5, cy: 5, r: 3, ...o }] });
  assert.equal(shape({ fill: 'url(javascript:1)' }).ok, false);
  assert.equal(shape({ fill: 'red; x' }).ok, false);
  assert.equal(withStamp({ vector: [{ type: 'script', src: 'x' }] }).ok, false);
  assert.equal(withStamp({ vector: [{ type: 'path', d: 'M0 0 L1 1 alert(1)' }] }).ok, false);
});

test('rejects too many stamps and unsupported formats', () => {
  const p = clone();
  p.contributes.stamps = Array.from({ length: 501 }, (_, i) => ({ id: 's' + i, vector: [{ type: 'circle', cx: 5, cy: 5, r: 3 }] }));
  assert.equal(validatePack(p).ok, false);
  const q = clone(); q.format = 'other'; assert.equal(validatePack(q).ok, false);
});

test('unknown fields are dropped from the sanitised pack', () => {
  const p = clone(); p.evil = '<script>'; p.contributes.stamps[0].onload = 'x'; p.contributes.code = [1];
  const r = validatePack(p);
  assert.ok(r.ok);
  assert.equal(r.pack.evil, undefined);
  assert.equal(r.pack.contributes.stamps[0].onload, undefined);
  assert.equal(r.pack.contributes.code, undefined);
});

test('inkforgeVersion range is enforced', () => {
  const p = clone(); p.inkforgeVersion = '>=2.0.0';
  assert.equal(validatePack(p, { appVersion: '1.12.0' }).ok, false);
  assert.ok(satisfies('1.12.0', '^1.2.0') && satisfies('1.12.0', '1.x') && !satisfies('2.0.0', '^1.2.0') && satisfies('1.5.0', '>=1.0.0 <2.0.0'));
});
