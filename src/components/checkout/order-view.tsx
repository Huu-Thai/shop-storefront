'use client';

import { CircleCheck, Package } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/components/intent-link';
import { useHref, useStore } from '@/components/store/store-context';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/client';
import { GatewayError, sf } from '@/lib/cart-client';
import { type Order, type PaymentMethod, startPayment } from '@/lib/checkout-client';
import { cn } from '@/lib/cn';

type Addr = NonNullable<Order['shippingAddress']>;

function AddressBlock({ title, a }: { title: string; a: Addr | null }) {
  if (!a) return null;
  return (
    <div className="grid content-start gap-1 text-small">
      <h3 className="mb-1 font-sans text-small font-semibold">{title}</h3>
      <p>{[a.firstName, a.lastName].filter(Boolean).join(' ')}</p>
      {a.company && <p className="text-fg-muted">{a.company}</p>}
      <p className="text-fg-muted">{[a.line1, a.line2].filter(Boolean).join(', ')}</p>
      <p className="text-fg-muted">
        {[a.postcode, a.city, a.regionCode, a.countryCode].filter(Boolean).join(' ')}
      </p>
      {a.phone && <p className="text-fg-muted">{a.phone}</p>}
    </div>
  );
}

/**
 * Order confirmation and status (guest: opened with the order's cookie on this device; customers
 * also from their account in Phase 3). Unpaid orders can be paid again; orders awaiting payment
 * can be canceled.
 */
export function OrderView({ number, embedded = false }: { number: string; embedded?: boolean }) {
  const { t, locale } = useI18n();
  const store = useStore();
  const to = useHref();
  const [order, setOrder] = useState<Order | null | undefined>(null);
  const [flags, setFlags] = useState<{ placed: boolean; payment: string | null }>({
    placed: false,
    payment: null,
  });
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [method, setMethod] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const path = `orders/${encodeURIComponent(number)}`;
  const fetchOrder = useCallback(
    () =>
      sf<Order>(store.ctx, path)
        .then(setOrder)
        .catch(() => setOrder(undefined)),
    [store.ctx, path],
  );

  useEffect(() => {
    void fetchOrder().then(() => {
      // The cart became this order: let the header badge re-read its cookie.
      window.dispatchEvent(new Event('sf:cart'));
      const q = new URLSearchParams(window.location.search);
      setFlags({ placed: q.get('placed') === '1', payment: q.get('payment') });
    });
  }, [fetchOrder]);

  const unpaid = order?.status === 'PENDING_PAYMENT' && order.paymentStatus === 'UNPAID';
  useEffect(() => {
    if (!unpaid) return;
    sf<PaymentMethod[]>(store.ctx, `${path}/payment-methods`)
      .then((list) => {
        setMethods(list);
        setMethod((m) => m || list[0]?.code || '');
      })
      .catch(() => setMethods([]));
  }, [unpaid, store.ctx, path]);

  if (order === null)
    return (
      <div className="container-page grid gap-6 py-12" aria-busy>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  if (order === undefined)
    return (
      <div className="container-page grid justify-items-center gap-3 py-24 text-center">
        <Package aria-hidden className="size-8" strokeWidth={1.5} />
        <h1 className="text-h2">{t('order.notFound')}</h1>
        <p className="max-w-md text-fg-muted">{t('order.notFoundBody')}</p>
        <Link href={to('/')} className={cn(buttonVariants(), 'mt-3')}>
          {t('order.continue')}
        </Link>
      </div>
    );

  const pay = async () => {
    setBusy('pay');
    setError(null);
    try {
      const { redirected } = await startPayment(store.ctx, store.prefix, order.number, method);
      if (!redirected) await fetchOrder();
    } catch (e) {
      setError(e instanceof GatewayError ? e.message : t('checkout.error'));
    } finally {
      setBusy(null);
    }
  };
  const cancel = async () => {
    setBusy('cancel');
    setError(null);
    try {
      setOrder(await sf<Order>(store.ctx, `${path}/cancel`, { method: 'POST', body: '{}' }));
      setConfirmCancel(false);
    } catch (e) {
      setError(e instanceof GatewayError ? e.message : t('checkout.error'));
    } finally {
      setBusy(null);
    }
  };

  const tt = order.totals;
  const name = order.shippingAddress?.firstName ?? order.billingAddress?.firstName;
  const placedOn = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(order.placedAt));
  const statusTone =
    order.status === 'CANCELED'
      ? 'danger'
      : order.status === 'PENDING_PAYMENT'
        ? 'warning'
        : 'success';

  return (
    <div
      className={
        embedded ? 'grid gap-8' : 'container-page grid gap-8 pt-8 pb-[var(--section-y)] md:pt-12'
      }
    >
      {flags.placed && !embedded && order.status !== 'CANCELED' && (
        <div className="flex gap-4 rounded-card bg-success-soft p-6 text-success-fg">
          <CircleCheck aria-hidden className="mt-1 size-7 shrink-0" />
          <div className="grid gap-1">
            <p className="text-h3">
              {name ? t('order.thanks', { name }) : t('order.thanksNoName')}
            </p>
            <p className="text-body">
              {t('order.thanksBody', { number: order.number, email: order.email })}
            </p>
          </div>
        </div>
      )}
      {flags.payment === 'failed' && unpaid && (
        <Notice tone="danger" title={t('order.paymentFailed')} />
      )}
      {flags.payment === 'check' && unpaid && (
        <Notice tone="info" title={t('order.paymentChecking')} />
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-h1">{t('order.title', { number: order.number })}</h1>
          <p className="text-fg-muted">{t('order.placedOn', { date: placedOn })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone}>
            {t(`order.status.${order.status}` as 'order.status.PROCESSING')}
          </Badge>
          <Badge tone={order.paymentStatus === 'PAID' ? 'success' : 'neutral'}>
            {t(`order.pay.${order.paymentStatus}` as 'order.pay.PAID')}
          </Badge>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <section
          aria-labelledby="order-items"
          className="grid gap-4 rounded-card border border-border p-6"
        >
          <h2 id="order-items" className="text-h4">
            {t('order.items')}
          </h2>
          <ul className="grid divide-y divide-border">
            {order.items.map((i) => (
              <li
                key={i.id}
                className="flex items-start justify-between gap-4 py-3 text-small first:pt-0 last:pb-0"
              >
                <div className="grid gap-0.5">
                  <span className="font-medium">{i.name}</span>
                  <span className="font-mono text-caption text-fg-muted">{i.sku}</span>
                  {i.children.length > 0 && (
                    <span className="text-caption text-fg-muted">
                      {t('cart.includes')}:{' '}
                      {i.children.map((c) => `${c.quantity} × ${c.name}`).join(', ')}
                    </span>
                  )}
                </div>
                <div className="grid justify-items-end gap-0.5">
                  <span className="tabular font-semibold">{i.rowTotal.formatted}</span>
                  <span className="tabular text-caption text-fg-muted">
                    {t('order.qty', { n: i.quantity })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t border-border pt-4 text-small">
            {[
              [t('cart.subtotal'), tt.subtotal],
              ...(tt.discount.amount
                ? [[t('cart.discount'), { ...tt.discount, formatted: `−${tt.discount.formatted}` }]]
                : []),
              [t('cart.shipping'), tt.shipping],
              ...(!tt.pricesIncludeTax && tt.tax.amount ? [[t('cart.tax'), tt.tax]] : []),
              ...(tt.loyalty.amount
                ? [[t('cart.loyalty'), { ...tt.loyalty, formatted: `−${tt.loyalty.formatted}` }]]
                : []),
            ].map(([label, m]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <dt className="text-fg-muted">{label as string}</dt>
                <dd className="tabular">{(m as { formatted: string }).formatted}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-4 border-t border-border pt-3 text-body">
              <dt className="font-semibold">{t('cart.total')}</dt>
              <dd className="tabular font-semibold">{tt.grandTotal.formatted}</dd>
            </div>
          </dl>
        </section>

        <aside className="grid gap-6">
          <section
            aria-labelledby="order-payment"
            className="grid gap-4 rounded-card bg-surface-muted p-6"
          >
            <h2 id="order-payment" className="text-h4">
              {t('order.payment')}
            </h2>
            {order.paymentStatus === 'PAID' ? (
              <p className="text-small text-success-fg">{t('order.paymentReceived')}</p>
            ) : unpaid && methods.length ? (
              <div className="grid gap-3">
                <label className="grid gap-1.5 text-small">
                  {t('order.payWith')}
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="focus-ring h-11 rounded-control border border-border-strong bg-surface px-3 text-body"
                  >
                    {methods.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => void pay()} loading={busy === 'pay'} disabled={!method}>
                  {t('order.payNow')} · {tt.amountDue.formatted}
                </Button>
              </div>
            ) : order.status !== 'CANCELED' ? (
              <p className="text-small text-fg-muted">{t('order.awaitingCollection')}</p>
            ) : null}
            {error && <Notice tone="danger" title={error} />}
            {order.status === 'PENDING_PAYMENT' &&
              (confirmCancel ? (
                <div className="grid gap-2 rounded-control border border-border bg-surface p-4">
                  <p className="text-small">{t('order.cancelAsk')}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void cancel()}
                      loading={busy === 'cancel'}
                    >
                      {t('order.cancelConfirm')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
                      {t('a11y.close')}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="focus-ring justify-self-start rounded-xs text-small underline underline-offset-4"
                >
                  {t('order.cancel')}
                </button>
              ))}
            {order.status === 'CANCELED' && (
              <p className="text-small text-danger-fg">{t('order.canceled')}</p>
            )}
          </section>
          <section className="grid gap-5 rounded-card border border-border p-6 sm:grid-cols-2 lg:grid-cols-1">
            <AddressBlock title={t('order.shipTo')} a={order.shippingAddress} />
            {/* Billing is shown only when it differs from shipping. */}
            {JSON.stringify(order.billingAddress) !== JSON.stringify(order.shippingAddress) && (
              <AddressBlock title={t('order.billTo')} a={order.billingAddress} />
            )}
            {order.shippingMethod && (
              <div className="grid gap-1 text-small">
                <h3 className="font-sans text-small font-semibold">{t('order.delivery')}</h3>
                <p className="text-fg-muted">{order.shippingMethod}</p>
              </div>
            )}
          </section>
          <Link href={to('/')} className={buttonVariants({ variant: 'secondary', block: true })}>
            {t('order.continue')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
