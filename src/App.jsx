import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ToolBar from './components/ToolBar';
import ToolOptions from './components/ToolOptions';
import StampDrawer from './components/StampDrawer';
import CanvasArea from './components/CanvasArea';
import { PRESET_MAPS } from './engine/presetMaps';
import {
  exportToPng,
  exportToHighResPng,
  exportToUniversalVtt,
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

  // Undo / Redo history initialized directly
  const [history, setHistory] = useState([
    {
      landmasses: defaultPreset.landmasses || [],
      brushStrokes: [],
      stamps: defaultPreset.stamps || [],
      paths: defaultPreset.paths || [],
      texts: defaultPreset.texts || []
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

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

  // Record history snapshot helper
  const recordHistory = useCallback(
    (newState) => {
      const snapshot = {
        landmasses: newState?.landmasses ?? landmasses,
        brushStrokes: newState?.brushStrokes ?? brushStrokes,
        stamps: newState?.stamps ?? stamps,
        paths: newState?.paths ?? paths,
        texts: newState?.texts ?? texts
      };

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, snapshot];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [landmasses, brushStrokes, stamps, paths, texts, historyIndex]
  );

  // Atomic commit on mouse release
  const handleCommitAction = useCallback(() => {
    recordHistory();
  }, [recordHistory]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
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
      setSelectedPathId(null);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLandmasses(next.landmasses);
      setBrushStrokes(next.brushStrokes);
      setStamps(next.stamps);
      setPaths(next.paths);
      setTexts(next.texts);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history]);

  // Selection mutations
  const handleDeleteSelected = useCallback(() => {
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
    } else if (selectedPathId) {
      setPaths((prev) => {
        const updated = prev.filter((p) => p.id !== selectedPathId);
        recordHistory({ paths: updated });
        return updated;
      });
      setSelectedPathId(null);
    }
  }, [selectedStampId, selectedTextId, selectedPathId, recordHistory]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedStampId) {
      const target = stamps.find((s) => s.id === selectedStampId);
      if (!target) return;
      const clone = {
        ...target,
        id: 'stamp_' + Date.now(),
        x: target.x + 35,
        y: target.y + 35
      };
      setStamps((prev) => {
        const updated = [...prev, clone];
        recordHistory({ stamps: updated });
        return updated;
      });
      setSelectedStampId(clone.id);
    } else if (selectedTextId) {
      const target = texts.find((t) => t.id === selectedTextId);
      if (!target) return;
      const clone = {
        ...target,
        id: 'text_' + Date.now(),
        x: target.x + 30,
        y: target.y + 30
      };
      setTexts((prev) => {
        const updated = [...prev, clone];
        recordHistory({ texts: updated });
        return updated;
      });
      setSelectedTextId(clone.id);
    }
  }, [selectedStampId, selectedTextId, stamps, texts, recordHistory]);

  const handleBringToFront = useCallback(() => {
    if (selectedStampId) {
      setStamps((prev) => {
        const target = prev.find((s) => s.id === selectedStampId);
        if (!target) return prev;
        const maxZ = Math.max(...prev.map((s) => s.zIndex || 0), 0);
        const updated = prev.map((s) => (s.id === selectedStampId ? { ...s, zIndex: maxZ + 1 } : s));
        recordHistory({ stamps: updated });
        return updated;
      });
    }
  }, [selectedStampId, recordHistory]);

  const handleSendToBack = useCallback(() => {
    if (selectedStampId) {
      setStamps((prev) => {
        const target = prev.find((s) => s.id === selectedStampId);
        if (!target) return prev;
        const minZ = Math.min(...prev.map((s) => s.zIndex || 0), 0);
        const updated = prev.map((s) => (s.id === selectedStampId ? { ...s, zIndex: minZ - 1 } : s));
        recordHistory({ stamps: updated });
        return updated;
      });
    }
  }, [selectedStampId, recordHistory]);

  const handleFlipStamp = useCallback(
    (axis) => {
      if (selectedStampId) {
        setStamps((prev) => {
          const updated = prev.map((s) => {
            if (s.id === selectedStampId) {
              return axis === 'x' ? { ...s, flipX: !s.flipX } : { ...s, flipY: !s.flipY };
            }
            return s;
          });
          recordHistory({ stamps: updated });
          return updated;
        });
      }
    },
    [selectedStampId, recordHistory]
  );

  const handleUpdateSelectedStamp = useCallback((updates) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === selectedStampId ? { ...s, ...updates } : s))
    );
  }, [selectedStampId]);

  const handleUpdateSelectedText = useCallback((updates) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === selectedTextId ? { ...t, ...updates } : t))
    );
  }, [selectedTextId]);

  const handleUpdateSelectedPath = useCallback((updates) => {
    setPaths((prev) =>
      prev.map((p) => (p.id === selectedPathId ? { ...p, ...updates } : p))
    );
  }, [selectedPathId]);

  // Keyboard shortcut listener
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
  }, [handleUndo, handleRedo, handleDeleteSelected]);

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

    setHistory([
      {
        landmasses: found.landmasses || [],
        brushStrokes: [],
        stamps: found.stamps || [],
        paths: found.paths || [],
        texts: found.texts || []
      }
    ]);
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
    setStamps((prev) => [...prev, stamp]);
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
        copy[idx] = path;
        return copy;
      }
      return [...prev, path];
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
      curvature: textCurvature
    };

    setTexts((prev) => {
      const updated = [...prev, newText];
      recordHistory({ texts: updated });
      return updated;
    });
    setSelectedTextId(newText.id);
    setSelectedStampId(null);
    setSelectedPathId(null);
    setActiveTool('select');
    setNewTextContent('');
  };

  const handleUploadCustomStamp = (img, name, dataUrl) => {
    const customId = 'custom_' + Date.now();
    const newStamp = {
      id: customId,
      stampId: customId,
      name: name.replace(/\.[^/.]+$/, ''),
      customImage: img,
      dataUrl: dataUrl,
      x: Math.round(mapWidth / 2),
      y: Math.round(mapHeight / 2),
      scale: 1.0,
      rotation: 0,
      zIndex: 0
    };
    setStamps((prev) => {
      const updated = [...prev, newStamp];
      recordHistory({ stamps: updated });
      return updated;
    });
    setSelectedStampId(newStamp.id);
    setActiveTool('select');
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
      selectedTextId: null
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
        coastline
      },
      scaleFactor,
      includeGrid,
      filename: `${safeTitle}_${scaleFactor}x.png`
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
        atmosphere
      },
      filename: `${safeTitle}.dd2vtt`
    });
  };

  const handleExportJson = () => {
    const projectData = {
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
      coastline
    };
    const safeTitle = mapTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    exportToJson(projectData, `${safeTitle}.inkforge`);
  };

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
        if (data.coastline) setCoastline(data.coastline);
        setSelectedStampId(null);
        setSelectedTextId(null);
        setSelectedPathId(null);

        setHistory([
          {
            landmasses: data.landmasses || [],
            brushStrokes: data.brushStrokes || [],
            stamps: data.stamps || [],
            paths: data.paths || [],
            texts: data.texts || []
          }
        ]);
        setHistoryIndex(0);
      }
    } catch {
      alert('Could not open file: invalid .inkforge JSON format.');
    }
  };

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
        onExportVtt={handleExportVtt}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onLoadPreset={handleLoadPreset}
        onNewMap={handleNewMap}
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
          />
        </div>

        <StampDrawer
          isOpen={isStampDrawerOpen}
          setIsOpen={setIsStampDrawerOpen}
          activeStampId={activeStampId}
          setActiveStampId={setActiveStampId}
          onUploadCustomStamp={handleUploadCustomStamp}
          gridConfig={grid}
          setGridConfig={setGrid}
          atmosphereConfig={atmosphere}
          setAtmosphereConfig={setAtmosphere}
          coastlineConfig={coastline}
          setCoastlineConfig={setCoastline}
        />
      </div>
    </div>
  );
}
