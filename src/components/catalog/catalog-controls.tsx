'use client';

import { Check, SlidersHorizontal, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  createContext,
  type FormEvent,
  type ReactNode,
  useContext,
  useOptimistic,
  useState,
  useTransition,
} from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/i18n/client';
import { type CatalogQuery, hasRefinements, SORTS, toSearchParams } from '@/lib/catalog-query';
import { cn } from '@/lib/cn';

export interface Facet {
  code: string;
  label: string;
  values: { value: string; label: string; count: number; swatch?: string | null }[];
}

export interface PriceInfo {
  /** Currency symbol of the store's default currency (price filters are in it). */
  symbol: string;
  min?: number;
  max?: number;
}

type Kind = keyof typeof SORTS;

interface CatalogCtx {
  query: CatalogQuery;
  kind: Kind;
  pending: boolean;
  /** Navigate to the listing with a new query (page resets unless given). */
  go: (next: CatalogQuery) => void;
}

const Ctx = createContext<CatalogCtx | null>(null);
const useCatalog = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('catalog controls outside <CatalogProvider>');
  return v;
};

/**
 * Filters, sort and paging live in the URL (shareable, crawlable, back-button friendly). Changes
 * navigate in a transition so the current results stay visible, dimmed, until the new ones arrive.
 */
export function CatalogProvider({
  query,
  kind,
  children,
}: {
  query: CatalogQuery;
  kind: Kind;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Controls reflect the shopper's choice immediately; results follow when the page arrives.
  const [optimistic, setOptimistic] = useOptimistic(query);
  const go = (next: CatalogQuery) => {
    const qs = toSearchParams(next, kind).toString();
    start(() => {
      setOptimistic(next);
      router.push(`${window.location.pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  };
  return <Ctx.Provider value={{ query: optimistic, kind, pending, go }}>{children}</Ctx.Provider>;
}

/** The result grid: dimmed and marked busy while a new query loads. */
export function Results({ children }: { children: ReactNode }) {
  const { pending } = useCatalog();
  return (
    <div
      aria-busy={pending || undefined}
      className={cn('transition-opacity duration-200', pending && 'pointer-events-none opacity-50')}
    >
      {children}
    </div>
  );
}

export function SortSelect() {
  const { t } = useI18n();
  const { query, kind, go } = useCatalog();
  return (
    <label className="flex items-center gap-2 text-small">
      <span className="hidden text-fg-muted sm:inline">{t('catalog.sort')}</span>
      <span className="relative">
        <select
          aria-label={t('catalog.sort')}
          className="focus-ring h-11 appearance-none rounded-button border border-border-strong bg-surface pr-10 pl-4 text-small font-medium hover:border-fg"
          value={query.sort}
          onChange={(e) => go({ ...query, sort: e.target.value, page: 1 })}
        >
          {SORTS[kind].map((s) => (
            <option key={s} value={s}>
              {t(`catalog.sort.${s}` as 'catalog.sort.featured')}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-fg-muted"
        >
          <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </span>
    </label>
  );
}

const countActive = (q: CatalogQuery) =>
  Object.values(q.filters).reduce((n, v) => n + v.length, 0) +
  (q.priceMin !== undefined || q.priceMax !== undefined ? 1 : 0) +
  (q.inStock ? 1 : 0);

const FilterDrawer = dynamic(() => import('./filter-drawer'), { ssr: false });

/** Phones and tablets: opens the filter panel in a drawer (loaded on first use). */
export function FiltersButton({
  facets,
  price,
  total,
}: {
  facets: Facet[];
  price?: PriceInfo;
  total: number;
}) {
  const { t } = useI18n();
  const catalog = useCatalog();
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const n = countActive(catalog.query);
  if (!facets.length && !price) return null;
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={() => void import('./filter-drawer')}
        onClick={() => {
          setUsed(true);
          setOpen(true);
        }}
        className="focus-ring inline-flex h-11 items-center gap-2 rounded-button border border-border-strong bg-surface px-4 text-small font-medium hover:border-fg lg:hidden"
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        {n ? t('catalog.filtersCount', { n }) : t('catalog.filters')}
      </button>
      {used && (
        <Ctx.Provider value={catalog}>
          <FilterDrawer open={open} onOpenChange={setOpen} total={total}>
            <FilterPanel facets={facets} price={price} />
          </FilterDrawer>
        </Ctx.Provider>
      )}
    </>
  );
}

/** Facets (checkbox lists, colour swatches), price range and availability. */
export function FilterPanel({ facets, price }: { facets: Facet[]; price?: PriceInfo }) {
  const { t } = useI18n();
  const { query, go } = useCatalog();
  const toggle = (code: string, value: string) => {
    const current = query.filters[code] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value].sort();
    const filters = { ...query.filters, [code]: next };
    if (!next.length) delete filters[code];
    go({ ...query, filters, page: 1 });
  };
  const applyPrice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(data.get(k) ?? '').trim();
      return v && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : undefined;
    };
    go({ ...query, priceMin: num('min'), priceMax: num('max'), page: 1 });
  };

  return (
    <div className="grid gap-8">
      {facets.map((f) => {
        const swatches = f.values.some((v) => v.swatch);
        return (
          <fieldset key={f.code} className="grid gap-3">
            <legend className="mb-3 text-small font-semibold">{f.label}</legend>
            <ul className={cn(swatches ? 'grid grid-cols-1 gap-1' : 'grid gap-1')}>
              {f.values.map((v) => {
                const on = query.filters[f.code]?.includes(v.value) ?? false;
                return (
                  <li key={v.value}>
                    <label className="group flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-small hover:bg-surface-sunken">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={on}
                        onChange={() => toggle(f.code, v.value)}
                      />
                      {v.swatch ? (
                        <span
                          aria-hidden
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border border-border-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                            on && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                          )}
                          style={{ background: v.swatch }}
                        />
                      ) : (
                        <span
                          aria-hidden
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-sm border border-border-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                            on && 'border-primary bg-primary text-primary-fg',
                          )}
                        >
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                      )}
                      <span className="flex-1">{v.label}</span>
                      <span className="tabular text-caption text-fg-muted">{v.count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}

      {price && (
        <fieldset>
          <legend className="mb-3 text-small font-semibold">{t('catalog.price')}</legend>
          <form
            onSubmit={applyPrice}
            className="grid gap-3"
            key={`${query.priceMin}-${query.priceMax}`}
          >
            <div className="grid grid-cols-2 gap-2">
              {(['min', 'max'] as const).map((k) => (
                <label key={k} className="relative">
                  <span className="sr-only">
                    {t(k === 'min' ? 'catalog.priceMin' : 'catalog.priceMax')}
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-small text-fg-muted"
                  >
                    {price.symbol}
                  </span>
                  <input
                    name={k}
                    inputMode="decimal"
                    defaultValue={(k === 'min' ? query.priceMin : query.priceMax) ?? ''}
                    placeholder={String((k === 'min' ? price.min : price.max) ?? '')}
                    className="focus-ring tabular h-11 w-full rounded-control border border-border-strong bg-surface pr-2 pl-8 text-body placeholder:text-fg-subtle"
                  />
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="focus-ring h-10 rounded-button border border-border-strong text-small font-semibold hover:border-fg"
            >
              {t('catalog.apply')}
            </button>
          </form>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-small font-semibold">{t('catalog.availability')}</legend>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-small">
          {t('catalog.inStock')}
          <input
            type="checkbox"
            role="switch"
            checked={query.inStock}
            onChange={(e) => go({ ...query, inStock: e.target.checked, page: 1 })}
            className="focus-ring peer relative h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full bg-border-strong transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:bg-surface before:shadow-xs before:transition-transform checked:bg-primary checked:before:translate-x-4"
          />
        </label>
      </fieldset>
    </div>
  );
}

/** Removable chips for every active filter, plus "Clear all". */
export function ActiveFilters({ facets, price }: { facets: Facet[]; price?: PriceInfo }) {
  const { t } = useI18n();
  const { query, go, pending } = useCatalog();
  if (!hasRefinements(query)) return pending ? <Spinner className="size-5" /> : null;
  const chips: { key: string; label: string; remove: () => void }[] = [];
  for (const [code, values] of Object.entries(query.filters)) {
    const facet = facets.find((f) => f.code === code);
    for (const v of values) {
      const label = facet?.values.find((x) => x.value === v)?.label ?? v;
      chips.push({
        key: `${code}:${v}`,
        label: facet ? `${facet.label}: ${label}` : label,
        remove: () => {
          const rest = values.filter((x) => x !== v);
          const filters = { ...query.filters, [code]: rest };
          if (!rest.length) delete filters[code];
          go({ ...query, filters, page: 1 });
        },
      });
    }
  }
  if (query.priceMin !== undefined || query.priceMax !== undefined)
    chips.push({
      key: 'price',
      label: `${t('catalog.price')}: ${price?.symbol ?? ''}${query.priceMin ?? 0} – ${query.priceMax !== undefined ? `${price?.symbol ?? ''}${query.priceMax}` : '∞'}`,
      remove: () => go({ ...query, priceMin: undefined, priceMax: undefined, page: 1 }),
    });
  if (query.inStock)
    chips.push({
      key: 'stock',
      label: t('catalog.inStock'),
      remove: () => go({ ...query, inStock: false, page: 1 }),
    });
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.remove}
            aria-label={t('catalog.removeFilter', { label: c.label })}
            className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-sunken pr-2.5 pl-3.5 text-small hover:bg-border"
          >
            {c.label}
            <X aria-hidden className="size-3.5" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() =>
            go({
              ...query,
              filters: {},
              priceMin: undefined,
              priceMax: undefined,
              inStock: false,
              page: 1,
            })
          }
          className="focus-ring h-9 rounded-xs px-2 text-small font-medium underline underline-offset-4 hover:decoration-2"
        >
          {t('catalog.clearAll')}
        </button>
      </li>
    </ul>
  );
}
