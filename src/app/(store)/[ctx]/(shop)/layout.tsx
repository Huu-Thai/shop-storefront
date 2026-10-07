import { ctx as rootCtx } from 'next/root-params';
import { type ReactNode, Suspense } from 'react';
import { DemoBar } from '@/components/shell/demo-bar';
import { AnnouncementBar } from '@/components/shell/announcement-bar';
import { Footer } from '@/components/shell/footer';
import { Header } from '@/components/shell/header';
import { translator } from '@/i18n';
import { decodeCtx, href } from '@/lib/routing';
import { getShell } from '@/server/shell';
import { themeConfig } from '@/theme/config';

/** Store pages: announcement bar, header, footer (docs/STYLE-GUIDE.md §8). */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const c = decodeCtx(await rootCtx());
  const shell = c ? await getShell(c) : null;
  if (!c || !shell) return <main id="main">{children}</main>;
  const t = translator(c.locale);
  const to = (path: string) => href(path, shell.prefix);
  return (
    <>
      <Suspense>
        <DemoBar t={t} />
      </Suspense>
      <AnnouncementBar message={t('announce.text')} />
      <Header
        nav={shell.nav}
        homeHref={to('/')}
        prefixHref={to}
        t={t}
        storeName={shell.config.store.name}
      />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      {/* Its own hydration boundary: React can yield between the page and the footer, keeping
          main-thread tasks short on phones. */}
      <Suspense>
        <Footer
          shop={shell.shopLinks}
          help={shell.helpLinks}
          t={t}
          storeName={themeConfig.name}
          year={shell.year}
        />
      </Suspense>
    </>
  );
}
