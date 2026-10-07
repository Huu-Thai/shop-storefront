/**
 * Store routing (PLAN.md §2) — pure functions shared by the proxy, pages and tests.
 *
 * Public URL = <store base> [/<locale>] /<path>
 *   - store base: the store's `baseUrl` (host + path) when the shop sets one; otherwise `/` for the
 *     default store and `/<store-code>` for the others;
 *   - locale segment: lower-cased BCP 47 code (`/en-us`) when not the store's default locale;
 *   - currency: never in the URL; a cookie picks one of the store's currencies.
 * Internally every page lives under `/[ctx]/…` with ctx = `<store>.<locale>.<currency>`, so pages
 * can be cached per combination (Cache Components) without reading cookies.
 */

/** Header the proxy sets with the public prefix (store base + locale) for dynamic code. */
export const PREFIX_HEADER = 'x-sf-prefix';
/** Header the proxy sets with the public path + query (sign-in redirects back to it). */
export const PATH_HEADER = 'x-sf-path';

/**
 * First path segments that belong to storefront routes rather than the shop's catalog URLs. A
 * category or product whose URL key equals one of these is shadowed — avoid them in Shop Admin.
 */
export const APP_ROUTES = ['search', 'cart', 'checkout', 'account', 'orders', 'sf-404'];

/** Internal route the proxy rewrites unknown catalog URLs to (rendered with status 404). */
export const MISSING_ROUTE = 'sf-404';

/** Theme routes that own only their exact path (`/blog`; posts below it are shop URLs). */
export const EXACT_APP_ROUTES = ['/blog'];

/** Whether a store-relative path is a catalog URL the shop resolves. */
export function isCatalogPath(rest: string): boolean {
  const first = rest.split('/')[1] ?? '';
  return (
    rest !== '/' &&
    !!first &&
    !APP_ROUTES.includes(first.toLowerCase()) &&
    !EXACT_APP_ROUTES.includes(rest.toLowerCase().replace(/\/+$/, ''))
  );
}

export interface Ctx {
  store: string;
  locale: string;
  currency: string;
}

export interface StoreRoute {
  code: string;
  name: string;
  /** Website code: customer accounts and carts are per website. */
  website: string;
  /** Absolute base URL from the shop, if any (e.g. https://shop.vn/ or https://shop.com/vn). */
  baseUrl: string | null;
  defaultLocale: string;
  locales: string[];
  defaultCurrency: string;
  currencies: string[];
}

export interface RoutingTable {
  defaultStore: string;
  stores: StoreRoute[];
}

const STORE = /^[a-z][a-z0-9_-]{0,63}$/;
const LOCALE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const CURRENCY = /^[A-Z]{3}$/;

export function encodeCtx(c: Ctx): string {
  return `${c.store}.${c.locale}.${c.currency}`;
}

/** Parses an internal ctx segment; null when malformed (it then 404s). */
export function decodeCtx(value: string | undefined): Ctx | null {
  const parts = decodeURIComponent(value ?? '').split('.');
  if (parts.length !== 3) return null;
  const [store, locale, currency] = parts;
  if (!STORE.test(store) || !LOCALE.test(locale) || !CURRENCY.test(currency)) return null;
  return { store, locale, currency };
}

const trimSlashes = (p: string) => p.replace(/^\/+|\/+$/g, '');

/** The path prefix a store owns on a given host ('' = root), or null if it's not served there. */
export function storeBase(route: StoreRoute, host: string, table: RoutingTable): string | null {
  if (route.baseUrl) {
    try {
      const u = new URL(route.baseUrl);
      if (u.host.toLowerCase() !== host.toLowerCase()) return null;
      const p = trimSlashes(u.pathname);
      return p ? `/${p}` : '';
    } catch {
      return null;
    }
  }
  return route.code === table.defaultStore ? '' : `/${route.code}`;
}

const segmentMatches = (path: string, base: string) =>
  base === '' || path === base || path.startsWith(`${base}/`);

export interface Resolved {
  ctx: Ctx;
  /** Public prefix: store base + locale segment (no trailing slash; '' at the root). */
  prefix: string;
  /** The rest of the path, starting with '/'. */
  rest: string;
}

/**
 * Resolves a request to its store, locale and currency. Longest matching store base wins (a store
 * at `/vn` beats the default store at `/`), then a store bound to the host by its `baseUrl`; a store
 * whose `baseUrl` is on another host is never matched here. Falls back to the default store.
 */
export function resolve(
  table: RoutingTable,
  host: string,
  pathname: string,
  currencyCookie?: string,
): Resolved | null {
  const path = pathname.replace(/\/{2,}/g, '/') || '/';
  // Longest base wins; on a tie, a store bound to this host by its baseUrl beats one that isn't.
  const score = (route: StoreRoute, base: string) => base.length * 2 + (route.baseUrl ? 1 : 0);
  let best: { route: StoreRoute; base: string; score: number } | null = null;
  for (const route of table.stores) {
    const base = storeBase(route, host, table);
    if (base === null || !segmentMatches(path, base)) continue;
    const s = score(route, base);
    if (!best || s > best.score) best = { route, base, score: s };
  }
  if (!best) {
    const fallback = table.stores.find((s) => s.code === table.defaultStore);
    if (!fallback) return null;
    best = { route: fallback, base: '', score: 0 };
  }
  const { route, base } = best;
  let rest = path.slice(base.length) || '/';
  if (!rest.startsWith('/')) rest = `/${rest}`;

  let locale = route.defaultLocale;
  let localeSegment = '';
  const first = rest.split('/')[1]?.toLowerCase();
  const match = route.locales.find((l) => l.toLowerCase() === first && l !== route.defaultLocale);
  if (first && match) {
    locale = match;
    localeSegment = `/${first}`;
    rest = rest.slice(first.length + 1) || '/';
  }
  const currency =
    currencyCookie && route.currencies.includes(currencyCookie)
      ? currencyCookie
      : route.defaultCurrency;
  return { ctx: { store: route.code, locale, currency }, prefix: `${base}${localeSegment}`, rest };
}

/** Public prefix for a ctx (store base + locale), as seen on `host`. */
export function prefixFor(table: RoutingTable, ctx: Ctx, host = ''): string {
  const route = table.stores.find((s) => s.code === ctx.store);
  if (!route) return '';
  let base = storeBase(route, host, table);
  if (base === null) {
    // The store lives on another host: absolute URL to its base.
    try {
      const u = new URL(route.baseUrl!);
      base = `${u.origin}${trimSlashes(u.pathname) ? `/${trimSlashes(u.pathname)}` : ''}`;
    } catch {
      base = '';
    }
  }
  const loc = ctx.locale === route.defaultLocale ? '' : `/${ctx.locale.toLowerCase()}`;
  return `${base}${loc}`;
}

/**
 * Public URL of a storefront path: `href('/men', '/vn-vi')` → `/vn-vi/men`. Absolute and
 * protocol-relative URLs, mailto: and tel: pass through.
 */
export function href(path: string, prefix: string): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!prefix) return p;
  return p === '/' ? prefix : `${prefix}${p}`;
}

/** Whether two stores share a website (and so customer accounts). */
export function sameWebsite(table: RoutingTable, a: string, b: string): boolean {
  const wa = table.stores.find((s) => s.code === a)?.website;
  return !!wa && wa === table.stores.find((s) => s.code === b)?.website;
}
