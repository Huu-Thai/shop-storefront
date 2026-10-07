import type { Metadata } from 'next';
import { OrderView } from '@/components/checkout/order-view';

export const instant = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  return <OrderView number={decodeURIComponent(number)} embedded />;
}
