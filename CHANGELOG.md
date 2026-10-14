# Changelog

All notable changes to **InkForge** will be documented in this file.

## [Unreleased]

### Added
- **24 new procedural vector stamps**:
  - **Nature & Land (8)**: Dead Tree (`tree_dead_barren`), Palm Tree (`tree_palm`), Desert Cactus (`cactus_saguaro`), Boulder Cluster (`boulder_cluster`), Freshwater Reeds (`nature_reeds`), Lily Pond (`nature_lily_pond`), Volcano (`volcano_lite`), Snowy Pine (`tree_snowy_pine`).
  - **Settlements & Structures (8)**: Rustic Windmill (`windmill_rustic`), Coastal Lighthouse (`civ_lighthouse`), Ruined Tower (`ruined_tower`), Stone Arch Bridge (`bridge_stone`), Farm Homestead (`farm_homestead`), Port Dock (`port_dock`), Ancient Temple (`civ_temple`), Camp Tent (`camp_tent`).
  - **Nautical & Icons (4)**: Giant Kraken (`nautical_kraken`), War Galleon (`ship_galleon`), Maelstrom Whirlpool (`nautical_whirlpool`), Sea Serpent Head (`sea_serpent_head`).
  - **Furniture & Props (4)**: Dungeon Chest (`prop_chest_wood`), Barrel Stack (`prop_barrel_stack`), Ritual Stone Altar (`prop_altar_stone`), Library Bookshelf (`prop_bookshelf`).

## [1.5.0] - 2026-10-14

Review-driven "bring it up to standard" release.

### Added
- **Autosave**: the map is saved to the browser (IndexedDB, debounced) and restored on the next visit; the status bar shows the last save. New map / presets replace it.
- **On-canvas transform handles**: drag a selected stamp's corner to scale, its top handle to rotate (Shift = 15° steps); cursor changes over handles.
- **Arrow keys** nudge the selection (Shift = 10 px); `[` and `]` rotate the selected stamp (Shift = 1°).
- **Custom layers**: add, rename, reorder, delete, hide, lock, opacity and blend. New stamps, paths and labels go on the active layer; "Move selection here" re-assigns. Built-in layers can be locked too; hidden or locked layers can't be picked.
- **Eraser tool (E)**: rubs out brush strokes, sculpted land strokes and paths under the ring.
- **Paths**: Shift draws a straight segment (Alt snaps to 15°); select a path anywhere along its length (not only at vertices) and drag it to move it.
- **Export**: Maximum 16K (8x, capped to the browser's canvas limit with a notice) and **layers as transparent PNGs in a ZIP** (flattened map plus one file per layer).
- **Tests**: dependency-free `npm test` (node:test) for the print planner, PDF writer and ZIP writer.
- 24 new stamps (see below if present).
- A real README (the Vite template one is gone).

### Changed
- The land layer (mask, ripples, terrain, beach, outline) is cached while stamps, paths and labels are dragged, and repaints are coalesced to one per frame.

### Not built
Per-layer rubylith masks and raster "brush layers" (need a per-layer bitmap model), multi-selection / box select, vertex editing of paths.

## [1.4.3] - 2026-10-14

### Added
- **X swaps Add Land / Carve Water** (and jumps to the Landmass Sculptor if another tool is active).

### Fixed
- **Beach rim on sculpted land**: the sand fringe was only drawn for preset islands. It is now derived from the land mask, so painted land and carved bays/lakes get the same beach as the presets.
- **Universal VTT**: format 0.3, `AARRGGBB` colour strings for ambient light and lights, `rotation` on portals, light shadows on. (Written from memory of the spec, not validated against Roll20/Foundry.)

## [1.4.2] - 2026-10-14

### Fixed
- **Mask tool**: the ink coastline was stroked along the *centre line* of every Add-land stroke, leaving dark scribbles across new land. The contour is now traced from the real land edge, so it also outlines carved water and the preset islands consistently (outline sits just outside the edge).
- **Brush tool**: with Softness above 10% (the default) every biome painted the same flat green; the biome texture is now applied through the feathered mask, so Sunbaked Sands, Snow, Swamp etc. look like themselves.

## [1.4.1] - 2026-10-14

Bug-fix release from a code review.

### Fixed
- **Universal VTT export** now uses your coastline settings and respects hidden layers / layer opacity and blend (it used defaults and drew every layer).
- **Undo history**: a click that changes nothing (e.g. selecting with the Select tool) no longer adds an undo step.
- **Property edits are undoable**: size, scale, colour and similar sliders on a selected stamp, text or path now create an undo step (a drag of a slider is one step).
- Delete / duplicate / flip / bring-to-front no longer record history from inside state updaters (double entries under React StrictMode in development).
- **Custom stamps** no longer stay invisible until something else redraws: the canvas repaints when a stamp image finishes loading, and images are cached instead of being written back onto the stamp.
- **New map / preset** resets the layer panel to defaults (the stamp library is kept).
- Shortcut keys ignore Ctrl/Cmd/Alt combinations (Ctrl+P, Ctrl+S, Ctrl+A no longer switch tools) and typing in text areas.
- Mouse-wheel zoom no longer scrolls the page (non-passive listener); a cancelled pointer gesture (touch) ends cleanly.

## [1.4.0] - 2026-10-14

Cartographer's-study restyle (no wireframes were available, so this is a visual pass only).

### Changed
- Palette moved from slate/blue to warm ink, leather and brass; oxblood replaces blue for active states.
- UI font Alegreya Sans, Cinzel headings, faint paper grain on the app background.
- Two themes, **Candlelit** (default) and **Parchment**, toggled from the header (remembered per browser). All hard-coded colours now run through theme tokens.
- Map title field is wider and the template selector shrinks instead of pushing Export off-screen; visible keyboard focus rings.

## [1.3.0] - 2026-10-13

Implements the Inkforge Wireframes (client-side parts: 3a, 3f, 3g, 3h, 3k).

### Added
- **Layers panel (3f)**: per-layer visibility, opacity and blend (Normal / Multiply / Overlay / Soft light) for Labels, Stamps, Rivers & roads, Land & terrain, Sea and Grid; saved in `.inkforge` files and applied to every export.
- **Map style presets (3a)**: Parchment / Ink / Painted one-click atmosphere presets.
- **Add stamps dialog (3g)**: multi-file PNG/SVG/WebP import, automatic trimming of empty edges, base/centre anchor, name, pack and license; new "My stamps" library tab. Base-anchored stamps stand on their placement point; custom stamps keep their own aspect ratio (previously squashed to a square).
- **Print at table scale (3h)**: tiled PDF across A4 / Letter / A3 / Poster, true table scale (1 square = 0.5-2 in) or fit to one page, overlap, join marks and sheet numbers, grid and ink-saver options, assembly-guide page. No PDF library; JPEG pages at 150 dpi.
- **Tablet (3k)**: pointer events (finger pans, pencil/mouse draws), 44 px tap targets, options bar moves to the bottom on coarse pointers / narrow screens.

### Not built
Rubylith mask painting per layer, Share/player view, gallery, lore editor, nested maps, generator (need a backend or are separate products); two-finger-tap undo.

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
