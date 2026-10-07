import { connection } from 'next/server';
import { href } from '@/lib/routing';
import { apiBase, env } from '@/server/env';
import { ctxFrom } from '@/server/gateway';
import { routingTable } from '@/server/routing-table';
import { getPrefix, getProduct } from '@/server/storefront';

export interface LineCard {
  id: string;
  name: string;
  href: string;
  image: {
    url: string;
    width?: number | null;
    height?: number | null;
    alt?: string | null;
    renditions?: { width: number; height: number; url: string }[] | null;
  } | null;
  /** option code → { label, values: value code → label } (to show "Colour: Black"). */
  options: Record<string, { label: string; values: Record<string, string> }>;
  /** variant id → its first image, when variants have their own. */
  variantImages: Record<string, LineCard['image']>;
}

/**
 * Display data for cart and order lines (the cart only carries SKUs and product ids): name, link,
 * image and option labels, from the cached catalog. Anonymous, so browsers may cache it briefly.
 *   GET /api/catalog/cards?ids=<id>,<id>   with the x-sf-ctx header
 */
export async function GET(req: Request) {
  // Per request (it depends on the shopper's store header), never prerendered at build time.
  await connection();
  const e = env();
  const table = await routingTable({
    apiBase: apiBase(),
    defaultStore: e.DEFAULT_STORE,
    extraStores: e.STORES,
  });
  const ctx = ctxFrom(req, table);
  if (!ctx) return Response.json({ message: 'Unknown store' }, { status: 400 });
  const ids = [
    ...new Set(
      (new URL(req.url).searchParams.get('ids') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^[0-9a-f-]{36}$/i.test(s)),
    ),
  ].slice(0, 50);
  const prefix = await getPrefix(ctx);
  const products = await Promise.all(ids.map((id) => getProduct(ctx, id).catch(() => null)));
  const cards: LineCard[] = products
    .filter((p) => !!p)
    .map((p) => ({
      id: p.id,
      name: p.name,
      href: href(`/${p.urlPath ?? p.slug}`, prefix),
      image: p.images[0] ?? null,
      options: Object.fromEntries(
        p.configurableOptions.map((o) => [
          o.code,
          { label: o.label, values: Object.fromEntries(o.values.map((v) => [v.code, v.label])) },
        ]),
      ),
      variantImages: Object.fromEntries(
        p.variants.filter((v) => v.images.length).map((v) => [v.id, v.images[0]]),
      ),
    }));
  return Response.json(cards, {
    headers: { 'cache-control': 'private, max-age=300', vary: 'x-sf-ctx' },
  });
}
