import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap } from '../engine/renderer';
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
  selectedStampId,
  setSelectedStampId,
  selectedTextId,
  setSelectedTextId,
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
      selectedTextId
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
    selectedTextId
  ]);

  // Mouse Wheel Zoom centered on cursor
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => {
      const next = Math.min(3.5, Math.max(0.15, prev * zoomFactor));
      return next;
    });
  };

  // Mouse Down
  const handleMouseDown = (e) => {
    // Check if middle click or spacebar or Hand tool is active -> Pan
    if (e.button === 1 || spacePressed || activeTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (e.button !== 0) return; // Left click only for actions

    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    isInteractingRef.current = true;

    // 1. SELECT TOOL: Hit test stamps and texts
    if (activeTool === 'select') {
      // Test stamps in reverse order (top to bottom)
      const clickedStamp = [...stamps].reverse().find((s) => {
        const dist = Math.hypot(s.x - x, s.y - y);
        const radius = (80 * (s.scale || 1)) / 2;
        return dist <= radius;
      });

      if (clickedStamp) {
        setSelectedStampId(clickedStamp.id);
        setSelectedTextId(null);
        draggedObjectRef.current = { type: 'stamp', id: clickedStamp.id, offsetX: x - clickedStamp.x, offsetY: y - clickedStamp.y };
        return;
      }

      // Test texts
      const clickedText = [...texts].reverse().find((t) => {
        const dist = Math.hypot(t.x - x, t.y - y);
        return dist <= (t.size || 24) * 1.5;
      });

      if (clickedText) {
        setSelectedTextId(clickedText.id);
        setSelectedStampId(null);
        draggedObjectRef.current = { type: 'text', id: clickedText.id, offsetX: x - clickedText.x, offsetY: y - clickedText.y };
        return;
      }

      // Clicked empty area -> clear selection
      setSelectedStampId(null);
      setSelectedTextId(null);
    }

    // 2. MASK / LANDMASS TOOL: Begin stroke
    if (activeTool === 'mask') {
      activeStrokeRef.current = {
        id: 'stroke_' + Date.now(),
        type: 'mask',
        mode: maskMode,
        biome: maskMode === 'water' ? 'deep_ocean' : 'grassland',
        size: brushSize,
        opacity: 0.9,
        points: [{ x, y }]
      };
      onAddBrushStroke({ ...activeStrokeRef.current });
    }

    // 3. BIOME / BRUSH TOOL: Begin texture stroke
    if (activeTool === 'brush') {
      activeStrokeRef.current = {
        id: 'stroke_' + Date.now(),
        type: 'biome',
        biome: activeBiome,
        size: brushSize,
        opacity: brushOpacity,
        points: [{ x, y }]
      };
      onAddBrushStroke({ ...activeStrokeRef.current });
    }

    // 4. STAMP TOOL: Place stamp
    if (activeTool === 'stamp') {
      placeStampAt(x, y);
    }

    // 5. PATH / RIVER TOOL: Begin path
    if (activeTool === 'path') {
      activePathRef.current = {
        id: 'path_' + Date.now(),
        type: pathType,
        width: pathWidth,
        dashed: pathDashed,
        color: pathColor,
        points: [[x, y]]
      };
      onAddPath({ ...activePathRef.current });
    }
  };

  // Helper to place stamp with optional jitter
  const placeStampAt = (x, y) => {
    let finalScale = stampScale;
    let finalRot = stampRotation;

    if (stampJitter) {
      finalScale *= 0.85 + Math.random() * 0.3;
      finalRot += (Math.random() - 0.5) * 0.4;
    }

    const newStamp = {
      id: 'stamp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      stampId: activeStampId,
      x: Math.round(x),
      y: Math.round(y),
      scale: Number(finalScale.toFixed(2)),
      rotation: Number(finalRot.toFixed(2)),
      zIndex: Date.now() % 1000
    };

    onAddStamp(newStamp);
  };

  // Mouse Move
  const handleMouseMove = (e) => {
    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    setMousePos({ x: e.clientX, y: e.clientY, canvasX: Math.round(x), canvasY: Math.round(y), inside: true });

    // Handle Pan
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isInteractingRef.current) return;

    // Handle dragging selected element
    if (activeTool === 'select' && draggedObjectRef.current) {
      const { type, id, offsetX, offsetY } = draggedObjectRef.current;
      if (type === 'stamp') {
        onUpdateStamp(id, { x: Math.round(x - offsetX), y: Math.round(y - offsetY) });
      }
      return;
    }

    // Handle Brush / Mask sculpting stroke
    if ((activeTool === 'mask' || activeTool === 'brush') && activeStrokeRef.current) {
      activeStrokeRef.current.points.push({ x, y });
      onAddBrushStroke({ ...activeStrokeRef.current });
      return;
    }

    // Handle Stamp spray
    if (activeTool === 'stamp' && stampSpray) {
      // Throttle spray distance to avoid too many stamps per pixel
      placeStampAt(x, y);
      return;
    }

    // Handle Path drawing
    if (activeTool === 'path' && activePathRef.current) {
      activePathRef.current.points.push([Math.round(x), Math.round(y)]);
      onAddPath({ ...activePathRef.current });
      return;
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    isInteractingRef.current = false;
    isPanningRef.current = false;
    activeStrokeRef.current = null;
    activePathRef.current = null;
    draggedObjectRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={`canvas-viewport ${spacePressed || activeTool === 'hand' ? 'grab-cursor' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
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
      </div>
    </div>
  );
}
