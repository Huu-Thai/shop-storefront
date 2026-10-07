import { ProductCard, type ProductCardData } from '@/components/ui/product-card';
import type { Translate } from '@/i18n';
import { cn } from '@/lib/cn';

export type GridProduct = ProductCardData & { urlPath: string | null; slug: string };

/** Card labels in the shopper's language. */
export const cardLabels = (t: Translate) => ({
  sale: t('product.sale'),
  soldOut: t('product.soldOut'),
  from: t('price.from'),
  was: t('price.was'),
  now: t('price.now'),
});

/**
 * Product grid (docs/STYLE-GUIDE.md §4): 2 / 3 / 4 columns, or 2 / 3 next to a filter sidebar. The
 * first row loads eagerly — it is usually the largest paint on listing pages.
 */
export function ProductGrid({
  products,
  hrefFor,
  t,
  withSidebar = false,
  eager = 0,
}: {
  products: GridProduct[];
  hrefFor: (p: { urlPath: string | null; slug: string }) => string;
  t: Translate;
  withSidebar?: boolean;
  eager?: number;
}) {
  const labels = cardLabels(t);
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10',
        !withSidebar && 'xl:grid-cols-4',
      )}
    >
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard
            product={p}
            href={hrefFor(p)}
            labels={labels}
            headingLevel={2}
            priority={i < eager}
            sizes={
              withSidebar
                ? '(min-width: 1024px) 28vw, (min-width: 768px) 33vw, 50vw'
                : '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw'
            }
          />
        </li>
      ))}
    </ul>
  );
}
