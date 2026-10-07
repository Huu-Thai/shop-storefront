'use client';

import '@/lib/last-focus';
import dynamic from 'next/dynamic';
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { GatewayError, sf } from '@/lib/cart-client';
import type { components } from '@/server/shop-api';
import { useStore } from '../store/store-context';

export type Cart = components['schemas']['CartDto'];
export type CartLine = components['schemas']['CartLineViewDto'];

interface CartState {
  /** null until loaded; undefined when the shopper has no cart. */
  cart: Cart | null | undefined;
  loading: boolean;
  /** Fetches the cart (once; pass `force` to refresh). */
  load: (force?: boolean) => Promise<Cart | undefined>;
  /**
   * Runs a cart change through the gateway and keeps the result. Resolves to an error message for
   * the shopper, or null on success.
   */
  change: (path: string, init: RequestInit) => Promise<string | null>;
  /** Shows a cart the caller already has (e.g. right after adding) and opens the drawer. */
  show: (cart: Cart) => void;
  /** The cart became an order: forget it here too. */
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const Ctx = createContext<CartState | null>(null);

export function useCart(): CartState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart() outside <CartProvider>');
  return v;
}

const hasCartCookie = (store: string) =>
  new RegExp(`(?:^|; )sf_cart_count_${store}=`).test(document.cookie);

const Drawer = dynamic(() => import('./cart-drawer'), { ssr: false });

/**
 * The shopper's cart, loaded on demand (drawer, cart page, checkout) — ordinary pages never fetch
 * it; the header badge reads a cookie. Every change goes through the gateway, which keeps the cart
 * token server-side.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [cart, setCartState] = useState<Cart | null | undefined>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUsed, setDrawerUsed] = useState(false);
  const inflight = useRef<Promise<Cart | undefined> | null>(null);
  // Read through a ref so `load` keeps one identity: effects that call it run once, not after every
  // cart change (which re-fetched the cart and could race with placing the order).
  const current = useRef<Cart | null | undefined>(null);
  const setCart = useCallback((c: Cart | null | undefined) => {
    current.current = c;
    setCartState(c);
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!force && current.current !== null) return current.current ?? undefined;
      if (inflight.current) return inflight.current;
      if (!hasCartCookie(store.store)) {
        setCart(undefined);
        return undefined;
      }
      setLoading(true);
      inflight.current = sf<Cart>(store.ctx, 'cart')
        .then((c) => {
          setCart(c);
          return c;
        })
        .catch((e) => {
          // 404: the cart expired (the gateway cleared its cookies).
          if (e instanceof GatewayError && e.status === 404) setCart(undefined);
          return undefined;
        })
        .finally(() => {
          setLoading(false);
          inflight.current = null;
        });
      return inflight.current;
    },
    [setCart, store.ctx, store.store],
  );

  const change = useCallback(
    async (path: string, init: RequestInit) => {
      try {
        const next = await sf<Cart>(store.ctx, path, init);
        setCart(next);
        window.dispatchEvent(new Event('sf:cart'));
        return null;
      } catch (e) {
        if (e instanceof GatewayError && e.status === 404 && path.startsWith('cart')) {
          setCart(undefined);
          window.dispatchEvent(new Event('sf:cart'));
        }
        return e instanceof GatewayError ? e.message : 'Network error';
      }
    },
    [setCart, store.ctx],
  );

  const show = useCallback(
    (c: Cart) => {
      setCart(c);
      setDrawerUsed(true);
      setDrawerOpen(true);
    },
    [setCart],
  );

  const clear = useCallback(() => {
    inflight.current = null;
    setCart(undefined);
    window.dispatchEvent(new Event('sf:cart'));
  }, [setCart]);

  const open = useCallback((o: boolean) => {
    if (o) setDrawerUsed(true);
    setDrawerOpen(o);
  }, []);

  return (
    <Ctx.Provider
      value={{ cart, loading, load, change, show, clear, drawerOpen, setDrawerOpen: open }}
    >
      {children}
      {drawerUsed && <Drawer />}
    </Ctx.Provider>
  );
}
