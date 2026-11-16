import React, { forwardRef } from 'react';

/**
 * Bangladesh mobile number input. The user types the 11-digit local number (01XXXXXXXXX);
 * "+88" is shown as a visual prefix so +88 01XXXXXXXXX reads as the full international number.
 * Non-digits are stripped before onChange is called.
 */
export const PhoneInput = forwardRef(function PhoneInput(
  { label, hint, error, required, id = 'phone-input', onChange, className = '', ...props },
  ref,
) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange?.({ ...e, target: { ...e.target, value: digits } });
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="flex">
        <span className="inline-flex select-none items-center rounded-l-lg border border-r-0 border-border bg-zinc-50 px-3 text-sm font-semibold text-muted">
          +88
        </span>
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="01XXXXXXXXX"
          maxLength={11}
          onChange={handleChange}
          className={`min-w-0 flex-1 rounded-r-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            error ? 'border-red-400' : 'border-border'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
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

export default PhoneInput;
