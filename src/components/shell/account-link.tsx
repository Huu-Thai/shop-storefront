'use client';

import { CircleUserRound } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Link } from '@/components/intent-link';
import { useI18n } from '@/i18n/client';
import { SIGNED_IN_COOKIE } from '@/lib/preferences';
import { useHref } from '../store/store-context';

const subscribe = (cb: () => void) => {
  window.addEventListener('focus', cb);
  return () => window.removeEventListener('focus', cb);
};
const signedIn = () => document.cookie.includes(`${SIGNED_IN_COOKIE}=1`);

/** Header account link with a signed-in dot (from the hint cookie — no request, page stays cached). */
export function AccountLink({ className }: { className?: string }) {
  const { t } = useI18n();
  const to = useHref();
  const on = useSyncExternalStore(subscribe, signedIn, () => false);
  return (
    <Link href={to('/account')} aria-label={t('header.account')} className={className}>
      <span className="relative">
        <CircleUserRound aria-hidden className="size-[22px]" strokeWidth={1.75} />
        {on && (
          <span
            aria-hidden
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-header-bg bg-stock-in"
          />
        )}
      </span>
    </Link>
  );
}
