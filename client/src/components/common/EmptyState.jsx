import { SearchX } from 'lucide-react';

import { cn } from '@/utils/cn';

/**
 * EmptyState — friendly placeholder for empty/no-results views.
 * Props: icon (component), title, message, action (node).
 */
function EmptyState({ icon: Icon = SearchX, title = 'Nothing here yet', message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center md:py-20', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass-panel">
        <Icon className="h-8 w-8 text-content-muted" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-content">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-content-muted">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export { EmptyState };
