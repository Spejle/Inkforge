import React, { useEffect, useState } from 'react';

// One global tooltip: turns every native title="Name (K)\nDescription" into a styled tip.
// The title is moved to data-tip on hover so the browser's own tooltip never shows. The title was also the accessible
// name (icon-only buttons) or description of the element, so that is kept as aria-label / aria-description.
// Keyboard focus shows the same tip.
function adopt(el) {
  const title = el.getAttribute('title');
  el.dataset.tip = title;
  el.removeAttribute('title');
  if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) {
    if (!el.hasAttribute('aria-description')) el.setAttribute('aria-description', title.replace(/\n/g, '. '));
  } else if (!(el.textContent || '').trim()) {
    el.setAttribute('aria-label', title.split('\n')[0]);
  } else if (!el.hasAttribute('aria-description')) {
    el.setAttribute('aria-description', title.replace(/\n/g, '. '));
  }
}

export default function Tooltip() {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    let timer;
    const hide = () => { clearTimeout(timer); setTip(null); };
    const show = (e, delay) => {
      const el = e.target.closest?.('[title],[data-tip]');
      if (!el) return hide();
      if (el.hasAttribute('title')) adopt(el);
      const text = el.dataset.tip;
      if (!text) return hide();
      clearTimeout(timer);
      timer = setTimeout(() => setTip({ text, rect: el.getBoundingClientRect(), side: !!el.closest('.tool-bar') }), delay);
    };
    const over = (e) => show(e, 350);
    // only keyboard focus: a mouse click also focuses, and that tip would cover what was just clicked
    const focus = (e) => { if (e.target.matches?.(':focus-visible')) show(e, 150); else hide(); };
    const key = (e) => { if (e.key !== 'Tab' && e.key !== 'Shift') hide(); };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', hide);
    document.addEventListener('mousedown', hide);
    document.addEventListener('keydown', key);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('mousedown', hide);
      document.removeEventListener('keydown', key);
    };
  }, []);

  if (!tip) return null;
  const [head, ...rest] = tip.text.split('\n');
  const m = head.match(/^(.*?)\s*\(([^()]{1,12})\)$/);
  const { rect } = tip;
  const below = rect.top < 80;
  const left = Math.min(Math.max(rect.left + rect.width / 2, 130), window.innerWidth - 130);
  const style = tip.side ? { left: rect.right + 10, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' } : below ? { left, top: rect.bottom + 8 } : { left, top: rect.top - 8, transform: 'translate(-50%, -100%)' };
  return (
    <div className="tip" role="tooltip" style={style}>
      <div className="tip-head">
        <span>{m ? m[1] : head}</span>
        {m && <kbd>{m[2]}</kbd>}
      </div>
      {rest.length > 0 && <div className="tip-body">{rest.join(' ')}</div>}
    </div>
  );
}
