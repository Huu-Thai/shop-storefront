import type { Metadata, Viewport } from 'next';
import { ctx as rootCtx } from 'next/root-params';
import type { ReactNode } from 'react';
import '../../globals.css';
import { CartProvider } from '@/components/cart/cart-context';
import { StoreProvider } from '@/components/store/store-context';
import { SkipLink } from '@/components/skip-link';
import { ThemeScript } from '@/components/theme-script';
import { translator } from '@/i18n';
import { I18nProvider } from '@/i18n/client';
import { decodeCtx } from '@/lib/routing';
import { getShell } from '@/server/shell';
import { themeConfig } from '@/theme/config';
import { bodyFont } from '../../fonts';

/**
 * With Cache Components each root param needs one build-time value. `_` is never routed to (the
 * proxy only rewrites to real ctx values); it renders a bare shell and its pages 404, so building
 * doesn't need the shop API.
 */
export async function generateStaticParams() {
  return [{ ctx: '_' }];
}

export async function generateMetadata(): Promise<Metadata> {
  const c = decodeCtx(await rootCtx());
  const shell = c ? await getShell(c) : null;
  const name = shell?.config.store.name
    ? `${themeConfig.name} · ${shell.config.store.name}`
    : themeConfig.name;
  const site = process.env.SITE_URL;
  return {
    metadataBase: site ? new URL(site) : undefined,
    title: { default: themeConfig.name, template: `%s · ${themeConfig.name}` },
    description: translator(c?.locale ?? 'en-US')('brand.tagline'),
    applicationName: name,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const c = decodeCtx(await rootCtx());
  const shell = c ? await getShell(c) : null;
  const fonts = bodyFont.variable;
  if (!c || !shell)
    return (
      <html lang="en" className={fonts}>
        <body>{children}</body>
      </html>
    );
  const t = translator(c.locale);
  return (
    <html lang={c.locale} className={fonts} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        {/* Each layout group puts `id="main"` on its <main>. */}
        <SkipLink label={t('a11y.skip')} />
        <StoreProvider value={shell.store}>
          <I18nProvider locale={c.locale}>
            <CartProvider>{children}</CartProvider>
          </I18nProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
