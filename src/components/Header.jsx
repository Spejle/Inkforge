import React, { useState, useRef } from 'react';
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
  FilePlus,
  ChevronDown
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
  onExportHighRes,
  onExportVtt,
  onExportJson,
  onImportJson,
  onLoadPreset,
  onNewMap
}) {
  const fileInputRef = useRef(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [includeGridInExport, setIncludeGridInExport] = useState(true);

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
          <button
            className={`map-type-tag ${mapType}`}
            onClick={() => setMapType(mapType === 'world' ? 'battle' : 'world')}
            title="Click to toggle between World Cartography and Tactical Battlemap mode"
          >
            {mapType === 'world' ? 'World Cartography' : 'Tactical Battlemap'}
          </button>
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
          {PRESET_MAPS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.type === 'world' ? 'World' : 'Battle'})
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
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
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
            onClick={() => setZoom((z) => Math.max(0.15, z - 0.15))}
          >
            <ZoomOut size={17} />
          </button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button
            className="btn-icon"
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(3.5, z + 0.15))}
          >
            <ZoomIn size={17} />
          </button>
          <button
            className="btn-icon"
            title="Fit to Screen"
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
          onClick={() => setGridEnabled((v) => !v)}
        >
          <GridIcon size={17} />
        </button>
      </div>

      {/* Action Buttons: Export & Save */}
      <div className="action-buttons">
        <button className="btn-ghost" onClick={onNewMap} title="Start fresh blank canvas">
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

        <button className="btn-ghost" onClick={onExportJson} title="Save editable project file (.inkforge)">
          <Save size={16} />
          <span>Save</span>
        </button>

        {/* Export dropdown menu */}
        <div className="export-menu-container" style={{ position: 'relative' }}>
          <button
            className="btn-primary"
            onClick={() => setShowExportMenu((v) => !v)}
            title="Export map image or VTT package"
          >
            <Download size={16} />
            <span>Export</span>
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <div
              className="export-dropdown-menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '8px',
                minWidth: '220px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  padding: '4px 8px',
                  borderBottom: '1px solid #334155',
                  marginBottom: '4px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={includeGridInExport}
                  onChange={(e) => setIncludeGridInExport(e.target.checked)}
                />
                Include Grid in Export
              </label>

              <button
                className="dropdown-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  padding: '8px 10px',
                  textAlign: 'left',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => {
                  setShowExportMenu(false);
                  onExportPng(includeGridInExport);
                }}
              >
                Standard PNG (1080p)
              </button>

              <button
                className="dropdown-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  padding: '8px 10px',
                  textAlign: 'left',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => {
                  setShowExportMenu(false);
                  onExportHighRes(2, includeGridInExport);
                }}
              >
                Ultra-HD 4K (2x Res)
              </button>

              <button
                className="dropdown-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  padding: '8px 10px',
                  textAlign: 'left',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => {
                  setShowExportMenu(false);
                  onExportHighRes(4, includeGridInExport);
                }}
              >
                Print Quality 8K (4x Res)
              </button>

              <div style={{ height: '1px', background: '#334155', margin: '4px 0' }} />

              <button
                className="dropdown-item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  padding: '8px 10px',
                  textAlign: 'left',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => {
                  setShowExportMenu(false);
                  onExportVtt();
                }}
                title="Universal VTT file for Foundry VTT and Roll20 with wall LoS"
              >
                Universal VTT (.dd2vtt)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
