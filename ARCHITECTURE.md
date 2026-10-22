# InkForge architecture

Short orientation map, checked against `src/` (v1.13.0). Longer guide: `docs/Architecture.md`.
No backend: everything runs in the browser; maps live in IndexedDB or in `.inkforge` files.

Stack: React 19, Canvas 2D (all drawing code), PixiJS 8 (live view only), Vite 8, TypeScript 7 (only `pixiView.ts`, `types.ts`; `tsc` via `npm run typecheck`), oxlint, `node --test`.

## src map

```
main.jsx            loads installed content packs, then renders <App/> (StrictMode)
App.jsx             the one stateful component: document, history, tool settings, library, import/export
App.css, index.css  styles (themes via data-theme)
types.ts            Plan / Part / Stamp / AtmosphereSettings types shared with pixiView.ts
components/         UI (CanvasArea = pointer input + render trigger; ToolOptions, StampDrawer, LayersPanel,
                    ObjectsPanel, ExportDialog, PrintDialog, SettingsDialog, PluginsSettings, Home, NewMapDialog,
                    PreviewPicker, StampImportDialog, Header, ToolBar, Tooltip)
engine/
  renderer.js       buildPlan() + renderMap() + all Canvas 2D drawing (land mask, coast FX, biomes, paths, text,
                    stamps, grid, atmosphere)
  pixiView.ts       PixiMapView: draws the same plan with PixiJS (own chunk, lazy-imported)
  stampsCatalog.js  STAMPS, STAMP_CATEGORIES, getStampById, syncPluginStamps
  stamps/*.js       procedural stamp definitions, combined in stamps/index.js (EXTRA_STAMPS); inkHelpers.js shared
  biomesCatalog.js  BIOMES, getBiomePattern, syncPluginBiomes
  mapTemplates.js   TEMPLATES, getTemplate, blankProject, biomesFor
  presetMaps.js, presets/*  sample maps (PRESET_MAPS) shown on the home screen
plugins/
  features.js       FEATURES manifests + isFeatureOn/setFeature/useFeature (localStorage 'inkforge.features')
  builtin/<id>/     first-party feature plugins: maskFill, lighting, riverGen (+flow.js), weather
  registry.js       content packs (data only): installPack/removePack/setEnabled/loadInstalled, pluginStamps/Biomes/...
  schema.js, vectorRender.js   pack validation and drawing of pack vector stamps
utils/
  autosave.js       IndexedDB library          exportUtils.js  PNG/WebP/JPG, VTT, .inkforge JSON, ZIP writer
  importGuard.js    sanitizeProject, size clamp printUtils.js   print planner + PDF writer
  keymap.js         rebindable keys            layout.js, theme.js, stampPrefs.js, quality.js (zoom, quality levels)
  pathSmooth.js, thumb.js, adjust.js, previews.js
tests/*.test.js     node:test unit tests for the pure modules (keymap, layout, importGuard, planPrint, buildPdf,
                    buildZip, lighting, maskFill, riverGen, plugins, previews, pathSmooth, liveStroke)
```

Stamp views: stamps carry `family`/`view` (see `stamps/views*.js`) and are appended in `stamps/index.js`.

## State and store

There is no store library. `App.jsx` holds everything in `useState`:

- Document: `landmasses, brushStrokes, stamps, paths, texts, grid, atmosphere, coastline, layers, customStamps`,
  plus `mapTitle, mapType, template, mapWidth, mapHeight`.
- Tool/UI state: `activeTool`, per-tool settings (brush, stamp, path, text), selection (`selectedStampId`,
  `groupIds` for multiselect, `selectedTextId`, `selectedPathId`), `zoom`, `panOffset`, dialogs, `view`
  (`'home' | 'editor'`), `currentMapId`.
- Everything is passed down as props (CanvasArea receives the document and handlers).

Undo/redo: `hist = { list, index }` of snapshots `{landmasses, brushStrokes, stamps, paths, texts}`.
`recordHistory` skips a snapshot whose fields are all identical (by reference) to the current one;
`scheduleCommit` folds slider edits into one step after 400 ms; `handleCommitAction` commits on mouse release.
`docRef`/`histRef` mirror latest state so timers and handlers avoid stale closures. Undo with pending
unrecorded edits drops them back to the last snapshot. Grid, atmosphere, coastline and layers are NOT in history.

Small external stores use `useSyncExternalStore` with module state: `plugins/features.js`, `plugins/registry.js`.

Browser storage keys (localStorage): `inkforge-keys`, `inkforge-layout`, `inkforge-theme`, `inkforge-livePreview`,
`inkforge-strokeOutline`, `inkforge-brushRing`, `inkforge-plugin*`, `inkforge.export`, `inkforge.features`,
`inkforge.stamps` (hide built-in stamps). Each read/write is in try/catch.

## Render pipeline

1. `CanvasArea` collects props and, once per animation frame, calls `buildPlan(props)` (`engine/renderer.js`).
2. `buildPlan` returns `{width, height, items}`. Items, bottom to top: `layer` (name, style, `parts`),
   `live` (stroke in progress), `atmosphere`. A part is `raster` or `stamps`, each with `deps` (inputs that
   decide when to redraw) and `draw(ctx)`. Layer order and cache keys therefore live in one place for both backends.
3. Backends:
   - **Pixi** (`PixiMapView.render(plan)`): default when usable. Created lazily by dynamic import in `CanvasArea`;
     `repaint on demand` (`autoStart:false`), no Pixi pointer events (the page owns input). Raster parts are drawn to
     canvases uploaded as textures; atmosphere has its own container; see pixiView.ts for the rest.
     `setQuality(q)` re-renders at q canvas pixels per map unit.
   - **Canvas 2D** (`renderMap({ctx, cache:true, ...})`): fallback view, and the only path for export, VTT,
     print and thumbnails (export uses `renderExportCanvas`). `cachedPass` caches each layer by its `deps`.
4. Backend choice (`CanvasArea`): Canvas 2D if `?renderer=2d`; Pixi if `canUsePixi()` passes; any failure logs a
   warning and sets `fallback`. `canUsePixi` needs WebGL2, map size <= `MAX_TEXTURE_SIZE`, and a non-software GPU
   (SwiftShader/llvmpipe/software rejected) unless `?renderer=pixi` forces it.
5. Quality: `utils/quality.js` `pickQuality(zoom x DPR)` over levels 1, 1.5, 2, 3, 4; cap = min(4, sqrt(36e6/(w*h)),
   8192/w, 8192/h); rises early (95%), falls only below half. Pixi raster layers use a lower cap (12e6 pixels).
   Zoom range 0.1 to 8.
6. Live painting: `liveStroke` (cheap outline) or `landStroke` (real land layer at reduced scale, `liveScale`
   <= 0.5 / ~1.5M px) depending on the Live preview / Stroke outline toggles.
7. Atmosphere: `atmosphereOps()` turns settings into ops (`grain`, `solid`, `lighting`, `weather`, `vignette`);
   lighting and weather come from feature plugins and are skipped when switched off.
8. Lighting: light stamps are those matching `/campfire|brazier/`; shadows use traced sprite silhouettes
   (`blockerOutline`) and `visibilityPolygon`; the VTT export reuses the same functions.

## File and save formats

- **Library**: IndexedDB database `inkforge` v2, stores `projects` (full map, key = map id `map_<time><rand>`),
  `meta` (title, template, size, thumbnail, `updated`) and `kv` (legacy single-map autosave `autosave`, migrated
  into the library by `listMaps()`). Autosave runs 1.5 s after any document change while in the editor; leaving
  to home saves with a fresh thumbnail (otherwise thumbnails refresh at most every 10 s).
- **Project (`buildProject`)**: `title, type, template, width, height, landmasses, brushStrokes, stamps, paths,
  texts, grid, atmosphere, coastline, layers, customStamps` (custom stamp image sources as data URLs).
- **`.inkforge` file**: pretty JSON from `exportToJson`: `{version:'1.1.0', app:'InkForge', savedAt, ...project}`.
  `importFromJson` runs `sanitizeProject` (importGuard): width/height clamped to 64..8000, list fields must be
  arrays of objects, images kept only as `data:image/(png|jpeg|webp|gif|svg+xml)` URLs (no remote URLs), then
  rebuilds `Image` objects.
- **Export dialog** (`ExportDialog`, prefs in `inkforge.export`): PNG/WebP/JPG, VTT (`.dd2vtt`), layers ZIP
  (store-only writer `buildZip`), print PDF (`planPrint` + `buildPdf`). Scale 0.5 to 8, capped by
  `maxExportScale` = min(16384/longest side, sqrt(190e6/pixels)).
- **Content packs** (`.json`, data only, validated in `plugins/schema.js`, namespaced `<pack>:<id>`, stored in IndexedDB
  by the registry): see `docs/PLUGINS.md`, example in `docs/plugins/examplePack.json`.
- Mask fill stores a stroke with `shape:'fill'` and row `runs`; stamp fields (types.ts)
  `stampId, x, y, scale, rotation, flipX/flipY, anchor, zIndex, layer, seed, tone, hue, color, fill, customImage`.

## Build and serve

```bash
export PATH=/root/.agent-reach/tools/node-v24.21.0-linux-x64/bin:$PATH   # system Node is 18; Vite 8 needs 24+
npm install
npm run dev        # vite dev server
npm run build      # vite build -> dist/
npm test | npm run typecheck | npm run lint
```

- `vite.config.js`: `base: './'`; the `inkforge-csp` plugin injects a Content-Security-Policy meta tag in built
  pages only (script-src 'self'; Google Fonts for styles/fonts; img/connect allow data: and blob:).
- **Serving**: the `inkforge-ship` nginx container (host port 48123 -> 80) bind-mounts
  `/home/spejle/projects/web/inkForge/dist` read-only at `/usr/share/nginx/html`, with config
  `/home/spejle/servers/ship/inkforge/nginx.conf`. Every `npm run build` therefore goes live immediately. Do not
  build experiments into `dist`; use `npm run dev` or build elsewhere. Public URL (per project notes):
  inkforge.spejle.xyz via the Cloudflare tunnel.
- `git` may need `-c safe.directory=<repo>` when run as root (repo owned by another user).

## Gotchas

- Pixi is rejected on software GL, so headless Chromium without a GPU always uses Canvas 2D; use
  `?renderer=pixi` to test Pixi there.
- `plugins/features.js` holds the feature manifests on purpose: the renderer imports the plugins and plugins import
  `isFeatureOn`, so manifests inside plugin folders would make an import cycle.
- Custom stamp images: `customImage` is an `Image` in memory but a data URL on disk/IndexedDB; `hydrateStamps`
  and `importFromJson` convert back. The Pixi view tracks an `epoch` that bumps when an image finishes loading.
- Only landmasses, brushStrokes, stamps, paths and texts are undoable.
- Layer ordering and caching are defined solely by `buildPlan`; adding a layer means changing it and `types.ts`,
  and both backends must handle the new part.
- Stamps are 80 map units at scale 1 (`BASE` in pixiView.ts; keep equal to the Canvas 2D renderer).
- Large maps (4000x2800 stress map) make live land preview choppy (CHANGELOG 1.12.0).
- The Vite dev watcher ignores `**/.claude/**` because agent worktrees inside the project exhaust file watches.
