import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/utils/cn';

/**
 * Button — design-system button with CVA variants and a loading state.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover hover:shadow-glow',
        secondary: 'bg-secondary text-background hover:opacity-90',
        outline: 'border border-white/15 bg-transparent text-content hover:bg-white/5',
        ghost: 'bg-transparent text-content-muted hover:bg-white/5 hover:text-content',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

const Button = forwardRef(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
