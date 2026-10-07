import { cn } from '@/lib/cn';

export interface PriceData {
  formatted: string;
  compareAt?: number | null;
  compareAtFormatted?: string | null;
  amount: number;
}

/**
 * A price as the shop formats it (currency, locale, tax mode). A compare-at price above the price
 * turns it into a sale: the price in the sale colour and the old price struck through, with the
 * saving spelled out for screen readers.
 */
export function Price({
  price,
  size = 'md',
  from,
  className,
  labels = { was: 'Was', now: 'Now', from: 'From' },
}: {
  price: PriceData | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  /** Prefix for products whose price depends on the option chosen. */
  from?: boolean;
  className?: string;
  labels?: { was: string; now: string; from: string };
}) {
  if (!price) return null;
  const onSale = !!price.compareAt && price.compareAt > price.amount && !!price.compareAtFormatted;
  const text = { sm: 'text-small', md: 'text-body', lg: 'text-h3' }[size];
  return (
    <p className={cn('tabular flex flex-wrap items-baseline gap-x-2', text, className)}>
      {from && <span className="text-fg-muted">{labels.from}</span>}
      {onSale && <span className="sr-only">{labels.now}</span>}
      <span className={cn('font-semibold', onSale ? 'text-sale' : 'text-price')}>
        {price.formatted}
      </span>
      {onSale && (
        <>
          <span className="sr-only">{labels.was}</span>
          <s className="text-[0.875em] text-price-compare">{price.compareAtFormatted}</s>
        </>
      )}
    </p>
  );
}

/** Whole-number discount for a sale badge ("-17%"), or null. */
export function discountPercent(price: PriceData | null | undefined): number | null {
  if (!price?.compareAt || price.compareAt <= price.amount) return null;
  const pct = Math.round((1 - price.amount / price.compareAt) * 100);
  return pct >= 1 ? pct : null;
}
