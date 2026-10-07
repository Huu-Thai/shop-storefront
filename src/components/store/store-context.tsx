'use client';

import { createContext, type ReactNode, useContext } from 'react';
import { href as join } from '@/lib/routing';

export interface StoreInfo {
  /** Internal ctx (`<store>.<locale>.<currency>`), sent to the gateway with every call. */
  ctx: string;
  store: string;
  storeName: string;
  locale: string;
  currency: string;
  /** Public prefix (store base + locale), '' at the root. */
  prefix: string;
  locales: { code: string; name: string; href: string }[];
  currencies: { code: string; name: string; symbol: string }[];
  stores: { code: string; name: string; href: string }[];
}

const StoreCtx = createContext<StoreInfo | null>(null);

export function StoreProvider({ value, children }: { value: StoreInfo; children: ReactNode }) {
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreInfo {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore() outside <StoreProvider>');
  return v;
}

/** Public URL of a storefront path in the current store and language. */
export function useHref() {
  const { prefix } = useStore();
  return (path: string) => join(path, prefix);
}
