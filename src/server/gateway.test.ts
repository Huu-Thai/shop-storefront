import { describe, expect, it, vi } from 'vitest';
import { translator } from '@/i18n';
import type { RoutingTable } from '@/lib/routing';
import {
  cartCookie,
  CTX_HEADER,
  demoRefuses,
  forward,
  GATEWAY_HEADER,
  type GatewayDeps,
} from './gateway';

const table: RoutingTable = {
  defaultStore: 'us-en',
  stores: [
    {
      code: 'vn-vi',
      name: 'VN',
      website: 'vn',
      baseUrl: null,
      defaultLocale: 'vi-VN',
      locales: ['vi-VN'],
      defaultCurrency: 'VND',
      currencies: ['VND'],
    },
    {
      code: 'us-en',
      name: 'US',
      website: 'us',
      baseUrl: null,
      defaultLocale: 'en-US',
      locales: ['en-US'],
      defaultCurrency: 'USD',
      currencies: ['USD'],
    },
  ],
};
const CTX = 'us-en.en-US.USD';

function setup(
  upstream: Response | (() => Response) = Response.json({ ok: true }),
  cookies: Record<string, string> = {},
  session: GatewayDeps['session'] = null,
) {
  const fetchImpl = vi.fn(async () => (typeof upstream === 'function' ? upstream() : upstream));
  const deps: GatewayDeps = {
    apiBase: 'http://api.test/api/v1',
    table,
    session,
    cookie: (n) => cookies[n],
    secure: true,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  };
  return { deps, fetchImpl };
}

const req = (path: string, init: RequestInit & { ctx?: string | null } = {}) => {
  const headers = new Headers(init.headers);
  if (init.ctx !== null) headers.set(CTX_HEADER, init.ctx ?? CTX);
  headers.set('host', 'shop.test');
  return new Request(`https://shop.test/api/sf/${path}`, { ...init, headers });
};
const mutation = (path: string, body: object, extra: Record<string, string> = {}) =>
  req(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      [GATEWAY_HEADER]: '1',
      origin: 'https://shop.test',
      ...extra,
    },
  });

describe('storefront gateway', () => {
  it('forwards reads to the store API in the shopper’s store, language and currency', async () => {
    const { deps, fetchImpl } = setup();
    const res = await forward(req('search?q=tee'), ['search'], deps);
    expect(res.status).toBe(200);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe('http://api.test/api/v1/store/search?q=tee');
    const h = new Headers(init.headers);
    expect([h.get('x-store'), h.get('accept-language'), h.get('x-currency')]).toEqual([
      'us-en',
      'en-US',
      'USD',
    ]);
    expect(h.get('authorization')).toBeNull();
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('refuses unknown stores, locales and currencies', async () => {
    const { deps, fetchImpl } = setup();
    for (const ctx of [null, 'xx.en-US.USD', 'us-en.vi-VN.USD', 'us-en.en-US.EUR', 'garbage'])
      expect((await forward(req('config', { ctx }), ['config'], deps)).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses path tricks', async () => {
    const { deps, fetchImpl } = setup();
    for (const segs of [[], ['..', 'admin'], ['cart', '%2e%2e'], ['a b']])
      expect((await forward(req('x'), segs, deps)).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps token endpoints out of reach (sign-in uses Server Actions)', async () => {
    const { deps, fetchImpl } = setup();
    for (const p of ['account/login', 'account/register', 'account/refresh', 'account/logout'])
      expect((await forward(mutation(p, {}), p.split('/'), deps)).status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('in demo mode refuses order and account changes but not the cart or reads', async () => {
    const { deps, fetchImpl } = setup(() => Response.json({ ok: true }));
    deps.demo = true;
    for (const path of [
      'orders',
      'orders/SO-1/cancel',
      'orders/SO-1/payments',
      'account/addresses',
    ]) {
      const res = await forward(mutation(path, {}), path.split('/'), deps);
      expect(res.status).toBe(403);
      expect(((await res.json()) as { message: string }).message).toBe(
        translator('en-US')('demo.refused'),
      );
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    // In the shopper's language.
    const vi = req('orders', {
      method: 'POST',
      body: '{}',
      ctx: 'vn-vi.vi-VN.VND',
      headers: { [GATEWAY_HEADER]: '1', origin: 'https://shop.test' },
    });
    const refusedVi = await forward(vi, ['orders'], deps);
    expect(((await refusedVi.json()) as { message: string }).message).toBe(
      translator('vi-VN')('demo.refused'),
    );
    expect((await forward(mutation('cart/items', {}), ['cart', 'items'], deps)).status).toBe(200);
    expect((await forward(req('orders?limit=5'), ['orders'], deps)).status).toBe(200);
    expect((await forward(req('account/addresses'), ['account', 'addresses'], deps)).status).toBe(
      200,
    );
    expect(demoRefuses('PUT', 'account')).toBe(true);
    expect(demoRefuses('POST', 'ordersx')).toBe(false);
  });

  it('needs the gateway header and the same origin for changes', async () => {
    const { deps } = setup();
    const noHeader = req('cart/items', { method: 'POST', body: '{}' });
    expect((await forward(noHeader, ['cart', 'items'], deps)).status).toBe(403);
    const cross = mutation('cart/items', {}, { origin: 'https://evil.test' });
    expect((await forward(cross, ['cart', 'items'], deps)).status).toBe(403);
    const fetchSite = mutation('cart/items', {}, { 'sec-fetch-site': 'cross-site' });
    expect((await forward(fetchSite, ['cart', 'items'], deps)).status).toBe(403);
  });

  it('keeps the cart token in an httpOnly cookie and out of the response', async () => {
    const { deps } = setup(Response.json({ id: 'c1', token: 'secret-cart', itemCount: 2 }));
    const res = await forward(mutation('cart', {}), ['cart'], deps);
    const body = await res.json();
    expect(body).toEqual({ id: 'c1', itemCount: 2 });
    const cookies = res.headers.getSetCookie();
    expect(cookies.find((c) => c.startsWith('sf_cart_us-en='))).toMatch(
      /^sf_cart_us-en=secret-cart; Path=\/; Max-Age=\d+; SameSite=Lax; HttpOnly; Secure$/,
    );
    expect(cookies.find((c) => c.startsWith('sf_cart_count_us-en='))).not.toMatch(/HttpOnly/);
  });

  it('sends the order token and the customer token from cookies', async () => {
    const { deps, fetchImpl } = setup(
      Response.json({}),
      {
        [cartCookie('us-en')]: 'cart-tok',
        'sf_order_US-000001': 'order-tok',
      },
      {
        accessToken: 'access',
        accessExpiresAt: 0,
        refreshToken: 'r',
        refreshExpiresAt: 0,
        store: 'us-en',
      },
    );
    await forward(req('orders/US-000001'), ['orders', 'US-000001'], deps);
    const h = new Headers((fetchImpl.mock.calls[0] as unknown as [URL, RequestInit])[1].headers);
    // Signed in: the cart follows the session, so the guest cart token stays home.
    expect(h.get('x-cart-token')).toBeNull();
    expect(h.get('x-order-token')).toBe('order-tok');
    expect(h.get('authorization')).toBe('Bearer access');
  });

  it('keeps a guest order’s access token server-side and forgets the converted cart', async () => {
    const { deps } = setup(Response.json({ number: 'US-000002', accessToken: 'ord-secret' }), {
      [cartCookie('us-en')]: 'cart-tok',
    });
    const res = await forward(mutation('orders', {}), ['orders'], deps);
    expect(await res.json()).toEqual({ number: 'US-000002' });
    const cookies = res.headers.getSetCookie();
    expect(cookies).toContainEqual(
      expect.stringMatching(/^sf_order_US-000002=ord-secret;.*HttpOnly/),
    );
    expect(cookies).toContainEqual(expect.stringMatching(/^sf_cart_us-en=; Path=\/; Max-Age=0/));
  });

  it('forgets a cart the shop no longer knows', async () => {
    const { deps } = setup(
      Response.json({ statusCode: 404, message: 'Cart not found' }, { status: 404 }),
      { [cartCookie('us-en')]: 'stale' },
    );
    const res = await forward(req('cart'), ['cart'], deps);
    expect(res.status).toBe(404);
    expect(res.headers.getSetCookie()).toContainEqual(
      expect.stringMatching(/^sf_cart_us-en=; .*Max-Age=0/),
    );
  });

  it('answers 502 / 504 when the shop is down or slow', async () => {
    const down = setup(() => {
      throw new TypeError('fetch failed');
    });
    expect((await forward(req('config'), ['config'], down.deps)).status).toBe(502);
    const slow = setup(() => {
      throw Object.assign(new Error('t'), { name: 'TimeoutError' });
    });
    expect((await forward(req('config'), ['config'], slow.deps)).status).toBe(504);
  });

  it('sends a customer’s token only to stores of their website, and no guest cart token', async () => {
    const session = {
      accessToken: 'cust',
      accessExpiresAt: 0,
      refreshToken: 'r',
      refreshExpiresAt: 0,
      store: 'us-en',
    };
    const own = setup(Response.json({}), { [cartCookie('us-en')]: 'guest-cart' }, session);
    await forward(req('cart'), ['cart'], own.deps);
    let h = new Headers((own.fetchImpl.mock.calls[0] as unknown as [URL, RequestInit])[1].headers);
    expect(h.get('authorization')).toBe('Bearer cust');
    expect(h.get('x-cart-token')).toBeNull();
    const other = setup(Response.json({}), {}, session);
    await forward(req('cart', { ctx: 'vn-vi.vi-VN.VND' }), ['cart'], other.deps);
    h = new Headers((other.fetchImpl.mock.calls[0] as unknown as [URL, RequestInit])[1].headers);
    expect(h.get('authorization')).toBeNull();
  });

  it('never stores a cart token for a signed-in customer (shared devices)', async () => {
    const session = {
      accessToken: 'cust',
      accessExpiresAt: 0,
      refreshToken: 'r',
      refreshExpiresAt: 0,
      store: 'us-en',
    };
    const { deps } = setup(
      Response.json({ id: 'c', token: 'should-not-leak', itemCount: 3 }),
      {},
      session,
    );
    const res = await forward(mutation('cart', {}), ['cart'], deps);
    expect(await res.json()).toEqual({ id: 'c', itemCount: 3 });
    expect(res.headers.getSetCookie().some((c) => c.startsWith('sf_cart_us-en='))).toBe(false);
  });

  it('forgets a session the shop no longer accepts', async () => {
    const session = {
      accessToken: 'revoked',
      accessExpiresAt: 0,
      refreshToken: 'r',
      refreshExpiresAt: 0,
      store: 'us-en',
    };
    const { deps } = setup(Response.json({ statusCode: 401 }, { status: 401 }), {}, session);
    const res = await forward(req('account'), ['account'], deps);
    expect(res.status).toBe(401);
    const cookies = res.headers.getSetCookie();
    expect(cookies).toContainEqual(expect.stringMatching(/^sf_session=; .*Max-Age=0/));
    expect(cookies).toContainEqual(expect.stringMatching(/^sf_signed_in=; .*Max-Age=0/));
  });
});
