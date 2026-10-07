'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/client';
import { CURRENCY_COOKIE, MODE_STORAGE, PREFERENCE_MAX_AGE } from '@/lib/preferences';
import { useStore } from '../store/store-context';

const select =
  'focus-ring h-11 w-full appearance-none rounded-control border border-footer-border bg-transparent pr-9 pl-3 text-small text-footer-fg';

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-footer-muted"
    >
      <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

const subscribeMode = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
};

/**
 * Store, language, currency and colour mode (footer). Store and language are URLs; the currency is
 * a cookie the proxy reads, so changing it reloads the page in the new currency.
 */
export function Preferences() {
  const { t } = useI18n();
  const s = useStore();
  const dark = useSyncExternalStore(
    subscribeMode,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );

  const currentLocaleHref = s.locales.find((l) => l.code === s.locale)?.href;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {s.stores.length > 1 && (
        <label className="grid gap-1.5 text-caption text-footer-muted">
          {t('footer.store')}
          <span className="relative">
            <select
              className={select}
              value={s.store}
              onChange={(e) => {
                const target = s.stores.find((x) => x.code === e.target.value);
                if (target) window.location.assign(target.href);
              }}
            >
              {s.stores.map((x) => (
                <option key={x.code} value={x.code} className="text-ink-900">
                  {x.name}
                </option>
              ))}
            </select>
            <Chevron />
          </span>
        </label>
      )}
      {s.locales.length > 1 && (
        <label className="grid gap-1.5 text-caption text-footer-muted">
          {t('footer.language')}
          <span className="relative">
            <select
              className={select}
              value={s.locale}
              onChange={(e) => {
                const target = s.locales.find((l) => l.code === e.target.value);
                if (!target || target.href === currentLocaleHref) return;
                // Same page in the other language: swap the prefix, keep the path. Read at click time
                // (a pathname hook would make every cached page wait for the request).
                const { pathname, search } = window.location;
                const rest =
                  s.prefix && pathname.startsWith(s.prefix)
                    ? pathname.slice(s.prefix.length)
                    : pathname;
                window.location.assign(`${target.href}${rest === '/' ? '' : rest}${search}` || '/');
              }}
            >
              {s.locales.map((l) => (
                <option key={l.code} value={l.code} lang={l.code} className="text-ink-900">
                  {l.name}
                </option>
              ))}
            </select>
            <Chevron />
          </span>
        </label>
      )}
      {s.currencies.length > 1 && (
        <label className="grid gap-1.5 text-caption text-footer-muted">
          {t('footer.currency')}
          <span className="relative">
            <select
              className={select}
              value={s.currency}
              onChange={(e) => {
                document.cookie = `${CURRENCY_COOKIE}=${e.target.value}; Path=/; Max-Age=${PREFERENCE_MAX_AGE}; SameSite=Lax`;
                window.location.reload();
              }}
            >
              {s.currencies.map((c) => (
                <option key={c.code} value={c.code} className="text-ink-900">
                  {`${c.code} · ${c.symbol}`}
                </option>
              ))}
            </select>
            <Chevron />
          </span>
        </label>
      )}
      <div className="grid gap-1.5 text-caption text-footer-muted">
        {t('footer.appearance')}
        <div role="group" aria-label={t('footer.appearance')} className="flex gap-2">
          {(['light', 'dark'] as const).map((mode) => {
            const active = (mode === 'dark') === dark;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  document.documentElement.classList.toggle('dark', mode === 'dark');
                  try {
                    localStorage.setItem(MODE_STORAGE, mode);
                  } catch {}
                }}
                className={`focus-ring inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-control border text-small ${active ? 'border-footer-fg text-footer-fg' : 'border-footer-border text-footer-muted hover:text-footer-fg'}`}
              >
                {mode === 'dark' ? (
                  <Moon aria-hidden className="size-4" />
                ) : (
                  <Sun aria-hidden className="size-4" />
                )}
                {t(mode === 'dark' ? 'footer.dark' : 'footer.light')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
