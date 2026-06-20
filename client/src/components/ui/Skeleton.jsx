import { cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

/**
 * Skeleton — content placeholder shown while data loads.
 */
const skeletonVariants = cva('animate-pulse bg-white/10', {
  variants: {
    variant: {
      rect: 'rounded-xl',
      text: 'h-4 rounded',
      circle: 'rounded-full',
    },
  },
  defaultVariants: { variant: 'rect' },
});

function Skeleton({ className, variant, ...props }) {
  return (
    <div aria-hidden="true" className={cn(skeletonVariants({ variant }), className)} {...props} />
  );
}

export { Skeleton };
