import { connection } from 'next/server';
import { parseSitemapFile, urlset } from '@/lib/sitemap-xml';
import { apiBase, env } from '@/server/env';
import { routingTable } from '@/server/routing-table';
import { storeOrigin, storeUrls } from '@/server/sitemap';

/** /sitemaps/<store>.<locale>.xml — every public URL of one store in one language. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  await connection();
  const parsed = parseSitemapFile((await params).file);
  const e = env();
  const table = await routingTable({
    apiBase: apiBase(),
    defaultStore: e.DEFAULT_STORE,
    extraStores: e.STORES,
  });
  const store = parsed && table.stores.find((s) => s.code === parsed.store);
  const origin = store && storeOrigin(store);
  if (!parsed || !store || !store.locales.includes(parsed.locale) || !origin)
    return new Response('Not found', { status: 404 });
  return new Response(urlset(await storeUrls(store, parsed.locale, origin)), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
