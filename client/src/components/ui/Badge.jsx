import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

/**
 * Badge — small status/label pill. Includes image-lifecycle status variants.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-content-muted',
        primary: 'bg-primary/20 text-primary',
        secondary: 'bg-secondary/20 text-secondary',
        danger: 'bg-red-500/20 text-red-400',
        // Image status (DB Design / UI/UX)
        draft: 'bg-white/10 text-content-muted',
        published: 'bg-emerald-500/20 text-emerald-400',
        scheduled: 'bg-amber-500/20 text-amber-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const Badge = forwardRef(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
