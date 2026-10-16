# Contributing to InkForge

Thank you for your interest in contributing to InkForge. InkForge is an open-source, client-side fantasy map and battlemap editor licensed under the AGPLv3.

For an in-depth technical overview of the data models, rendering pipeline, and core systems, read [docs/Architecture.md](docs/Architecture.md).

---

## Development Setup

InkForge requires **Node.js 24+** (required by Vite 8) and **npm**.

```bash
# Clone the repository
git clone https://github.com/spejle/inkforge.git
cd inkforge

# Install dependencies
npm install

# Start the Vite local development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## Branch Workflow

- **Never commit directly to `main` or `master`**.
- Create focused feature or bugfix branches:
  ```bash
  git switch -c feature/<short-description>
  # or for bug fixes:
  git switch -c fix/<short-description>
  ```
- If managing multiple tasks simultaneously, prefer git worktrees (`git worktree add ../inkforge-<task> -b feature/<task>`) to keep checkouts cleanly isolated.

---

## Commit Style

- Keep commits small, atomic, and focused on a single change.
- Write concise, plain commit messages describing what changed and why:
  - `Add ruined watchtower top-down stamp view`
  - `Fix river termination at coastline mask boundary`
  - `Update print tiling calculations for Letter paper`
- **Stage files by name** (`git add <file>`), never stage indiscriminately with `git add -A` or `git add .`.

---

## Running Verification & Tests

Run all checks before submitting a pull request:

```bash
# Run the node:test suite (print planning, zip creation, pdf writer, river descent, etc.)
npm test

# Run strict TypeScript type checks
npm run typecheck

# Run linter
npm run lint

# Build production bundle into dist/
npm run build
```

---

## Proposing and Adding Stamps

InkForge welcomes new cartographic and tactical stamps. You can contribute stamps in two ways:

### 1. In-Core Vector Stamps
- Vector stamps are defined in `src/engine/stampsCatalog.js` and modularized in `src/engine/stamps/views*.js`.
- Provide an `id`, `name`, `category` (`world_nature`, `world_civilization`, `world_nautical`, `battle_rooms`, `battle_props`, `battle_tokens`), `aspect` (width / height ratio), and an SVG/Canvas2D `render(ctx, size, color, fill, seed)` function.
- Assign an appropriate `rotate` policy:
  - `fixed`: Upright assets (trees, mountains, buildings, towers).
  - `tilt`: Subtle organic lean (bushes, hills, rocks).
  - `free`: Omnidirectional props, floor tiles, campfires, and battle tokens.
- Where appropriate, provide directional family views: `side`, `top` (plan view), `diag`, or `front`.

### 2. Declarative Plugin Packs
- You can create, test, and distribute standalone stamp collections, light presets, and biomes as JSON data packs without modifying core source code.
- See [docs/PLUGINS.md](docs/PLUGINS.md) for full format specifications and validation rules.

---

## Additional Documentation

- **[docs/Architecture.md](docs/Architecture.md)**: System architecture, rendering pipeline, lighting, and internal algorithms.
- **[docs/UserGuide.md](docs/UserGuide.md)**: End-user manual, shortcuts, and tool workflows.
- **[docs/PLUGINS.md](docs/PLUGINS.md)**: Plugin pack authoring guide and security model.
