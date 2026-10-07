import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { href, type RoutingTable, type StoreRoute } from '@/lib/routing';
import { type SitemapUrl, sitemapFile } from '@/lib/sitemap-xml';
import { themeConfig } from '@/theme/config';
import { env } from './env';
import {
  type CategoryNode,
  getCategoryTree,
  getMenu,
  getPrefix,
  listPosts,
  type MenuItem,
  searchCatalog,
} from './storefront';

/** Origin a store is served from: its baseUrl's host, or SITE_URL. */
export function storeOrigin(store: StoreRoute): string | null {
  if (store.baseUrl) {
    try {
      return new URL(store.baseUrl).origin;
    } catch {
      return null;
    }
  }
  return env().SITE_URL?.replace(/\/+$/, '') ?? null;
}

export function sitemapLocs(table: RoutingTable): string[] {
  return table.stores.flatMap((s) => {
    const origin = storeOrigin(s);
    return origin ? s.locales.map((l) => `${origin}/sitemaps/${sitemapFile(s.code, l)}`) : [];
  });
}

const MAX_PRODUCT_PAGES = 50; // 5 000 products per store and language; split further if needed

/** Every public URL of one store in one language (cached; refreshed with the catalog). */
export async function storeUrls(
  store: StoreRoute,
  locale: string,
  origin: string,
): Promise<SitemapUrl[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${store.code}`, 'categories', 'listings', 'posts', 'menus', 'urls');
  const ctx = { store: store.code, locale, currency: store.defaultCurrency };
  const prefix = await getPrefix(ctx);
  const abs = (path: string) => `${origin}${href(path, prefix)}`;
  const urls: SitemapUrl[] = [{ loc: abs('/') }];

  const walk = (nodes: CategoryNode[]) =>
    nodes.forEach((c) => {
      if (c.urlPath) urls.push({ loc: abs(`/${c.urlPath}`) });
      walk(c.children ?? []);
    });
  walk(await getCategoryTree(ctx));

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    const res = await searchCatalog(ctx, { page, limit: 100 });
    for (const p of res?.data ?? []) urls.push({ loc: abs(`/${p.urlPath ?? p.slug}`) });
    if (!res || page * 100 >= res.total) break;
  }

  urls.push({ loc: abs('/blog') });
  for (let page = 1; page <= 20; page++) {
    const res = await listPosts(ctx, { page, limit: 100 });
    for (const p of res?.data ?? [])
      urls.push({ loc: abs(`/${p.urlPath}`), lastmod: p.publishedAt });
    if (!res || page * 100 >= res.total) break;
  }

  // CMS pages have no listing in the store API: take the ones the store links to from its menus.
  const pages = (items: MenuItem[]): string[] =>
    items.flatMap((i) => [
      ...(i.linkType === 'PAGE' && i.url ? [i.url] : []),
      ...pages(i.children ?? []),
    ]);
  const menus = await Promise.all([
    getMenu(ctx, themeConfig.menus.main),
    getMenu(ctx, themeConfig.menus.footer),
  ]);
  for (const m of menus) for (const url of pages(m?.items ?? [])) urls.push({ loc: abs(url) });
  return urls;
}
