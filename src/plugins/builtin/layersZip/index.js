// Layers ZIP: one transparent PNG per layer plus the flattened map, in a store-only ZIP.
import { renderMap } from '../../../engine/renderer.js';
import { download } from '../../../utils/exportUtils.js';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Minimal store-only ZIP writer (PNGs are already compressed). files: [{ name, data: Uint8Array }] */
export function buildZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  const u16 = (n) => [n & 255, (n >> 8) & 255];
  const u32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const head = Uint8Array.from([
      0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0)
    ]);
    chunks.push(head, name, f.data);
    central.push(Uint8Array.from([
      0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset)
    ]), name);
    offset += head.length + name.length + f.data.length;
  }
  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = Uint8Array.from([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), 0, 0]);
  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

const toPngBytes = (canvas) =>
  new Promise((resolve) => canvas.toBlob(async (b) => resolve(new Uint8Array(await b.arrayBuffer())), 'image/png'));

/**
 * One transparent PNG per layer (sea, land, rivers, stamps, each custom layer, labels, grid) plus the
 * flattened map, bundled in a ZIP, so the layers can be recombined in an image editor or a VTT.
 */
export async function exportLayersZip({ mapState, scaleFactor = 1, includeGrid = true, filename = 'map_layers.zip' }) {
  const { mapWidth, mapHeight, layerVisibility = {}, layerStyle = {} } = mapState;
  const keys = [
    'background', 'land', 'paths', 'stamps',
    ...Object.keys(layerStyle).filter((k) => k.startsWith('c_')),
    'text', 'grid'
  ];
  const label = (k) => (k.startsWith('c_') ? layerStyle[k]?.name || k : k);
  const render = (visible) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(mapWidth * scaleFactor);
    canvas.height = Math.round(mapHeight * scaleFactor);
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
    renderMap({
      ...mapState,
      ctx,
      width: mapWidth,
      height: mapHeight,
      grid: { ...mapState.grid, enabled: includeGrid && mapState.grid.enabled },
      layerVisibility: visible,
      selectedStampId: null,
      selectedTextId: null,
      selectedPathId: null
    });
    return canvas;
  };
  const files = [{ name: 'flattened.png', data: await toPngBytes(render({ ...layerVisibility, atmosphere: true })) }];
  let n = 1;
  for (const k of keys) {
    if (layerVisibility[k] === false) continue;
    const only = Object.fromEntries(Object.keys(layerVisibility).map((x) => [x, false]));
    only[k] = true;
    files.push({
      name: `${String(n++).padStart(2, '0')}_${label(k).replace(/[^a-zA-Z0-9_-]+/g, '_')}.png`,
      data: await toPngBytes(render(only))
    });
  }
  download(buildZip(files), filename);
}
