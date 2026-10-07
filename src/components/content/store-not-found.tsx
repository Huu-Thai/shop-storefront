import { ctx as rootCtx } from 'next/root-params';
import { Link } from '@/components/intent-link';
import { buttonVariants } from '@/components/ui/button';
import { translator } from '@/i18n';
import { decodeCtx, href } from '@/lib/routing';
import { getCategoryTree, getPrefix } from '@/server/storefront';

/**
 * 404 inside a store, in its language, with ways forward (home and the top categories). Used by
 * not-found.tsx (notFound() in pages) and by the proxy's 404 route (unknown catalog URLs).
 */
export async function StoreNotFound() {
  let locale = 'en-US';
  let prefix = '';
  let categories: { id: string; name: string; urlPath: string | null }[] = [];
  try {
    const c = decodeCtx(await rootCtx());
    if (c) {
      locale = c.locale;
      [prefix, categories] = await Promise.all([getPrefix(c), getCategoryTree(c)]);
    }
  } catch {
    // Outside a store (build-time placeholder): English, no links.
  }
  const t = translator(locale);
  return (
    <section className="container-page grid min-h-[60vh] place-content-center justify-items-center gap-5 py-24 text-center">
      <p className="font-display text-[88px] leading-none font-bold tracking-[-0.05em] text-fg-subtle">
        404
      </p>
      <h1 className="text-h1">{t('error.notFound')}</h1>
      <p className="max-w-md text-body-lg text-fg-muted">{t('error.notFoundBody')}</p>
      <Link href={href('/', prefix)} className={buttonVariants({ size: 'lg' })}>
        {t('error.backHome')}
      </Link>
      {categories.length > 0 && (
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {categories.slice(0, 6).map((c) => (
            <li key={c.id}>
              <Link
                href={href(`/${c.urlPath ?? ''}`, prefix)}
                className="focus-ring inline-flex h-10 items-center rounded-full border border-border-strong px-4 text-small font-medium hover:border-fg"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
