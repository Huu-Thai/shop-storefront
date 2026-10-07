import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/components/intent-link';
import { cn } from '@/lib/cn';

/** Pages to show: first, last, current ± 1, with gaps (null). */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const out: (number | null)[] = [];
  let prev = 0;
  for (const p of [...keep].sort((a, b) => a - b)) {
    if (p - prev > 1) out.push(null);
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Crawlable page links (`?page=n`) for listings, 44 px targets. `hrefFor(page)` keeps the
 * listing's other parameters.
 */
export function Pagination({
  page,
  pages,
  hrefFor,
  labels,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
  labels: { nav: string; previous: string; next: string; page: (n: number) => string };
}) {
  if (pages <= 1) return null;
  const btn =
    'focus-ring flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-body font-medium';
  return (
    <nav aria-label={labels.nav} className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={cn(btn, 'hover:bg-surface-sunken')}
          aria-label={labels.previous}
        >
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
      ) : (
        <span className={cn(btn, 'text-fg-subtle')} aria-hidden>
          <ChevronLeft className="size-5" />
        </span>
      )}
      {pageWindow(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-fg-subtle">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={labels.page(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btn,
              'tabular',
              p === page ? 'bg-primary text-primary-fg' : 'hover:bg-surface-sunken',
            )}
          >
            {p}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={cn(btn, 'hover:bg-surface-sunken')}
          aria-label={labels.next}
        >
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      ) : (
        <span className={cn(btn, 'text-fg-subtle')} aria-hidden>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
