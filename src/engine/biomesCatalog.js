// Biome and Texture Palettes for Map Painting with Procedural Patterns

export const BIOMES = [
  {
    id: 'grassland',
    name: 'Verdant Meadow',
    category: 'world',
    color: '#658d4a',
    secondaryColor: '#53753b',
    roughness: 0.4,
    preview: '#658d4a',
    description: 'Lush rolling hills and fantasy forests'
  },
  {
    id: 'parchment',
    name: 'Antique Parchment',
    category: 'world',
    color: '#dfd2b5',
    secondaryColor: '#c7b795',
    roughness: 0.2,
    preview: '#dfd2b5',
    description: 'Classic Tolkienesque hand-drawn map parchment'
  },
  {
    id: 'desert',
    name: 'Sunbaked Sands',
    category: 'world',
    color: '#dfb76c',
    secondaryColor: '#c99e52',
    roughness: 0.3,
    preview: '#dfb76c',
    description: 'Vast dunes and arid wastelands'
  },
  {
    id: 'snow',
    name: 'Glacial Tundra',
    category: 'world',
    color: '#e2e8f0',
    secondaryColor: '#cbd5e1',
    roughness: 0.2,
    preview: '#e2e8f0',
    description: 'Frozen peaks and icy wastes'
  },
  {
    id: 'badlands',
    name: 'Volcanic Moor',
    category: 'world',
    color: '#473c38',
    secondaryColor: '#2b2422',
    roughness: 0.6,
    preview: '#473c38',
    description: 'Dark obsidian, crags, and grim wilderness'
  },
  {
    id: 'swamp_mire',
    name: 'Murky Mire / Swamp',
    category: 'world',
    color: '#3d4a36',
    secondaryColor: '#283324',
    roughness: 0.5,
    preview: '#3d4a36',
    description: 'Stagnant bog, mossy peat, and wetland reeds'
  },
  {
    id: 'lava_molten',
    name: 'Molten Magma Fields',
    category: 'world',
    color: '#b91c1c',
    secondaryColor: '#7f1d1d',
    roughness: 0.7,
    preview: '#b91c1c',
    description: 'Lava fissures and scorched basalt'
  },
  {
    id: 'shallows',
    name: 'Coastal Shallows',
    category: 'world',
    color: '#4fa3a5',
    secondaryColor: '#368285',
    roughness: 0.15,
    preview: '#4fa3a5',
    description: 'Turquoise coastal shelf and lagoons'
  },
  {
    id: 'deep_ocean',
    name: 'Abyssal Deep',
    category: 'world',
    color: '#1e3a5f',
    secondaryColor: '#122540',
    roughness: 0.1,
    preview: '#1e3a5f',
    description: 'Dark depths of the endless ocean'
  },
  {
    id: 'forest_floor',
    name: 'Forest Floor',
    category: 'world',
    color: '#3f5a33',
    secondaryColor: '#2c4126',
    roughness: 0.4,
    preview: '#3f5a33',
    description: 'Leaf litter, moss and dappled shade under old woods'
  },
  {
    id: 'savanna',
    name: 'Golden Savanna',
    category: 'world',
    color: '#a9a257',
    secondaryColor: '#8a8340',
    roughness: 0.4,
    preview: '#a9a257',
    description: 'Dry tall grass and scattered scrub'
  },
  {
    id: 'tundra',
    name: 'Mossy Tundra',
    category: 'world',
    color: '#8a9380',
    secondaryColor: '#6f7a67',
    roughness: 0.4,
    preview: '#8a9380',
    description: 'Lichen, frost-heaved stones and patchy snow'
  },
  {
    id: 'jungle',
    name: 'Dense Jungle',
    category: 'world',
    color: '#2f6b36',
    secondaryColor: '#1e4a27',
    roughness: 0.4,
    preview: '#2f6b36',
    description: 'Broad leaves and tangled undergrowth'
  },
  {
    id: 'ash_waste',
    name: 'Ashen Wastes',
    category: 'world',
    color: '#6b6866',
    secondaryColor: '#4b4948',
    roughness: 0.4,
    preview: '#6b6866',
    description: 'Drifts of grey ash, cinders and burnt ground'
  },
  {
    id: 'farmland',
    name: 'Farmland Furrows',
    category: 'world',
    color: '#9a7b3f',
    secondaryColor: '#7a5e2c',
    roughness: 0.4,
    preview: '#9a7b3f',
    description: 'Ploughed fields, crop rows and field strips'
  },
  // Battlemap Floors
  {
    id: 'dungeon_flagstone',
    name: 'Carved Flagstone',
    category: 'battle',
    color: '#4b5563',
    secondaryColor: '#374151',
    roughness: 0.5,
    pattern: 'flagstone',
    preview: '#4b5563',
    description: 'Ancient dungeon masonry and fortress floors'
  },
  {
    id: 'wooden_planks',
    name: 'Tavern Planks',
    category: 'battle',
    color: '#78502c',
    secondaryColor: '#5c391b',
    roughness: 0.4,
    pattern: 'planks',
    preview: '#78502c',
    description: 'Wooden floors for taverns, ships, and cabins'
  },
  {
    id: 'cobblestone_town',
    name: 'Town Cobblestone',
    category: 'battle',
    color: '#64748b',
    secondaryColor: '#475569',
    roughness: 0.45,
    pattern: 'cobble',
    preview: '#64748b',
    description: 'Paved market squares and dungeon alleys'
  },
  {
    id: 'dirt_cave',
    name: 'Cave Soil / Dirt',
    category: 'battle',
    color: '#5c4033',
    secondaryColor: '#422817',
    roughness: 0.6,
    preview: '#5c4033',
    description: 'Damp cavern floor, mud, and packed earth'
  }
];

export function getBiomeById(id) {
  return BIOMES.find((b) => b.id === id) || BIOMES[0];
}


// ---------------------------------------------------------------------------
// Procedural tile painters. Everything is seeded (no Math.random) and drawn with
// wrap-around so the 128px tile repeats seamlessly.
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;
const SIZE = 128;

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const parse = (hex) => {
  if (hex.startsWith('rgb')) return hex.match(/[\d.]+/g).slice(0, 3).map(Number);
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
// amt > 0 lightens toward white, < 0 darkens toward black
const tint = (hex, amt) => css(mixRgb(parse(hex), amt > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(amt)));
const tintA = (hex, amt, a) => css(mixRgb(parse(hex), amt > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(amt)), a);

const smooth = (t) => t * t * (3 - 2 * t);

// Tileable value noise; x,y in tile units [0,1)
function makeNoise(rng, n) {
  const g = Float32Array.from({ length: n * n }, () => rng());
  const at = (i, j) => g[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
  return (x, y) => {
    const fx = x * n;
    const fy = y * n;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = smooth(fx - x0);
    const ty = smooth(fy - y0);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
    return a + (b - a) * ty;
  };
}

function makeKit(ctx, rng) {
  const S = SIZE;
  return {
    ctx,
    S,
    rng,
    r: (a, b) => a + rng() * (b - a),
    pick: (arr) => arr[Math.floor(rng() * arr.length)],
    // Make n items once, draw each at every wrap offset that can touch the tile.
    each(n, make, draw) {
      const items = Array.from({ length: n }, (_, i) => make(i));
      for (const it of items) {
        const rad = it.r || 0;
        for (const dx of [-S, 0, S]) {
          for (const dy of [-S, 0, S]) {
            const x = it.x + dx;
            const y = it.y + dy;
            if (x < -rad || x > S + rad || y < -rad || y > S + rad) continue;
            ctx.save();
            ctx.translate(dx, dy);
            draw(it);
            ctx.restore();
          }
        }
      }
      return items;
    },
    // Smooth closed organic blob path (wob = array of radius multipliers)
    blob(x, y, rx, ry, wob, rot = 0) {
      const n = wob.length;
      const pts = wob.map((w, i) => {
        const a = (i / n) * TAU;
        const px = Math.cos(a) * rx * w;
        const py = Math.sin(a) * ry * w;
        return [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)];
      });
      ctx.beginPath();
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const m0 = mid(pts[n - 1], pts[0]);
      ctx.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) {
        const m = mid(pts[i], pts[(i + 1) % n]);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      ctx.closePath();
    },
    wob: (n, amp = 0.3) => Array.from({ length: n }, () => 1 - amp / 2 + rng() * amp),
    // Per-pixel tileable fbm mottling between two colours + fine grain
    mottle(c1, c2, strength = 1, grain = 6) {
      const n1 = makeNoise(rng, 3);
      const n2 = makeNoise(rng, 6);
      const n3 = makeNoise(rng, 14);
      const a = parse(c1);
      const b = parse(c2);
      const img = ctx.getImageData(0, 0, S, S);
      const d = img.data;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const u = x / S;
          const v = y / S;
          const t = Math.min(1, Math.max(0, (n1(u, v) * 0.5 + n2(u, v) * 0.33 + n3(u, v) * 0.17 - 0.5) * 1.8 * strength + 0.5));
          const gr = (rng() - 0.5) * grain;
          const i = (y * S + x) * 4;
          for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, a[k] + (b[k] - a[k]) * t + gr));
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    fill(c) {
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, S, S);
    },
    // Curved blade strokes in a tuft: dark offset pass then lit pass
    tuft(x, y, h, n, lean, dark, light, w = 1.3) {
      const blades = [];
      for (let k = 0; k < n; k++) {
        blades.push({ a: lean + (k - (n - 1) / 2) * 0.32 + (rng() - 0.5) * 0.15, hh: h * (0.65 + rng() * 0.4), bend: (rng() - 0.5) * 0.5 });
      }
      ctx.lineCap = 'round';
      for (const [col, o, lw] of [[dark, 0.6, w + 0.5], [light, 0, w]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        for (const b of blades) {
          ctx.beginPath();
          ctx.moveTo(x + o, y + o);
          ctx.quadraticCurveTo(x + Math.sin(b.a + b.bend) * b.hh * 0.5 + o, y - Math.cos(b.a) * b.hh * 0.55 + o, x + Math.sin(b.a) * b.hh + o, y - Math.cos(b.a) * b.hh + o);
          ctx.stroke();
        }
      }
    }
  };
}

function sparkle(ctx, x, y, r, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y + r);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
}

function softBlob(k, x, y, r, col0, col1 = 'rgba(0,0,0,0)') {
  const g = k.ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col0);
  g.addColorStop(1, col1);
  k.ctx.fillStyle = g;
  k.ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// Sine ripple line, periodic in x so it wraps cleanly. cycles must be an integer.
function sineLine(ctx, y0, amp, cycles, phase, step = 4) {
  ctx.beginPath();
  for (let x = -step; x <= SIZE + step; x += step) {
    const y = y0 + Math.sin((x / SIZE) * TAU * cycles + phase) * amp;
    if (x <= -step) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}


const PAINTERS = {
  grassland(k, b) {
    const { ctx } = k;
    k.mottle(b.color, tint(b.color, 0.1), 1, 5);
    k.each(16, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 18 }), (it) => softBlob(k, it.x, it.y, 18, tintA(b.secondaryColor, -0.1, 0.18)));
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 4 }), (it) => {
      ctx.fillStyle = 'rgba(25,45,18,0.35)';
      ctx.beginPath();
      ctx.ellipse(it.x + 1, it.y + 1, 2.6, 1.4, 0, 0, TAU);
      ctx.fill();
    });
    k.each(52, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 12, h: k.r(5, 11), n: 3 + Math.floor(k.r(0, 3)), lean: k.r(-0.35, 0.2), t: k.r(-0.15, 0.2) }), (it) =>
      k.tuft(it.x, it.y, it.h, it.n, it.lean, tint(b.secondaryColor, -0.25 + it.t * 0.5), tintA('#8fc25a', it.t, 0.95))
    );
    const cols = ['#f4efd4', '#f2d05a', '#e9a1b8'];
    k.each(11, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3, c: k.pick(cols) }), (it) => {
      ctx.fillStyle = 'rgba(30,45,20,0.45)';
      ctx.fillRect(it.x - 0.5, it.y - 0.5, 3, 3);
      ctx.fillStyle = it.c;
      ctx.fillRect(it.x - 1, it.y - 1, 2, 2);
    });
  },

  forest_floor(k, b) {
    const { ctx } = k;
    k.mottle(b.color, b.secondaryColor, 1.1, 7);
    k.each(9, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 22, w: k.wob(9, 0.5), rot: k.r(0, 3) }), (it) => {
      k.blob(it.x, it.y, 18, 11, it.w, it.rot);
      ctx.fillStyle = 'rgba(96,130,60,0.28)';
      ctx.fill();
    });
    const leaf = ['#8a5a26', '#a8742f', '#6d4620', '#b0892e', '#5d6e2a'];
    k.each(44, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 6, a: k.r(0, TAU), c: k.pick(leaf), l: k.r(3, 5.5) }), (it) => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.a);
      ctx.fillStyle = 'rgba(10,20,8,0.4)';
      ctx.beginPath();
      ctx.ellipse(0.8, 0.9, it.l, it.l * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = it.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, it.l, it.l * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-it.l, 0);
      ctx.lineTo(it.l, 0);
      ctx.stroke();
      ctx.restore();
    });
    k.each(10, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 14, a: k.r(0, TAU), l: k.r(6, 11) }), (it) => {
      ctx.strokeStyle = '#2b1d12';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(it.x, it.y);
      ctx.lineTo(it.x + Math.cos(it.a) * it.l, it.y + Math.sin(it.a) * it.l);
      ctx.lineTo(it.x + Math.cos(it.a + 0.5) * it.l * 1.3, it.y + Math.sin(it.a + 0.5) * it.l * 1.3);
      ctx.stroke();
    });
    k.each(8, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 16 }), (it) => softBlob(k, it.x, it.y, 16, 'rgba(255,240,170,0.16)'));
    k.each(40, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 8, h: k.r(3, 6) }), (it) => k.tuft(it.x, it.y, it.h, 3, 0, '#1d2e18', '#59793f', 1));
  },

  savanna(k, b) {
    const { ctx } = k;
    k.mottle(b.color, '#c3b56b', 1.2, 6);
    k.each(8, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 22, w: k.wob(8, 0.5), rot: k.r(0, 3) }), (it) => {
      k.blob(it.x, it.y, 17, 9, it.w, it.rot);
      ctx.fillStyle = 'rgba(160,120,70,0.3)';
      ctx.fill();
    });
    const tones = ['#c9b866', '#d8c97d', '#8f8a42', '#b79d4f', '#e2d58f'];
    k.each(70, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 16, h: k.r(8, 15), c: k.pick(tones), n: 3 + Math.floor(k.r(0, 3)), l: k.r(-0.3, 0.25) }), (it) =>
      k.tuft(it.x, it.y, it.h, it.n, it.l, 'rgba(70,55,20,0.75)', it.c, 1.1)
    );
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 4 }), (it) => {
      ctx.fillStyle = 'rgba(80,60,30,0.5)';
      ctx.fillRect(it.x, it.y, 2, 1.4);
      ctx.fillStyle = 'rgba(255,240,190,0.5)';
      ctx.fillRect(it.x - 0.5, it.y - 0.5, 1.2, 1);
    });
  },

  tundra(k, b) {
    const { ctx } = k;
    k.mottle(b.color, '#a3ab97', 1.2, 6);
    const lich = ['rgba(176,186,122,0.45)', 'rgba(210,205,150,0.35)', 'rgba(110,130,95,0.4)'];
    k.each(26, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 14, w: k.wob(8, 0.6), c: k.pick(lich), s: k.r(4, 10) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.7, it.w);
      ctx.fillStyle = it.c;
      ctx.fill();
    });
    k.each(10, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 14, w: k.wob(9, 0.35), rot: k.r(0, 3), s: k.r(3, 7) }), (it) => {
      k.blob(it.x + 1, it.y + 1.5, it.s, it.s * 0.7, it.w, it.rot);
      ctx.fillStyle = 'rgba(80,95,120,0.3)';
      ctx.fill();
      k.blob(it.x, it.y, it.s, it.s * 0.7, it.w, it.rot);
      ctx.fillStyle = 'rgba(238,243,248,0.9)';
      ctx.fill();
    });
    k.each(16, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 8, s: k.r(2, 4.5), w: k.wob(7, 0.35) }), (it) => {
      ctx.fillStyle = 'rgba(30,35,30,0.4)';
      k.blob(it.x + 1.2, it.y + 1.4, it.s, it.s * 0.75, it.w);
      ctx.fill();
      k.blob(it.x, it.y, it.s, it.s * 0.75, it.w);
      ctx.fillStyle = '#7d8480';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(it.x - it.s * 0.5, it.y - it.s * 0.5, it.s * 0.7, 1);
    });
    k.each(40, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 6, h: k.r(3, 6) }), (it) => k.tuft(it.x, it.y, it.h, 3, 0, '#4a5442', '#9fae85', 1));
  },

  jungle(k, b) {
    const { ctx } = k;
    k.mottle(tint(b.color, -0.25), b.color, 1.2, 6);
    const greens = ['#2f7a3a', '#3b8f45', '#256030', '#4aa04e', '#1c5428'];
    k.each(46, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 18, a: k.r(0, TAU), l: k.r(9, 16), c: k.pick(greens) }), (it) => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.a);
      const leafPath = (ox, oy) => {
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(it.l * 0.5 + ox, -it.l * 0.45 + oy, it.l + ox, oy);
        ctx.quadraticCurveTo(it.l * 0.5 + ox, it.l * 0.45 + oy, ox, oy);
      };
      ctx.fillStyle = 'rgba(5,25,10,0.5)';
      leafPath(1, 1.5);
      ctx.fill();
      ctx.fillStyle = it.c;
      leafPath(0, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(190,240,150,0.22)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(it.l * 0.5, -it.l * 0.45, it.l, 0);
      ctx.quadraticCurveTo(it.l * 0.5, -it.l * 0.08, 0, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,40,15,0.65)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(it.l * 0.92, 0);
      ctx.stroke();
      ctx.restore();
    });
    k.each(10, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 16 }), (it) => softBlob(k, it.x, it.y, 16, 'rgba(0,15,5,0.16)'));
    k.each(5, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 14, c: k.r(0, 1) > 0.5 ? '#e9567c' : '#f2c14e' }), (it) => {
      ctx.fillStyle = it.c;
      ctx.beginPath();
      ctx.arc(it.x, it.y, 1.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(it.x - 0.8, it.y - 0.8, 0.9, 0.9);
    });
  },

  desert(k, b) {
    const { ctx } = k;
    k.mottle(b.color, tint(b.color, 0.12), 1, 6);
    const dunes = [];
    for (let i = 0; i < 4; i++) dunes.push({ y: 16 + i * 32 + k.r(-4, 4), amp: k.r(3, 6), cyc: 1 + (i % 2), ph: k.r(0, TAU) });
    ctx.lineCap = 'round';
    for (const d of dunes) {
      ctx.strokeStyle = tintA(b.secondaryColor, -0.2, 0.28);
      ctx.lineWidth = 9;
      sineLine(ctx, d.y + 6, d.amp, d.cyc, d.ph);
      ctx.strokeStyle = tintA(b.color, 0.35, 0.4);
      ctx.lineWidth = 6;
      sineLine(ctx, d.y - 3, d.amp, d.cyc, d.ph);
      ctx.strokeStyle = tintA(b.secondaryColor, -0.35, 0.65);
      ctx.lineWidth = 1.4;
      sineLine(ctx, d.y + 1, d.amp, d.cyc, d.ph);
    }
    for (let i = 0; i < 16; i++) {
      const y = 4 + i * 8 + k.r(-1.5, 1.5);
      ctx.strokeStyle = i % 2 ? tintA(b.secondaryColor, 0, 0.35) : tintA(b.color, 0.4, 0.45);
      ctx.lineWidth = 1;
      sineLine(ctx, y, k.r(0.8, 1.8), 4 + (i % 3), k.r(0, TAU), 3);
    }
    k.each(36, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3, s: k.r(0.8, 1.8) }), (it) => {
      ctx.fillStyle = 'rgba(90,60,25,0.45)';
      ctx.fillRect(it.x + 0.5, it.y + 0.5, it.s, it.s);
      ctx.fillStyle = 'rgba(255,238,190,0.55)';
      ctx.fillRect(it.x, it.y, it.s, it.s);
    });
    k.each(5, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 6, s: k.r(2, 3.5) }), (it) => {
      ctx.fillStyle = 'rgba(70,45,20,0.4)';
      ctx.beginPath();
      ctx.ellipse(it.x + 1.5, it.y + 1.5, it.s * 1.2, it.s * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#a98a56';
      ctx.beginPath();
      ctx.ellipse(it.x, it.y, it.s, it.s * 0.7, 0, 0, TAU);
      ctx.fill();
    });
  },

  snow(k, b) {
    const { ctx } = k;
    k.mottle(b.color, '#f5f8fc', 0.9, 3);
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 24, w: k.wob(9, 0.4), rot: k.r(-0.4, 0.4), s: k.r(12, 22) }), (it) => {
      k.blob(it.x + 3, it.y + 4, it.s, it.s * 0.4, it.w, it.rot);
      ctx.fillStyle = 'rgba(120,150,195,0.26)';
      ctx.fill();
      k.blob(it.x, it.y, it.s, it.s * 0.36, it.w, it.rot);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    });
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = 'rgba(130,155,195,0.35)';
      ctx.lineWidth = 1.2;
      sineLine(ctx, 10 + i * 26 + k.r(-3, 3), k.r(2, 4), 1 + (i % 2), k.r(0, TAU), 4);
    }
    k.each(7, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 6, s: k.r(1.5, 3) }), (it) => {
      ctx.fillStyle = 'rgba(100,125,170,0.45)';
      ctx.beginPath();
      ctx.ellipse(it.x + 1, it.y + 1.2, it.s, it.s * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#9fb0c8';
      ctx.beginPath();
      ctx.ellipse(it.x, it.y, it.s, it.s * 0.7, 0, 0, TAU);
      ctx.fill();
    });
    k.each(38, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 4, big: k.r(0, 1) > 0.8 }), (it) => {
      if (it.big) sparkle(ctx, it.x, it.y, 3, 'rgba(255,255,255,0.95)');
      else {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(it.x, it.y, 1.4, 1.4);
      }
    });
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 4 }), (it) => {
      ctx.fillStyle = 'rgba(150,175,215,0.5)';
      ctx.fillRect(it.x, it.y, 1.5, 1.5);
    });
  },

  badlands(k, b) {
    const { ctx } = k;
    k.mottle(b.color, tint(b.color, 0.14), 1, 7);
    const bands = ['#5a4a42', '#3a302c', '#4f3f36', '#33292a', '#5c493a', '#2f2726'];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y = (i * SIZE) / n + 8;
      const amp = k.r(1.5, 4);
      const cyc = 1 + (i % 3);
      const ph = k.r(0, TAU);
      ctx.strokeStyle = css(parse(bands[i % bands.length]), 0.55);
      ctx.lineWidth = k.r(5, 9);
      sineLine(ctx, y, amp, cyc, ph);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.3;
      sineLine(ctx, y + 5, amp, cyc, ph);
      ctx.strokeStyle = 'rgba(210,170,130,0.16)';
      ctx.lineWidth = 1;
      sineLine(ctx, y - 4, amp, cyc, ph);
    }
    k.each(12, () => {
      const pts = [];
      let x = k.r(0, 128);
      let y = k.r(0, 128);
      let a = k.r(0, TAU);
      for (let i = 0; i < 6; i++) {
        pts.push([x, y]);
        a += k.r(-0.9, 0.9);
        const l = k.r(4, 10);
        x += Math.cos(a) * l;
        y += Math.sin(a) * l;
      }
      return { x: pts[0][0], y: pts[0][1], r: 60, pts };
    }, (it) => {
      ctx.lineJoin = 'round';
      ctx.beginPath();
      it.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      it.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px - 0.8, py - 0.8) : ctx.moveTo(px - 0.8, py - 0.8)));
      ctx.strokeStyle = 'rgba(200,160,120,0.28)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });
    k.each(26, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 6, s: k.r(1.6, 3.6), w: k.wob(6, 0.5) }), (it) => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      k.blob(it.x + 1.2, it.y + 1.4, it.s, it.s * 0.8, it.w);
      ctx.fill();
      k.blob(it.x, it.y, it.s, it.s * 0.8, it.w);
      ctx.fillStyle = '#6b5a4e';
      ctx.fill();
      ctx.fillStyle = 'rgba(240,200,160,0.4)';
      ctx.fillRect(it.x - it.s * 0.6, it.y - it.s * 0.6, it.s * 0.8, 0.9);
    });
  },

  ash_waste(k, b) {
    const { ctx } = k;
    k.mottle(tint(b.color, -0.15), '#7a7775', 1.3, 8);
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 22, w: k.wob(9, 0.5), rot: k.r(-0.5, 0.5), s: k.r(9, 18) }), (it) => {
      k.blob(it.x + 2, it.y + 3, it.s, it.s * 0.3, it.w, it.rot);
      ctx.fillStyle = 'rgba(25,24,24,0.2)';
      ctx.fill();
      k.blob(it.x, it.y, it.s, it.s * 0.26, it.w, it.rot);
      ctx.fillStyle = 'rgba(190,186,182,0.16)';
      ctx.fill();
    });
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = 'rgba(30,28,28,0.3)';
      ctx.lineWidth = 1;
      sineLine(ctx, 8 + i * 21 + k.r(-3, 3), k.r(1, 3), 2 + (i % 2), k.r(0, TAU), 4);
    }
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 12, a: k.r(0, TAU), l: k.r(4, 10) }), (it) => {
      ctx.strokeStyle = '#161313';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(it.x, it.y);
      ctx.lineTo(it.x + Math.cos(it.a) * it.l, it.y + Math.sin(it.a) * it.l);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(160,150,140,0.35)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });
    k.each(22, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 5, s: k.r(1.5, 3), w: k.wob(6, 0.5) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.8, it.w);
      ctx.fillStyle = '#2a2827';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(it.x - it.s * 0.5, it.y - it.s * 0.5, it.s * 0.7, 0.8);
    });
    k.each(5, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 8 }), (it) => {
      softBlob(k, it.x, it.y, 6, 'rgba(255,110,30,0.45)');
      ctx.fillStyle = '#ff9a3a';
      ctx.fillRect(it.x - 0.7, it.y - 0.7, 1.5, 1.5);
    });
    k.each(26, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3 }), (it) => {
      ctx.fillStyle = 'rgba(220,215,210,0.35)';
      ctx.fillRect(it.x, it.y, 1.2, 1.2);
    });
  },

  swamp_mire(k, b) {
    const { ctx } = k;
    k.mottle(b.color, '#4f5d3e', 1.2, 7);
    k.each(12, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 18, w: k.wob(8, 0.5), s: k.r(7, 13) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.6, it.w);
      ctx.fillStyle = 'rgba(105,130,60,0.3)';
      ctx.fill();
    });
    k.each(5, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 30, w: k.wob(10, 0.55), rx: k.r(11, 19), ry: k.r(7, 11), rot: k.r(-0.4, 0.4) }), (it) => {
      k.blob(it.x, it.y, it.rx + 2.5, it.ry + 2.5, it.w, it.rot);
      ctx.fillStyle = 'rgba(20,28,15,0.55)';
      ctx.fill();
      k.blob(it.x, it.y, it.rx, it.ry, it.w, it.rot);
      const g = ctx.createLinearGradient(it.x - it.rx, it.y - it.ry, it.x + it.rx, it.y + it.ry);
      g.addColorStop(0, '#3c5648');
      g.addColorStop(1, '#17261f');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,170,100,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,150,60,0.28)';
      k.blob(it.x + it.rx * 0.3, it.y + it.ry * 0.3, it.rx * 0.5, it.ry * 0.35, it.w, it.rot);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,225,200,0.5)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(it.x - it.rx * 0.5, it.y - it.ry * 0.3);
      ctx.lineTo(it.x - it.rx * 0.15, it.y - it.ry * 0.38);
      ctx.stroke();
    });
    k.each(24, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 16, h: k.r(8, 14), cat: k.r(0, 1) > 0.7 }), (it) => {
      k.tuft(it.x, it.y, it.h, 4, 0, '#1b2915', '#6f8a46', 1.1);
      if (it.cat) {
        ctx.strokeStyle = '#4a3320';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(it.x + 1, it.y - it.h * 0.9);
        ctx.lineTo(it.x + 1, it.y - it.h * 0.9 - 4);
        ctx.stroke();
      }
    });
    k.each(20, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 4 }), (it) => {
      ctx.fillStyle = 'rgba(140,175,70,0.5)';
      ctx.fillRect(it.x, it.y, 2.2, 1.4);
    });
  },

  lava_molten(k) {
    const { ctx } = k;
    k.mottle('#1d1615', '#33262a', 1.3, 6);
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 18, w: k.wob(7, 0.4), s: k.r(7, 14), rot: k.r(0, 3) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.8, it.w, it.rot);
      ctx.fillStyle = 'rgba(70,52,50,0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,150,130,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    const cracks = k.each(7, (i) => {
      const pts = [];
      let x = k.r(0, 128);
      let y = k.r(0, 128);
      let a = k.r(0, TAU);
      const nseg = i < 3 ? 9 : 5;
      for (let j = 0; j < nseg; j++) {
        pts.push([x, y]);
        a += k.r(-0.7, 0.7);
        const l = k.r(7, 13);
        x += Math.cos(a) * l;
        y += Math.sin(a) * l;
      }
      return { x: pts[0][0], y: pts[0][1], r: -1000, pts, wide: i < 3 ? 1 : 0.6 };
    }, () => {});
    const layers = [
      [14, 'rgba(255,70,10,0.10)'],
      [8, 'rgba(255,60,10,0.25)'],
      [4.5, '#c2210f'],
      [2.8, '#f2661c'],
      [1.3, '#ffd45a']
    ];
    for (const [w, col] of layers) {
      for (const c of cracks) {
        for (const dx of [-SIZE, 0, SIZE]) {
          for (const dy of [-SIZE, 0, SIZE]) {
            ctx.save();
            ctx.translate(dx, dy);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = col;
            ctx.lineWidth = w * c.wide;
            ctx.beginPath();
            c.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }
    k.each(4, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 14, w: k.wob(8, 0.5) }), (it) => {
      softBlob(k, it.x, it.y, 14, 'rgba(255,90,20,0.4)');
      k.blob(it.x, it.y, 5, 3.5, it.w);
      ctx.fillStyle = '#f2661c';
      ctx.fill();
      k.blob(it.x - 0.5, it.y - 0.5, 2.8, 1.8, it.w);
      ctx.fillStyle = '#ffd45a';
      ctx.fill();
    });
    k.each(26, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3 }), (it) => {
      ctx.fillStyle = 'rgba(255,150,50,0.8)';
      ctx.fillRect(it.x, it.y, 1.2, 1.2);
    });
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 5, s: k.r(1.2, 2.4) }), (it) => {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(it.x, it.y, it.s, it.s);
      ctx.fillStyle = 'rgba(200,170,160,0.3)';
      ctx.fillRect(it.x - 0.4, it.y - 0.4, it.s * 0.7, 0.8);
    });
  },

  shallows(k) {
    const { ctx } = k;
    k.mottle('#3d9496', '#68bcb6', 1.3, 4);
    k.each(10, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 22, w: k.wob(9, 0.5), s: k.r(9, 17), rot: k.r(0, 3) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.55, it.w, it.rot);
      ctx.fillStyle = 'rgba(235,225,170,0.18)';
      ctx.fill();
    });
    ctx.lineCap = 'round';
    k.each(30, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 12, a: k.r(0, TAU), l: k.r(5, 11) }), (it) => {
      ctx.strokeStyle = 'rgba(210,255,240,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(it.x, it.y);
      ctx.quadraticCurveTo(it.x + Math.cos(it.a) * it.l * 0.5 + 2, it.y + Math.sin(it.a) * it.l * 0.5 - 2, it.x + Math.cos(it.a) * it.l, it.y + Math.sin(it.a) * it.l);
      ctx.stroke();
    });
    k.each(24, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 22, l: k.r(14, 28), h: k.r(2, 3.5) }), (it) => {
      for (const [col, oy, lw] of [['rgba(20,80,90,0.35)', 1.6, 1.6], ['rgba(235,255,250,0.7)', 0, 1.3]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(it.x, it.y + oy);
        ctx.bezierCurveTo(it.x + it.l * 0.3, it.y - it.h + oy, it.x + it.l * 0.65, it.y + it.h + oy, it.x + it.l, it.y + oy);
        ctx.stroke();
      }
    });
    k.each(16, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3 }), (it) => {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(it.x, it.y, 1.5, 1.5);
    });
  },

  deep_ocean(k) {
    const { ctx } = k;
    k.mottle('#16304f', '#2a4f7a', 1.4, 4);
    k.each(8, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 26 }), (it) => softBlob(k, it.x, it.y, 26, 'rgba(5,12,28,0.35)'));
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = 8 + i * 21 + k.r(-3, 3);
      const cyc = 2 + (i % 2);
      const ph = k.r(0, TAU);
      ctx.strokeStyle = 'rgba(5,15,35,0.4)';
      ctx.lineWidth = 3;
      sineLine(ctx, y + 2, 2.5, cyc, ph);
      ctx.strokeStyle = 'rgba(120,170,220,0.2)';
      ctx.lineWidth = 1.2;
      sineLine(ctx, y, 2.5, cyc, ph);
    }
    k.each(26, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 14, l: k.r(7, 13) }), (it) => {
      for (const [col, oy] of [['rgba(5,15,40,0.45)', 1.4], ['rgba(150,195,235,0.5)', 0]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(it.x, it.y + 2 + oy);
        ctx.quadraticCurveTo(it.x + it.l * 0.25, it.y - 1.5 + oy, it.x + it.l * 0.5, it.y + oy);
        ctx.quadraticCurveTo(it.x + it.l * 0.75, it.y - 1.5 + oy, it.x + it.l, it.y + 2 + oy);
        ctx.stroke();
      }
    });
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3 }), (it) => {
      ctx.fillStyle = 'rgba(190,220,255,0.4)';
      ctx.fillRect(it.x, it.y, 1.3, 1.3);
    });
  },

  parchment(k) {
    const { ctx } = k;
    k.mottle('#e6dabc', '#d3c4a0', 1.2, 7);
    k.each(7, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 30, w: k.wob(9, 0.5), s: k.r(14, 26) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.8, it.w);
      ctx.fillStyle = 'rgba(150,110,60,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,100,50,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    k.each(18, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 8, s: k.r(1, 3.4) }), (it) => softBlob(k, it.x, it.y, it.s * 2, 'rgba(140,95,45,0.28)'));
    ctx.lineCap = 'round';
    k.each(90, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 10, a: k.r(0, TAU), l: k.r(3, 9), dark: k.r(0, 1) > 0.5 }), (it) => {
      ctx.strokeStyle = it.dark ? 'rgba(110,80,40,0.18)' : 'rgba(255,250,235,0.4)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(it.x, it.y);
      ctx.quadraticCurveTo(it.x + Math.cos(it.a) * it.l * 0.5 + 1, it.y + Math.sin(it.a) * it.l * 0.5 - 1, it.x + Math.cos(it.a) * it.l, it.y + Math.sin(it.a) * it.l);
      ctx.stroke();
    });
    k.each(24, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3 }), (it) => {
      ctx.fillStyle = 'rgba(90,65,35,0.3)';
      ctx.fillRect(it.x, it.y, 1, 1);
    });
  },

  dirt_cave(k, b) {
    const { ctx } = k;
    k.mottle(b.color, '#6e5444', 1.3, 8);
    k.each(14, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 16 }), (it) => softBlob(k, it.x, it.y, 16, 'rgba(20,10,5,0.16)'));
    k.each(7, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 18, w: k.wob(8, 0.5), s: k.r(8, 14), rot: k.r(0, 3) }), (it) => {
      k.blob(it.x, it.y, it.s, it.s * 0.6, it.w, it.rot);
      ctx.fillStyle = 'rgba(30,18,10,0.35)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,120,90,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    k.each(8, () => {
      const pts = [];
      let x = k.r(0, 128);
      let y = k.r(0, 128);
      let a = k.r(0, TAU);
      for (let i = 0; i < 5; i++) {
        pts.push([x, y]);
        a += k.r(-0.8, 0.8);
        x += Math.cos(a) * k.r(4, 9);
        y += Math.sin(a) * k.r(4, 9);
      }
      return { x: pts[0][0], y: pts[0][1], r: 50, pts };
    }, (it) => {
      ctx.beginPath();
      it.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.strokeStyle = 'rgba(15,8,4,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    k.each(34, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 7, s: k.r(1.5, 4), w: k.wob(7, 0.4), c: k.pick(['#8a7662', '#6f5c4b', '#9b8670', '#5a4a3e']) }), (it) => {
      ctx.fillStyle = 'rgba(10,5,2,0.5)';
      k.blob(it.x + 1.3, it.y + 1.5, it.s, it.s * 0.78, it.w);
      ctx.fill();
      k.blob(it.x, it.y, it.s, it.s * 0.78, it.w);
      ctx.fillStyle = it.c;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,235,205,0.35)';
      ctx.fillRect(it.x - it.s * 0.55, it.y - it.s * 0.5, it.s * 0.7, 0.9);
    });
  },

  farmland(k, b) {
    const { ctx } = k;
    k.mottle(b.color, '#b0904f', 1, 6);
    const rows = 8;
    ctx.lineCap = 'round';
    for (let i = 0; i < rows; i++) {
      const y = (i + 0.5) * (SIZE / rows);
      const ph = Math.sin(i * 1.7) * 2;
      ctx.strokeStyle = 'rgba(55,35,15,0.55)';
      ctx.lineWidth = 3.2;
      sineLine(ctx, y + 3, 1.2, 2, ph, 4);
      ctx.strokeStyle = 'rgba(235,205,140,0.5)';
      ctx.lineWidth = 2.6;
      sineLine(ctx, y - 2, 1.2, 2, ph, 4);
    }
    for (let i = 0; i < rows; i += 2) {
      const y = (i + 0.5) * (SIZE / rows) - 1;
      for (let j = 0; j < 8; j++) {
        const x = j * 16 + 8 + (i % 4);
        const py = y + Math.sin((x / SIZE) * TAU * 2 + Math.sin(i * 1.7) * 2) * 1.2;
        k.tuft(x, py + 2, k.r(5, 8), 3, 0, '#2a4a1c', '#7fb04c', 1.1);
      }
    }
    k.each(30, () => ({ x: k.r(0, 128), y: k.r(0, 128), r: 3, s: k.r(1, 2) }), (it) => {
      ctx.fillStyle = 'rgba(60,40,20,0.45)';
      ctx.fillRect(it.x + 0.6, it.y + 0.6, it.s, it.s);
      ctx.fillStyle = 'rgba(210,180,130,0.6)';
      ctx.fillRect(it.x, it.y, it.s, it.s);
    });
  },

  // --- battlemap floors ----------------------------------------------------
  flagstone(k, b) {
    const { ctx } = k;
    k.fill(tint(b.secondaryColor, -0.35));
    const pavers = [
      { x: 2, y: 2, w: 58, h: 38 }, { x: 66, y: 2, w: 60, h: 58 },
      { x: 2, y: 46, w: 58, h: 78 }, { x: 66, y: 66, w: 60, h: 58 }
    ];
    for (const p of pavers) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      g.addColorStop(0, tint(b.color, 0.06));
      g.addColorStop(1, tint(b.color, -0.1));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x + 1, p.y + p.h - 4);
      ctx.lineTo(p.x + 1, p.y + 2);
      ctx.lineTo(p.x + p.w - 4, p.y + 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(p.x + p.w - 1, p.y + 4);
      ctx.lineTo(p.x + p.w - 1, p.y + p.h - 1);
      ctx.lineTo(p.x + 4, p.y + p.h - 1);
      ctx.stroke();
      for (let i = 0; i < 22; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)';
        ctx.fillRect(p.x + 3 + k.r(0, p.w - 8), p.y + 3 + k.r(0, p.h - 8), k.r(1, 3), k.r(1, 2));
      }
      if (p.h > 50) {
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 14);
        ctx.lineTo(cx - 4, cy - 3);
        ctx.lineTo(cx - 9, cy + 6);
        ctx.lineTo(cx + 2, cy + 16);
        ctx.stroke();
      }
    }
  },

  planks(k, b) {
    const { ctx } = k;
    const plankH = 32;
    for (let y = 0; y < SIZE; y += plankH) {
      const row = y / plankH;
      ctx.fillStyle = row % 2 === 0 ? b.color : tint(b.color, -0.12);
      ctx.fillRect(0, y, SIZE, plankH);
      const jx = [20, 84, 52, 116][row];
      ctx.fillStyle = row % 2 ? 'rgba(255,220,170,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(jx, y, SIZE - jx, plankH);
      ctx.fillStyle = 'rgba(15,8,3,0.65)';
      ctx.fillRect(jx, y, 1.5, plankH);
      ctx.lineWidth = 0.9;
      for (let g = 4; g < plankH - 3; g += 5) {
        ctx.strokeStyle = g % 10 === 4 ? 'rgba(30,15,5,0.2)' : 'rgba(255,225,180,0.08)';
        sineLine(ctx, y + g, k.r(0.5, 1.5), 1 + (row % 2), k.r(0, TAU), 4);
      }
      const kx = (jx + 40 + row * 17) % SIZE;
      ctx.fillStyle = 'rgba(25,12,4,0.55)';
      ctx.beginPath();
      ctx.ellipse(kx, y + 15, 3.4, 2.2, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(25,12,4,0.3)';
      ctx.beginPath();
      ctx.ellipse(kx, y + 15, 6, 3.6, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(15,8,3,0.6)';
      ctx.fillRect(0, y + plankH - 2, SIZE, 2);
      ctx.fillStyle = 'rgba(255,230,190,0.12)';
      ctx.fillRect(0, y, SIZE, 1);
      ctx.fillStyle = '#1e140d';
      for (const nx of [jx + 5, jx - 5 + SIZE]) {
        ctx.beginPath();
        ctx.arc(nx % SIZE, y + 8, 1.5, 0, TAU);
        ctx.arc(nx % SIZE, y + 24, 1.5, 0, TAU);
        ctx.fill();
      }
    }
  },

  cobble(k, b) {
    const { ctx } = k;
    k.fill(tint(b.secondaryColor, -0.4));
    for (let row = 0; row < 4; row++) {
      const off = (row % 2) * 16;
      for (let col = 0; col < 4; col++) {
        const x = col * 32 + off;
        const y = row * 32;
        const tone = k.r(-0.12, 0.1);
        for (const dx of [-SIZE, 0, SIZE]) {
          ctx.save();
          ctx.translate(dx, 0);
          const rr = ctx.createLinearGradient(x, y, x + 30, y + 28);
          rr.addColorStop(0, tint(b.color, tone + 0.1));
          rr.addColorStop(1, tint(b.color, tone - 0.1));
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 4, 28, 26, 9);
          ctx.fill();
          ctx.fillStyle = rr;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, 28, 26, 9);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + 16, y + 15, 12, Math.PI * 1.05, Math.PI * 1.55);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }
};

// In-memory pattern cache
const patternCache = new Map();

/**
 * Creates or retrieves a rich, seamless procedural CanvasPattern for textured biome rendering
 */
export function getBiomePattern(ctx, biomeId) {
  if (patternCache.has(biomeId)) {
    return patternCache.get(biomeId);
  }

  const biome = getBiomeById(biomeId);
  const offscreen = document.createElement('canvas');
  offscreen.width = SIZE;
  offscreen.height = SIZE;
  const octx = offscreen.getContext('2d');

  octx.fillStyle = biome.color;
  octx.fillRect(0, 0, SIZE, SIZE);

  const kit = makeKit(octx, mulberry32(hashStr(biome.id)));
  const painter = PAINTERS[biome.pattern] || PAINTERS[biome.id];
  if (painter) painter(kit, biome);
  else kit.mottle(biome.color, biome.secondaryColor, 1, 8);

  const pattern = ctx.createPattern(offscreen, 'repeat');
  if (pattern) {
    patternCache.set(biomeId, pattern);
  }
  return pattern || biome.color;
}
