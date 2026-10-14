import React, { useState } from 'react';
import LayersPanel from './LayersPanel';
import { STAMP_CATEGORIES, STAMPS } from '../engine/stampsCatalog';
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
  gridConfig,
  setGridConfig,
  atmosphereConfig,
  setAtmosphereConfig,
  coastlineConfig,
  setCoastlineConfig
}) {
  const [activeTab, setActiveTab] = useState('stamps'); // 'stamps' | 'fx'
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStamps = (selectedCat === 'mine' ? [] : STAMPS).filter((stamp) => {
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

      {isOpen && (
        <div className="drawer-content">
          {/* Top Sidebar Navigation Tabs */}
          <div className="drawer-nav-tabs">
            <button
              className={`drawer-tab-btn ${activeTab === 'stamps' ? 'active' : ''}`}
              onClick={() => setActiveTab('stamps')}
            >
              <Sparkles size={15} /> Stamps ({STAMPS.length})
            </button>
            <button
              className={`drawer-tab-btn ${activeTab === 'fx' ? 'active' : ''}`}
              onClick={() => setActiveTab('fx')}
            >
              <Layers size={15} /> Layers & FX
            </button>
          </div>

          {activeTab === 'stamps' && (
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

              {/* Category Tabs */}
              <div className="category-chips">
                <button
                  className={`chip ${selectedCat === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCat('all')}
                >
                  All ({STAMPS.length})
                </button>
                {customStamps.length > 0 && (
                  <button
                    className={`chip ${selectedCat === 'mine' ? 'active' : ''}`}
                    onClick={() => setSelectedCat('mine')}
                  >
                    My stamps ({customStamps.length})
                  </button>
                )}
                {STAMP_CATEGORIES.map((cat) => (
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
                          {members.map((m) => (
                            <div
                              key={m.id}
                              className={`stamp-card small ${activeStampId === m.id ? 'selected' : ''}`}
                              onClick={() => setActiveStampId(m.id)}
                              title={m.name}
                            >
                              <div className="stamp-preview-canvas-box"><StampThumbnail stamp={m} /></div>
                              <span className="stamp-name-caption">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}

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

                    <select
                      className="select-input mt-2"
                      style={{ width: '100%' }}
                      value={gridConfig.type}
                      onChange={(e) => setGridConfig((p) => ({ ...p, type: e.target.value }))}
                    >
                      <option value="square">Square Grid (5ft DnD / Pathfinder)</option>
                      <option value="hex_flat">Flat-Topped Hex</option>
                      <option value="hex_pointy">Pointy-Topped Hex</option>
                      <option value="isometric">Isometric Diamond Grid</option>
                    </select>

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
