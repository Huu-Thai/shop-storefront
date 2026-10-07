'use client';

/**
 * Browser calls to the storefront gateway (/api/sf → the shop's store API). The shopper's tokens
 * travel in httpOnly cookies the gateway manages; this code never sees them.
 */
export class GatewayError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function sf<T>(ctx: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/sf/${path}`, {
    ...init,
    headers: {
      'x-sf-ctx': ctx,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.method && init.method !== 'GET' ? { 'x-storefront': '1' } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = (body as { message?: string | string[] }).message;
    throw new GatewayError(res.status, (Array.isArray(m) ? m[0] : m) ?? `Error ${res.status}`);
  }
  return body as T;
}

const hasCart = (store: string) =>
  new RegExp(`(?:^|; )sf_cart_count_${store}=`).test(document.cookie);

export interface AddItem {
  sku: string;
  quantity: number;
  options?: { option: string; sku: string; quantity?: number }[];
}

/** Adds to the store's cart, creating the cart first if the shopper has none (or it expired). */
/** Resolves to the updated cart (typed by the caller). */
export async function addToCart<C = { itemCount: number }>(
  ctx: string,
  store: string,
  item: AddItem,
): Promise<C> {
  const post = () => sf<C>(ctx, 'cart/items', { method: 'POST', body: JSON.stringify(item) });
  if (!hasCart(store)) await sf(ctx, 'cart', { method: 'POST', body: '{}' });
  try {
    return announce(await post());
  } catch (e) {
    // The cart expired since the cookie was set: start a new one once.
    if (e instanceof GatewayError && e.status === 404) {
      await sf(ctx, 'cart', { method: 'POST', body: '{}' });
      return announce(await post());
    }
    throw e;
  }
}

function announce<T>(cart: T): T {
  window.dispatchEvent(new Event('sf:cart'));
  return cart;
}
