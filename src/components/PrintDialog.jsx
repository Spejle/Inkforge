import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PAPERS, planPrint } from '../utils/printUtils';

export default function PrintDialog({ mapWidth, mapHeight, gridSize, onClose, onPrint }) {
  const [o, setO] = useState({
    paper: 'A4', landscape: false, scaleMode: 'table', squareInches: 1, overlapMm: 8,
    marks: true, printGrid: true, inkSaver: false, guide: true
  });
  const set = (patch) => setO((p) => ({ ...p, ...patch }));
  const plan = planPrint({ ...o, mapWidth, mapHeight, gridSize });
  const sheets = plan.pages + (o.guide && plan.pages > 1 ? 1 : 0);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const check = (k, label) => (
    <label className="checkbox-label"><input type="checkbox" checked={o[k]} onChange={(e) => set({ [k]: e.target.checked })} /> {label}</label>
  );

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Print" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h3>Print at table scale <span className="val-badge">PDF · {sheets} pages</span></h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body">
          <div className="print-grid-preview" style={{ gridTemplateColumns: `repeat(${plan.cols}, 1fr)` }}>
            {Array.from({ length: plan.pages }, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <p className="mute">
            {Math.round((mapWidth / gridSize) * 10) / 10} × {Math.round((mapHeight / gridSize) * 10) / 10} squares ·
            {' '}{Math.round(plan.mapMmW / 25.4 * 10) / 10} × {Math.round(plan.mapMmH / 25.4 * 10) / 10} in at this scale ·
            {' '}{plan.cols} × {plan.rows} {o.paper} sheets
          </p>
          <label className="fx-slider-label"><span>Paper</span></label>
          <div className="style-chips">
            {Object.keys(PAPERS).map((p) => <button key={p} className={`chip ${o.paper === p ? 'active' : ''}`} onClick={() => set({ paper: p })}>{p}</button>)}
            <button className={`chip ${o.landscape ? 'active' : ''}`} onClick={() => set({ landscape: !o.landscape })}>Landscape</button>
          </div>
          <label className="fx-slider-label mt-2"><span>Scale</span></label>
          <div className="style-chips">
            <button className={`chip ${o.scaleMode === 'table' ? 'active' : ''}`} onClick={() => set({ scaleMode: 'table' })}>True table scale</button>
            <button className={`chip ${o.scaleMode === 'fit' ? 'active' : ''}`} onClick={() => set({ scaleMode: 'fit' })}>Fit to one page</button>
          </div>
          {o.scaleMode === 'table' && (
            <>
              <label className="fx-slider-label mt-2"><span>1 square =</span><span className="val-badge">{o.squareInches} in</span></label>
              <input type="range" min="0.5" max="2" step="0.25" value={o.squareInches} onChange={(e) => set({ squareInches: parseFloat(e.target.value) })} />
              <label className="fx-slider-label mt-2"><span>Overlap</span><span className="val-badge">{o.overlapMm} mm</span></label>
              <input type="range" min="0" max="20" value={o.overlapMm} onChange={(e) => set({ overlapMm: parseInt(e.target.value) })} />
            </>
          )}
          {check('marks', 'Join marks & page numbers')}
          {check('printGrid', 'Print the grid')}
          {check('inkSaver', 'Ink saver (lighter fills)')}
          {check('guide', 'Page with assembly guide')}
        </div>
        <div className="dialog-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { onPrint(o); onClose(); }}>Download PDF</button>
        </div>
      </div>
    </div>
  );
}
