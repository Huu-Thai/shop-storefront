'use client';

import { ChevronDown, CircleUserRound } from 'lucide-react';
import { Link } from '@/components/intent-link';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';
import { Logo } from './logo';
import type { NavItem } from './nav-types';

/**
 * Phone / tablet navigation drawer: the main menu with expandable groups, then account. Loaded on
 * demand by MobileNav (src/components/shell/mobile-nav-button.tsx) so the dialog code isn't part of
 * every page's first load.
 */
export default function MobileNavDrawer({
  nav,
  accountHref,
  open,
  onOpenChange,
}: {
  nav: NavItem[];
  accountHref: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" title={<Logo />} closeLabel={t('a11y.close')}>
        <nav aria-label={t('a11y.mainNav')} className="px-2 py-3">
          <ul>
            {nav.map((item) => (
              <li key={item.id} className="border-b border-border last:border-0">
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={close}
                    className="focus-ring flex-1 rounded-md px-3 py-4 text-h4 font-semibold"
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={expanded === item.id}
                      aria-controls={`mnav-${item.id}`}
                      aria-label={item.label}
                      onClick={() => setExpanded((e) => (e === item.id ? null : item.id))}
                      className="focus-ring flex size-11 items-center justify-center rounded-full hover:bg-surface-sunken"
                    >
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          'size-5 transition-transform',
                          expanded === item.id && 'rotate-180',
                        )}
                      />
                    </button>
                  )}
                </div>
                {item.children.length > 0 && expanded === item.id && (
                  <ul id={`mnav-${item.id}`} className="grid pb-3 pl-3">
                    {item.children.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={c.href}
                          onClick={close}
                          className="focus-ring block rounded-md px-3 py-2.5 text-body text-fg-muted hover:text-fg"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border px-5 py-4">
          <Link
            href={accountHref}
            onClick={close}
            className="focus-ring inline-flex items-center gap-3 rounded-md py-2 text-body font-medium"
          >
            <CircleUserRound aria-hidden className="size-5" strokeWidth={1.75} />
            {t('header.account')}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
