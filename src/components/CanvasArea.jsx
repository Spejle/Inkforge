import { simplifyPath } from '../utils/pathSmooth';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap, snapToGrid, stampAspect, onImageLoad } from '../engine/renderer';

const HANDLE_R = 14;

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
} // canvas px

/** Where a stamp's transform handles sit, in canvas space (same frame the renderer draws them in). */
function stampFrame(s) {
  const h = 80 * (s.scale || 1);
  const w = h * stampAspect(s);
  const rot = s.rotation || 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const toCanvas = (u, v) => ({ x: s.x + u * cos - v * sin, y: s.y + u * sin + v * cos }); // u,v relative to the origin
  const cv = s.anchor === 'base' ? -h / 2 : 0; // visual centre relative to origin
  return {
    w, h, center: toCanvas(0, cv), origin: { x: s.x, y: s.y },
    corners: [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => toCanvas(a * (w / 2 + 4), cv + b * (h / 2 + 4))),
    rotate: toCanvas(0, cv - h / 2 - 22)
  };
}

function handleAt(s, x, y) {
  const f = stampFrame(s);
  if (Math.hypot(f.rotate.x - x, f.rotate.y - y) <= HANDLE_R) return 'rotate';
  if (f.corners.some((c) => Math.hypot(c.x - x, c.y - y) <= HANDLE_R)) return 'scale';
  return null;
}

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
  coastline,
  activeTool,
  // Tool parameters
  maskMode,
  maskShape = 'rough',
  maskRoughness = 0.6,
  brushSize,
  activeBiome,
  brushOpacity,
  brushTarget = 'foreground',
  brushSoftness = 0.5,
  brushBlendMode = 'source-over',
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
  onEraseAt,
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
  setPanOffset,
  layerVisibility,
  layerStyle,
  customStamps = [],
  statusNote = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const activeStrokeRef = useRef(null);
  const activePathRef = useRef(null);
  const pathStabRef = useRef(null); // lazy-rope cursor so drawn rivers don't wobble
  const straightAnchorRef = useRef(null);
  const draggedObjectRef = useRef(null);
  const lastSprayPosRef = useRef({ x: -9999, y: -9999 });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, canvasX: 0, canvasY: 0, inside: false });
  const [spacePressed, setSpacePressed] = useState(false);
  const [imageTick, setImageTick] = useState(0); // bumps when a custom stamp image finishes loading

  useEffect(() => {
    onImageLoad(() => setImageTick((n) => n + 1));
    return () => onImageLoad(null);
  }, []);

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

  // An object can be picked only when its layer is visible and unlocked
  const pickable = (o, builtin) => {
    const key = o.layer && layerStyle?.[o.layer] ? o.layer : builtin;
    return layerVisibility?.[key] !== false && !layerStyle?.[key]?.locked;
  };

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

    // one repaint per frame, however many state updates landed in it
    const raf = requestAnimationFrame(() => renderMap({
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
      coastline,
      selectedStampId,
      selectedTextId,
      selectedPathId,
      layerVisibility,
      layerStyle
    }));
    return () => cancelAnimationFrame(raf);
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
    coastline,
    selectedStampId,
    selectedTextId,
    selectedPathId,
    layerVisibility,
    layerStyle,
    imageTick
  ]);

  // Cursor-anchored mouse wheel zoom. Native listener: React's onWheel is passive, so preventDefault would be ignored.
  const viewRef = useRef({ zoom, setZoom, setPanOffset });
  useEffect(() => {
    viewRef.current = { zoom, setZoom, setPanOffset };
  });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e) => {
      e.preventDefault();
      const { zoom, setZoom, setPanOffset } = viewRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const nextZoom = Math.min(4.0, Math.max(0.1, zoom * (e.deltaY < 0 ? 1.12 : 0.88)));
      const ratio = nextZoom / zoom;
      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * ratio,
        y: mouseY - (mouseY - prev.y) * ratio
      }));
      setZoom(nextZoom);
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

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
    if (stampJitter) {
      // Per-instance variety so sprayed forests don't read as clones
      newStamp.flipX = Math.random() < 0.5;
      newStamp.tone = Number((0.94 + Math.random() * 0.12).toFixed(2));
      newStamp.hue = Math.round((Math.random() - 0.5) * 8);
    }
    const custom = customStamps.find((c) => c.id === activeStampId);
    if (custom) {
      Object.assign(newStamp, { customImage: custom.img, dataUrl: custom.dataUrl, aspect: custom.aspect, anchor: custom.anchor });
    }

    onAddStamp(newStamp);
    lastSprayPosRef.current = { x: finalX, y: finalY };
  };

  // Mouse Down handler
  const handleMouseDown = (e) => {
    // Tablet: pencil/mouse draw, a finger pans
    if (e.button === 1 || spacePressed || activeTool === 'hand' || e.pointerType === 'touch') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (e.button !== 0) return; // Left click only for actions

    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    isInteractingRef.current = true;

    // 1. SELECT TOOL: Hit test stamps, texts, and paths
    if (activeTool === 'select') {
      const sel = stamps.find((t) => t.id === selectedStampId && pickable(t, 'stamps'));
      const handle = sel && handleAt(sel, x, y);
      if (handle) {
        const f = stampFrame(sel);
        draggedObjectRef.current = {
          type: handle,
          id: sel.id,
          scale0: sel.scale || 1,
          dist0: Math.max(1, Math.hypot(x - f.center.x, y - f.center.y)),
          center0: f.center,
          origin: f.origin
        };
        return;
      }
      // Sort stamps identically to the visual render order
      const sortedStamps = stamps.filter((t) => pickable(t, 'stamps')).sort((a, b) => {
        const za = a.zIndex || 0;
        const zb = b.zIndex || 0;
        if (za !== zb) return za - zb;
        return a.y - b.y;
      });

      // Hit-test in reverse render order (top-most stamp first)
      const clickedStamp = sortedStamps.slice().reverse().find((s) => {
        const aspect = stampAspect(s);
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

        const cy = s.anchor === 'base' ? localY + h / 2 : localY;
        return Math.abs(localX) <= w / 2 && Math.abs(cy) <= h / 2;
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
      const clickedText = texts.filter((t) => pickable(t, 'text')).reverse().find((t) => {
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
        const clickedPath = paths.filter((p) => pickable(p, 'paths')).reverse().find((p) => {
          if (!p.points) return false;
          const tol = Math.max(16, p.width || 12);
          return p.points.some((pt, i) => {
            const prev = p.points[i - 1] || pt;
            return distToSegment(x, y, prev[0], prev[1], pt[0], pt[1]) <= tol;
          });
        });

        if (clickedPath) {
          setSelectedPathId(clickedPath.id);
          setSelectedStampId(null);
          setSelectedTextId(null);
          draggedObjectRef.current = { type: 'path', id: clickedPath.id, lastX: x, lastY: y };
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
        shape: maskShape, // 'rough' or 'circle'
        roughness: maskRoughness,
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
        target: brushTarget, // 'foreground' or 'background'
        biome: activeBiome,
        size: brushSize,
        opacity: brushOpacity,
        softness: brushSoftness,
        blendMode: brushBlendMode,
        points: [{ x: Math.round(x), y: Math.round(y) }]
      };
      activeStrokeRef.current = newStroke;
      onAddBrushStroke(newStroke);
    }

    if (activeTool === 'eraser' && onEraseAt) onEraseAt(x, y, brushSize / 2);

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
      pathStabRef.current = [x, y];
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

    if (!isInteractingRef.current) {
      if (activeTool === 'select' && containerRef.current) {
        const sel = stamps.find((t) => t.id === selectedStampId);
        const hit = sel && handleAt(sel, x, y);
        containerRef.current.style.cursor = hit === 'rotate' ? 'alias' : hit === 'scale' ? 'nwse-resize' : '';
      }
      return;
    }

    if (activeTool === 'select' && draggedObjectRef.current && ['scale', 'rotate'].includes(draggedObjectRef.current.type)) {
      const d = draggedObjectRef.current;
      if (d.type === 'scale') {
        const ratio = Math.hypot(x - d.center0.x, y - d.center0.y) / d.dist0;
        onUpdateStamp(d.id, { scale: Number(Math.min(8, Math.max(0.15, d.scale0 * ratio)).toFixed(2)) });
      } else {
        let rot = Math.atan2(y - d.origin.y, x - d.origin.x) + Math.PI / 2;
        if (e.shiftKey) rot = Math.round(rot / (Math.PI / 12)) * (Math.PI / 12); // 15° steps
        onUpdateStamp(d.id, { rotation: Number(rot.toFixed(3)) });
      }
      return;
    }

    if (activeTool === 'select' && draggedObjectRef.current?.type === 'path') {
      const d = draggedObjectRef.current;
      const path = paths.find((p) => p.id === d.id);
      if (path) {
        const dx = Math.round(x - d.lastX);
        const dy = Math.round(y - d.lastY);
        if (dx || dy) {
          onAddPath({ ...path, points: path.points.map(([px, py]) => [px + dx, py + dy]) });
          d.lastX += dx;
          d.lastY += dy;
        }
      }
      return;
    }

    if (activeTool === 'eraser' && onEraseAt) {
      onEraseAt(x, y, brushSize / 2);
      return;
    }

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

    // Handle Brush / Mask freehand sculpting with distance interpolation
    if ((activeTool === 'mask' || activeTool === 'brush') && activeStrokeRef.current) {
      const pts = activeStrokeRef.current.points;
      const lastPt = pts[pts.length - 1];
      const targetX = Math.round(x);
      const targetY = Math.round(y);
      const dist = Math.hypot(targetX - lastPt.x, targetY - lastPt.y);
      const step = Math.max(4, Math.floor(brushSize / 4));

      if (dist > step) {
        const steps = Math.min(20, Math.floor(dist / step));
        for (let i = 1; i <= steps; i++) {
          pts.push({
            x: Math.round(lastPt.x + (targetX - lastPt.x) * (i / steps)),
            y: Math.round(lastPt.y + (targetY - lastPt.y) * (i / steps))
          });
        }
      } else {
        pts.push({ x: targetX, y: targetY });
      }

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
      const pts = activePathRef.current.points;
      if (e.shiftKey) {
        // Shift: straight segment from the last committed point to the cursor (Alt snaps to 15°)
        if (pathStabRef.current) pathStabRef.current.raw = null;
        const anchor = straightAnchorRef.current || pts[pts.length - 1];
        straightAnchorRef.current = anchor;
        let tx = x;
        let ty = y;
        if (e.altKey) {
          const ang = Math.round(Math.atan2(y - anchor[1], x - anchor[0]) / (Math.PI / 12)) * (Math.PI / 12);
          const len = Math.hypot(x - anchor[0], y - anchor[1]);
          tx = anchor[0] + Math.cos(ang) * len;
          ty = anchor[1] + Math.sin(ang) * len;
        }
        const keep = pts.indexOf(anchor) + 1;
        pts.length = keep;
        pts.push([Math.round(tx), Math.round(ty)]);
      } else {
        straightAnchorRef.current = null;
        // Stabiliser: the pen follows the cursor on a short rope; points only every 6 px
        const st = pathStabRef.current || [x, y];
        st[0] += (x - st[0]) * 0.35;
        st[1] += (y - st[1]) * 0.35;
        st.raw = [x, y];
        pathStabRef.current = st;
        const last = pts[pts.length - 1];
        if (Math.hypot(st[0] - last[0], st[1] - last[1]) < 6) return;
        pts.push([Math.round(st[0]), Math.round(st[1])]);
      }
      onAddPath({ ...activePathRef.current, points: [...pts] });
      return;
    }
  };

  // Mouse Up handler
  const handleMouseUp = () => {
    if (activePathRef.current && activePathRef.current.points.length > 3) {
      const raw = pathStabRef.current?.raw; // the rope lags the cursor, so finish exactly where the pen lifted
      const all = raw ? [...activePathRef.current.points, [Math.round(raw[0]), Math.round(raw[1])]] : activePathRef.current.points;
      const done = { ...activePathRef.current, points: simplifyPath(all, 2.5) };
      onAddPath(done);
    }
    if (isInteractingRef.current && onCommitAction) {
      onCommitAction();
    }
    isInteractingRef.current = false;
    isPanningRef.current = false;
    activeStrokeRef.current = null;
    activePathRef.current = null;
    straightAnchorRef.current = null;
    draggedObjectRef.current = null;
  };

  // Global window listeners to catch pointer releases outside canvas boundary
  useEffect(() => {
    const onWindowMouseUp = () => {
      if (isInteractingRef.current || isPanningRef.current) {
        handleMouseUp();
      }
    };
    window.addEventListener('pointerup', onWindowMouseUp);
    window.addEventListener('pointercancel', onWindowMouseUp);
    return () => {
      window.removeEventListener('pointerup', onWindowMouseUp);
      window.removeEventListener('pointercancel', onWindowMouseUp);
    };
    // handleMouseUp only reads refs and the latest onCommitAction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCommitAction]);

  return (
    <div
      ref={containerRef}
      className={`canvas-viewport ${spacePressed || activeTool === 'hand' ? 'grab-cursor' : ''}`}
      onPointerDown={handleMouseDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerLeave={() => {
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
        {statusNote && (
          <>
            <span className="divider-dot">•</span>
            <span>{statusNote}</span>
          </>
        )}
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
