import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input({
  label,
  hint,
  error,
  required,
  id,
  className = '',
  ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-ink bg-white placeholder-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-50 disabled:cursor-not-allowed ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-border'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${inputId}-error`} className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
});
