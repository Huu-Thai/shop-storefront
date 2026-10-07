'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/client';

/** Unexpected error inside a store page; the header and footer stay usable. */
export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <section className="container-page grid min-h-[50vh] place-content-center justify-items-center gap-4 py-24 text-center">
      <h1 className="text-h1">{t('error.generic')}</h1>
      <p className="max-w-md text-body-lg text-fg-muted">{t('error.genericBody')}</p>
      <Button size="lg" onClick={reset}>
        {t('error.retry')}
      </Button>
    </section>
  );
}
