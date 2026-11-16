import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ currentPage, lastPage, onPageChange }) {
  if (!lastPage || lastPage <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= left && i <= right)) {
      pages.push(i);
    }
  }

  // Add ellipsis markers
  const pagesWithEllipsis = [];
  let prev = null;
  for (const page of pages) {
    if (prev !== null && page - prev > 1) {
      pagesWithEllipsis.push('...');
    }
    pagesWithEllipsis.push(page);
    prev = page;
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </Button>

      {pagesWithEllipsis.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-muted text-sm">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              page === currentPage
                ? 'bg-primary text-white'
                : 'hover:bg-zinc-100 text-ink'
            }`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}
