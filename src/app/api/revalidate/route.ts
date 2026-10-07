import { revalidateTag } from 'next/cache';
import { env } from '@/server/env';
import { invalidationFor, verifySignature, type WebhookEvent } from '@/server/revalidation';
import { resetRoutingTable } from '@/server/routing-table';
import { clearUrlCache } from '@/server/url-cache';

/**
 * Receives the shop's webhooks and invalidates exactly the cached pages they affect, so content
 * published in Shop Admin shows without a redeploy (docs/DEPLOY.md → Cache freshness).
 * Edits use stale-while-revalidate; take-downs and deletions are dropped at once.
 */
export async function POST(req: Request) {
  const secret = env().WEBHOOK_SECRET;
  if (!secret) return Response.json({ message: 'Not configured' }, { status: 404 });
  const body = await req.text();
  if (!verifySignature(req.headers.get('x-shop-signature'), body, secret))
    return Response.json({ message: 'Invalid signature' }, { status: 401 });
  let event: WebhookEvent;
  try {
    event = JSON.parse(body) as WebhookEvent;
  } catch {
    return Response.json({ message: 'Invalid body' }, { status: 400 });
  }
  const inv = invalidationFor(event);
  for (const tag of inv.tags) revalidateTag(tag, inv.immediate ? { expire: 0 } : 'max');
  if (inv.urls) clearUrlCache();
  if (inv.stores) resetRoutingTable();
  return Response.json(
    { received: event.type, revalidated: inv.tags },
    { headers: { 'cache-control': 'no-store' } },
  );
}
