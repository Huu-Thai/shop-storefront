import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Shop webhooks → cache invalidation. The shop signs every delivery:
 *   X-Shop-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">
 * Old timestamps are refused (replays).
 */
export function verifySignature(
  header: string | null,
  body: string,
  secret: string,
  now = Date.now(),
  toleranceSeconds = 300,
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => p.trim().split('=') as [string, string]),
  );
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > toleranceSeconds || !parts.v1) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  const given = Buffer.from(parts.v1, 'utf8');
  const want = Buffer.from(expected, 'utf8');
  return given.length === want.length && timingSafeEqual(given, want);
}

export interface WebhookEvent {
  type: string;
  data?: Record<string, unknown>;
}

export interface Invalidation {
  tags: string[];
  /** Taken down or deleted: never serve the old version again (no stale-while-revalidate). */
  immediate: boolean;
  /** URLs may have changed: drop the proxy's in-memory URL answers. */
  urls: boolean;
  /** Store settings changed: reload the routing table. */
  stores: boolean;
}

/** Which cached data an event affects (tags assigned in src/server/storefront.ts). */
export function invalidationFor(event: WebhookEvent): Invalidation {
  const [entity, action = ''] = event.type.split(/\.(?=[^.]+$)/);
  const d = event.data ?? {};
  const id = String(d.entityId ?? d.id ?? d.productId ?? d.categoryId ?? '');
  const immediate = action === 'deleted' || action === 'unpublished';
  const out = (tags: string[], urls = false, stores = false): Invalidation => ({
    tags: [...new Set(tags.filter(Boolean))],
    immediate,
    urls,
    stores,
  });
  switch (entity) {
    case 'page':
      return out(['pages', id && `page:${id}`, 'urls'], true);
    case 'post':
      return out(['posts', id && `post:${id}`, 'urls'], true);
    case 'block':
    case 'block-placement':
      return out(['blocks']);
    case 'menu':
    case 'menu-item':
      return out(['menus']);
    case 'banner':
      return out(['banners']);
    case 'slider':
    case 'slide':
      return out(['sliders']);
    case 'category':
      return out(['categories', 'listings', id && `category:${id}`, 'urls'], true);
    case 'product':
      return out(['products', 'listings', id && `product:${id}`, 'urls'], true);
    case 'inventory':
      return out(['stock']);
    case 'price-book':
      return out(['prices']);
    case 'url-rewrites':
      return out(['urls'], true);
    case 'store':
      return out(['config'], false, true);
    default:
      return out([]);
  }
}
