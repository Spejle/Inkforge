import React, { useState } from 'react';
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
  onUploadCustomStamp,
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
  const fileInputRef = React.useRef(null);

  const filteredStamps = STAMPS.filter((stamp) => {
    const matchesCat = selectedCat === 'all' || stamp.category === selectedCat;
    const matchesSearch = stamp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCustomUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        const img = new Image();
        img.onload = () => {
          onUploadCustomStamp(img, file.name, dataUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

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
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload your own PNG or SVG stamp"
                >
                  <Upload size={14} /> Import PNG
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  style={{ display: 'none' }}
                  onChange={handleCustomUpload}
                />
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
                {filteredStamps.map((stamp) => {
                  const isSelected = activeStampId === stamp.id;

                  return (
                    <div
                      key={stamp.id}
                      className={`stamp-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setActiveStampId(stamp.id)}
                      title={`Select ${stamp.name}`}
                    >
                      <div className="stamp-preview-canvas-box">
                        <StampThumbnail stamp={stamp} />
                      </div>
                      <span className="stamp-name-caption">{stamp.name}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'fx' && (
            <div className="layers-fx-panel">
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
