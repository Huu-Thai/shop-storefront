import type { Metadata } from 'next';
import { LoyaltyView } from '@/components/account/account-views';

export const instant = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PointsPage() {
  return <LoyaltyView />;
}
