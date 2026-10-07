import { type NextRequest, NextResponse } from 'next/server';
import {
  encodeCtx,
  href,
  isCatalogPath,
  MISSING_ROUTE,
  PATH_HEADER,
  PREFIX_HEADER,
  resolve,
} from './lib/routing';
import { CURRENCY_COOKIE, SIGNED_IN_COOKIE } from './lib/preferences';
import { refreshSession } from './server/refresh';
import { routingOptions, routingTable } from './server/routing-table';
import { resolveForProxy } from './server/url-cache';
import {
  cookieOptions,
  openSession,
  REFRESH_LEEWAY_MS,
  sealSession,
  SESSION_COOKIE,
} from './server/session-crypto';

const unavailable = () =>
  new NextResponse(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
      '<title>Back soon</title><body style="font:16px system-ui;display:grid;place-items:center;min-height:90vh;margin:0;color:#191919">' +
      '<div style="text-align:center"><h1 style="font-size:28px">We’ll be right back</h1>' +
      '<p style="color:#5c5c5c">The shop is taking a short break. Please try again in a minute.</p></div>',
    {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '60' },
    },
  );

/**
 * Runs before every page and gateway request:
 * 1. refreshes a signed-in customer's access token shortly before it expires (the only place tokens
 *    are refreshed — it can both store the new cookie and hand it to the rest of this request, so a
 *    single-use refresh token is never replayed);
 * 2. for pages, resolves the store, language and currency from the URL and the currency cookie and
 *    rewrites to the internal `/[ctx]/…` route (PLAN.md §2), so pages can be cached per store.
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const headers = new Headers(req.headers);
  // Only this proxy may set the prefix header; never trust one sent by a client.
  headers.delete(PREFIX_HEADER);
  headers.delete(PATH_HEADER);
  const setCookies: [string, string, ReturnType<typeof cookieOptions>][] = [];
  let clearSession = false;

  // 1. Customer session refresh
  const secret = process.env.SESSION_SECRET ?? '';
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (raw && secret.length >= 32) {
    const session = await openSession(raw, secret);
    const now = Date.now();
    if (!session || session.refreshExpiresAt <= now) {
      clearSession = true;
      req.cookies.delete(SESSION_COOKIE);
    } else if (session.accessExpiresAt - now <= REFRESH_LEEWAY_MS) {
      const outcome = await refreshSession(routingOptions().apiBase, session);
      if (outcome.status === 'rejected') {
        clearSession = true;
        req.cookies.delete(SESSION_COOKIE);
      } else if (outcome.status === 'refreshed') {
        const sealed = await sealSession(outcome.session, secret);
        req.cookies.set(SESSION_COOKIE, sealed);
        setCookies.push([
          SESSION_COOKIE,
          sealed,
          cookieOptions(outcome.session, process.env.NODE_ENV === 'production'),
        ]);
      }
    }
    headers.set('cookie', req.cookies.toString());
  }

  // 2. Store routing (pages only)
  let res: NextResponse;
  if (path.startsWith('/api/')) {
    res = NextResponse.next({ request: { headers } });
  } else {
    let table;
    try {
      table = await routingTable(routingOptions());
    } catch (e) {
      console.error(`[routing] ${(e as Error).message}`);
      return unavailable();
    }
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const resolved = resolve(table, host, path, req.cookies.get(CURRENCY_COOKIE)?.value);
    if (!resolved) return unavailable();
    const url = req.nextUrl.clone();
    url.pathname = `/${encodeCtx(resolved.ctx)}${resolved.rest === '/' ? '' : resolved.rest}`;
    headers.set(PREFIX_HEADER, resolved.prefix);
    headers.set(PATH_HEADER, `${path}${req.nextUrl.search}`);
    // Catalog URLs: answer redirects and unknown paths here, before any HTML streams — a streamed
    // page can no longer change its status code.
    const outcome = isCatalogPath(resolved.rest)
      ? await resolveForProxy(routingOptions().apiBase, resolved.ctx, resolved.rest)
      : { kind: 'page' as const };
    if (outcome.kind === 'redirect') {
      let target: URL;
      if (/^https?:\/\//i.test(outcome.location)) target = new URL(outcome.location);
      else {
        target = req.nextUrl.clone();
        target.pathname = href(outcome.location, resolved.prefix);
      }
      res = NextResponse.redirect(target, outcome.status);
    } else if (outcome.kind === 'missing' || resolved.rest === `/${MISSING_ROUTE}`) {
      // The store's own 404 page with a real 404 status (Next's bare not-found page would lose the
      // store's layout and language).
      url.pathname = `/${encodeCtx(resolved.ctx)}/${MISSING_ROUTE}`;
      res = NextResponse.rewrite(url, { request: { headers }, status: 404 });
    } else {
      res = NextResponse.rewrite(url, { request: { headers } });
    }
  }

  for (const [name, value, options] of setCookies) res.cookies.set(name, value, options);
  if (clearSession) {
    res.cookies.delete(SESSION_COOKIE);
    res.cookies.delete(SIGNED_IN_COOKIE);
  }
  return res;
}

export const config = {
  matcher: [
    // Everything except Next internals, the style guide and static files.
    '/((?!_next/static|_next/image|style-guide(?:/|$)|sitemaps/|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|txt|xml|woff2?)$).*)',
  ],
};
