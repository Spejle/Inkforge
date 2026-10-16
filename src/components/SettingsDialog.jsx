import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Plus, Palette, Keyboard, PanelRight, Puzzle } from 'lucide-react';
import { DEFAULT_LAYOUT, PANEL_MIN, PANEL_MAX } from '../utils/layout';
import { THEMES } from '../utils/theme';
import PluginsSettings from './PluginsSettings';
import { ACTIONS, comboOf, bind, unbind, defaultKeymap } from '../utils/keymap';

const WHEEL = [
  ['Wheel', 'Zoom the canvas'],
  ['Shift + Wheel', 'Size: the brush, the stamp / label / river you are about to place, or the selected stamp, label or river'],
  ['Ctrl + Wheel', 'Rotate the selected stamp or label, or the stamp you are about to place (1° a notch)'],
  ['Ctrl + Shift + Wheel', 'The same rotation in 5° steps'],
  ['Space + drag', 'Pan (or use the Pan tool)']
];

const labelOf = (id) => ACTIONS.find((a) => a.id === id)?.label || id;

export default function SettingsDialog({ layout, setLayout, onClose, theme, setTheme, keymap, setKeymap, initialTab = 'appearance' }) {
  const [tab, setTab] = useState(initialTab);
  const [rec, setRec] = useState(null); // the binding slot waiting for a key: { id, index } (index -1 = a new one)
  const [note, setNote] = useState('');

  // while a slot is recording, the next key press is the binding and must not reach the app's own shortcuts
  useEffect(() => {
    if (!rec) return undefined;
    const onKey = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const combo = comboOf(e);
      if (!combo) return; // only a modifier so far
      setRec(null);
      if (combo === 'Esc') return;
      const r = bind(keymap, rec.id, rec.index, combo);
      setKeymap(r.map);
      setNote(r.displaced && r.displaced !== rec.id ? `${combo} was taken from "${labelOf(r.displaced)}".` : '');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [rec, keymap, setKeymap]);

  useEffect(() => {
    if (rec) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rec, onClose]);

  const defaults = defaultKeymap();
  const groups = [...new Set(ACTIONS.map((a) => a.group))];
  const changed = (id) => JSON.stringify(keymap[id]) !== JSON.stringify(defaults[id]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog settings-dialog" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h3>Settings</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="settings-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'appearance'} className={tab === 'appearance' ? 'active' : ''} onClick={() => setTab('appearance')}><Palette size={14} /> Appearance</button>
          <button role="tab" aria-selected={tab === 'layout'} className={tab === 'layout' ? 'active' : ''} onClick={() => setTab('layout')}><PanelRight size={14} /> Layout</button>
          <button role="tab" aria-selected={tab === 'keys'} className={tab === 'keys' ? 'active' : ''} onClick={() => setTab('keys')}><Keyboard size={14} /> Keyboard &amp; mouse</button>
          <button role="tab" aria-selected={tab === 'plugins'} className={tab === 'plugins' ? 'active' : ''} onClick={() => setTab('plugins')}><Puzzle size={14} /> Plugins</button>
        </div>

        <div className="dialog-body">
          {tab === 'appearance' && (
            <div className="theme-grid">
              {THEMES.map((t) => (
                <button key={t.id} className={`theme-card ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)} aria-pressed={theme === t.id}>
                  <span className="theme-swatch">{t.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
                  <b>{t.name}</b>
                  <span className="mute">{t.desc}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'layout' && layout && (
            <div className="layout-settings">
              <p className="mute">Where the tool rail and the tool panel sit. Drag the edge of the panel to resize it.</p>
              <div className="layout-grid">
                {[
                  ['left', 'right', 'Tools left, panel right'],
                  ['right', 'left', 'Panel left, tools right'],
                  ['left', 'left', 'Tools and panel left'],
                  ['right', 'right', 'Tools and panel right']
                ].map(([toolbarSide, panelSide, name]) => (
                  <button
                    key={name}
                    className={`layout-card ${layout.toolbarSide === toolbarSide && layout.panelSide === panelSide ? 'active' : ''}`}
                    aria-pressed={layout.toolbarSide === toolbarSide && layout.panelSide === panelSide}
                    onClick={() => setLayout((l) => ({ ...l, toolbarSide, panelSide }))}
                  >
                    <span className="layout-diagram" data-tb={toolbarSide} data-panel={panelSide}>
                      <i className="ld-tools" /><i className="ld-stage" /><i className="ld-panel" />
                    </span>
                    <b>{name}</b>
                  </button>
                ))}
              </div>
              <label className="option-label" style={{ marginTop: 14 }}>
                Panel width: <span className="val-badge">{layout.panelWidth}px</span>
                <input type="range" min={PANEL_MIN} max={PANEL_MAX} step="10" value={layout.panelWidth} onChange={(e) => setLayout((l) => ({ ...l, panelWidth: parseInt(e.target.value, 10) }))} />
              </label>
              <label className="checkbox-label" style={{ marginTop: 10 }}>
                <input type="checkbox" checked={layout.statusBar} onChange={(e) => setLayout((l) => ({ ...l, statusBar: e.target.checked }))} />
                Show the status bar (cursor position, canvas size)
              </label>
              <button className="chip" style={{ marginTop: 12 }} onClick={() => setLayout({ ...DEFAULT_LAYOUT })}><RotateCcw size={12} /> Reset layout</button>
            </div>
          )}

          {tab === 'plugins' && <PluginsSettings />}

          {tab === 'keys' && (
            <>
              <p className="mute">Click a key to change it, <b>+</b> adds another, <b>×</b> removes one. A key belongs to one action: giving it to another takes it away from the first. Esc cancels. Arrow keys nudge the selection (Shift = 10 px).</p>
              {note && <p className="settings-note">{note}</p>}
              {groups.map((g) => (
                <div key={g} className="key-group">
                  <h4>{g}</h4>
                  {ACTIONS.filter((a) => a.group === g).map((a) => (
                    <div key={a.id} className="key-row">
                      <span className="key-label">{a.label}{a.fine && <small> (Shift = 1°)</small>}</span>
                      <span className="key-chips">
                        {keymap[a.id].map((k, i) => {
                          const on = rec && rec.id === a.id && rec.index === i;
                          return (
                            <span key={k + i} className="key-chip-wrap">
                              <button className={`key-chip ${on ? 'recording' : ''}`} onClick={() => { setNote(''); setRec({ id: a.id, index: i }); }} title="Click, then press the new key">{on ? 'Press a key…' : k}</button>
                              <button className="key-chip-x" onClick={() => setKeymap(unbind(keymap, a.id, i))} aria-label={`Remove ${k}`}><X size={11} /></button>
                            </span>
                          );
                        })}
                        {rec && rec.id === a.id && rec.index === -1 ? (
                          <span className="key-chip recording">Press a key…</span>
                        ) : (
                          <button className="key-chip add" onClick={() => { setNote(''); setRec({ id: a.id, index: -1 }); }} title="Add another key" aria-label={`Add a key for ${a.label}`}><Plus size={12} /></button>
                        )}
                        {keymap[a.id].length === 0 && <span className="mute">unbound</span>}
                        {changed(a.id) && <button className="key-chip add" onClick={() => setKeymap({ ...keymap, [a.id]: [...defaults[a.id]] })} title="Back to the default" aria-label={`Reset ${a.label}`}><RotateCcw size={12} /></button>}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="key-group">
                <h4>Mouse wheel</h4>
                {WHEEL.map(([k, d]) => (
                  <div key={k} className="key-row"><span className="key-label">{d}</span><span className="key-chips"><kbd className="key-chip fixed">{k}</kbd></span></div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="dialog-foot">
          {tab === 'keys' && <button className="btn-ghost" onClick={() => { setKeymap(defaultKeymap()); setNote(''); }}><RotateCcw size={14} /> Reset all keys</button>}
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
