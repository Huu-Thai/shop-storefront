'use client';

import { Gift, RotateCcw, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type Cart, useCart } from '@/components/cart/cart-context';
import { useStore } from '@/components/store/store-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Price, type PriceData } from '@/components/ui/price';
import { Quantity } from '@/components/ui/quantity';
import type { ImageData } from '@/components/ui/store-image';
import { useI18n } from '@/i18n/client';
import { addToCart, GatewayError } from '@/lib/cart-client';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import {
  initialSelection,
  matchVariant,
  type Selection,
  stockLevel,
  valueState,
} from '@/lib/variants';
import { Gallery } from './gallery';

type FullPrice = PriceData & {
  currency: string;
  tiers?: { minQty: number; formatted: string }[] | null;
};

export interface PurchaseProduct {
  id: string;
  sku: string;
  name: string;
  type: 'SIMPLE' | 'CONFIGURABLE' | 'BUNDLE' | 'VIRTUAL' | 'GIFT_CARD';
  inStock: boolean;
  price: FullPrice | null;
  images: ImageData[];
  options: {
    code: string;
    label: string;
    values: { code: string; label: string; swatch?: string | null }[];
  }[];
  variants: {
    id: string;
    sku: string;
    options: Record<string, string>;
    images: ImageData[];
    price: FullPrice | null;
    stock: { managed: boolean; inStock: boolean; salable: number | null } | null;
  }[];
  bundle: {
    priceType: 'DYNAMIC' | 'FIXED';
    options: {
      code: string;
      title: string;
      inputType: 'SELECT' | 'RADIO' | 'CHECKBOX' | 'MULTI';
      isRequired: boolean;
      selections: {
        sku: string;
        name: string;
        qty: number;
        isDefault: boolean;
        inStock: boolean;
        price: FullPrice | null;
      }[];
    }[];
  } | null;
  giftCard: {
    cardType: 'VIRTUAL' | 'PHYSICAL';
    amounts: { amount: number; currency: string }[];
    lifetimeDays: number | null;
  } | null;
}

/**
 * Gallery + purchase box for one product. Configurable products pick a variant from option values
 * (price, stock and images follow it); bundles pick their selections; gift cards show their
 * amounts. Adding goes through the gateway; the cart badge updates without a reload.
 */
export function Purchase({
  product,
  pricesIncludeTax,
  shortDescription,
}: {
  product: PurchaseProduct;
  pricesIncludeTax: boolean;
  shortDescription?: string | null;
}) {
  const { t, locale } = useI18n();
  const store = useStore();
  const { show } = useCart();
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product.variants, product.options),
  );
  const [bundlePick, setBundlePick] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      (product.bundle?.options ?? []).map((o) => [
        o.code,
        o.selections
          .filter((s) => s.isDefault)
          .map((s) => s.sku)
          .slice(0, o.inputType === 'CHECKBOX' || o.inputType === 'MULTI' ? undefined : 1),
      ]),
    ),
  );
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<
    { status: 'idle' | 'adding' } | { status: 'error'; message: string }
  >({ status: 'idle' });

  const configurable = product.type === 'CONFIGURABLE' && product.options.length > 0;
  const variant = configurable
    ? matchVariant(product.variants, product.options, selection)
    : undefined;
  const missing = configurable ? product.options.find((o) => !selection[o.code]) : undefined;
  // Variant images when the variant (or the chosen colour) has its own.
  const images = useMemo(() => {
    if (variant?.images.length) return variant.images;
    const lead = product.options[0];
    const byLead =
      lead && selection[lead.code]
        ? product.variants.find(
            (v) => v.options[lead.code] === selection[lead.code] && v.images.length,
          )
        : undefined;
    return byLead?.images.length ? byLead.images : product.images;
  }, [variant, selection, product]);

  const bundleTotal = useMemo(() => {
    if (!product.bundle || product.bundle.priceType !== 'DYNAMIC') return null;
    let sum = 0;
    let currency = product.price?.currency;
    for (const o of product.bundle.options)
      for (const sku of bundlePick[o.code] ?? []) {
        const s = o.selections.find((x) => x.sku === sku);
        if (s?.price) {
          sum += s.price.amount * s.qty;
          currency = s.price.currency;
        }
      }
    return currency ? formatMoney(sum, currency, locale) : null;
  }, [product, bundlePick, locale]);

  const price: FullPrice | null = variant?.price ?? product.price;
  const varies =
    configurable && !variant && new Set(product.variants.map((v) => v.price?.amount)).size > 1;
  const stock: ReturnType<typeof stockLevel> =
    configurable && variant ? stockLevel(variant.stock) : { kind: product.inStock ? 'in' : 'out' };
  const bundleIncomplete = product.bundle?.options.some(
    (o) => o.isRequired && !(bundlePick[o.code] ?? []).length,
  );
  const isGift = product.type === 'GIFT_CARD';
  const canBuy = !isGift && stock.kind !== 'out' && !missing && !bundleIncomplete;

  const add = async () => {
    setState({ status: 'adding' });
    try {
      const cart = await addToCart<Cart>(store.ctx, store.store, {
        sku: variant?.sku ?? product.sku,
        quantity: qty,
        options: product.bundle
          ? Object.entries(bundlePick).flatMap(([option, skus]) =>
              skus.map((sku) => ({ option, sku })),
            )
          : undefined,
      });
      setState({ status: 'idle' });
      // The mini-cart opens with the updated cart (and announces itself as a dialog).
      show(cart);
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof GatewayError ? e.message : t('product.addError'),
      });
    }
  };

  const labels = { was: t('price.was'), now: t('price.now'), from: t('price.from') };
  const max = variant?.stock?.managed && variant.stock.salable ? variant.stock.salable : 99;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      <Gallery images={images} name={product.name} />

      <div className="grid content-start gap-6 lg:sticky lg:top-[calc(var(--header-height)+24px)]">
        <div className="grid gap-3">
          <h1 className="text-h1">{product.name}</h1>
          {isGift && product.giftCard ? (
            <p className="text-h3 font-semibold">
              {product.giftCard.amounts
                .map((a) => formatMoney(a.amount, a.currency, locale))
                .join(' · ')}
            </p>
          ) : bundleTotal ? (
            <p className="tabular text-h3 font-semibold">{bundleTotal}</p>
          ) : (
            <Price price={price} size="lg" from={varies} labels={labels} />
          )}
          {!isGift && (
            <p className="text-small text-fg-muted">
              {pricesIncludeTax ? t('product.taxIncl') : t('product.taxExcl')}
            </p>
          )}
          {price?.tiers?.length ? (
            <ul className="grid gap-1">
              {price.tiers.map((tier) => (
                <li key={tier.minQty} className="text-small font-medium text-accent-text">
                  {t('product.tier', { qty: tier.minQty, price: tier.formatted })}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {shortDescription && <p className="text-body-lg text-fg-muted">{shortDescription}</p>}

        {configurable &&
          product.options.map((o) => {
            const chosen = o.values.find((v) => v.code === selection[o.code]);
            const swatches = o.values.some((v) => v.swatch);
            return (
              <fieldset key={o.code} className="grid gap-3">
                <legend className="mb-3 text-small">
                  <span className="font-semibold">{o.label}</span>
                  {chosen && <span className="text-fg-muted">: {chosen.label}</span>}
                </legend>
                <div role="radiogroup" aria-label={o.label} className="flex flex-wrap gap-2">
                  {o.values.map((v) => {
                    const st = valueState(
                      product.variants,
                      product.options,
                      selection,
                      o.code,
                      v.code,
                    );
                    const on = selection[o.code] === v.code;
                    const label =
                      st === 'available'
                        ? v.label
                        : `${v.label} — ${st === 'soldOut' ? t('product.soldOut') : t('product.unavailable')}`;
                    return (
                      <button
                        key={v.code}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={label}
                        title={label}
                        disabled={st === 'missing'}
                        onClick={() => {
                          setSelection((s) => ({ ...s, [o.code]: v.code }));
                          setState({ status: 'idle' });
                        }}
                        className={cn(
                          'focus-ring relative flex items-center justify-center text-small font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35',
                          swatches
                            ? 'size-11 rounded-full ring-offset-2 ring-offset-bg'
                            : 'h-11 min-w-14 rounded-control border px-4',
                          swatches &&
                            (on ? 'ring-2 ring-fg' : 'hover:ring-1 hover:ring-border-strong'),
                          !swatches &&
                            (on
                              ? 'border-primary bg-primary text-primary-fg'
                              : 'border-border-strong hover:border-fg'),
                          st === 'soldOut' && !swatches && 'text-fg-muted line-through',
                        )}
                      >
                        {swatches ? (
                          <span
                            aria-hidden
                            className="size-9 rounded-full border border-border-strong"
                            style={{ background: v.swatch ?? undefined }}
                          />
                        ) : (
                          v.label
                        )}
                        {swatches && st === 'soldOut' && (
                          <span
                            aria-hidden
                            className="absolute h-0.5 w-10 rotate-45 rounded-full bg-fg/70"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

        {product.bundle && (
          <fieldset className="grid gap-4 rounded-card bg-surface-muted p-5">
            <legend className="sr-only">{t('product.bundle')}</legend>
            <p aria-hidden className="text-small font-semibold">
              {t('product.bundle')}
            </p>
            {product.bundle.options.map((o) => {
              const multi = o.inputType === 'CHECKBOX' || o.inputType === 'MULTI';
              const picked = bundlePick[o.code] ?? [];
              return (
                <div key={o.code} className="grid gap-2">
                  <p className="text-small font-medium">
                    {o.title}
                    {!o.isRequired && (
                      <span className="text-fg-muted"> · {t('product.optional')}</span>
                    )}
                  </p>
                  <ul className="grid gap-2">
                    {o.selections.map((s) => {
                      const on = picked.includes(s.sku);
                      return (
                        <li key={s.sku}>
                          <label
                            className={cn(
                              'flex min-h-12 cursor-pointer items-center gap-3 rounded-control border bg-surface px-3 text-small',
                              on ? 'border-fg' : 'border-border hover:border-border-strong',
                              !s.inStock && 'cursor-not-allowed opacity-50',
                            )}
                          >
                            <input
                              type={multi ? 'checkbox' : 'radio'}
                              name={`bundle-${o.code}`}
                              checked={on}
                              disabled={!s.inStock}
                              onChange={() =>
                                setBundlePick((p) => ({
                                  ...p,
                                  [o.code]: multi
                                    ? on
                                      ? picked.filter((x) => x !== s.sku)
                                      : [...picked, s.sku]
                                    : [s.sku],
                                }))
                              }
                              className="size-4 accent-[var(--primary)]"
                            />
                            <span className="flex-1">
                              {s.qty > 1 && (
                                <span className="tabular font-semibold">{s.qty} × </span>
                              )}
                              {s.name} <span className="text-fg-muted">· {s.sku}</span>
                            </span>
                            {s.price && (
                              <span className="tabular font-medium">{s.price.formatted}</span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                    {!o.isRequired && !multi && (
                      <li>
                        <button
                          type="button"
                          onClick={() => setBundlePick((p) => ({ ...p, [o.code]: [] }))}
                          className="focus-ring rounded-xs text-small underline underline-offset-4"
                        >
                          {t('product.none')}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </fieldset>
        )}

        {isGift && product.giftCard && (
          <div className="grid gap-3">
            <ul className="flex flex-wrap gap-2 text-small text-fg-muted">
              <li className="inline-flex items-center gap-1.5">
                <Gift aria-hidden className="size-4" />
                {product.giftCard.cardType === 'VIRTUAL'
                  ? t('product.giftDigital')
                  : t('product.giftPhysical')}
              </li>
              {product.giftCard.lifetimeDays ? (
                <li>· {t('product.giftValidity', { days: product.giftCard.lifetimeDays })}</li>
              ) : null}
            </ul>
            <Notice tone="info">{t('product.giftNotOnline')}</Notice>
          </div>
        )}

        {!isGift && (
          <div className="grid gap-4">
            <p
              className={cn(
                'inline-flex items-center gap-2 text-small font-medium',
                stock.kind === 'out'
                  ? 'text-stock-out'
                  : stock.kind === 'low'
                    ? 'text-stock-low'
                    : 'text-stock-in',
              )}
            >
              <span aria-hidden className="size-2 rounded-full bg-current" />
              {stock.kind === 'out'
                ? t('product.outOfStock')
                : stock.kind === 'low'
                  ? t('product.lowStock', { n: stock.count ?? 0 })
                  : t('product.inStock')}
            </p>
            <div className="flex gap-3">
              <Quantity
                value={qty}
                onChange={setQty}
                max={max}
                label={t('product.quantityFor', { name: product.name })}
                labels={{ decrease: t('a11y.decrease'), increase: t('a11y.increase') }}
                disabled={!canBuy}
              />
              <Button
                size="lg"
                className="flex-1"
                disabled={!canBuy}
                loading={state.status === 'adding'}
                onClick={add}
              >
                {missing
                  ? t('product.choose', { option: missing.label.toLowerCase() })
                  : stock.kind === 'out'
                    ? t('product.soldOut')
                    : t('product.addToCart')}
              </Button>
            </div>
            <div aria-live="polite">
              {state.status === 'error' && <Notice tone="danger" title={state.message} />}
            </div>
          </div>
        )}

        {/* Shipping and returns promises don't apply to gift cards. */}
        {!isGift && (
          <ul className="grid gap-3 border-t border-border pt-6 text-small text-fg-muted">
            <li className="flex items-center gap-3">
              <Truck aria-hidden className="size-5 text-fg" strokeWidth={1.75} />
              {t('product.shipping')}
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw aria-hidden className="size-5 text-fg" strokeWidth={1.75} />
              {t('product.returns')}
            </li>
            <li>
              <Badge tone="outline" className="font-mono font-medium">
                {t('product.sku', { sku: variant?.sku ?? product.sku })}
              </Badge>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
