// Live map view on PixiJS (WebGL). Consumes the layer plan from renderer.js, so layer order and cache keys are shared with
// the Canvas 2D path that exports, print and thumbnails still use.
//   - raster parts: drawn by the existing Canvas 2D code into their own canvas, uploaded as a texture only when their inputs change
//   - stamps: one sprite per stamp, so moving one stamp touches one sprite instead of redrawing the whole layer
//   - layer opacity / blend and the atmosphere run on the GPU
import 'pixi.js/unsafe-eval'; // Pixi's code generation uses new Function; this build avoids it so the page needs no 'unsafe-eval'
import { Application, CanvasSource, Container, Rectangle, RenderTexture, Sprite, Texture, TilingSprite } from 'pixi.js';
import 'pixi.js/advanced-blend-modes'; // overlay and soft-light
import {
  atmosphereOps,
  drawWeather,
  drawLighting,
  drawLiveStroke,
  drawStampSelection,
  drawVignette,
  getNoiseCanvas,
  stampAspect,
  stampImage,
  stampSprite
} from './renderer.js';
import { getStampById } from './stampsCatalog.js';
import type { AtmoOp, AtmosphereSettings, Ctx2D, LayerStyle, Part, Plan, PlanItem, RasterPart, Stamp, StampsPart } from '../types';

type Blend = Container['blendMode'];
const blendOf = (b?: string): Blend => (!b || b === 'source-over' ? 'normal' : (b as Blend));

interface StampEntry { sprite: Sprite; src: Stamp | null; epoch: number }
interface RasterNode { kind: 'raster'; sprite: Sprite; canvas: HTMLCanvasElement; deps: unknown[] | null }
interface StampsNode {
  kind: 'stamps';
  container: Container;
  entries: Map<string, StampEntry>;
  sel: Sprite | null;
  selSrc: Stamp | null;
  selEpoch: number;
  deps: unknown[] | null;
}
type PartNode = RasterNode | StampsNode;
interface LayerNode { container: Container; parts: (PartNode | null)[]; rt: RenderTexture | null; groupSprite: Sprite | null; rendered: boolean }

const BASE = 80; // stamp edge length at scale 1, same as the Canvas 2D renderer
const stampFrame = (s: Stamp) => {
  const size = BASE * (s.scale || 1);
  return { size, fw: size * stampAspect(s), fh: size };
};
const sameDeps = (a: unknown[] | null, b: unknown[]) => !!a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

/**
 * WebGL is available, the map fits in one texture and the renderer is a real GPU (software GL such as SwiftShader or
 * llvmpipe is slower than Canvas 2D, so the caller keeps the Canvas 2D view). `force` skips the software check.
 */
export function canUsePixi(width: number, height: number, force = false): boolean {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) return false;
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (!force && /swiftshader|llvmpipe|software/i.test(gpu)) return false;
  return width <= max && height <= max;
}

export class PixiMapView {
  readonly canvas: HTMLCanvasElement;
  private app: Application;
  private nodes = new Map<string, LayerNode>();
  private live: { sprite: Sprite; canvas: HTMLCanvasElement } | null = null;
  private atmo: { key: AtmosphereSettings | null; size: string; container: Container } = { key: null, size: '', container: new Container() };
  private canvasTex = new WeakMap<HTMLCanvasElement, Texture>();
  private customTex = new Map<string, { canvas: HTMLCanvasElement; pad: number; res: number }>();
  private dead = false;
  private q = 1; // canvas pixels per map unit (the zoom you are looking at), see setQuality
  private rr = 1; // the same for the raster layers, capped lower because there is one canvas per layer

  private constructor(app: Application) {
    this.app = app;
    this.canvas = app.canvas;
  }

  static async create(width: number, height: number): Promise<PixiMapView> {
    const app = new Application();
    await app.init({
      width,
      height,
      resolution: 1,
      autoDensity: true, // css size stays in map units whatever the backing resolution
      antialias: false,
      backgroundAlpha: 0,
      preference: 'webgl',
      useBackBuffer: true, // overlay and soft-light layers read the pixels below them
      autoStart: false, // repaint on demand, not every frame
      eventFeatures: { move: false, globalMove: false, click: false, wheel: false } // the page owns pointer input
    });
    app.stage.eventMode = 'none';
    return new PixiMapView(app);
  }

  destroy() {
    this.dead = true;
    this.app.destroy({ removeView: true }, { children: true });
  }

  /**
   * Render at `q` canvas pixels per map unit (zoom x devicePixelRatio) so stamps and layers stay sharp when you zoom in.
   * The caller already caps q by map size; the raster layers (one canvas each) get a lower cap. Returns true on change.
   */
  setQuality(q: number, width: number, height: number): boolean {
    const rr = Math.max(1, Math.min(q, Math.sqrt(12e6 / (width * height))));
    if (q === this.q && rr === this.rr) return false;
    this.q = q;
    this.rr = rr;
    for (const node of this.nodes.values()) {
      node.rendered = false;
      for (const pn of node.parts) {
        if (!pn) continue;
        pn.deps = null; // everything is redrawn at the new density on the next render
        if (pn.kind === 'stamps') {
          for (const e of pn.entries.values()) e.src = null;
          pn.selSrc = null;
        }
      }
    }
    this.atmo.key = null;
    return true;
  }

  private canvasTexture(canvas: HTMLCanvasElement, resolution: number): Texture {
    return new Texture({ source: new CanvasSource({ resource: canvas, resolution }) });
  }

  render(plan: Plan) {
    if (this.dead) return;
    const { renderer, stage } = this.app;
    if (renderer.width !== plan.width || renderer.height !== plan.height || renderer.resolution !== this.q) renderer.resize(plan.width, plan.height, this.q);

    const order: Container[] = [];
    for (const it of plan.items) {
      const obj = this.syncItem(it, plan);
      if (obj) order.push(obj);
    }
    if (stage.children.length !== order.length || order.some((o, i) => stage.children[i] !== o)) {
      stage.removeChildren();
      stage.addChild(...order);
    }
    renderer.render(stage);
  }

  /** Pixels of the current frame as a canvas, for tests. */
  extract(): HTMLCanvasElement {
    const { stage, renderer } = this.app;
    // explicit frame: by default extract crops to the content bounds, which shift when a stamp overhangs the map edge
    return renderer.extract.canvas({ target: stage, frame: new Rectangle(0, 0, renderer.width, renderer.height) }) as HTMLCanvasElement;
  }

  // ---- items -------------------------------------------------------------------------------------------------------

  private syncItem(it: PlanItem, plan: Plan): Container | null {
    if (it.kind === 'layer') return this.syncLayer(it.name, it.style, it.parts, plan);
    if (it.kind === 'live') return this.syncLive(it, plan);
    return this.syncAtmosphere(it.atmosphere, plan);
  }

  private syncLayer(name: string, style: LayerStyle | undefined, parts: Part[], plan: Plan) {
    let node = this.nodes.get(name);
    if (!node) {
      node = { container: new Container(), parts: [], rt: null, groupSprite: null, rendered: false };
      this.nodes.set(name, node);
    }
    let changed = false;
    parts.forEach((part, i) => {
      changed = (part.kind === 'raster' ? this.syncRaster(node, i, part, plan) : this.syncStamps(node, i, part)) || changed;
    });

    const opacity = style?.opacity ?? 1;
    const blend = blendOf(style?.blend);
    // Stamps can overlap, so a styled layer with stamps is rendered once into a texture and that one sprite is blended,
    // like Canvas 2D does. Anything else takes opacity / blend directly.
    if ((opacity < 1 || blend !== 'normal') && parts.some((p) => p.kind === 'stamps')) {
      node.container.alpha = 1;
      node.container.blendMode = 'normal';
      let rt = node.rt;
      if (!rt) {
        rt = node.rt = RenderTexture.create({ width: plan.width, height: plan.height });
        node.groupSprite = new Sprite(rt);
      } else if (rt.width !== plan.width || rt.height !== plan.height) {
        rt.resize(plan.width, plan.height);
        changed = true;
      }
      if (changed || !node.rendered) {
        this.app.renderer.render({ container: node.container, target: rt, clear: true });
        node.rendered = true;
      }
      const gs = node.groupSprite as Sprite;
      gs.alpha = opacity;
      gs.blendMode = blend;
      return gs;
    }
    node.rendered = false;
    node.container.alpha = opacity;
    node.container.blendMode = blend;
    return node.container;
  }

  private syncRaster(node: LayerNode, i: number, part: RasterPart, plan: Plan): boolean {
    let pn = node.parts[i] as RasterNode | null;
    if (part.empty) {
      const was = !!pn?.sprite.visible;
      if (pn) pn.sprite.visible = false;
      return was;
    }
    const rr = this.rr;
    const cw = Math.max(1, Math.round(plan.width * rr));
    const ch = Math.max(1, Math.round(plan.height * rr));
    if (!pn) {
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      pn = { kind: 'raster', sprite: new Sprite(this.canvasTexture(canvas, cw / plan.width)), canvas, deps: null };
      node.parts[i] = pn;
      node.container.addChildAt(pn.sprite, Math.min(i, node.container.children.length));
    } else if (pn.canvas.width !== cw || pn.canvas.height !== ch) {
      // map size or density changed: a new canvas and texture (a texture cannot change resolution in place)
      pn.canvas.width = cw;
      pn.canvas.height = ch;
      pn.sprite.texture.destroy(true);
      pn.sprite.texture = this.canvasTexture(pn.canvas, cw / plan.width);
      pn.deps = null;
    }
    let changed = !pn.sprite.visible;
    pn.sprite.visible = true;
    if (!sameDeps(pn.deps, part.deps)) {
      const g = pn.canvas.getContext('2d') as Ctx2D;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, pn.canvas.width, pn.canvas.height);
      g.setTransform(pn.canvas.width / plan.width, 0, 0, pn.canvas.height / plan.height, 0, 0); // draw in map units
      part.draw(g);
      pn.sprite.texture.source.update();
      pn.deps = part.deps;
      changed = true;
    }
    return changed;
  }

  // ---- stamps ------------------------------------------------------------------------------------------------------

  private textureOf(canvas: HTMLCanvasElement, resolution = 1): Texture {
    let t = this.canvasTex.get(canvas);
    if (!t) {
      t = this.canvasTexture(canvas, resolution);
      this.canvasTex.set(canvas, t);
    }
    return t;
  }

  /** Custom image stamp with its drop shadow baked in, like procedural stamps, at the current density. */
  private customSprite(src: string, img: HTMLImageElement, fw: number, fh: number, sc: number) {
    const q = this.q;
    const key = `${src.length}:${src.slice(-48)}|${Math.round(fw)}|${Math.round(fh)}|${sc}|${q}`;
    let c = this.customTex.get(key);
    if (!c) {
      const pad = Math.ceil(16 * sc);
      const lw = fw + pad * 2;
      const lh = fh + pad * 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(lw * q));
      canvas.height = Math.max(1, Math.ceil(lh * q));
      const g = canvas.getContext('2d') as Ctx2D;
      g.scale(canvas.width / lw, canvas.height / lh);
      g.shadowColor = 'rgba(20, 15, 10, 0.35)';
      g.shadowBlur = Math.max(3, 6 * sc) * q; // shadow blur and offsets are in canvas pixels, not map units
      g.shadowOffsetX = 2 * sc * q;
      g.shadowOffsetY = 4 * sc * q;
      g.drawImage(img, pad, pad, fw, fh);
      c = { canvas, pad, res: canvas.width / lw };
      this.customTex.set(key, c);
      if (this.customTex.size > 200) this.customTex.delete(this.customTex.keys().next().value as string);
    }
    return c;
  }

  /** Put a sprite whose texture covers [lx0, ly0, lw, lh] of the stamp's own frame where the Canvas 2D renderer would draw it. */
  private place(sp: Sprite, s: Stamp, fw: number, fh: number, lx0: number, ly0: number, lw: number, lh: number) {
    const ay = s.anchor === 'base' ? fh : fh / 2;
    sp.anchor.set((fw / 2 - lx0) / lw, (ay - ly0) / lh);
    sp.position.set(s.x, s.y);
    sp.rotation = s.rotation || 0;
    const sx = lw / sp.texture.width;
    const sy = lh / sp.texture.height;
    sp.scale.set(s.flipX ? -sx : sx, s.flipY ? -sy : sy);
  }

  private updateStamp(e: StampEntry, s: Stamp) {
    const { size, fw, fh } = stampFrame(s);
    const sp = e.sprite;
    let canvas: HTMLCanvasElement | null = null;
    let pad = 0;
    let res = 1;
    if (s.customImage) {
      const img = stampImage(s.customImage);
      if (img) ({ canvas, pad, res } = this.customSprite(s.customImage, img, fw, fh, s.scale || 1));
    } else {
      const def = getStampById(s.stampId);
      if (def?.render) {
        // baked at the density the canvas is drawn at (1, 2 or 4 pixels per map unit)
        const r = stampSprite({ getTransform: () => ({ a: this.q, b: 0 }) }, def, s, size, fw, fh);
        canvas = r.canvas;
        pad = r.pad;
        res = r.k;
      }
    }
    if (!canvas) {
      sp.visible = false;
      return;
    }
    sp.visible = true;
    sp.texture = this.textureOf(canvas, res);
    this.place(sp, s, fw, fh, -pad, -pad, fw + pad * 2, fh + pad * 2);
  }

  private syncStamps(node: LayerNode, i: number, part: StampsPart): boolean {
    let pn = node.parts[i] as StampsNode | null;
    if (!pn) {
      const container = new Container();
      container.sortableChildren = true;
      pn = { kind: 'stamps', container, entries: new Map(), sel: null, selSrc: null, selEpoch: -1, deps: null };
      node.parts[i] = pn;
      node.container.addChildAt(container, Math.min(i, node.container.children.length));
    }
    if (sameDeps(pn.deps, part.deps)) return false;
    pn.deps = part.deps;

    // Y-sorted, zIndex first: same order as renderStamps
    const sorted = [...part.stamps].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0) || a.y - b.y);
    const seen = new Set<string>();
    sorted.forEach((s, rank) => {
      seen.add(s.id);
      let e = pn.entries.get(s.id);
      if (!e) {
        e = { sprite: new Sprite(), src: null, epoch: -1 };
        pn.container.addChild(e.sprite);
        pn.entries.set(s.id, e);
      }
      if (e.src !== s || e.epoch !== part.epoch) {
        this.updateStamp(e, s);
        e.src = s;
        e.epoch = part.epoch;
      }
      if (e.sprite.zIndex !== rank) e.sprite.zIndex = rank;
    });
    for (const [id, e] of pn.entries) {
      if (seen.has(id)) continue;
      e.sprite.destroy();
      pn.entries.delete(id);
    }

    // selection box and handles: a small sprite above the stamps, redrawn only when the selected stamp changes
    const sel = part.selectedId ? sorted.find((s) => s.id === part.selectedId) : undefined;
    if (!sel) {
      if (pn.sel) pn.sel.visible = false;
      pn.selSrc = null;
    } else if (pn.selSrc !== sel || pn.selEpoch !== part.epoch) {
      const { fw, fh } = stampFrame(sel);
      const ox = 12, oy = 30;
      const lw = fw + ox * 2;
      const lh = fh + oy + 12;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(lw * this.q);
      canvas.height = Math.ceil(lh * this.q);
      const g = canvas.getContext('2d') as Ctx2D;
      g.scale(canvas.width / lw, canvas.height / lh);
      g.translate(ox, oy);
      drawStampSelection(g, fw, fh);
      pn.sel ??= new Sprite();
      if (!pn.sel.parent) pn.container.addChild(pn.sel);
      pn.sel.zIndex = 1e9;
      pn.sel.texture.destroy(true);
      pn.sel.texture = this.canvasTexture(canvas, canvas.width / lw);
      pn.sel.visible = true;
      this.place(pn.sel, sel, fw, fh, -ox, -oy, lw, lh);
      pn.selSrc = sel;
      pn.selEpoch = part.epoch;
    }
    return true;
  }

  // ---- live stroke and atmosphere ----------------------------------------------------------------------------------

  /** Stroke being painted: only its bounding box is drawn and uploaded each move. */
  private syncLive(it: Extract<PlanItem, { kind: 'live' }>, plan: Plan) {
    const pts = it.stroke.points;
    if (!pts?.length) return null;
    const m = it.stroke.size + 12;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }
    x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m));
    x1 = Math.min(plan.width, Math.ceil(x1 + m)); y1 = Math.min(plan.height, Math.ceil(y1 + m));
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);

    if (!this.live) {
      const canvas = document.createElement('canvas');
      this.live = { canvas, sprite: new Sprite(Texture.from(canvas)) };
    }
    const { canvas, sprite } = this.live;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      sprite.texture.source.resize(w, h);
      sprite.texture.frame.width = w;
      sprite.texture.frame.height = h;
      sprite.texture.updateUvs();
    }
    const g = canvas.getContext('2d') as Ctx2D;
    g.clearRect(0, 0, w, h);
    g.save();
    g.translate(-x0, -y0);
    drawLiveStroke(g, it.stroke);
    g.restore();
    sprite.texture.source.update();
    sprite.position.set(x0, y0);
    sprite.alpha = it.style?.opacity ?? 1;
    sprite.blendMode = blendOf(it.style?.blend);
    return sprite;
  }

  private syncAtmosphere(a: AtmosphereSettings, plan: Plan) {
    const box = this.atmo;
    const size = plan.width + 'x' + plan.height;
    if (box.key !== a || box.size !== size) {
      for (const c of box.container.removeChildren()) c.destroy();
      for (const op of atmosphereOps(a) as AtmoOp[]) {
        if (op.type === 'grain') {
          const t = new TilingSprite({ texture: this.textureOf(getNoiseCanvas()), width: plan.width, height: plan.height });
          t.alpha = op.alpha;
          t.blendMode = 'multiply';
          box.container.addChild(t);
        } else if (op.type === 'solid') {
          const s = new Sprite(Texture.WHITE);
          s.width = plan.width;
          s.height = plan.height;
          s.tint = (op.rgb[0] << 16) | (op.rgb[1] << 8) | op.rgb[2];
          s.alpha = op.alpha;
          s.blendMode = op.blend;
          box.container.addChild(s);
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = plan.width;
          canvas.height = plan.height;
          const g = canvas.getContext('2d') as Ctx2D;
          if (op.type === 'weather') drawWeather(g, plan.width, plan.height, op.kind, op.amount);
          else if (op.type === 'lighting') drawLighting(g, plan.width, plan.height, op);
          else drawVignette(g, plan.width, plan.height, op.vignette);
          box.container.addChild(new Sprite(Texture.from(canvas)));
        }
      }
      box.key = a;
      box.size = size;
    }
    return box.container;
  }
}
