import test from 'node:test';
import assert from 'node:assert';
import { buildPdf } from '../src/plugins/builtin/print/print.js';

test('buildPdf: generates minimal PDF 1.4 from fake pages with valid structure and xref offsets', () => {
  const fakePages = [
    { w: 10, h: 10, wPt: 7.2, hPt: 7.2, jpeg: new Uint8Array([1, 2, 3]) },
    { w: 10, h: 10, wPt: 7.2, hPt: 7.2, jpeg: new Uint8Array([1, 2, 3]) }
  ];

  const pdfBytes = buildPdf(fakePages);

  // Assert return type is Uint8Array
  assert.ok(pdfBytes instanceof Uint8Array, 'buildPdf should return a Uint8Array');

  const dec = new TextDecoder();
  const pdfString = dec.decode(pdfBytes);

  // Assert output starts with '%PDF-1.4'
  assert.ok(pdfString.startsWith('%PDF-1.4'), 'PDF output should start with %PDF-1.4');

  // Assert output ends with '%%EOF'
  assert.ok(pdfString.endsWith('%%EOF'), 'PDF output should end with %%EOF');

  // Assert output contains '/Count 2'
  assert.ok(pdfString.includes('/Count 2'), 'PDF output should contain /Count 2');

  // Assert the xref offsets each point at the text 'N 0 obj'
  // For 2 pages, count = 3 + 2 * 3 = 9 (objects 1 through 8).
  // In buildPdf:
  // obj 1: Catalog
  // obj 2: Pages
  // obj 3: Page 1
  // obj 4: Contents 1
  // obj 5: Image XObject 1
  // obj 6: Page 2
  // obj 7: Contents 2
  // obj 8: Image XObject 2
  const xrefMatches = [...pdfString.matchAll(/(\d{10}) 00000 n/g)];
  assert.strictEqual(xrefMatches.length, 8, 'There should be 8 object xref entries for 2 pages');

  xrefMatches.forEach((match, index) => {
    const objNum = index + 1;
    const offset = parseInt(match[1], 10);
    const expected = `${objNum} 0 obj`;
    const slice = dec.decode(pdfBytes.subarray(offset, offset + expected.length));
    assert.strictEqual(slice, expected, `xref offset ${offset} for object ${objNum} must point to "${expected}"`);
  });
});
