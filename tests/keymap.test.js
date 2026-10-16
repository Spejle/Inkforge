import test from 'node:test';
import assert from 'node:assert/strict';
import { comboOf, defaultKeymap, bind, unbind, actionFor, loadKeymap } from '../src/utils/keymap.js';
import { makeStepper, stepScale, stepAngle } from '../src/utils/adjust.js';

const ev = (o) => ({ key: '', code: '', ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, getModifierState: () => false, ...o });

test('comboOf: letters, chords, named keys, modifiers alone', () => {
  assert.equal(comboOf(ev({ key: 'v', code: 'KeyV' })), 'V');
  assert.equal(comboOf(ev({ key: 'Z', code: 'KeyZ', ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+Z');
  assert.equal(comboOf(ev({ key: 'z', code: 'KeyZ', metaKey: true })), 'Ctrl+Z');
  assert.equal(comboOf(ev({ key: 'Delete', code: 'Delete' })), 'Delete');
  assert.equal(comboOf(ev({ key: 'Escape', code: 'Escape' })), 'Esc');
  assert.equal(comboOf(ev({ key: 'Shift', code: 'ShiftLeft', shiftKey: true })), null);
});

test('comboOf: punctuation is named by key position, so Shift+[ is Shift+[ (not {)', () => {
  assert.equal(comboOf(ev({ key: '{', code: 'BracketLeft', shiftKey: true })), 'Shift+[');
  assert.equal(comboOf(ev({ key: '>', code: 'Period', shiftKey: true })), 'Shift+.');
});

test('comboOf: AltGr (Ctrl+Alt on Windows) typing [ on a Czech layout is just [', () => {
  const e = ev({ key: '[', code: 'KeyF', ctrlKey: true, altKey: true, getModifierState: (m) => m === 'AltGraph' });
  assert.equal(comboOf(e), '[');
});

test('actionFor: exact binding, Shift fine variant, unknown', () => {
  const m = defaultKeymap();
  assert.deepEqual(actionFor(m, 'V'), { id: 'tool.select', fine: false });
  assert.deepEqual(actionFor(m, 'Ctrl+Y'), { id: 'edit.redo', fine: false });
  assert.deepEqual(actionFor(m, ']'), { id: 'stamp.rotateCw', fine: false });
  assert.deepEqual(actionFor(m, 'Shift+]'), { id: 'stamp.rotateCw', fine: true });
  assert.deepEqual(actionFor(m, 'Shift+,'), { id: 'stamp.rotateCcw', fine: true });
  assert.equal(actionFor(m, 'Shift+V'), null); // Shift only widens actions marked fine
  assert.equal(actionFor(m, null), null);
});

test('bind: replaces a slot, takes a combo from its previous owner, adds, removes', () => {
  let m = defaultKeymap();
  let r = bind(m, 'tool.brush', 0, 'W');
  assert.deepEqual(r.map['tool.brush'], ['W']);
  assert.equal(r.displaced, null);
  r = bind(r.map, 'tool.mask', 0, 'W'); // W was the brush's
  assert.deepEqual(r.map['tool.mask'], ['W']);
  assert.deepEqual(r.map['tool.brush'], []);
  assert.equal(r.displaced, 'tool.brush');
  r = bind(r.map, 'edit.undo', -1, 'U');
  assert.deepEqual(r.map['edit.undo'], ['Ctrl+Z', 'U']);
  assert.deepEqual(unbind(r.map, 'edit.undo', 0)['edit.undo'], ['U']);
  assert.deepEqual(defaultKeymap()['tool.brush'], ['B']); // defaults untouched
});

test('loadKeymap: defaults when storage is missing or junk', () => {
  globalThis.localStorage = { getItem: () => '{"tool.brush":["Q"],"tool.mask":[1],"nope":["Z"]}', setItem() {} };
  const m = loadKeymap();
  assert.deepEqual(m['tool.brush'], ['Q']);
  assert.deepEqual(m['tool.mask'], ['M']); // malformed entry ignored
  assert.equal(m.nope, undefined);
  delete globalThis.localStorage;
  assert.deepEqual(loadKeymap()['tool.select'], ['V']);
});

test('makeStepper: one notch is one step, trackpad deltas accumulate, reversal resets', () => {
  const s = makeStepper(100);
  assert.equal(s(-100), 1);
  assert.equal(s(100), -1);
  assert.equal(s(-30) + s(-30) + s(-30), 0);
  assert.equal(s(-30), 1); // 120 accumulated
  assert.equal(s(-50), 0);
  assert.equal(s(50), 0); // reversal drops the leftover
  assert.equal(s(0), 0);
});

test('stepScale: multiplicative, clamped, never stuck on small values', () => {
  assert.equal(stepScale(100, 1, { min: 15, max: 240, factor: 1.08 }), 108);
  assert.equal(stepScale(15, -1, { min: 15, max: 240 }), 15);
  assert.equal(stepScale(240, 3, { min: 15, max: 240 }), 240);
  assert.equal(stepScale(10, 1, { min: 4, max: 60, factor: 1.04 }), 11); // 10.4 rounds back to 10, so it is nudged a whole unit
  assert.equal(stepScale(1, 1, { min: 0.3, max: 3, factor: 1.06, decimals: 2 }), 1.06);
});

test('stepAngle: degrees per step, wraps at +-PI', () => {
  assert.equal(stepAngle(0, 1, 5), 0.087);
  assert.equal(stepAngle(0, -2, 15), -0.524);
  assert.equal(stepAngle(3.1, 1, 5), -3.096); // crosses PI
  assert.equal(stepAngle(-3.1, -1, 5), 3.096);
});

import { pickQuality, qualityCap } from '../src/utils/quality.js';

test('qualityCap: small maps can go to 4x, big maps stay near 1x', () => {
  assert.equal(qualityCap(1000, 700), 4);
  assert.ok(Math.abs(qualityCap(2800, 1800) - 2.67) < 0.01);
  assert.ok(qualityCap(4000, 2800) < 1.8);
  assert.equal(qualityCap(20000, 20000), 1);
});

test('pickQuality: rises in steps, falls only well below, respects the cap', () => {
  assert.equal(pickQuality(0.5, 1, 1920, 1080), 1);
  assert.equal(pickQuality(1.2, 1, 1920, 1080), 1.5);
  assert.equal(pickQuality(2, 1, 1920, 1080), 2);
  assert.equal(pickQuality(4, 1, 1920, 1080), 4);
  assert.equal(pickQuality(8, 1, 1920, 1080), 4); // never above 4
  assert.equal(pickQuality(2.5, 4, 1920, 1080), 4); // not below half of the current level: stays
  assert.equal(pickQuality(1.6, 4, 1920, 1080), 2); // well below: drops to the level that is nearly enough
  assert.equal(pickQuality(1.5, 4, 1920, 1080), 1.5);
  assert.equal(pickQuality(4, 1, 2800, 1800), qualityCap(2800, 1800)); // capped by map size
  assert.equal(pickQuality(0.2, 2, 1920, 1080), 1);
});
