import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { Link } from '@/components/intent-link';
import {
  ActiveFilters,
  CatalogProvider,
  FilterPanel,
  FiltersButton,
  Results,
  SortSelect,
} from '@/components/catalog/catalog-controls';
import { priceInfo, usefulFacets } from '@/components/catalog/category-view';
import { ProductGrid } from '@/components/catalog/product-grid';
import { Pagination } from '@/components/ui/pagination';
import { translator } from '@/i18n';
import { PAGE_SIZE, parseQuery, toApiSearch, toSearchParams } from '@/lib/catalog-query';
import { cn } from '@/lib/cn';
import { href } from '@/lib/routing';
import { requireCtx } from '@/server/ctx';
import { getCategoryTree, getConfig, getPrefix, searchCatalog } from '@/server/storefront';

/** Search reads the query string, so it renders per request (results themselves are cached). */
export const instant = false;

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const { q } = parseQuery(await searchParams, 'search');
  return {
    title: q ? t('search.resultsFor', { q }) : t('search.title'),
    // Result pages are endless variations of the catalog: keep them out of search engines.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const query = parseQuery(await searchParams, 'search');
  const [config, prefix] = await Promise.all([getConfig(ctx), getPrefix(ctx)]);
  const to = (path: string) => href(path, prefix);
  const minorUnits =
    config?.currencies.find((c) => c.code === config.store.defaultCurrency)?.minorUnits ?? 2;
  const result = await searchCatalog(ctx, toApiSearch(query, { minorUnits }));
  const total = result?.total ?? 0;
  const products = result?.data ?? [];
  const facets = usefulFacets(result?.facets ?? [], query);
  const price = config ? priceInfo(config, ctx, result?.priceRange) : undefined;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tree = await getCategoryTree(ctx);
  // Category facets carry ids; the cached tree knows their URLs.
  const paths = new Map<string, string>();
  const index = (nodes: typeof tree) =>
    nodes.forEach((n) => {
      if (n.urlPath) paths.set(n.id, n.urlPath);
      index(n.children ?? []);
    });
  index(tree);
  const categoryLinks = query.q
    ? (result?.categories ?? []).filter((c) => c.count > 0 && paths.has(c.id))
    : [];

  return (
    <div className="container-page pt-8 pb-[var(--section-y)] md:pt-12">
      <header className="grid max-w-2xl gap-5">
        <h1 className="text-h1">
          {query.q ? t('search.resultsFor', { q: query.q }) : t('search.title')}
        </h1>
        {/* A plain GET form: works before JavaScript loads. */}
        <form role="search" action={to('/search')} className="relative">
          <label htmlFor="search-page-q" className="sr-only">
            {t('search.label')}
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-muted"
          />
          <input
            id="search-page-q"
            type="search"
            name="q"
            defaultValue={query.q}
            placeholder={t('header.searchPlaceholder')}
            enterKeyHint="search"
            className="focus-ring h-13 w-full rounded-button border border-border-strong bg-surface pr-28 pl-12 text-body placeholder:text-fg-subtle"
          />
          <button
            type="submit"
            className="focus-ring absolute top-1/2 right-1.5 h-10 -translate-y-1/2 rounded-button bg-primary px-5 text-small font-semibold text-primary-fg hover:bg-primary-hover"
          >
            {t('search.submit')}
          </button>
        </form>
        {categoryLinks.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t('catalog.categories')}>
            {categoryLinks.map((c) => (
              <li key={c.id}>
                <Link
                  href={to(`/${paths.get(c.id)}`)}
                  className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-3.5 text-small hover:border-fg"
                >
                  {c.name}
                  <span className="tabular text-caption text-fg-muted">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      {!query.q && !total ? (
        <section className="mt-12 grid gap-3">
          <h2 className="text-h3">{t('search.start')}</h2>
          <p className="text-fg-muted">{t('search.startBody')}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {tree.map((c) => (
              <li key={c.id}>
                <Link
                  href={to(`/${c.urlPath}`)}
                  className="focus-ring inline-flex h-10 items-center rounded-full bg-surface-sunken px-4 text-small font-medium hover:bg-border"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <CatalogProvider query={query} kind="search">
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
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
                ) : (
                  <div className="grid justify-items-center gap-3 rounded-card bg-surface-muted px-6 py-16 text-center">
                    <h2 className="text-h3">{t('search.empty', { q: query.q })}</h2>
                    <p className="max-w-sm text-fg-muted">{t('search.emptyBody')}</p>
                  </div>
                )}
              </Results>
              {total > PAGE_SIZE && (
                <div className="flex justify-center pt-6">
                  <Pagination
                    page={query.page}
                    pages={pages}
                    hrefFor={(page) =>
                      `${to('/search')}?${toSearchParams({ ...query, page }, 'search')}`
                    }
                    labels={{
                      nav: t('pager.nav'),
                      previous: t('pager.previous'),
                      next: t('pager.next'),
                      page: (n) => t('pager.page', { n }),
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </CatalogProvider>
      )}
    </div>
  );
}
