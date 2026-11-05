# Visual regression suite

```bash
npm run test:visual            # all checks (about 10 minutes on software GL)
npm run test:visual -- --only=sheet_layers --no-app   # one scene, skip the editor checks
npm run test:visual:update     # rewrite every baseline after an intended change; look at them before committing
```

`run.mjs` starts a Vite dev server, opens `harness.html` in headless Chromium (software WebGL through SwiftShader) and,
for every scene, renders the map with:

| backend    | what it is |
|------------|------------|
| `export`   | `renderExportCanvas`, the Canvas 2D path behind PNG / WebP / JPG export, print and VTT |
| `live2d`   | `renderMap` with the layer cache: the editor's Canvas 2D view (`?renderer=2d`, or no usable GPU) |
| `pixi`     | `PixiMapView`, the editor's GPU view, read back from its canvas |
| `export2x` | a 2x export shrunk back to 1x |
| `pixi2x`   | the Pixi view at quality 2 (what it draws when you zoom in), shrunk back to 1x |

Checks:

- **baseline**: `export`, shrunk to 384 px on the longest side, against `baselines/<scene>.png`.
- **live2d, pixi, export2x, pixi2x**: each against `export`, at full size. Backends are compared with each other
  rather than with stored images, so the stored set stays small (under 2 MB).
- **app**: the real editor at `?renderer=pixi` with a sample open at 100 %: a screenshot of the map canvas against the
  PNG the Export dialog downloads (1x, the dialog's defaults). Only the samples whose map fits a reasonable window.

A pixel differs when a channel is off by more than 32 (0-255). A check fails when the share of differing pixels or the
mean channel difference passes its limit (see `LIMIT` and `MEAN_LIMIT` in `run.mjs`). The mean catches a broad shift
that stays under the threshold everywhere, such as a wrong blend formula on a translucent layer.

Scenes: every sample in `PRESET_MAPS`, plus three sheets built in `harness.js`:

- `sheet_stamps`: every catalogue stamp.
- `sheet_transforms`: square, wide, tall and custom image stamps (as a data URL and as a decoded `Image`, as the
  editor holds a placed one) rotated, flipped, base-anchored, scaled, toned and recoloured, plus a zIndex overlap.
- `sheet_layers`: built-in and custom layers with opacity, multiply, screen, overlay and soft-light, holding stamps,
  paths, labels and nearly transparent washes.

Every run writes each rendering and each diff image (differing pixels red) to `output/` (not committed). Look at them;
the numbers only say how much differs, not whether it matters.

Notes:

- Web fonts are blocked, so labels use the fallback fonts and the run does not depend on the network. Baselines were
  made with this container's Chromium and fonts; another machine may need `--update` once (check the images first).
- Playwright is not a project dependency; the script loads the copy found through `NODE_PATH` (the one that matches
  the installed browser). Elsewhere: `npm i -D playwright && npx playwright install chromium`.
- Sheets are drawn on the opaque tabletop background. Over transparent pixels a WebGL readback is not exact, and the
  editor always has a background behind a map unless you hide that layer.
- The 2x backends are skipped where the editor would never draw at 2x (`utils/quality.js` caps the density at
  sqrt(36e6 / pixels)), which today is only the 4000x2800 stress map.
