// Colour themes. Each one is a block of CSS variables under :root[data-theme="<id>"] in App.css.
export const THEMES = [
  { id: 'dark', name: 'Candlelit', desc: 'Warm ink on a dark desk. The default.', swatch: ['#14100c', '#231b14', '#d9a441', '#f1e6cf'] },
  { id: 'parchment', name: 'Parchment', desc: 'Light vellum with brown ink.', swatch: ['#d8c9a6', '#f1e5c6', '#a8641a', '#3a2a17'] },
  { id: 'orbit', name: 'Orbit', desc: 'The look of the Orbit panel: neutral greys, heaven blue, hell red.', swatch: ['#121214', '#1a1a1e', '#4a86ee', '#d8323d'] }
];

export function loadTheme() {
  try {
    const t = localStorage.getItem('inkforge-theme');
    return THEMES.some((x) => x.id === t) ? t : 'dark';
  } catch { return 'dark'; }
}

export function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  try { localStorage.setItem('inkforge-theme', id); } catch { /* private mode */ }
}
