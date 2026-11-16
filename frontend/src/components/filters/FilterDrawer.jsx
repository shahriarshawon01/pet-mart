import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { lockScroll, unlockScroll } from '../../lib/scroll';

/** Slide-up sheet for filters on screens below 1024px. */
export function FilterDrawer({ isOpen, onClose, onApply, onReset, children, activeCount = 0 }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
      if (e.key === 'Tab' && panelRef.current) {
        const els = panelRef.current.querySelectorAll(
          'button:not([disabled]), input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
        );
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    lockScroll();
    setTimeout(() => panelRef.current?.querySelector('button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      previous?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title" data-lenis-prevent>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-100 sm:rounded-none"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="filter-drawer-title" className="text-lg font-bold text-ink">
            Filters {activeCount > 0 && <span className="text-primary">({activeCount})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-lg p-2 text-muted hover:bg-zinc-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onReset}>
            Clear all
          </Button>
          <Button onClick={onApply}>Show results</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default FilterDrawer;
