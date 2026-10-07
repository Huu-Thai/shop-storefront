import { translator } from '@/i18n';
import { type Ctx, decodeCtx, type RoutingTable, sameWebsite } from '@/lib/routing';
import { SIGNED_IN_COOKIE } from '@/lib/preferences';
import { type Session, SESSION_COOKIE } from './session-crypto';

/** Header the storefront's own scripts send on every mutation; other sites can't without CORS. */
export const GATEWAY_HEADER = 'x-storefront';
/** Header carrying the shopper's store / locale / currency (`<store>.<locale>.<currency>`). */
export const CTX_HEADER = 'x-sf-ctx';

/** httpOnly cookie holding a store's cart token (carts belong to one store). */
export const cartCookie = (store: string) => `sf_cart_${store}`;
/** Readable cookie with the cart's item count, for the header badge on cached pages. */
export const cartCountCookie = (store: string) => `sf_cart_count_${store}`;
/** httpOnly cookie holding a guest order's access token. */
export const orderCookie = (number: string) => `sf_order_${number.replace(/[^A-Za-z0-9_-]/g, '')}`;

const CART_MAX_AGE = 60 * 60 * 24 * 30;
const ORDER_MAX_AGE = 60 * 60 * 24 * 90;

/** Path segments arrive decoded; `%` is refused so `%2e%2e` can't become `..` upstream. */
const SEGMENT = /^[A-Za-z0-9._~:@-]+$/;
/** Token endpoints: sign-in goes through Server Actions so tokens never reach page scripts. */
const REFUSED = /^account\/(login|register|refresh|logout)$/;
const FORWARD_REQUEST = ['accept', 'content-type', 'idempotency-key', 'if-match', 'x-request-id'];
const FORWARD_RESPONSE = ['content-type', 'etag', 'x-request-id', 'retry-after'];
const SAFE_METHODS = new Set(['GET', 'HEAD']);
/** What a demo refuses: placing and changing orders, and every account change. The cart stays open. */
const DEMO_WRITES = /^(orders|account)(\/|$)/;

/** Whether demo mode refuses this request. */
export const demoRefuses = (method: string, path: string) =>
  !SAFE_METHODS.has(method) && DEMO_WRITES.test(path);

export interface CookieWrite {
  name: string;
  value: string;
  /** Seconds; 0 deletes. */
  maxAge: number;
  httpOnly: boolean;
}

export interface GatewayDeps {
  apiBase: string;
  table: RoutingTable;
  session: Session | null;
  /** Reads a request cookie. */
  cookie: (name: string) => string | undefined;
  secure: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Demo mode: refuse changes to orders and accounts. */
  demo?: boolean;
}

const problem = (status: number, message: string) =>
  Response.json(
    { statusCode: status, message },
    { status, headers: { 'cache-control': 'no-store' } },
  );

/** Same-origin check for mutations (CSRF): the custom header and, when sent, matching Origin. */
export function checkOrigin(req: Request): string | null {
  if (SAFE_METHODS.has(req.method)) return null;
  if (req.headers.get(GATEWAY_HEADER) !== '1') return `Changes need the ${GATEWAY_HEADER} header`;
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return 'Cross-site request refused';
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return 'Cross-site request refused';
  return null;
}

/** The request's ctx, only if the store is served here and sells in that locale / currency. */
export function ctxFrom(req: Request, table: RoutingTable): Ctx | null {
  const ctx = decodeCtx(req.headers.get(CTX_HEADER) ?? undefined);
  if (!ctx) return null;
  const store = table.stores.find((s) => s.code === ctx.store);
  if (!store || !store.locales.includes(ctx.locale) || !store.currencies.includes(ctx.currency))
    return null;
  return ctx;
}

const serialize = (c: CookieWrite, secure: boolean) =>
  [
    `${c.name}=${encodeURIComponent(c.value)}`,
    'Path=/',
    `Max-Age=${c.maxAge}`,
    'SameSite=Lax',
    c.httpOnly && 'HttpOnly',
    secure && 'Secure',
  ]
    .filter(Boolean)
    .join('; ');

/**
 * The API gateway (backend-for-frontend): browser code calls `/api/sf/<path>` and the request is
 * forwarded to the shop's `/api/v1/store/<path>` in the shopper's store, language and currency.
 * The shopper's cart token, guest order tokens and customer access token travel in httpOnly
 * cookies; responses are stripped of tokens before they reach the browser.
 */
export async function forward(
  req: Request,
  segments: string[],
  deps: GatewayDeps,
): Promise<Response> {
  if (!segments.length || segments.some((s) => !SEGMENT.test(s) || s === '.' || s === '..'))
    return problem(400, 'Invalid API path');
  const path = segments.join('/');
  if (REFUSED.test(path)) return problem(404, 'Not found');
  const refused = checkOrigin(req);
  if (refused) return problem(403, refused);
  const ctx = ctxFrom(req, deps.table);
  if (!ctx) return problem(400, `Missing or unknown ${CTX_HEADER}`);
  if (deps.demo && demoRefuses(req.method, path))
    return problem(403, translator(ctx.locale)('demo.refused'));

  const incoming = new URL(req.url);
  const base = new URL(`${deps.apiBase}/store/`);
  const target = new URL(`${path}${incoming.search}`, base);
  // Defence in depth: whatever the URL parser normalised, the target stays inside the store API.
  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname))
    return problem(400, 'Invalid API path');

  const headers = new Headers({
    'x-store': ctx.store,
    'accept-language': ctx.locale,
    'x-currency': ctx.currency,
  });
  for (const h of FORWARD_REQUEST) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  // A signed-in customer's token only goes to stores of their website (accounts are per website);
  // their cart follows the session, so no guest cart token is sent or stored for them.
  const customer =
    deps.session && sameWebsite(deps.table, deps.session.store, ctx.store) ? deps.session : null;
  const cart = customer ? undefined : deps.cookie(cartCookie(ctx.store));
  if (cart) headers.set('x-cart-token', cart);
  const orderNumber = /^orders\/([^/]+)/.exec(path)?.[1];
  const orderToken = orderNumber ? deps.cookie(orderCookie(orderNumber)) : undefined;
  if (orderToken) headers.set('x-order-token', orderToken);
  if (customer) headers.set('authorization', `Bearer ${customer.accessToken}`);
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  let upstream: Response;
  try {
    upstream = await (deps.fetchImpl ?? fetch)(target, {
      method: req.method,
      headers,
      body: SAFE_METHODS.has(req.method) ? undefined : await req.text(),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(deps.timeoutMs ?? 30_000),
    });
  } catch (e) {
    const timeout = (e as Error).name === 'TimeoutError';
    return problem(
      timeout ? 504 : 502,
      timeout ? 'The shop did not answer in time' : 'The shop is unreachable',
    );
  }

  const out = new Headers({ 'cache-control': 'no-store' });
  for (const h of FORWARD_RESPONSE) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  const cookies: CookieWrite[] = [];
  let body: BodyInit | null = upstream.body;

  const isJson = upstream.headers.get('content-type')?.includes('application/json');
  if (isJson && (path === 'cart' || path.startsWith('cart/') || path === 'orders')) {
    const text = await upstream.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = null;
    }
    if (data && upstream.ok && path !== 'orders') {
      // Cart: keep the token server-side, expose only the item count.
      if (typeof data.token === 'string') {
        if (!customer)
          cookies.push({
            name: cartCookie(ctx.store),
            value: data.token,
            maxAge: CART_MAX_AGE,
            httpOnly: true,
          });
        delete data.token;
      }
      if (typeof data.itemCount === 'number')
        cookies.push({
          name: cartCountCookie(ctx.store),
          value: String(data.itemCount),
          maxAge: CART_MAX_AGE,
          httpOnly: false,
        });
    }
    if (data && upstream.ok && path === 'orders' && req.method === 'POST') {
      // Guest order placed: its access token opens the order later (confirmation, payment).
      if (typeof data.accessToken === 'string' && typeof data.number === 'string')
        cookies.push({
          name: orderCookie(data.number),
          value: data.accessToken,
          maxAge: ORDER_MAX_AGE,
          httpOnly: true,
        });
      delete data.accessToken;
      // The cart became the order.
      cookies.push({ name: cartCookie(ctx.store), value: '', maxAge: 0, httpOnly: true });
      cookies.push({ name: cartCountCookie(ctx.store), value: '', maxAge: 0, httpOnly: false });
    }
    if (upstream.status === 404 && path === 'cart' && cart) {
      // The cart expired or was converted elsewhere: forget it.
      cookies.push({ name: cartCookie(ctx.store), value: '', maxAge: 0, httpOnly: true });
      cookies.push({ name: cartCountCookie(ctx.store), value: '', maxAge: 0, httpOnly: false });
    }
    body = data ? JSON.stringify(data) : text;
    out.delete('content-length');
  }
  if (customer && upstream.status === 401) {
    // The shop no longer accepts this customer's token (password changed, signed out elsewhere):
    // forget the session here too, so the next page shows them signed out.
    cookies.push({ name: SESSION_COOKIE, value: '', maxAge: 0, httpOnly: true });
    cookies.push({ name: SIGNED_IN_COOKIE, value: '', maxAge: 0, httpOnly: false });
  }
  for (const c of cookies) out.append('set-cookie', serialize(c, deps.secure));
  return new Response(body, { status: upstream.status, headers: out });
}
