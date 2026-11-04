import { test } from 'node:test';
import assert from 'node:assert/strict';

// a 1.13 user (old 'inkforge.features' settings) opening this version for the first time; set up before the module
// reads localStorage at import
const store = new Map([['inkforge.features', JSON.stringify({ weather: false })]]);
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; }
};
Object.defineProperty(globalThis.localStorage, 'keys', { value: () => [...store.keys()] });

test('upgrading from 1.13 keeps the old features but does not install plugins added since', async () => {
  const { loadFeatures, isInstalled, FEATURES, LEGACY_FEATURES } = await import('../src/plugins/features.js');
  await loadFeatures();
  for (const id of LEGACY_FEATURES) assert.equal(isInstalled(id), id !== 'weather', id);
  const added = FEATURES.map((f) => f.id).filter((id) => !LEGACY_FEATURES.includes(id));
  assert.ok(added.includes('fog') && added.includes('worldGen'));
  for (const id of added) assert.equal(isInstalled(id), false, `${id} must stay opt-in`);
  assert.deepEqual(JSON.parse(store.get('inkforge.plugins')).sort(), LEGACY_FEATURES.filter((id) => id !== 'weather').sort());
});
