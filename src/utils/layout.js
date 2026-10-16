// The user's choice of where the panels sit. Saved in the browser like the theme and the key bindings.

export const DEFAULT_LAYOUT = { toolbarSide: 'left', panelSide: 'right', panelWidth: 320, statusBar: true };
export const PANEL_MIN = 240;
export const PANEL_MAX = 560;
const KEY = 'inkforge-layout';

/** Saved layout over the defaults; anything malformed in storage is ignored. */
export function loadLayout() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    const out = { ...DEFAULT_LAYOUT };
    if (s.toolbarSide === 'left' || s.toolbarSide === 'right') out.toolbarSide = s.toolbarSide;
    if (s.panelSide === 'left' || s.panelSide === 'right') out.panelSide = s.panelSide;
    if (Number.isFinite(s.panelWidth)) out.panelWidth = Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(s.panelWidth)));
    if (typeof s.statusBar === 'boolean') out.statusBar = s.statusBar;
    return out;
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

export function saveLayout(layout) {
  try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch { /* private mode */ }
}

/** Flex order of [toolbar, canvas, panel] across the workspace for a layout. */
export function orderOf({ toolbarSide, panelSide }) {
  const slots = { toolbar: toolbarSide === 'left' ? 0 : 3, stage: 2, panel: panelSide === 'left' ? 1 : 4 };
  if (toolbarSide === 'left' && panelSide === 'left') return { ...slots, toolbar: 0, panel: 1 };
  if (toolbarSide === 'right' && panelSide === 'right') return { ...slots, panel: 3, toolbar: 4 };
  if (toolbarSide === 'right' && panelSide === 'left') return { ...slots, panel: 0, toolbar: 4 };
  return { ...slots, toolbar: 0, panel: 4 };
}

/** Put the layout on the page: data attributes for CSS, and the flex order and panel width as custom properties. */
export function applyLayout(layout, root = document.documentElement) {
  const o = orderOf(layout);
  root.dataset.panelSide = layout.panelSide;
  root.dataset.toolbarSide = layout.toolbarSide;
  root.dataset.statusBar = layout.statusBar ? 'on' : 'off';
  root.style.setProperty('--panel-w', layout.panelWidth + 'px');
  root.style.setProperty('--order-toolbar', String(o.toolbar));
  root.style.setProperty('--order-stage', String(o.stage));
  root.style.setProperty('--order-panel', String(o.panel));
}
