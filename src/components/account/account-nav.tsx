'use client';

import { LayoutGrid, LogOut, MapPin, Package, Star, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Link } from '@/components/intent-link';
import { useHref, useStore } from '@/components/store/store-context';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';
import { signOut } from '@/server/account-actions';

/** Account navigation: a sidebar on desktop, a scrolling tab row on phones. */
export function AccountNav() {
  const { t } = useI18n();
  const to = useHref();
  const store = useStore();
  const pathname = usePathname();
  const items = [
    { href: to('/account'), label: t('account.overview'), icon: LayoutGrid, exact: true },
    { href: to('/account/orders'), label: t('account.orders'), icon: Package },
    { href: to('/account/addresses'), label: t('account.addresses'), icon: MapPin },
    { href: to('/account/profile'), label: t('account.profile'), icon: UserRound },
    { href: to('/account/points'), label: t('account.points'), icon: Star },
  ];
  const active = (i: (typeof items)[number]) =>
    i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`);
  return (
    <nav
      aria-label={t('account.title')}
      className="-mx-[var(--gutter)] scrollbar-none overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul className="flex gap-2 lg:grid lg:gap-1">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={active(i) ? 'page' : undefined}
              className={cn(
                'focus-ring inline-flex h-11 items-center gap-3 rounded-full px-4 text-small font-medium whitespace-nowrap lg:flex lg:rounded-md',
                active(i)
                  ? 'bg-primary text-primary-fg'
                  : 'bg-surface-sunken hover:bg-border lg:bg-transparent lg:hover:bg-surface-sunken',
              )}
            >
              <i.icon aria-hidden className="size-[18px]" strokeWidth={1.75} />
              {i.label}
            </Link>
          </li>
        ))}
        <li className="lg:mt-4 lg:border-t lg:border-border lg:pt-4">
          <form action={signOut}>
            <input type="hidden" name="ctx" value={store.ctx} />
            <button
              type="submit"
              className="focus-ring inline-flex h-11 items-center gap-3 rounded-full px-4 text-small font-medium whitespace-nowrap text-fg-muted hover:text-fg lg:w-full lg:rounded-md lg:hover:bg-surface-sunken"
            >
              <LogOut aria-hidden className="size-[18px]" strokeWidth={1.75} />
              {t('auth.signOut')}
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
