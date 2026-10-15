import React, { useEffect, useRef, useState } from 'react';
import { Compass, FilePlus, FolderOpen, Copy, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { PRESET_MAPS } from '../engine/presetMaps';
import { getTemplate } from '../engine/mapTemplates';
import { makeThumb } from '../utils/thumb';

const sampleThumbs = new Map(); // presetId -> data URL, rendered once per session

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Date(t).toLocaleDateString();
}

export default function Home({ maps, onOpen, onNew, onDelete, onDuplicate, onImport, onOpenSample, onSettings }) {
  const fileRef = useRef(null);
  const [, bump] = useState(0);

  // Draw sample thumbnails one per tick so the menu stays responsive
  useEffect(() => {
    let cancelled = false;
    const todo = PRESET_MAPS.filter((p) => !p.heavy && !sampleThumbs.has(p.id)); // heavy samples would stall the menu
    const next = () => {
      const p = todo.shift();
      if (!p || cancelled) return;
      sampleThumbs.set(p.id, makeThumb({ ...p, type: p.type || 'world' }, 360));
      bump((n) => n + 1);
      setTimeout(next, 30);
    };
    setTimeout(next, 60);
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-hero">
          <div className="logo-badge">
            <Compass className="brand-icon" size={34} />
            <div className="logo-text">
              <span className="brand-name" style={{ fontSize: 26 }}>INKFORGE</span>
              <span className="brand-sub">Fantasy Cartographer</span>
            </div>
          </div>
          <div className="home-actions">
            <button className="btn-primary" onClick={onNew}><FilePlus size={16} /> New map</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}><FolderOpen size={16} /> Open file</button>
            <button className="btn-ghost" onClick={onSettings}><SettingsIcon size={16} /> Settings</button>
            <input ref={fileRef} type="file" accept=".inkforge,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          </div>
        </div>

        <h2 className="home-h">Your maps</h2>
        {maps === null ? (
          <p className="mute">Loading…</p>
        ) : maps.length === 0 ? (
          <div className="home-empty">
            <p>No maps yet. Start a new one, or open a sample below to learn from it.</p>
            <button className="btn-primary" onClick={onNew}><FilePlus size={16} /> New map</button>
          </div>
        ) : (
          <div className="map-grid">
            <button className="map-card new" onClick={onNew}><FilePlus size={28} /><b>New map</b></button>
            {maps.map((m) => (
              <div key={m.id} className="map-card" onClick={() => onOpen(m.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(m.id)}>
                <div className="map-thumb">{m.thumb ? <img src={m.thumb} alt="" /> : <span>No preview</span>}</div>
                <div className="map-info">
                  <b title={m.title}>{m.title}</b>
                  <span>{getTemplate(m.template).name} · {m.width}×{m.height} · {ago(m.updated)}</span>
                </div>
                <div className="map-actions">
                  <button className="btn-icon" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(m.id); }}><Copy size={14} /></button>
                  <button className="btn-icon danger" title="Delete this map" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${m.title}"? This cannot be undone.`)) onDelete(m.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="home-h">Sample maps <small>opens a copy, the sample itself never changes</small></h2>
        <div className="map-grid">
          {PRESET_MAPS.filter((p) => p.id !== 'blank_canvas').map((p) => (
            <div key={p.id} className="map-card" onClick={() => onOpenSample(p.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpenSample(p.id)}>
              <div className="map-thumb">{sampleThumbs.get(p.id) ? <img src={sampleThumbs.get(p.id)} alt="" /> : <span>{p.heavy ? 'Stress test' : 'Rendering…'}</span>}</div>
              <div className="map-info">
                <b title={p.title}>{p.title}</b>
                <span>{getTemplate(p.template || p.type).name} · {p.heavy || `${p.width}×${p.height}`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
