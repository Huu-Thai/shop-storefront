import { Link } from '@/components/intent-link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Section title with optional eyebrow, description and a "view all" link (docs/STYLE-GUIDE.md §5). */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as: H = 'h2',
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; href: string };
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-4', className)}>
      <div className="grid max-w-2xl gap-3">
        {eyebrow && (
          <p className="text-overline font-semibold text-fg-muted uppercase">{eyebrow}</p>
        )}
        <H className={H === 'h1' ? 'text-h1' : 'text-h2'}>{title}</H>
        {description && <p className="text-body-lg text-fg-muted">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="focus-ring group/link inline-flex items-center gap-1.5 rounded-xs text-body font-semibold text-fg"
        >
          {action.label}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover/link:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
