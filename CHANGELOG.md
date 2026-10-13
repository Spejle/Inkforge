# Changelog

All notable changes to **InkForge** will be documented in this file.

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
