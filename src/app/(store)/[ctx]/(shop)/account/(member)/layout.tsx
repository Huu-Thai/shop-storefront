import type { ReactNode } from 'react';
import { AccountNav } from '@/components/account/account-nav';
import { translator } from '@/i18n';
import { requireCustomer } from '@/server/account';
import { requireCtx } from '@/server/ctx';

/** Account area: the signed-in customer only (others are sent to sign in and brought back). */
export default async function MemberLayout({ children }: { children: ReactNode }) {
  const ctx = await requireCtx();
  await requireCustomer(ctx);
  const t = translator(ctx.locale);
  return (
    <div className="container-page grid gap-6 pt-8 pb-[var(--section-y)] md:pt-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <div className="grid content-start gap-6">
        <p className="text-overline font-semibold text-fg-muted uppercase">{t('account.title')}</p>
        <AccountNav />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
