import React, { useEffect, useMemo, useState } from 'react';
import { LISTING_TYPES } from '../../lib/constants';
import { indexLocations, locationOptionLabel } from '../../lib/locations';
import { LocationSearch } from '../ui/LocationSearch';

export function FilterPanel({ values, onChange, categories = [], locations, idPrefix = 'f' }) {
  const loc = useMemo(() => indexLocations(locations), [locations]);
  const districts = loc.districtsOf(values.division_id);
  const areas = loc.areasOf(values.district_id);
  const [minPrice, setMinPrice] = useState(values.min_price || '');
  const [maxPrice, setMaxPrice] = useState(values.max_price || '');

  useEffect(() => setMinPrice(values.min_price || ''), [values.min_price]);
  useEffect(() => setMaxPrice(values.max_price || ''), [values.max_price]);

  const commitPrice = () => {
    if ((values.min_price || '') !== minPrice || (values.max_price || '') !== maxPrice) {
      onChange({ min_price: minPrice, max_price: maxPrice });
    }
  };

  const selectCls =
    'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-category`} className="text-sm font-semibold text-ink">
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          value={values.category_slug || ''}
          onChange={(e) => onChange({ category_slug: e.target.value })}
          className={selectCls}
        >
          <option value="">All categories</option>
          {categories.map((cat) =>
            cat.children?.length ? (
              <optgroup key={cat.id} label={cat.name}>
                <option value={cat.slug}>All {cat.name}</option>
                {cat.children.map((child) => (
                  <option key={child.id} value={child.slug}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ),
          )}
        </select>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Listing type</legend>
        <div className="flex flex-wrap gap-2">
          {[{ value: '', label: 'All' }, ...LISTING_TYPES].map((t) => {
            const active = (values.listing_type || '') === t.value;
            return (
              <label
                key={t.value || 'all'}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-zinc-700 hover:border-primary hover:text-primary-hover'
                }`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-listing-type`}
                  value={t.value}
                  checked={active}
                  onChange={() => onChange({ listing_type: t.value })}
                  className="sr-only"
                />
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-ink">Location</legend>
        <LocationSearch
          id={`${idPrefix}-loc-search`}
          index={loc}
          label="Search area or district"
          placeholder="e.g. Uttara, Gazipur"
          onPick={(l) => onChange(loc.selectionFor(l.id))}
        />
        <div>
          <label htmlFor={`${idPrefix}-division`} className="sr-only">Division</label>
          <select
            id={`${idPrefix}-division`}
            value={values.division_id || ''}
            onChange={(e) => onChange({ division_id: e.target.value, district_id: '', area_id: '' })}
            className={selectCls}
          >
            <option value="">All of Bangladesh</option>
            {loc.divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {locationOptionLabel(d)} division
              </option>
            ))}
          </select>
        </div>
        {districts.length > 0 && (
          <div>
            <label htmlFor={`${idPrefix}-district`} className="sr-only">District</label>
            <select
              id={`${idPrefix}-district`}
              value={values.district_id || ''}
              onChange={(e) => onChange({ district_id: e.target.value, area_id: '' })}
              className={selectCls}
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {locationOptionLabel(d)}
                </option>
              ))}
            </select>
          </div>
        )}
        {areas.length > 0 && (
          <div>
            <label htmlFor={`${idPrefix}-area`} className="sr-only">Area</label>
            <select
              id={`${idPrefix}-area`}
              value={values.area_id || ''}
              onChange={(e) => onChange({ area_id: e.target.value })}
              className={selectCls}
            >
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {locationOptionLabel(a)}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Price (৳)</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-min`}>
            Minimum price
          </label>
          <input
            id={`${idPrefix}-min`}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
            className={selectCls}
          />
          <label className="sr-only" htmlFor={`${idPrefix}-max`}>
            Maximum price
          </label>
          <input
            id={`${idPrefix}-max`}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
            className={selectCls}
          />
        </div>
      </fieldset>
    </div>
  );
}

export default FilterPanel;
