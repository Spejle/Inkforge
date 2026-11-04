// Fog of war: the GM paints what the players may see, and a second browser window (the player view) shows the map with
// everything else hidden. The two windows talk over a BroadcastChannel: same browser, same origin, no server.
import { createElement as h, useEffect, useState } from 'react';
import { renderMap } from '../../../engine/renderer.js';
import { sanitizeProject } from '../../../utils/importGuard.js';
import { hydrateStamps } from '../../../utils/autosave.js';

export const CHANNEL = 'inkforge-player';
const FOG_COLOR = '#0b0d12';
const GM_ALPHA = 0.55; // the GM sees through the fog, dimmed

/** Strokes after the last "reveal all" / "hide all": everything before it is covered anyway. */
export function compactFog(strokes) {
  let last = -1;
  strokes.forEach((s, i) => { if (s.all) last = i; });
  return last > 0 ? strokes.slice(last) : strokes;
}

/** Draws the fog over the map: dark everywhere, reveal strokes cut it away, hide strokes paint it back, in order. */
export function drawFog(ctx, width, height, fog, opaque = false) {
  if (!fog || !fog.enabled) return;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  const g = c.getContext('2d');
  g.fillStyle = FOG_COLOR;
  g.fillRect(0, 0, width, height);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const s of compactFog(fog.strokes)) {
    g.globalCompositeOperation = s.mode === 'reveal' ? 'destination-out' : 'source-over';
    g.fillStyle = g.strokeStyle = FOG_COLOR;
    if (s.all) { g.fillRect(0, 0, width, height); continue; }
    g.lineWidth = s.size;
    g.beginPath();
    g.moveTo(s.points[0][0], s.points[0][1]);
    if (s.points.length === 1) g.arc(s.points[0][0], s.points[0][1], s.size / 2, 0, Math.PI * 2);
    else for (const [x, y] of s.points.slice(1)) g.lineTo(x, y);
    if (s.points.length === 1) g.fill(); else g.stroke();
  }
  ctx.save();
  ctx.globalAlpha = opaque ? 1 : GM_ALPHA;
  ctx.drawImage(c, 0, 0, width, height);
  ctx.restore();
}

/** GM side: send the map to any open player window. Returns { send(project), close() }. */
export function openPlayerLink(getProject) {
  const ch = new BroadcastChannel(CHANNEL);
  ch.onmessage = (e) => { if (e.data?.type === 'hello') ch.postMessage({ type: 'map', project: getProject() }); };
  return {
    send: (project) => ch.postMessage({ type: 'map', project }),
    close: () => ch.close()
  };
}

/** Opens the player window (same page, ?player=1). */
export function openPlayerWindow() {
  const url = new URL(window.location.href);
  url.search = '?player=1';
  url.hash = '';
  return window.open(url.toString(), 'inkforge-player', 'popup,width=1280,height=800');
}

/** The player window: the latest map from the GM, fitted to the window, fog fully opaque, no selection or editing. */
export function PlayerView() {
  const [canvas, setCanvas] = useState(null); // state, not a ref: the draw effect re-runs once the canvas mounts
  const [map, setMap] = useState(null);
  const [tick, setTick] = useState(0);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    document.title = 'InkForge: player view';
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e) => {
      if (e.data?.type !== 'map') return;
      const d = sanitizeProject(e.data.project);
      const stamps = hydrateStamps(d.stamps || []);
      for (const s of stamps) if (s.customImage && typeof s.customImage === 'object' && !s.customImage.complete) s.customImage.onload = () => setTick((t) => t + 1);
      setMap({ ...d, stamps });
    };
    ch.postMessage({ type: 'hello' });
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => { ch.close(); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    if (!canvas || !map) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const fit = Math.min(size.w / map.width, size.h / map.height);
    const cw = Math.round(map.width * fit), ch = Math.round(map.height * fit);
    // a DOM element kept in state so the effect re-runs on mount; sizing it is not a state mutation
    Object.assign(canvas, { width: Math.round(cw * dpr), height: Math.round(ch * dpr) });
    Object.assign(canvas.style, { width: `${cw}px`, height: `${ch}px` });
    const ctx = canvas.getContext('2d');
    ctx.setTransform(fit * dpr, 0, 0, fit * dpr, 0, 0);
    const layers = map.layers || {};
    renderMap({
      ctx, width: map.width, height: map.height, mapType: map.type,
      landmasses: map.landmasses, brushStrokes: map.brushStrokes, stamps: map.stamps, paths: map.paths, texts: map.texts,
      grid: map.grid, atmosphere: map.atmosphere, coastline: map.coastline,
      layerVisibility: { background: true, land: true, paths: true, stamps: true, text: true, grid: true, ...Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v?.visible !== false])), atmosphere: true },
      layerStyle: layers,
      fog: map.fog, fogOpaque: true
    });
  }, [canvas, map, size, tick]);

  const page = { position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', font: '15px Inter, sans-serif' };
  return h('div', { style: page }, map ? h('canvas', { ref: setCanvas }) : 'Waiting for the GM: open a map in the InkForge window that opened this one.');
}
