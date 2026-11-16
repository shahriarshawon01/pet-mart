import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-muted py-2" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            aria-label="Home"
          >
            <Home size={14} />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-zinc-400 shrink-0" aria-hidden="true" />
              {isLast || !item.to ? (
                <span className="font-semibold text-ink truncate max-w-[180px] sm:max-w-none" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
export default Breadcrumbs;

