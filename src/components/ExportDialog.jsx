import React, { useEffect, useState } from 'react';
import { X, Printer, Layers } from 'lucide-react';
import { maxExportScale } from '../utils/exportUtils';

const FORMATS = [
  ['png', 'PNG', 'Lossless, largest file'],
  ['webp', 'WebP', 'Small, sharp, modern'],
  ['jpg', 'JPG', 'Smallest, no transparency'],
  ['vtt', 'VTT', 'Universal VTT (.dd2vtt) with walls, doors and lights']
];
const SCALES = [0.5, 1, 2, 4, 8];
const PREFS = 'inkforge.export';

export default function ExportDialog({ mapWidth, mapHeight, gridEnabled, onClose, onExport, onLayers, onPrint }) {
  const [o, setO] = useState(() => {
    const d = { format: 'png', quality: 90, scale: 2, includeGrid: true, vttImage: 'webp' };
    try { return { ...d, ...JSON.parse(localStorage.getItem(PREFS) || '{}') }; } catch { return d; }
  });
  const set = (patch) => setO((p) => ({ ...p, ...patch }));
  useEffect(() => { try { localStorage.setItem(PREFS, JSON.stringify(o)); } catch { /* private mode */ } }, [o]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Export" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h3>Export <span className="val-badge">{w} × {h} px</span></h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body">
          <label className="fx-slider-label"><span>Format</span></label>
          <div className="style-chips">
            {FORMATS.map(([k, label, tip]) => (
              <button key={k} title={tip} className={`chip ${o.format === k ? 'active' : ''}`} onClick={() => set({ format: k })}>{label}</button>
            ))}
          </div>
          <p className="mute">{FORMATS.find((f) => f[0] === o.format)[2]}</p>

          {o.format === 'vtt' && (
            <>
              <label className="fx-slider-label mt-2"><span>Embedded image</span></label>
              <div className="style-chips">
                {['webp', 'png'].map((k) => (
                  <button key={k} className={`chip ${o.vttImage === k ? 'active' : ''}`} onClick={() => set({ vttImage: k })}>{k.toUpperCase()}</button>
                ))}
              </div>
            </>
          )}

          <label className="fx-slider-label mt-2"><span>Resolution</span></label>
          <div className="style-chips">
            {SCALES.map((s) => (
              <button key={s} disabled={s > cap * 1.001 && s !== 1} className={`chip ${o.scale === s ? 'active' : ''}`} onClick={() => set({ scale: s })}>
                {s}× · {Math.round(Math.max(mapWidth, mapHeight) * Math.min(s, cap))} px
              </button>
            ))}
          </div>
          {o.scale > cap && <p className="mute">Capped at {Math.floor(cap * 100) / 100}× by the browser's canvas limit.</p>}

          <label className="fx-slider-label mt-2">
            <span>Quality</span>
            <span className="val-badge">{lossy ? `${o.quality}%` : 'lossless'}</span>
          </label>
          <input type="range" min="40" max="100" value={o.quality} disabled={!lossy} onChange={(e) => set({ quality: parseInt(e.target.value) })} />

          {o.format !== 'vtt' && gridEnabled && (
            <label className="checkbox-label mt-2">
              <input type="checkbox" checked={o.includeGrid} onChange={(e) => set({ includeGrid: e.target.checked })} /> Include grid
            </label>
          )}
        </div>
        <div className="dialog-foot">
          <button className="btn-ghost" onClick={() => { onClose(); onLayers(scale, o.includeGrid); }} title="One transparent PNG per layer, zipped">
            <Layers size={14} /> Layers ZIP
          </button>
          <button className="btn-ghost" onClick={() => { onClose(); onPrint(); }}>
            <Printer size={14} /> Print PDF…
          </button>
          <button className="btn-primary" disabled={busy} onClick={go}>{busy ? 'Rendering…' : 'Download'}</button>
        </div>
      </div>
    </div>
  );
}
