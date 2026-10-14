import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ToolBar from './components/ToolBar';
import ToolOptions from './components/ToolOptions';
import StampDrawer from './components/StampDrawer';
import CanvasArea from './components/CanvasArea';
import StampImportDialog from './components/StampImportDialog';
import PrintDialog from './components/PrintDialog';
import { DEFAULT_LAYERS } from './components/LayersPanel';
import { exportPrintPdf } from './utils/printUtils';
import { saveAutosave, loadAutosave, hydrateStamps } from './utils/autosave';
import { PRESET_MAPS } from './engine/presetMaps';
import {
  exportToPng,
  exportToHighResPng,
  exportToUniversalVtt,
  exportLayersZip,
  exportToJson,
  importFromJson
} from './utils/exportUtils';
import { renderMap } from './engine/renderer';
import './App.css';

const DEFAULT_COASTLINE = {
  ripplesEnabled: true,
  rippleCount: 3,
  rippleSpacing: 9,
  rippleColor: '#38bdf8',
  rippleOpacity: 0.28,
  sandEnabled: true,
  sandWidth: 7,
  sandColor: '#d4b276',
  outlineColor: '#2b2318',
  outlineWidth: 2.5,
  shadowEnabled: true,
  shadowBlur: 14,
  shadowColor: 'rgba(5, 18, 38, 0.45)'
};

export default function App() {
  const defaultPreset = PRESET_MAPS[0]; // The Shattered Archipelago

  // Map settings
  const [mapTitle, setMapTitle] = useState(defaultPreset.title);
  const [mapType, setMapType] = useState(defaultPreset.type);
  const [mapWidth, setMapWidth] = useState(defaultPreset.width);
  const [mapHeight, setMapHeight] = useState(defaultPreset.height);
  const [landmasses, setLandmasses] = useState(defaultPreset.landmasses || []);
  const [brushStrokes, setBrushStrokes] = useState([]);
  const [stamps, setStamps] = useState(defaultPreset.stamps || []);
  const [paths, setPaths] = useState(defaultPreset.paths || []);
  const [texts, setTexts] = useState(defaultPreset.texts || []);
  const [grid, setGrid] = useState(defaultPreset.grid);
  const [atmosphere, setAtmosphere] = useState(defaultPreset.atmosphere);
  const [coastline, setCoastline] = useState(defaultPreset.coastline || DEFAULT_COASTLINE);

  // Layer panel: per-layer visibility / opacity / blend, and the user's stamp library
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [customStamps, setCustomStamps] = useState([]);
  const [activeLayer, setActiveLayer] = useState(''); // custom layer new objects are drawn on ('' = built-in layers)
  const [dialog, setDialog] = useState(null); // 'stamps' | 'print' | null
  const layerVisibility = {
    ...Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.visible])),
    atmosphere: true
  };
  const layerStyle = layers;

  // Undo / Redo history: one object so index and list always move together
  const [hist, setHist] = useState({
    list: [
      {
        landmasses: defaultPreset.landmasses || [],
        brushStrokes: [],
        stamps: defaultPreset.stamps || [],
        paths: defaultPreset.paths || [],
        texts: defaultPreset.texts || []
      }
    ],
    index: 0
  });
  const history = hist.list;
  const historyIndex = hist.index;
  const resetHistory = (snapshot) => {
    clearTimeout(pendingRef.current);
    pendingRef.current = null;
    setHist({ list: [snapshot], index: 0 });
  };

  // Active Tool & UI States
  const [activeTool, setActiveTool] = useState('select');
  const [isStampDrawerOpen, setIsStampDrawerOpen] = useState(true);

  // Tool Specific Options
  const [maskMode, setMaskMode] = useState('land');
  const [maskShape, setMaskShape] = useState('rough');
  const [maskRoughness, setMaskRoughness] = useState(0.5);

  const [brushSize, setBrushSize] = useState(60);
  const [activeBiome, setActiveBiome] = useState('grassland');
  const [brushOpacity, setBrushOpacity] = useState(0.85);
  const [brushTarget, setBrushTarget] = useState('foreground');
  const [brushSoftness, setBrushSoftness] = useState(0.4);
  const [brushBlendMode, setBrushBlendMode] = useState('source-over');

  const [activeStampId, setActiveStampId] = useState('mountain_grand');
  const [stampScale, setStampScale] = useState(1.0);
  const [stampRotation, setStampRotation] = useState(0);
  const [stampJitter, setStampJitter] = useState(true);
  const [stampSpray, setStampSpray] = useState(false);

  const [pathType, setPathType] = useState('river');
  const [pathWidth, setPathWidth] = useState(12);
  const [pathDashed, setPathDashed] = useState(false);
  const [pathColor, setPathColor] = useState('#2563eb');

  const [newTextContent, setNewTextContent] = useState('');
  const [textFont, setTextFont] = useState('Cinzel');
  const [textSize, setTextSize] = useState(32);
  const [textCurvature, setTextCurvature] = useState(0);
  const [textColor, setTextColor] = useState('#271b12');
  const [textStroke, setTextStroke] = useState('#ffffff');

  // Selection states
  const [selectedStampId, setSelectedStampId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [selectedPathId, setSelectedPathId] = useState(null);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState(0.65);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Latest document state, readable from timers and handlers without stale closures
  const docRef = useRef({ landmasses, brushStrokes, stamps, paths, texts });
  useEffect(() => {
    docRef.current = { landmasses, brushStrokes, stamps, paths, texts };
  });
  const pendingRef = useRef(null);

  // Record a snapshot; no-op when nothing changed (e.g. a click that only selected)
  const recordHistory = useCallback((newState) => {
    const snapshot = { ...docRef.current, ...newState };
    setHist((h) => {
      const cur = h.list[h.index];
      if (Object.keys(snapshot).every((k) => snapshot[k] === cur[k])) return h;
      const list = [...h.list.slice(0, h.index + 1), snapshot];
      return { list, index: list.length - 1 };
    });
  }, []);

  // Slider/colour edits fire many updates; fold them into one undo step
  const flushPending = useCallback(() => {
    if (pendingRef.current === null) return;
    clearTimeout(pendingRef.current);
    pendingRef.current = null;
    recordHistory();
  }, [recordHistory]);
  const scheduleCommit = useCallback(() => {
    clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      pendingRef.current = null;
      recordHistory();
    }, 400);
  }, [recordHistory]);

  // Atomic commit on mouse release
  const handleCommitAction = useCallback(() => {
    flushPending();
    recordHistory();
  }, [flushPending, recordHistory]);

  // Undo / Redo handlers
  const histRef = useRef(hist);
  useEffect(() => {
    histRef.current = hist;
  });

  const restore = useCallback((snap) => {
    setLandmasses(snap.landmasses);
    setBrushStrokes(snap.brushStrokes);
    setStamps(snap.stamps);
    setPaths(snap.paths);
    setTexts(snap.texts);
    setSelectedStampId(null);
    setSelectedTextId(null);
    setSelectedPathId(null);
  }, []);

  const handleUndo = useCallback(() => {
    const { list, index } = histRef.current;
    if (pendingRef.current !== null) {
      // unrecorded edits: undo drops them back to the last recorded state
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
      restore(list[index]);
    } else if (index > 0) {
      restore(list[index - 1]);
      setHist({ list, index: index - 1 });
    }
  }, [restore]);

  const handleRedo = useCallback(() => {
    const { list, index } = histRef.current;
    if (index < list.length - 1) {
      restore(list[index + 1]);
      setHist({ list, index: index + 1 });
    }
  }, [restore]);

  // Selection mutations: compute the new array from current state, then set + record (no side effects in updaters)
  const commitStamps = (updated) => {
    setStamps(updated);
    recordHistory({ stamps: updated });
  };
  const commitTexts = (updated) => {
    setTexts(updated);
    recordHistory({ texts: updated });
  };

  const handleDeleteSelected = useCallback(() => {
    const { stamps: st, texts: tx, paths: pa } = docRef.current;
    if (selectedStampId) {
      const updated = st.filter((s) => s.id !== selectedStampId);
      setStamps(updated);
      recordHistory({ stamps: updated });
      setSelectedStampId(null);
    } else if (selectedTextId) {
      const updated = tx.filter((t) => t.id !== selectedTextId);
      setTexts(updated);
      recordHistory({ texts: updated });
      setSelectedTextId(null);
    } else if (selectedPathId) {
      const updated = pa.filter((p) => p.id !== selectedPathId);
      setPaths(updated);
      recordHistory({ paths: updated });
      setSelectedPathId(null);
    }
  }, [selectedStampId, selectedTextId, selectedPathId, recordHistory]);

  const handleDuplicateSelected = () => {
    if (selectedStampId) {
      const target = stamps.find((s) => s.id === selectedStampId);
      if (!target) return;
      const clone = { ...target, id: 'stamp_' + Date.now(), x: target.x + 35, y: target.y + 35 };
      commitStamps([...stamps, clone]);
      setSelectedStampId(clone.id);
    } else if (selectedTextId) {
      const target = texts.find((t) => t.id === selectedTextId);
      if (!target) return;
      const clone = { ...target, id: 'text_' + Date.now(), x: target.x + 30, y: target.y + 30 };
      commitTexts([...texts, clone]);
      setSelectedTextId(clone.id);
    }
  };

  const handleBringToFront = () => {
    if (!selectedStampId) return;
    const maxZ = Math.max(...stamps.map((s) => s.zIndex || 0), 0);
    commitStamps(stamps.map((s) => (s.id === selectedStampId ? { ...s, zIndex: maxZ + 1 } : s)));
  };

  const handleSendToBack = () => {
    if (!selectedStampId) return;
    const minZ = Math.min(...stamps.map((s) => s.zIndex || 0), 0);
    commitStamps(stamps.map((s) => (s.id === selectedStampId ? { ...s, zIndex: minZ - 1 } : s)));
  };

  const handleFlipStamp = (axis) => {
    if (!selectedStampId) return;
    commitStamps(
      stamps.map((s) =>
        s.id !== selectedStampId ? s : axis === 'x' ? { ...s, flipX: !s.flipX } : { ...s, flipY: !s.flipY }
      )
    );
  };

  const handleUpdateSelectedStamp = useCallback((updates) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === selectedStampId ? { ...s, ...updates } : s))
    );
    scheduleCommit();
  }, [selectedStampId, scheduleCommit]);

  const handleUpdateSelectedText = useCallback((updates) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === selectedTextId ? { ...t, ...updates } : t))
    );
    scheduleCommit();
  }, [selectedTextId, scheduleCommit]);

  const handleUpdateSelectedPath = useCallback((updates) => {
    setPaths((prev) =>
      prev.map((p) => (p.id === selectedPathId ? { ...p, ...updates } : p))
    );
    scheduleCommit();
  }, [selectedPathId, scheduleCommit]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const mod = e.ctrlKey || e.metaKey || e.altKey;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.startsWith('Arrow') && (selectedStampId || selectedTextId)) {
        // nudge the selection by 1 px (10 with Shift)
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const move = (o) => ({ x: o.x + dx, y: o.y + dy });
        if (selectedStampId) handleUpdateSelectedStamp(move(docRef.current.stamps.find((t) => t.id === selectedStampId) || { x: 0, y: 0 }));
        else handleUpdateSelectedText(move(docRef.current.texts.find((t) => t.id === selectedTextId) || { x: 0, y: 0 }));
      } else if (!mod && (e.key === '[' || e.key === ']') && selectedStampId) {
        // rotate the selected stamp (15°, 1° with Shift)
        const st = docRef.current.stamps.find((t) => t.id === selectedStampId);
        const deg = (e.shiftKey ? 1 : 15) * (e.key === ']' ? 1 : -1);
        if (st) handleUpdateSelectedStamp({ rotation: Number(((st.rotation || 0) + (deg * Math.PI) / 180).toFixed(3)) });
      } else if (!mod && e.key.toLowerCase() === 'x') {
        // swap Add Land <-> Carve Water (jumps to the Landmass Sculptor if another tool is active)
        setActiveTool('mask');
        setMaskMode((m) => (m === 'land' ? 'water' : 'land'));
      } else if (!mod && e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (!mod && e.key.toLowerCase() === 'm') {
        setActiveTool('mask');
      } else if (!mod && e.key.toLowerCase() === 'b') {
        setActiveTool('brush');
      } else if (!mod && e.key.toLowerCase() === 's') {
        setActiveTool('stamp');
      } else if (!mod && e.key.toLowerCase() === 'p') {
        setActiveTool('path');
      } else if (!mod && e.key.toLowerCase() === 't') {
        setActiveTool('text');
      } else if (!mod && e.key.toLowerCase() === 'g') {
        setActiveTool('grid');
      } else if (!mod && e.key.toLowerCase() === 'a') {
        setActiveTool('atmosphere');
      } else if (!mod && e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
      } else if (!mod && e.key.toLowerCase() === 'h') {
        setActiveTool('hand');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDeleteSelected, selectedStampId, selectedTextId, handleUpdateSelectedStamp, handleUpdateSelectedText]);

  // Load a preset map
  const handleLoadPreset = (presetId) => {
    const found = PRESET_MAPS.find((p) => p.id === presetId);
    if (!found) return;

    setMapTitle(found.title);
    setMapType(found.type);
    setMapWidth(found.width);
    setMapHeight(found.height);
    setLandmasses(found.landmasses || []);
    setBrushStrokes([]);
    setStamps(found.stamps || []);
    setPaths(found.paths || []);
    setTexts(found.texts || []);
    setGrid(found.grid);
    setAtmosphere(found.atmosphere);
    setCoastline(found.coastline || DEFAULT_COASTLINE);
    setSelectedStampId(null);
    setSelectedTextId(null);
    setSelectedPathId(null);

    setLayers(DEFAULT_LAYERS);
    resetHistory({
      landmasses: found.landmasses || [],
      brushStrokes: [],
      stamps: found.stamps || [],
      paths: found.paths || [],
      texts: found.texts || []
    });
  };

  const handleNewMap = () => {
    handleLoadPreset('blank_canvas');
  };

  // Canvas Actions
  const handleAddBrushStroke = (stroke) => {
    setBrushStrokes((prev) => {
      const idx = prev.findIndex((s) => s.id === stroke.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = stroke;
        return copy;
      }
      return [...prev, stroke];
    });
  };

  // Deleting a custom layer sends its objects back to the built-in layers
  const handleDeleteLayer = (key) => {
    const strip = (list) => list.map((o) => (o.layer === key ? { ...o, layer: undefined } : o));
    const next = { stamps: strip(stamps), paths: strip(paths), texts: strip(texts) };
    setStamps(next.stamps);
    setPaths(next.paths);
    setTexts(next.texts);
    setLayers((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== key)));
    if (activeLayer === key) setActiveLayer('');
    recordHistory(next);
  };

  const handleMoveSelectionTo = (key) => {
    const tag = (o) => ({ ...o, layer: key || undefined });
    if (selectedStampId) commitStamps(stamps.map((o) => (o.id === selectedStampId ? tag(o) : o)));
    else if (selectedTextId) commitTexts(texts.map((o) => (o.id === selectedTextId ? tag(o) : o)));
    else if (selectedPathId) {
      const updated = paths.map((o) => (o.id === selectedPathId ? tag(o) : o));
      setPaths(updated);
      recordHistory({ paths: updated });
    }
  };

  // Eraser: drop every brush/mask stroke and path that has a point within r of (x, y)
  const handleEraseAt = (x, y, r) => {
    const near = (pts, size = 0) => pts.some((pt) => {
      const px = Array.isArray(pt) ? pt[0] : pt.x;
      const py = Array.isArray(pt) ? pt[1] : pt.y;
      return Math.hypot(px - x, py - y) <= r + size / 2;
    });
    setBrushStrokes((prev) => {
      const kept = prev.filter((b) => !near(b.points || [], b.size || 0));
      return kept.length === prev.length ? prev : kept;
    });
    setPaths((prev) => {
      const kept = prev.filter((p) => !near(p.points || [], p.width || 0));
      return kept.length === prev.length ? prev : kept;
    });
  };

  const layerTag = () => (activeLayer && layers[activeLayer] ? { layer: activeLayer } : {});

  const handleAddStamp = (stamp) => {
    setStamps((prev) => [...prev, { ...stamp, ...layerTag() }]);
  };

  const handleUpdateStamp = (id, updates) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleAddPath = (path) => {
    setPaths((prev) => {
      const idx = prev.findIndex((p) => p.id === path.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...path, ...(prev[idx].layer ? { layer: prev[idx].layer } : {}) };
        return copy;
      }
      return [...prev, { ...path, ...layerTag() }];
    });
  };

  const handleAddText = () => {
    if (!newTextContent.trim()) return;
    const newText = {
      id: 'text_' + Date.now(),
      text: newTextContent.trim(),
      x: Math.round(mapWidth / 2),
      y: Math.round(mapHeight / 2),
      size: textSize,
      font: textFont,
      color: textColor,
      stroke: textStroke,
      curvature: textCurvature,
      ...layerTag()
    };

    commitTexts([...texts, newText]);
    setSelectedTextId(newText.id);
    setSelectedStampId(null);
    setSelectedPathId(null);
    setActiveTool('select');
    setNewTextContent('');
  };

  const handleAddCustomStamps = (list) => {
    const added = list.map((x, i) => ({
      id: 'custom_' + Date.now() + '_' + i,
      name: x.name,
      pack: x.pack,
      license: x.license,
      img: x.img,
      dataUrl: x.dataUrl,
      aspect: x.aspect,
      anchor: x.anchor
    }));
    setCustomStamps((prev) => [...prev, ...added]);
    setActiveStampId(added[0].id);
    setActiveTool('stamp');
  };

  const handlePrint = (options) => {
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportPrintPdf({
      mapState: { mapWidth, mapHeight, mapTitle, mapType, landmasses, brushStrokes, stamps, paths, texts, grid, atmosphere, coastline, layerVisibility, layerStyle },
      options,
      filename: `${safeTitle}_print.pdf`
    });
  };

  // Export handlers
  const handleExportPng = (includeGrid = true) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = mapWidth;
    offscreen.height = mapHeight;
    const ctx = offscreen.getContext('2d');

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
      grid: { ...grid, enabled: includeGrid && grid.enabled },
      atmosphere,
      coastline,
      selectedStampId: null,
      selectedTextId: null,
      layerVisibility,
      layerStyle
    });

    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToPng(offscreen, `${safeTitle}.png`);
  };

  const handleExportHighRes = (scaleFactor, includeGrid) => {
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToHighResPng({
      mapState: {
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
        layerVisibility,
        layerStyle
      },
      scaleFactor,
      includeGrid,
      filename: `${safeTitle}_${scaleFactor}x.png`
    });
  };

  const handleExportLayers = (scaleFactor, includeGrid) => {
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportLayersZip({
      mapState: { mapWidth, mapHeight, mapType, landmasses, brushStrokes, stamps, paths, texts, grid, atmosphere, coastline, layerVisibility, layerStyle },
      scaleFactor,
      includeGrid,
      filename: `${safeTitle}_layers.zip`
    });
  };

  const handleExportVtt = () => {
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToUniversalVtt({
      mapState: {
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
        layerVisibility,
        layerStyle
      },
      filename: `${safeTitle}.dd2vtt`
    });
  };

  const buildProject = () => ({
    title: mapTitle,
    type: mapType,
    width: mapWidth,
    height: mapHeight,
    landmasses,
    brushStrokes,
    stamps: stamps.map((s) => ({
      ...s,
      customImage: s.dataUrl || (s.customImage && s.customImage.src) || null
    })),
    paths,
    texts,
    grid,
    atmosphere,
    coastline,
    layers,
    customStamps: customStamps.map(({ img: _img, ...c }) => c)
  });

  const handleExportJson = () => {
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToJson(buildProject(), `${safeTitle}.inkforge`);
  };

  // Load a parsed project (from a file or from autosave) into state and reset history
  const applyProject = (data) => {
    setMapTitle(data.title || 'Imported Realm');
    setMapType(data.type || 'world');
    setMapWidth(data.width || 1920);
    setMapHeight(data.height || 1080);
    setLandmasses(data.landmasses || []);
    setBrushStrokes(data.brushStrokes || []);
    const loadedStamps = hydrateStamps(data.stamps || []);
    setStamps(loadedStamps);
    setPaths(data.paths || []);
    setTexts(data.texts || []);
    if (data.grid) setGrid(data.grid);
    if (data.atmosphere) setAtmosphere(data.atmosphere);
    if (data.coastline) setCoastline(data.coastline);
    setLayers({ ...DEFAULT_LAYERS, ...(data.layers || {}) });
    setCustomStamps(
      (data.customStamps || []).map((c) => {
        const img = new Image();
        img.src = c.dataUrl;
        return { ...c, img };
      })
    );
    setSelectedStampId(null);
    setSelectedTextId(null);
    setSelectedPathId(null);
    resetHistory({
      landmasses: data.landmasses || [],
      brushStrokes: data.brushStrokes || [],
      stamps: loadedStamps,
      paths: data.paths || [],
      texts: data.texts || []
    });
  };

  const handleImportJson = async (file) => {
    try {
      const data = await importFromJson(file);
      if (data) applyProject(data);
    } catch {
      alert('Could not open file: invalid .inkforge JSON format.');
    }
  };

  // Autosave to IndexedDB (debounced) and restore the last session on first load
  const [autosaveStatus, setAutosaveStatus] = useState('');
  const applyRef = useRef(null);
  useEffect(() => {
    applyRef.current = applyProject;
  });
  useEffect(() => {
    let cancelled = false;
    loadAutosave().then((data) => {
      if (cancelled || !data) return;
      applyRef.current(data);
      setAutosaveStatus('Restored last session');
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const restoredRef = useRef(false);
  useEffect(() => {
    // skip the very first run so the default preset never overwrites a saved session before it loads
    if (!restoredRef.current) {
      restoredRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      saveAutosave(buildProject())
        .then(() => setAutosaveStatus('Autosaved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))
        .catch(() => setAutosaveStatus('Autosave failed (storage full?)'));
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapTitle, mapType, mapWidth, mapHeight, landmasses, brushStrokes, stamps, paths, texts, grid, atmosphere, coastline, layers, customStamps]);

  const fitToScreen = () => {
    setZoom(0.65);
    setPanOffset({ x: 0, y: 0 });
  };

  const selectedStamp = stamps.find((s) => s.id === selectedStampId);
  const selectedText = texts.find((t) => t.id === selectedTextId);
  const selectedPath = paths.find((p) => p.id === selectedPathId);

  return (
    <div className="inkforge-app">
      {/* Top Header */}
      <Header
        mapTitle={mapTitle}
        setMapTitle={setMapTitle}
        mapType={mapType}
        setMapType={setMapType}
        zoom={zoom}
        setZoom={setZoom}
        fitToScreen={fitToScreen}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        gridEnabled={grid.enabled}
        setGridEnabled={(val) => setGrid((prev) => ({ ...prev, enabled: typeof val === 'function' ? val(prev.enabled) : val }))}
        onExportPng={handleExportPng}
        onExportHighRes={handleExportHighRes}
        onExportLayers={handleExportLayers}
        onExportVtt={handleExportVtt}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onLoadPreset={handleLoadPreset}
        onNewMap={handleNewMap}
        onPrint={() => setDialog('print')}
      />

      {/* Main Studio Workspace */}
      <div className="studio-workspace">
        <ToolBar activeTool={activeTool} setActiveTool={setActiveTool} />

        <div className="center-stage">
          <ToolOptions
            activeTool={activeTool}
            maskMode={maskMode}
            setMaskMode={setMaskMode}
            maskShape={maskShape}
            setMaskShape={setMaskShape}
            maskRoughness={maskRoughness}
            setMaskRoughness={setMaskRoughness}
            coastlineConfig={coastline}
            setCoastlineConfig={setCoastline}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            activeBiome={activeBiome}
            setActiveBiome={setActiveBiome}
            brushOpacity={brushOpacity}
            setBrushOpacity={setBrushOpacity}
            brushTarget={brushTarget}
            setBrushTarget={setBrushTarget}
            brushSoftness={brushSoftness}
            setBrushSoftness={setBrushSoftness}
            brushBlendMode={brushBlendMode}
            setBrushBlendMode={setBrushBlendMode}
            activeStampId={activeStampId}
            stampScale={stampScale}
            setStampScale={setStampScale}
            stampRotation={stampRotation}
            setStampRotation={setStampRotation}
            stampJitter={stampJitter}
            setStampJitter={setStampJitter}
            stampSpray={stampSpray}
            setStampSpray={setStampSpray}
            onFlipStamp={handleFlipStamp}
            pathType={pathType}
            setPathType={setPathType}
            pathWidth={pathWidth}
            setPathWidth={setPathWidth}
            pathDashed={pathDashed}
            setPathDashed={setPathDashed}
            pathColor={pathColor}
            setPathColor={setPathColor}
            newTextContent={newTextContent}
            setNewTextContent={setNewTextContent}
            textFont={textFont}
            setTextFont={setTextFont}
            textSize={textSize}
            setTextSize={setTextSize}
            textCurvature={textCurvature}
            setTextCurvature={setTextCurvature}
            textColor={textColor}
            setTextColor={setTextColor}
            textStroke={textStroke}
            setTextStroke={setTextStroke}
            onAddText={handleAddText}
            gridConfig={grid}
            setGridConfig={setGrid}
            atmosphereConfig={atmosphere}
            setAtmosphereConfig={setAtmosphere}
            selectedStamp={selectedStamp}
            selectedText={selectedText}
            selectedPath={selectedPath}
            onUpdateSelectedStamp={handleUpdateSelectedStamp}
            onUpdateSelectedText={handleUpdateSelectedText}
            onUpdateSelectedPath={handleUpdateSelectedPath}
            onDeleteSelected={handleDeleteSelected}
            onDuplicateSelected={handleDuplicateSelected}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
          />

          <CanvasArea
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            mapType={mapType}
            landmasses={landmasses}
            brushStrokes={brushStrokes}
            stamps={stamps}
            paths={paths}
            texts={texts}
            grid={grid}
            atmosphere={atmosphere}
            coastline={coastline}
            activeTool={activeTool}
            maskMode={maskMode}
            maskShape={maskShape}
            maskRoughness={maskRoughness}
            brushSize={brushSize}
            activeBiome={activeBiome}
            brushOpacity={brushOpacity}
            brushTarget={brushTarget}
            brushSoftness={brushSoftness}
            brushBlendMode={brushBlendMode}
            activeStampId={activeStampId}
            stampScale={stampScale}
            stampRotation={stampRotation}
            stampJitter={stampJitter}
            stampSpray={stampSpray}
            pathType={pathType}
            pathWidth={pathWidth}
            pathDashed={pathDashed}
            pathColor={pathColor}
            onAddBrushStroke={handleAddBrushStroke}
            onAddStamp={handleAddStamp}
            onUpdateStamp={handleUpdateStamp}
            onAddPath={handleAddPath}
            onEraseAt={handleEraseAt}
            onCommitAction={handleCommitAction}
            selectedStampId={selectedStampId}
            setSelectedStampId={setSelectedStampId}
            selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId}
            selectedPathId={selectedPathId}
            setSelectedPathId={setSelectedPathId}
            zoom={zoom}
            setZoom={setZoom}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            layerVisibility={layerVisibility}
            layerStyle={layerStyle}
            customStamps={customStamps}
            statusNote={autosaveStatus}
          />
        </div>

        <StampDrawer
          isOpen={isStampDrawerOpen}
          setIsOpen={setIsStampDrawerOpen}
          activeStampId={activeStampId}
          setActiveStampId={setActiveStampId}
          customStamps={customStamps}
          onOpenImport={() => setDialog('stamps')}
          layers={layers}
          setLayers={setLayers}
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          onDeleteLayer={handleDeleteLayer}
          onMoveSelectionTo={handleMoveSelectionTo}
          hasSelection={!!(selectedStampId || selectedTextId || selectedPathId)}
          gridConfig={grid}
          setGridConfig={setGrid}
          atmosphereConfig={atmosphere}
          setAtmosphereConfig={setAtmosphere}
          coastlineConfig={coastline}
          setCoastlineConfig={setCoastline}
        />
      </div>
      {dialog === 'stamps' && <StampImportDialog onClose={() => setDialog(null)} onAdd={handleAddCustomStamps} />}
      {dialog === 'print' && (
        <PrintDialog
          mapWidth={mapWidth}
          mapHeight={mapHeight}
          gridSize={grid.size || 60}
          onClose={() => setDialog(null)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
