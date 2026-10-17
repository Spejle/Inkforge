import React, { useState, useEffect } from 'react';
import { TOOLS } from './ToolBar';
import { PANEL_MIN, PANEL_MAX } from '../utils/layout';
import LayersPanel from './LayersPanel';
import ObjectsPanel from './ObjectsPanel';
import { GridTypePicker } from './PreviewPicker';
import { usePluginVersion } from '../plugins/registry';
import { STAMP_CATEGORIES, STAMPS } from '../engine/stampsCatalog';
import { useStampPrefs } from '../utils/stampPrefs';
import {
  Upload,
  Search,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Layers,
  Waves,
  Grid as GridIcon,
  Sun
} from 'lucide-react';

export default function StampDrawer({
  allowedCategories = null,
  templateName = '',
  isOpen,
  setIsOpen,
  activeStampId,
  setActiveStampId,
  customStamps = [],
  onOpenImport,
  layers,
  setLayers,
  activeLayer,
  setActiveLayer,
  onDeleteLayer,
  onMoveSelectionTo,
  hasSelection,
  objects,
  activeTool,
  toolOptions,
  layout,
  setLayout,
  gridConfig,
  setGridConfig,
  atmosphereConfig,
  setAtmosphereConfig,
  coastlineConfig,
  setCoastlineConfig
}) {
  usePluginVersion(); // repaint when plugin packs change (they edit STAMPS in place)
  const [activeTab, setActiveTab] = useState('tool'); // 'tool' (options of the active tool; the stamp library for the stamp tool) | 'fx' | 'objects'
  const tool = TOOLS.find((t) => t.id === activeTool);
  // Choosing a tool brings its options forward, opening the panel if it was collapsed
  useEffect(() => {
    setActiveTab('tool');
    if (activeTool !== 'hand') setIsOpen(true);
  }, [activeTool, setIsOpen]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  // The map core hides stamps that don't belong (a dungeon has no ships); "Show all" lifts that
  const filtering = !!allowedCategories && !showAll;
  const { builtin } = useStampPrefs();
  const pool = (filtering ? STAMPS.filter((st) => st.plugin || allowedCategories.includes(st.category)) : STAMPS).filter((st) => builtin || st.plugin);
  const cats = (filtering ? STAMP_CATEGORIES.filter((c) => c.type === 'plugin' || allowedCategories.includes(c.id)) : STAMP_CATEGORIES).filter((c) => builtin || c.type === 'plugin');

  const filteredStamps = (selectedCat === 'mine' ? [] : pool).filter((stamp) => {
    const matchesCat = selectedCat === 'all' || stamp.category === selectedCat;
    const matchesSearch = stamp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });
  // One tile per group (first member represents it); search shows every variant flat.
  const seenGroups = new Set();
  const tiles = searchQuery
    ? filteredStamps
    : filteredStamps.filter((st) => !st.group || (!seenGroups.has(st.group) && seenGroups.add(st.group)));
  const groupMembers = (g) => STAMPS.filter((st) => st.group === g);
  const [openGroup, setOpenGroup] = useState(null);
  const myStamps = customStamps.filter(
    (c) => (selectedCat === 'all' || selectedCat === 'mine') && c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`stamp-drawer ${isOpen ? 'open' : 'closed'}`}>
      {/* Toggle collapse button */}
      <button
        className="drawer-toggle-btn"
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? 'Collapse Sidebar' : 'Open Sidebar'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {isOpen && setLayout && (
        <div
          className="drawer-resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          title="Drag to resize the panel"
          onPointerDown={(e) => {
            e.preventDefault();
            const x0 = e.clientX, w0 = layout.panelWidth, dir = layout.panelSide === 'right' ? -1 : 1;
            const move = (ev) => setLayout((l) => ({ ...l, panelWidth: Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(w0 + dir * (ev.clientX - x0)))) }));
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
          }}
        />
      )}

      {isOpen && (
        <div className="drawer-content">
          {/* Top Sidebar Navigation Tabs */}
          <div className="drawer-nav-tabs">
            <button
              className={`drawer-tab-btn ${activeTab === 'tool' ? 'active' : ''}`}
              onClick={() => setActiveTab('tool')}
            >
              <Sparkles size={15} /> {activeTool === 'stamp' ? `Stamps (${pool.length})` : tool?.name || 'Tool'}
            </button>
            <button
              className={`drawer-tab-btn ${activeTab === 'fx' ? 'active' : ''}`}
              onClick={() => setActiveTab('fx')}
            >
              <Layers size={15} /> Layers & FX
            </button>
            <button
              className={`drawer-tab-btn ${activeTab === 'objects' ? 'active' : ''}`}
              onClick={() => setActiveTab('objects')}
            >
              Objects
            </button>
          </div>

          {activeTab === 'tool' && <div className={`tool-pane ${activeTool === 'stamp' ? 'compact' : ''}`}>{toolOptions}</div>}

          {activeTab === 'tool' && activeTool === 'stamp' && (
            <>
              <div className="drawer-header">
                <div className="flex-row items-center gap-2">
                  <h3 className="drawer-title">Stamp Library</h3>
                </div>
                <button
                  className="btn-upload-stamp"
                  onClick={onOpenImport}
                  title="Add your own PNG or SVG stamps"
                >
                  <Upload size={14} /> Add stamps
                </button>
              </div>

              {/* Search bar */}
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search mountains, castles, trees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {allowedCategories && (
                <button className={`filter-note ${showAll ? 'off' : ''}`} onClick={() => { setShowAll(!showAll); setSelectedCat('all'); }}
                  title={showAll ? 'Hide stamps that do not fit this map type' : 'Show every stamp, even ones that do not fit this map type'}>
                  {showAll ? 'Showing all stamps' : `Filtered for ${templateName}`} · <u>{showAll ? 'filter' : 'show all'}</u>
                </button>
              )}

              {/* Category Tabs */}
              <div className="category-chips">
                <button
                  className={`chip ${selectedCat === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCat('all')}
                >
                  All ({pool.length})
                </button>
                {customStamps.length > 0 && (
                  <button
                    className={`chip ${selectedCat === 'mine' ? 'active' : ''}`}
                    onClick={() => setSelectedCat('mine')}
                  >
                    My stamps ({customStamps.length})
                  </button>
                )}
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    className={`chip ${selectedCat === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCat(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Stamp Grid */}
              <div className="stamp-grid">
                {myStamps.map((c) => (
                  <div
                    key={c.id}
                    className={`stamp-card ${activeStampId === c.id ? 'selected' : ''}`}
                    onClick={() => setActiveStampId(c.id)}
                    title={`${c.name} · ${c.pack} · ${c.license}`}
                  >
                    <div className="stamp-preview-canvas-box">
                      <img src={c.dataUrl} alt="" className="thumbnail-canvas" style={{ objectFit: 'contain' }} />
                    </div>
                    <span className="stamp-name-caption">{c.name}</span>
                  </div>
                ))}
                {tiles.map((stamp) => {
                  const members = !searchQuery && stamp.group ? groupMembers(stamp.group) : [];
                  const isGroup = members.length > 1;
                  const isSelected = isGroup ? members.some((m) => m.id === activeStampId) : activeStampId === stamp.id;
                  const shown = isGroup && isSelected ? members.find((m) => m.id === activeStampId) : stamp;

                  return (
                    <React.Fragment key={stamp.id}>
                      <div
                        className={`stamp-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setActiveStampId(isSelected ? activeStampId : stamp.id);
                          setOpenGroup(isGroup && openGroup !== stamp.group ? stamp.group : null);
                        }}
                        title={isGroup ? `${stamp.groupName || stamp.name}\n${members.length} variants. Click to choose one.` : `Select ${stamp.name}`}
                      >
                        <div className="stamp-preview-canvas-box">
                          <StampThumbnail stamp={shown} />
                          {isGroup && <span className="stamp-group-badge">{members.length}</span>}
                        </div>
                        <span className="stamp-name-caption">{isGroup ? stamp.groupName || stamp.name : stamp.name}</span>
                      </div>
                      {isGroup && openGroup === stamp.group && (
                        <div className="stamp-variants">
                          {members.map((m) => {
                            // the original art of a directional stamp has no suffix in its name; new views already do
                            const label = m.view && !/\([^)]+\)$/.test(m.name) ? `${m.name} (${m.view[0].toUpperCase()}${m.view.slice(1)})` : m.name;
                            return (
                            <div
                              key={m.id}
                              className={`stamp-card small ${activeStampId === m.id ? 'selected' : ''}`}
                              onClick={() => setActiveStampId(m.id)}
                              title={label}
                            >
                              <div className="stamp-preview-canvas-box"><StampThumbnail stamp={m} /></div>
                              <span className="stamp-name-caption">{label}</span>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'objects' && objects && <div className="layers-fx-panel"><ObjectsPanel layers={layers} {...objects} /></div>}

          {activeTab === 'fx' && (
            <div className="layers-fx-panel">
              {layers && (
                <LayersPanel layers={layers} setLayers={setLayers} atmosphere={atmosphereConfig} setAtmosphere={setAtmosphereConfig} activeLayer={activeLayer} setActiveLayer={setActiveLayer} onDeleteLayer={onDeleteLayer} onMoveSelectionTo={onMoveSelectionTo} hasSelection={hasSelection} />
              )}
              {/* Atmosphere Card */}
              {atmosphereConfig && setAtmosphereConfig && (
                <div className="fx-card">
                  <div className="fx-card-header">
                    <Sun size={16} className="text-amber-400" />
                    <h4>Atmospheric Filter Shader</h4>
                  </div>
                  <div className="fx-card-content">
                    <label className="fx-slider-label">
                      <span>Vignette Edge Shading</span>
                      <span className="val-badge">{Math.round((atmosphereConfig.vignette || 0) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={atmosphereConfig.vignette || 0}
                      onChange={(e) => setAtmosphereConfig((p) => ({ ...p, vignette: parseFloat(e.target.value) }))}
                    />

                    <label className="fx-slider-label mt-2">
                      <span>Parchment Paper Texture</span>
                      <span className="val-badge">{Math.round((atmosphereConfig.parchmentGrain || 0) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={atmosphereConfig.parchmentGrain || 0}
                      onChange={(e) => setAtmosphereConfig((p) => ({ ...p, parchmentGrain: parseFloat(e.target.value) }))}
                    />

                    <label className="fx-slider-label mt-2">
                      <span>Sepia Warmth Tone</span>
                      <span className="val-badge">{Math.round((atmosphereConfig.sepia || 0) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={atmosphereConfig.sepia || 0}
                      onChange={(e) => setAtmosphereConfig((p) => ({ ...p, sepia: parseFloat(e.target.value) }))}
                    />

                    <label className="fx-slider-label mt-2">
                      <span>Overall Canvas Brightness</span>
                      <span className="val-badge">{Math.round((atmosphereConfig.brightness ?? 1.0) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={atmosphereConfig.brightness ?? 1.0}
                      onChange={(e) => setAtmosphereConfig((p) => ({ ...p, brightness: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              {/* Coastlines Card */}
              {coastlineConfig && setCoastlineConfig && (
                <div className="fx-card">
                  <div className="fx-card-header">
                    <Waves size={16} className="text-cyan-400" />
                    <h4>Coastline & Shallow Sea</h4>
                  </div>
                  <div className="fx-card-content">
                    <label className="checkbox-label font-medium">
                      <input
                        type="checkbox"
                        checked={coastlineConfig.ripplesEnabled}
                        onChange={(e) => setCoastlineConfig((p) => ({ ...p, ripplesEnabled: e.target.checked }))}
                      />
                      Water Ripple Lines ({coastlineConfig.rippleCount || 3} waves)
                    </label>

                    {coastlineConfig.ripplesEnabled && (
                      <div className="sub-controls">
                        <label className="fx-slider-label">
                          <span>Wave Spacing</span>
                          <span className="val-badge">{coastlineConfig.rippleSpacing || 9}px</span>
                        </label>
                        <input
                          type="range"
                          min="4"
                          max="24"
                          value={coastlineConfig.rippleSpacing || 9}
                          onChange={(e) => setCoastlineConfig((p) => ({ ...p, rippleSpacing: parseInt(e.target.value) }))}
                        />

                        <label className="fx-slider-label mt-2">
                          <span>Wave Opacity</span>
                          <span className="val-badge">{Math.round((coastlineConfig.rippleOpacity ?? 0.28) * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={coastlineConfig.rippleOpacity ?? 0.28}
                          onChange={(e) => setCoastlineConfig((p) => ({ ...p, rippleOpacity: parseFloat(e.target.value) }))}
                        />
                      </div>
                    )}

                    <label className="checkbox-label font-medium mt-3">
                      <input
                        type="checkbox"
                        checked={coastlineConfig.sandEnabled}
                        onChange={(e) => setCoastlineConfig((p) => ({ ...p, sandEnabled: e.target.checked }))}
                      />
                      Beach Sand Fringe
                    </label>

                    <label className="checkbox-label font-medium mt-2">
                      <input
                        type="checkbox"
                        checked={coastlineConfig.shadowEnabled}
                        onChange={(e) => setCoastlineConfig((p) => ({ ...p, shadowEnabled: e.target.checked }))}
                      />
                      Deep Sea Continental Drop Shadow
                    </label>
                  </div>
                </div>
              )}

              {/* Grid Card */}
              {gridConfig && setGridConfig && (
                <div className="fx-card">
                  <div className="fx-card-header">
                    <GridIcon size={16} className="text-emerald-400" />
                    <h4>Tactical Battle Grid</h4>
                  </div>
                  <div className="fx-card-content">
                    <label className="checkbox-label font-medium">
                      <input
                        type="checkbox"
                        checked={gridConfig.enabled}
                        onChange={(e) => setGridConfig((p) => ({ ...p, enabled: e.target.checked }))}
                      />
                      Visible Grid Overlay
                    </label>

                    <GridTypePicker value={gridConfig.type} onChange={(v) => setGridConfig((p) => ({ ...p, type: v }))} />

                    <label className="checkbox-label font-medium mt-3">
                      <input
                        type="checkbox"
                        checked={gridConfig.snap}
                        onChange={(e) => setGridConfig((p) => ({ ...p, snap: e.target.checked }))}
                      />
                      Snap Stamps & Tokens to Cells
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

// Renders a miniature preview of the vector stamp with proper aspect fitting
function StampThumbnail({ stamp }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 72, 72);

    if (stamp.render) {
      const aspect = stamp.aspect || 1.0;
      const targetW = aspect >= 1 ? 60 : 60 * aspect;
      const targetH = aspect >= 1 ? 60 / aspect : 60;
      const scale = targetH / 72;

      ctx.save();
      ctx.translate((72 - targetW) / 2, (72 - targetH) / 2);
      ctx.scale(scale, scale);
      stamp.render(ctx, 72);
      ctx.restore();
    }
  }, [stamp]);

  return <canvas ref={canvasRef} width={72} height={72} className="thumbnail-canvas" />;
}
