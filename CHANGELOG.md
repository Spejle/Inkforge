# Changelog

All notable changes to **InkForge** will be documented in this file.

## [1.12.0] - 2026-10-16

### Added
- **Live land preview.** While you drag a Landmass Sculptor or Biome brush stroke, the land layer (coastline, sand, ripples, shadow, biome fill) is rendered for real with the stroke in it, instead of an outline. It runs at reduced resolution (half, less on big maps), once per frame, and the full-quality pass runs on release. Works in Canvas 2D and Pixi. Toggle: Preview > Live preview (on by default; turn it off on a slow machine).

### Changed
- The old cheap outline is now the **Stroke outline** toggle, off by default (new saved setting, so earlier choices do not carry over). It only shows when Live preview is off.

## [1.11.1] - 2026-10-16

### Changed
- **Believable cast shadows and soft widening penumbra.** Lights now model an area emitter sampled across 8 multi-ring jittered positions, casting soft-edged shadows whose penumbra widens naturally with distance from the occluder while remaining crisp at the object's base.
- **Ambient bounce illumination in shadows.** Shadows cast by objects within the light radius are no longer pitch black; an ambient bounce pass maintains visibility of underlying terrain and props (~50% darkness rather than unlit night) bounded by structural dungeon walls.
- **Shadows follow the object's real shape.** A blocking stamp's drawn sprite is traced once (top and bottom opaque pixel of each column, cached) and that outline casts the shadow, so a pine throws a pine-shaped shadow and a crate a crate-shaped one; scale, rotation and flips apply. Dungeon walls, doors, furniture, mountains and trees all use it.
- **Harmonized warm glow and concentric radial falloff.** Warm torchlight glow and darkness cuts share identical concentric radial falloff curves fading smoothly to zero at the light radius, eliminating edge blobs and petal artifacts.


## [1.11.0] - 2026-10-16

### Added
- **Multiselect.** Drag a rubber band over empty canvas with the Select tool (it picks stamps whose anchor is inside), or Shift+click to add or remove one. The group moves together and Delete removes all of it. The Objects tab does the same with Shift/Ctrl+click.
- **Objects tab** (right panel): every stamp, label and river grouped by layer, with a filter box. Click selects; drag rows onto a layer heading to move them between layers (a custom layer works as a group).
- **Editable spines.** Select a river, road or wall and its points show as handles: drag to reshape, double-click a point to delete it, double-click the line to add one. Dense freehand lines are thinned to a spine (4 px tolerance) the first time you grab one.
- **Light and weather presets** in the Atmosphere tool: Day, Dusk, Night, Cloudy, Rain, Snow, Torchlit, Fog. A colour wash plus optional rain or snow (seeded, so exports match the screen), with an intensity slider.
- **Dynamic lighting.** The new Darkness slider darkens the map; campfires and braziers cut light through it (6 grid squares at scale 1, scaling with the stamp) and walls cast shadows, as do dungeon walls, pillars and doors, furniture, mountains and trees (a tree blocks with its trunk and inner crown). The .dd2vtt export now writes each light's real range and leaves darkness out of the image, so Foundry does its own.
- **River generation.** Path tool, River, "Generate on click": click on land and a river meanders from there to the nearest coast. Every click gives a different course.

### Changed
- Ctrl + wheel now rotates in 1 degree steps; Ctrl + Shift + wheel gives the old 5 degree notch.
- Rivers are cut off where they leave the land mask instead of running out over the sea (maps with no land at all, such as dungeons, are unaffected). Rivers are drawn under roads and walls.

## [1.10.1] - 2026-10-16

### Fixed
- **Stamps and everything else turned into blurry bitmaps when you zoomed in.** The map was drawn once at 1 pixel per map unit and the browser merely enlarged it. The live view now redraws at the density of the zoom (zoom x screen scale, in steps 1 / 1.5 / 2 / 3 / 4) a quarter of a second after you stop zooming, so stamps, rivers, labels, the grid and the coastline stay sharp. Pointer positions are measured in map units, so selecting and painting are unaffected.
- The terrain and ocean textures follow: biome tiles are painted at the matching density (grass tufts stay crisp), and the land pass (coast mask, sand, outline) builds its offscreen buffers at the drawn scale instead of at 1x. This also sharpens coastlines in high-resolution PNG exports, which used to be enlarged 1x masks.

### Notes
- Memory is capped: the live canvas uses at most 36 million pixels (so a 2800x1800 map goes to 2.67x, a small map to 4x, a 4000x2800 map stays near 1.8x), each raster layer at most 12 million, and offscreen buffers in a render at most 24 million, so big maps and 16K exports fall back to enlarging instead of allocating gigabytes.
- Not changed: the ocean wave marks, the parchment grain and the live-stroke preview stay at 1x.

## [1.10.0] - 2026-10-15

### Added
- **Wheel modifiers.** Shift + wheel changes size and Ctrl + wheel rotates (Ctrl + Shift: 1 degree steps instead of 5), and a small hint at the top of the canvas shows the new value. With the Select tool they act on the selected stamp (scale, rotation), label (size, rotation) or river (width); otherwise on what the active tool is about to place: brush size for the Sculptor, Biome and Eraser tools, stamp scale and rotation, river width, label size. Limits are the same as the sliders. Plain wheel still zooms; Ctrl + wheel no longer zooms the browser page.
- **Settings** (gear in the header, and on the main menu). *Appearance* picks the theme from three cards: **Candlelit** (the dark one), **Parchment** and the new **Orbit** theme taken from the Orbit panel (neutral greys, heaven blue accent, hell red for danger). The header button still cycles the three. *Keyboard & mouse* lists every shortcut with its keys: click a key to change it, + adds another, x removes one, per-action and global reset; a key belongs to one action (giving it away shows what it was taken from). Tool badges and tooltips follow the bindings. Saved in the browser, like the theme.
- Rotate keys also on `,` and `.` (Shift = 1 degree) because `[` and `]` need AltGr on Czech and many other layouts; AltGr is now read as the character it types instead of Ctrl+Alt, so those keys work there.

### Fixed
- Shift + `[` / `]` (fine rotation) never fired on a US layout because the browser reports `{` / `}`; keys are now matched by position.

## [1.9.1] - 2026-10-15

### Changed
- **Default world map remade** ("The Realm of Valoria & The Shattered Reach"): 87 stamps (was 38) using 33 of the new views: diagonal and side mountains, plan-view farms, villages and harbours, ships in several views, sea serpents and the kraken, lighthouses, windmills, temple fronts. The remake was laid out by the Gemini intern; this release also removes two stamps that referenced IDs that never existed (`windmill_stone`, `dragon_wyrm`, so they never drew) and a plan-view mountain ring that looked wrong.
- **Battle map "Ambush at Ravenford" remade** with top-down props: bandit camp tents, chests, barrel stacks and crates, a ruined watchtower in plan view, an altar; 150 stamps (was 138). Terrain, river, ford and tokens unchanged.
- Four weak stamp views redrawn: `castle_citadel_top` (proper plan with round roofed towers, no more "prohibited" signs), `village_houses_top` (clustered roofs and paths), `civ_lighthouse_side` (rocky base, balustrade, light beams), `windmill_front` (stone tower mill).

### Known
- The bandit camp sits close to the top edge of the battle map; a couple of tents are partly cut by it.

## [1.9.0] - 2026-10-15

### Added
- **81 new stamp views** (276 stamps in total). Directional stamps now come in several viewing directions, kept together in the same drawer group: side, top (plan), diagonal and front versions of dungeon walls, doors, pillars and stairs; tavern table, chests, barrels, throne, altar and bookshelf; hero and dragon tokens (front and side busts); sailing ships, sea serpents and the kraken; mountains, volcanoes, mesa, hills and dunes, fallen log and stump; castle citadel, keep, village, windmills, wizard tower, lighthouse, ruined tower, bridge, farm, port dock, temple and tent. 44 stamp families, one new file per area (`src/engine/stamps/views*.js`), drawn by the Gemini intern and reviewed on contact sheets.
- A `top` view is always freely rotatable; the other views follow their base stamp's rotation policy.

### Known
- A few views are weak and are queued for a redraw: `castle_citadel_top` (corner towers read as "prohibited" signs), `village_houses_top` (reads as crates), `civ_lighthouse_side` and `windmill_front` (too close to the originals).
- The generated settlement and castle sets (`set_*`, `cas_*`, `tr_*`) have no extra views yet.

## [1.8.4] - 2026-10-15

### Fixed
- **Carving water left the old shallows behind.** The light-blue shallow-water halo was drawn from the land shapes as they were first painted, so when you carved water out of land the halo of the removed land stayed in the channel (lighter, smoother blue with the ocean's wave marks hidden). When a map has carved water, the halo is now measured from the finished land mask (distance field at half resolution, same ring distances and strengths), so carved channels show plain ocean and the shallows follow the real coastline. Maps without carving use the same rings as before.

### Added
- **Preview switches** for the Mask and Brush tools (Preview: Stroke / Cursor ring), remembered between sessions. *Stroke* is the flat shape drawn while you drag (off: the stroke appears when you let go); *Cursor ring* is the dashed brush-size circle that follows the pointer.
- **Open-source licensing & legal terms**: Added `LICENSE` under GNU AGPLv3 (AGPL-3.0-or-later) with an explicit User Output Ownership guarantee (100% commercial ownership of user-exported maps) and trademark protection for the InkForge identity. Added donation and community sponsorship channels to `README.md`.
- **Customer discovery & validation strategy**: Documented 20-question Mom Test interview script and 30-day go/no-go roadmap in `CUSTOMER_DISCOVERY_STRATEGY.md`.

### Changed
- The dev server ignores `.claude/` (agent worktrees inside the project exhausted the file-watch limit and made Vite serve stale modules).

## [1.8.3] - 2026-10-15

### Changed
- **Stamps grouped much further.** 58 groups now cover 193 of the 195 stamps (only the compass rose and the boss marker stand alone), down from 135 grouped. Related stamps share one tile in the drawer: broadleaf, autumn, willow and birch trees; conifers with the snowy ones; mountains with volcanoes; hills with dunes and mesas; desert plants; rocks, logs and stumps; reeds and wetland plants; grass with flowers and fungi; ponds with whirlpools; campfires with braziers. Grouping was proposed by the Gemini intern and merged and checked here (no group has two names).
- Stamp definitions can carry `family` and `view` (`side`, `top`, `diag`, `front`). 44 directional stamps are tagged with the view their art shows; extra views will join them in the same group, and a view always inherits its base stamp's group and category, so regrouping a base regroups its views. The drawer's variant list shows the view in each name.

## [1.8.2] - 2026-10-15

### Security
- **Imported projects are no longer trusted** (`src/utils/importGuard.js`): `.inkforge` files and library entries go through `sanitizeProject`. Canvas size is clamped to 64-8000 px (a crafted file could ask for a multi-gigapixel canvas and freeze the tab), list fields must be lists (a wrong type used to crash the editor on every open, and the broken project was autosaved), and stamp images may only be embedded `data:image/...` (a remote URL in a shared file made the viewer's browser contact that server on open). The stamp loader refuses non-embedded sources as well.
- **Content-Security-Policy** in the built page (build only, so dev hot reload still works): scripts, connections and images from the page itself plus embedded data, styles and fonts from Google Fonts only, no plugins, no `<base>`, no form posts. PixiJS now loads its `unsafe-eval` build so the policy needs no `'unsafe-eval'`. Checked in a browser in both render modes, including PNG export.
- **`server.js`**: the directory check was a prefix test, so a sibling folder such as `dist-secret` could be read; fixed (resolved path plus separator). A malformed URL escape (`%E0%A4%A`) threw and killed the server; now a 400. Removed `Access-Control-Allow-Origin: *`, added `nosniff` and `no-referrer`, and it now listens on 127.0.0.1 unless `HOST=0.0.0.0` is set.
- Tests for the guard (`tests/importGuard.test.js`).

### Known
- Google Fonts is still loaded from Google (privacy and a third-party stylesheet); self-hosting the fonts would remove it.

## [1.8.1] - 2026-10-15

### Added
- **Per-stamp rotation policy.** Every stamp definition now carries `rotate`: `fixed` (stays upright: trees, mountains, buildings, ships, standing figures), `tilt` (a small natural lean: hills, bushes, rocks) or `free` (top-down or symmetric: dungeon pieces, tavern tables, campfires, pools, whirlpools, hero and monster tokens). 195 stamps tagged (162 fixed, 18 tilt, 15 free); tagged by the Gemini intern, reviewed.
- **Jitter respects it**: it no longer leans castles and trees by a random angle; `free` stamps spin to any angle, `tilt` keeps the old small lean. Stamps without a policy behave as before. The rotation slider, the rotate handle and `[` `]` still turn any stamp by hand.

### Known
- A few battle props (chests, throne, altar, barrel stack, bookshelf) are drawn front-on and are tagged `fixed`; switch to `free` if they turn out to be top-down.

## [1.8.0] - 2026-10-15

### Added
- **PixiJS (WebGL) live view** (`src/engine/pixiView.ts`, TypeScript). Each cached layer is a GPU texture; layer order, opacity and blend, and the atmosphere are composited on the GPU. Every stamp is its own sprite, so moving one stamp touches one sprite instead of redrawing the stamp layer. Stamp selection handles are a small sprite redrawn only when the selection changes. A stroke being painted uploads only its bounding box.
- **Layer plan** (`buildPlan` in `renderer.js`): one ordered list of layers, parts and cache keys that both the Canvas 2D path and the Pixi view consume, so they cannot drift apart. `renderMap` is now a thin consumer of it.
- Styled layers that contain stamps (opacity or blend set) are rendered into a texture first, so stamps in a layer blend as one group, like Canvas 2D.

### Changed
- Export, print and thumbnails still use the Canvas 2D renderer (exact output up to 16K, no GPU texture limit).
- The live view falls back to Canvas 2D when WebGL is missing, the map is larger than one GPU texture, or the renderer is software GL (SwiftShader, llvmpipe), where Canvas 2D is faster. `?renderer=2d` forces Canvas 2D, `?renderer=pixi` forces Pixi.

### Verified
- Pixel comparison against the 1.7.2 renderer (headless Chromium): every one of 120 sampled stamps lands on the same centroid; sample region map mean difference 0.5/255, Obsidian Reach 2.1/255 (about 1% of pixels differ by more than 24, at anti-aliased edges and overlaps); multiply, opacity and custom layers within 0.7; overlay 0.8.
- Stamp select and drag, and the Canvas 2D fallback, checked in the running app.

### Known
- **Speed on a real GPU has not been measured.** The only WebGL available here is software (SwiftShader), where a Pixi frame costs more than the cached Canvas 2D path (region map 330 ms against 30 ms; Obsidian Reach 2.1 s against 1.1 s per stamp move), which is why software GL falls back. Moving a stamp does no CPU redraw (2-3 ms of JavaScript on Obsidian Reach, against 1.1 s before).
- Custom-image stamps and the parchment grain tile use the same pixels as before, but the grain's random noise is regenerated per page load.
- The selection box of a stamp is drawn above all stamps of its layer, not in its own depth order.
- A lost WebGL context is not recovered yet.

## [1.7.4] - 2026-10-15

### Added (tooling)
- TypeScript: `tsconfig.json` (strict, `allowJs`, `checkJs` off, so existing `.js` is untouched) and `npm run typecheck`. `src/types.ts` holds the stamp and layer-style types; new code is written in `.ts` and old files convert one at a time.

## [1.7.3] - 2026-10-15

### Changed (performance)
- **Per-layer raster cache** on the live canvas: each layer (background, land, paths, stamps, each custom layer, text, grid) keeps its own canvas and is redrawn only when its inputs change, then the layers are composited. Exports, print and thumbnails still render directly and never touch the cache (`cache` flag on `renderMap`).
- Stamp layers also repaint when a custom stamp image finishes loading.
- Measured in headless Chromium (software rendering), moving one stamp: sample region map 237 -> 30 ms per repaint; Obsidian Reach (1,364 stamps) 2550 -> 1107 ms.
- Cached and direct renders differ by at most 5/255 per channel (alpha rounding when layers are composited separately).

### Known
- Moving one stamp still redraws the whole stamp layer; on the 1,364-stamp map that is most of the remaining time. Fix is to hold stamps as individual display objects (the PixiJS step).
- One full-size canvas per layer is kept (about 45 MB each at 4000x2800).

## [1.7.2] - 2026-10-15

### Fixed (performance)
- Custom layers (and any layer with opacity or a blend mode) allocated a fresh full-size canvas on every repaint (~45 ms each at 2400x1500). One scratch canvas per size is now reused.
- Each stamp's drop shadow is baked once into its cached sprite instead of being blurred on the big canvas for every stamp on every repaint. A flipped stamp mirrors the baked offset so light still falls the same way (a rotated stamp now rotates its shadow with it).
- Net: on a map with custom layers and ~230 stamps, drawing a path or dragging a stamp costs about half as much per mouse move (about 107 ms -> 54 ms in a software-rendered browser).

### Known
- What remains is native canvas compositing (full-canvas layer blends, atmosphere, grid); JavaScript is under 10 ms per move. A GPU browser should be well below the numbers above.

## [1.7.1] - 2026-10-15

### Fixed
- **Mask and brush painting lag**: every mouse move rebuilt the whole land layer (coast ripples, sand, outline, every stroke), 290-780 ms per move on the sample maps. A stroke in progress is now drawn as a light preview over the finished land layer and the full coastline is rebuilt once on release. An 80-move brush drag on the default map went from 23 s to 5.6 s (most of the rest is the test driver); one long task remains, the rebuild on release.
- A stroke is now committed on release as exactly one undo step.

### Known
- While dragging, the preview is hard-edged and has no ripples, sand or outline yet; the soft edge and coastline appear when you let go.

## [1.7.0] - 2026-10-15

### Added
- **Main menu**: the app opens on "Your maps" (preview, map type, size, last edited; duplicate and delete on hover) plus sample maps that open as copies and an "Open file" button. The Maps button and the logo return to it, saving first.
- **Map library**: every map autosaves under its own id in IndexedDB. The old single autosave is migrated into the library on first run.
- **New map wizard** with six cores: World, Region, Town & City, Battle Map, Dungeon, Free Canvas. Each sets canvas size (presets or custom), grid and atmosphere, and **filters brushes and stamps** to what fits (a dungeon offers 6 biomes and 19 stamps). "Show all" in the stamp drawer and an "Other map types" group in the biome list lift the filter.
- **Sample maps**: Region "The Marchlands of Verrin", City "Port of Karrowmere", Battle "Ambush at Ravenford", and the stress test "The Obsidian Reach" (4000×2800, ~1,400 stamps).

### Changed
- Header: the old Load Map Preset dropdown is gone (samples live on the menu); the map-type tag now shows the core name; new Maps button.
- Fit to screen fits the real viewport instead of a fixed 65%, and runs when a map opens.

### Fixed (performance)
- Jitter tone/hue used a canvas filter on the whole map (about 1 s per stamp per repaint). Stamps are now drawn once into small cached sprites; tone/hue is applied there.
- Stamps get one soft shadow each instead of one per sub-path (that was ~84 % of stamp paint time).
- Zoom and pan no longer repaint the whole map (layer visibility object is memoised). Stress map: 10 zoom ticks went from ~29 s to ~0.7 s.
- Stamp lookup is a Map instead of a linear search.

### Known issues
- The stress map takes ~9 s to open; a 4x PNG export of it takes ~50 s and ~190 MB.
- Water brush strokes ignore softness; coastal ripples are not drawn around carved bays and lakes; the grid is global only; no canvas-size control inside the editor yet.

## [1.6.2] - 2026-10-14

### Changed
- **One tool rail again**: Draw and Tools are a single column, split by a divider.
- **Settings card is translucent** and floats over the canvas (blurred backdrop) instead of taking a column.
- **Themed combo boxes** and inputs (dark, custom arrow, gold sliders) replace the white native controls.

## [1.6.1] - 2026-10-14

### Changed
- **Tool settings moved to a sidebar** beside the Draw / Tools rails (scale, rotation, jitter, brush size, biome, path type, text options and so on). They used to sit in a ribbon above the canvas; the canvas now gets the full height.

## [1.6.0] - 2026-10-14

Art and usability release; most stamp and texture work was done by parallel agents and then art-reviewed round by round.

### Added
- **Settlements for every race**: 43 stamps (Human, Elf, Dwarf, Orc/Goblin, Halfling, Gnome, Dragonborn, Lizardfolk, Drow/Tiefling, Merfolk), hamlet → village → town → city → capital with growing walls.
- **Castles and landmarks**: 47 stamps in 14 families (human/elf/dwarf/orc/dark/dragon/folk, wizard towers, temples and shrines, ruins, watchtowers and lighthouses, ports, mines and dungeons, sky fortresses).
- **Trees rebuilt**: 31 new `tr_` trees (broadleaf, conifers, snowy, autumn, willow, birch, palms, savanna, dead, fantasy, groves) and 17 `veg_` undergrowth stamps (bushes, grass, ferns, reeds, bamboo, mushrooms, cacti, rocks, logs, stumps).
- **Stamp groups**: families show as one tile with a variant count; click to unfold the variants.
- **Jitter variety**: Jitter now also gives each stamp a random flip, tone, hue and seed so sprayed forests stop looking cloned.
- **Biome textures**: every biome redrawn (seamless, seeded) plus new forest floor, savanna, tundra, jungle, ash waste and farmland.
- **Showcase preset** "The Sundered Realms": 10 landmasses, 10 rivers, ~300 stamps, custom layers. Presets can now carry brush strokes and layers.
- **Two tool rails** ("Draw" and "Tools") and **styled tooltips** with name, key chip and description.

### Changed
- **Rivers and paths** are drawn with a stabiliser (rope-follow), thinned and simplified on release, and end where the pen lifts, so they no longer wobble.
- Old stamps are untouched; the new ones sit beside them.

### Known issues
- Fine brick detail on castles is noise below ~48 px; castle tops are only partly oblique; lava, grassland and savanna textures still show faint repeats when tiled.

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
- **24 new procedural vector stamps**:
  - **Nature & Land (8)**: Dead Tree (`tree_dead_barren`), Palm Tree (`tree_palm`), Desert Cactus (`cactus_saguaro`), Boulder Cluster (`boulder_cluster`), Freshwater Reeds (`nature_reeds`), Lily Pond (`nature_lily_pond`), Volcano (`volcano_lite`), Snowy Pine (`tree_snowy_pine`).
  - **Settlements & Structures (8)**: Rustic Windmill (`windmill_rustic`), Coastal Lighthouse (`civ_lighthouse`), Ruined Tower (`ruined_tower`), Stone Arch Bridge (`bridge_stone`), Farm Homestead (`farm_homestead`), Port Dock (`port_dock`), Ancient Temple (`civ_temple`), Camp Tent (`camp_tent`).
  - **Nautical & Icons (4)**: Giant Kraken (`nautical_kraken`), War Galleon (`ship_galleon`), Maelstrom Whirlpool (`nautical_whirlpool`), Sea Serpent Head (`sea_serpent_head`).
  - **Furniture & Props (4)**: Dungeon Chest (`prop_chest_wood`), Barrel Stack (`prop_barrel_stack`), Ritual Stone Altar (`prop_altar_stone`), Library Bookshelf (`prop_bookshelf`).
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
