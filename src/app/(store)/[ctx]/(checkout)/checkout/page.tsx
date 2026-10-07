import type { Metadata } from 'next';
import { Checkout } from '@/components/checkout/checkout';
import { translator } from '@/i18n';
import { requireCtx } from '@/server/ctx';
import { getConfig } from '@/server/storefront';

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await requireCtx();
  return {
    title: translator(ctx.locale)('checkout.title'),
    robots: { index: false, follow: false },
  };
}

/** One-page checkout: a static shell; the cart and every step run in the browser via the gateway. */
export default async function CheckoutPage() {
  const ctx = await requireCtx();
  const config = await getConfig(ctx);
  return <Checkout storeCountry={config?.store.countryCode ?? 'US'} />;
}
