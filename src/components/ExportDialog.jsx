import React, { useEffect, useState } from 'react';
import { X, Printer, Layers, Puzzle } from 'lucide-react';
import { maxExportScale } from '../utils/exportUtils';
import Modal from './Modal';

const FORMATS = [
  ['png', 'PNG', 'Lossless, largest file'],
  ['webp', 'WebP', 'Small, sharp, modern'],
  ['jpg', 'JPG', 'Smallest, no transparency'],
  ['vtt', 'VTT', 'Universal VTT (.dd2vtt) with walls, doors and lights']
];
const SCALES = [0.5, 1, 2, 4, 8];
const PREFS = 'inkforge.export';

// onLayers / onPrint are null and `vtt` false while their plugins are not installed
export default function ExportDialog({ mapWidth, mapHeight, gridEnabled, onClose, onExport, onLayers, onPrint, vtt, onPlugins }) {
  const [o, setO] = useState(() => {
    const d = { format: 'png', quality: 90, scale: 2, includeGrid: true, vttImage: 'webp' };
    let v = d;
    try { v = { ...d, ...JSON.parse(localStorage.getItem(PREFS) || '{}') }; } catch { /* blocked or corrupt */ }
    return v.format === 'vtt' && !vtt ? { ...v, format: 'png' } : v; // remembered from when VTT export was installed
  });
  const formats = FORMATS.filter(([k]) => k !== 'vtt' || vtt);
  const set = (patch) => setO((p) => ({ ...p, ...patch }));
  useEffect(() => { try { localStorage.setItem(PREFS, JSON.stringify(o)); } catch { /* private mode */ } }, [o]);

  const cap = maxExportScale(mapWidth, mapHeight);
  const scale = Math.min(o.scale, cap);
  const w = Math.round(mapWidth * scale), h = Math.round(mapHeight * scale);
  const lossy = o.format === 'webp' || o.format === 'jpg' || (o.format === 'vtt' && o.vttImage === 'webp');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      await onExport({ ...o, scale, quality: o.quality / 100 });
      onClose();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>{(titleId) => (<>
        <div className="dialog-head">
          <h2 id={titleId}>Export <span className="val-badge">{w} × {h} px</span></h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body">
          <span className="fx-slider-label" id="export-format"><span>Format</span></span>
          <div className="style-chips" role="group" aria-labelledby="export-format">
            {formats.map(([k, label, tip]) => (
              <button key={k} title={tip} className={`chip ${o.format === k ? 'active' : ''}`} aria-pressed={o.format === k} onClick={() => set({ format: k })}>{label}</button>
            ))}
          </div>
          <p className="mute">{FORMATS.find((f) => f[0] === o.format)[2]}</p>

          {o.format === 'vtt' && (
            <>
              <span className="fx-slider-label mt-2" id="export-vtt-image"><span>Embedded image</span></span>
              <div className="style-chips" role="group" aria-labelledby="export-vtt-image">
                {['webp', 'png'].map((k) => (
                  <button key={k} className={`chip ${o.vttImage === k ? 'active' : ''}`} aria-pressed={o.vttImage === k} onClick={() => set({ vttImage: k })}>{k.toUpperCase()}</button>
                ))}
              </div>
            </>
          )}

          <span className="fx-slider-label mt-2" id="export-scale"><span>Resolution</span></span>
          <div className="style-chips" role="group" aria-labelledby="export-scale">
            {SCALES.map((s) => (
              <button key={s} disabled={s > cap * 1.001 && s !== 1} className={`chip ${o.scale === s ? 'active' : ''}`} aria-pressed={o.scale === s} onClick={() => set({ scale: s })}>
                {s}× · {Math.round(Math.max(mapWidth, mapHeight) * Math.min(s, cap))} px
              </button>
            ))}
          </div>
          {o.scale > cap && <p className="mute">Capped at {Math.floor(cap * 100) / 100}× by the browser's canvas limit.</p>}

          <label className="fx-slider-label mt-2" htmlFor="export-quality">
            <span>Quality</span>
            <span className="val-badge">{lossy ? `${o.quality}%` : 'lossless'}</span>
          </label>
          <input id="export-quality" type="range" min="40" max="100" value={o.quality} aria-valuetext={lossy ? `${o.quality}%` : 'lossless'} disabled={!lossy} onChange={(e) => set({ quality: parseInt(e.target.value) })} />

          {o.format !== 'vtt' && gridEnabled && (
            <label className="checkbox-label mt-2">
              <input type="checkbox" checked={o.includeGrid} onChange={(e) => set({ includeGrid: e.target.checked })} /> Include grid
            </label>
          )}
        </div>
        <div className="dialog-foot">
          {onLayers && (
            <button className="btn-ghost" onClick={() => { onClose(); onLayers(scale, o.includeGrid); }} title="One transparent PNG per layer, zipped">
              <Layers size={14} /> Layers ZIP
            </button>
          )}
          {onPrint && (
            <button className="btn-ghost" onClick={() => { onClose(); onPrint(); }}>
              <Printer size={14} /> Print PDF…
            </button>
          )}
          {!(vtt && onLayers && onPrint) && (
            <button className="btn-ghost" onClick={() => { onClose(); onPlugins(); }} title="VTT, print and layer exports are plugins">
              <Puzzle size={14} /> More formats…
            </button>
          )}
          <button className="btn-primary" disabled={busy} onClick={go}>{busy ? 'Rendering…' : 'Download'}</button>
        </div>
    </>)}</Modal>
  );
}
