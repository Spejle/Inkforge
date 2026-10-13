import React from 'react';
import { 
  Download, 
  FolderOpen, 
  Save, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid as GridIcon, 
  Compass, 
  Sparkles,
  FilePlus,
  ShieldAlert
} from 'lucide-react';
import { PRESET_MAPS } from '../engine/presetMaps';

export default function Header({
  mapTitle,
  setMapTitle,
  mapType,
  setMapType,
  zoom,
  setZoom,
  fitToScreen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridEnabled,
  setGridEnabled,
  onExportPng,
  onExportJson,
  onImportJson,
  onLoadPreset,
  onNewMap
}) {
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <header className="header-bar">
      {/* Brand & Map Title */}
      <div className="brand-section">
        <div className="logo-badge">
          <Compass className="brand-icon" size={24} />
          <div className="logo-text">
            <span className="brand-name">INKFORGE</span>
            <span className="brand-sub">Fantasy Cartographer</span>
          </div>
        </div>

        <div className="title-input-wrapper">
          <input
            type="text"
            className="map-title-input"
            value={mapTitle}
            onChange={(e) => setMapTitle(e.target.value)}
            placeholder="Name your realm..."
          />
          <span className={`map-type-tag ${mapType}`}>
            {mapType === 'world' ? 'World & Regional' : 'Tactical Battlemap'}
          </span>
        </div>
      </div>

      {/* Preset Map Selector */}
      <div className="preset-selector-group">
        <label className="group-label">Template:</label>
        <select 
          className="select-styled"
          onChange={(e) => {
            if (e.target.value) onLoadPreset(e.target.value);
          }}
          defaultValue=""
        >
          <option value="" disabled>Load Map Preset...</option>
          {PRESET_MAPS.map(p => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.type === 'world' ? 'World' : 'Battlemap'})
            </option>
          ))}
        </select>
      </div>

      {/* History and Zoom Controls */}
      <div className="center-controls">
        <div className="btn-group">
          <button 
            className="btn-icon" 
            title="Undo (Ctrl+Z)" 
            disabled={!canUndo} 
            onClick={onUndo}
          >
            <Undo2 size={17} />
          </button>
          <button 
            className="btn-icon" 
            title="Redo (Ctrl+Y)" 
            disabled={!canRedo} 
            onClick={onRedo}
          >
            <Redo2 size={17} />
          </button>
        </div>

        <div className="divider-vert" />

        <div className="btn-group">
          <button 
            className="btn-icon" 
            title="Zoom Out" 
            onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}
          >
            <ZoomOut size={17} />
          </button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button 
            className="btn-icon" 
            title="Zoom In" 
            onClick={() => setZoom(z => Math.min(3.0, z + 0.15))}
          >
            <ZoomIn size={17} />
          </button>
          <button 
            className="btn-icon" 
            title="Fit to Canvas" 
            onClick={fitToScreen}
          >
            <Maximize2 size={17} />
          </button>
        </div>

        <div className="divider-vert" />

        {/* Grid quick toggle */}
        <button 
          className={`btn-icon ${gridEnabled ? 'active' : ''}`}
          title="Toggle Grid Overlay"
          onClick={() => setGridEnabled(v => !v)}
        >
          <GridIcon size={17} />
        </button>
      </div>

      {/* Action Buttons: Export & Save */}
      <div className="action-buttons">
        <button className="btn-ghost" onClick={onNewMap} title="Start fresh map">
          <FilePlus size={16} />
          <span>New</span>
        </button>

        <button 
          className="btn-ghost" 
          onClick={() => fileInputRef.current?.click()} 
          title="Load project file (.inkforge)"
        >
          <FolderOpen size={16} />
          <span>Open</span>
        </button>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".inkforge,.json" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />

        <button className="btn-ghost" onClick={onExportJson} title="Save editable project file">
          <Save size={16} />
          <span>Save</span>
        </button>

        <button className="btn-primary" onClick={onExportPng} title="Export pristine PNG image">
          <Download size={16} />
          <span>Export PNG</span>
        </button>
      </div>
    </header>
  );
}
