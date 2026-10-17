# InkForge plugins

InkForge has two kinds of plugin:

- **Feature plugins**: first-party code bundled with the app, one folder each under `src/plugins/builtin/` (`maskFill`, `lighting`, `riverGen`, `weather`). Each can be switched off in Settings > Plugins; the app checks `isFeatureOn(id)` / `useFeature(id)` from `src/plugins/features.js`, where their names and defaults are listed. A new feature goes in its own folder, adds an entry to `FEATURES`, and gates its UI and drawing on that id.
- **Content packs**: data files anyone can make, described below.

## Content packs

A content pack is a single **JSON data file**. It adds content (stamps, light presets, biomes, map templates). It cannot add behaviour.

## Security model

InkForge's Content-Security-Policy allows `script-src 'self'` only: no remote scripts, no `eval`. Packs therefore **never execute**. They are parsed with `JSON.parse` and passed through `validatePack()` (`src/plugins/schema.js`), which rebuilds a clean copy from allow-lists:

- unknown fields are dropped; shape types, blend modes and weather names come from fixed lists;
- colours must be `#hex`, `rgb()/rgba()`, `none`, or the tokens `$color` / `$fill`;
- images must be `data:image/(png|webp|svg+xml);base64,...` (no remote URLs, so opening a map never contacts a server; SVG is drawn through `<img>`, which does not run scripts);
- vector paths may contain only SVG path characters, and are used for geometry only;
- every id is rewritten to `<pack.id>:<id>`, so a pack cannot replace a built-in stamp or another pack's content;
- stored packs are validated again on every start-up.

Limits: 5 MB per pack, 500 stamps, 256 KB per image, 64 shapes per stamp, 256 polygon points, 100 biomes.

A map that uses a plugin stamp stores only its namespaced id. Without the pack installed the stamp is skipped (not drawn), so share the pack with the map.

## Format (version 1)

```json
{
  "format": "inkforge-plugin", "version": 1,
  "id": "my-pack", "name": "My Pack", "author": "You", "description": "...", "license": "CC0-1.0",
  "inkforgeVersion": ">=1.11.0",
  "contributes": { "stamps": [], "lightPresets": [], "biomes": [], "mapTemplates": [] }
}
```

- `id`: `a-z 0-9 _ -`, 1-48 chars. `inkforgeVersion`: `*`, `1.x`, `^1.2.0`, `>=1.11.0 <2.0.0`, or exact.
- **stamp**: `id`, `name`, `rotate` (`free`|`fixed`), `defaultScale` (0.1-5), `aspect` (0.2-5), optional `group` + `groupName`, and exactly one of
  - `image`: base64 data URL (png/webp/svg+xml, 256 KB max);
  - `vector`: list of shapes in a 0-100 box: `{type:'circle',cx,cy,r}`, `{type:'rect',x,y,w,h,rx}`, `{type:'polygon',points:[[x,y],...]}`, `{type:'path',d:'M..'}`, each with optional `fill`, `stroke`, `lineWidth`, `opacity`. `$color` / `$fill` follow the stamp's ink and paper colours.
- **lightPresets**: `{name, atmosphere:{vignette, parchmentGrain, sepia, brightness, darkness, tint:[r,g,b], tintAmount, tintBlend, weather:'rain'|'snow', weatherAmount}}`.
- **biomes**: `{id, name, color, secondaryColor, roughness, description}`. They use the default mottled texture and appear under "Other map types" in the biome list.
- **mapTemplates**: `{id, name, description, width, height, biome}`. Validated and stored; **not yet offered** in the New Map dialog.

## Authoring

Copy `docs/plugins/examplePack.json`, change the id, and import it in Settings > Plugins. A rejected file lists every error. `npm test` runs `tests/plugins.test.js`, which validates the example.

## Versioning

`version` is the pack *format* version (currently 1; a breaking change makes it 2 and old packs keep loading). `inkforgeVersion` says which InkForge releases the pack was written for; an install outside the range is rejected. Re-importing a pack with the same `id` replaces it.

## Roadmap (not implemented)

Code plugins (custom tools, exporters) are possible later without relaxing the CSP: run each plugin in a sandboxed `<iframe sandbox="allow-scripts">` (opaque origin, no DOM or storage access) or a Worker, and expose a small `postMessage` API (read the map, add a stamp, register a tool button, return an export blob), with a per-plugin permission prompt and the same namespacing. Nothing of this exists today; only data packs are supported.
