import { ChevronRight } from 'lucide-react';
import { Link } from '@/components/intent-link';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail (docs/STYLE-GUIDE.md §6); the last crumb is the current page. */
export function Breadcrumbs({
  items,
  label,
  className,
}: {
  items: Crumb[];
  /** Accessible name of the nav, e.g. "Breadcrumb". */
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn('text-small text-fg-muted', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link href={c.href} className="focus-ring rounded-xs hover:text-fg hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn(last && 'text-fg')}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden className="size-3.5 text-fg-subtle" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
