# InkForge Architecture & Contributor Guide

InkForge is an open-source browser cartography studio built with React 19, HTML5 Canvas 2D, and PixiJS (WebGL). This document outlines the codebase architecture, data model, rendering pipelines, core algorithms, and development workflows for contributors.

---

## Table of Contents

1. [Architectural Principles](#architectural-principles)
2. [Source Directory Structure](#source-directory-structure)
3. [Data Model and Persistence](#data-model-and-persistence)
4. [Dual Render Pipeline](#dual-render-pipeline)
5. [Subsystems Deep Dive](#subsystems-deep-dive)
   - [Stamps Catalogue and Views](#stamps-catalogue-and-views)
   - [Dynamic Lighting and Shadow Casting](#dynamic-lighting-and-shadow-casting)
   - [Hydrological River Generation and Masking](#hydrological-river-generation-and-masking)
   - [Keyboard Shortcuts and Layout Systems](#keyboard-shortcuts-and-layout-systems)
6. [Extension Guides for Contributors](#extension-guides-for-contributors)
   - [How to Add a Stamp](#how-to-add-a-stamp)
   - [How to Add a Biome](#how-to-add-a-biome)
   - [How to Add a Tool](#how-to-add-a-tool)
   - [How to Add a Light Preset](#how-to-add-a-light-preset)
7. [Environment, Build, and Testing](#environment-build-and-testing)
8. [Security Model and CSP](#security-model-and-csp)
9. [Licensing and User Ownership](#licensing-and-user-ownership)

---

## Architectural Principles

- **Zero Backend / Complete Client-Side**: No cloud servers, user accounts, telemetry, or remote dependencies. Maps are processed and saved locally in the user's browser.
- **Strict Content Security Policy (CSP)**: Scripts run strictly from `'self'`. No `eval`, no inline script injection, and no remote data fetching. External data packs never execute code.
- **Unified Layer Plan**: Both the Canvas 2D renderer and the PixiJS WebGL engine consume the exact same structured layer plan (`buildPlan()`), eliminating divergent visual bugs between live editing and high-resolution export.
- **Data-Driven Extensibility**: Assets, biomes, and lighting presets can be declared statically or imported via schema-validated JSON plugin packs. See [Plugin Packs Specification](PLUGINS.md).

---

## Source Directory Structure

The project source code is organized within `src/`:

```
src/
├── assets/                  # Static logos and iconography
├── components/              # React UI components
│   ├── CanvasArea.jsx       # Canvas event handling, pointer tracking, transforms, spine editing
│   ├── Header.jsx           # App navigation, title editing, export menu, settings trigger
│   ├── Home.jsx             # Main menu: project library grid and sample map selector
│   ├── LayersPanel.jsx      # Layer stack UI, visibility, locking, opacity, blend pickers
│   ├── NewMapDialog.jsx     # Template picker and dimension configuration dialog
│   ├── ObjectsPanel.jsx     # Hierarchical listing of all stamps, paths, labels; drag-to-layer
│   ├── PluginsSettings.jsx  # Plugin pack installer and management UI
│   ├── PreviewPicker.jsx    # Pure canvas preview widgets (fonts, biomes, blends, grids)
│   ├── PrintDialog.jsx      # Multi-page tiled table-scale PDF print configuration
│   ├── SettingsDialog.jsx   # Tabbed settings dialog (Appearance, Layout, Keys, Plugins)
│   ├── StampDrawer.jsx      # Right sidebar panel: dynamic tool tab, Stamp Library, tabs
│   ├── StampImportDialog.jsx# Custom image stamp upload and cropping dialog
│   ├── ToolBar.jsx          # Left vertical tool rail
│   ├── ToolOptions.jsx      # Horizontal contextual options ribbon for active tools
│   └── Tooltip.jsx          # Floating hover tooltips
├── engine/                  # Core rendering and cartography engines
│   ├── biomesCatalog.js     # Biome definitions and procedural texture pattern generators
│   ├── mapTemplates.js      # Map core definitions (World, Region, City, Battle, Dungeon)
│   ├── pixiView.ts          # PixiJS WebGL2 live view implementation (TypeScript)
│   ├── presetMaps.js        # Built-in demo maps and stress-test benchmark scenes
│   ├── presets/             # Procedural generator scripts for demo maps
│   ├── renderer.js          # Canonical layer plan builder (buildPlan) and Canvas2D engine
│   ├── riverGen.js          # Procedural river pathfinding (distance field + noise)
│   ├── stampsCatalog.js     # Vector stamp catalog (276 stamps) and category definitions
│   └── stamps/              # Additional stamp definitions and directional views
│       ├── index.js         # Stamp module aggregator
│       ├── viewsBattle.js   # Dungeon props, chests, tables, tokens in plan/front views
│       ├── viewsCivA.js     # Castles, citadels, villages, windmills, bridges
│       ├── viewsCivB.js     # Towers, temples, lighthouses, docks, tents
│       ├── viewsLand.js     # Mountains, volcanoes, mesas, rolling hills, dunes
│       ├── viewsNautical.js # Caravels, galleons, kraken, sea serpents
│       ├── viewsTokens.js   # Hero and creature tokens
│       ├── viewsTrees.js    # Deciduous, evergreen, dead, autumn trees
│       ├── treesA.js        # Detailed tree vector renderers
│       ├── treesB.js        # Additional foliage vector renderers
│       ├── settlementsA.js  # Village and town structure vector renderers
│       └── settlementsB.js  # Fortification and castle vector renderers
├── plugins/                 # Plugin system infrastructure
│   ├── registry.js          # In-memory and IndexedDB plugin registry
│   ├── schema.js            # Strict data validation schema for JSON plugin packs
│   └── vectorRender.js      # Vector shape renderer for declarative plugin stamps
├── utils/                   # Helper utilities
│   ├── adjust.js            # Numeric stepping utilities for scale and rotation
│   ├── autosave.js          # IndexedDB persistence layer for map projects
│   ├── exportUtils.js       # Exporters: PNG, high-res PNG, layers ZIP, Universal VTT
│   ├── importGuard.js       # Security sanitizer for incoming project files
│   ├── keymap.js            # Shortcut action registry, key event combo matching, persistence
│   ├── layout.js            # Workspace layout configuration and CSS custom property applicator
│   ├── pathSmooth.js        # Polyline smoothing and Ramer-Douglas-Peucker simplification
│   ├── previews.js          # Pure canvas drawing helpers for preview pickers
│   ├── printUtils.js        # Sheet tiling mathematics and client-side PDF generator
│   ├── quality.js           # Zoom-adaptive resolution scaling and memory capping
│   ├── theme.js             # Theme definition catalog (Candlelit, Parchment, Orbit)
│   └── thumb.js             # Low-resolution map thumbnail generator
├── types.ts                 # TypeScript type definitions for data models and render plans
├── App.jsx                  # Root application component: state, undo/redo, event listeners
├── App.css                  # Core application styling and layout rules
└── main.jsx                 # React DOM root entry point
```

---

## Data Model and Persistence

### TypeScript Definitions (`src/types.ts`)
The primary data model elements are defined in `src/types.ts`:

- **Stamp (`Stamp`)**:
  Represents an individual prop, structure, terrain feature, or token placed on the canvas.
  ```typescript
  export interface Stamp {
    id: string;
    x: number;
    y: number;
    stampId?: string;       // References an ID in stampsCatalog.js or plugin pack
    customImage?: string;   // Embedded data:image/... base64 URL for user uploads
    aspect?: number;        // Width-to-height ratio (defaults to catalog aspect)
    scale?: number;         // Scale multiplier (1.0 = 80px base height)
    rotation?: number;      // Rotation in radians
    flipX?: boolean;        // Horizontal mirror
    flipY?: boolean;        // Vertical mirror
    anchor?: 'base' | 'center'; // Positioning anchor
    zIndex?: number;        // Within-layer depth sorting
    layer?: string;         // Target custom layer key (empty for default 'stamps')
    color?: string;         // Ink stroke color override
    fill?: string;          // Paper fill color override
    seed?: number;          // PRNG seed for generative variants
  }
  ```

- **Layer Style (`LayerStyle`)**:
  Specifies layer presentation parameters.
  ```typescript
  export interface LayerStyle {
    opacity?: number;                  // 0.0 to 1.0
    blend?: GlobalCompositeOperation;  // 'source-over', 'multiply', 'overlay', 'soft-light'
    locked?: boolean;                  // Prevents selection of contained objects
    name?: string;                     // Display name for custom layers
  }
  ```

- **Atmosphere Settings (`AtmosphereSettings`)**:
  Post-processing and lighting parameters applied across the scene.
  ```typescript
  export interface AtmosphereSettings {
    vignette: number;                  // 0.0 to 1.0
    parchmentGrain: number;            // 0.0 to 1.0
    sepia: number;                     // 0.0 to 1.0
    brightness: number;                // 0.5 to 1.5
    tint?: [number, number, number];   // RGB tint color
    tintAmount?: number;               // 0.0 to 1.0
    tintBlend?: 'multiply' | 'screen';
    weather?: 'rain' | 'snow';
    weatherAmount?: number;            // 0.0 to 1.0
    darkness?: number;                 // 0.0 to 0.95 (enables dynamic lighting)
    lights?: { x: number; y: number; r: number }[];
    walls?: number[][][];
    blocks?: number[][][];
  }
  ```

### Project Document Structure (`.inkforge`)
A serialized InkForge project file contains:
```json
{
  "version": "1.1.0",
  "app": "InkForge",
  "savedAt": "2026-10-16T18:00:00.000Z",
  "title": "My Realm",
  "type": "world",
  "template": "world",
  "width": 3200,
  "height": 2000,
  "landmasses": [...],
  "brushStrokes": [...],
  "stamps": [...],
  "paths": [...],
  "texts": [...],
  "grid": { "enabled": true, "type": "hex_flat", "size": 60, "opacity": 0.15, "color": "#1e293b" },
  "atmosphere": { "vignette": 0.4, "parchmentGrain": 0.35, "sepia": 0.2, "brightness": 1.0 },
  "coastline": { "ripplesEnabled": true, "sandEnabled": true, ... },
  "layers": { "c_1": { "name": "Dungeon Upper", "opacity": 1.0, "blend": "source-over" } },
  "customStamps": [...]
}
```

### Persistence and Autosave (`src/utils/autosave.js`)
InkForge stores user projects in the browser's IndexedDB database named `inkforge` (schema version 2), bypassing the restrictive ~5 MB quota of `localStorage`:
- **`projects` Store**: Stores complete project JSON documents keyed by `map_<timestamp>_<rand>`.
- **`meta` Store**: Stores lightweight metadata records (`{ id, title, template, width, height, updated, thumb }`) enabling fast rendering of the Home screen library without deserializing large map geometries.
- **`kv` Store**: Houses legacy migration keys.

In `App.jsx`, autosave executes with a **1.5-second debounce** whenever map geometry, stamps, paths, labels, or layers change.

### Import Sanitization (`src/utils/importGuard.js`)
Imported `.inkforge` files, library records, and plugin packs are treated as untrusted data and sanitized by `sanitizeProject`:
- Clamps canvas dimensions to a safe range (64px to 8000px) to prevent denial-of-service memory allocations.
- Enforces array types for all entity collections (`landmasses`, `stamps`, `paths`, etc.).
- Strips any remote image URLs (`http://`, `https://`), permitting only inline base64 image data URLs (`data:image/(png|webp|svg+xml);base64,...`).

---

## Dual Render Pipeline

InkForge employs a dual-engine architecture:
1. **PixiJS (WebGL2)**: Used for the interactive live canvas viewport.
2. **Canvas 2D**: Used for exports up to 16K, table-scale tiled PDF printing, thumbnail generation, and as an automatic fallback when WebGL is unavailable or running on software rendering.

```
                          ┌─────────────────────────┐
                          │   Map State (App.jsx)   │
                          └────────────┬────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │ renderer.js: buildPlan()│
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │  Canvas 2D Pipeline  │              │    PixiJS WebGL      │
        │     (renderMap)      │              │    (pixiView.ts)     │
        ├──────────────────────┤              ├──────────────────────┤
        │ • Layer raster cache │              │ • GPU composited     │
        │ • Direct export      │              │ • 1 Sprite per stamp │
        │ • Software fallback  │              │ • Live interactive   │
        └──────────────────────┘              └──────────────────────┘
```

### The Layer Plan (`buildPlan` in `src/engine/renderer.js`)
To guarantee that the Canvas 2D export matches the WebGL live view pixel-for-pixel, `buildPlan()` constructs a declarative execution graph:
- **`PlanItem`**: An array of layer objects:
  - `{ kind: 'layer', name, style, parts }`: Contains raster passes or stamp batches.
  - `{ kind: 'live', style, stroke }`: Low-latency live preview for strokes currently being drawn.
  - `{ kind: 'atmosphere', atmosphere }`: Post-processing composite containing lighting and weather operations.
- **Dependency Arrays (`deps`)**: Each raster part declares its input dependencies (e.g., `[landmasses, brushStrokes, coastline, width, height]`). Redraws occur only when dependencies change.

### Canvas 2D Pipeline & Layer Cache (`cachedPass`)
In `renderMap()`, each layer maintains an offscreen cache canvas when `cache: true` is passed:
- If a layer's dependency inputs have not changed, the cached canvas is blitted directly to the destination context via `drawImage()`, skipping expensive re-rasterization.
- Image load events trigger an `imageEpoch` bump, invalidating cached stamp layers so freshly loaded custom textures repaint cleanly.
- Exports pass `cache: false` to ensure pristine, isolated high-resolution rendering without cache contamination.

### PixiJS WebGL Live View (`src/engine/pixiView.ts`)
The `PixiMapView` class manages the WebGL2 scene graph:
- **Stamp Sprites**: Each stamp is represented by its own Pixi `Sprite`. Moving, scaling, or rotating a stamp updates only that single display object on the GPU without repainting the rest of the layer.
- **Raster Textures**: Complex layers (ocean, landmass terrain, paths, grid) are rendered to offscreen 2D canvases on dependency changes and uploaded as GPU `Texture` instances.
- **GPU Compositing**: Layer opacity and blend modes (`multiply`, `overlay`, `soft-light`) execute in WebGL shaders.
- **Hardware Fallback Check (`canUsePixi`)**:
  Before initializing Pixi, InkForge probes the WebGL context. If the GPU vendor matches software emulators (e.g., `SwiftShader`, `llvmpipe`) or exceeds the texture size limits, the engine gracefully falls back to the Canvas 2D path.

### Zoom Density and Memory Caps (`src/utils/quality.js`)
To maintain crisp rendering when zooming in:
- The live canvas redraws at higher density steps (`1×`, `1.5×`, `2×`, `3×`, `4×`) 250ms after zooming stops.
- To prevent browser tab crashes on massive maps, memory allocation is strictly bounded:
  - Live canvas: maximum 36 million pixels.
  - Individual raster layer cache: maximum 12 million pixels.
  - Offscreen render buffers: maximum 24 million pixels.

---

## Subsystems Deep Dive

### Stamps Catalogue and Views
Stamps are registered in `src/engine/stampsCatalog.js` and modularized across `src/engine/stamps/views*.js`.

#### Stamp Definition Schema
```javascript
{
  id: 'cas_citadel',
  name: 'Castle Citadel',
  category: 'world_civilization',
  rotate: 'fixed',                 // 'fixed' | 'tilt' | 'free'
  group: 'civ_castles',            // Grouping ID for drawer tiles
  groupName: 'Castles & Keeps',
  family: 'castle_citadel',        // Family linking perspective views
  view: 'side',                    // 'side' | 'top' | 'diag' | 'front'
  aspect: 1.1,                     // Width / Height ratio
  defaultScale: 1.2,
  anchor: 'base',                  // 'base' or 'center'
  render: (ctx, size, color, fill, seed) => {
    // Pure Canvas2D drawing commands
  }
}
```

#### Directional Views System
Stamps sharing a `family` property provide alternate perspective views:
- `side`: Isometric/profile view for regional and world maps.
- `top`: Top-down plan view for tactical battlemaps. Top views are always configured with `rotate: 'free'`.
- `diag`: 45-degree angled perspective.
- `front`: Frontal elevation view.

### Dynamic Lighting and Shadow Casting
Dynamic lighting runs when `atmosphere.darkness > 0`. The implementation resides in `src/engine/renderer.js`:

1. **Light Identification (`isLightStamp`, `lightRange`)**:
   Stamps matching `/campfire|brazier/` act as point light emitters. The light radius is calculated as:
   $$\text{Radius} = 6 \times \text{grid.size} \times \text{stamp.scale}$$

2. **Occluder Silhouettes (`blockerOutline`)**:
   Blocking stamps belong to categories matched by:
   `/^(dungeon_(walls|pillars|doors)|prop_(tables|chests|storage|altars|shelves)|geo_mountains|tree_)/`
   `spriteOutline()` renders the stamp to a temporary canvas and scans each column for its top and bottom opaque pixels. This traced outline is cached in unit coordinates ($0 \dots 1$) and transformed by the stamp's position, scale, rotation, and axis flipping.

3. **Ray-Casting Visibility Polygon (`visibilityPolygon`)**:
   Given a light position $(lx, ly)$, radius $r$, and occluder wall segments:
   - Collects all bounding box and wall segment endpoints.
   - Casts rays at angles $\theta - \epsilon$, $\theta$, and $\theta + \epsilon$.
   - Computes ray-segment intersection distances $t$.
   - Sorts intersection points angularly to produce a closed visibility polygon.

4. **Multi-Sample Area Light & Penumbra (`drawLighting`)**:
   To produce realistic soft shadows that widen with distance:
   - The light source is sampled across 8 jittered multi-ring positions (center sample weight 1.5, inner ring of 3 samples, outer ring of 4 samples).
   - Visibility polygons are clipped and drawn with `destination-out` using a radial gradient falloff curve.

5. **Ambient Bounce Illumination**:
   An ambient radial pass cut through darkness maintains ~50% visibility within lit areas. Solid dungeon walls block this ambient bounce, but small prop blockers (tables, chests) allow diffuse bounce to bleed around them.

6. **Warm Firelight Glow**:
   Concentric radial gradients matching the cut falloff are composited using `screen` blending to cast warm amber firelight over the terrain.

### Hydrological River Generation and Masking
River generation logic is located in `src/engine/riverGen.js`:

1. **Distance-to-Coast Field (`coastDistance`)**:
   Calculates the minimum distance from every land cell to water using a two-pass chamfer distance transform on a downsampled land mask.

2. **Meandering Descent (`flowRiver`)**:
   Given a starting land coordinate:
   - Calculates a synthetic elevation metric:
     $$\text{Height}(x, y) = \text{Distance}(x, y) + 3 \times \text{Noise}_1(x/7, y/7) + 1.2 \times \text{Noise}_2(x/3, y/3)$$
   - Steps iteratively in the direction of steepest descent, limiting turns to at most 50° per step to enforce hydrological plausibility.
   - Terminates when the path reaches a distance value of zero (the coast) or exits the canvas.

3. **Coastline Masking (`renderPaths`)**:
   On maps with landmasses, rivers are drawn to an offscreen buffer and masked using `destination-in` with the land mask buffer (`drawLandMask`). This ensures rivers stop cleanly at the shoreline without spilling into the sea. Rivers are drawn prior to roads and walls.

### Keyboard Shortcuts and Layout Systems

#### Keymap Architecture (`src/utils/keymap.js`)
- **Action Catalog (`ACTIONS`)**: Contains all bindable editor actions with default keys.
- **Key Event Normalization (`comboOf`)**: Translates `KeyboardEvent` into normalized combo strings (`'Ctrl+Z'`, `'V'`, `'Shift+['`). Crucially, handles `AltGraph` on European keyboards (interpreting characters like `[` rather than `Ctrl+Alt`).
- **Single-Owner Invariant (`bind`)**: A key combination belongs to exactly one action. Assigning an existing key to a new action unbinds it from its previous action.
- **Persistence**: Serialized to `localStorage` under `inkforge-keys`.

#### Layout Management (`src/utils/layout.js`)
- Controls tool rail side (`left` / `right`), sidebar panel side (`left` / `right`), panel width (240px to 560px), and status bar visibility.
- `applyLayout()` injects CSS custom properties (`--panel-w`, `--order-toolbar`, `--order-stage`, `--order-panel`) onto `document.documentElement`, allowing responsive CSS Flexbox reordering without React DOM restructuring.

---

## Extension Guides for Contributors

### How to Add a Stamp

1. Open `src/engine/stampsCatalog.js` (or create a dedicated module in `src/engine/stamps/` and re-export it in `src/engine/stamps/index.js`).
2. Add a stamp definition object:
   ```javascript
   {
     id: 'nature_runestone',
     name: 'Ancient Runestone',
     category: 'world_nature',      // 'world_nature' | 'world_civilization' | 'world_nautical' | 'battle_rooms' | 'battle_props' | 'battle_tokens'
     rotate: 'tilt',                // 'fixed' (upright) | 'tilt' (slight variance) | 'free' (any angle)
     group: 'geo_boulders',         // Groups together with related assets in the drawer
     groupName: 'Rocks & Boulders',
     aspect: 0.8,                   // Width / Height ratio
     defaultScale: 1.0,
     anchor: 'base',                // 'base' for standing props, 'center' for floor tiles
     render: (ctx, size, color = '#2c221e', fill = '#e2e8f0', seed = 1) => {
       ctx.save();
       const s = size;
       // Execute Canvas 2D drawing routines scaled to size s
       ctx.beginPath();
       ctx.rect(s * 0.2, s * 0.1, s * 0.6, s * 0.8);
       ctx.fillStyle = fill;
       ctx.fill();
       ctx.strokeStyle = color;
       ctx.lineWidth = s * 0.04;
       ctx.stroke();
       ctx.restore();
     }
   }
   ```
3. To add directional variants (top, side, front), define matching entries with `family: 'nature_runestone'` and `view: 'top'`.

*Alternatively, custom stamps can be contributed without code changes via declarative [Plugin Packs](PLUGINS.md).*

### How to Add a Biome

1. Open `src/engine/biomesCatalog.js`.
2. Add the biome configuration to `BIOMES`:
   ```javascript
   {
     id: 'crystal_cavern',
     name: 'Crystalline Depths',
     category: 'battle',            // 'world' or 'battle'
     color: '#1e1b4b',
     secondaryColor: '#312e81',
     roughness: 0.5,
     preview: '#1e1b4b',
     description: 'Luminous amethyst crystals and deep subterranean stone'
   }
   ```
3. (Optional) Define a custom procedural surface painter in the `PAINTERS` map in `biomesCatalog.js`:
   ```javascript
   crystal_cavern: (kit, biome) => {
     kit.mottle(biome.color, biome.secondaryColor, 1.2, 12);
     // Draw crystal facets using kit canvas helpers
   }
   ```
4. If the biome should appear in specific map templates, add its ID to the `biomes` array in `src/engine/mapTemplates.js`.

### How to Add a Tool

Adding a new tool involves four steps:
1. **Declare Tool in `src/components/ToolBar.jsx`**:
   Add an entry to `TOOLS`:
   ```javascript
   { id: 'measure', name: 'Ruler & Measure', icon: Ruler, shortcut: 'R', desc: 'Measure distances in feet or hexes' }
   ```
   Add its ID to `DRAW_IDS` if it is a drawing tool, or leave it in utility tools.
2. **Register Key Binding in `src/utils/keymap.js`**:
   Add `{ id: 'tool.measure', label: 'Ruler & Measure', group: 'Tools', keys: ['R'] }` to `ACTIONS`.
3. **Add Tool Options in `src/components/ToolOptions.jsx`**:
   Add a rendering branch for `activeTool === 'measure'` in the options ribbon.
4. **Wire Interaction Handlers in `src/components/CanvasArea.jsx`**:
   Add mouse/pointer handlers for `activeTool === 'measure'` to capture clicks and drags.

### How to Add a Light Preset

1. Open `src/components/LayersPanel.jsx`.
2. Add an entry to `LIGHT_PRESETS`:
   ```javascript
   BloodMoon: {
     ...CLEAR,
     vignette: 0.6,
     parchmentGrain: 0.3,
     sepia: 0,
     brightness: 0.85,
     darkness: 0.4,
     tint: [180, 20, 30],
     tintAmount: 0.5,
     tintBlend: 'multiply'
   }
   ```
3. The preset will immediately appear as a clickable chip in the Atmosphere tool ribbon and the Layers panel.

---

## Environment, Build, and Testing

### Runtime & Node Requirements
- **Node.js 24+**: InkForge requires Node.js 24 or newer because it utilizes **Vite 8** as its build tool and dev server.
- **npm**: Standard package manager.

### Common Commands
```bash
npm install        # Install project dependencies
npm run dev        # Launch Vite development server on http://localhost:5173
npm run build      # Compile production build into dist/
npm test           # Run unit tests via node:test runner
npm run typecheck  # Run strict TypeScript compiler verification (tsc)
npm run lint       # Run Oxlint linter
node server.js     # Run zero-dependency local static server for dist/
```

### Test Suite (`tests/`)
Tests run using Node's native test runner (`node --test`) and require no external test framework:
- `tests/planPrint.test.js`: Verifies paper tiling calculations, overlap margins, and sheet row/column counts.
- `tests/buildZip.test.js`: Tests the store-only ZIP builder and CRC32 checksum generator.
- `tests/buildPdf.test.js`: Tests low-level binary PDF generation.
- `tests/importGuard.test.js`: Tests sanitization of project files and rejection of malicious inputs.
- `tests/keymap.test.js`: Tests shortcut binding, conflict displacement, and unbinding.
- `tests/layout.test.js`: Tests panel flex ordering and boundary constraints.
- `tests/lighting.test.js`: Tests shadow occluder polygons and ray-casting intersections.
- `tests/pathSmooth.test.js`: Tests Ramer-Douglas-Peucker spine thinning.
- `tests/plugins.test.js`: Tests JSON plugin pack schema validation against `examplePack.json`.
- `tests/previews.test.js`: Verifies canvas preview drawing helpers.
- `tests/riverGen.test.js`: Tests chamfer distance transforms and river descent logic.

### Code Style Guidelines
- Modern ES Modules (`import`/`export`).
- React 19 functional components with standard hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`).
- Strict TypeScript (`types.ts`, `pixiView.ts`). New modules should be authored in TypeScript or cleanly typed JavaScript.
- Avoid external CSS dependencies: UI styles are managed via vanilla CSS in `App.css`, `index.css`, and `previews.css`.

---

## Security Model and CSP

InkForge enforces a strict Content Security Policy (CSP) injected into built production pages (`vite.config.js`):

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self' data: blob:;
worker-src 'self' blob:;
object-src 'none';
base-uri 'none';
form-action 'none';
```

### Security Implications
- **No Remote Code Execution**: Remote scripts, `eval()`, and inline event attributes are prohibited.
- **PixiJS Unsafe-Eval Build**: PixiJS is loaded with its `pixi.js/unsafe-eval` shim, eliminating the need for `'unsafe-eval'` in the CSP.
- **Network Privacy**: Opening a project or installing a plugin pack will never cause the browser to make background HTTP requests to third-party tracking servers.
- **Local Static Server (`server.js`)**: Configured with strict path traversal checks, MIME type validation, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and default binding to `127.0.0.1`.

---

## Licensing and User Ownership

InkForge is Free and Open Source Software licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0-or-later)**.

### User Output Ownership Guarantee
Section 2 of the Additional Terms in [LICENSE](../LICENSE) guarantees full ownership of user creations:
> **All maps, graphics, exported images (PNG, PDF, SVG), Universal VTT files (`.dd2vtt`), and project save files (`.inkforge`) created by users utilizing InkForge are the exclusive intellectual property of the user who authored them.**
> InkForge asserts no copyright, licensing claims, or royalty requirements over user-created works. Users may freely use, publish, distribute, and commercially sell maps generated with this software.

### Copyleft Reciprocity
Anyone hosting a modified version of InkForge over a computer network must make the complete corresponding source code available under the AGPLv3.

### Trademark Policy
The name "InkForge" and official project logos are trademarks of the original author and cannot be used for commercial endorsement of derivative works without prior written consent.
