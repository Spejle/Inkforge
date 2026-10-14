// Print at table scale: tiles the map across paper sheets and writes a PDF (JPEG pages, no library).
import { renderMap } from '../engine/renderer.js';

export const PAPERS = { A4: [210, 297], Letter: [215.9, 279.4], A3: [297, 420], Poster: [610, 914] };
const DPI = 150;
const MARGIN_MM = 10;

/** Plan the sheet grid. Pure, so the page count can be shown live in the dialog. */
export function planPrint({ mapWidth, mapHeight, gridSize, paper, landscape, scaleMode, squareInches, overlapMm }) {
  let [pw, ph] = PAPERS[paper] || PAPERS.A4;
  if (landscape) [pw, ph] = [ph, pw];
  const printW = pw - 2 * MARGIN_MM;
  const printH = ph - 2 * MARGIN_MM;
  let pxPerMm = gridSize / (25.4 * squareInches);
  if (scaleMode === 'fit') pxPerMm = Math.max(mapWidth / printW, mapHeight / printH); // whole map on one sheet
  const mapMmW = mapWidth / pxPerMm;
  const mapMmH = mapHeight / pxPerMm;
  const stepW = printW - overlapMm;
  const stepH = printH - overlapMm;
  const cols = Math.max(1, Math.ceil((mapMmW - overlapMm) / stepW - 1e-6));
  const rows = Math.max(1, Math.ceil((mapMmH - overlapMm) / stepH - 1e-6));
  return { pw, ph, printW, printH, pxPerMm, mapMmW, mapMmH, stepW, stepH, cols, rows, pages: cols * rows };
}

export function exportPrintPdf({ mapState, options, filename = 'map_print.pdf' }) {
  const plan = planPrint({ ...options, mapWidth: mapState.mapWidth, mapHeight: mapState.mapHeight, gridSize: mapState.grid.size || 60 });
  const { pw, ph, printW, printH, pxPerMm, mapMmW, mapMmH, stepW, stepH, cols, rows } = plan;
  const mm2px = DPI / 25.4;

  // Whole map once at print resolution, then cut per sheet.
  const k = mm2px / pxPerMm; // map px -> print px
  const full = document.createElement('canvas');
  full.width = Math.ceil(mapState.mapWidth * k);
  full.height = Math.ceil(mapState.mapHeight * k);
  const fctx = full.getContext('2d');
  fctx.scale(k, k);
  renderMap({
    ctx: fctx,
    width: mapState.mapWidth,
    height: mapState.mapHeight,
    ...mapState,
    grid: { ...mapState.grid, enabled: options.printGrid && mapState.grid.enabled },
    selectedStampId: null,
    selectedTextId: null,
    selectedPathId: null
  });
  if (options.inkSaver) {
    fctx.fillStyle = 'rgba(255,255,255,0.35)';
    fctx.fillRect(0, 0, full.width, full.height);
  }

  const pages = [];
  const pageCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.round(w * mm2px);
    c.height = Math.round(h * mm2px);
    const c2 = c.getContext('2d');
    c2.fillStyle = '#fff';
    c2.fillRect(0, 0, c.width, c.height);
    return [c, c2];
  };

  if (options.guide && cols * rows > 1) {
    const [c, g] = pageCanvas(pw, ph);
    g.fillStyle = '#222';
    g.font = `${6 * mm2px}px sans-serif`;
    g.fillText(mapState.mapTitle || 'Map', MARGIN_MM * mm2px, 25 * mm2px);
    g.font = `${3.5 * mm2px}px sans-serif`;
    g.fillText(`${cols} × ${rows} sheets. Trim to the join marks, overlap by ${options.overlapMm} mm.`, MARGIN_MM * mm2px, 33 * mm2px);
    const cell = Math.min(30, (pw - 2 * MARGIN_MM) / cols);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = MARGIN_MM * mm2px + q * cell * mm2px;
      const y = 45 * mm2px + r * cell * 0.75 * mm2px;
      g.strokeRect(x, y, cell * mm2px, cell * 0.75 * mm2px);
      g.fillText(String(r * cols + q + 1), x + 3 * mm2px, y + 8 * mm2px);
    }
    pages.push(c);
  }

  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const [c, g] = pageCanvas(pw, ph);
      const sx = q * stepW * mm2px;
      const sy = r * stepH * mm2px;
      const sw = Math.min(printW * mm2px, full.width - sx);
      const sh = Math.min(printH * mm2px, full.height - sy);
      if (sw > 0 && sh > 0) g.drawImage(full, sx, sy, sw, sh, MARGIN_MM * mm2px, MARGIN_MM * mm2px, sw, sh);
      if (options.marks) {
        // crop crosses in the four margin corners + sheet number
        g.strokeStyle = '#000';
        g.lineWidth = 1;
        const L = 6 * mm2px;
        for (const [cx, cy] of [[MARGIN_MM, MARGIN_MM], [pw - MARGIN_MM, MARGIN_MM], [MARGIN_MM, ph - MARGIN_MM], [pw - MARGIN_MM, ph - MARGIN_MM]]) {
          g.beginPath();
          g.moveTo(cx * mm2px - L / 2, cy * mm2px); g.lineTo(cx * mm2px + L / 2, cy * mm2px);
          g.moveTo(cx * mm2px, cy * mm2px - L / 2); g.lineTo(cx * mm2px, cy * mm2px + L / 2);
          g.stroke();
        }
        g.fillStyle = '#000';
        g.font = `${3 * mm2px}px sans-serif`;
        g.fillText(`Sheet ${r * cols + q + 1} / ${cols * rows}  (col ${q + 1}, row ${r + 1})`, MARGIN_MM * mm2px, (ph - 3) * mm2px);
      }
      pages.push(c);
    }
  }

  const bytes = buildPdf(pages.map((c) => ({
    w: c.width, h: c.height, wPt: (c.width / DPI) * 72, hPt: (c.height / DPI) * 72,
    jpeg: Uint8Array.from(atob(c.toDataURL('image/jpeg', 0.9).split(',')[1]), (ch) => ch.charCodeAt(0))
  })));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  return { ...plan, mapMmW, mapMmH };
}

/** Minimal PDF 1.4 writer: one full-page JPEG per page. */
export function buildPdf(pages) {
  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let len = 0;
  const push = (d) => { const b = typeof d === 'string' ? enc.encode(d) : d; chunks.push(b); len += b.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); push(body); push('\nendobj\n'); };
  push('%PDF-1.4\n');
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((p, i) => {
    const n = 3 + i * 3;
    const content = `q ${p.wPt.toFixed(2)} 0 0 ${p.hPt.toFixed(2)} 0 0 cm /Im0 Do Q`;
    obj(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.wPt.toFixed(2)} ${p.hPt.toFixed(2)}] /Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
    obj(n + 1, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    offsets[n + 2] = len;
    push(`${n + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
    push(p.jpeg);
    push('\nendstream\nendobj\n');
  });
  const count = 3 + pages.length * 3;
  const xref = len;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let i = 1; i < count; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const out = new Uint8Array(len);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
