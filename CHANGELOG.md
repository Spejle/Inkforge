# Changelog

All notable changes to **InkForge** will be documented in this file.

## [1.2.0] - 2026-10-13

### Added & Elevated
- **Mask Tool Full Parity & Fractal Rough Brush**: Added brush shape selector (`Circle`, `Rough Edgy`, `Block`) with procedural noise roughness slider (0.1 to 1.0) so users can carve natural jagged fjords, rias, bays, and cliffs without smooth "potato island" artifacts.
- **Interactive Coastline FX Settings Popover**: Dedicated popover modal directly attached to the tool ribbon allowing granular control over:
  - *Shallow Water Ripples*: Wave count (1-6), ripple spacing (4-24px), color picker, and wave opacity.
  - *Beach Sand Rim*: Sand border toggle, width (2-22px), and sand color.
  - *Coastline Contour Outline*: Width (1-8px) and ink stroke color.
  - *Continental Shelf Elevation Shadow*: 3D ocean drop shadow with customizable blur (4-35px) for realistic cartographic depth.
- **Brush Tool Parity (Foreground / Background / Softness / Blend Modes)**:
  - Added *Target* selector: Paint exclusively on `Land (FG)` (clipped to landmask), `Water (BG)` (painted in oceans/lakes), or `Both` (global canvas).
  - Added *Softness / Feathering* slider (0-100%) with procedural radial gradient edge falloff for smooth biome transitions.
  - Added *Blend Modes*: `Normal`, `Multiply` (for shading and dirtying rocks), `Overlay` (for vibrant biomes), and `Soft Light` (for subtle tinting).
- **Multi-Tab Sidebar Creative Suite (`[ Stamps ]` vs `[ Layers & FX ]`)**:
  - Reorganized right sidebar into dual studio tabs.
  - `Layers & FX` tab houses Atmospheric Filter Shader controls, live Coastline & Shallow Sea toggles, and Tactical Battle Grid settings with cell snapping.
- **Fixed Curved Typography Math**: Resolved a projection bug in circular arc text rendering that caused labels to translate offscreen. Letters now accurately follow `(sin(theta) * R, R - cos(theta) * R)` with dual stroke outlines and shadows.
- **Stamp Dynamics & Placement Quality-of-Life**: Added quick rotation/scale reset buttons (1x, 0°), horizontal and vertical stamp flipping (`Flip X`, `Flip Y`), and placement jitter.

## [1.1.0] - 2026-10-13

### Fixed & Overhauled
- **Studio Workspace Flex Layout**: Fixed critical CSS layout defect where `.studio-workspace` and `.center-stage` lacked flex styling, eliminating the 3800px vertical page overflow and docking the toolbar, center canvas stage, and right stamp drawer into a pixel-perfect 1080p desktop layout.
- **True Dual-Buffer Land Mask Architecture**: Rewrote `renderLandmasses` to decouple the Land Mask Buffer from the Terrain Buffer. Adding land expands the mask; carving water performs authentic `destination-out` clipping without ugly blue overlapping strokes.
- **Automated Masterclass Coastlines**: Added 4-tier concentric water-line ripple echoes ($6\text{px}, 14\text{px}, 26\text{px}, 42\text{px}$) with exponential alpha falloff, 3D land elevation drop shadows cast onto the ocean, inner sandy beach fringes, and crisp ink coastline contours.
- **Clipped Biome Brushes**: Biome textures now render into an offscreen terrain buffer clipped strictly to the Land Mask (`destination-in`), preventing ground painting from bleeding into the sea.
- **Fluid Stroke Interpolation**: Added distance-based point interpolation in `CanvasArea.jsx` so rapid mouse gestures create unbroken, continuous brush and mask strokes without gaps.
- **Procedural Texture Synthesis**: Upgraded `biomesCatalog.js` with high-resolution 128px patterns including beveled flagstone pavers with corner cracks and mortar, staggered wood grain planks with nail rivets, interlocking cobblestones, desert wind ripples, incandescent molten magma fissures, and glacial frost.
- **Eduard Imhof 315° NW Cartographic Lighting**: Added directional top-left sunlight and southeast contact drop shadows (`shadowColor: rgba(20, 15, 10, 0.35)`) under all mountain, castle, tree, and tower stamps to firmly ground them into the landscape.
- **Masterclass Starter Preset Maps**: Completely overhauled `The Realm of Valoria & The Shattered Reach` with natural fractal coastlines, a sweeping 15-peak tectonic mountain spine, hydrologically realistic glacial rivers with tributaries and deltas, dense clustered forest canopies, strategic ports, and curved kingdom banners.

## [1.0.0] - 2026-10-13

### Added
- **Expanded Vector Stamp Catalog**: Over 25 cartographic stamps across 6 categories (Volcano Calderas, Mesas, Megaliths, Windmills, Watchtowers, Fortresses, Autumn Maples, Dead Trees, Royal Thrones, Braziers, Treasure Chests, Daggers, Dragon Bosses, Leviathans).
- **Procedural Biome Textures**: Generated canvas patterns for Flagstone, Wood Planks, Cobblestones, Stippled Meadows, and Molten Basalt.
- **True Dual-Layer Land Sculpting**: Clean water carving with negative masking and automated coastal ripples/beaches.
- **Curved Typography**: Text arcs along configurable curvature angles for kingdom banners and mountain ranges.
- **Tactical Grid Suite**: Added Isometric Diamond grid, Pointy Hex, Flat Hex, and Square grids with X/Y alignment offsets and Grid Snapping (`snapToGrid`).
- **Atmospheric Post-Processing**: Procedural parchment noise grain shader overlay, brightness/exposure filter, sepia warmth, and vignette shading.
- **Multi-Scale PNG Export**: 1x (1080p), 2x (4K Ultra-HD), and 4x (8K Print Quality) offscreen rendering.
- **Universal VTT (.dd2vtt / .uvtt) Exporter**: Generates Foundry VTT and Roll20 battlemap packages with wall occlusion lines, door portals, ambient lighting, and ungridded maps.
- **In-Place Transform & Edit Controls**: Direct on-canvas selection, rotation, scaling, and property editing for stamps, labels, and river/road paths.
- **Full Unified History Stack**: Complete Ctrl+Z (Undo) and Ctrl+Y (Redo) tracking every stroke, path, and stamp drag.
- **Starter Map Presets**: *The Shattered Archipelago*, *The Crypt of the Forgotten King*, and *The Sunken Citadel & Volcanic Caldera*.

### Fixed
- **Aspect Ratio Centering Bug**: Fixed non-square stamps (`aspect !== 1`) rendering off-center.
- **Selection Handle Alignment**: Repositioned corner handles and added a rotation stem gizmo.
- **Isometric Depth Sorting**: Replaced randomized zIndex with stable 0-tier Y-sorting (`a.y - b.y`).
- **Polygon Pinch Artifact**: Fixed midpoint closed spline starting at `mid(points[N-1], points[0])` for C¹-smooth coastlines.
- **Custom Stamp Serialization**: Preserved uploaded images as base64 data URLs in `.inkforge` project JSON.
- **Spray Mode Throttling**: Distance-threshold stamp scattering to prevent UI freezing during continuous drags.
