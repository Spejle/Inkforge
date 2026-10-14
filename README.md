# InkForge

Browser cartography studio for fantasy world maps and tactical battlemaps. React 19 + Canvas 2D, no backend.

```
npm install
npm run dev      # development
npm run build    # production build into dist/ (relative base, can be hosted in a subfolder)
npm test         # node:test unit tests (print planner, PDF and ZIP writers)
node server.js   # zero-dependency static server for dist/ on :5173
```

## Features
- Landmass Sculptor (add land / carve water, rough or round brush), biome brush with soft edges, eraser
- Stamps (procedural library plus your own PNG/SVG/WebP), rivers / roads / walls, curved labels
- Custom layers (visibility, lock, opacity, blend, order) next to the built-in ones
- Autosave to the browser (IndexedDB), `.inkforge` project files, undo / redo
- Export: PNG up to 16K, per-layer PNGs in a ZIP, Universal VTT, tiled table-scale PDF

## Shortcuts
`V` select, `M` sculptor, `B` brush, `S` stamp, `P` path, `T` text, `G` grid, `A` atmosphere, `E` eraser, `H` / Space pan.
`X` swap Add land / Carve water. `Ctrl+Z` / `Ctrl+Shift+Z` undo / redo. `Delete` removes the selection.
Selection: drag a corner handle to scale, the top handle to rotate (Shift = 15° steps), arrow keys nudge (Shift = 10 px), `[` `]` rotate.
Paths: hold Shift for a straight segment, Alt as well to snap to 15°.
