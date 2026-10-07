import type { Metadata } from 'next';
import { OrderView } from '@/components/checkout/order-view';
import { requireCtx } from '@/server/ctx';

/** Order pages are personal: rendered per request, read in the browser with the order's cookie. */
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  await requireCtx();
  const { number } = await params;
  return <OrderView number={decodeURIComponent(number)} />;
}
