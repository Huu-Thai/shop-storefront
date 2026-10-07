'use client';

import { ShoppingBag } from 'lucide-react';
import { Link } from '@/components/intent-link';
import { useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';
import { useCart } from '../cart/cart-context';
import { useHref, useStore } from '../store/store-context';

/** Item count from the readable cookie the gateway keeps in step with the cart (no API call). */
function readCount(store: string): number {
  const m = document.cookie.match(new RegExp(`(?:^|; )sf_cart_count_${store}=(\\d+)`));
  return m ? Number(m[1]) : 0;
}
const subscribe = (cb: () => void) => {
  // Cart changes dispatch `sf:cart` (Phase 2); focus covers changes made in another tab.
  window.addEventListener('sf:cart', cb);
  window.addEventListener('focus', cb);
  return () => {
    window.removeEventListener('sf:cart', cb);
    window.removeEventListener('focus', cb);
  };
};

export function CartButton() {
  const { store } = useStore();
  const { t } = useI18n();
  const to = useHref();
  const count = useSyncExternalStore(
    subscribe,
    () => readCount(store),
    () => 0,
  );
  const { setDrawerOpen } = useCart();
  return (
    <Link
      href={to('/cart')}
      aria-label={t('header.cartCount', { n: count })}
      aria-haspopup="dialog"
      // A real link to the cart page; once interactive it opens the mini-cart instead.
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        setDrawerOpen(true);
      }}
      className="focus-ring relative flex size-11 items-center justify-center rounded-full hover:bg-surface-sunken"
    >
      <ShoppingBag aria-hidden className="size-[22px]" strokeWidth={1.75} />
      <span
        aria-hidden
        className={cn(
          'tabular absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-fg transition-transform',
          count ? 'scale-100' : 'scale-0',
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}
