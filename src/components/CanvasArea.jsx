import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap, snapToGrid } from '../engine/renderer';
import { getStampById } from '../engine/stampsCatalog';

export default function CanvasArea({
  mapWidth,
  mapHeight,
  mapType,
  landmasses,
  brushStrokes,
  stamps,
  paths,
  texts,
  grid,
  atmosphere,
  activeTool,
  // Tool parameters
  maskMode,
  brushSize,
  activeBiome,
  brushOpacity,
  activeStampId,
  stampScale,
  stampRotation,
  stampJitter,
  stampSpray,
  pathType,
  pathWidth,
  pathDashed,
  pathColor,
  // Mutation callbacks
  onAddBrushStroke,
  onAddStamp,
  onUpdateStamp,
  onAddPath,
  onCommitAction,
  selectedStampId,
  setSelectedStampId,
  selectedTextId,
  setSelectedTextId,
  selectedPathId,
  setSelectedPathId,
  zoom,
  setZoom,
  panOffset,
  setPanOffset
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const activeStrokeRef = useRef(null);
  const activePathRef = useRef(null);
  const draggedObjectRef = useRef(null);
  const lastSprayPosRef = useRef({ x: -9999, y: -9999 });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, canvasX: 0, canvasY: 0, inside: false });
  const [spacePressed, setSpacePressed] = useState(false);

  // Key listeners for spacebar pan & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT') {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert client viewport coordinates to canvas pixel space
  const clientToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }, []);

  // Main canvas render trigger
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    renderMap({
      ctx,
      width: mapWidth,
      height: mapHeight,
      mapType,
      landmasses,
      brushStrokes,
      stamps,
      paths,
      texts,
      grid,
      atmosphere,
      selectedStampId,
      selectedTextId,
      selectedPathId
    });
  }, [
    mapWidth,
    mapHeight,
    mapType,
    landmasses,
    brushStrokes,
    stamps,
    paths,
    texts,
    grid,
    atmosphere,
    selectedStampId,
    selectedTextId,
    selectedPathId
  ]);

  // Cursor-anchored mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const nextZoom = Math.min(4.0, Math.max(0.1, zoom * zoomFactor));
    const ratio = nextZoom / zoom;

    setPanOffset((prev) => ({
      x: mouseX - (mouseX - prev.x) * ratio,
      y: mouseY - (mouseY - prev.y) * ratio
    }));
    setZoom(nextZoom);
  };

  // Helper to place a single stamp with jitter & grid snapping
  const placeStampAt = (rawX, rawY) => {
    let finalScale = stampScale;
    let finalRot = stampRotation;
    let finalX = rawX;
    let finalY = rawY;

    if (grid && grid.snap) {
      const snapped = snapToGrid(finalX, finalY, grid);
      finalX = snapped.x;
      finalY = snapped.y;
    }

    if (stampJitter) {
      finalScale *= 0.85 + Math.random() * 0.3;
      finalRot += (Math.random() - 0.5) * 0.35;
      finalX += (Math.random() - 0.5) * 12;
      finalY += (Math.random() - 0.5) * 12;
    }

    const newStamp = {
      id: 'stamp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      stampId: activeStampId,
      x: Math.round(finalX),
      y: Math.round(finalY),
      scale: Number(finalScale.toFixed(2)),
      rotation: Number(finalRot.toFixed(2)),
      zIndex: 0 // Stable default for isometric Y-sorting
    };

    onAddStamp(newStamp);
    lastSprayPosRef.current = { x: finalX, y: finalY };
  };

  // Mouse Down handler
  const handleMouseDown = (e) => {
    if (e.button === 1 || spacePressed || activeTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (e.button !== 0) return; // Left click only for actions

    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    isInteractingRef.current = true;

    // 1. SELECT TOOL: Hit test stamps, texts, and paths
    if (activeTool === 'select') {
      // Sort stamps identically to the visual render order
      const sortedStamps = [...stamps].sort((a, b) => {
        const za = a.zIndex || 0;
        const zb = b.zIndex || 0;
        if (za !== zb) return za - zb;
        return a.y - b.y;
      });

      // Hit-test in reverse render order (top-most stamp first)
      const clickedStamp = sortedStamps.slice().reverse().find((s) => {
        const def = getStampById(s.stampId);
        const aspect = (def && def.aspect) ? def.aspect : 1.0;
        const baseSize = 80;
        const finalSize = baseSize * (s.scale || 1.0);
        const w = finalSize * aspect;
        const h = finalSize;

        // Test in rotated stamp local coordinate space
        const dx = x - s.x;
        const dy = y - s.y;
        const rot = -(s.rotation || 0);
        const localX = dx * Math.cos(rot) - dy * Math.sin(rot);
        const localY = dx * Math.sin(rot) + dy * Math.cos(rot);

        return Math.abs(localX) <= w / 2 && Math.abs(localY) <= h / 2;
      });

      if (clickedStamp) {
        setSelectedStampId(clickedStamp.id);
        setSelectedTextId(null);
        if (setSelectedPathId) setSelectedPathId(null);
        draggedObjectRef.current = {
          type: 'stamp',
          id: clickedStamp.id,
          offsetX: x - clickedStamp.x,
          offsetY: y - clickedStamp.y
        };
        return;
      }

      // Hit-test texts
      const clickedText = [...texts].reverse().find((t) => {
        const dist = Math.hypot(t.x - x, t.y - y);
        return dist <= (t.size || 28) * 1.6;
      });

      if (clickedText) {
        setSelectedTextId(clickedText.id);
        setSelectedStampId(null);
        if (setSelectedPathId) setSelectedPathId(null);
        draggedObjectRef.current = {
          type: 'text',
          id: clickedText.id,
          offsetX: x - clickedText.x,
          offsetY: y - clickedText.y
        };
        return;
      }

      // Hit-test paths (within 15px of any path point)
      if (setSelectedPathId) {
        const clickedPath = [...paths].reverse().find((p) => {
          if (!p.points) return false;
          return p.points.some((pt) => Math.hypot(pt[0] - x, pt[1] - y) <= Math.max(16, (p.width || 12)));
        });

        if (clickedPath) {
          setSelectedPathId(clickedPath.id);
          setSelectedStampId(null);
          setSelectedTextId(null);
          return;
        }
      }

      // Clicked empty canvas -> clear selections
      setSelectedStampId(null);
      setSelectedTextId(null);
      if (setSelectedPathId) setSelectedPathId(null);
    }

    // 2. MASK TOOL (Landmass & Coastline Sculptor)
    if (activeTool === 'mask') {
      const strokeId = 'mask_' + Date.now();
      const newStroke = {
        id: strokeId,
        type: 'mask',
        mode: maskMode, // 'land' or 'water'
        size: brushSize,
        opacity: brushOpacity,
        points: [{ x: Math.round(x), y: Math.round(y) }]
      };
      activeStrokeRef.current = newStroke;
      onAddBrushStroke(newStroke);
    }

    // 3. BRUSH TOOL (Biomes & Textures)
    if (activeTool === 'brush') {
      const strokeId = 'brush_' + Date.now();
      const newStroke = {
        id: strokeId,
        type: 'brush',
        biome: activeBiome,
        size: brushSize,
        opacity: brushOpacity,
        points: [{ x: Math.round(x), y: Math.round(y) }]
      };
      activeStrokeRef.current = newStroke;
      onAddBrushStroke(newStroke);
    }

    // 4. STAMP TOOL
    if (activeTool === 'stamp') {
      placeStampAt(x, y);
    }

    // 5. PATH TOOL (Rivers, Roads, Walls)
    if (activeTool === 'path') {
      const pathId = 'path_' + Date.now();
      const newPath = {
        id: pathId,
        type: pathType,
        color: pathColor,
        width: pathWidth,
        dashed: pathDashed,
        points: [[Math.round(x), Math.round(y)]]
      };
      activePathRef.current = newPath;
      onAddPath(newPath);
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e) => {
    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    setMousePos({ x: e.clientX, y: e.clientY, canvasX: Math.round(x), canvasY: Math.round(y), inside: true });

    // Handle Viewport Pan
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isInteractingRef.current) return;

    // Handle Moving selected object
    if (activeTool === 'select' && draggedObjectRef.current) {
      const { type, id, offsetX, offsetY } = draggedObjectRef.current;
      let targetX = Math.round(x - offsetX);
      let targetY = Math.round(y - offsetY);

      if (grid && grid.snap) {
        const snapped = snapToGrid(targetX, targetY, grid);
        targetX = snapped.x;
        targetY = snapped.y;
      }

      if (type === 'stamp') {
        onUpdateStamp(id, { x: targetX, y: targetY });
      } else if (type === 'text') {
        onUpdateStamp(id, { x: targetX, y: targetY }); // Handled in App
      }
      return;
    }

    // Handle Brush / Mask freehand sculpting
    if ((activeTool === 'mask' || activeTool === 'brush') && activeStrokeRef.current) {
      activeStrokeRef.current.points.push({ x: Math.round(x), y: Math.round(y) });
      onAddBrushStroke({ ...activeStrokeRef.current });
      return;
    }

    // Handle Stamp Spray Mode with Distance Throttling
    if (activeTool === 'stamp' && stampSpray) {
      const dist = Math.hypot(x - lastSprayPosRef.current.x, y - lastSprayPosRef.current.y);
      const minDistance = Math.max(24, 40 * stampScale);
      if (dist >= minDistance) {
        placeStampAt(x, y);
      }
      return;
    }

    // Handle Path drawing
    if (activeTool === 'path' && activePathRef.current) {
      activePathRef.current.points.push([Math.round(x), Math.round(y)]);
      onAddPath({ ...activePathRef.current });
      return;
    }
  };

  // Mouse Up handler
  const handleMouseUp = () => {
    if (isInteractingRef.current && onCommitAction) {
      onCommitAction();
    }
    isInteractingRef.current = false;
    isPanningRef.current = false;
    activeStrokeRef.current = null;
    activePathRef.current = null;
    draggedObjectRef.current = null;
  };

  // Global window listeners to catch pointer releases outside canvas boundary
  useEffect(() => {
    const onWindowMouseUp = () => {
      if (isInteractingRef.current || isPanningRef.current) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => window.removeEventListener('mouseup', onWindowMouseUp);
  }, [onCommitAction]);

  return (
    <div
      ref={containerRef}
      className={`canvas-viewport ${spacePressed || activeTool === 'hand' ? 'grab-cursor' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setMousePos((p) => ({ ...p, inside: false }));
      }}
    >
      <div
        className="canvas-transform-wrapper"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <canvas
          ref={canvasRef}
          width={mapWidth}
          height={mapHeight}
          className="main-map-canvas"
        />

        {/* Brush Radius Preview Ring */}
        {mousePos.inside && (activeTool === 'mask' || activeTool === 'brush') && (
          <div
            className="brush-cursor-circle"
            style={{
              left: `${mousePos.canvasX}px`,
              top: `${mousePos.canvasY}px`,
              width: `${brushSize}px`,
              height: `${brushSize}px`,
              borderColor: activeTool === 'mask' ? (maskMode === 'land' ? '#22c55e' : '#38bdf8') : '#f59e0b'
            }}
          />
        )}
      </div>

      {/* Floating Canvas Footer Info */}
      <div className="canvas-status-bar">
        <span>X: {mousePos.canvasX} px | Y: {mousePos.canvasY} px</span>
        <span className="divider-dot">•</span>
        <span>Canvas: {mapWidth} × {mapHeight}</span>
        <span className="divider-dot">•</span>
        <span>Stamps: {stamps.length}</span>
        {grid && grid.snap && (
          <>
            <span className="divider-dot">•</span>
            <span className="text-amber-400 font-semibold">GRID SNAP ON</span>
          </>
        )}
      </div>
    </div>
  );
}
