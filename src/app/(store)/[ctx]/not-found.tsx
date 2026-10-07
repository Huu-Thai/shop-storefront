import { Link } from '@/components/intent-link';
import { buttonVariants } from '@/components/ui/button';
import { translator } from '@/i18n';

/** 404 inside a store (wrong product URL, removed page). Plain links: the shell is around it. */
export default function NotFound() {
  // The store's language isn't available here without request data; English copy is replaced
  // by a localised page in Phase 4 (CMS 404 page per store).
  const t = translator('en-US');
  return (
    <section className="container-page grid min-h-[60vh] place-content-center justify-items-center gap-5 py-24 text-center">
      <p className="font-display text-[88px] leading-none font-bold tracking-[-0.05em] text-fg-subtle">
        404
      </p>
      <h1 className="text-h1">{t('error.notFound')}</h1>
      <p className="max-w-md text-body-lg text-fg-muted">{t('error.notFoundBody')}</p>
      <Link href="/" className={buttonVariants({ size: 'lg' })}>
        {t('error.backHome')}
      </Link>
    </section>
  );
}
