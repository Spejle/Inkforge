import React, { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { installPack, removePack, setEnabled, listPacks, usePluginVersion } from '../plugins/registry';
import '../plugins/plugins.css';

export default function PluginsSettings() {
  usePluginVersion();
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState('');

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f.name);
    const r = f.size > 5 * 1024 * 1024 ? { errors: ['Pack is over 5 MB'] } : installPack(await f.text());
    setErrors(r.errors || []);
  };

  const packs = listPacks();
  return (
    <div className="plugins-settings">
      <p className="mute">A plugin pack is a <b>.json data file</b> that adds stamps, light presets or biomes. It contains no code and cannot run anything. Only install packs from people you trust to have drawn what they say they drew.</p>
      <label className="btn-ghost plugin-import">
        <Upload size={14} /> Import a pack (.json)
        <input type="file" accept=".json,application/json" data-testid="plugin-file" onChange={onFile} hidden />
      </label>
      {errors.length > 0 && (
        <div className="plugin-errors" role="alert">
          <b>{file} was rejected:</b>
          <ul>{errors.slice(0, 12).map((m, i) => <li key={i}>{m}</li>)}</ul>
          {errors.length > 12 && <span>…and {errors.length - 12} more</span>}
        </div>
      )}
      {packs.length === 0 && <p className="mute">No packs installed.</p>}
      {packs.map(({ pack, enabled }) => {
        const c = pack.contributes;
        return (
          <div key={pack.id} className="plugin-row">
            <div className="plugin-info">
              <b>{pack.name}</b> <span className="mute">{pack.author && `by ${pack.author} · `}{pack.license}</span>
              <div className="mute">{pack.description}</div>
              <div className="mute">{c.stamps.length} stamps · {c.lightPresets.length} light presets · {c.biomes.length} biomes</div>
            </div>
            <label className="plugin-toggle"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(pack.id, e.target.checked)} /> Enabled</label>
            <button className="btn-icon" onClick={() => removePack(pack.id)} aria-label={`Remove ${pack.name}`} title="Remove"><Trash2 size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
