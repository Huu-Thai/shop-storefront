'use client';

import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useI18n } from '@/i18n/client';
import type { NavItem } from './nav-types';

const load = () => import('./mobile-nav-drawer');
const Drawer = dynamic(load, { ssr: false });

/**
 * Menu button for phones and tablets. The drawer (and the dialog library behind it) loads when the
 * shopper is about to use it — prefetched on hover / focus / touch, rendered on first open.
 */
export function MobileNav({ nav, accountHref }: { nav: NavItem[]; accountHref: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={t('a11y.openMenu')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={() => void load()}
        onFocus={() => void load()}
        onTouchStart={() => void load()}
        onClick={() => {
          setUsed(true);
          setOpen(true);
        }}
        className="focus-ring -ml-2 flex size-11 items-center justify-center rounded-full hover:bg-surface-sunken"
      >
        <Menu aria-hidden className="size-6" strokeWidth={1.75} />
      </button>
      {used && <Drawer nav={nav} accountHref={accountHref} open={open} onOpenChange={setOpen} />}
    </>
  );
}
