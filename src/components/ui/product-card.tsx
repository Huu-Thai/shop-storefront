import { Link } from '@/components/intent-link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Badge } from './badge';
import { discountPercent, Price, type PriceData } from './price';
import { type ImageData, StoreImage } from './store-image';

export interface ProductCardData {
  id: string;
  name: string;
  image?: ImageData | null;
  price?: PriceData | null;
  inStock?: boolean;
  type?: string;
}

/**
 * Product tile for grids and rails (docs/STYLE-GUIDE.md §7): 4:5 image well, name (2 lines max),
 * price. The whole card is one link; badges sit on the image. Width comes from the grid.
 */
export function ProductCard({
  product,
  href,
  priority,
  sizes = '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw',
  labels,
  extra,
  className,
  headingLevel = 3,
}: {
  product: ProductCardData;
  href: string;
  priority?: boolean;
  sizes?: string;
  labels: { sale: string; soldOut: string; from: string; was: string; now: string };
  /** Slot under the price (swatches, quick add — later phases). */
  extra?: ReactNode;
  className?: string;
  /** 2 in a page's main listing (under its h1), 3 in a titled section. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const pct = discountPercent(product.price);
  const varies = product.type === 'CONFIGURABLE' || product.type === 'BUNDLE';
  return (
    <article className={cn('group relative flex flex-col gap-3', className)}>
      <div className="relative">
        <StoreImage
          image={product.image}
          alt={product.name}
          sizes={sizes}
          priority={priority}
          className="aspect-[4/5] rounded-media transition-[filter] duration-300 group-hover:brightness-[0.97]"
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {pct && <Badge tone="sale">{`${labels.sale} −${pct}%`}</Badge>}
          {product.inStock === false && <Badge tone="inverse">{labels.soldOut}</Badge>}
        </div>
      </div>
      <div className="grid gap-1">
        <Heading className="line-clamp-2 font-sans text-small font-medium text-fg">
          <Link href={href} className="focus-ring rounded-xs after:absolute after:inset-0">
            {product.name}
          </Link>
        </Heading>
        <Price price={product.price} size="sm" from={varies} labels={labels} />
        {extra}
      </div>
    </article>
  );
}

/** Same footprint as ProductCard while loading. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="aspect-[4/5] animate-pulse rounded-media bg-surface-sunken motion-reduce:animate-none" />
      <div className="h-4 w-3/4 animate-pulse rounded-sm bg-surface-sunken" />
      <div className="h-4 w-1/3 animate-pulse rounded-sm bg-surface-sunken" />
    </div>
  );
}
