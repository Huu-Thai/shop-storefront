import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const control =
  'focus-ring transition-standard w-full rounded-control border border-border-strong bg-surface text-body text-fg transition-[border-color,box-shadow] placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-fg disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

/** Text input, 48 px tall (16 px text so iOS doesn't zoom). */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-12 px-4', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-28 px-4 py-3', className)} {...props} />;
}

/** Native select: fastest on phones and fully accessible; styled to match inputs. */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <span className={cn('relative block', className)}>
      <select className={cn(control, 'h-12 appearance-none pr-10 pl-4')} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-fg-muted"
      >
        <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    </span>
  );
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-small font-medium text-fg', className)} {...props} />;
}

/** Label, control, hint and error, wired for screen readers (`id` is the control's id). */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="text-danger-fg">
            {' '}
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-small text-danger-fg">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-small text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
