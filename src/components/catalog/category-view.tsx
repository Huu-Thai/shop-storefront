import { Link } from '@/components/intent-link';
import { Regions } from '@/components/content/content';
import { JsonLd } from '@/components/json-ld';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { translator } from '@/i18n';
import {
  type CatalogQuery,
  hasRefinements,
  needsSearch,
  PAGE_SIZE,
  toApiSearch,
  toSearchParams,
} from '@/lib/catalog-query';
import { cn } from '@/lib/cn';
import { type Ctx, href } from '@/lib/routing';
import { breadcrumbJsonLd } from '@/lib/seo';
import { cleanHtml } from '@/server/html';
import { absoluteUrl } from '@/server/site';
import {
  type CategoryMatch,
  getPlacements,
  getCategoryProducts,
  type SearchResult,
  searchCatalog,
  type StoreConfig,
} from '@/server/storefront';
import {
  ActiveFilters,
  CatalogProvider,
  type Facet,
  FilterPanel,
  FiltersButton,
  type PriceInfo,
  Results,
  SortSelect,
} from './catalog-controls';
import { ProductGrid } from './product-grid';

const CATEGORY_SORT: Record<string, 'position' | 'newest' | 'name'> = {
  featured: 'position',
  newest: 'newest',
  name: 'name',
};

/** Facets worth showing: more than one choice, or something already selected. */
export function usefulFacets(facets: SearchResult['facets'], query: CatalogQuery): Facet[] {
  return facets
    .filter((f) => f.values.length > 1 || query.filters[f.code]?.length)
    .map((f) => ({ code: f.code, label: f.label, values: f.values }));
}

/** Price filter info in major units of the store's default currency (null when not applicable). */
export function priceInfo(
  config: StoreConfig,
  ctx: Ctx,
  range: SearchResult['priceRange'] | null | undefined,
): PriceInfo | undefined {
  // The shop filters prices in the store's default currency; hide the filter in other currencies.
  if (ctx.currency !== config.store.defaultCurrency || !range) return undefined;
  const cur = config.currencies.find((c) => c.code === config.store.defaultCurrency);
  const units = cur?.minorUnits ?? 2;
  if (range.max <= range.min) return undefined;
  return {
    symbol: cur?.symbol ?? '',
    min: Math.floor(range.min / 10 ** units),
    max: Math.ceil(range.max / 10 ** units),
  };
}

/**
 * Products, facets and paging for a category. Shared by the page and its metadata (both cached),
 * so an out-of-range page can answer 404 before the response starts streaming.
 */
export async function loadListing(
  ctx: Ctx,
  config: StoreConfig,
  categoryId: string,
  query: CatalogQuery,
) {
  const minorUnits =
    config.currencies.find((c) => c.code === config.store.defaultCurrency)?.minorUnits ?? 2;
  const searched = needsSearch(query);
  // Facets and the price range come from the search index; listings without refinements use the
  // shop's merchandised order (category positions).
  const [search, listing] = await Promise.all([
    searchCatalog(
      ctx,
      searched
        ? toApiSearch(query, { category: categoryId, minorUnits })
        : { category: categoryId, page: 1, limit: 1 },
    ),
    searched
      ? null
      : getCategoryProducts(ctx, categoryId, {
          page: query.page,
          limit: PAGE_SIZE,
          sort: CATEGORY_SORT[query.sort] ?? 'position',
          includeSubcategories: true,
        }),
  ]);
  const products = (searched ? search?.data : listing?.data) ?? [];
  const total = (searched ? search?.total : listing?.total) ?? 0;
  return { search, products, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function CategoryView({
  ctx,
  config,
  match,
  prefix,
  query,
  canonicalPath,
}: {
  ctx: Ctx;
  config: StoreConfig;
  match: CategoryMatch;
  prefix: string;
  query: CatalogQuery;
  canonicalPath: string;
}) {
  const t = translator(ctx.locale);
  const { node, ancestors } = match;
  const to = (path: string) => href(path, prefix);
  const [{ search, products, total, pages }, regions] = await Promise.all([
    loadListing(ctx, config, node.id, query),
    getPlacements(ctx, 'CATEGORY', node.id),
  ]);
  // Past the last page: an empty, noindex page with a way back (a status can't change mid-stream).
  const pastEnd = query.page > pages;

  const facets = usefulFacets(search?.facets ?? [], query);
  const price = priceInfo(config, ctx, search?.priceRange);
  const description = cleanHtml(node.description);
  const children = (node.children ?? []).filter((c) => c.includeInMenu !== false);
  const parent = ancestors.at(-1);
  const siblings =
    !children.length && parent
      ? (parent.children ?? []).filter((c) => c.includeInMenu !== false)
      : [];
  const chips = children.length ? children : siblings;
  const crumbs = [
    { label: t('nav.home'), href: to('/') },
    ...ancestors.map((a) => ({ label: a.name, href: to(`/${a.urlPath}`) })),
    { label: node.name },
  ];
  const pageHref = (page: number) => {
    const qs = toSearchParams({ ...query, page }, 'category').toString();
    return `${to(`/${canonicalPath}`)}${qs ? `?${qs}` : ''}`;
  };
  const from = total ? (query.page - 1) * PAGE_SIZE + 1 : 0;
  const ld = absoluteUrl('/')
    ? breadcrumbJsonLd(
        [...ancestors, node].map((c) => ({ name: c.name, url: absoluteUrl(to(`/${c.urlPath}`))! })),
      )
    : null;

  return (
    <div className="container-page pt-6 pb-[var(--section-y)] md:pt-8">
      {ld && <JsonLd data={ld} />}
      <Breadcrumbs items={crumbs} label={t('a11y.breadcrumbs')} />
      <header className="mt-6 grid max-w-3xl gap-3">
        <h1 className="text-h1">{node.name}</h1>
        {description && (
          <div
            className="prose-store text-body-lg text-fg-muted"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </header>

      {chips.length > 0 && (
        <nav
          aria-label={t('catalog.categories')}
          className="-mx-[var(--gutter)] mt-6 scrollbar-none overflow-x-auto px-[var(--gutter)]"
        >
          <ul className="flex gap-2">
            {parent && !children.length && (
              <li>
                <Link
                  href={to(`/${parent.urlPath}`)}
                  className="focus-ring inline-flex h-10 items-center rounded-full border border-border-strong px-4 text-small font-medium whitespace-nowrap hover:border-fg"
                >
                  {t('catalog.all')}
                </Link>
              </li>
            )}
            {chips.map((c) => {
              const current = c.id === node.id;
              return (
                <li key={c.id}>
                  <Link
                    href={to(`/${c.urlPath}`)}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'focus-ring inline-flex h-10 items-center rounded-full border px-4 text-small font-medium whitespace-nowrap',
                      current
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-border-strong hover:border-fg',
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Blocks placed on this category (first page only: they introduce the listing). */}
      {query.page === 1 && <Regions regions={regions} where="top" className="mt-8" />}

      <CatalogProvider query={query} kind="category">
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          {(facets.length > 0 || price) && (
            <aside aria-label={t('catalog.filters')} className="hidden lg:block">
              <div className="sticky top-[calc(var(--header-height)+24px)]">
                <FilterPanel facets={facets} price={price} />
              </div>
            </aside>
          )}
          <div
            className={cn(
              'grid min-w-0 content-start gap-6',
              !facets.length && !price && 'lg:col-span-2',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <p className="tabular text-small text-fg-muted" aria-live="polite">
                {t('catalog.results', { n: total })}
              </p>
              <div className="flex items-center gap-2">
                <FiltersButton facets={facets} price={price} total={total} />
                <SortSelect />
              </div>
            </div>
            <ActiveFilters facets={facets} price={price} />
            <Results>
              {products.length ? (
                <ProductGrid
                  products={products}
                  hrefFor={(p) => to(`/${p.urlPath ?? p.slug}`)}
                  t={t}
                  withSidebar={facets.length > 0 || !!price}
                  eager={2}
                />
              ) : pastEnd ? (
                <div className="grid justify-items-center gap-3 rounded-card bg-surface-muted px-6 py-16 text-center">
                  <h2 className="text-h3">{t('catalog.empty')}</h2>
                  <Link
                    href={pageHref(1)}
                    className={cn(buttonVariants({ variant: 'secondary' }), 'mt-2')}
                  >
                    {t('pager.page', { n: 1 })}
                  </Link>
                </div>
              ) : (
                <div className="grid justify-items-center gap-3 rounded-card bg-surface-muted px-6 py-16 text-center">
                  <h2 className="text-h3">
                    {hasRefinements(query) ? t('catalog.empty') : t('catalog.emptyCategory')}
                  </h2>
                  <p className="max-w-sm text-fg-muted">
                    {hasRefinements(query)
                      ? t('catalog.emptyBody')
                      : t('catalog.emptyCategoryBody')}
                  </p>
                  {!hasRefinements(query) && (
                    <Link
                      href={to('/')}
                      className={cn(buttonVariants({ variant: 'secondary' }), 'mt-2')}
                    >
                      {t('error.backHome')}
                    </Link>
                  )}
                </div>
              )}
            </Results>
            {total > PAGE_SIZE && (
              <div className="grid justify-items-center gap-3 pt-6">
                <Pagination
                  page={query.page}
                  pages={pages}
                  hrefFor={pageHref}
                  labels={{
                    nav: t('pager.nav'),
                    previous: t('pager.previous'),
                    next: t('pager.next'),
                    page: (n) => t('pager.page', { n }),
                  }}
                />
                <p className="tabular text-caption text-fg-muted">
                  {t('catalog.showing', {
                    from,
                    to: Math.min(total, query.page * PAGE_SIZE),
                    total,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </CatalogProvider>
      {query.page === 1 && (
        <Regions regions={regions} where="bottom" className="mt-[var(--section-y)] max-w-3xl" />
      )}
    </div>
  );
}
