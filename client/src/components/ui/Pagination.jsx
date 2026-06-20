import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/utils/cn';

/**
 * Pagination — page navigation with ellipsis truncation.
 * Props: page (current), totalPages, onPageChange(page).
 */
function getPageList(page, totalPages) {
  const pages = [];
  const push = (p) => pages.push(p);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) push(i);
    return pages;
  }

  push(1);
  if (page > 3) push('…');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) push(i);
  if (page < totalPages - 2) push('…');
  push(totalPages);
  return pages;
}

function Pagination({ page, totalPages, onPageChange, className }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = getPageList(page, totalPages);
  const go = (p) => p >= 1 && p <= totalPages && p !== page && onPageChange?.(p);

  const baseBtn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={cn(baseBtn, 'text-content-muted hover:bg-white/5 hover:text-content')}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-content-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              baseBtn,
              p === page
                ? 'bg-primary font-medium text-white'
                : 'text-content-muted hover:bg-white/5 hover:text-content'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={cn(baseBtn, 'text-content-muted hover:bg-white/5 hover:text-content')}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export { Pagination };
