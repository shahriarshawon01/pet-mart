import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, MessageSquare, Lock, Flag, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { VerifiedBadge } from './VerifiedBadge';
import { formatDate, initials, maskPhone } from '../../lib/format';

export function SellerAvatar({ seller, size = 'h-14 w-14 text-lg' }) {
  const [broken, setBroken] = useState(false);
  if (seller?.image && !broken) {
    return (
      <img
        src={seller.image}
        alt=""
        onError={() => setBroken(true)}
        className={`${size} shrink-0 rounded-full object-cover ring-2 ring-primary/30`}
      />
    );
  }
  return (
    <span
      className={`${size} grid shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary ring-2 ring-primary/20`}
      aria-hidden="true"
    >
      {initials(seller?.name)}
    </span>
  );
}

/**
 * Seller info + contact actions. The phone number is only revealed to logged-in users,
 * and only after they press "Show phone number".
 */
export function SellerCard({ seller, isLoggedIn, isOwner, onMessage, onReport }) {
  const location = useLocation();
  const [revealed, setRevealed] = useState(false);
  const phone = seller?.phone;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <SellerAvatar seller={seller} />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{seller?.name || 'Seller'}</p>
          {seller?.is_verified ? (
            <VerifiedBadge className="mt-1" />
          ) : (
            <p className="text-xs text-muted">Marketplace member</p>
          )}
          {seller?.created_at && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Calendar size={12} aria-hidden="true" /> Member since {formatDate(seller.created_at)}
            </p>
          )}
        </div>
      </div>

      {isOwner ? (
        <p className="mt-5 rounded-lg bg-zinc-50 p-3 text-sm text-muted">This is your listing.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {phone &&
            (!isLoggedIn ? (
              <div className="rounded-xl border border-dashed border-border bg-zinc-50 p-3">
                <p className="flex items-center gap-2 font-mono text-base font-semibold tracking-wider text-ink">
                  <Phone size={16} className="text-muted" aria-hidden="true" />
                  {maskPhone(phone)}
                </p>
                <Button
                  as="link"
                  to="/login"
                  state={{ from: location }}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  iconLeft={<Lock size={14} />}
                >
                  Log in to view number
                </Button>
              </div>
            ) : revealed ? (
              <Button as="anchor" href={`tel:${phone}`} size="lg" className="w-full" iconLeft={<Phone size={18} />}>
                Call {phone}
              </Button>
            ) : (
              <Button size="lg" className="w-full" onClick={() => setRevealed(true)} iconLeft={<Phone size={18} />}>
                Show phone number
              </Button>
            ))}
          <Button variant="outline" size="lg" className="w-full" onClick={onMessage} iconLeft={<MessageSquare size={18} />}>
            Send message
          </Button>
        </div>
      )}

      {!isOwner && (
        <button
          type="button"
          onClick={onReport}
          className="mx-auto mt-4 flex items-center gap-1.5 rounded text-xs font-medium text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Flag size={13} aria-hidden="true" /> Report this listing
        </button>
      )}

      {!isLoggedIn && !isOwner && (
        <p className="mt-3 text-center text-xs text-muted">
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create a free account
          </Link>{' '}
          to message sellers and save listings.
        </p>
      )}
    </div>
  );
}

export default SellerCard;
