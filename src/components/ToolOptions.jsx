import React, { useState } from 'react';
import { LIGHT_PRESETS } from './LayersPanel';
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
  Type as TypeIcon,
  Waves,
  CircleDot,
  Square,
  SlidersHorizontal,
  RotateCcw,
  X
} from 'lucide-react';
import { BIOMES } from '../engine/biomesCatalog';
import { getStampById } from '../engine/stampsCatalog';

export default function ToolOptions({
  activeTool,
  strokePreview = true,
  setStrokePreview,
  brushRing = true,
  setBrushRing,
  // Mask options
  maskMode,
  setMaskMode,
  maskShape = 'rough',
  setMaskShape,
  maskRoughness = 0.5,
  setMaskRoughness,
  coastlineConfig,
  setCoastlineConfig,
  brushSize,
  setBrushSize,
  // Biome brush options
  biomes = BIOMES,
  allBiomes = false,
  activeBiome,
  setActiveBiome,
  brushOpacity,
  setBrushOpacity,
  brushTarget = 'foreground',
  setBrushTarget,
  brushSoftness = 0.4,
  setBrushSoftness,
  brushBlendMode = 'source-over',
  setBrushBlendMode,
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
  const [isCoastlineOpen, setIsCoastlineOpen] = useState(false);
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
                Scale: <span className="val-badge">{Math.round((selectedStamp.scale || 1.0) * 100)}%</span>
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
                Rot: <span className="val-badge">{Math.round(((selectedStamp.rotation || 0) * 180) / Math.PI)}°</span>
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
                onClick={() => onUpdateSelectedStamp?.({ rotation: 0 })}
                title="Reset Rotation to 0°"
              >
                <RotateCcw size={13} /> 0°
              </button>

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
                Size: <span className="val-badge">{selectedText.size || 28}px</span>
                <input
                  type="range"
                  min="14"
                  max="96"
                  value={selectedText.size || 28}
                  onChange={(e) => onUpdateSelectedText?.({ size: parseInt(e.target.value) })}
                />
              </label>

              <label className="option-label">
                Arc: <span className="val-badge">{Math.round((selectedText.curvature || 0) * 100)}%</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={selectedText.curvature || 0}
                  onChange={(e) => onUpdateSelectedText?.({ curvature: parseFloat(e.target.value) })}
                />
              </label>

              <label className="color-picker-label" title="Text Fill Color">
                <input
                  type="color"
                  value={selectedText.color || '#271b12'}
                  onChange={(e) => onUpdateSelectedText?.({ color: e.target.value })}
                />
              </label>

              <label className="color-picker-label" title="Text Outline Stroke">
                <input
                  type="color"
                  value={selectedText.stroke || '#ffffff'}
                  onChange={(e) => onUpdateSelectedText?.({ stroke: e.target.value })}
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
                Width: <span className="val-badge">{selectedPath.width || 12}px</span>
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
              title="Paint continents and islands (X swaps Add / Carve)"
            >
              Add Land
            </button>
            <button
              className={`btn-toggle ${maskMode === 'water' ? 'active blue' : ''}`}
              onClick={() => setMaskMode('water')}
              title="Carve ocean, lakes, and fjords (X swaps Add / Carve)"
            >
              Carve Water
            </button>
          </div>

          <span className="segment-divider" />

          <span className="segment-label">Brush Shape:</span>
          <div className="btn-group">
            <button
              className={`btn-toggle ${maskShape === 'circle' ? 'active' : ''}`}
              onClick={() => setMaskShape?.('circle')}
              title="Smooth Circular Stroke"
            >
              <CircleDot size={13} /> Circle
            </button>
            <button
              className={`btn-toggle ${maskShape === 'rough' ? 'active amber' : ''}`}
              onClick={() => setMaskShape?.('rough')}
              title="Fractal Jagged Coastline (Natural Fjords & Cliffs)"
            >
              <SlidersHorizontal size={13} /> Rough Edgy
            </button>
            <button
              className={`btn-toggle ${maskShape === 'block' ? 'active' : ''}`}
              onClick={() => setMaskShape?.('block')}
              title="Blocky Regional Stroke"
            >
              <Square size={13} /> Block
            </button>
          </div>

          {maskShape === 'rough' && (
            <label className="option-label">
              Roughness: <span className="val-badge">{Math.round((maskRoughness ?? 0.5) * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={maskRoughness ?? 0.5}
                onChange={(e) => setMaskRoughness?.(parseFloat(e.target.value))}
              />
            </label>
          )}

          <label className="option-label">
            Size: <span className="val-badge">{brushSize}px</span>
            <input
              type="range"
              min="15"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </label>

          <label className="option-label">
            Flow: <span className="val-badge">{Math.round(brushOpacity * 100)}%</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
            />
          </label>

          <span className="segment-divider" />

          <div className="popover-anchor">
            <button
              className={`btn-toggle ${isCoastlineOpen ? 'active cyan' : ''}`}
              onClick={() => setIsCoastlineOpen((v) => !v)}
              title="Configure coastal ripples, shallow sand border, and ocean depth shadow"
            >
              <Waves size={14} /> Coastline FX
            </button>
            {isCoastlineOpen && coastlineConfig && (
              <CoastlinePopover
                config={coastlineConfig}
                setConfig={setCoastlineConfig}
                onClose={() => setIsCoastlineOpen(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* 3. BIOME BRUSH OPTIONS */}
      {activeTool === 'eraser' && (
        <div className="options-segment">
          <label className="option-label">
            Size: <span className="val-badge">{brushSize}px</span>
            <input
              type="range"
              min="15"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </label>
          <span className="segment-label">Removes whole brush / land strokes and paths under the ring</span>
        </div>
      )}

      {activeTool === 'brush' && (
        <div className="options-segment">
          <span className="segment-label">Biome:</span>
          <select
            className="select-input"
            value={activeBiome}
            onChange={(e) => setActiveBiome(e.target.value)}
          >
            {biomes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            {allBiomes && (
              <optgroup label="Other map types">
                {BIOMES.filter((b) => !biomes.includes(b)).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            )}
          </select>

          <span className="segment-divider" />

          <span className="segment-label">Target:</span>
          <div className="btn-group">
            <button
              className={`btn-toggle ${brushTarget === 'foreground' ? 'active green' : ''}`}
              onClick={() => setBrushTarget?.('foreground')}
              title="Paint strictly onto landmasses (Mask Foreground)"
            >
              Land (FG)
            </button>
            <button
              className={`btn-toggle ${brushTarget === 'background' ? 'active blue' : ''}`}
              onClick={() => setBrushTarget?.('background')}
              title="Paint strictly in oceans and water (Mask Background)"
            >
              Water (BG)
            </button>
            <button
              className={`btn-toggle ${brushTarget === 'both' ? 'active' : ''}`}
              onClick={() => setBrushTarget?.('both')}
              title="Paint across entire canvas"
            >
              Both
            </button>
          </div>

          <label className="option-label">
            Softness: <span className="val-badge">{Math.round((brushSoftness ?? 0.4) * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={brushSoftness ?? 0.4}
              onChange={(e) => setBrushSoftness?.(parseFloat(e.target.value))}
            />
          </label>

          <label className="option-label">
            Size: <span className="val-badge">{brushSize}px</span>
            <input
              type="range"
              min="15"
              max="240"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </label>

          <label className="option-label">
            Opacity: <span className="val-badge">{Math.round(brushOpacity * 100)}%</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
            />
          </label>

          <select
            className="select-input"
            value={brushBlendMode ?? 'source-over'}
            onChange={(e) => setBrushBlendMode?.(e.target.value)}
            title="Blend Mode for rich biome tinting"
          >
            <option value="source-over">Normal</option>
            <option value="multiply">Multiply (Shadows / Dirt)</option>
            <option value="overlay">Overlay (Vibrant Pop)</option>
            <option value="soft-light">Soft Light (Subtle Tint)</option>
          </select>
        </div>
      )}

      {/* Preview switches shared by the two painting tools */}
      {(activeTool === 'mask' || activeTool === 'brush') && (
        <div className="options-segment">
          <span className="segment-label">Preview:</span>
          <div className="btn-group">
            <button
              className={`btn-toggle ${strokePreview ? 'active' : ''}`}
              onClick={() => setStrokePreview?.(!strokePreview)}
              title="Show the stroke while you drag. Off: it only appears when you let go."
            >
              Stroke
            </button>
            <button
              className={`btn-toggle ${brushRing ? 'active' : ''}`}
              onClick={() => setBrushRing?.(!brushRing)}
              title="Show the dashed brush-size ring that follows the cursor"
            >
              Cursor ring
            </button>
          </div>
        </div>
      )}

      {/* 4. STAMP TOOL OPTIONS */}
      {activeTool === 'stamp' && (
        <div className="options-segment">
          <span className="segment-label">Active:</span>
          <span className="selected-tag">{activeStampDef?.name || 'Stamp'}</span>

          <label className="option-label">
            Scale: <span className="val-badge">{Math.round(stampScale * 100)}%</span>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.05"
              value={stampScale}
              onChange={(e) => setStampScale(parseFloat(e.target.value))}
            />
          </label>
          <button
            className="btn-small"
            onClick={() => setStampScale(1.0)}
            title="Reset Scale to 100%"
          >
            1x
          </button>

          <label className="option-label">
            Rot: <span className="val-badge">{Math.round((stampRotation * 180) / Math.PI)}°</span>
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
            className="btn-small"
            onClick={() => setStampRotation(0)}
            title="Reset Rotation to 0°"
          >
            <RotateCcw size={13} />
          </button>

          <button
            className={`btn-toggle ${stampJitter ? 'active' : ''}`}
            onClick={() => setStampJitter(!stampJitter)}
            title="Randomize size and rotation for natural organic clusters (upright stamps such as castles and trees keep their angle; top-down props spin freely)"
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
              <FlipHorizontal size={14} /> Flip X
            </button>
            <button className="btn-small" onClick={() => onFlipStamp('y')} title="Flip Vertical">
              <FlipVertical size={14} /> Flip Y
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
            Width: <span className="val-badge">{pathWidth}px</span>
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
            Size: <span className="val-badge">{textSize}px</span>
            <input
              type="range"
              min="16"
              max="80"
              value={textSize}
              onChange={(e) => setTextSize(parseInt(e.target.value))}
            />
          </label>

          <label className="option-label">
            Arc: <span className="val-badge">{Math.round((textCurvature || 0) * 100)}%</span>
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
            Size: <span className="val-badge">{gridConfig.size}px</span>
            <input
              type="range"
              min="24"
              max="140"
              value={gridConfig.size}
              onChange={(e) => setGridConfig((prev) => ({ ...prev, size: parseInt(e.target.value) }))}
            />
          </label>

          <label className="option-label">
            Opacity: <span className="val-badge">{Math.round(gridConfig.opacity * 100)}%</span>
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
          {Object.entries(LIGHT_PRESETS).map(([name, preset]) => (
            <button key={name} className="chip" onClick={() => setAtmosphereConfig((prev) => ({ ...prev, ...preset }))}>{name}</button>
          ))}
          <label className="option-label" title="Darkens the map; campfires and braziers cut light through it, walls cast shadows">
            Darkness: <span className="val-badge">{Math.round((atmosphereConfig.darkness || 0) * 100)}%</span>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.05"
              value={atmosphereConfig.darkness || 0}
              onChange={(e) => setAtmosphereConfig((prev) => ({ ...prev, darkness: parseFloat(e.target.value) }))}
            />
          </label>
          {atmosphereConfig.weather && (
            <label className="option-label">
              {atmosphereConfig.weather === 'snow' ? 'Snow' : 'Rain'}: <span className="val-badge">{Math.round((atmosphereConfig.weatherAmount || 0) * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={atmosphereConfig.weatherAmount || 0}
                onChange={(e) => setAtmosphereConfig((prev) => ({ ...prev, weatherAmount: parseFloat(e.target.value) }))}
              />
            </label>
          )}
          <label className="option-label">
            Vignette: <span className="val-badge">{Math.round(atmosphereConfig.vignette * 100)}%</span>
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
            Grain: <span className="val-badge">{Math.round((atmosphereConfig.parchmentGrain || 0) * 100)}%</span>
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
            Warmth: <span className="val-badge">{Math.round(atmosphereConfig.sepia * 100)}%</span>
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
            Brightness: <span className="val-badge">{Math.round((atmosphereConfig.brightness ?? 1.0) * 100)}%</span>
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

/**
 * Floating Coastline & Shoreline FX Panel
 */
function CoastlinePopover({ config, setConfig, onClose }) {
  return (
    <div className="coastline-fx-popover">
      <div className="popover-header">
        <div className="flex-row items-center gap-2">
          <Waves size={16} className="text-cyan-400" />
          <h4>Coastline & Shore Effects</h4>
        </div>
        <button className="btn-icon-tiny" onClick={onClose} title="Close">
          <X size={14} />
        </button>
      </div>

      <div className="popover-body">
        {/* Section 1: Ripples */}
        <div className="popover-section">
          <div className="section-title-row">
            <label className="checkbox-label font-semibold">
              <input
                type="checkbox"
                checked={config.ripplesEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, ripplesEnabled: e.target.checked }))}
              />
              Shallow Water Ripples
            </label>
            <label className="color-picker-label" title="Ripple Wave Color">
              <input
                type="color"
                value={config.rippleColor || '#38bdf8'}
                onChange={(e) => setConfig((prev) => ({ ...prev, rippleColor: e.target.value }))}
              />
            </label>
          </div>

          {config.ripplesEnabled && (
            <div className="section-sliders">
              <label className="option-label-compact">
                Waves: <span className="val-badge">{config.rippleCount || 3}</span>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={config.rippleCount || 3}
                  onChange={(e) => setConfig((prev) => ({ ...prev, rippleCount: parseInt(e.target.value) }))}
                />
              </label>
              <label className="option-label-compact">
                Spacing: <span className="val-badge">{config.rippleSpacing || 9}px</span>
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={config.rippleSpacing || 9}
                  onChange={(e) => setConfig((prev) => ({ ...prev, rippleSpacing: parseInt(e.target.value) }))}
                />
              </label>
              <label className="option-label-compact">
                Opacity: <span className="val-badge">{Math.round((config.rippleOpacity ?? 0.28) * 100)}%</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={config.rippleOpacity ?? 0.28}
                  onChange={(e) => setConfig((prev) => ({ ...prev, rippleOpacity: parseFloat(e.target.value) }))}
                />
              </label>
            </div>
          )}
        </div>

        {/* Section 2: Sand & Outline */}
        <div className="popover-section">
          <div className="section-title-row">
            <label className="checkbox-label font-semibold">
              <input
                type="checkbox"
                checked={config.sandEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, sandEnabled: e.target.checked }))}
              />
              Beach Sand Rim
            </label>
            <label className="color-picker-label" title="Beach Sand Color">
              <input
                type="color"
                value={config.sandColor || '#d4b276'}
                onChange={(e) => setConfig((prev) => ({ ...prev, sandColor: e.target.value }))}
              />
            </label>
          </div>

          {config.sandEnabled && (
            <div className="section-sliders">
              <label className="option-label-compact">
                Sand Width: <span className="val-badge">{config.sandWidth || 7}px</span>
                <input
                  type="range"
                  min="2"
                  max="22"
                  value={config.sandWidth || 7}
                  onChange={(e) => setConfig((prev) => ({ ...prev, sandWidth: parseInt(e.target.value) }))}
                />
              </label>
            </div>
          )}

          <div className="section-title-row mt-2">
            <span className="font-semibold text-xs text-slate-300">Land Outline:</span>
            <label className="color-picker-label" title="Outline Color">
              <input
                type="color"
                value={config.outlineColor || '#2b2318'}
                onChange={(e) => setConfig((prev) => ({ ...prev, outlineColor: e.target.value }))}
              />
            </label>
          </div>
          <div className="section-sliders">
            <label className="option-label-compact">
              Width: <span className="val-badge">{config.outlineWidth || 2.5}px</span>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={config.outlineWidth || 2.5}
                onChange={(e) => setConfig((prev) => ({ ...prev, outlineWidth: parseFloat(e.target.value) }))}
              />
            </label>
          </div>
        </div>

        {/* Section 3: Ocean Depth Shadow */}
        <div className="popover-section">
          <div className="section-title-row">
            <label className="checkbox-label font-semibold">
              <input
                type="checkbox"
                checked={config.shadowEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, shadowEnabled: e.target.checked }))}
              />
              Continental Elevation Shadow
            </label>
          </div>

          {config.shadowEnabled && (
            <div className="section-sliders">
              <label className="option-label-compact">
                Drop Blur: <span className="val-badge">{config.shadowBlur || 14}px</span>
                <input
                  type="range"
                  min="4"
                  max="35"
                  value={config.shadowBlur || 14}
                  onChange={(e) => setConfig((prev) => ({ ...prev, shadowBlur: parseInt(e.target.value) }))}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
