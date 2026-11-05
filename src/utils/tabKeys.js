// Keyboard support for a role="tablist": each tab carries data-tab="<id>".
/** Arrow / Home / End move between tabs of a role="tablist" and select them (automatic activation). */
export function tabKeys(e, ids, current, select) {
  const i = ids.indexOf(current);
  const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  const id = ids[(next + ids.length) % ids.length];
  select(id);
  const list = e.currentTarget;
  requestAnimationFrame(() => list.querySelector(`[data-tab="${CSS.escape(id)}"]`)?.focus());
}
