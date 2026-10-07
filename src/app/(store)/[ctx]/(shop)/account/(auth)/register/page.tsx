import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/account/auth-forms';
import { translator } from '@/i18n';
import { safeNext } from '@/lib/password';
import { href } from '@/lib/routing';
import { currentCustomer } from '@/server/account';
import { requireCtx } from '@/server/ctx';
import { getPrefix } from '@/server/storefront';

/** Personal (session, return path): rendered per request. */
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await requireCtx();
  return { title: translator(ctx.locale)('auth.register'), robots: { index: false, follow: true } };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const prefix = await getPrefix(ctx);
  const next = safeNext((await searchParams).next, href('/account', prefix));
  if (await currentCustomer(ctx)) redirect(next);
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-h2">{t('auth.registerTitle')}</h1>
        <p className="text-fg-muted">{t('auth.registerBody')}</p>
      </div>
      <RegisterForm next={next} />
    </div>
  );
}
