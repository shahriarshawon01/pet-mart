import React, { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea({
  label,
  hint,
  error,
  required,
  id,
  rows = 4,
  className = '',
  ...props
}, ref) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-semibold text-ink">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-ink bg-white placeholder-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y disabled:bg-zinc-50 ${error ? 'border-red-400' : 'border-border'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${textareaId}-error`} className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
});
