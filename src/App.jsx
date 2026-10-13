import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import ToolBar from './components/ToolBar';
import ToolOptions from './components/ToolOptions';
import StampDrawer from './components/StampDrawer';
import CanvasArea from './components/CanvasArea';
import { PRESET_MAPS } from './engine/presetMaps';
import { exportToPng, exportToJson, importFromJson } from './utils/exportUtils';
import { renderMap } from './engine/renderer';
import './App.css';

export default function App() {
  // Current active map data
  const defaultPreset = PRESET_MAPS[0]; // The Shattered Archipelago
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

  // Undo / Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Active Tool & UI States
  const [activeTool, setActiveTool] = useState('select');
  const [isStampDrawerOpen, setIsStampDrawerOpen] = useState(true);

  // Tool Specific Options
  const [maskMode, setMaskMode] = useState('land');
  const [brushSize, setBrushSize] = useState(60);
  const [activeBiome, setActiveBiome] = useState('grassland');
  const [brushOpacity, setBrushOpacity] = useState(0.85);

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
  const [textColor, setTextColor] = useState('#271b12');
  const [textStroke, setTextStroke] = useState('#ffffff');

  // Selection state
  const [selectedStampId, setSelectedStampId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState(0.65);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Record history snapshot
  const recordHistory = useCallback((newState) => {
    const snapshot = {
      landmasses: newState.landmasses ?? landmasses,
      brushStrokes: newState.brushStrokes ?? brushStrokes,
      stamps: newState.stamps ?? stamps,
      paths: newState.paths ?? paths,
      texts: newState.texts ?? texts
    };

    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [landmasses, brushStrokes, stamps, paths, texts, historyIndex]);

  // Initial snapshot
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{
        landmasses: defaultPreset.landmasses || [],
        brushStrokes: [],
        stamps: defaultPreset.stamps || [],
        paths: defaultPreset.paths || [],
        texts: defaultPreset.texts || []
      }]);
      setHistoryIndex(0);
    }
  }, []);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setLandmasses(prev.landmasses);
      setBrushStrokes(prev.brushStrokes);
      setStamps(prev.stamps);
      setPaths(prev.paths);
      setTexts(prev.texts);
      setHistoryIndex(historyIndex - 1);
      setSelectedStampId(null);
      setSelectedTextId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLandmasses(next.landmasses);
      setBrushStrokes(next.brushStrokes);
      setStamps(next.stamps);
      setPaths(next.paths);
      setTexts(next.texts);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Keyboard shortcut listener for Ctrl+Z, Ctrl+Y, tool shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'm') {
        setActiveTool('mask');
      } else if (e.key.toLowerCase() === 'b') {
        setActiveTool('brush');
      } else if (e.key.toLowerCase() === 's') {
        setActiveTool('stamp');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('path');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      } else if (e.key.toLowerCase() === 'g') {
        setActiveTool('grid');
      } else if (e.key.toLowerCase() === 'a') {
        setActiveTool('atmosphere');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('hand');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedStampId, selectedTextId]);

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
    setSelectedStampId(null);
    setSelectedTextId(null);

    setHistory([{
      landmasses: found.landmasses || [],
      brushStrokes: [],
      stamps: found.stamps || [],
      paths: found.paths || [],
      texts: found.texts || []
    }]);
    setHistoryIndex(0);
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

  const handleAddStamp = (stamp) => {
    setStamps((prev) => {
      const updated = [...prev, stamp];
      recordHistory({ stamps: updated });
      return updated;
    });
  };

  const handleUpdateStamp = (id, updates) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleAddPath = (path) => {
    setPaths((prev) => {
      const idx = prev.findIndex((p) => p.id === path.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = path;
        return copy;
      }
      const updated = [...prev, path];
      return updated;
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
      curved: false
    };

    setTexts((prev) => {
      const updated = [...prev, newText];
      recordHistory({ texts: updated });
      return updated;
    });
    setSelectedTextId(newText.id);
    setSelectedStampId(null);
    setActiveTool('select');
    setNewTextContent('');
  };

  const handleDeleteSelected = () => {
    if (selectedStampId) {
      setStamps((prev) => {
        const updated = prev.filter((s) => s.id !== selectedStampId);
        recordHistory({ stamps: updated });
        return updated;
      });
      setSelectedStampId(null);
    } else if (selectedTextId) {
      setTexts((prev) => {
        const updated = prev.filter((t) => t.id !== selectedTextId);
        recordHistory({ texts: updated });
        return updated;
      });
      setSelectedTextId(null);
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedStampId) {
      const target = stamps.find((s) => s.id === selectedStampId);
      if (!target) return;
      const clone = {
        ...target,
        id: 'stamp_' + Date.now(),
        x: target.x + 30,
        y: target.y + 30
      };
      setStamps((prev) => {
        const updated = [...prev, clone];
        recordHistory({ stamps: updated });
        return updated;
      });
      setSelectedStampId(clone.id);
    }
  };

  const handleBringToFront = () => {
    if (selectedStampId) {
      setStamps((prev) => {
        const target = prev.find((s) => s.id === selectedStampId);
        if (!target) return prev;
        const maxZ = Math.max(...prev.map((s) => s.zIndex || 0), 0);
        return prev.map((s) => (s.id === selectedStampId ? { ...s, zIndex: maxZ + 1 } : s));
      });
    }
  };

  const handleSendToBack = () => {
    if (selectedStampId) {
      setStamps((prev) => {
        const target = prev.find((s) => s.id === selectedStampId);
        if (!target) return prev;
        const minZ = Math.min(...prev.map((s) => s.zIndex || 0), 0);
        return prev.map((s) => (s.id === selectedStampId ? { ...s, zIndex: minZ - 1 } : s));
      });
    }
  };

  const handleFlipStamp = (axis) => {
    if (selectedStampId) {
      setStamps((prev) =>
        prev.map((s) => {
          if (s.id === selectedStampId) {
            return axis === 'x' ? { ...s, flipX: !s.flipX } : { ...s, flipY: !s.flipY };
          }
          return s;
        })
      );
    }
  };

  const handleUploadCustomStamp = (img, name) => {
    const customId = 'custom_' + Date.now();
    const newStamp = {
      id: customId,
      stampId: customId,
      name: name.replace(/\.[^/.]+$/, ''),
      customImage: img,
      x: Math.round(mapWidth / 2),
      y: Math.round(mapHeight / 2),
      scale: 1.0,
      rotation: 0
    };
    setStamps((prev) => {
      const updated = [...prev, newStamp];
      recordHistory({ stamps: updated });
      return updated;
    });
    setSelectedStampId(newStamp.id);
    setActiveTool('select');
  };

  // Export full map as High-Resolution PNG
  const handleExportPng = () => {
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
      grid,
      atmosphere,
      selectedStampId: null,
      selectedTextId: null
    });

    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToPng(offscreen, `${safeTitle}.png`);
  };

  // Export project JSON
  const handleExportJson = () => {
    const projectData = {
      title: mapTitle,
      type: mapType,
      width: mapWidth,
      height: mapHeight,
      landmasses,
      brushStrokes,
      stamps,
      paths,
      texts,
      grid,
      atmosphere
    };
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToJson(projectData, `${safeTitle}.inkforge`);
  };

  // Import project JSON
  const handleImportJson = async (file) => {
    try {
      const data = await importFromJson(file);
      if (data) {
        setMapTitle(data.title || 'Imported Realm');
        setMapType(data.type || 'world');
        setMapWidth(data.width || 1920);
        setMapHeight(data.height || 1080);
        setLandmasses(data.landmasses || []);
        setBrushStrokes(data.brushStrokes || []);
        setStamps(data.stamps || []);
        setPaths(data.paths || []);
        setTexts(data.texts || []);
        if (data.grid) setGrid(data.grid);
        if (data.atmosphere) setAtmosphere(data.atmosphere);
        setSelectedStampId(null);
        setSelectedTextId(null);

        setHistory([{
          landmasses: data.landmasses || [],
          brushStrokes: data.brushStrokes || [],
          stamps: data.stamps || [],
          paths: data.paths || [],
          texts: data.texts || []
        }]);
        setHistoryIndex(0);
      }
    } catch (err) {
      alert('Could not open file: invalid .inkforge JSON format.');
    }
  };

  const fitToScreen = () => {
    setZoom(0.65);
    setPanOffset({ x: 0, y: 0 });
  };

  const selectedStamp = stamps.find((s) => s.id === selectedStampId);
  const selectedText = texts.find((t) => t.id === selectedTextId);

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
        setGridEnabled={(val) => setGrid((g) => ({ ...g, enabled: typeof val === 'function' ? val(g.enabled) : val }))}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onLoadPreset={handleLoadPreset}
        onNewMap={handleNewMap}
      />

      {/* Contextual Tool Options Ribbon */}
      <ToolOptions
        activeTool={activeTool}
        maskMode={maskMode}
        setMaskMode={setMaskMode}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        activeBiome={activeBiome}
        setActiveBiome={setActiveBiome}
        brushOpacity={brushOpacity}
        setBrushOpacity={setBrushOpacity}
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
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />

      {/* Main Workspace Body */}
      <div className="workspace-container">
        {/* Left Toolbar */}
        <ToolBar activeTool={activeTool} setActiveTool={setActiveTool} />

        {/* Center Interactive Canvas */}
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
          activeTool={activeTool}
          maskMode={maskMode}
          brushSize={brushSize}
          activeBiome={activeBiome}
          brushOpacity={brushOpacity}
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
          selectedStampId={selectedStampId}
          setSelectedStampId={setSelectedStampId}
          selectedTextId={selectedTextId}
          setSelectedTextId={setSelectedTextId}
          zoom={zoom}
          setZoom={setZoom}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
        />

        {/* Right Stamp Drawer */}
        <StampDrawer
          isOpen={isStampDrawerOpen}
          setIsOpen={setIsStampDrawerOpen}
          activeStampId={activeStampId}
          setActiveStampId={(id) => {
            setActiveStampId(id);
            setActiveTool('stamp');
          }}
          onUploadCustomStamp={handleUploadCustomStamp}
        />
      </div>
    </div>
  );
}
