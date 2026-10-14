import React, { useEffect, useState } from 'react';

// One global tooltip: turns every native title="Name (K)\nDescription" into a styled tip.
// The title is moved to data-tip on hover so the browser's own tooltip never shows.
export default function Tooltip() {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    let timer;
    const hide = () => { clearTimeout(timer); setTip(null); };
    const over = (e) => {
      const el = e.target.closest?.('[title],[data-tip]');
      if (!el) return hide();
      if (el.hasAttribute('title')) {
        el.dataset.tip = el.getAttribute('title');
        el.removeAttribute('title');
      }
      const text = el.dataset.tip;
      if (!text) return hide();
      clearTimeout(timer);
      timer = setTimeout(() => setTip({ text, rect: el.getBoundingClientRect(), side: !!el.closest('.tool-bar') }), 350);
    };
    document.addEventListener('mouseover', over);
    document.addEventListener('mousedown', hide);
    document.addEventListener('keydown', hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mousedown', hide);
      document.removeEventListener('keydown', hide);
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
