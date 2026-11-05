import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PAPERS, planPrint } from './print.js';
import Modal from '../../../components/Modal.jsx';

export default function PrintDialog({ mapWidth, mapHeight, gridSize, onClose, onPrint }) {
  const [o, setO] = useState({
    paper: 'A4', landscape: false, scaleMode: 'table', squareInches: 1, overlapMm: 8,
    marks: true, printGrid: true, inkSaver: false, guide: true
  });
  const set = (patch) => setO((p) => ({ ...p, ...patch }));
  const plan = planPrint({ ...o, mapWidth, mapHeight, gridSize });
  const sheets = plan.pages + (o.guide && plan.pages > 1 ? 1 : 0);

  const check = (k, label) => (
    <label className="checkbox-label"><input type="checkbox" checked={o[k]} onChange={(e) => set({ [k]: e.target.checked })} /> {label}</label>
  );

  return (
    <Modal onClose={onClose}>{(titleId) => (<>
        <div className="dialog-head">
          <h2 id={titleId}>Print at table scale <span className="val-badge">PDF · {sheets} pages</span></h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body">
          <div className="print-grid-preview" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${plan.cols}, 1fr)` }}>
            {Array.from({ length: plan.pages }, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <p className="mute">
            {Math.round((mapWidth / gridSize) * 10) / 10} × {Math.round((mapHeight / gridSize) * 10) / 10} squares ·
            {' '}{Math.round(plan.mapMmW / 25.4 * 10) / 10} × {Math.round(plan.mapMmH / 25.4 * 10) / 10} in at this scale ·
            {' '}{plan.cols} × {plan.rows} {o.paper} sheets
          </p>
          <span className="fx-slider-label" id="print-paper"><span>Paper</span></span>
          <div className="style-chips" role="group" aria-labelledby="print-paper">
            {Object.keys(PAPERS).map((p) => <button key={p} className={`chip ${o.paper === p ? 'active' : ''}`} aria-pressed={o.paper === p} onClick={() => set({ paper: p })}>{p}</button>)}
            <button className={`chip ${o.landscape ? 'active' : ''}`} aria-pressed={o.landscape} onClick={() => set({ landscape: !o.landscape })}>Landscape</button>
          </div>
          <span className="fx-slider-label mt-2" id="print-scale"><span>Scale</span></span>
          <div className="style-chips" role="group" aria-labelledby="print-scale">
            <button className={`chip ${o.scaleMode === 'table' ? 'active' : ''}`} aria-pressed={o.scaleMode === 'table'} onClick={() => set({ scaleMode: 'table' })}>True table scale</button>
            <button className={`chip ${o.scaleMode === 'fit' ? 'active' : ''}`} aria-pressed={o.scaleMode === 'fit'} onClick={() => set({ scaleMode: 'fit' })}>Fit to one page</button>
          </div>
          {o.scaleMode === 'table' && (
            <>
              <label className="fx-slider-label mt-2" htmlFor="print-square"><span>1 square =</span><span className="val-badge">{o.squareInches} in</span></label>
              <input id="print-square" type="range" min="0.5" max="2" step="0.25" value={o.squareInches} onChange={(e) => set({ squareInches: parseFloat(e.target.value) })} />
              <label className="fx-slider-label mt-2" htmlFor="print-overlap"><span>Overlap</span><span className="val-badge">{o.overlapMm} mm</span></label>
              <input id="print-overlap" type="range" min="0" max="20" value={o.overlapMm} onChange={(e) => set({ overlapMm: parseInt(e.target.value) })} />
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
    </>)}</Modal>
  );
}
