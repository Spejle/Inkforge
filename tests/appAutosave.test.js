import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// App.jsx is JSX and cannot run under node:test, so this checks its source: every document field that buildProject
// saves must also be in the autosave effect's dependency list, or editing only that field is never saved
// (fog of war strokes were missed this way).
test('autosave runs when any saved document field changes', () => {
  const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const body = src.match(/const buildProject = \(\) => \(\{([\s\S]*?)\n {2}\}\);/)[1];
  const fields = [...body.matchAll(/^\s{4}(\w+)(?=[,:\n])/gm)].map((m) => m[1]);
  const effect = src.match(/const save = \(\) => \{\s*persist\(buildProject\(\), currentMapId, false\)[\s\S]*?\}, \[([^\]]*)\]\);/)[1];
  const deps = effect.split(',').map((s) => s.trim());
  const stateOf = { title: 'mapTitle', type: 'mapType', width: 'mapWidth', height: 'mapHeight' };
  assert.ok(fields.includes('fog') && fields.length > 10, `parsed ${fields}`);
  for (const f of fields) {
    const dep = stateOf[f] || f;
    if (dep === 'mapType') continue; // follows the template
    assert.ok(deps.includes(dep), `autosave misses ${dep}`);
  }
});
