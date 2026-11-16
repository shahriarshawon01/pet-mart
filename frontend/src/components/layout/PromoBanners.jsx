import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { Container } from '../ui/Container';

const cache = new Map();
const INTERVAL_MS = 6000;

function loadBanners(position) {
  if (!cache.has(position)) {
    cache.set(
      position,
      api
        .get('/banners', { params: { position } })
        .then((res) => res.data?.data || [])
        .catch(() => []),
    );
  }
  return cache.get(position);
}

function BannerLink({ banner, children }) {
  const link = banner.link || '';
  const cls = 'block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl';
  if (link.startsWith('/')) {
    return (
      <Link to={link} className={cls} aria-label={banner.title}>
        {children}
      </Link>
    );
  }
  if (/^https:\/\//i.test(link)) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`${banner.title} (opens in a new tab)`}>
        {children}
      </a>
    );
  }
  return <div className="h-full w-full">{children}</div>;
}

/**
 * Admin-managed promotional banners (Admin › Marketplace › Banners).
 * position: home_top | home_middle | browse_top. Renders nothing when there are no running banners.
 */
export function PromoBanners({ position, className = '', wrap = true }) {
  const [banners, setBanners] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState({});
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    let active = true;
    loadBanners(position).then((list) => active && setBanners(list));
    return () => {
      active = false;
    };
  }, [position]);

  const count = banners?.length || 0;
  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion.current) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  if (!count) return null;

  const content = (
    <section
      className={`relative ${className}`}
      aria-roledescription={count > 1 ? 'carousel' : undefined}
      aria-label="Promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-zinc-100 shadow-sm sm:aspect-[16/5]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={i !== index}
            role={count > 1 ? 'group' : undefined}
            aria-roledescription={count > 1 ? 'slide' : undefined}
            aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
          >
            <BannerLink banner={b}>
              {!loaded[b.id] && <div className="absolute inset-0 animate-pulse bg-zinc-200" aria-hidden="true" />}
              <img
                src={b.image}
                alt={b.title}
                loading={i === 0 ? 'eager' : 'lazy'}
                onLoad={() => setLoaded((s) => ({ ...s, [b.id]: true }))}
                className="h-full w-full object-cover"
              />
            </BannerLink>
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Previous promotion"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Next promotion"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-ink/40 px-2 py-1.5 backdrop-blur">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Show promotion ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );

  return wrap ? <Container>{content}</Container> : content;
}

export default PromoBanners;
