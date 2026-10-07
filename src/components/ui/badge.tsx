import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Small labels on product cards and pages: sale, new, stock, status (docs/STYLE-GUIDE.md §6). */
export const badgeVariants = cva(
  'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken text-fg',
        inverse: 'bg-primary text-primary-fg',
        sale: 'bg-sale text-sale-fg',
        new: 'bg-new text-new-fg',
        success: 'bg-success-soft text-success-fg',
        warning: 'bg-warning-soft text-warning-fg',
        danger: 'bg-danger-soft text-danger-fg',
        outline: 'border border-border-strong text-fg',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  tone,
  className,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
