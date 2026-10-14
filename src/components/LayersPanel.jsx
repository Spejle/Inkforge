import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const LAYER_DEFS = [
  { key: 'text', name: 'Labels' },
  { key: 'stamps', name: 'Stamps' },
  { key: 'paths', name: 'Rivers & roads' },
  { key: 'land', name: 'Land & terrain' },
  { key: 'background', name: 'Sea' },
  { key: 'grid', name: 'Grid' }
];

const BLENDS = [
  ['source-over', 'Normal'],
  ['multiply', 'Multiply'],
  ['overlay', 'Overlay'],
  ['soft-light', 'Soft light']
];

export const DEFAULT_LAYERS = Object.fromEntries(
  LAYER_DEFS.map((l) => [l.key, { visible: true, opacity: 1, blend: 'source-over' }])
);

export const MAP_STYLES = {
  Parchment: { vignette: 0.4, parchmentGrain: 0.35, sepia: 0.2, brightness: 1 },
  Ink: { vignette: 0.15, parchmentGrain: 0, sepia: 0, brightness: 0.95 },
  Painted: { vignette: 0.1, parchmentGrain: 0.1, sepia: 0, brightness: 1.12 }
};

export default function LayersPanel({ layers, setLayers, setAtmosphere }) {
  const [open, setOpen] = React.useState('land');
  const set = (key, patch) => setLayers((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
  const sel = layers[open];

  return (
    <div className="fx-card">
      <div className="fx-card-header"><h4>Layers</h4></div>
      <div className="fx-card-content">
        {LAYER_DEFS.map(({ key, name }) => (
          <div key={key} className={`layer-row ${open === key ? 'on' : ''}`} onClick={() => setOpen(key)}>
            <button
              className="layer-eye"
              title={layers[key].visible ? 'Hide' : 'Show'}
              onClick={(e) => { e.stopPropagation(); set(key, { visible: !layers[key].visible }); }}
            >
              {layers[key].visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <span>{name}</span>
            {layers[key].opacity < 1 && <span className="val-badge">{Math.round(layers[key].opacity * 100)}%</span>}
          </div>
        ))}
        {sel && (
          <div className="layer-detail">
            <label className="fx-slider-label"><span>Opacity</span><span className="val-badge">{Math.round(sel.opacity * 100)}%</span></label>
            <input type="range" min="0" max="1" step="0.05" value={sel.opacity} onChange={(e) => set(open, { opacity: parseFloat(e.target.value) })} />
            <label className="fx-slider-label mt-2"><span>Blend</span></label>
            <select className="select-input" style={{ width: '100%' }} value={sel.blend} onChange={(e) => set(open, { blend: e.target.value })}>
              {BLENDS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
          </div>
        )}
        <label className="fx-slider-label mt-3"><span>Map style</span></label>
        <div className="style-chips">
          {Object.entries(MAP_STYLES).map(([name, preset]) => (
            <button key={name} className="chip" onClick={() => setAtmosphere((p) => ({ ...p, ...preset }))}>{name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
