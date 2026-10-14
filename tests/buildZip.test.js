import test from 'node:test';
import assert from 'node:assert/strict';
import { buildZip } from '../src/utils/exportUtils.js';

test('buildZip: store-only archive with correct entry count, names and sizes', async () => {
  const blob = buildZip([
    { name: 'a.png', data: new Uint8Array([1, 2, 3]) },
    { name: 'b.png', data: new Uint8Array([9, 9]) }
  ]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const dv = new DataView(bytes.buffer);
  assert.equal(dv.getUint32(0, true), 0x04034b50); // local header signature
  const eocd = bytes.length - 22;
  assert.equal(dv.getUint32(eocd, true), 0x06054b50);
  assert.equal(dv.getUint16(eocd + 10, true), 2); // total entries
  const cdOffset = dv.getUint32(eocd + 16, true);
  assert.equal(dv.getUint32(cdOffset, true), 0x02014b50); // central directory starts where EOCD says
  assert.equal(dv.getUint32(cdOffset + 24, true), 3); // first file's uncompressed size
  assert.equal(new TextDecoder().decode(bytes.slice(30, 35)), 'a.png');
});
