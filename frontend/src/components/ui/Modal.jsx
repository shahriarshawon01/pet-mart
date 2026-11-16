import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { lockScroll, unlockScroll } from '../../lib/scroll';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = 'max-w-lg' }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  // Keep latest onClose without re-running the open/close effect on every render
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const els = panelRef.current.querySelectorAll(FOCUSABLE);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    lockScroll();
    const t = setTimeout(() => {
      const target =
        panelRef.current?.querySelector('[data-autofocus]') ||
        panelRef.current?.querySelector('input, select, textarea') ||
        panelRef.current?.querySelector(FOCUSABLE);
      target?.focus();
    }, 30);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      previous?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" data-lenis-prevent>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => onCloseRef.current?.()} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && (
              <h2 id={titleId} className="text-lg font-bold text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            className="-mr-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-zinc-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
