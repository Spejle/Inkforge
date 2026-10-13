import React from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Copy, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  RotateCw, 
  Sparkles,
  Shuffle,
  SplitSquareVertical,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';
import { BIOMES } from '../engine/biomesCatalog';
import { getStampById } from '../engine/stampsCatalog';

export default function ToolOptions({
  activeTool,
  // Mask options
  maskMode,
  setMaskMode,
  brushSize,
  setBrushSize,
  // Biome brush options
  activeBiome,
  setActiveBiome,
  brushOpacity,
  setBrushOpacity,
  // Stamp options
  activeStampId,
  stampScale,
  setStampScale,
  stampRotation,
  setStampRotation,
  stampJitter,
  setStampJitter,
  stampSpray,
  setStampSpray,
  onFlipStamp,
  // Path options
  pathType,
  setPathType,
  pathWidth,
  setPathWidth,
  pathDashed,
  setPathDashed,
  pathColor,
  setPathColor,
  // Text options
  newTextContent,
  setNewTextContent,
  textFont,
  setTextFont,
  textSize,
  setTextSize,
  textColor,
  setTextColor,
  textStroke,
  setTextStroke,
  onAddText,
  // Grid options
  gridConfig,
  setGridConfig,
  // Atmosphere options
  atmosphereConfig,
  setAtmosphereConfig,
  // Select tool actions
  selectedStamp,
  selectedText,
  onDeleteSelected,
  onDuplicateSelected,
  onBringToFront,
  onSendToBack
}) {
  const activeStampDef = getStampById(activeStampId);

  return (
    <div className="tool-options-ribbon">
      {/* 1. SELECT TOOL OPTIONS */}
      {activeTool === 'select' && (
        <div className="options-segment">
          <span className="segment-label">Selection:</span>
          {selectedStamp ? (
            <div className="flex-row gap-2 items-center">
              <span className="selected-tag">{getStampById(selectedStamp.stampId)?.name || 'Stamp'}</span>
              <button className="btn-small" onClick={onBringToFront} title="Bring to Front">
                <ArrowUpToLine size={14} /> Front
              </button>
              <button className="btn-small" onClick={onSendToBack} title="Send to Back">
                <ArrowDownToLine size={14} /> Back
              </button>
              <button className="btn-small" onClick={onDuplicateSelected} title="Duplicate Selected">
                <Copy size={14} /> Duplicate
              </button>
              <button className="btn-small danger" onClick={onDeleteSelected} title="Delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ) : selectedText ? (
            <div className="flex-row gap-2 items-center">
              <span className="selected-tag">Label: "{selectedText.text}"</span>
              <button className="btn-small danger" onClick={onDeleteSelected} title="Delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ) : (
            <span className="hint-text">Click on any stamp or text label on the canvas to move, scale, or edit it.</span>
          )}
        </div>
      )}

      {/* 2. MASK / LANDMASS SCULPTOR */}
      {activeTool === 'mask' && (
        <div className="options-segment">
          <div className="segmented-toggle">
            <button
              className={`toggle-opt ${maskMode === 'land' ? 'active' : ''}`}
              onClick={() => setMaskMode('land')}
            >
              Add Landmass
            </button>
            <button
              className={`toggle-opt ${maskMode === 'water' ? 'active' : ''}`}
              onClick={() => setMaskMode('water')}
            >
              Carve Ocean
            </button>
          </div>

          <div className="divider-vert" />

          <div className="slider-group">
            <label>Brush Size: {brushSize}px</label>
            <input
              type="range"
              min="20"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>

          <span className="hint-text">Drag across the canvas to sculpt coastlines and islands.</span>
        </div>
      )}

      {/* 3. BIOME & TEXTURE BRUSH */}
      {activeTool === 'brush' && (
        <div className="options-segment">
          <label className="segment-label">Biome:</label>
          <div className="biome-swatches">
            {BIOMES.map((b) => (
              <button
                key={b.id}
                className={`biome-swatch-btn ${activeBiome === b.id ? 'active' : ''}`}
                style={{ backgroundColor: b.preview }}
                title={`${b.name} (${b.category}): ${b.description}`}
                onClick={() => setActiveBiome(b.id)}
              >
                <span className="swatch-label">{b.name}</span>
              </button>
            ))}
          </div>

          <div className="divider-vert" />

          <div className="slider-group">
            <label>Size: {brushSize}px</label>
            <input
              type="range"
              min="20"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <label>Opacity: {Math.round(brushOpacity * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* 4. STAMPS & PROPS */}
      {activeTool === 'stamp' && (
        <div className="options-segment">
          <div className="active-stamp-badge">
            <span className="stamp-name-highlight">{activeStampDef?.name || 'Active Stamp'}</span>
          </div>

          <div className="slider-group">
            <label>Scale: {Math.round(stampScale * 100)}%</label>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.05"
              value={stampScale}
              onChange={(e) => setStampScale(Number(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <label>Rotation: {Math.round((stampRotation * 180) / Math.PI)}°</label>
            <input
              type="range"
              min="-3.14"
              max="3.14"
              step="0.05"
              value={stampRotation}
              onChange={(e) => setStampRotation(Number(e.target.value))}
            />
          </div>

          <div className="divider-vert" />

          <button
            className={`btn-toggle ${stampJitter ? 'active' : ''}`}
            onClick={() => setStampJitter(v => !v)}
            title="Adds slight natural random variation to scale & angle when placing clusters"
          >
            <Shuffle size={14} /> Jitter Variation
          </button>

          <button
            className={`btn-toggle ${stampSpray ? 'active' : ''}`}
            onClick={() => setStampSpray(v => !v)}
            title="Spray mode: drag mouse continuously to plant forests and mountain chains"
          >
            <Sparkles size={14} /> Continuous Spray
          </button>

          <div className="btn-group">
            <button className="btn-icon-sm" onClick={() => onFlipStamp('x')} title="Flip Horizontal">
              <FlipHorizontal size={14} />
            </button>
            <button className="btn-icon-sm" onClick={() => onFlipStamp('y')} title="Flip Vertical">
              <FlipVertical size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 5. PATHS & RIVERS */}
      {activeTool === 'path' && (
        <div className="options-segment">
          <label className="segment-label">Path Type:</label>
          <div className="segmented-toggle">
            <button
              className={`toggle-opt ${pathType === 'river' ? 'active' : ''}`}
              onClick={() => { setPathType('river'); setPathColor('#2563eb'); }}
            >
              River
            </button>
            <button
              className={`toggle-opt ${pathType === 'road' ? 'active' : ''}`}
              onClick={() => { setPathType('road'); setPathColor('#78350f'); }}
            >
              Road
            </button>
            <button
              className={`toggle-opt ${pathType === 'wall' ? 'active' : ''}`}
              onClick={() => { setPathType('wall'); setPathColor('#475569'); }}
            >
              Stone Wall
            </button>
          </div>

          <div className="slider-group">
            <label>Width: {pathWidth}px</label>
            <input
              type="range"
              min="4"
              max="40"
              value={pathWidth}
              onChange={(e) => setPathWidth(Number(e.target.value))}
            />
          </div>

          {pathType === 'road' && (
            <button
              className={`btn-toggle ${pathDashed ? 'active' : ''}`}
              onClick={() => setPathDashed(v => !v)}
            >
              Dashed Trail
            </button>
          )}

          <div className="color-picker-group">
            <label>Color:</label>
            <input
              type="color"
              value={pathColor}
              onChange={(e) => setPathColor(e.target.value)}
            />
          </div>

          <span className="hint-text">Click and drag on the canvas to carve flowing paths.</span>
        </div>
      )}

      {/* 6. TEXT & BANNERS */}
      {activeTool === 'text' && (
        <div className="options-segment">
          <div className="text-input-group">
            <input
              type="text"
              placeholder="Enter realm or tavern name..."
              value={newTextContent}
              onChange={(e) => setNewTextContent(e.target.value)}
              className="text-input"
            />
            <button className="btn-small primary" onClick={onAddText}>
              <Plus size={14} /> Add Label
            </button>
          </div>

          <div className="divider-vert" />

          <div className="select-group">
            <label>Font:</label>
            <select
              value={textFont}
              onChange={(e) => setTextFont(e.target.value)}
              className="select-styled-sm"
            >
              <option value="Cinzel">Cinzel (Regal Fantasy)</option>
              <option value="MedievalSharp">MedievalSharp (Gothic)</option>
              <option value="Pirata One">Pirata One (Pirate / Sea)</option>
              <option value="Uncial Antiqua">Uncial Antiqua (Ancient)</option>
            </select>
          </div>

          <div className="slider-group">
            <label>Size: {textSize}px</label>
            <input
              type="range"
              min="14"
              max="72"
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
            />
          </div>

          <div className="color-picker-group">
            <label>Text:</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
            <label>Outline:</label>
            <input
              type="color"
              value={textStroke}
              onChange={(e) => setTextStroke(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 7. GRID SETTINGS */}
      {activeTool === 'grid' && (
        <div className="options-segment">
          <div className="segmented-toggle">
            <button
              className={`toggle-opt ${gridConfig.type === 'hex_flat' ? 'active' : ''}`}
              onClick={() => setGridConfig(g => ({ ...g, type: 'hex_flat' }))}
            >
              Hex (Flat)
            </button>
            <button
              className={`toggle-opt ${gridConfig.type === 'square' ? 'active' : ''}`}
              onClick={() => setGridConfig(g => ({ ...g, type: 'square' }))}
            >
              Square Grid
            </button>
          </div>

          <div className="slider-group">
            <label>Cell Size: {gridConfig.size}px</label>
            <input
              type="range"
              min="30"
              max="120"
              value={gridConfig.size}
              onChange={(e) => setGridConfig(g => ({ ...g, size: Number(e.target.value) }))}
            />
          </div>

          <div className="slider-group">
            <label>Opacity: {Math.round(gridConfig.opacity * 100)}%</label>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={gridConfig.opacity}
              onChange={(e) => setGridConfig(g => ({ ...g, opacity: Number(e.target.value) }))}
            />
          </div>

          <div className="color-picker-group">
            <label>Grid Color:</label>
            <input
              type="color"
              value={gridConfig.color}
              onChange={(e) => setGridConfig(g => ({ ...g, color: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* 8. ATMOSPHERE & LIGHTING */}
      {activeTool === 'atmosphere' && (
        <div className="options-segment">
          <div className="slider-group">
            <label>Vignette Shadow: {Math.round(atmosphereConfig.vignette * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={atmosphereConfig.vignette}
              onChange={(e) => setAtmosphereConfig(a => ({ ...a, vignette: Number(e.target.value) }))}
            />
          </div>

          <div className="slider-group">
            <label>Parchment Sepia: {Math.round(atmosphereConfig.sepia * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={atmosphereConfig.sepia}
              onChange={(e) => setAtmosphereConfig(a => ({ ...a, sepia: Number(e.target.value) }))}
            />
          </div>
        </div>
      )}

      {/* 9. PAN CANVAS */}
      {activeTool === 'hand' && (
        <div className="options-segment">
          <span className="hint-text">Click and drag to pan across your map. Tip: You can also hold Spacebar at any time!</span>
        </div>
      )}
    </div>
  );
}
