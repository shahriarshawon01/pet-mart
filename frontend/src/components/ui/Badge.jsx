import React from 'react';

const colorClasses = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-zinc-100 text-zinc-700',
  amber: 'bg-amber-100 text-amber-800',
  featured: 'bg-ink text-white',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
};

export function Badge({ children, color = 'secondary', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorClasses[color] || colorClasses.secondary} ${className}`}>
      {children}
    </span>
  );
}
