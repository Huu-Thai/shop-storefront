'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useI18n } from '@/i18n/client';

/** The filter panel in a drawer on phones and tablets (loaded on first use). */
export default function FilterDrawer({
  open,
  onOpenChange,
  total,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        title={t('catalog.filters')}
        closeLabel={t('a11y.close')}
        footer={
          <Button block size="lg" onClick={() => onOpenChange(false)}>
            {t('catalog.showResults', { n: total })}
          </Button>
        }
      >
        <div className="p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
