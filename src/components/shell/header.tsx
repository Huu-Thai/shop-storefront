import { Link } from '@/components/intent-link';
import type { Translate } from '@/i18n';
import { AccountLink } from './account-link';
import { CartButton } from './cart-button';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';
import { SearchButton } from './search-button';
import type { NavItem } from './nav-types';

const iconLink =
  'focus-ring flex size-11 items-center justify-center rounded-full hover:bg-surface-sunken';

/**
 * Sticky header (docs/STYLE-GUIDE.md §8): logo, the CMS "main" menu, search, account and cart.
 * Phones: menu button | logo | search · cart; the menu drawer holds navigation and account.
 * Cached with the page — nothing personal renders here on the server (the cart badge is client).
 */
export function Header({
  nav,
  homeHref,
  prefixHref,
  t,
  storeName,
}: {
  nav: NavItem[];
  homeHref: string;
  prefixHref: (path: string) => string;
  t: Translate;
  storeName: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header-bg text-header-fg backdrop-blur-md backdrop-saturate-150">
      <div className="container-page flex h-[var(--header-height)] items-center gap-2 lg:gap-8">
        <div className="flex flex-1 items-center lg:hidden">
          <MobileNav nav={nav} accountHref={prefixHref('/account')} />
        </div>
        <Link
          href={homeHref}
          aria-label={t('a11y.home', { name: storeName })}
          className="focus-ring rounded-xs"
        >
          <Logo />
        </Link>
        <nav aria-label={t('a11y.mainNav')} className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.id} className="group relative">
                <Link
                  href={item.href}
                  target={item.newTab ? '_blank' : undefined}
                  rel={item.external ? 'noopener' : undefined}
                  className="focus-ring inline-flex h-11 items-center rounded-full px-4 text-body font-medium hover:bg-surface-sunken"
                >
                  {item.label}
                </Link>
                {item.children.length > 0 && (
                  <div className="invisible absolute top-full left-0 z-10 min-w-56 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="grid gap-0.5 rounded-lg border border-border bg-surface p-2 shadow-md">
                      {item.children.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={c.href}
                            className="focus-ring block rounded-md px-3 py-2 text-small text-fg hover:bg-surface-sunken"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-0.5 lg:flex-none">
          <SearchButton />
          <AccountLink className={`${iconLink} hidden lg:flex`} />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
