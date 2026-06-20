import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge conditional class names and resolve Tailwind conflicts.
 * Consumer `className` props win over base styles.
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
