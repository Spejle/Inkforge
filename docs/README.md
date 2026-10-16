# InkForge Documentation

Welcome to the InkForge documentation index. InkForge is an open-source, browser-based cartography studio for fantasy world maps and tactical battlemaps built with React 19, HTML5 Canvas 2D, and PixiJS (WebGL).

## Documentation Index

- **[User Guide](UserGuide.md)**: A complete guide for Game Masters, worldbuilders, and cartographers. Covers the workspace, toolbars, map templates, each drawing tool, multiselect and spine editing, dynamic lighting and shadows, layer management, keyboard and wheel shortcuts, and export workflows.
- **[Architecture & Contributor Guide](Architecture.md)**: Technical documentation for developers and contributors. Explains the `src/` directory layout, the data model, project serialization and autosave, the dual Canvas2D/PixiJS render pipeline, lighting and river generation algorithms, how to add stamps, biomes, tools, or light presets, testing, and security policies.
- **[Plugin Packs Specification](PLUGINS.md)**: Details the declarative, data-only JSON plugin specification for importing custom stamps, light presets, biomes, and map templates without compromising Content Security Policy (CSP).
- **[Contributing Guide](../CONTRIBUTING.md)**: Practical guidelines for developer setup, branches, commit conventions, running tests, and proposing new assets.

## Quick Reference

| Resource | Description |
| :--- | :--- |
| **Runtime Requirements** | Modern browser with WebGL2 support (falls back to Canvas 2D) |
| **Developer Requirements** | Node.js 24+, npm |
| **License** | GNU Affero General Public License v3.0 (AGPL-3.0-or-later) |
| **Output Ownership** | 100% user ownership of all exported images and project files |
