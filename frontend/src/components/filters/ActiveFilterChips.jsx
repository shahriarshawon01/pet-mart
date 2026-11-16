import React from 'react';
import { X } from 'lucide-react';

/** chips: [{ key, label, clear: {param: ''} }] */
export function ActiveFilterChips({ chips = [], onRemove, onClearAll }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1 pl-3 pr-2 text-xs font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <X size={13} aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded px-1 text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Clear all
      </button>
    </div>
  );
}

export default ActiveFilterChips;
