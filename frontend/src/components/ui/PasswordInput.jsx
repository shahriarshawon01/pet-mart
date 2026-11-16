import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = forwardRef(function PasswordInput(
  { label, hint, error, required, id, labelAction, className = '', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-ink">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}
        {labelAction}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-lg border bg-white py-2.5 pl-3 pr-11 text-sm text-ink outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            error ? 'border-red-400' : 'border-border'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-zinc-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default PasswordInput;
