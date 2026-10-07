import type { Metadata } from 'next';
import { AddressBook } from '@/components/account/account-views';
import { requireCtx } from '@/server/ctx';
import { getConfig } from '@/server/storefront';

export const instant = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const ctx = await requireCtx();
  const config = await getConfig(ctx);
  return <AddressBook storeCountry={config?.store.countryCode ?? 'US'} />;
}
