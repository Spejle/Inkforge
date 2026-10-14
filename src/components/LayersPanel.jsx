import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, ChevronUp, ChevronDown, PenLine } from 'lucide-react';

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

/** Built-in layers first (fixed order), then the user's custom layers (keys `c_*`) in object order. */
export function layerRows(layers) {
  const custom = Object.keys(layers).filter((k) => k.startsWith('c_')).reverse(); // top of the stack first
  return [
    ...custom.map((key) => ({ key, name: layers[key].name || 'Layer', custom: true })),
    ...LAYER_DEFS.map((d) => ({ ...d, custom: false }))
  ];
}

export default function LayersPanel({ layers, setLayers, setAtmosphere, activeLayer, setActiveLayer, onDeleteLayer, onMoveSelectionTo, hasSelection }) {
  const [open, setOpen] = React.useState('land');
  const set = (key, patch) => setLayers((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
  const sel = layers[open];
  const rows = layerRows(layers);

  const addLayer = () => {
    const key = 'c_' + Date.now().toString(36);
    const n = Object.keys(layers).filter((k) => k.startsWith('c_')).length + 1;
    setLayers((p) => ({ ...p, [key]: { visible: true, opacity: 1, blend: 'source-over', name: 'Layer ' + n } }));
    setActiveLayer(key);
    setOpen(key);
  };
  // custom layers are drawn in object order, so moving up/down = reordering the keys
  const move = (key, dir) =>
    setLayers((p) => {
      const customKeys = Object.keys(p).filter((k) => k.startsWith('c_'));
      const i = customKeys.indexOf(key);
      const j = i + dir;
      if (j < 0 || j >= customKeys.length) return p;
      [customKeys[i], customKeys[j]] = [customKeys[j], customKeys[i]];
      const builtin = Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('c_')));
      return { ...builtin, ...Object.fromEntries(customKeys.map((k) => [k, p[k]])) };
    });
  const rename = (key) => {
    const name = window.prompt('Layer name', layers[key].name || '');
    if (name && name.trim()) set(key, { name: name.trim() });
  };

  return (
    <div className="fx-card">
      <div className="fx-card-header">
        <h4>Layers</h4>
        <button className="layer-eye" title="Add a layer" onClick={addLayer}><Plus size={15} /></button>
      </div>
      <div className="fx-card-content">
        {rows.map(({ key, name, custom }) => (
          <div key={key} className={`layer-row ${open === key ? 'on' : ''}`} onClick={() => setOpen(key)}>
            <button
              className="layer-eye"
              title={layers[key].visible ? 'Hide' : 'Show'}
              onClick={(e) => { e.stopPropagation(); set(key, { visible: !layers[key].visible }); }}
            >
              {layers[key].visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              className="layer-eye"
              title={layers[key].locked ? 'Unlock (objects can be selected)' : 'Lock (objects cannot be selected)'}
              onClick={(e) => { e.stopPropagation(); set(key, { locked: !layers[key].locked }); }}
            >
              {layers[key].locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <span style={{ flex: 1 }}>{name}{custom && activeLayer === key ? ' •' : ''}</span>
            {layers[key].opacity < 1 && <span className="val-badge">{Math.round(layers[key].opacity * 100)}%</span>}
          </div>
        ))}
        {sel && (
          <div className="layer-detail">
            {sel.name !== undefined && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                <button className="chip" onClick={() => setActiveLayer(open)} title="New stamps, paths and labels go on this layer">
                  {activeLayer === open ? 'Active ✓' : 'Draw on this'}
                </button>
                <button className="layer-eye" title="Rename" onClick={() => rename(open)}><PenLine size={14} /></button>
                <button className="layer-eye" title="Move up" onClick={() => move(open, 1)}><ChevronUp size={15} /></button>
                <button className="layer-eye" title="Move down" onClick={() => move(open, -1)}><ChevronDown size={15} /></button>
                <button className="layer-eye" title="Delete layer (its objects return to the default layers)" onClick={() => { onDeleteLayer(open); setOpen('land'); }}><Trash2 size={14} /></button>
              </div>
            )}
            {hasSelection && sel.name !== undefined && (
              <button className="chip" style={{ marginBottom: 6 }} onClick={() => onMoveSelectionTo(open)}>Move selection here</button>
            )}
            {hasSelection && sel.name === undefined && (
              <button className="chip" style={{ marginBottom: 6 }} onClick={() => onMoveSelectionTo('')}>Move selection to default layer</button>
            )}
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
