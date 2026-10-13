import React from 'react';
import {
  Trash2,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  Sparkles,
  Shuffle,
  FlipHorizontal,
  FlipVertical,
  Magnet,
  Type as TypeIcon
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
  textCurvature,
  setTextCurvature,
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
  // Selection actions
  selectedStamp,
  selectedText,
  selectedPath,
  onUpdateSelectedStamp,
  onUpdateSelectedText,
  onUpdateSelectedPath,
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
          {selectedStamp && (
            <div className="flex-row gap-3 items-center">
              <span className="selected-tag">{getStampById(selectedStamp.stampId)?.name || 'Stamp'}</span>
              
              <label className="option-label">
                Scale: {Math.round((selectedStamp.scale || 1.0) * 100)}%
                <input
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.05"
                  value={selectedStamp.scale || 1.0}
                  onChange={(e) => onUpdateSelectedStamp?.({ scale: parseFloat(e.target.value) })}
                />
              </label>

              <label className="option-label">
                Rot: {Math.round(((selectedStamp.rotation || 0) * 180) / Math.PI)}°
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.05"
                  value={selectedStamp.rotation || 0}
                  onChange={(e) => onUpdateSelectedStamp?.({ rotation: parseFloat(e.target.value) })}
                />
              </label>

              <button
                className="btn-small"
                onClick={() => onUpdateSelectedStamp?.({ flipX: !selectedStamp.flipX })}
                title="Flip Horizontally"
              >
                <FlipHorizontal size={14} /> Flip X
              </button>

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
          )}

          {selectedText && (
            <div className="flex-row gap-3 items-center">
              <span className="selected-tag">Label</span>
              <input
                type="text"
                className="text-input"
                style={{ width: '160px' }}
                value={selectedText.text || ''}
                onChange={(e) => onUpdateSelectedText?.({ text: e.target.value })}
              />

              <select
                className="select-input"
                value={selectedText.font || 'Cinzel'}
                onChange={(e) => onUpdateSelectedText?.({ font: e.target.value })}
              >
                <option value="Cinzel">Cinzel (Regal)</option>
                <option value="MedievalSharp">MedievalSharp</option>
                <option value="Pirata One">Pirata One (Gothic)</option>
                <option value="Uncial Antiqua">Uncial Antiqua</option>
                <option value="Inter">Inter (Sans)</option>
              </select>

              <label className="option-label">
                Size: {selectedText.size || 28}px
                <input
                  type="range"
                  min="14"
                  max="96"
                  value={selectedText.size || 28}
                  onChange={(e) => onUpdateSelectedText?.({ size: parseInt(e.target.value) })}
                />
              </label>

              <label className="option-label">
                Arc: {Math.round((selectedText.curvature || 0) * 100)}%
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={selectedText.curvature || 0}
                  onChange={(e) => onUpdateSelectedText?.({ curvature: parseFloat(e.target.value) })}
                />
              </label>

              <label className="color-picker-label" title="Text Color">
                <input
                  type="color"
                  value={selectedText.color || '#271b12'}
                  onChange={(e) => onUpdateSelectedText?.({ color: e.target.value })}
                />
              </label>

              <button className="btn-small danger" onClick={onDeleteSelected} title="Delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}

          {selectedPath && (
            <div className="flex-row gap-3 items-center">
              <span className="selected-tag">{selectedPath.type.toUpperCase()}</span>
              <label className="option-label">
                Width: {selectedPath.width || 12}px
                <input
                  type="range"
                  min="4"
                  max="60"
                  value={selectedPath.width || 12}
                  onChange={(e) => onUpdateSelectedPath?.({ width: parseInt(e.target.value) })}
                />
              </label>
              <label className="color-picker-label" title="Path Color">
                <input
                  type="color"
                  value={selectedPath.color || '#3b82f6'}
                  onChange={(e) => onUpdateSelectedPath?.({ color: e.target.value })}
                />
              </label>
              <button className="btn-small danger" onClick={onDeleteSelected} title="Delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}

          {!selectedStamp && !selectedText && !selectedPath && (
            <span className="hint-text">Click any stamp, label, or river to inspect and transform</span>
          )}
        </div>
      )}

      {/* 2. MASK TOOL OPTIONS */}
      {activeTool === 'mask' && (
        <div className="options-segment">
          <span className="segment-label">Sculpt Mode:</span>
          <div className="btn-group">
            <button
              className={`btn-toggle ${maskMode === 'land' ? 'active green' : ''}`}
              onClick={() => setMaskMode('land')}
              title="Paint continents and islands"
            >
              Add Land
            </button>
            <button
              className={`btn-toggle ${maskMode === 'water' ? 'active blue' : ''}`}
              onClick={() => setMaskMode('water')}
              title="Carve ocean, lakes, and fjords"
            >
              Carve Water
            </button>
          </div>

          <label className="option-label">
            Brush Size: {brushSize}px
            <input
              type="range"
              min="15"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </label>

          <label className="option-label">
            Flow: {Math.round(brushOpacity * 100)}%
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}

      {/* 3. BIOME BRUSH OPTIONS */}
      {activeTool === 'brush' && (
        <div className="options-segment">
          <span className="segment-label">Biome:</span>
          <select
            className="select-input"
            value={activeBiome}
            onChange={(e) => setActiveBiome(e.target.value)}
          >
            {BIOMES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <label className="option-label">
            Size: {brushSize}px
            <input
              type="range"
              min="15"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </label>

          <label className="option-label">
            Opacity: {Math.round(brushOpacity * 100)}%
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}

      {/* 4. STAMP TOOL OPTIONS */}
      {activeTool === 'stamp' && (
        <div className="options-segment">
          <span className="segment-label">Active:</span>
          <span className="selected-tag">{activeStampDef?.name || 'Stamp'}</span>

          <label className="option-label">
            Scale: {Math.round(stampScale * 100)}%
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.05"
              value={stampScale}
              onChange={(e) => setStampScale(parseFloat(e.target.value))}
            />
          </label>

          <label className="option-label">
            Rot: {Math.round((stampRotation * 180) / Math.PI)}°
            <input
              type="range"
              min="-3.14"
              max="3.14"
              step="0.05"
              value={stampRotation}
              onChange={(e) => setStampRotation(parseFloat(e.target.value))}
            />
          </label>

          <button
            className={`btn-toggle ${stampJitter ? 'active' : ''}`}
            onClick={() => setStampJitter(!stampJitter)}
            title="Randomize size and rotation for natural clusters"
          >
            <Shuffle size={14} /> Jitter
          </button>

          <button
            className={`btn-toggle ${stampSpray ? 'active amber' : ''}`}
            onClick={() => setStampSpray(!stampSpray)}
            title="Continuous drag painting for dense mountain chains and forests"
          >
            <Sparkles size={14} /> Spray Mode
          </button>

          <div className="btn-group">
            <button className="btn-small" onClick={() => onFlipStamp('x')} title="Flip Horizontal">
              <FlipHorizontal size={14} />
            </button>
            <button className="btn-small" onClick={() => onFlipStamp('y')} title="Flip Vertical">
              <FlipVertical size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 5. PATH TOOL OPTIONS */}
      {activeTool === 'path' && (
        <div className="options-segment">
          <span className="segment-label">Path Type:</span>
          <div className="btn-group">
            <button
              className={`btn-toggle ${pathType === 'river' ? 'active' : ''}`}
              onClick={() => {
                setPathType('river');
                setPathColor('#2563eb');
                setPathWidth(12);
              }}
            >
              River
            </button>
            <button
              className={`btn-toggle ${pathType === 'road' ? 'active' : ''}`}
              onClick={() => {
                setPathType('road');
                setPathColor('#78350f');
                setPathWidth(6);
              }}
            >
              Road
            </button>
            <button
              className={`btn-toggle ${pathType === 'wall' ? 'active' : ''}`}
              onClick={() => {
                setPathType('wall');
                setPathColor('#475569');
                setPathWidth(14);
              }}
            >
              Wall
            </button>
          </div>

          <label className="option-label">
            Width: {pathWidth}px
            <input
              type="range"
              min="4"
              max="40"
              value={pathWidth}
              onChange={(e) => setPathWidth(parseInt(e.target.value))}
            />
          </label>

          {pathType === 'road' && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={pathDashed}
                onChange={(e) => setPathDashed(e.target.checked)}
              />
              Dashed Trail
            </label>
          )}

          <label className="color-picker-label" title="Path Color">
            <input
              type="color"
              value={pathColor}
              onChange={(e) => setPathColor(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* 6. TEXT TOOL OPTIONS */}
      {activeTool === 'text' && (
        <div className="options-segment">
          <input
            type="text"
            className="text-input"
            placeholder="Kingdom, Sea, or Dungeon Title..."
            value={newTextContent}
            onChange={(e) => setNewTextContent(e.target.value)}
          />

          <select
            className="select-input"
            value={textFont}
            onChange={(e) => setTextFont(e.target.value)}
          >
            <option value="Cinzel">Cinzel (Regal)</option>
            <option value="MedievalSharp">MedievalSharp</option>
            <option value="Pirata One">Pirata One (Gothic)</option>
            <option value="Uncial Antiqua">Uncial Antiqua</option>
            <option value="Inter">Inter (Sans)</option>
          </select>

          <label className="option-label">
            Size: {textSize}px
            <input
              type="range"
              min="16"
              max="80"
              value={textSize}
              onChange={(e) => setTextSize(parseInt(e.target.value))}
            />
          </label>

          <label className="option-label">
            Arc: {Math.round((textCurvature || 0) * 100)}%
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.05"
              value={textCurvature || 0}
              onChange={(e) => setTextCurvature?.(parseFloat(e.target.value))}
            />
          </label>

          <label className="color-picker-label" title="Fill Color">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </label>

          <label className="color-picker-label" title="Stroke Outline">
            <input
              type="color"
              value={textStroke}
              onChange={(e) => setTextStroke(e.target.value)}
            />
          </label>

          <button className="btn-primary" onClick={onAddText}>
            <TypeIcon size={14} /> Add Label
          </button>
        </div>
      )}

      {/* 7. GRID TOOL OPTIONS */}
      {activeTool === 'grid' && (
        <div className="options-segment">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={gridConfig.enabled}
              onChange={(e) => setGridConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            Show Grid
          </label>

          <select
            className="select-input"
            value={gridConfig.type}
            onChange={(e) => setGridConfig((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="square">Square Grid</option>
            <option value="hex_flat">Flat Hex</option>
            <option value="hex_pointy">Pointy Hex</option>
            <option value="isometric">Isometric Diamond</option>
          </select>

          <label className="option-label">
            Size: {gridConfig.size}px
            <input
              type="range"
              min="24"
              max="140"
              value={gridConfig.size}
              onChange={(e) => setGridConfig((prev) => ({ ...prev, size: parseInt(e.target.value) }))}
            />
          </label>

          <label className="option-label">
            Opacity: {Math.round(gridConfig.opacity * 100)}%
            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.05"
              value={gridConfig.opacity}
              onChange={(e) => setGridConfig((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))}
            />
          </label>

          <button
            className={`btn-toggle ${gridConfig.snap ? 'active' : ''}`}
            onClick={() => setGridConfig((prev) => ({ ...prev, snap: !prev.snap }))}
            title="Snap placed stamps and battle tokens to grid cells"
          >
            <Magnet size={14} /> Snap to Grid
          </button>

          <label className="color-picker-label" title="Grid Line Color">
            <input
              type="color"
              value={gridConfig.color}
              onChange={(e) => setGridConfig((prev) => ({ ...prev, color: e.target.value }))}
            />
          </label>
        </div>
      )}

      {/* 8. ATMOSPHERE TOOL OPTIONS */}
      {activeTool === 'atmosphere' && (
        <div className="options-segment">
          <label className="option-label">
            Vignette: {Math.round(atmosphereConfig.vignette * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={atmosphereConfig.vignette}
              onChange={(e) => setAtmosphereConfig((prev) => ({ ...prev, vignette: parseFloat(e.target.value) }))}
            />
          </label>

          <label className="option-label">
            Parchment Grain: {Math.round((atmosphereConfig.parchmentGrain || 0) * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={atmosphereConfig.parchmentGrain || 0}
              onChange={(e) => setAtmosphereConfig((prev) => ({ ...prev, parchmentGrain: parseFloat(e.target.value) }))}
            />
          </label>

          <label className="option-label">
            Sepia Warmth: {Math.round(atmosphereConfig.sepia * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={atmosphereConfig.sepia}
              onChange={(e) => setAtmosphereConfig((prev) => ({ ...prev, sepia: parseFloat(e.target.value) }))}
            />
          </label>

          <label className="option-label">
            Brightness: {Math.round((atmosphereConfig.brightness ?? 1.0) * 100)}%
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={atmosphereConfig.brightness ?? 1.0}
              onChange={(e) => setAtmosphereConfig((prev) => ({ ...prev, brightness: parseFloat(e.target.value) }))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
