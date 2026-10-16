# InkForge

Browser cartography studio for fantasy world maps and tactical battlemaps. React 19 + Canvas 2D + PixiJS (WebGL), no backend.

```bash
npm install
npm run dev      # development (requires Node.js 24+)
npm run build    # production build into dist/ (relative base, can be hosted in a subfolder)
npm test         # node:test unit tests (print planner, PDF and ZIP writers, etc.)
npm run typecheck# strict TypeScript compiler check
node server.js   # zero-dependency static server for dist/ on :5173
```

## Documentation

- **[Documentation Index](docs/README.md)**: Overview of all technical and user documentation.
- **[User Guide](docs/UserGuide.md)**: Comprehensive manual for DMs, worldbuilders, and cartographers covering tools, layers, lighting, and export formats.
- **[Architecture & Contributor Guide](docs/Architecture.md)**: Technical guide covering the `src/` structure, data models, dual render pipeline, and engine subsystems.
- **[Plugin Packs Specification](docs/PLUGINS.md)**: Specification for creating and importing custom data-only JSON asset packs.
- **[Contributing Guide](CONTRIBUTING.md)**: Setup, branch workflow, coding standards, and how to propose stamps.

## Features

- **Landmass Sculptor**: Add land or carve water with fractal jagged or smooth circular brushes, flow control, and dynamic coastline FX (shallow ripples, sand rims, ink outlines, elevation shadows).
- **Biome & Texture Painting**: Procedural biome textures (grassland, desert, tundra, mire, lava, flagstone, cobblestone, planks) with live brush previews, feathering softness, and blend modes.
- **Stamps & Props**: Catalog of 281 procedural vector stamps plus user image imports (PNG/SVG/WebP). Directional perspective views (side, top/plan, diag, front) and smart rotation policies (`fixed`, `tilt`, `free`) with spray and jitter modes.
- **Rivers, Roads & Walls**:
  - Editable spline vertices: drag points to reshape, double-click a point to delete, double-click the line to add a point. Dense freehand strokes automatically simplify to an editable spine (4px tolerance).
  - Procedural river generation: "Generate on click" meanders hydrologically plausible rivers from land to the nearest coast.
  - Shoreline boundary clipping: Rivers terminate cleanly at the coastline and render beneath roads and walls.
- **Curved Typography & Banners**: Fantasy typefaces (Cinzel, MedievalSharp, Pirata One, Uncial Antiqua, Inter) with circular arc curvature (-50% to +50%) and contrasting halo strokes.
- **Dynamic Lighting & Realistic Shadows**:
  - Darkness slider darkens maps for night encounters and unlit dungeons.
  - Campfires and braziers act as light sources (6 grid squares at scale 1).
  - Area light emitters sampled across 8 jittered multi-ring positions cast soft-edged shadows whose penumbra widens naturally with distance.
  - True-shape sprite shadow casting: Occluders (dungeon walls, pillars, doors, furniture, mountains, trees) cast silhouettes based on their traced sprite outlines.
  - Ambient bounce illumination maintains ~50% visibility within lit areas, bounded by room walls.
- **Multiselect & Scene Organization**:
  - Rubber-band marquee drag or Shift+click to multiselect and transform objects as a unified group.
  - Objects tab: Hierarchical inspection of all stamps, labels, and paths grouped by layer with real-time filtering and drag-to-layer organization.
- **Custom Layers & Styles**: Built-in layers plus user-created custom layers with independent visibility, locking, opacity, and blend modes (Normal, Multiply, Overlay, Soft light).
- **Tactical Grid**: Square, hex (flat/pointy), and isometric grids with customizable size, opacity, color, and snap-to-grid alignment.
- **Atmosphere & Weather**: Presets for Day, Dusk, Night, Cloudy, Rain, Snow, Torchlit, and Fog with vignette, parchment grain, sepia warmth, and deterministic weather precipitation.
- **High-DPI Sharpness**: Zooming in redraws vector art, coastlines, and textures at 1.5×, 2×, 3×, or 4× resolution steps.
- **Export & Print**:
  - Standard and high-resolution PNG exports up to 16K (2× / 4K, 4× / 8K).
  - Transparent per-layer PNGs bundled in a ZIP archive.
  - Universal VTT (`.dd2vtt`) export with line-of-sight walls, door portals, and light source metadata.
  - Tiled multi-sheet table-scale PDF printing (A4, Letter, A3, Poster) with crop marks, overlap margins, and assembly guides.
- **Plugin Packs**: Data-only JSON asset packs for stamps, biomes, and lighting presets.

## Shortcuts

| Key / Combination | Action |
| :--- | :--- |
| `V` | Select & Transform |
| `M` | Landmass Sculptor |
| `B` | Biome & Texture Brush |
| `S` | Stamps & Props |
| `P` | Rivers & Paths |
| `T` | Text & Banners |
| `G` | Grid & Alignment |
| `A` | Atmosphere & Light |
| `E` | Eraser |
| `H` / `Space` | Pan Canvas |
| `X` | Swap Add Land / Carve Water |
| `Ctrl + Z` / `Ctrl + Shift + Z` | Undo / Redo |
| `Delete` / `Backspace` | Delete selected objects |
| `Arrow Keys` | Nudge selection by 1 px (hold `Shift` for 10 px) |
| `[` `]` or `,` `.` | Rotate selected stamp by 15° (hold `Shift` for 1° fine rotation) |
| **Mouse Wheel** | Zoom canvas |
| **Shift + Wheel** | Adjust brush size, stamp scale, label size, river width, or selection |
| **Ctrl + Wheel** | Rotate stamp or label in **1° increments** |
| **Ctrl + Shift + Wheel** | Rotate stamp or label in **5° increments** |

*All shortcuts and themes can be customized in Settings (gear icon in the header).*

## License & Map Ownership

InkForge is Free and Open Source Software licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0-or-later)](LICENSE).

- **User Output Ownership**: All maps, images (PNG, PDF, SVG), Universal VTT files (`.dd2vtt`), and project files (`.inkforge`) created by you in InkForge are your sole intellectual property. You have 100% unrestricted commercial ownership of your creations—publish, license, or sell them without royalties or fees.
- **Copyleft Reciprocity**: Anyone hosting a modified version of InkForge over a computer network must make their corresponding modified source code available under AGPLv3.

## Support & Donations

InkForge has zero venture backing, zero cloud servers, and zero paywalled features. If InkForge saves you campaign prep time, consider supporting independent development:

- **[GitHub Sponsors](https://github.com/sponsors/spejle)** (Recurring sponsorship & stamp roadmap voting)
- **[Ko-fi / Buy Me a Coffee](https://ko-fi.com/)** (Tip the blacksmith)
