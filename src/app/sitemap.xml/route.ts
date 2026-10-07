import { connection } from 'next/server';
import { sitemapIndex } from '@/lib/sitemap-xml';
import { apiBase, env } from '@/server/env';
import { routingTable } from '@/server/routing-table';
import { sitemapLocs } from '@/server/sitemap';

/** Sitemap index: one sitemap per store and language. Needs SITE_URL (absolute URLs). */
export async function GET() {
  await connection();
  const e = env();
  if (!e.SITE_URL) return new Response('Set SITE_URL to publish sitemaps.', { status: 404 });
  const table = await routingTable({
    apiBase: apiBase(),
    defaultStore: e.DEFAULT_STORE,
    extraStores: e.STORES,
  });
  return new Response(sitemapIndex(sitemapLocs(table)), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
