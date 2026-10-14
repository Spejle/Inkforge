import React, { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';

/** Crop fully transparent edges; returns { dataUrl, img, trimmed } (trimmed = px removed per axis). */
function trim(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 8) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return { dataUrl: c.toDataURL(), width, height, trimmed: 0 };
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const o = document.createElement('canvas');
  o.width = w; o.height = h;
  o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
  return { dataUrl: o.toDataURL(), width: w, height: h, trimmed: width - w + (height - h) };
}

const load = (file) => new Promise((resolve) => {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const t = trim(img);
      const out = new Image();
      out.onload = () => resolve({
        key: file.name + file.size, name: file.name.replace(/\.[^.]+$/, ''), img: out, dataUrl: t.dataUrl,
        aspect: t.width / t.height, trimmed: t.trimmed, anchor: 'base'
      });
      out.src = t.dataUrl;
    };
    img.onerror = () => resolve(null);
    img.src = r.result;
  };
  r.readAsDataURL(file);
});

export default function StampImportDialog({ onClose, onAdd }) {
  const [items, setItems] = useState([]);
  const [cur, setCur] = useState(0);
  const [pack, setPack] = useState('My stamps');
  const [license, setLicense] = useState('Private');
  const inputRef = React.useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addFiles = async (files) => {
    const got = (await Promise.all([...files].filter((f) => /^image\//.test(f.type)).map(load))).filter(Boolean);
    setItems((p) => [...p, ...got]);
  };
  const patch = (patchObj) => setItems((p) => p.map((it, i) => (i === cur ? { ...it, ...patchObj } : it)));
  const it = items[cur];

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Add stamps" onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
        <div className="dialog-head">
          <h3>Add stamps <span className="val-badge">{items.length} {items.length === 1 ? "file" : "files"}</span></h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body stamp-import">
          <div className="si-list">
            {items.map((x, i) => (
              <button key={x.key + i} className={`si-item ${i === cur ? 'on' : ''}`} onClick={() => setCur(i)}>
                <img src={x.dataUrl} alt="" /> <span>{x.name}</span>
              </button>
            ))}
            <button className="si-drop" onClick={() => inputRef.current?.click()}><Upload size={16} /> Drop more PNG or SVG</button>
            <input ref={inputRef} type="file" multiple accept="image/png,image/svg+xml,image/webp" hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
          <div className="si-edit">
            {it ? (
              <>
                <div className="si-preview">
                  <img src={it.dataUrl} alt="" style={{ maxHeight: 140 }} />
                  <span className={`si-anchor ${it.anchor}`} />
                </div>
                <p className="mute">{it.trimmed ? `Trimmed ${it.trimmed} px of empty space` : 'Nothing to trim'} · Anchor: {it.anchor}</p>
                <label className="fx-slider-label"><span>Name</span></label>
                <input className="select-input" style={{ width: '100%' }} value={it.name} onChange={(e) => patch({ name: e.target.value })} />
                <label className="fx-slider-label mt-2"><span>Anchor</span></label>
                <div className="style-chips">
                  {['base', 'center'].map((a) => (
                    <button key={a} className={`chip ${it.anchor === a ? 'active' : ''}`} onClick={() => patch({ anchor: a })}>{a === 'base' ? 'Base (stands on ground)' : 'Centre'}</button>
                  ))}
                </div>
                <label className="fx-slider-label mt-2"><span>Pack</span></label>
                <input className="select-input" style={{ width: '100%' }} value={pack} onChange={(e) => setPack(e.target.value)} />
                <label className="fx-slider-label mt-2"><span>License (saved with the stamp)</span></label>
                <div className="style-chips">
                  {['Private', 'CC0', 'CC BY'].map((l) => (
                    <button key={l} className={`chip ${license === l ? 'active' : ''}`} onClick={() => setLicense(l)}>{l}</button>
                  ))}
                </div>
              </>
            ) : <p className="mute">Choose or drop PNG, SVG or WebP files. Empty edges are trimmed automatically.</p>}
          </div>
        </div>
        <div className="dialog-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!items.length}
            onClick={() => { onAdd(items.map((x) => ({ ...x, pack, license }))); onClose(); }}>
            Add {items.length || ''} stamps
          </button>
        </div>
      </div>
    </div>
  );
}
