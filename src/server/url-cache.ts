import type { Ctx } from '@/lib/routing';

/**
 * The proxy's view of the shop's URL rewrites: what a storefront path is, so redirects and 404s
 * are answered before any HTML streams (a streamed page can't change its status code). Kept in
 * memory for a minute per store / locale; pages still resolve through the cached data layer.
 */
export type PathOutcome =
  | { kind: 'page' }
  | { kind: 'missing' }
  | { kind: 'redirect'; location: string; status: 301 | 302 | 308 };

const TTL_MS = 60_000;
const MAX = 5_000;
// On globalThis: the proxy and route handlers are bundled separately but share the process, so
// /api/revalidate can clear what the proxy remembers.
const KEY = Symbol.for('shop-storefront.url-cache');
const g = globalThis as typeof globalThis & {
  [KEY]?: Map<string, { at: number; outcome: PathOutcome }>;
};
const memo = (g[KEY] ??= new Map());

export async function resolveForProxy(
  apiBase: string,
  ctx: Ctx,
  path: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<PathOutcome> {
  const key = `${ctx.store}|${ctx.locale}|${path}`;
  const hit = memo.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.outcome;
  let outcome: PathOutcome;
  try {
    const res = await fetchImpl(`${apiBase}/store/url-resolver?path=${encodeURIComponent(path)}`, {
      headers: { 'x-store': ctx.store, 'accept-language': ctx.locale, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (res.status === 404) outcome = { kind: 'missing' };
    else if (!res.ok)
      return { kind: 'page' }; // let the page decide (and show its error state)
    else {
      const r = (await res.json()) as {
        canonicalPath?: string | null;
        redirectStatus?: 301 | 302 | null;
        location?: string | null;
      };
      if (r.redirectStatus && r.location)
        outcome = { kind: 'redirect', location: r.location, status: r.redirectStatus };
      else if (r.canonicalPath && `/${r.canonicalPath}` !== path)
        outcome = { kind: 'redirect', location: `/${r.canonicalPath}`, status: 308 };
      else outcome = { kind: 'page' };
    }
  } catch {
    return { kind: 'page' }; // shop unreachable: don't 404 good URLs
  }
  if (memo.size >= MAX) memo.delete(memo.keys().next().value!);
  memo.set(key, { at: now, outcome });
  return outcome;
}

/** Forget every answer (the shop's URLs changed). */
export function clearUrlCache(): void {
  memo.clear();
}
