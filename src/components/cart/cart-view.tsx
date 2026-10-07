'use client';

import { Lock, ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from '@/components/intent-link';
import { buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';
import { useHref } from '../store/store-context';
import { useCart } from './cart-context';
import { CartLines, CartTotals, CouponForm } from './cart-parts';

/** Cart page body: lines on the left, summary with coupon and checkout on the right. */
export function CartView() {
  const { t } = useI18n();
  const to = useHref();
  const { cart, load } = useCart();
  useEffect(() => {
    void load(true);
  }, [load]);

  if (cart === null)
    return (
      <div
        aria-busy
        className="mt-8 grid min-h-[26rem] content-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <span className="sr-only">{t('cart.loading')}</span>
        <div className="grid gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[4/5] w-28" />
              <div className="grid flex-1 content-start gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-card" />
      </div>
    );

  // Same height as the loading skeleton, so nothing below moves when the cart turns out empty.
  if (!cart?.items.length)
    return (
      <div className="mt-8 grid min-h-[26rem] content-center justify-items-center gap-3 rounded-card bg-surface-muted px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-surface">
          <ShoppingBag aria-hidden className="size-7" strokeWidth={1.5} />
        </span>
        <h2 className="text-h3">{t('cart.empty')}</h2>
        <p className="max-w-sm text-fg-muted">{t('cart.emptyBody')}</p>
        <Link href={to('/')} className={cn(buttonVariants(), 'mt-3')}>
          {t('cart.continue')}
        </Link>
      </div>
    );

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      <section aria-label={t('order.items')} className="grid gap-4">
        {cart.warnings.map((w) => (
          <Notice key={w} tone="warning">
            {w}
          </Notice>
        ))}
        <CartLines cart={cart} />
        <Link
          href={to('/')}
          className="focus-ring justify-self-start rounded-xs text-small font-medium underline underline-offset-4"
        >
          {t('cart.continue')}
        </Link>
      </section>
      <aside
        aria-label={t('cart.summary')}
        className="grid gap-5 rounded-card bg-surface-muted p-6 lg:sticky lg:top-[calc(var(--header-height)+24px)]"
      >
        <h2 className="text-h4">{t('cart.summary')}</h2>
        <CouponForm cart={cart} />
        <CartTotals cart={cart} />
        <Link href={to('/checkout')} className={buttonVariants({ size: 'lg', block: true })}>
          <Lock aria-hidden />
          {t('cart.checkout')}
        </Link>
      </aside>
    </div>
  );
}
