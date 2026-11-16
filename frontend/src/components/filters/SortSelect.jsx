import React from 'react';
import { SORT_OPTIONS } from '../../lib/constants';

export function SortSelect({ value, onChange, id = 'sort' }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="hidden whitespace-nowrap text-sm text-muted sm:inline">
        Sort by
      </label>
      <select
        id={id}
        value={value || 'latest'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort listings"
        className="rounded-lg border border-border bg-white py-2 pl-3 pr-8 text-sm font-medium text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortSelect;
