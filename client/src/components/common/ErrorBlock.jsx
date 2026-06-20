import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';

/**
 * ErrorBlock — inline error panel with an optional retry action. Used by data
 * sections (lists, grids) when a query fails, so the rest of the page still
 * renders.
 */
export function ErrorBlock({ message, onRetry, className }) {
  return (
    <div
      className={
        'flex flex-col items-center gap-3 rounded-2xl glass-panel px-6 py-10 text-center ' +
        (className || '')
      }
    >
      <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
      <p className="text-sm text-content-muted">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
