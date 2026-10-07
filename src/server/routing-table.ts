import type { RoutingTable, StoreRoute } from '@/lib/routing';

/**
 * The stores this deployment serves, read from the shop's `/store/config` (no secrets: the same
 * data every shopper's browser can see). Kept in memory and refreshed every minute; when the shop
 * is unreachable the last good table keeps the site up. Used by the proxy (every request) and by
 * pages (links), so it must not depend on request APIs.
 */
const TTL_MS = 60_000;

interface ConfigBody {
  store: {
    code: string;
    name: string;
    baseUrl: string | null;
    defaultLocale: string;
    defaultCurrency: string;
  };
  website: { code: string };
  locales: { code: string }[];
  currencies: { code: string }[];
  stores: { code: string }[];
}

// On globalThis: shared by the proxy and route handlers (bundled separately, same process).
const KEY = Symbol.for('shop-storefront.routing-table');
interface State {
  current: { table: RoutingTable; at: number } | null;
  loading: Promise<RoutingTable> | null;
}
const g = globalThis as typeof globalThis & { [KEY]?: State };
const state: State = (g[KEY] ??= { current: null, loading: null });

async function config(
  apiBase: string,
  store: string,
  fetchImpl: typeof fetch,
): Promise<ConfigBody> {
  const res = await fetchImpl(`${apiBase}/store/config`, {
    headers: { 'x-store': store, accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`store ${store}: /store/config answered ${res.status}`);
  return res.json() as Promise<ConfigBody>;
}

export async function loadRoutingTable(
  opts: { apiBase: string; defaultStore: string; extraStores: string[] },
  fetchImpl: typeof fetch = fetch,
): Promise<RoutingTable> {
  const first = await config(opts.apiBase, opts.defaultStore, fetchImpl);
  const codes = [
    ...new Set([opts.defaultStore, ...first.stores.map((s) => s.code), ...opts.extraStores]),
  ];
  const configs = await Promise.all(
    codes.map((c) =>
      c === opts.defaultStore
        ? first
        : config(opts.apiBase, c, fetchImpl).catch((e: Error) => {
            // One misconfigured extra store must not take the whole site down.
            console.error(`[routing] ${e.message}; store skipped`);
            return null;
          }),
    ),
  );
  const stores: StoreRoute[] = configs
    .filter((c): c is ConfigBody => !!c)
    .map((c) => ({
      code: c.store.code,
      name: c.store.name,
      website: c.website.code,
      baseUrl: c.store.baseUrl,
      defaultLocale: c.store.defaultLocale,
      locales: c.locales.map((l) => l.code),
      defaultCurrency: c.store.defaultCurrency,
      currencies: c.currencies.map((x) => x.code),
    }));
  return { defaultStore: opts.defaultStore, stores };
}

/** The routing table, from memory when fresh. Throws only if it was never loaded. */
export async function routingTable(
  opts: { apiBase: string; defaultStore: string; extraStores: string[] },
  now = Date.now(),
): Promise<RoutingTable> {
  if (state.current && now - state.current.at < TTL_MS) return state.current.table;
  state.loading ??= loadRoutingTable(opts)
    .then((table) => {
      state.current = { table, at: Date.now() };
      return table;
    })
    .catch((e: Error) => {
      if (state.current) {
        console.error(`[routing] ${e.message}; serving the last known stores`);
        state.current = { table: state.current.table, at: Date.now() - TTL_MS + 10_000 }; // retry in 10 s
        return state.current.table;
      }
      throw e;
    })
    .finally(() => {
      state.loading = null;
    });
  return state.loading;
}

/** Options from the environment (plain process.env: the proxy can't import server-only modules). */
export function routingOptions() {
  return {
    apiBase: `${(process.env.SHOP_API_URL ?? '').replace(/\/+$/, '')}/api/v1`,
    defaultStore: process.env.DEFAULT_STORE ?? '',
    extraStores: (process.env.STORES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** Reload the stores on the next request (their settings changed). */
export function resetRoutingTable(): void {
  state.current = null;
}
