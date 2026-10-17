// Viewer preference: offer the built-in (AI-written) stamp catalog or not.
import { useSyncExternalStore } from 'react';

const KEY = 'inkforge.stamps';
let prefs = (() => {
  try { return { builtin: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { builtin: true }; }
})();
const subs = new Set();
export function setStampPref(k, v) {
  prefs = { ...prefs, [k]: v };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* session only */ }
  subs.forEach((f) => f());
}
export const useStampPrefs = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => prefs);
