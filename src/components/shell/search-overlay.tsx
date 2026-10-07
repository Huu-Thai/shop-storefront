'use client';

import { ArrowRight, Search, X } from 'lucide-react';
import { Dialog as D } from 'radix-ui';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useReturnFocus } from '@/components/ui/use-return-focus';
import { useI18n } from '@/i18n/client';
import { sf } from '@/lib/cart-client';
import { cn } from '@/lib/cn';
import { useHref, useStore } from '../store/store-context';

interface Suggestion {
  id: string;
  name: string;
  urlPath: string | null;
}

/** Highlights the typed text inside a suggestion. */
function Mark({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Search overlay: a combobox (WAI-ARIA pattern) with product suggestions from the shop as you type
 * (from 2 characters, debounced). ↑ ↓ move, Enter opens the highlighted product or the full results,
 * Esc closes and returns focus to the search button.
 */
export default function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const store = useStore();
  const to = useHref();
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const last = useRef('');
  const onCloseAutoFocus = useReturnFocus();

  const term = q.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const id = setTimeout(async () => {
      last.current = term;
      try {
        const res = await sf<Suggestion[]>(
          store.ctx,
          `search/suggest?q=${encodeURIComponent(term)}&limit=6`,
        );
        if (last.current === term) {
          setItems(res);
          setActive(-1);
        }
      } catch {
        if (last.current === term) setItems([]);
      }
    }, 180);
    return () => clearTimeout(id);
  }, [term, store.ctx]);

  const shown = term.length >= 2 ? items : [];
  const options = [
    ...shown.map((s) => ({ key: s.id, href: to(`/${s.urlPath ?? ''}`), label: s.name })),
    ...(term
      ? [{ key: 'all', href: `${to('/search')}?q=${encodeURIComponent(term)}`, label: '' }]
      : []),
  ];
  const navigate = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === 'Enter' && term) {
      e.preventDefault();
      navigate(options[active]?.href ?? `${to('/search')}?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="animate-fade fixed inset-0 z-50 bg-overlay" />
        <D.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="animate-pop fixed inset-x-0 top-0 z-50 bg-surface shadow-lg"
        >
          <D.Title className="sr-only">{t('search.title')}</D.Title>
          <D.Description className="sr-only">{t('search.label')}</D.Description>
          <div className="container-page grid gap-4 py-4 md:py-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-muted"
                />
                <input
                  autoFocus
                  type="search"
                  role="combobox"
                  aria-label={t('search.label')}
                  aria-expanded={options.length > 0}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                  enterKeyHint="search"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setActive(-1);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder={t('header.searchPlaceholder')}
                  className="focus-ring h-13 w-full rounded-button border border-border-strong bg-surface pr-4 pl-12 text-body placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
              <D.Close
                aria-label={t('a11y.close')}
                className="focus-ring flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-sunken"
              >
                <X aria-hidden className="size-5" />
              </D.Close>
            </div>
            <ul
              id={listId}
              role="listbox"
              aria-label={t('search.suggestions')}
              className={cn('grid gap-0.5', !options.length && 'hidden')}
            >
              {options.map((o, i) => (
                <li
                  key={o.key}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigate(o.href)}
                  className={cn(
                    'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md px-4 text-body',
                    i === active && 'bg-surface-sunken',
                    o.key === 'all' && 'font-semibold',
                  )}
                >
                  {o.key === 'all' ? (
                    t('search.seeAll', { q: term })
                  ) : (
                    <span>
                      <Mark text={o.label} q={term} />
                    </span>
                  )}
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-fg-muted" />
                </li>
              ))}
            </ul>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
