import React from 'react';
import { humaniseKey } from '../../lib/format';

/**
 * Renders category attributes (breed, age, vaccination…) as a two-column table.
 * `labels` maps attribute_key -> display name from the category schema when available.
 */
export function SpecTable({ attributes, extra = [], labels = {} }) {
  const rows = [
    ...extra.filter((r) => r.value),
    ...Object.entries(attributes || {})
      .filter(([, v]) => v !== null && v !== '')
      .map(([k, v]) => ({ label: labels[k] || humaniseKey(k), value: v })),
  ];
  if (!rows.length) return null;

  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-2">
      {rows.map((row, i) => (
        <div
          key={`${row.label}-${i}`}
          className="-mb-px flex items-baseline justify-between gap-4 border-b border-border px-4 py-3 sm:odd:border-r"
        >
          <dt className="text-sm text-muted">{row.label}</dt>
          <dd className="text-right text-sm font-semibold text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default SpecTable;
