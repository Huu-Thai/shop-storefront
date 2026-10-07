import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Loading placeholder with the exact size of what replaces it (no layout shift). */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}
