import React, { useRef } from 'react';

import { THEMES } from '../utils/theme';
import { MIN_ZOOM, MAX_ZOOM } from '../utils/quality';
import {
  Settings as SettingsIcon,
  Puzzle,
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
  LayoutGrid,
} from 'lucide-react';

export default function Header({
  mapTitle,
  setMapTitle,
  mapType,
  templateName,
  onHome,
  zoom,
  setZoom,
  fitToScreen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridEnabled,
  setGridEnabled,
  onExport,
  onExportJson,
  onImportJson,
  onNewMap,
  theme,
  setTheme,
  onOpenSettings,
  onOpenPlugins
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  const themeIndex = Math.max(0, THEMES.findIndex((t) => t.id === theme));
  const nextTheme = THEMES[(themeIndex + 1) % THEMES.length];

  return (
    <header className="header-bar">
      {/* Brand & Map Title */}
      <div className="brand-section">
        <button className="logo-badge home-btn" onClick={onHome} title="Main menu (Your maps)">
          <Compass className="brand-icon" size={24} />
          <div className="logo-text">
            <span className="brand-name">INKFORGE</span>
            <span className="brand-sub">Fantasy Cartographer</span>
          </div>
        </button>

        <div className="title-input-wrapper">
          <input
            type="text"
            className="map-title-input"
            value={mapTitle}
            onChange={(e) => setMapTitle(e.target.value)}
            placeholder="Name your realm..."
          />
          <span className={`map-type-tag ${mapType}`} title="The map core this map was created from">
            {templateName}
          </span>
        </div>
      </div>

      <button
        className="theme-toggle"
        onClick={() => setTheme(nextTheme.id)}
        title={`Theme: ${THEMES[themeIndex].name} (click for ${nextTheme.name}, more in Settings)`}
        aria-label="Switch theme"
      >
        {theme === 'dark' ? '☾' : theme === 'parchment' ? '☀' : '◉'}
      </button>
      <button className="theme-toggle" onClick={onOpenSettings} title="Settings: themes, keyboard shortcuts" aria-label="Settings">
        <SettingsIcon size={15} />
      </button>
      <button className="theme-toggle" onClick={onOpenPlugins} title="Plugins: lighting, river generation, weather, extra exports" aria-label="Plugins">
        <Puzzle size={15} />
      </button>

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
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))}
          >
            <ZoomOut size={17} />
          </button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button
            className="btn-icon"
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))}
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
        <button className="btn-ghost" onClick={onHome} title="Main menu: all your maps">
          <LayoutGrid size={16} />
          <span>Maps</span>
        </button>

        <button className="btn-ghost" onClick={onNewMap} title="New map: pick a template">
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

        <button className="btn-primary" onClick={onExport} title="Export image (PNG, WebP, JPG) or Universal VTT">
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
