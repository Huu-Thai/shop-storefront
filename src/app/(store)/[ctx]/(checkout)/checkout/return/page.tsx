import type { Metadata } from 'next';
import { PaymentReturn } from '@/components/checkout/payment-return';
import { requireCtx } from '@/server/ctx';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Where payment providers send the shopper back; confirms the payment with the shop. */
export default async function PaymentReturnPage() {
  // Every store page resolves its store first (an unknown or build-time ctx 404s).
  await requireCtx();
  return <PaymentReturn />;
}
