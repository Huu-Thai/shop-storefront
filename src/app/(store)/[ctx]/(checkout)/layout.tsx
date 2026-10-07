import { ArrowLeft, Lock } from 'lucide-react';
import { ctx as rootCtx } from 'next/root-params';
import type { ReactNode } from 'react';
import { Link } from '@/components/intent-link';
import { Logo } from '@/components/shell/logo';
import { translator } from '@/i18n';
import { decodeCtx, href } from '@/lib/routing';
import { getShell } from '@/server/shell';
import { themeConfig } from '@/theme/config';

/**
 * Checkout chrome (docs/STYLE-GUIDE.md §13.5): no menus or promotions to wander off to — logo,
 * "Secure checkout" and a way back to the cart.
 */
export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  const c = decodeCtx(await rootCtx());
  const shell = c ? await getShell(c) : null;
  if (!c || !shell) return <main id="main">{children}</main>;
  const t = translator(c.locale);
  const to = (path: string) => href(path, shell.prefix);
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-[var(--header-height)] items-center justify-between gap-4">
          <Link
            href={to('/cart')}
            aria-label={t('checkout.backToCart')}
            className="focus-ring inline-flex items-center gap-2 rounded-xs text-small font-medium text-fg-muted hover:text-fg"
          >
            <ArrowLeft aria-hidden className="size-4" />
            <span className="hidden sm:inline">{t('checkout.backToCart')}</span>
          </Link>
          <Link
            href={to('/')}
            aria-label={t('a11y.home', { name: shell.config.store.name })}
            className="focus-ring rounded-xs"
          >
            <Logo />
          </Link>
          <p className="inline-flex items-center gap-2 text-small font-medium">
            <Lock aria-hidden className="size-4 text-stock-in" />
            <span className="hidden sm:inline">{t('cart.secure')}</span>
          </p>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 bg-surface-muted outline-none">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6 text-caption text-fg-muted">
          <p>{t('footer.rights', { year: shell.year, name: themeConfig.name })}</p>
          <ul className="flex flex-wrap gap-4">
            {shell.helpLinks.map((l) => (
              <li key={l.id}>
                <Link href={l.href} className="focus-ring rounded-xs hover:text-fg hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
