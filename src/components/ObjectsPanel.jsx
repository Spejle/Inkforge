import React, { useState } from 'react';
import { getStampById } from '../engine/stampsCatalog';
import { layerRows } from './LayersPanel';

const CAP = 150; // rows shown per layer; the search box narrows the rest (the stress map has 1,400 stamps)

/** Everything placed on the map, grouped by layer. Click selects (Shift/Ctrl adds stamps), drag rows onto a layer to move them. */
export default function ObjectsPanel({ stamps, texts, paths, layers, selectedStampId, groupIds, selectedTextId, selectedPathId, onSelect, onMove }) {
  const [q, setQ] = useState('');
  const [over, setOver] = useState(null);
  const chosen = (o) => o.id === selectedStampId || o.id === selectedTextId || o.id === selectedPathId || groupIds.includes(o.id);
  const label = (o) =>
    o.text !== undefined ? `“${o.text}”`
    : o.points ? o.type[0].toUpperCase() + o.type.slice(1)
    : o.customImage ? 'Custom stamp'
    : getStampById(o.stampId)?.name || o.stampId || 'Stamp';
  const kind = (o) => (o.text !== undefined ? 'text' : o.points ? 'path' : 'stamp');
  const all = [...stamps, ...texts, ...paths].map((o) => ({ o, name: label(o), kind: kind(o) }));
  const needle = q.trim().toLowerCase();
  const shown = needle ? all.filter((r) => r.name.toLowerCase().includes(needle)) : all;
  const ownLayer = (o) => (o.layer && layers[o.layer] ? o.layer : '');
  const rows = [...layerRows(layers), { key: '', name: 'Default layers' }].filter((r, i, a) => a.findIndex((x) => x.key === r.key) === i);
  const seen = new Set();
  const groups = rows
    .filter((r) => r.custom || r.key === '')
    .map((r) => ({ ...r, items: shown.filter((x) => ownLayer(x.o) === r.key) }));
  groups.forEach((g) => g.items.forEach((x) => seen.add(x.o.id)));

  const drop = (key, e) => {
    e.preventDefault();
    setOver(null);
    const ids = JSON.parse(e.dataTransfer.getData('text/plain') || '[]');
    if (ids.length) onMove(ids, key);
  };

  return (
    <div className="fx-card">
      <div className="fx-card-header"><h4>Objects ({all.length})</h4></div>
      <div className="fx-card-content">
        <input style={{ width: '100%', marginBottom: 6, boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(0,0,0,.25)', color: 'inherit' }} placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
        {groups.map((g) => (
          <div key={g.key || 'default'}>
            <div
              className={`obj-group ${over === g.key ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOver(g.key); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => drop(g.key, e)}
            >
              {g.name} <small>({g.items.length})</small>
            </div>
            {g.items.slice(0, CAP).map(({ o, name, kind: k }) => (
              <div
                key={o.id}
                className={`obj-row ${chosen(o) ? 'on' : ''}`}
                draggable
                onDragStart={(e) => {
                  const ids = chosen(o) && groupIds.length ? groupIds : [o.id];
                  e.dataTransfer.setData('text/plain', JSON.stringify(ids));
                }}
                onClick={(e) => onSelect(o.id, k, e.shiftKey || e.ctrlKey || e.metaKey)}
              >
                <span className="obj-kind">{k === 'text' ? 'T' : k === 'path' ? '〰' : '◆'}</span> {name}
              </div>
            ))}
            {g.items.length > CAP && <div className="obj-more">+{g.items.length - CAP} more: use the filter</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
