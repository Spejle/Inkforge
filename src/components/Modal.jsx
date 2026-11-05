import React, { useEffect, useId, useRef, useState } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusables = (root) => [...root.querySelectorAll(FOCUSABLE)].filter((el) => !el.hidden && el.getClientRects().length > 0);

/**
 * A modal dialog: role="dialog" + aria-modal, labelled by its <h2> heading (pass `titleId` to the heading via the
 * render prop, or let the dialog use `label`). Moves focus in on open (an [autofocus] control, else the dialog itself),
 * keeps Tab inside, closes on Escape and on a backdrop click, and gives focus back to whatever opened it.
 */
export default function Modal({ label, className = '', onClose, children, ...rest }) {
  const ref = useRef(null);
  const titleId = useId();
  // read during the first render: a child's autoFocus moves focus before any effect runs
  const [opener] = useState(() => document.activeElement);
  const returnRef = useRef(undefined);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const node = ref.current;
    // opened from inside a dialog that has just closed (Export -> Print): that dialog already sent focus back to its
    // own opener, so return there
    // (worked out once: StrictMode's second run would find focus already inside)
    if (returnRef.current === undefined) {
      returnRef.current = opener?.isConnected ? opener : node.contains(document.activeElement) ? null : document.activeElement;
    }
    const returnTo = returnRef.current;
    if (!node.contains(document.activeElement)) (node.querySelector('[autofocus]') || node).focus();
    // focus that lands outside (a click on the backdrop, a script) comes back in
    const onFocusIn = (e) => { if (!node.contains(e.target)) node.focus(); };
    // on the document, not the dialog: if the focused control unmounts, focus falls to <body> and Tab must still wrap
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // the editor's own shortcuts listen on window
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables(node);
      if (list.length === 0) { e.preventDefault(); node.focus(); return; }
      const first = list[0], last = list[list.length - 1];
      const at = document.activeElement;
      if (!node.contains(at)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && (at === first || at === node)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
      // only on a real close (the dialog has left the page; StrictMode's trial unmount leaves it in place), and only to
      // an opener that is still on screen. The next dialog (Export -> Print) then takes focus from here.
      if (!node.isConnected && returnTo instanceof HTMLElement && returnTo.isConnected && returnTo !== document.body) returnTo.focus();
    };
  }, [opener]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className={`dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={label ? undefined : titleId}
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        {typeof children === 'function' ? children(titleId) : children}
      </div>
    </div>
  );
}
