import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';
import { translator } from '@/i18n';
import { requireCtx } from '@/server/ctx';

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await requireCtx();
  return { title: translator(ctx.locale)('cart.title'), robots: { index: false, follow: false } };
}

/** The cart page: a static shell; the shopper's cart loads in the browser through the gateway. */
export default async function CartPage() {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  return (
    <div className="container-page pt-8 pb-[var(--section-y)] md:pt-12">
      <h1 className="text-h1">{t('cart.title')}</h1>
      <CartView />
    </div>
  );
}
