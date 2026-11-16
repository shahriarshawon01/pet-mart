import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { lockScroll, unlockScroll } from '../../lib/scroll';

export function ProductGallery({ images = [], title }) {
  const list = images.length ? images : [{ id: 'none', image_path: null }];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const touchX = useRef(null);
  const count = list.length;

  const go = useCallback((dir) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open, go]);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const current = list[index];
  const hasImage = Boolean(current?.image_path);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="relative bg-zinc-900" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <ImageWithFallback
          key={current?.id}
          src={current?.image_path}
          alt={`${title} – photo ${index + 1} of ${count}`}
          aspectRatio="aspect-[4/3] sm:aspect-[16/10]"
          objectFit="object-contain"
          className="bg-zinc-900"
        />
        {hasImage && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Expand size={14} aria-hidden="true" /> View full size
          </button>
        )}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-zinc-50 p-3" role="list" aria-label="Photo thumbnails">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="listitem"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:w-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <ImageWithFallback src={img.image_path} alt="" aspectRatio="aspect-square" />
            </button>
          ))}
        </div>
      )}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-label={`${title} photos`}
            onClick={() => setOpen(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={current.image_path}
              alt={`${title} – photo ${index + 1} of ${count}`}
              className="max-h-[90vh] max-w-[95vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label="Close full size view"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={22} />
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight size={26} />
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm font-medium text-white/80">
                  {index + 1} / {count}
                </span>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default ProductGallery;
