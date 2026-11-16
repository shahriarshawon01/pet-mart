import React from 'react';
import { PhoneCall } from 'lucide-react';

/** Shown when PetMart has confirmed the seller's mobile number (users.is_verified, set by an admin). */
export function VerifiedBadge({ text = 'Number verified', className = '' }) {
  return (
    <span
      title="PetMart has verified this seller's mobile number"
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 ${className}`}
    >
      <PhoneCall size={12} aria-hidden="true" />
      {text}
    </span>
  );
}

export default VerifiedBadge;
