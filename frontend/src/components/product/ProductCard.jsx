import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, Star } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Badge } from '../ui/Badge';
import { VerifiedBadge } from './VerifiedBadge';
import { useWishlistToggle } from '../../hooks/useWishlist';
import { formatPrice, formatLocation, formatRelativeTime } from '../../lib/format';
import { LISTING_TYPE_MAP } from '../../lib/constants';

export function ProductCard({ product, saved = false, onSavedChange, layout = 'grid', imageAspect = 'aspect-[4/3]' }) {
  const { saved: isSaved, busy, toggle } = useWishlistToggle(product.id, saved, onSavedChange);
  const href = `/product/${product.slug || product.id}`;
  const type = LISTING_TYPE_MAP[product.listing_type];
  const isList = layout === 'list';

  return (
    <article
      className={`group relative flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary ${
        isList ? 'flex-row' : 'flex-col'
      }`}
    >
      <div className={`relative shrink-0 ${isList ? 'w-36 sm:w-56' : 'w-full'}`}>
        <ImageWithFallback
          src={product.primary_image}
          alt={product.title}
          aspectRatio={isList ? 'aspect-square sm:aspect-[4/3] h-full' : imageAspect}
          className="transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {product.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              Featured
            </span>
          )}
          {type && type.value !== 'sell' && (
            <Badge color={type.color} className="shadow-sm">
              {type.label}
            </Badge>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
        className="absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-zinc-500 shadow-md transition hover:scale-105 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        <Heart size={18} className={isSaved ? 'fill-primary text-primary' : ''} aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">
            {product.category?.name}
          </span>
          {product.seller?.is_verified && <VerifiedBadge />}
        </div>

        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">
          <Link
            to={href}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.title}
          </Link>
        </h3>

        <p className="mt-2 text-lg font-extrabold tracking-tight text-ink">
          {formatPrice(product.price, { isFree: product.is_free })}
          {product.is_negotiable && product.price ? (
            <span className="ml-1.5 text-xs font-medium text-muted">Negotiable</span>
          ) : null}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-border pt-3 text-xs text-muted">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{formatLocation(product.location)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock size={13} aria-hidden="true" />
            {formatRelativeTime(product.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
