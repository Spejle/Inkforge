import React from 'react';
import {
  MousePointer,
  Mountain,
  Paintbrush,
  Stamp,
  Waypoints,
  Type,
  Grid,
  SunMoon,
  Hand,
  Eraser
} from 'lucide-react';

export const TOOLS = [
  { id: 'select', name: 'Select & Transform', icon: MousePointer, shortcut: 'V', desc: 'Select, move, scale and rotate stamps and labels' },
  { id: 'mask', name: 'Landmass Sculptor', icon: Mountain, shortcut: 'M', desc: 'Paint continents or carve water with fractal coastlines' },
  { id: 'brush', name: 'Biome & Texture', icon: Paintbrush, shortcut: 'B', desc: 'Paint biomes: grass, sand, snow, flagstone, lava' },
  { id: 'stamp', name: 'Stamps & Props', icon: Stamp, shortcut: 'S', desc: 'Place mountains, trees, castles, monsters & dungeon props' },
  { id: 'path', name: 'Rivers & Paths', icon: Waypoints, shortcut: 'P', desc: 'Draw meandering rivers, trade roads, and stone walls' },
  { id: 'text', name: 'Text & Banners', icon: Type, shortcut: 'T', desc: 'Add stylized fantasy kingdom labels and dungeon titles' },
  { id: 'grid', name: 'Grid & Alignment', icon: Grid, shortcut: 'G', desc: 'Configure square or hex grid, scale, and opacity' },
  { id: 'atmosphere', name: 'Atmosphere & Light', icon: SunMoon, shortcut: 'A', desc: 'Vignette, vintage parchment warmth, and grimdark lighting' },
  { id: 'eraser', name: 'Eraser', icon: Eraser, shortcut: 'E', desc: 'Rub out brush strokes, sculpted land strokes and paths' },
  { id: 'hand', name: 'Pan Canvas', icon: Hand, shortcut: 'H', desc: 'Pan around map (or hold Spacebar)' }
];

// Draw tools build the map; utility tools navigate, select, erase and adjust it.
const DRAW_IDS = ['mask', 'brush', 'stamp', 'path', 'text'];

function Rail({ label, tools, activeTool, setActiveTool }) {
  return (
    <aside className="tool-bar" aria-label={label}>
      <div className="tool-rail-label">{label}</div>
      <div className="tool-list">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.name} (${tool.shortcut})\n${tool.desc}`}
            >
              <Icon size={20} className="tool-icon" />
              <span className="tool-shortcut-badge">{tool.shortcut}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function ToolBar({ activeTool, setActiveTool }) {
  return (
    <>
      <Rail label="Draw" tools={TOOLS.filter((t) => DRAW_IDS.includes(t.id))} activeTool={activeTool} setActiveTool={setActiveTool} />
      <Rail label="Tools" tools={TOOLS.filter((t) => !DRAW_IDS.includes(t.id))} activeTool={activeTool} setActiveTool={setActiveTool} />
    </>
  );
}
