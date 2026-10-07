'use client';

import { Tag, Trash2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from '@/components/intent-link';
import { Quantity } from '@/components/ui/quantity';
import { StoreImage } from '@/components/ui/store-image';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';
import { useStore } from '../store/store-context';
import { type Cart, useCart } from './cart-context';
import { describeAttributes, useLineCards } from './line-cards';

/**
 * Cart lines (docs/STYLE-GUIDE.md §13.4): image, name, options, price, quantity and remove.
 * `compact` for the drawer and the checkout summary (`readOnly`).
 */
export function CartLines({
  cart,
  compact = false,
  readOnly = false,
  onNavigate,
}: {
  cart: Cart;
  compact?: boolean;
  readOnly?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const store = useStore();
  const { change } = useCart();
  const cards = useLineCards(
    store.ctx,
    cart.items.flatMap((l) => (l.productId ? [l.productId] : [])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ line: string; message: string } | null>(null);

  const run = async (lineId: string, path: string, init: RequestInit) => {
    setBusy(lineId);
    setError(null);
    const message = await change(path, init);
    if (message) setError({ line: lineId, message });
    setBusy(null);
  };

  return (
    <ul className="grid divide-y divide-border">
      {cart.items.map((line) => {
        const card = line.productId ? cards[line.productId] : undefined;
        const image = card?.variantImages[line.variantId] ?? card?.image ?? null;
        const attrs = describeAttributes(line.attributes as Record<string, unknown>, card);
        const thumb = compact ? 'w-18' : 'w-22 sm:w-28';
        return (
          <li
            key={line.id}
            className={cn('flex gap-4 py-4 first:pt-0 last:pb-0', busy === line.id && 'opacity-60')}
            aria-busy={busy === line.id || undefined}
          >
            <Link
              href={card?.href ?? '#'}
              onClick={onNavigate}
              tabIndex={-1}
              aria-hidden
              className={cn('shrink-0', thumb)}
            >
              <StoreImage image={image} alt="" sizes="112px" className="aspect-[4/5] rounded-md" />
            </Link>
            <div className="grid min-w-0 flex-1 content-start gap-1">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={card?.href ?? '#'}
                  onClick={onNavigate}
                  className="focus-ring line-clamp-2 rounded-xs text-small font-medium hover:underline"
                >
                  {line.name}
                </Link>
                <p className="tabular shrink-0 text-small font-semibold">
                  {line.rowTotal.formatted}
                </p>
              </div>
              {attrs && <p className="text-caption text-fg-muted">{attrs}</p>}
              {line.options.length > 0 && (
                <p className="text-caption text-fg-muted">
                  {t('cart.includes')}:{' '}
                  {line.options.map((o) => `${o.quantity ?? 1} × ${o.sku}`).join(', ')}
                </p>
              )}
              {line.quantity > 1 && (
                <p className="tabular text-caption text-fg-muted">
                  {t('cart.each', { price: line.unitPrice.formatted })}
                </p>
              )}
              {line.discount.amount > 0 && (
                <p className="tabular text-caption font-medium text-sale">
                  −{line.discount.formatted}
                </p>
              )}
              {(!line.available || line.message) && (
                <p className="text-caption font-medium text-danger-fg">
                  {line.message ?? t('cart.unavailable')}
                </p>
              )}
              {error?.line === line.id && (
                <p role="alert" className="text-caption font-medium text-danger-fg">
                  {error.message}
                </p>
              )}
              {readOnly ? (
                <p className="tabular text-caption text-fg-muted">
                  {t('order.qty', { n: line.quantity })}
                </p>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Quantity
                    size="sm"
                    value={line.quantity}
                    disabled={busy === line.id}
                    label={t('cart.qtyFor', { name: line.name })}
                    labels={{ decrease: t('a11y.decrease'), increase: t('a11y.increase') }}
                    onChange={(quantity) =>
                      void run(line.id, `cart/items/${line.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ quantity }),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label={t('cart.remove', { name: line.name })}
                    disabled={busy === line.id}
                    onClick={() => void run(line.id, `cart/items/${line.id}`, { method: 'DELETE' })}
                    className="focus-ring flex size-9 items-center justify-center rounded-full text-fg-muted hover:bg-surface-sunken hover:text-fg"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Discount code field, or the applied code with a remove button. */
export function CouponForm({ cart }: { cart: Cart }) {
  const { t } = useI18n();
  const { change } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code') ?? '').trim();
    if (!code) return;
    setBusy(true);
    setError(await change('cart/coupon', { method: 'PUT', body: JSON.stringify({ code }) }));
    setBusy(false);
  };
  if (cart.coupon)
    return (
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-accent-soft px-3.5 text-small font-semibold">
            <Tag aria-hidden className="size-4" />
            {cart.coupon.code}
          </span>
          <button
            type="button"
            aria-label={t('cart.couponRemove', { code: cart.coupon.code })}
            onClick={async () => setError(await change('cart/coupon', { method: 'DELETE' }))}
            className="focus-ring flex size-9 items-center justify-center rounded-full text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {cart.coupon.status !== 'APPLIED' && (
          <p className="text-caption text-warning-fg">{cart.coupon.message}</p>
        )}
      </div>
    );
  return (
    <form onSubmit={submit} className="grid gap-1.5">
      <div className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">
          {t('cart.coupon')}
        </label>
        <input
          id="coupon"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder={t('cart.coupon')}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'coupon-error' : undefined}
          className="focus-ring h-11 min-w-0 flex-1 rounded-control border border-border-strong bg-surface px-3.5 text-body uppercase placeholder:text-fg-subtle placeholder:normal-case aria-invalid:border-danger"
        />
        <button
          type="submit"
          disabled={busy}
          className="focus-ring h-11 rounded-button border border-border-strong px-5 text-small font-semibold hover:border-fg disabled:opacity-50"
        >
          {t('cart.couponApply')}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="text-caption text-danger-fg">
          {error}
        </p>
      )}
    </form>
  );
}

/** Subtotal, discounts, shipping, tax, points and total. */
export function CartTotals({ cart, stage = 'cart' }: { cart: Cart; stage?: 'cart' | 'checkout' }) {
  const { t } = useI18n();
  const tt = cart.totals;
  const row = 'flex items-baseline justify-between gap-4';
  return (
    <dl className="grid gap-2.5 text-small">
      <div className={row}>
        <dt className="text-fg-muted">{t('cart.subtotal')}</dt>
        <dd className="tabular">{tt.subtotal.formatted}</dd>
      </div>
      {cart.promotions.map((p) => (
        <div key={p.label} className={row}>
          <dt className="text-fg-muted">{p.label}</dt>
          <dd className="tabular text-sale">
            {p.discount.amount ? `−${p.discount.formatted}` : t('cart.free')}
          </dd>
        </div>
      ))}
      {!cart.promotions.length && tt.discount.amount > 0 && (
        <div className={row}>
          <dt className="text-fg-muted">{t('cart.discount')}</dt>
          <dd className="tabular text-sale">−{tt.discount.formatted}</dd>
        </div>
      )}
      {cart.requiresShipping && (
        <div className={row}>
          <dt className="text-fg-muted">
            {t('cart.shipping')}
            {cart.shippingMethod && stage === 'checkout' && (
              <span> · {cart.shippingMethod.name}</span>
            )}
          </dt>
          <dd className="tabular">
            {cart.shippingMethod ? (
              tt.shipping.amount ? (
                tt.shipping.formatted
              ) : (
                t('cart.free')
              )
            ) : (
              <span className="text-fg-muted">{t('cart.shippingLater')}</span>
            )}
          </dd>
        </div>
      )}
      {!tt.pricesIncludeTax && tt.tax.amount > 0 && (
        <div className={row}>
          <dt className="text-fg-muted">{t('cart.tax')}</dt>
          <dd className="tabular">{tt.tax.formatted}</dd>
        </div>
      )}
      {tt.loyalty.amount > 0 && (
        <div className={row}>
          <dt className="text-fg-muted">{t('cart.loyalty')}</dt>
          <dd className="tabular text-sale">−{tt.loyalty.formatted}</dd>
        </div>
      )}
      <div className={cn(row, 'mt-2 border-t border-border pt-4 text-body')}>
        <dt className="font-semibold">{t('cart.total')}</dt>
        <dd className="tabular text-h4 font-semibold">{tt.amountDue.formatted}</dd>
      </div>
      {tt.pricesIncludeTax && tt.tax.amount > 0 && (
        <p className="text-right text-caption text-fg-muted">
          {t('cart.taxIncluded', { amount: tt.tax.formatted })}
        </p>
      )}
    </dl>
  );
}
