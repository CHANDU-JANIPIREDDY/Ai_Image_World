import { forwardRef, useId } from 'react';

import { cn } from '@/utils/cn';

/**
 * Input — labeled text input with error state and accessibility wiring.
 * Supports an optional leading icon via the `leftIcon` prop.
 */
const Input = forwardRef(
  ({ className, label, error, id, leftIcon, type = 'text', ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-content">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-11 w-full rounded-xl border border-white/10 bg-surface px-4 text-content',
              'placeholder:text-content-muted/70 transition-colors',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40',
              leftIcon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
