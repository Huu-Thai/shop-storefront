import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { prefixFor } from '@/lib/routing';
import { apiBase, env } from './env';
import { routingTable } from './routing-table';

export interface StoreLink {
  code: string;
  name: string;
  /** Where the store lives: a path prefix on this site, or an absolute URL on its own domain. */
  href: string;
}

/** Stores for the switcher (cached; the routing table itself is in memory). */
export async function getStoreLinks(): Promise<StoreLink[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('config');
  const e = env();
  const table = await routingTable({
    apiBase: apiBase(),
    defaultStore: e.DEFAULT_STORE,
    extraStores: e.STORES,
  });
  return table.stores.map((s) => ({
    code: s.code,
    name: s.name,
    href:
      prefixFor(table, { store: s.code, locale: s.defaultLocale, currency: s.defaultCurrency }) ||
      '/',
  }));
}
