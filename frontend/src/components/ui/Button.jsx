import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm hover:shadow-md',
  secondary: 'bg-ink hover:bg-ink/90 text-white shadow-sm',
  outline: 'bg-transparent border border-border hover:bg-zinc-50 text-ink',
  'outline-primary': 'bg-white border border-primary text-primary hover:bg-primary-soft',
  ghost: 'bg-transparent hover:bg-zinc-100 text-ink',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  as,
  to,
  className = '',
  disabled,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const cls = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = (
    <>
      {loading ? <Loader2 size={16} className="animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </>
  );

  if (as === 'link' && to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    );
  }

  if (as === 'anchor') {
    return (
      <a className={cls} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={cls} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
