// Map data model, as the Canvas 2D renderer reads it. Only what the Pixi view needs so far; widen as files convert.

export interface Stamp {
  id: string;
  x: number;
  y: number;
  stampId?: string;
  customImage?: string; // data URL
  aspect?: number;
  scale?: number;
  rotation?: number; // radians
  flipX?: boolean;
  flipY?: boolean;
  anchor?: 'base' | 'center';
  zIndex?: number;
  layer?: string;
  color?: string;
  fill?: string;
  seed?: number;
  tone?: number;
  hue?: number;
}

export interface LayerStyle {
  opacity?: number;
  blend?: GlobalCompositeOperation;
  locked?: boolean;
}

// The layer plan produced by buildPlan() in engine/renderer.js (see the comment there).
export type Ctx2D = CanvasRenderingContext2D;

export interface RasterPart {
  kind: 'raster';
  deps: unknown[];
  empty?: boolean; // nothing to draw: no canvas or texture is allocated for it
  draw: (c: Ctx2D) => void;
}
export interface StampsPart {
  kind: 'stamps';
  deps: unknown[];
  stamps: Stamp[];
  selectedId: string | null;
  epoch: number; // bumps when a custom stamp image finishes loading
  draw: (c: Ctx2D) => void;
}
export type Part = RasterPart | StampsPart;

export interface AtmosphereSettings {
  vignette: number;
  parchmentGrain: number;
  sepia: number;
  brightness: number;
}
export type PlanItem =
  | { kind: 'layer'; name: string; style?: LayerStyle; parts: Part[] }
  | { kind: 'live'; style?: LayerStyle; stroke: { points: { x: number; y: number }[]; size: number } }
  | { kind: 'atmosphere'; atmosphere: AtmosphereSettings };
export interface Plan {
  width: number;
  height: number;
  items: PlanItem[];
}

export type AtmoOp =
  | { type: 'grain'; alpha: number }
  | { type: 'solid'; rgb: [number, number, number]; alpha: number; blend: 'multiply' | 'screen' }
  | { type: 'vignette'; vignette: number };
