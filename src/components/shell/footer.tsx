import { Link } from '@/components/intent-link';
import type { Translate } from '@/i18n';
import { themeConfig } from '@/theme/config';
import { Logo } from './logo';
import type { NavItem } from './nav-types';
import { Preferences } from './preferences';

function Column({ title, items }: { title: string; items: NavItem[] }) {
  if (!items.length) return null;
  return (
    <div className="grid content-start gap-4">
      <h2 className="text-h4 text-footer-fg">{title}</h2>
      <ul className="grid gap-2.5">
        {items.map((i) => (
          <li key={i.id}>
            <Link
              href={i.href}
              target={i.newTab ? '_blank' : undefined}
              rel={i.external ? 'noopener' : undefined}
              className="focus-ring rounded-xs text-small text-footer-muted hover:text-footer-fg"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Site footer (docs/STYLE-GUIDE.md §8): brand, shop and help links, store preferences, legal. */
export function Footer({
  shop,
  help,
  t,
  storeName,
  year,
}: {
  shop: NavItem[];
  help: NavItem[];
  t: Translate;
  storeName: string;
  /** From the cached shell data (reading the clock while rendering would make the page dynamic). */
  year: number;
}) {
  return (
    <footer className="bg-footer-bg text-footer-fg">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
        <div className="grid content-start gap-4">
          <Logo className="text-footer-fg" />
          <p className="max-w-xs text-small text-footer-muted">{t('brand.tagline')}</p>
          {themeConfig.social.length > 0 && (
            <ul className="flex gap-4">
              {themeConfig.social.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    rel="noopener"
                    className="focus-ring rounded-xs text-small text-footer-muted hover:text-footer-fg"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label={t('a11y.footerNav')} className="contents">
          <Column title={t('footer.shop')} items={shop} />
          <Column title={t('footer.help')} items={help} />
        </nav>
        <div className="grid content-start gap-4">
          <h2 className="text-h4 text-footer-fg">{t('footer.preferences')}</h2>
          <Preferences />
        </div>
      </div>
      <div className="border-t border-footer-border">
        <p className="container-page py-6 text-caption text-footer-muted">
          {t('footer.rights', { year, name: storeName })}
        </p>
      </div>
    </footer>
  );
}
