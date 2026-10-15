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
