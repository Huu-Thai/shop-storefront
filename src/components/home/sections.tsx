import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link } from '@/components/intent-link';
import { ProductCard, type ProductCardData } from '@/components/ui/product-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { type ImageData, StoreImage } from '@/components/ui/store-image';
import type { Translate } from '@/i18n';
import { cn } from '@/lib/cn';

export interface Promo {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  href?: string | null;
  image?: ImageData | null;
}

/** Promotional banners (placement `home.hero`): one wide band, or tiles side by side. */
export function PromoBanners({ promos, t }: { promos: Promo[]; t: Translate }) {
  if (!promos.length) return null;
  return (
    <section className="container-page pt-[var(--section-y)]">
      <div className={cn('grid gap-4 md:gap-6', promos.length > 1 && 'md:grid-cols-2')}>
        {promos.map((p) => {
          const body = (
            <>
              <div className="grid content-end gap-3 p-6 sm:p-10">
                <h2 className="text-h2">{p.title}</h2>
                {p.subtitle && <p className="max-w-md text-body-lg text-fg-muted">{p.subtitle}</p>}
                {p.href && (
                  <span className="inline-flex items-center gap-2 text-body font-semibold underline decoration-1 underline-offset-4 group-hover:decoration-2">
                    {p.ctaLabel ?? t('home.shopNow')}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                )}
              </div>
              {p.image ? (
                <StoreImage
                  image={p.image}
                  alt=""
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="aspect-[4/3] md:aspect-auto md:h-full"
                />
              ) : (
                <div aria-hidden className="hidden items-center justify-center md:flex">
                  <div className="size-40 rounded-full bg-accent shadow-[0_0_0_24px_var(--accent-soft)]" />
                </div>
              )}
            </>
          );
          const cls =
            'group grid min-h-56 overflow-hidden rounded-card bg-surface-muted md:min-h-72 md:grid-cols-2';
          return p.href ? (
            <Link key={p.id} href={p.href} className={cn('focus-ring', cls)}>
              {body}
            </Link>
          ) : (
            <div key={p.id} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export interface CategoryTile {
  id: string;
  name: string;
  href: string;
  image?: ImageData | null;
  description?: string | null;
}

/** Top-level categories as tiles; image-less ones get a typographic tile. */
export function CategoryTiles({ categories, t }: { categories: CategoryTile[]; t: Translate }) {
  if (!categories.length) return null;
  return (
    <section className="container-page pt-[var(--section-y)]">
      <SectionHeading title={t('home.categories')} description={t('home.categoriesBody')} />
      <ul
        className={cn(
          'mt-8 grid grid-cols-2 gap-3 md:mt-10 md:gap-6',
          categories.length >= 3 ? 'lg:grid-cols-4' : 'md:grid-cols-2',
        )}
      >
        {categories.map((c, i) => (
          <li key={c.id}>
            <Link
              href={c.href}
              className="focus-ring group relative block overflow-hidden rounded-card"
            >
              {c.image ? (
                <StoreImage
                  image={c.image}
                  alt=""
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className={cn(
                    'transition-transform duration-500 group-hover:scale-[1.03]',
                    categories.length >= 3 ? 'aspect-square' : 'aspect-[4/5] md:aspect-[3/2]',
                  )}
                />
              ) : (
                <div
                  aria-hidden
                  className={cn(
                    categories.length >= 3 ? 'aspect-square' : 'aspect-[4/5] md:aspect-[3/2]',
                    i % 3 === 0
                      ? 'bg-surface-inverse'
                      : i % 3 === 1
                        ? 'bg-accent'
                        : 'bg-surface-sunken',
                  )}
                />
              )}
              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6',
                  c.image && 'bg-gradient-to-t from-black/60 to-transparent pt-16 text-white',
                  !c.image &&
                    (i % 3 === 0 ? 'text-fg-inverse' : i % 3 === 1 ? 'text-accent-fg' : 'text-fg'),
                )}
              >
                <span className="min-w-0 text-h4 font-semibold break-words sm:text-h3">
                  {c.name}
                </span>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-current/10 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight aria-hidden className="size-5" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A titled grid of products with a "view all" link. */
export function ProductRail({
  title,
  description,
  viewAll,
  products,
  hrefFor,
  t,
}: {
  title: string;
  description?: string;
  viewAll?: { label: string; href: string };
  products: (ProductCardData & { urlPath: string | null; slug: string })[];
  /** Products without a URL rewrite fall back to their slug. */
  hrefFor: (p: { urlPath: string | null; slug: string }) => string;
  t: Translate;
}) {
  if (!products.length) return null;
  const labels = {
    sale: t('product.sale'),
    soldOut: t('product.soldOut'),
    from: t('price.from'),
    was: t('price.was'),
    now: t('price.now'),
  };
  return (
    <section className="container-page pt-[var(--section-y)]">
      <SectionHeading title={title} description={description} action={viewAll} />
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} href={hrefFor(p)} labels={labels} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Service promises under the fold. */
export function Perks({ t }: { t: Translate }) {
  const perks = [
    { icon: Truck, title: t('perk.shipping'), body: t('perk.shippingBody') },
    { icon: RotateCcw, title: t('perk.returns'), body: t('perk.returnsBody') },
    { icon: ShieldCheck, title: t('perk.secure'), body: t('perk.secureBody') },
  ];
  return (
    <section className="mt-[var(--section-y)] border-t border-border">
      <ul className="container-page grid gap-8 py-12 md:grid-cols-3 md:py-16">
        {perks.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-fg">
              <Icon aria-hidden className="size-[22px]" strokeWidth={1.75} />
            </span>
            <div className="grid gap-1">
              <h3 className="font-sans text-body font-semibold">{title}</h3>
              <p className="text-small text-fg-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
