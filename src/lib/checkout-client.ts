'use client';

import type { components } from '@/server/shop-api';
import { sf } from './cart-client';

export type Order = components['schemas']['OrderDto'];
export type Payment = components['schemas']['PaymentDto'];
export type PaymentMethod = {
  code: string;
  title: string;
  description?: string | null;
  provider?: string;
};

/** Remembers which payment the shopper left to pay, for the return page. */
export const PENDING_PAYMENT = 'sf_pending_payment';

/**
 * Starts paying an order. Redirect providers (VNPay, PayPal …) send the shopper away and back to
 * /checkout/return; methods without an action (cash on delivery) are done at once.
 */
export async function startPayment(
  ctx: string,
  prefix: string,
  number: string,
  method: string,
): Promise<{ redirected: boolean; payment: Payment }> {
  const returnUrl = `${window.location.origin}${prefix}/checkout/return?order=${encodeURIComponent(number)}`;
  const payment = await sf<Payment>(ctx, `orders/${encodeURIComponent(number)}/payments`, {
    method: 'POST',
    body: JSON.stringify({ method, returnUrl }),
  });
  try {
    sessionStorage.setItem(PENDING_PAYMENT, JSON.stringify({ order: number, payment: payment.id }));
  } catch {}
  const url = payment.action?.type === 'REDIRECT' ? payment.action.url : undefined;
  if (url && /^https?:\/\//i.test(url)) {
    window.location.assign(url);
    return { redirected: true, payment };
  }
  return { redirected: false, payment };
}

/** One idempotency key per cart version: a double click or a retry can't place two orders. */
export function idempotencyKey(cartId: string, version: number): string {
  const k = `sf_order_key_${cartId}_${version}`;
  try {
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem(k, fresh);
    return fresh;
  } catch {
    return `${cartId}-${version}`;
  }
}
