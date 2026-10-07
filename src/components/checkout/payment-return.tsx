'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useHref, useStore } from '@/components/store/store-context';
import { Notice } from '@/components/ui/notice';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n/client';
import { GatewayError, sf } from '@/lib/cart-client';
import { type Payment, PENDING_PAYMENT } from '@/lib/checkout-client';

/** Sends the provider's return parameters to the shop and moves on to the order page. */
async function confirmReturn(opts: {
  ctx: string;
  orderHref: (order: string, query: string) => void;
  fail: (key: 'order.notFound' | 'checkout.error') => void;
}) {
  const url = new URL(window.location.href);
  const order = url.searchParams.get('order') ?? '';
  let pending: { order?: string; payment?: string } = {};
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_PAYMENT) ?? '{}');
  } catch {}
  const params = Object.fromEntries([...url.searchParams].filter(([k]) => k !== 'order'));
  if (!order) return opts.fail('order.notFound');
  if (!pending.payment || pending.order !== order) return opts.orderHref(order, 'payment=check');
  try {
    const p = await sf<Payment>(
      opts.ctx,
      `orders/${encodeURIComponent(order)}/payments/${pending.payment}/return`,
      { method: 'POST', body: JSON.stringify({ params }) },
    );
    try {
      sessionStorage.removeItem(PENDING_PAYMENT);
    } catch {}
    opts.orderHref(
      order,
      p.status === 'CAPTURED' || p.status === 'AWAITING_COLLECTION'
        ? 'placed=1'
        : p.status === 'FAILED' || p.status === 'CANCELED'
          ? 'placed=1&payment=failed'
          : 'placed=1&payment=check',
    );
  } catch (e) {
    if (e instanceof GatewayError && e.status < 500) opts.orderHref(order, 'payment=failed');
    else opts.fail('checkout.error');
  }
}

/**
 * The shopper is back from a payment provider. The provider's query parameters go to the shop,
 * which verifies them (signatures, amounts) and records the payment; then the order page shows the
 * outcome. Nothing here trusts the URL by itself.
 */
export function PaymentReturn() {
  const { t } = useI18n();
  const store = useStore();
  const to = useHref();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void confirmReturn({
      ctx: store.ctx,
      orderHref: (order, q) => router.replace(`${to(`/orders/${encodeURIComponent(order)}`)}?${q}`),
      fail: (key) => setError(t(key)),
    });
  }, [router, store.ctx, t, to]);

  return (
    <div
      className="container-page grid min-h-[50vh] place-content-center justify-items-center gap-4 py-24 text-center"
      aria-live="polite"
    >
      {error ? (
        <Notice tone="danger" title={error} />
      ) : (
        <>
          <Spinner className="size-8" />
          <p className="text-body-lg">{t('order.paymentChecking')}</p>
        </>
      )}
    </div>
  );
}
