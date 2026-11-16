import React, { useId, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

/**
 * Type-ahead for areas, districts and divisions (e.g. "mirp" → Mirpur · Dhaka · Dhaka division).
 * Calls onPick(location) with the chosen item; the parent fills the division/district/area fields.
 */
export function LocationSearch({ index, onPick, label = 'Find your location', placeholder = 'Type an area or district, e.g. Mirpur or Gazipur', id }) {
  const autoId = useId();
  const inputId = id || `loc-search-${autoId}`;
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef(null);

  const results = useMemo(() => index.search(query), [index, query]);
  const showList = open && query.trim().length >= 2;

  const choose = (loc) => {
    onPick(loc);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-ink"
            aria-label="Clear location search"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-white p-1 shadow-lg"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {results.length ? (
            results.map((loc, i) => (
              <li
                key={`${loc.level}-${loc.id}`}
                id={`${listId}-${loc.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(loc)}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 ${i === active ? 'bg-primary/10' : ''}`}
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    {loc.name}
                    {loc.bn_name && <span className="ml-1.5 font-normal text-muted">{loc.bn_name}</span>}
                  </span>
                  <span className="block text-xs text-muted">
                    {loc.context ? `${loc.level === 'district' ? 'District' : loc.level === 'area' ? 'Area' : 'Division'} · ${loc.context}` : 'Division'}
                  </span>
                </span>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-muted">No match. Choose from the lists below instead.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default LocationSearch;
