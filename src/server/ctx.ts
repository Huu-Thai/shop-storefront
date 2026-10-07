import 'server-only';
import { notFound } from 'next/navigation';
import { ctx as rootCtx } from 'next/root-params';
import { type Ctx, decodeCtx } from '@/lib/routing';
import { getConfig } from './storefront';

/**
 * The current store / locale / currency, from the internal `[ctx]` root segment the proxy rewrites
 * to. A malformed or unknown ctx 404s (it never comes from a real URL).
 */
export async function requireCtx(): Promise<Ctx> {
  const c = decodeCtx(await rootCtx());
  if (!c || !(await getConfig(c))) notFound();
  return c;
}
