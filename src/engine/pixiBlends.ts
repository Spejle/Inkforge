// Overlay and soft-light for the Pixi view, matching Canvas 2D (the W3C compositing formulas).
// Pixi's own advanced blend filters feed the premultiplied source colour into the blend function and use the Pegtop
// soft-light curve: a translucent overlay layer (the Magic fog in the Obsidian Reach sample, alpha ~0.08) darkened the map
// on screen while the export tinted it. Registered under the same names, these replace Pixi's (the last one added wins),
// so import this module after 'pixi.js/advanced-blend-modes'.
import { BlendModeFilter, ExtensionType, extensions } from 'pixi.js';

// premultiplied back and front in, premultiplied result out:
// co = cs (1 - ab) + cb (1 - as) + as ab B(Cb, Cs), ao = as + ab (1 - as)
const GL_COMMON = `
  vec3 unpremul(vec4 c) { return c.a > 0.0 ? c.rgb / c.a : vec3(0.0); }
  vec4 compose(vec4 b, vec4 f, vec3 mixed) {
    return vec4(f.rgb * (1.0 - b.a) + b.rgb * (1.0 - f.a) + f.a * b.a * mixed, f.a + b.a * (1.0 - f.a));
  }
`;
const GPU_COMMON = `
  fn unpremul(c: vec4<f32>) -> vec3<f32> { return select(vec3<f32>(0.0), c.rgb / c.a, c.a > 0.0); }
  fn compose(b: vec4<f32>, f: vec4<f32>, mixed: vec3<f32>) -> vec4<f32> {
    return vec4<f32>(f.rgb * (1.0 - b.a) + b.rgb * (1.0 - f.a) + f.a * b.a * mixed, f.a + b.a * (1.0 - f.a));
  }
`;

export class OverlayBlend extends BlendModeFilter {
  constructor() {
    super({
      gl: {
        functions: GL_COMMON + `
          // overlay(Cb, Cs) = hard-light(Cs, Cb)
          vec3 overlayOf(vec3 cb, vec3 cs) {
            return mix(2.0 * cb * cs, 1.0 - 2.0 * (1.0 - cb) * (1.0 - cs), step(0.5, cb));
          }`,
        main: `finalColor = compose(back, front, overlayOf(unpremul(back), unpremul(front))) * uBlend;`
      },
      gpu: {
        functions: GPU_COMMON + `
          fn overlayOf(cb: vec3<f32>, cs: vec3<f32>) -> vec3<f32> {
            return mix(2.0 * cb * cs, 1.0 - 2.0 * (1.0 - cb) * (1.0 - cs), step(vec3<f32>(0.5), cb));
          }`,
        main: `out = compose(back, front, overlayOf(unpremul(back), unpremul(front))) * blendUniforms.uBlend;`
      }
    });
  }
}

export class SoftLightBlend extends BlendModeFilter {
  constructor() {
    super({
      gl: {
        functions: GL_COMMON + `
          vec3 softLightOf(vec3 cb, vec3 cs) {
            vec3 d = mix(((16.0 * cb - 12.0) * cb + 4.0) * cb, sqrt(cb), step(0.25, cb));
            return mix(cb - (1.0 - 2.0 * cs) * cb * (1.0 - cb), cb + (2.0 * cs - 1.0) * (d - cb), step(0.5, cs));
          }`,
        main: `finalColor = compose(back, front, softLightOf(unpremul(back), unpremul(front))) * uBlend;`
      },
      gpu: {
        functions: GPU_COMMON + `
          fn softLightOf(cb: vec3<f32>, cs: vec3<f32>) -> vec3<f32> {
            let d = mix(((16.0 * cb - 12.0) * cb + 4.0) * cb, sqrt(cb), step(vec3<f32>(0.25), cb));
            return mix(cb - (1.0 - 2.0 * cs) * cb * (1.0 - cb), cb + (2.0 * cs - 1.0) * (d - cb), step(vec3<f32>(0.5), cs));
          }`,
        main: `out = compose(back, front, softLightOf(unpremul(back), unpremul(front))) * blendUniforms.uBlend;`
      }
    });
  }
}

extensions.add(
  { type: ExtensionType.BlendMode, name: 'overlay', ref: OverlayBlend },
  { type: ExtensionType.BlendMode, name: 'soft-light', ref: SoftLightBlend }
);
