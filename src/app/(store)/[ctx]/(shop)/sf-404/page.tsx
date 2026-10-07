import type { Metadata } from 'next';
import { StoreNotFound } from '@/components/content/store-not-found';
import { requireCtx } from '@/server/ctx';

export const metadata: Metadata = { robots: { index: false, follow: true } };

/**
 * Unknown catalog URLs: the proxy rewrites here with status 404, so shoppers get the store's own
 * 404 page (in its language, with the header and footer) and crawlers get a real 404 status.
 */
export default async function MissingPage() {
  await requireCtx();
  return <StoreNotFound />;
}
