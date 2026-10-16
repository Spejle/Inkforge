import { simplifyPath } from '../utils/pathSmooth';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { generateRiver, renderMap, buildPlan, snapToGrid, stampAspect, onImageLoad } from '../engine/renderer';
import { getStampById } from '../engine/stampsCatalog';
import { makeStepper } from '../utils/adjust';
import { pickQuality } from '../utils/quality';

const HANDLE_R = 14;
const VERTEX_R = 9; // grab radius of a spine point, in screen px

/** The points a selected river, road or wall shows as editable handles: dense freehand lines are thinned first. */
function spineOf(path) {
  return path.points.length > 40 ? simplifyPath(path.points, 4) : path.points;
}

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
  onWheelAdjust,
  strokeOutline = false,
  livePreview = true,
  brushRing = true,
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
  onCommitStroke,
  onAddStamp,
  onUpdateStamp,
  onAddPath,
  onEraseAt,
  onCommitAction,
  selectedStampId,
  setSelectedStampId,
  riverGen,
  groupIds = [],
  setGroupIds,
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
  const hostRef = useRef(null); // holds the Pixi canvas
  const [view, setView] = useState(null); // PixiMapView once ready
  // Canvas 2D stays as the fallback: no GPU WebGL, a map larger than one GPU texture, or ?renderer=2d
  const rendererParam = new URLSearchParams(window.location.search).get('renderer'); // '2d' forces Canvas 2D, 'pixi' forces Pixi
  const [fallback, setFallback] = useState(rendererParam === '2d');
  const isInteractingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const activeStrokeRef = useRef(null);
  const [liveStroke, setLiveStroke] = useState(null); // stroke being painted: drawn as a cheap preview, committed on release
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

  // Canvas pixels per map unit. The canvas is shown scaled by the zoom, so a 1x canvas turns blurry when you zoom in: once
  // the zoom settles it is redrawn at a density that matches it (capped by map size, see utils/quality.js).
  const [quality, setQuality] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setQuality((cur) => pickQuality(zoom * (window.devicePixelRatio || 1), cur, mapWidth, mapHeight)), 250);
    return () => clearTimeout(t);
  }, [zoom, mapWidth, mapHeight]);
  // the Canvas 2D fallback keeps a cache canvas per layer, so it gets a lower cap than the GPU view
  const drawQuality = Math.max(1, Math.min(quality, Math.sqrt(12e6 / (mapWidth * mapHeight))));

  // Convert client viewport coordinates to map space (the canvas backing size depends on the quality, the map does not)
  const clientToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (mapWidth / rect.width);
    const y = (clientY - rect.top) * (mapHeight / rect.height);
    return { x, y };
  }, [mapWidth, mapHeight]);

  const selectedPath = selectedPathId ? paths.find((p) => p.id === selectedPathId) : null;
  const vertexAt = (path, x, y) => {
    const r = VERTEX_R / zoom;
    return spineOf(path).findIndex(([px, py]) => Math.hypot(px - x, py - y) <= r);
  };

  // Pixi view: created lazily (the engine is its own chunk) and rebuilt when the map size changes
  useEffect(() => {
    if (fallback) return;
    let cancelled = false;
    let v = null;
    (async () => {
      try {
        const m = await import('../engine/pixiView');
        if (cancelled) return;
        if (!m.canUsePixi(mapWidth, mapHeight, rendererParam === 'pixi')) throw new Error('no usable GPU WebGL, or map too large');
        v = await m.PixiMapView.create(mapWidth, mapHeight);
        if (cancelled) return v.destroy();
        v.canvas.className = 'main-map-canvas';
        hostRef.current.appendChild(v.canvas);
        canvasRef.current = v.canvas;
        setView(v);
      } catch (err) {
        console.warn('InkForge: falling back to Canvas 2D view.', err);
        if (!cancelled) setFallback(true);
      }
    })();
    return () => {
      cancelled = true;
      if (v) v.destroy();
      setView(null);
    };
  }, [fallback, mapWidth, mapHeight, rendererParam]);

  // Main render trigger
  useEffect(() => {
    const props = {
      width: mapWidth,
      height: mapHeight,
      mapType,
      landmasses,
      brushStrokes,
      liveStroke: strokeOutline && !livePreview ? liveStroke : null,
      landStroke: livePreview ? liveStroke : null,
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
    };
    // one repaint per frame, however many state updates landed in it
    const raf = requestAnimationFrame(() => {
      if (view) {
        view.setQuality(quality, mapWidth, mapHeight);
        view.render(buildPlan(props));
      } else if (fallback && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(canvas.width / mapWidth, 0, 0, canvas.height / mapHeight, 0, 0); // draw in map units at the canvas density
        renderMap({ ctx, cache: true, ...props });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [
    view,
    fallback,
    quality,
    mapWidth,
    mapHeight,
    mapType,
    landmasses,
    brushStrokes,
    liveStroke,
    strokeOutline,
    livePreview,
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

  // Mouse wheel. Plain: cursor-anchored zoom. Shift: size. Ctrl: rotation, 1 degree steps (Ctrl+Shift: 5). Native listener:
  // React's onWheel is passive, so preventDefault (which also stops the browser zooming the page on Ctrl+wheel) would be ignored.
  const viewRef = useRef({ zoom, setZoom, setPanOffset, onWheelAdjust });
  useEffect(() => {
    viewRef.current = { zoom, setZoom, setPanOffset, onWheelAdjust };
  });
  const [marquee, setMarquee] = useState(null); // {x0,y0,x1,y1} in canvas px while rubber-banding stamps
  const [hud, setHud] = useState('');
  const hudTimer = useRef(0);
  useEffect(() => () => clearTimeout(hudTimer.current), []);
  const stepper = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    stepper.current = makeStepper(100);
    const onWheel = (e) => {
      e.preventDefault();
      const { zoom, setZoom, setPanOffset, onWheelAdjust } = viewRef.current;
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        // Shift+wheel arrives as deltaX in some browsers; line and page modes are scaled to pixels
        let delta = e.deltaY || e.deltaX;
        if (e.deltaMode === 1) delta *= 33;
        else if (e.deltaMode === 2) delta *= 400;
        const steps = stepper.current(delta);
        if (!steps || !onWheelAdjust) return;
        const rotate = e.ctrlKey || e.metaKey;
        const label = onWheelAdjust(rotate ? 'rotate' : 'size', steps, rotate && !e.shiftKey);
        if (label) {
          setHud(label);
          clearTimeout(hudTimer.current);
          hudTimer.current = setTimeout(() => setHud(''), 900);
        }
        return;
      }
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
      // each stamp type says how it may turn: 'fixed' stays upright, 'free' spins any angle, otherwise a small lean
      const policy = getStampById(activeStampId)?.rotate;
      if (policy === 'free') finalRot += Math.random() * Math.PI * 2;
      else if (policy !== 'fixed') finalRot += (Math.random() - 0.5) * 0.35;
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
      newStamp.seed = Math.floor(Math.random() * 1e6);
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
      if (selectedPath && pickable(selectedPath, 'paths')) {
        const vi = vertexAt(selectedPath, x, y);
        if (vi >= 0) {
          // the first grab of a dense freehand line replaces it with its thinned spine
          const pts = spineOf(selectedPath).map((q) => [...q]);
          if (pts.length !== selectedPath.points.length) onAddPath({ ...selectedPath, points: pts });
          draggedObjectRef.current = { type: 'vertex', id: selectedPath.id, idx: vi };
          return;
        }
      }
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
        let group = groupIds.includes(selectedStampId) ? groupIds : [];
        if (e.shiftKey) {
          // Shift+click toggles a stamp in or out of the multiselection
          const base = group.length ? group : selectedStampId ? [selectedStampId] : [];
          group = base.includes(clickedStamp.id) ? base.filter((i) => i !== clickedStamp.id) : [...base, clickedStamp.id];
          setGroupIds?.(group);
          setSelectedStampId(group.includes(clickedStamp.id) ? clickedStamp.id : group[group.length - 1] || null);
          setSelectedTextId(null);
          if (setSelectedPathId) setSelectedPathId(null);
          isInteractingRef.current = false;
          return;
        }
        if (!group.includes(clickedStamp.id)) {
          group = [];
          setGroupIds?.([]);
          setSelectedStampId(clickedStamp.id);
        }
        setSelectedTextId(null);
        if (setSelectedPathId) setSelectedPathId(null);
        draggedObjectRef.current = {
          type: 'stamp',
          id: clickedStamp.id,
          offsetX: x - clickedStamp.x,
          offsetY: y - clickedStamp.y,
          // a multiselection moves as one: remember where everyone started
          cursor0: { x, y },
          starts: group.length ? stamps.filter((t) => group.includes(t.id)).map((t) => ({ id: t.id, x: t.x, y: t.y })) : null
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

      // Clicked empty canvas -> clear selections and start a rubber band
      setSelectedStampId(null);
      setGroupIds?.([]);
      setSelectedTextId(null);
      if (setSelectedPathId) setSelectedPathId(null);
      draggedObjectRef.current = { type: 'marquee', x0: x, y0: y };
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
      setLiveStroke({ ...newStroke });
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
      setLiveStroke({ ...newStroke });
    }

    if (activeTool === 'eraser' && onEraseAt) onEraseAt(x, y, brushSize / 2);

    // 4. STAMP TOOL
    if (activeTool === 'stamp') {
      placeStampAt(x, y);
    }

    // 5. PATH TOOL (Rivers, Roads, Walls)
    if (activeTool === 'path' && pathType === 'river' && riverGen) {
      const pts = generateRiver(mapWidth, mapHeight, landmasses, brushStrokes, x, y, Date.now() % 100000);
      isInteractingRef.current = false;
      if (!pts) { setHud('Click on land to start a river'); clearTimeout(hudTimer.current); hudTimer.current = setTimeout(() => setHud(''), 1500); return; }
      onAddPath({ id: 'path_' + Date.now(), type: 'river', color: pathColor, width: pathWidth, points: simplifyPath(pts, 3) });
      onCommitAction?.();
      return;
    }
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
        const onVertex = selectedPath && vertexAt(selectedPath, x, y) >= 0;
        containerRef.current.style.cursor = onVertex ? 'move' : hit === 'rotate' ? 'alias' : hit === 'scale' ? 'nwse-resize' : '';
      }
      return;
    }

    if (activeTool === 'select' && draggedObjectRef.current?.type === 'vertex') {
      const d = draggedObjectRef.current;
      const path = paths.find((q) => q.id === d.id);
      if (path) {
        let nx = Math.round(x);
        let ny = Math.round(y);
        if (grid && grid.snap) ({ x: nx, y: ny } = snapToGrid(nx, ny, grid));
        onAddPath({ ...path, points: path.points.map((q, i) => (i === d.idx ? [nx, ny] : q)) });
      }
      return;
    }

    if (activeTool === 'select' && draggedObjectRef.current?.type === 'marquee') {
      const d = draggedObjectRef.current;
      d.box = { x0: d.x0, y0: d.y0, x1: x, y1: y };
      setMarquee(d.box);
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
      const { type, id, offsetX, offsetY, starts, cursor0 } = draggedObjectRef.current;
      if (starts) {
        const dx = Math.round(x - cursor0.x);
        const dy = Math.round(y - cursor0.y);
        starts.forEach((t) => onUpdateStamp(t.id, { x: t.x + dx, y: t.y + dy }));
        return;
      }
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

      setLiveStroke({ ...activeStrokeRef.current });
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
    if (draggedObjectRef.current?.type === 'marquee') {
      const m = draggedObjectRef.current.box; // a ref: the window listener's closure is stale
      if (m) {
        const [xa, xb] = [Math.min(m.x0, m.x1), Math.max(m.x0, m.x1)];
        const [ya, yb] = [Math.min(m.y0, m.y1), Math.max(m.y0, m.y1)];
        const hit = stamps.filter((t) => pickable(t, 'stamps') && t.x >= xa && t.x <= xb && t.y >= ya && t.y <= yb).map((t) => t.id);
        setGroupIds?.(hit.length > 1 ? hit : []);
        setSelectedStampId(hit[hit.length - 1] ?? null);
      }
      setMarquee(null);
      isInteractingRef.current = false;
      draggedObjectRef.current = null;
      return;
    }
    if (activePathRef.current && activePathRef.current.points.length > 3) {
      const raw = pathStabRef.current?.raw; // the rope lags the cursor, so finish exactly where the pen lifted
      const all = raw ? [...activePathRef.current.points, [Math.round(raw[0]), Math.round(raw[1])]] : activePathRef.current.points;
      const done = { ...activePathRef.current, points: simplifyPath(all, 2.5) };
      onAddPath(done);
    }
    if (isInteractingRef.current) {
      const done = activeStrokeRef.current;
      if (done && (activeTool === 'mask' || activeTool === 'brush') && onCommitStroke) {
        onCommitStroke(done); // adds the stroke and records ONE undo step
        setLiveStroke(null);
      } else if (onCommitAction) {
        onCommitAction();
      }
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
      onDoubleClick={(e) => {
        // Double-click a spine point to delete it, or a spot on the line to add one there
        if (activeTool !== 'select' || !selectedPath || !pickable(selectedPath, 'paths')) return;
        const { x, y } = clientToCanvas(e.clientX, e.clientY);
        const spine = spineOf(selectedPath).map((q) => [...q]);
        const vi = vertexAt(selectedPath, x, y);
        if (vi >= 0) {
          if (spine.length > 2) spine.splice(vi, 1);
        } else {
          const tol = Math.max(10 / zoom, (selectedPath.width || 12) / 2);
          let best = -1;
          let bestD = tol;
          for (let i = 1; i < spine.length; i++) {
            const d = distToSegment(x, y, spine[i - 1][0], spine[i - 1][1], spine[i][0], spine[i][1]);
            if (d <= bestD) { bestD = d; best = i; }
          }
          if (best < 0) return;
          spine.splice(best, 0, [Math.round(x), Math.round(y)]);
        }
        onAddPath({ ...selectedPath, points: spine });
        onCommitAction?.();
      }}
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
        {fallback ? (
          <canvas ref={canvasRef} width={Math.round(mapWidth * drawQuality)} height={Math.round(mapHeight * drawQuality)} style={{ width: mapWidth, height: mapHeight }} className="main-map-canvas" />
        ) : (
          <div ref={hostRef} style={{ width: mapWidth, height: mapHeight }} />
        )}

        {activeTool === 'select' && selectedPath && (
          <svg className="spine-overlay" width={mapWidth} height={mapHeight}>
            {spineOf(selectedPath).map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={VERTEX_R / zoom * 0.7} strokeWidth={1.5 / zoom} className="spine-point" />
            ))}
          </svg>
        )}
        {marquee && (
          <div
            className="marquee-box"
            style={{ left: Math.min(marquee.x0, marquee.x1), top: Math.min(marquee.y0, marquee.y1), width: Math.abs(marquee.x1 - marquee.x0), height: Math.abs(marquee.y1 - marquee.y0) }}
          />
        )}
        {groupIds.includes(selectedStampId) &&
          stamps.filter((t) => groupIds.includes(t.id)).map((t) => {
            const f = stampFrame(t);
            return (
              <div
                key={t.id}
                className="group-box"
                style={{ left: f.center.x - f.w / 2 - 4, top: f.center.y - f.h / 2 - 4, width: f.w + 8, height: f.h + 8, transform: `rotate(${t.rotation || 0}rad)` }}
              />
            );
          })}

        {/* Brush Radius Preview Ring */}
        {brushRing && mousePos.inside && (activeTool === 'mask' || activeTool === 'brush') && (
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

      {hud && <div className="wheel-hud" role="status">{hud}</div>}

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
