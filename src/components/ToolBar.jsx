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
import { shortcutOf } from '../utils/keymap';

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

export default function ToolBar({ activeTool, setActiveTool, keymap }) {
  const group = (tools) =>
    tools.map((tool) => {
      const Icon = tool.icon;
      const key = keymap ? shortcutOf(keymap, `tool.${tool.id}`) : tool.shortcut;
      return (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => setActiveTool(tool.id)}
          title={`${tool.name}${key ? ` (${key})` : ''}\n${tool.desc}`}
        >
          <Icon size={20} className="tool-icon" />
          <span className="tool-shortcut-badge">{key}</span>
        </button>
      );
    });
  return (
    <aside className="tool-bar" aria-label="Tools">
      <div className="tool-list">{group(TOOLS.filter((t) => DRAW_IDS.includes(t.id)))}</div>
      <div className="tool-rail-divider" />
      <div className="tool-list">{group(TOOLS.filter((t) => !DRAW_IDS.includes(t.id)))}</div>
    </aside>
  );
}
