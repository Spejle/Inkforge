import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURES, feature, install, uninstall, isInstalled, loadError } from '../src/plugins/features.js';

// what the app calls on each plugin module; a missing export breaks only when that plugin is installed, so check here
const API = {
  lighting: ['withLighting', 'drawLighting'], riverGen: ['generateRiver'], weather: ['drawWeather'], maskFill: ['maskFillStroke'],
  vttExport: ['exportToUniversalVtt'], print: ['exportPrintPdf', 'PrintDialog'], layersZip: ['exportLayersZip']
};

test('every marketplace plugin loads and exports what the app calls', async () => {
  assert.deepEqual(FEATURES.map((f) => f.id).sort(), Object.keys(API).sort());
  // Node cannot import the print plugin's .jsx dialog; the Vite build covers that chunk, and print.js is tested on its own
  for (const f of FEATURES.filter((x) => x.id !== 'print')) {
    assert.equal(feature(f.id), null);
    await install(f.id);
    assert.equal(loadError(f.id), null, f.id);
    for (const fn of API[f.id]) assert.equal(typeof feature(f.id)[fn], 'function', `${f.id}.${fn}`);
  }
});

test('uninstall removes the module; unknown ids are ignored', async () => {
  await install('weather');
  uninstall('weather');
  assert.equal(feature('weather'), null);
  assert.equal(isInstalled('weather'), false);
  await install('nope');
  assert.equal(feature('nope'), null);
});
