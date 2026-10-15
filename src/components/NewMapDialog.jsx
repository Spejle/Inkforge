import React, { useEffect, useState } from 'react';
import { X, Globe, Map as MapIcon, Castle, Swords, Skull, Brush } from 'lucide-react';
import { TEMPLATES } from '../engine/mapTemplates';

const ICONS = { Globe, Map: MapIcon, Castle, Swords, Skull, Brush };

export default function NewMapDialog({ onClose, onCreate }) {
  const [tplId, setTplId] = useState('world');
  const tpl = TEMPLATES.find((t) => t.id === tplId);
  const [sizeIdx, setSizeIdx] = useState(tpl.defaultSize);
  const [custom, setCustom] = useState(false);
  const [w, setW] = useState(tpl.sizes[tpl.defaultSize].w);
  const [h, setH] = useState(tpl.sizes[tpl.defaultSize].h);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (t) => {
    setTplId(t.id);
    setCustom(false);
    setSizeIdx(t.defaultSize);
    setW(t.sizes[t.defaultSize].w);
    setH(t.sizes[t.defaultSize].h);
  };
  const pickSize = (i) => {
    setCustom(false);
    setSizeIdx(i);
    setW(tpl.sizes[i].w);
    setH(tpl.sizes[i].h);
  };
  const clamp = (v) => Math.max(600, Math.min(8000, Math.round(Number(v) || 600)));
  const create = () => onCreate(tpl.id, title.trim() || `Untitled ${tpl.name}`, clamp(w), clamp(h));

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog newmap" role="dialog" aria-label="New map" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h3>New map</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body">
          <div className="tpl-grid">
            {TEMPLATES.map((t) => {
              const Icon = ICONS[t.icon] || Brush;
              return (
                <button key={t.id} className={`tpl-card ${t.id === tplId ? 'active' : ''}`} onClick={() => pick(t)}>
                  <Icon size={22} />
                  <b>{t.name}</b>
                  <span>{t.desc}</span>
                </button>
              );
            })}
          </div>

          <label className="fx-slider-label"><span>Name</span></label>
          <input className="text-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Untitled ${tpl.name}`} autoFocus />

          <label className="fx-slider-label"><span>Size</span><span className="val-badge">{clamp(w)} × {clamp(h)} px</span></label>
          <div className="btn-group">
            {tpl.sizes.map((s, i) => (
              <button key={s.name} className={`btn-toggle ${!custom && sizeIdx === i ? 'active' : ''}`} onClick={() => pickSize(i)}>
                {s.name} <small>{s.w}×{s.h}</small>
              </button>
            ))}
            <button className={`btn-toggle ${custom ? 'active' : ''}`} onClick={() => setCustom(true)}>Custom</button>
          </div>
          {custom && (
            <div className="flex-row gap-3 items-center">
              <input className="text-input" type="number" min="600" max="8000" value={w} onChange={(e) => setW(e.target.value)} aria-label="Width" />
              ×
              <input className="text-input" type="number" min="600" max="8000" value={h} onChange={(e) => setH(e.target.value)} aria-label="Height" />
            </div>
          )}

          <p className="mute">
            {tpl.stampCategories ? 'Offers only stamps and brushes that fit this kind of map (you can still reveal everything from the drawer).' : 'Every brush and stamp is available.'}
          </p>
        </div>
        <div className="dialog-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={create}>Create map</button>
        </div>
      </div>
    </div>
  );
}
