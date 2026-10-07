/**
 * The catalog query behind category and search pages, as it appears in the URL:
 *   ?q=tee&color=red,blue&size=m&price=10-50&stock=1&sort=price_asc&page=2
 * Attribute filters use the attribute code as the parameter (OR within one, AND across); `price`
 * is in major units of the store's default currency. Pure — shared by pages, the filter panel and
 * tests.
 */

export const PAGE_SIZE = 24;

export const SORTS = {
  category: ['featured', 'newest', 'price_asc', 'price_desc', 'name'],
  search: ['relevance', 'newest', 'price_asc', 'price_desc', 'name'],
} as const;
export type CategorySort = (typeof SORTS.category)[number];
export type SearchSort = (typeof SORTS.search)[number];

const RESERVED = new Set(['q', 'sort', 'page', 'price', 'stock']);
const CODE = /^[a-z][a-z0-9_]{0,63}$/i;
const VALUE = /^[\w.-]{1,64}$/;

export interface CatalogQuery {
  q: string;
  /** attribute code → selected option codes */
  filters: Record<string, string[]>;
  /** Major units, store default currency. */
  priceMin?: number;
  priceMax?: number;
  inStock: boolean;
  sort: string;
  page: number;
}

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export function parseQuery(params: Params, kind: keyof typeof SORTS): CatalogQuery {
  const filters: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (RESERVED.has(key) || !CODE.test(key)) continue;
    const values = [
      ...new Set(
        (Array.isArray(raw) ? raw : [raw ?? ''])
          .flatMap((v) => v.split(','))
          .map((v) => v.trim())
          .filter((v) => VALUE.test(v)),
      ),
    ].sort();
    if (values.length) filters[key.toLowerCase()] = values.slice(0, 20);
  }
  const [lo, hi] = first(params.price).split('-');
  const num = (s: string | undefined) => {
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const sorts: readonly string[] = SORTS[kind];
  const sort = sorts.includes(first(params.sort)) ? first(params.sort) : sorts[0];
  const page = Math.min(Math.max(parseInt(first(params.page), 10) || 1, 1), 500);
  return {
    q: first(params.q).trim().slice(0, 200),
    filters: Object.fromEntries(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))),
    priceMin: num(lo),
    priceMax: num(hi),
    inStock: first(params.stock) === '1',
    sort,
    page,
  };
}

/** URL parameters for a query (stable order; defaults omitted). */
export function toSearchParams(query: CatalogQuery, kind: keyof typeof SORTS): URLSearchParams {
  const p = new URLSearchParams();
  if (query.q) p.set('q', query.q);
  for (const [code, values] of Object.entries(query.filters))
    if (values.length) p.set(code, values.join(','));
  if (query.priceMin !== undefined || query.priceMax !== undefined)
    p.set('price', `${query.priceMin ?? ''}-${query.priceMax ?? ''}`);
  if (query.inStock) p.set('stock', '1');
  if (query.sort !== SORTS[kind][0]) p.set('sort', query.sort);
  if (query.page > 1) p.set('page', String(query.page));
  return p;
}

export function hasRefinements(query: CatalogQuery): boolean {
  return (
    Object.keys(query.filters).length > 0 ||
    query.priceMin !== undefined ||
    query.priceMax !== undefined ||
    query.inStock
  );
}

/**
 * A category page shows the shop's merchandised order (the category endpoint) unless the shopper
 * filters, searches or sorts by price — those need the search index.
 */
export function needsSearch(query: CatalogQuery): boolean {
  return (
    hasRefinements(query) || !!query.q || query.sort === 'price_asc' || query.sort === 'price_desc'
  );
}

export interface ApiSearchQuery {
  q?: string;
  category?: string;
  filter?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  sort?: SearchSort;
  page: number;
  limit: number;
}

/** The shop's /store/search query (price in minor units of the default currency). */
export function toApiSearch(
  query: CatalogQuery,
  opts: { category?: string; minorUnits: number },
): ApiSearchQuery {
  const minor = (n?: number) =>
    n === undefined ? undefined : Math.round(n * 10 ** opts.minorUnits);
  const filter = Object.entries(query.filters).map(([c, v]) => `${c}:${v.join(',')}`);
  return {
    q: query.q || undefined,
    category: opts.category,
    filter: filter.length ? filter : undefined,
    priceMin: minor(query.priceMin),
    priceMax: minor(query.priceMax),
    inStock: query.inStock || undefined,
    sort: query.sort === 'featured' ? 'relevance' : (query.sort as SearchSort),
    page: query.page,
    limit: PAGE_SIZE,
  };
}
