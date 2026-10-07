import { connection } from 'next/server';
import { env } from '@/server/env';

/** robots.txt: personal and utility pages stay out of search engines; the sitemap is listed. */
export async function GET() {
  await connection();
  const site = env().SITE_URL?.replace(/\/+$/, '');
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /*/cart',
    'Disallow: /cart',
    'Disallow: /*/checkout',
    'Disallow: /checkout',
    'Disallow: /*/account',
    'Disallow: /account',
    'Disallow: /*/orders/',
    'Disallow: /orders/',
    'Disallow: /*?*sort=',
    ...(site ? ['', `Sitemap: ${site}/sitemap.xml`] : []),
  ];
  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
