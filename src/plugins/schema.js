// Plugin packs are DATA ONLY: the CSP allows no remote or eval'd script, and a pack is never executed.
// validatePack() is the single gate: everything not on an allow-list is dropped or rejected, ids are namespaced.

export const LIMITS = { pack: 5 * 1024 * 1024, stamps: 500, image: 256 * 1024, shapes: 64, points: 256, path: 4000, biomes: 100, presets: 50, templates: 50, text: 200 };
export const FORMAT = 'inkforge-plugin';

const ID = /^[a-z0-9][a-z0-9_-]{0,47}$/;
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3}|1\.0)\s*)?\)$/i;
const IMG = /^data:image\/(?:png|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
const PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9eE+\-.,\s]+$/;
const ROTATE = ['free', 'fixed'];
const BLENDS = ['multiply', 'screen', 'overlay', 'soft-light', 'source-over'];
const WEATHER = ['rain', 'snow'];

/** A colour literal, or the stamp tokens "$color" (ink) / "$fill" (paper) / "none". */
export const isColor = (v) => typeof v === 'string' && (v === 'none' || v === '$color' || v === '$fill' || HEX.test(v) || RGB.test(v));

// ---- tiny semver range: "*", "1.x", "^1.2.0", ">=1.11.0 <2.0.0", "1.12.0" ----
const parse = (v) => { const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v); return m ? [+m[1], +m[2], +m[3]] : null; };
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
export function satisfies(version, range) {
  const v = parse(version);
  if (!v || typeof range !== 'string') return false;
  return range.trim().split(/\s+/).every((c) => {
    if (c === '*' || c === 'x') return true;
    let m = /^(\d+)\.x$/.exec(c);
    if (m) return v[0] === +m[1];
    m = /^(\^|>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/.exec(c);
    if (!m) return false;
    const t = parse(m[2]), d = cmp(v, t);
    switch (m[1]) {
      case '^': return d >= 0 && v[0] === t[0];
      case '>=': return d >= 0;
      case '<=': return d <= 0;
      case '>': return d > 0;
      case '<': return d < 0;
      default: return d === 0;
    }
  });
}
export const validRange = (r) => typeof r === 'string' && r.length < 60 && r.trim().split(/\s+/).every((c) => c === '*' || c === 'x' || /^(\d+\.x|(\^|>=|<=|>|<|=)?\d+\.\d+\.\d+)$/.test(c));

const num = (v, lo, hi, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const text = (v, max = LIMITS.text) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : '');

function shape(s, err, where) {
  if (!s || typeof s !== 'object') return err(`${where}: shape is not an object`), null;
  const out = {};
  for (const k of ['fill', 'stroke']) {
    if (s[k] === undefined) continue;
    if (!isColor(s[k])) return err(`${where}: bad ${k} colour`), null;
    out[k] = s[k];
  }
  if (s.lineWidth !== undefined) out.lineWidth = num(s.lineWidth, 0, 20, 1);
  if (s.opacity !== undefined) out.opacity = num(s.opacity, 0, 1, 1);
  const c = (k, lo = -50, hi = 150) => num(s[k], lo, hi, 0);
  switch (s.type) {
    case 'circle': return { type: 'circle', cx: c('cx'), cy: c('cy'), r: num(s.r, 0, 150, 10), ...out };
    case 'rect': return { type: 'rect', x: c('x'), y: c('y'), w: num(s.w, 0, 200, 10), h: num(s.h, 0, 200, 10), rx: num(s.rx, 0, 100, 0), ...out };
    case 'polygon': {
      if (!Array.isArray(s.points) || s.points.length < 3 || s.points.length > LIMITS.points) return err(`${where}: polygon needs 3-${LIMITS.points} points`), null;
      const pts = s.points.map((p) => (Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n)) ? [num(p[0], -50, 150, 0), num(p[1], -50, 150, 0)] : null));
      if (pts.includes(null)) return err(`${where}: polygon points must be [x, y] numbers`), null;
      return { type: 'polygon', points: pts, ...out };
    }
    case 'path':
      if (typeof s.d !== 'string' || !s.d || s.d.length > LIMITS.path || !PATH.test(s.d)) return err(`${where}: bad path data`), null;
      return { type: 'path', d: s.d, ...out };
    default: return err(`${where}: unknown shape type`), null;
  }
}

function stamp(s, i, err) {
  const w = `stamps[${i}]`;
  if (!s || typeof s !== 'object') return err(`${w}: not an object`), null;
  if (typeof s.id !== 'string' || !ID.test(s.id)) return err(`${w}: bad id (a-z 0-9 _ -, max 48)`), null;
  const out = {
    id: s.id, name: text(s.name, 80) || s.id,
    rotate: ROTATE.includes(s.rotate) ? s.rotate : 'fixed',
    defaultScale: num(s.defaultScale, 0.1, 5, 1), aspect: num(s.aspect, 0.2, 5, 1)
  };
  if (s.group !== undefined) {
    if (typeof s.group !== 'string' || !ID.test(s.group)) return err(`${w}: bad group id`), null;
    out.group = s.group; out.groupName = text(s.groupName, 80) || s.group;
  }
  if (s.image !== undefined) {
    if (typeof s.image !== 'string' || !IMG.test(s.image)) return err(`${w}: image must be a base64 png/webp/svg data URL`), null;
    if (s.image.length > LIMITS.image) return err(`${w}: image over ${LIMITS.image / 1024} KB`), null;
    out.image = s.image;
  } else if (s.vector !== undefined) {
    if (!Array.isArray(s.vector) || !s.vector.length || s.vector.length > LIMITS.shapes) return err(`${w}: vector must be 1-${LIMITS.shapes} shapes`), null;
    const shapes = s.vector.map((x, j) => shape(x, err, `${w}.vector[${j}]`));
    if (shapes.includes(null)) return null;
    out.vector = shapes;
  } else return err(`${w}: needs "image" or "vector"`), null;
  return out;
}

const list = (v, max, name, err) => (v === undefined ? [] : Array.isArray(v) && v.length <= max ? v : (err(`contributes.${name}: must be a list of at most ${max}`), []));

/**
 * @returns {{ok: boolean, errors: string[], pack: object|null}} pack is a rebuilt, namespaced copy (never the input object).
 */
export function validatePack(input, { appVersion = '1.12.0' } = {}) {
  const errors = [];
  const err = (m) => errors.push(m);
  let obj = input;
  if (typeof input === 'string') {
    if (input.length > LIMITS.pack) return { ok: false, errors: ['Pack is over 5 MB'], pack: null };
    try { obj = JSON.parse(input); } catch { return { ok: false, errors: ['Not valid JSON'], pack: null }; }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, errors: ['Pack must be a JSON object'], pack: null };
  if (obj.format !== FORMAT) err(`format must be "${FORMAT}"`);
  if (obj.version !== 1) err('version must be 1');
  if (typeof obj.id !== 'string' || !ID.test(obj.id)) err('id must be a-z 0-9 _ - (max 48)');
  if (!text(obj.name, 80)) err('name is required');
  if (obj.inkforgeVersion !== undefined && !validRange(obj.inkforgeVersion)) err('inkforgeVersion is not a valid range');
  else if (obj.inkforgeVersion !== undefined && !satisfies(appVersion, obj.inkforgeVersion)) err(`needs InkForge ${obj.inkforgeVersion} (this is ${appVersion})`);
  const c = obj.contributes;
  if (!c || typeof c !== 'object') err('contributes is required');
  if (errors.length) return { ok: false, errors, pack: null };

  const ns = (id) => `${obj.id}:${id}`;
  const seen = new Set();
  const uniq = (id, w) => (seen.has(w + id) ? (err(`${w}: duplicate id "${id}"`), false) : (seen.add(w + id), true));

  const stamps = list(c.stamps, LIMITS.stamps, 'stamps', err).map((s, i) => stamp(s, i, err)).filter(Boolean)
    .filter((s) => uniq(s.id, 'stamp')).map((s) => ({ ...s, id: ns(s.id), group: s.group && ns(s.group) }));
  if (Array.isArray(c.stamps) && stamps.length !== c.stamps.length && !errors.length) err('some stamps were rejected');

  const biomes = list(c.biomes, LIMITS.biomes, 'biomes', err).map((b, i) => {
    if (!b || typeof b.id !== 'string' || !ID.test(b.id) || !isColor(b.color) || b.color[0] === '$' || b.color === 'none') return err(`biomes[${i}]: needs a safe id and a colour`), null;
    const sec = isColor(b.secondaryColor) && b.secondaryColor[0] !== '$' && b.secondaryColor !== 'none' ? b.secondaryColor : b.color;
    return { id: ns(b.id), name: text(b.name, 60) || b.id, category: 'plugin', color: b.color, secondaryColor: sec, preview: b.color, roughness: num(b.roughness, 0, 1, 0.4), description: text(b.description) };
  }).filter(Boolean);

  const lightPresets = list(c.lightPresets, LIMITS.presets, 'lightPresets', err).map((p, i) => {
    const a = p && p.atmosphere;
    if (!p || !text(p.name, 40) || !a || typeof a !== 'object') return err(`lightPresets[${i}]: needs name and atmosphere`), null;
    const atm = {};
    for (const k of ['vignette', 'parchmentGrain', 'sepia', 'darkness', 'tintAmount', 'weatherAmount']) if (a[k] !== undefined) atm[k] = num(a[k], 0, 1, 0);
    if (a.brightness !== undefined) atm.brightness = num(a.brightness, 0.2, 2, 1);
    if (a.tint !== undefined) {
      if (!Array.isArray(a.tint) || a.tint.length !== 3 || !a.tint.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) return err(`lightPresets[${i}]: tint must be [r, g, b] 0-255`), null;
      atm.tint = [...a.tint];
    }
    if (a.tintBlend !== undefined) { if (!BLENDS.includes(a.tintBlend)) return err(`lightPresets[${i}]: bad tintBlend`), null; atm.tintBlend = a.tintBlend; }
    if (a.weather !== undefined) { if (!WEATHER.includes(a.weather)) return err(`lightPresets[${i}]: bad weather`), null; atm.weather = a.weather; }
    return { name: text(p.name, 40), atmosphere: atm };
  }).filter(Boolean);

  // Map templates are validated and stored but not yet offered in the New Map dialog (see docs/PLUGINS.md).
  const mapTemplates = list(c.mapTemplates, LIMITS.templates, 'mapTemplates', err).map((t, i) => {
    if (!t || typeof t.id !== 'string' || !ID.test(t.id)) return err(`mapTemplates[${i}]: bad id`), null;
    return { id: ns(t.id), name: text(t.name, 60) || t.id, description: text(t.description), width: Math.round(num(t.width, 64, 8000, 1920)), height: Math.round(num(t.height, 64, 8000, 1080)), biome: typeof t.biome === 'string' && ID.test(t.biome.replace(':', '-')) ? t.biome : undefined };
  }).filter(Boolean);

  if (errors.length) return { ok: false, errors, pack: null };
  if (!stamps.length && !biomes.length && !lightPresets.length && !mapTemplates.length) return { ok: false, errors: ['Pack contributes nothing'], pack: null };
  const pack = {
    format: FORMAT, version: 1, id: obj.id, name: text(obj.name, 80), author: text(obj.author, 80), description: text(obj.description, 500),
    license: text(obj.license, 80), inkforgeVersion: obj.inkforgeVersion || '*',
    contributes: { stamps, biomes, lightPresets, mapTemplates }
  };
  if (JSON.stringify(pack).length > LIMITS.pack) return { ok: false, errors: ['Pack is over 5 MB'], pack: null };
  return { ok: true, errors: [], pack };
}
