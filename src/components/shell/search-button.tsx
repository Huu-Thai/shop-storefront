'use client';

import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Link } from '@/components/intent-link';
import { useState } from 'react';
import { useI18n } from '@/i18n/client';
import { useHref } from '../store/store-context';

const load = () => import('./search-overlay');
const Overlay = dynamic(load, { ssr: false });

/**
 * Header search. A real link to the search page (works before scripts load); once interactive it
 * opens the search overlay with live suggestions, loaded on first use.
 */
export function SearchButton() {
  const { t } = useI18n();
  const to = useHref();
  const [open, setOpen] = useState(false);
  // Each opening starts fresh (no stale suggestions or highlighted row).
  const [opened, setOpened] = useState(0);
  return (
    <>
      <Link
        href={to('/search')}
        aria-label={t('header.search')}
        aria-haspopup="dialog"
        onPointerEnter={() => void load()}
        onFocus={() => void load()}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          setOpened((n) => n + 1);
          setOpen(true);
        }}
        className="focus-ring flex size-11 items-center justify-center rounded-full hover:bg-surface-sunken"
      >
        <Search aria-hidden className="size-[22px]" strokeWidth={1.75} />
      </Link>
      {opened > 0 && <Overlay key={opened} open={open} onOpenChange={setOpen} />}
    </>
  );
}
