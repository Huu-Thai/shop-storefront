import type { Metadata } from 'next';
import { AccountOverview } from '@/components/account/account-views';

export const instant = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountPage() {
  return <AccountOverview />;
}
