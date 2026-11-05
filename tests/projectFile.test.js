import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProjectText, ProjectFileError } from '../src/utils/projectFormat.js';

const message = (text) => {
  try { parseProjectText(text); } catch (e) { assert.ok(e instanceof ProjectFileError, JSON.stringify(text)); return e.message; }
  assert.fail(`accepted ${JSON.stringify(text)}`);
};

test('files that are not maps are refused with a readable error instead of opening as a blank map', () => {
  for (const text of ['', '   ', '[]', 'null', '42', '"text"', '{}', '{"foo":1}']) assert.ok(message(text).length > 0);
  assert.match(message('{"title":"Valoria","landmasses":[{"points":[[1,2],'), /damaged or incomplete/); // truncated download
  assert.match(message('{"format":"inkforge-plugin","version":1,"id":"p","name":"P","contributes":{}}'), /content pack/);
  const ok = parseProjectText(JSON.stringify({ title: 'Valoria', width: 800, height: 600, landmasses: [] }));
  assert.equal(ok.title, 'Valoria');
  assert.equal(ok.width, 800);
});
