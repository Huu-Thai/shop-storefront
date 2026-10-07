import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './spinner';

/**
 * Buttons (docs/STYLE-GUIDE.md §6). One primary per view (add to cart, checkout). `inverse` sits on
 * the hero and other dark regions. Default size is 44 px tall — a comfortable touch target.
 */
export const buttonVariants = cva(
  'focus-ring transition-standard inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-button font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
        secondary: 'border border-border-strong bg-surface text-fg hover:border-fg',
        ghost: 'text-fg hover:bg-surface-sunken',
        accent: 'bg-accent text-accent-fg hover:brightness-95',
        inverse: 'bg-hero-fg text-hero-bg hover:opacity-90',
        'inverse-outline': 'border border-hero-fg/40 text-hero-fg hover:border-hero-fg',
        link: 'h-auto rounded-xs px-0 font-medium text-fg underline decoration-1 underline-offset-4 hover:decoration-2 active:scale-100',
      },
      size: {
        sm: 'h-9 px-4 text-small [&_svg]:size-4',
        md: 'h-11 px-6 text-body [&_svg]:size-[18px]',
        lg: 'h-13 px-8 text-body [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
        'icon-sm': 'size-9 [&_svg]:size-[18px]',
      },
      block: { true: 'w-full' },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Render the child element (a link) with button styles. */
  asChild?: boolean;
  /** Shows a spinner and disables the button, keeping its width. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild,
  loading,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner label="Working" />}
          {children}
        </>
      )}
    </Comp>
  );
}
