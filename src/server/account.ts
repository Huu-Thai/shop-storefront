import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { type Ctx, href, PATH_HEADER, sameWebsite } from '@/lib/routing';
import { apiBase, env } from './env';
import { routingTable } from './routing-table';
import { getSession } from './session';
import type { Session } from './session-crypto';
import { getPrefix } from './storefront';

/** The signed-in customer of this store's website, or null. Dynamic: reads the session cookie. */
export async function currentCustomer(ctx: Ctx): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;
  const e = env();
  const table = await routingTable({
    apiBase: apiBase(),
    defaultStore: e.DEFAULT_STORE,
    extraStores: e.STORES,
  });
  return sameWebsite(table, session.store, ctx.store) ? session : null;
}

/** Account pages: the customer, or a redirect to sign-in that brings them back here. */
export async function requireCustomer(ctx: Ctx): Promise<Session> {
  const customer = await currentCustomer(ctx);
  if (customer) return customer;
  const prefix = await getPrefix(ctx);
  const back = (await headers()).get(PATH_HEADER) ?? href('/account', prefix);
  redirect(`${href('/account/sign-in', prefix)}?next=${encodeURIComponent(back)}`);
}
