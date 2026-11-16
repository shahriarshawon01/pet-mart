import React from 'react';

export function Checkbox({ label, hint, error, id, className = '', ...props }) {
  const checkId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={checkId} className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={checkId}
          className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 cursor-pointer"
          {...props}
        />
        <span className="text-sm font-medium text-ink">{label}</span>
      </label>
      {hint && !error && <p className="text-xs text-muted ml-6">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium ml-6">{error}</p>}
    </div>
  );
}
