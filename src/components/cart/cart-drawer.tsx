'use client';

import { ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from '@/components/intent-link';
import { buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';
import { useHref } from '../store/store-context';
import { useCart } from './cart-context';
import { CartLines, CartTotals } from './cart-parts';

/**
 * Mini-cart (right drawer), opened after adding to the cart or from the header. Loaded on first
 * use by CartProvider.
 */
export default function CartDrawer() {
  const { t } = useI18n();
  const to = useHref();
  const { cart, loading, load, drawerOpen, setDrawerOpen } = useCart();
  useEffect(() => {
    if (drawerOpen) void load();
  }, [drawerOpen, load]);
  const close = () => setDrawerOpen(false);
  const count = cart?.items.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        title={count ? t('cart.titleCount', { n: count }) : t('cart.title')}
        closeLabel={t('a11y.close')}
        footer={
          cart?.items.length ? (
            <div className="grid gap-4">
              <CartTotals cart={cart} />
              <div className="grid gap-2">
                <Link
                  href={to('/checkout')}
                  onClick={close}
                  className={buttonVariants({ size: 'lg', block: true })}
                >
                  {t('cart.checkout')}
                </Link>
                <Link
                  href={to('/cart')}
                  onClick={close}
                  className={buttonVariants({ variant: 'secondary', size: 'lg', block: true })}
                >
                  {t('cart.viewCart')}
                </Link>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="p-5" aria-live="polite">
          {cart === null || (loading && !cart) ? (
            <p className="flex items-center gap-2 text-small text-fg-muted">
              <Spinner /> {t('cart.loading')}
            </p>
          ) : cart?.items.length ? (
            <CartLines cart={cart} compact onNavigate={close} />
          ) : (
            <div className="grid justify-items-center gap-3 py-16 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-sunken">
                <ShoppingBag aria-hidden className="size-7" strokeWidth={1.5} />
              </span>
              <p className="text-h4">{t('cart.empty')}</p>
              <p className="max-w-xs text-small text-fg-muted">{t('cart.emptyBody')}</p>
              <button
                type="button"
                onClick={close}
                className={cn(buttonVariants({ variant: 'secondary' }), 'mt-2')}
              >
                {t('cart.continue')}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
