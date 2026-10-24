# InkForge User Guide

InkForge is a browser-based cartography studio designed for Dungeon Masters, worldbuilders, and tabletop roleplaying game (TTRPG) creators. It runs entirely on the client side using React 19, HTML5 Canvas 2D, and PixiJS (WebGL), requiring no account, backend server, or cloud storage.

---

## Table of Contents

1. [Main Menu and Sample Maps](#main-menu-and-sample-maps)
2. [Map Templates and Modes](#map-templates-and-modes)
3. [Workspace Overview](#workspace-overview)
4. [Tools Reference](#tools-reference)
5. [Keyboard and Mouse Shortcuts](#keyboard-and-mouse-shortcuts)
6. [Layers and the Objects List](#layers-and-the-objects-list)
7. [Dynamic Lighting and Shadows](#dynamic-lighting-and-shadows)
8. [Customising Layout and Themes](#customising-layout-and-themes)
9. [Saving, Autosave, and Export](#saving-autosave-and-export)
10. [Tips and Troubleshooting](#tips-and-troubleshooting)

---

## Main Menu and Sample Maps

When launching InkForge, the **Home** screen displays your project library alongside pre-packaged sample maps.

### Your Maps
The **Your maps** grid lists every project currently saved in your browser's IndexedDB storage. Each card shows a real-time thumbnail preview, map title, template type, dimensions, and the last modified time.
- **Open**: Click a map card to load it directly into the editor.
- **Duplicate**: Click the copy icon on a card to create an independent duplicate with `(copy)` appended to the title.
- **Delete**: Click the trash icon to remove a map permanently from local storage.
- **New map**: Opens the template picker dialog to create a new canvas.
- **Open file**: Loads an exported `.inkforge` or `.json` project file from disk.

### Sample Maps
Pre-packaged demonstration maps provide reference layouts for different styles:
- **The Realm of Valoria & The Shattered Reach**: The default continental showcase, illustrating multi-island landmasses, mountain chains, rivers, coastal sound effects, and settlement stamps.
- **The Sundered Realms**: A deterministic procedural world showcase featuring tectonic mountain ridges, biomes, and sea monster encounters.
- **Ambush at Ravenford**: A tactical battle map set at a river crossing with bandit camp props, tents, chests, ruined towers, and character tokens.
- **Caldera of the Fire God**: A volcanic crater encounter with lava flows, ash wastes, and a central fortress.
- **Tomb of High King Oswydd**: A dungeon crypt layout demonstrating stone walls, brazier light sources, and royal throne props.
- **Region Map & City Map Demos**: Examples of kingdom valley layouts and dense urban cobblestone streets.
- **Obsidian Reach (Stress Test)**: A heavy benchmark map containing over 1,300 stamps used to test rendering performance.

Opening any sample map creates a fresh working copy; the built-in sample template remains untouched.

---

## Map Templates and Modes

When creating a new map, you choose from six primary templates. Templates configure the initial canvas dimensions, grid style, lighting warmth, and the active subset of brushes and stamps.

| Template | Mode | Default Dimensions | Default Grid | Default Biome & Stamp | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **World Map** | World | 3200 × 2000 (Std)<br>1920 × 1080 (Sm)<br>4800 × 3000 (Lg) | Disabled | Verdant Meadow (`grassland`), Grand Mountain (`mountain_grand`) | Continents, oceans, mountain ridges, and kingdoms. Features ocean textures, shallows, and coastal ripples. |
| **Region Map** | World | 2800 × 1800 (Std)<br>1920 × 1280 (Sm)<br>4000 × 2600 (Lg) | Hex Flat 48px | Verdant Meadow (`grassland`), Oak Tree (`tr_oak`) | Valleys, local provinces, road networks, and forests. |
| **Town & City** | Battle | 2400 × 1600 (Town)<br>1600 × 1200 (Village)<br>3600 × 2400 (City) | Square 60px | Cobblestone (`cobblestone_town`), Human Village (`set_human_village`) | Streets, markets, stone walls, and town structures on flat ground. |
| **Battle Map** | Battle | 1960 × 1400 (Std)<br>1400 × 1050 (Skirmish)<br>2800 × 2100 (Lg) | Square 70px | Verdant Meadow (`grassland`), Oak Tree (`tr_oak`) | Tactical encounters on a 5-foot square grid with cover, tokens, and props. |
| **Dungeon** | Battle | 1960 × 1400 (Std)<br>1400 × 1050 (Sm)<br>2800 × 2100 (Lg) | Square 70px | Flagstone (`dungeon_flagstone`), Wall Block (`dungeon_wall_block`) | Dark corridors, stone masonry, dungeon props, and braziers. |
| **Free Canvas** | World | 1920 × 1080 (Std)<br>3200 × 2000 (Lg) | Disabled | Verdant Meadow (`grassland`), Grand Mountain (`mountain_grand`) | Completely unrestricted canvas with all biomes and stamp categories unlocked. |

### Render Modes: World vs. Battle
- **World Mode**: Renders dynamic oceans with animated texture grains, procedural coastal ripples, beach sand rims, and elevation drop shadows. Carving water produces shallow-water coastal dropoffs.
- **Battle Mode**: Renders a neutral flat tabletop ground without coastal water effects.

---

## Workspace Overview

The editor interface consists of five core areas:
1. **Top Header**: Navigation back to Home, map title editing, canvas zoom controls (`Fit`, `100%`), quick theme cycle, settings dialog, and the **Export** menu.
2. **Left Toolbar (Tool Rail)**: Vertical rail holding the primary drawing and navigation tools. Can be placed on the left or right side via Settings.
3. **Top Options Ribbon**: Contextual controls for the currently selected tool (brush sizes, colors, opacity, transform controls).
4. **Center Stage**: The interactive map canvas supporting hardware-accelerated pan, zoom, painting, and direct manipulation.
5. **Right-Hand Sidebar Panel**: A multi-tab panel that automatically opens when selecting a tool.

### The Right-Hand Panel Tabs
The sidebar panel contains three tabs:
- **Active Tool Tab**: Dynamically swaps its label and content to match your active tool. When the **Stamps** tool (`S`) is selected, this tab shows the full Stamp Library. When the **Biome** tool (`B`) is selected, it displays biome palettes. For other tools, it presents extended tool options.
- **Layers & FX Tab**: Manages built-in and custom layers, visibility, layer locking, layer opacity, blend modes, and atmospheric map styles.
- **Objects Tab**: Provides an organized hierarchical view of every stamp, path, and text label placed on the canvas, grouped by layer.

---

## Tools Reference

### 1. Select & Transform (`V`)
The Select tool manipulates objects placed on the map.
- **Single Selection**: Click any stamp, label, or path to select it. Selection handles appear around the bounding box.
- **Multiselect**:
  - Drag a marquee box over empty canvas to select all stamps whose anchor points fall within the rubber band.
  - Hold `Shift` and click objects to toggle them into or out of the multiselection group.
  - The group moves together as a single unit when dragged.
- **Transform Controls**:
  - Drag the corner handle to scale an object proportionally.
  - Drag the top rotation handle to spin an object (hold `Shift` to snap to 15° steps).
  - Use the Options Ribbon sliders for precise numeric Scale (30% to 300%) and Rotation (-180° to +180°), or click **0°** to reset orientation.
  - **Flip X / Flip Y**: Mirror stamps across their horizontal or vertical axis.
  - **Front / Back**: Reorder stamps within their active layer.
  - **Duplicate**: Clone selected objects offset by 35 pixels.
  - **Delete**: Remove the selection (or press `Delete` / `Backspace`).
  - **Nudge**: Arrow keys move selected objects by 1 pixel (hold `Shift` for 10 pixels).

### 2. Landmass Sculptor (`M`)
The Sculptor paints continents, islands, and waterways directly onto the world mask.
- **Sculpt Mode**: Toggle between **Add Land** (paints solid ground) and **Carve Water** (cuts fjords, lakes, and channels). Press `X` at any time to swap between them.
- **Brush Shape**:
  - `Circle`: Smooth, rounded strokes for rolling terrain.
  - `Rough Edgy`: Fractal jagged edges ideal for natural coastlines, cliffs, and fjords.
  - `Block`: Rectangular regional strokes.
- **Roughness Slider**: Controls the jaggedness of the `Rough` brush from 10% to 100%.
- **Size and Flow**: Brush diameter (15px to 240px) and painting flow rate (10% to 100%).
- **Coastline FX Popover**:
  - *Shallow Water Ripples*: Outer concentric water rings. Adjust wave count (1 to 6), spacing (4px to 24px), opacity, and ripple color.
  - *Beach Sand Rim*: Sand border along the coast with configurable width (2px to 22px) and color.
  - *Land Outline*: Crisp coastline ink boundary with adjustable stroke width (1px to 8px) and color.
  - *Continental Elevation Shadow*: Depth drop blur (4px to 35px) simulating elevated land above sea level.
- **Preview Toggles**:
  - *Stroke*: Displays the stroke preview dynamically while dragging. When toggled off, the stroke renders only when the pointer is released.
  - *Cursor Ring*: Shows the dashed brush-size circle following the cursor.

### 3. Biome & Texture Brush (`B`)
Paints surface textures and vegetation onto the terrain.
- **Biome Picker**: Visual picker selecting from 15+ environmental palettes (Verdant Meadow, Antique Parchment, Sunbaked Sands, Glacial Tundra, Volcanic Moor, Murky Mire, Molten Lava, Ocean Shallows, Forest Floor, Savanna, Dungeon Flagstone, Wooden Planks, Cobblestone, etc.).
- **Live Brush Preview**: An interactive preview strip displaying the exact texture pattern, feathering, and blend result before painting.
- **Paint Target**:
  - `Land (FG)`: Constrains painting strictly to sculpted landmasses.
  - `Water (BG)`: Constrains painting strictly to ocean and water areas.
  - `Both`: Unrestricted surface painting across the entire canvas.
- **Softness**: Adjusts the radial falloff of the brush edge from 0% (crisp edge) to 100% (feathered wash).
- **Blend Mode**: Normal (`source-over`), Multiply, Overlay, or Soft Light.

### 4. Stamps & Props (`S`)
Places hand-crafted vector and raster artwork across the map.
- **Stamp Catalog & Groups**: 276 vector stamps organized into thematic groups (Nature, Settlements, Nautical, Dungeon Structures, Props, Tokens). Related stamps share single drawer tiles with variant selectors.
- **Directional Stamp Views**: Directional assets provide up to four perspective views: `side`, `top` (plan view), `diag` (isometric diagonal), and `front`. Top-down views are always freely rotatable.
- **Rotation Policies**:
  - `fixed`: Upright assets (trees, mountains, castles, buildings) remain strictly upright during placement and spray painting.
  - `tilt`: Organic props (hills, bushes, boulders) apply subtle natural variance.
  - `free`: Top-down tiles (dungeon floors, tables, pools, braziers, tokens) spin to any angle.
- **Placement Controls**:
  - *Scale*: 30% to 250% (click `1x` to reset).
  - *Rotation*: Free angle slider and reset button.
  - *Jitter*: Randomizes size and rotation during placement while strictly respecting the asset's rotation policy.
  - *Spray Mode*: Enables continuous drag painting to quickly lay down mountain ranges and dense forests.
  - *Flip X / Flip Y*: Horizontal and vertical mirroring.
- **Custom Stamp Import**: Click **Add stamps** in the drawer header to import custom PNG, WebP, or SVG graphics. Custom stamps are stored as embedded data URLs within the project.

### 5. Rivers & Paths (`P`)
Draws vector splines for watercourses, trade roads, and dungeon walls.
- **Path Types**:
  - `River`: Two-tone watercourse with a dark riverbank outline and inner water fill.
  - `Road`: Dirt trails with an optional **Dashed Trail** toggle.
  - `Wall`: Heavy stone masonry outline designed for dungeon partitions and fortifications.
- **Width & Color**: Configurable line thickness (4px to 40px) and hex color.
- **Freehand Modifiers**: While drawing, hold `Shift` to constrain to straight segments, and hold `Alt` to snap segments to 15° angles.
- **Editable Spine Points**:
  - Selecting an existing path reveals its spine control points as circular handles.
  - Drag any handle to reshape the curve. Dense freehand strokes are automatically simplified to an editable spine (4px tolerance) on first grab.
  - **Double-click a point** to delete it (paths maintain a minimum of 2 points).
  - **Double-click the path line** to insert a new spine handle at that location.
- **Generate on Click (Rivers)**:
  - When enabled under River mode, click anywhere on sculpted land to automatically generate a natural, meandering river from that point down to the nearest coastline.
  - Rivers follow distance-to-coast descent fields with procedural noise octaves, ensuring every generated course is unique and hydrologically plausible.
- **Coastal River Masking**:
  - Rivers automatically terminate at the coastline mask, preventing water lines from spilling out over the ocean on world maps.
  - Rivers are always layered underneath roads and walls.

### 6. Text & Banners (`T`)
Places curved fantasy typography for kingdom titles, sea names, and site labels.
- **Content**: Text string entry field.
- **Font Picker**: Select from fantasy cartography typefaces (Cinzel, MedievalSharp, Pirata One, Uncial Antiqua, Inter).
- **Size**: Font size from 16px to 80px (scalable up to 96px once placed).
- **Arc Curvature**: Curves labels along a circular arc from -50% to +50% to trace mountain ranges, bays, or kingdom borders.
- **Color & Stroke**: Dedicated pickers for interior text fill and outer contrast halo stroke.

### 7. Grid & Alignment (`G`)
Overlays tactical combat grids and alignment aids.
- **Grid Types**: Square, Hex Flat-topped (`hex_flat`), Hex Pointy-topped (`hex_pointy`), and Isometric (`isometric`).
- **Controls**: Cell size (24px to 140px), line opacity (5% to 60%), and line color.
- **Snap to Grid**: When enabled, stamps and battle tokens snap automatically to grid intersection centers during placement.

### 8. Atmosphere & Light (`A`)
Global post-processing filters, lighting, and environmental weather.
- **Lighting & Weather Presets**:
  - `Day`: Neutral warm daylight (`vignette: 0.4`, `sepia: 0.2`).
  - `Dusk`: Sunset amber tint (`tint: [255, 140, 70]`, `sepia: 0.5`).
  - `Night`: Deep midnight blue wash (`tint: [50, 70, 150]`, `vignette: 0.7`).
  - `Cloudy`: Desaturated overcast sky (`tint: [150, 160, 175]`).
  - `Rain`: Cool blue-grey wash with procedural diagonal rain streaks (`weather: 'rain'`).
  - `Snow`: High-key light blue wash with procedural falling snow particles (`weather: 'snow'`).
  - `Torchlit`: Heavy darkness (`darkness: 0.85`) cut by campfires and braziers.
  - `Fog`: Pale mist screen wash (`tint: [230, 232, 235]`).
- **Darkness Slider**: Darkens the entire map from 0% to 95%. Lights (campfires, braziers) cut through the darkness with dynamic shadows.
- **Weather Intensity**: Controls the precipitation density of rain or snow (deterministic PRNG ensures screen view matches exports).
- **Sliders**: Vignette, Parchment Grain texture, Warmth (Sepia), and Brightness.

### 9. Eraser (`E`)
Erases raster brush strokes, sculpted land strokes, and drawn paths whose vertices fall within the eraser circle. Size ranges from 15px to 240px.

### 10. Pan Canvas (`H` or `Space` + Drag)
Scrolls and navigates across the canvas viewport.

---

## Keyboard and Mouse Shortcuts

### Tool Shortcuts

| Key | Tool | Description |
| :--- | :--- | :--- |
| `V` | Select & Transform | Select, move, scale, and rotate objects |
| `M` | Landmass Sculptor | Paint continents or carve waterways |
| `B` | Biome & Texture | Paint textured surface biomes |
| `S` | Stamps & Props | Place map stamps and tokens |
| `P` | Rivers & Paths | Draw rivers, roads, and dungeon walls |
| `T` | Text & Banners | Add curved labels and titles |
| `G` | Grid & Alignment | Configure tactical grid overlays |
| `A` | Atmosphere & Light | Adjust lighting, darkness, and weather |
| `E` | Eraser | Erase brush strokes, land, and paths |
| `H` | Pan Canvas | Pan viewport (or hold `Space`) |

### Action Shortcuts

| Shortcut | Action | Details |
| :--- | :--- | :--- |
| `X` | Swap Add / Carve | Switches between Add Land and Carve Water in Sculptor mode |
| `Ctrl + Z` | Undo | Reverts the last drawing or editing action |
| `Ctrl + Shift + Z` / `Ctrl + Y` | Redo | Reapplies reverted actions |
| `Delete` / `Backspace` | Delete Selection | Removes selected stamps, labels, or paths |
| `Arrow Keys` | Nudge Selection | Moves selection by 1px (hold `Shift` for 10px) |
| `[` or `,` | Rotate Counter-Clockwise | Rotates selected stamp by 15° (hold `Shift` for 1°) |
| `]` or `.` | Rotate Clockwise | Rotates selected stamp by 15° (hold `Shift` for 1°) |

### Mouse Wheel Modifiers
When hovering over the canvas, the mouse wheel adjusts context-sensitive properties with live numeric hints displayed at the top of the screen:

| Wheel Combination | Context | Effect |
| :--- | :--- | :--- |
| **Plain Wheel** | Canvas | Zooms canvas in and out centered on cursor |
| **Shift + Wheel** | Select Tool (Selection Active) | Scales selected stamp, changes label font size, or adjusts path width |
| **Shift + Wheel** | Sculptor / Biome / Eraser | Adjusts brush size (15px to 240px) |
| **Shift + Wheel** | Stamp Tool | Adjusts active stamp scale (0.3× to 2.5×) |
| **Shift + Wheel** | Path Tool | Adjusts active path width (4px to 40px) |
| **Shift + Wheel** | Text Tool | Adjusts active label font size (16px to 80px) |
| **Ctrl + Wheel** | Select Tool (Selection Active) | Rotates selected stamp or label in **1° fine increments** |
| **Ctrl + Wheel** | Stamp Tool | Rotates active stamp in **1° fine increments** |
| **Ctrl + Shift + Wheel** | Select or Stamp Tool | Rotates stamp or label in **5° notched increments** |

*Note: Native browser page zoom on `Ctrl + Wheel` is suppressed while hovering over the workspace.*

---

## Layers and the Objects List

### Layers & FX Panel
The **Layers & FX** tab controls composite stacking order and visual blending.

#### Built-in Layer Hierarchy
1. **Labels (`text`)**: Kingdom titles and text banners (renders on top).
2. **Stamps (`stamps`)**: Props, trees, buildings, mountains, and tokens.
3. **Rivers & roads (`paths`)**: Watercourses, dashed trails, and dungeon walls.
4. **Land & terrain (`land`)**: Sculpted landmasses, coastline effects, and painted biomes.
5. **Sea (`background`)**: Base ocean texture or dungeon void.
6. **Grid (`grid`)**: Tactical combat grid overlay.

#### Custom Layers
Click the **`+`** button in the Layers header to create custom layers (`Layer 1`, `Layer 2`, etc.).
- **Draw on This**: Sets a custom layer as active; subsequent stamps, paths, and text placed on the canvas are automatically assigned to it.
- **Layer Controls**: Toggle visibility (eye icon) or lock layer (lock icon prevents accidental selection).
- **Opacity & Blending**: Independent opacity slider (0% to 100%) and blend mode picker (`Normal`, `Multiply`, `Overlay`, `Soft light`).
- **Reordering**: Move custom layers up or down the visual stack using chevron buttons.
- **Deletion**: Deleting a custom layer returns all objects hosted on it back to their default built-in layers without losing content.

### Objects Panel
The **Objects** tab lists every individual asset placed on the canvas grouped under its respective layer.
- **Search & Filter**: Type in the filter box to search across hundreds of objects by name, type, or label text.
- **Selection**: Click any row to select the object on the canvas. Hold `Shift` or `Ctrl` to add multiple stamps to the multiselection group.
- **Drag-to-Layer**: Drag rows directly onto any layer header to reassign objects between layers.

---

## Dynamic Lighting and Shadows

InkForge features dynamic 2D lighting designed specifically for tabletop battlemaps and dungeons.

### How Dynamic Lighting Works
1. **Darkness Mask**: Increasing the **Darkness** slider in the Atmosphere tool (or selecting the `Torchlit` / `Night` presets) drapes the map in deep indigo darkness.
2. **Light Sources**: Stamps depicting light emitters (campfires, braziers) cast radial illumination through the darkness mask.
   - Base light radius is **6 grid squares** at stamp scale 1.0.
   - Scaling a campfire or brazier proportionally scales its lighting radius.
3. **Shadow Occluders**:
   - Drawn **Wall** paths.
   - Blocking stamps: dungeon walls, pillars, doors, furniture (chests, tables, bookcases, altars), mountains, and trees.
4. **Sprite-Traced Blocker Outlines**:
   Instead of using simple bounding boxes, InkForge traces the actual opaque pixel silhouette of blocking stamps (`blockerOutline`). A pine tree casts a pine-shaped shadow, and crates cast crate-shaped shadows, matching the stamp's rotation, scale, and flipping.
5. **Soft Penumbra & Area Emitter**:
   Lights are modeled as area emitters sampled across 8 multi-ring jittered positions. Shadows remain crisp at the base of the occluding object and widen naturally with distance.
6. **Ambient Bounce Illumination**:
   Shadows are not pitch black. An ambient diffuse bounce pass maintains approximately 50% visibility within lit areas, bounded by dungeon walls.
7. **Universal VTT (.dd2vtt) Export**:
   When exporting for virtual tabletops, InkForge exports the exact coordinates, radius, and color code of every light source, while exporting the base image without baked darkness so that Foundry VTT, Roll20, or Fantasy Grounds can handle runtime line-of-sight.

---

## Customising Layout and Themes

Click the gear icon in the header or select **Settings** from the main menu to open configuration options.

### Appearance Themes
Choose from three interface themes:
- **Candlelit**: Default dark fantasy aesthetic with warm gold accents.
- **Parchment**: Light cartographic theme inspired by aged paper and iron-gall ink.
- **Orbit**: Clean, high-contrast studio theme featuring neutral greys, celestial blue highlights, and alert red accents.

### Workspace Layout
- **Toolbar & Panel Placement**: Configure tool rails and sidebar positions:
  - Tools left, panel right (default)
  - Panel left, tools right
  - Tools and panel left
  - Tools and panel right
- **Panel Width**: Adjust panel width from 240px to 560px using the slider, or drag the vertical separator handle directly on the screen.
- **Status Bar**: Toggle the bottom status bar displaying live canvas pixel coordinates and dimensions.

### Shortcut Customization
- Every keyboard shortcut in InkForge can be customized in **Settings > Keyboard & mouse**.
- Click any key badge and press the desired key combination to record a binding.
- If a shortcut is already claimed by another action, InkForge reassigns it and alerts you of the displaced action.
- Individual actions or all keys can be restored to defaults at any time.

---

## Saving, Autosave, and Export

### Autosave & Project Files
- **IndexedDB Autosave**: All edits are debounced and saved automatically to browser IndexedDB storage approximately 1.5 seconds after editing stops. The header status confirms `"Saved HH:MM"`.
- **Project File (`.inkforge`)**: Exporting to JSON creates a `.inkforge` project file containing the full vector scene, layer definitions, coastline parameters, and embedded custom stamps. This file can be shared and opened on any computer.

### Export Formats
Open the **Export** menu in the top header to access export options:

1. **Standard PNG (1x)**: Exports a clean PNG image at the canvas's native resolution.
2. **High-Res PNG (2x / 4K and 4x / 8K)**:
   - Renders the complete scene at double or quadruple resolution for large-format displays or professional printing.
   - Automatically clamps scale factors to prevent exceeding browser canvas memory limits (up to 16,384px per side).
   - Option to toggle the grid on or off in the exported image.
3. **Per-Layer PNGs in a ZIP (`map_layers.zip`)**:
   - Generates individual transparent PNG files for every layer (sea, land, rivers, stamps, each custom layer, labels, grid) plus the flattened image.
   - Allows graphic designers and DMs to composite and animate map layers inside Photoshop, GIMP, or video editing suites.
4. **Universal VTT (`.dd2vtt`)**:
   - Industry-standard format for Foundry VTT, Roll20, and Fantasy Grounds.
   - Exports line-of-sight walls from Wall paths, doors from door stamps, and dynamic light sources with real range values.
   - The base graphic is rendered with grid and darkness disabled so the VTT engine can provide native lighting and tokens.
5. **Print at Table Scale (Tiled PDF)**:
   - Opens the **Print Dialog** to tile large maps across standard paper sheets.
   - **Paper Sizes**: A4, US Letter, A3, and Poster.
   - **Scale Modes**:
     - *Fit*: Scales the entire map to fit onto a single sheet.
     - *Table Scale (1 inch = 1 grid square)*: Automatically splits the map into a multi-page grid matching physical miniature scale.
   - **Print Options**: Sheet overlap margin (mm), crop/join alignment crosses, sheet numbering, and an assembly layout guide.
   - **Ink Saver Mode**: Lightens dark backgrounds to conserve printer cartridge ink.

---

## Tips and Troubleshooting

- **High-DPI Zoom Crispness**: Zooming in redraws the canvas at higher density (1×, 1.5×, 2×, 3×, or 4×) approximately 250ms after zooming stops, ensuring vector stamps, coastline contours, and labels remain crisp.
- **Hardware Acceleration**: InkForge automatically utilizes WebGL via PixiJS when available. If running on software OpenGL (such as SwiftShader or llvmpipe) or if WebGL is unavailable, it falls back seamlessly to the Canvas 2D engine. You can force a specific renderer via URL parameters: `?renderer=2d` or `?renderer=pixi`.
- **Memory Safeguards**: Live canvases are capped at 36 million pixels and individual raster layers at 12 million pixels to prevent browser tab crashes on ultra-large maps.
- **Plugin marketplace**: Dynamic lighting, river generation, weather, mask fill and the VTT, print and layers-ZIP exports are optional plugins. Click the puzzle button in the header (or Settings > Plugins) to install or remove them; a map that needs a missing one shows an Install bar.
- **Plugin Asset Packs**: Extend your stamp, biome, and lighting presets using declarative JSON plugin packs without writing code. See [Plugin Packs Documentation](PLUGINS.md).


## The tool panel, previews and layout

**The panel follows the tool.** The first tab of the right-hand panel shows the options of the active tool: biome picker and brush preview for the Biome brush, mask shape and size for the Landmass Sculptor, the stamp library (with scale, jitter and spray on top) for the Stamps tool, and so on. Choosing a tool brings that tab forward and reopens a collapsed panel. *Layers & FX* and *Objects* stay one click away.

**Pickers, not dropdowns.** Biomes show their real texture, blend modes show two overlapping discs composited with that mode, grid types show their grid and fonts show a sample in the font. Use the arrow keys to move between choices.

**Live preview while painting.** While you drag a Landmass Sculptor or Biome stroke, the real coast, sand and biome fill are drawn at reduced scale and the full-quality pass runs when you release. In the panel, *Preview > Live preview* turns it off if your machine is slow on very large maps; *Stroke outline* (off by default) shows only the shape of the stroke while Live preview is off.

**Layout** (Settings > Layout). Put the tool rail and the panel on the left or right, drag the panel's inner edge to resize it (240 to 560 px), hide the status bar, or press *Reset layout*. The choice is saved in the browser.
