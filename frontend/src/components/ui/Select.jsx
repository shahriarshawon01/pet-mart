import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select({
  label,
  hint,
  error,
  required,
  id,
  options = [],
  placeholder,
  className = '',
  ...props
}, ref) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-semibold text-ink">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-ink bg-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-50 disabled:cursor-not-allowed ${error ? 'border-red-400' : 'border-border'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${selectId}-error`} className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
});
