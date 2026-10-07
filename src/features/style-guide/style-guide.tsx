'use client';

import { ArrowRight, Heart, Moon, Search, ShoppingBag, Sun, Truck } from 'lucide-react';
import { type ReactNode, useState, useSyncExternalStore } from 'react';
import { Logo } from '@/components/shell/logo';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Pagination } from '@/components/ui/pagination';
import { Price } from '@/components/ui/price';
import { ProductCard, ProductCardSkeleton } from '@/components/ui/product-card';
import { Quantity } from '@/components/ui/quantity';
import { SectionHeading } from '@/components/ui/section-heading';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { AccentSwitch } from '@/components/shell/accent-switch';
import { MODE_STORAGE } from '@/lib/preferences';
import { contrast, over, parseColor } from '@/theme/contrast';
import {
  accentScale,
  commerceTokens,
  contrastPairs,
  inkScale,
  radii,
  regionTokens,
  semanticTokens,
  shadows,
  shapeTokens,
  spacing,
  statusTokens,
  typeScale,
} from '@/theme/tokens';

const SECTIONS = [
  ['principles', 'Principles'],
  ['colour', 'Colour'],
  ['contrast', 'Contrast'],
  ['type', 'Typography'],
  ['layout', 'Layout & spacing'],
  ['shape', 'Shape & elevation'],
  ['components', 'Components'],
  ['commerce', 'Commerce'],
  ['regions', 'Regions'],
  ['icons', 'Icons & motion'],
] as const;

const subscribeHtml = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
  return () => obs.disconnect();
};
const useHtml = <T,>(read: () => T, server: T) =>
  useSyncExternalStore(subscribeHtml, read, () => server);

function ThemeSwitch() {
  const dark = useHtml(() => document.documentElement.classList.contains('dark'), false);
  return (
    <div className="flex items-center gap-2">
      <AccentSwitch label="Accent preset" />
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Toggle colour mode"
        onClick={() => {
          const next = !document.documentElement.classList.contains('dark');
          document.documentElement.classList.toggle('dark', next);
          try {
            localStorage.setItem(MODE_STORAGE, next ? 'dark' : 'light');
          } catch {}
        }}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>
    </div>
  );
}

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="grid scroll-mt-24 gap-8 border-t border-border pt-12"
    >
      <div className="grid max-w-3xl gap-2">
        <h2 id={`${id}-title`} className="text-h2">
          {title}
        </h2>
        {lead && <p className="text-body-lg text-fg-muted">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-4">
      <h3 className="text-overline font-semibold text-fg-muted uppercase">{title}</h3>
      {children}
    </div>
  );
}

function Swatch({ token, label, note }: { token: string; label?: string; note?: string }) {
  // Re-read on every mode / preset change (useHtml subscribes to <html> attributes).
  const value = useHtml(
    () => getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim(),
    '',
  );
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="h-16 border-b border-border" style={{ background: `var(--${token})` }} />
      <div className="grid gap-0.5 px-3 py-2.5">
        <p className="text-small font-medium">{label ?? token}</p>
        <p className="font-mono text-caption text-fg-muted">{value || '—'}</p>
        {note && <p className="text-caption text-fg-muted">{note}</p>}
      </div>
    </div>
  );
}

/** Ratios for every pair in the current mode / preset, as a string (a stable snapshot). */
function measure(): string {
  const cs = getComputedStyle(document.documentElement);
  const get = (t: string) => parseColor(cs.getPropertyValue(`--${t}`).trim());
  const surface = get('surface') ?? [255, 255, 255, 1];
  return contrastPairs
    .map((p) => {
      const bg = get(p.bg);
      const fg = get(p.fg);
      if (!bg || !fg) return '0';
      const back = over(bg, surface);
      return contrast(over(fg, back), back).toFixed(2);
    })
    .join(',');
}

function ContrastTable() {
  const measured = useHtml(measure, '');
  const rows = measured
    ? measured.split(',').map((r, i) => ({ ratio: +r, ok: +r >= contrastPairs[i].min }))
    : [];
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-small">
        <thead className="bg-surface-muted text-caption text-fg-muted uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Sample</th>
            <th className="px-4 py-3 font-semibold">Pair</th>
            <th className="px-4 py-3 font-semibold">Use</th>
            <th className="px-4 py-3 text-right font-semibold">Ratio</th>
            <th className="px-4 py-3 text-right font-semibold">Min</th>
          </tr>
        </thead>
        <tbody>
          {contrastPairs.map((p, i) => (
            <tr key={`${p.fg}-${p.bg}`} className="border-t border-border">
              <td className="px-4 py-2.5">
                <span
                  aria-hidden
                  className="inline-flex h-8 w-14 items-center justify-center rounded-sm border border-border font-semibold"
                  style={{ background: `var(--${p.bg})`, color: `var(--${p.fg})` }}
                >
                  {p.min >= 4.5 ? (
                    'Aa'
                  ) : (
                    <span
                      className="h-1 w-8 rounded-full"
                      style={{ background: `var(--${p.fg})` }}
                    />
                  )}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-caption">
                --{p.fg} / --{p.bg}
              </td>
              <td className="px-4 py-2.5 text-fg-muted">{p.use}</td>
              <td className="tabular px-4 py-2.5 text-right font-semibold">
                {rows[i] ? (
                  <span className={rows[i].ok ? 'text-success-fg' : 'text-danger-fg'}>
                    {rows[i].ratio.toFixed(2)}
                  </span>
                ) : (
                  '…'
                )}
              </td>
              <td className="tabular px-4 py-2.5 text-right text-fg-muted">{p.min}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Full class names (Tailwind only generates classes it can see as whole strings). */
const TYPE_CLASS: Record<string, string> = {
  display: 'text-display font-display font-semibold',
  h1: 'text-h1 font-display font-semibold',
  h2: 'text-h2 font-display font-semibold',
  h3: 'text-h3 font-display font-semibold',
  h4: 'text-h4 font-display font-semibold',
  'body-lg': 'text-body-lg',
  body: 'text-body',
  small: 'text-small',
  caption: 'text-caption font-medium',
  overline: 'text-overline font-semibold uppercase',
};

const labels = { sale: 'Sale', soldOut: 'Sold out', from: 'From', was: 'Was', now: 'Now' };
const demoPrice = (amount: number, compareAt?: number) => ({
  amount,
  formatted: `$${(amount / 100).toFixed(2)}`,
  compareAt: compareAt ?? null,
  compareAtFormatted: compareAt ? `$${(compareAt / 100).toFixed(2)}` : null,
});

export function StyleGuide() {
  const [qty, setQty] = useState(1);
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-header-bg backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-2 sm:gap-4">
          <span className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-small text-fg-muted sm:inline">Style guide</span>
          </span>
          <ThemeSwitch />
        </div>
      </header>

      <div className="container-page grid grid-cols-1 gap-10 py-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Style guide" className="hidden lg:block">
          <ul className="sticky top-24 grid gap-0.5">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="focus-ring block rounded-md px-3 py-1.5 text-small text-fg-muted hover:bg-surface-sunken hover:text-fg"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="grid min-w-0 gap-16">
          <div className="grid gap-4">
            <Badge tone="outline" className="justify-self-start">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </Badge>
            <h1 className="text-display">Ink Store design system</h1>
            <p className="max-w-3xl text-body-lg text-fg-muted">
              Tokens, type, layout and components for the storefront. Built on the Ink scale from
              the base colour <code className="font-mono">#191919</code> shared with Shop Admin,
              light-first and product-led. Every layout in the theme is composed from what is on
              this page; the written spec lives in{' '}
              <code className="font-mono">docs/STYLE-GUIDE.md</code>. Switch the accent preset and
              colour mode at the top right — everything below follows.
            </p>
          </div>

          <Section id="principles" title="Principles">
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  'Product first',
                  'Monochrome chrome so photography carries the colour. The accent appears sparingly: highlights, “new”, active states.',
                ],
                [
                  'One primary action',
                  'Each view has one black primary button (add to cart, checkout). Everything else is secondary or a link.',
                ],
                [
                  'Readable everywhere',
                  '16 px body, 44 px touch targets, WCAG 2.2 AA contrast in both modes and every preset — checked by tests.',
                ],
                [
                  'Fast by default',
                  'Server-rendered and cached per store; images come in the right size; motion is short and honours reduced motion.',
                ],
              ].map(([title, body]) => (
                <li
                  key={title}
                  className="grid content-start gap-2 rounded-card bg-surface-muted p-6"
                >
                  <h3 className="font-sans text-body font-semibold">{title}</h3>
                  <p className="text-small text-fg-muted">{body}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="colour"
            title="Colour"
            lead="Components use semantic and role tokens only; presets swap the accent scale, dark mode the semantic layer."
          >
            <Sub title="Ink — neutral scale">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
                {inkScale.map((s) => (
                  <Swatch
                    key={s}
                    token={`ink-${s}`}
                    note={s === '900' ? 'Base colour' : undefined}
                  />
                ))}
              </div>
            </Sub>
            <Sub title="Accent (preset)">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {accentScale.map((s) => (
                  <Swatch key={s} token={`accent-${s}`} />
                ))}
              </div>
            </Sub>
            <Sub title="Semantic">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {semanticTokens.map((s) => (
                  <Swatch key={s.token} token={s.token} note={s.role} />
                ))}
              </div>
            </Sub>
            <Sub title="Commerce">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {commerceTokens.map((s) => (
                  <Swatch key={s.token} token={s.token} note={s.role} />
                ))}
              </div>
            </Sub>
            <Sub title="Status">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {statusTokens.map((s) => (
                  <div
                    key={s}
                    className="rounded-lg px-4 py-3 text-small font-medium capitalize"
                    style={{ background: `var(--${s}-soft)`, color: `var(--${s}-fg)` }}
                  >
                    {s} —{' '}
                    <span className="font-mono text-caption">
                      --{s}-fg on --{s}-soft
                    </span>
                  </div>
                ))}
              </div>
            </Sub>
          </Section>

          <Section
            id="contrast"
            title="Contrast"
            lead="Measured live for the current mode and preset. The same pairs are tested for every preset in both modes by src/theme/tokens.test.ts."
          >
            <ContrastTable />
          </Section>

          <Section
            id="type"
            title="Typography"
            lead="Inter (variable) for text and headings; headings use tighter tracking. Headings scale fluidly between 360 px and 1440 px wide; body text stays 16 px so phones never zoom."
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-left text-small">
                <thead className="bg-surface-muted text-caption text-fg-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Token</th>
                    <th className="px-4 py-3 font-semibold">Sample</th>
                    <th className="px-4 py-3 text-right font-semibold">360 → 1440 px</th>
                    <th className="px-4 py-3 font-semibold">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map((t) => (
                    <tr key={t.name} className="border-t border-border align-middle">
                      <td className="px-4 py-3 font-mono text-caption">text-{t.name}</td>
                      <td className="px-4 py-3">
                        <span className={TYPE_CLASS[t.name]}>
                          {t.name === 'display' ? 'Made to last' : 'Everyday essentials'}
                        </span>
                      </td>
                      <td className="tabular px-4 py-3 text-right whitespace-nowrap text-fg-muted">
                        {t.min === t.max ? `${t.min}` : `${t.min} → ${t.max}`} / {t.line}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{t.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="layout"
            title="Layout & spacing"
            lead="A 4 px grid. Content sits in a 1320 px container with a responsive gutter; sections are separated by a responsive rhythm."
          >
            <Sub title="Spacing scale (px)">
              <div className="flex flex-wrap items-end gap-4">
                {spacing.map((s) => (
                  <div key={s} className="grid justify-items-center gap-1.5">
                    <div className="w-6 rounded-xs bg-accent" style={{ height: s }} />
                    <span className="tabular text-caption text-fg-muted">{s}</span>
                  </div>
                ))}
              </div>
            </Sub>
            <Sub title="Breakpoints and grid">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-left text-small">
                  <thead className="bg-surface-muted text-caption text-fg-muted uppercase">
                    <tr>
                      {['Width', 'Gutter', 'Section rhythm', 'Product grid', 'Header'].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {[
                      ['< 768 px (phone)', '16', '48', '2 columns, 12 gap', '64, menu drawer'],
                      [
                        '768 – 1279 (tablet)',
                        '24',
                        '64',
                        '3 columns, 24 gap',
                        '64, menu drawer < 1024',
                      ],
                      ['≥ 1280 (desktop)', '40', '96', '4 columns, 24 gap', '72, inline menu'],
                    ].map((r) => (
                      <tr key={r[0]} className="border-t border-border">
                        {r.map((c, i) => (
                          <td key={i} className={cn('px-4 py-3', i && 'text-fg-muted')}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sub>
            <Sub title="Product grid">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'aspect-[4/5] rounded-media bg-accent-soft',
                      i === 3 && 'hidden xl:block',
                      i === 2 && 'hidden md:block',
                    )}
                  />
                ))}
              </div>
            </Sub>
          </Section>

          <Section
            id="shape"
            title="Shape & elevation"
            lead="Soft by default: pill buttons, 10 px controls, 16 px cards. Change the four shape tokens to make the whole theme square."
          >
            <Sub title="Shape tokens">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {shapeTokens.map((s) => (
                  <div key={s} className="grid gap-2">
                    <div
                      className="h-20 border-2 border-fg bg-surface-muted"
                      style={{ borderRadius: `var(--${s})` }}
                    />
                    <p className="font-mono text-caption">--{s}</p>
                  </div>
                ))}
              </div>
            </Sub>
            <Sub title="Radius scale">
              <div className="flex flex-wrap gap-4">
                {radii.map((r) => (
                  <div key={r} className="grid justify-items-center gap-2">
                    <div
                      className="size-16 border-2 border-fg"
                      style={{ borderRadius: `var(--radius-${r})` }}
                    />
                    <span className="font-mono text-caption">{r}</span>
                  </div>
                ))}
              </div>
            </Sub>
            <Sub title="Shadows">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {shadows.map((s) => (
                  <div
                    key={s}
                    className="grid h-24 place-items-center rounded-card bg-surface text-small"
                    style={{ boxShadow: `var(--shadow-${s})` }}
                  >
                    shadow-{s}
                  </div>
                ))}
              </div>
            </Sub>
          </Section>

          <Section id="components" title="Components">
            <Sub title="Buttons — 36 / 44 / 52 px">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Add to cart</Button>
                <Button variant="secondary">Save for later</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="accent">Join the club</Button>
                <Button variant="link">View size guide</Button>
                <Button loading>Adding</Button>
                <Button disabled>Sold out</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">
                  Checkout <ArrowRight />
                </Button>
                <Button size="icon" variant="secondary" aria-label="Add to wishlist">
                  <Heart />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Search">
                  <Search />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-card bg-hero-bg p-6">
                <Button variant="inverse">Shop now</Button>
                <Button variant="inverse-outline">Explore</Button>
              </div>
            </Sub>
            <Sub title="Badges">
              <div className="flex flex-wrap gap-2">
                <Badge tone="sale">Sale −20%</Badge>
                <Badge tone="new">New</Badge>
                <Badge tone="inverse">Sold out</Badge>
                <Badge>Limited</Badge>
                <Badge tone="success">In stock</Badge>
                <Badge tone="warning">Only 2 left</Badge>
                <Badge tone="danger">Payment failed</Badge>
                <Badge tone="outline">XL</Badge>
              </div>
            </Sub>
            <Sub title="Form controls — 48 px, 16 px text">
              <div className="grid max-w-3xl gap-5 md:grid-cols-2">
                <Field id="sg-email" label="E-mail" hint="For your order confirmation." required>
                  <Input
                    id="sg-email"
                    type="email"
                    placeholder="you@example.com"
                    aria-describedby="sg-email-hint"
                  />
                </Field>
                <Field id="sg-zip" label="Postcode" error="Enter a valid postcode.">
                  <Input
                    id="sg-zip"
                    defaultValue="ABC"
                    aria-invalid
                    aria-describedby="sg-zip-error"
                  />
                </Field>
                <Field id="sg-country" label="Country">
                  <Select id="sg-country" defaultValue="US">
                    <option value="US">United States</option>
                    <option value="VN">Việt Nam</option>
                  </Select>
                </Field>
                <div className="grid content-start gap-2">
                  <span className="text-small font-medium">Quantity</span>
                  <Quantity value={qty} onChange={setQty} label="Quantity" />
                </div>
              </div>
            </Sub>
            <Sub title="Notices">
              <div className="grid max-w-3xl gap-3">
                <Notice tone="success" title="Added to your cart" />
                <Notice tone="warning" title="Only 2 left">
                  Order soon to get it this week.
                </Notice>
                <Notice tone="danger" title="The coupon WELCOME10 has expired" />
                <Notice tone="info">Free shipping on orders over $50.</Notice>
              </div>
            </Sub>
            <Sub title="Section heading">
              <SectionHeading
                eyebrow="Autumn edit"
                title="New in"
                description="Fresh picks for the season."
                action={{ label: 'View all', href: '#components' }}
              />
            </Sub>
            <Sub title="Breadcrumbs">
              <Breadcrumbs
                label="Breadcrumb"
                items={[
                  { label: 'Home', href: '#components' },
                  { label: 'Men', href: '#components' },
                  { label: 'Classic Tee' },
                ]}
              />
            </Sub>
            <Sub title="Pagination — crawlable ?page= links">
              <Pagination
                page={5}
                pages={10}
                hrefFor={() => '#components'}
                labels={{
                  nav: 'Pagination',
                  previous: 'Previous page',
                  next: 'Next page',
                  page: (n) => `Page ${n}`,
                }}
              />
            </Sub>
            <Sub title="Filter chips and options">
              <div className="flex flex-wrap items-center gap-2">
                {['Colour: Black', 'Size: M', 'In stock only'].map((c) => (
                  <span
                    key={c}
                    className="inline-flex h-9 items-center rounded-full bg-surface-sunken px-3.5 text-small"
                  >
                    {c} ×
                  </span>
                ))}
                <span className="text-small font-medium underline underline-offset-4">
                  Clear all
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['#212121', '#fafafa', '#d32f2f'].map((c, i) => (
                  <span
                    key={c}
                    className={cn(
                      'size-11 rounded-full p-1',
                      i === 0 && 'ring-2 ring-fg ring-offset-2 ring-offset-bg',
                    )}
                  >
                    <span
                      className="block size-full rounded-full border border-border-strong"
                      style={{ background: c }}
                    />
                  </span>
                ))}
                {['S', 'M', 'L'].map((v, i) => (
                  <span
                    key={v}
                    className={cn(
                      'flex h-11 min-w-14 items-center justify-center rounded-control border px-4 text-small font-medium',
                      i === 1
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-border-strong',
                      i === 2 && 'text-fg-muted line-through',
                    )}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </Sub>

            <Sub title="Drawer">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" className="justify-self-start">
                    <ShoppingBag /> Open cart drawer
                  </Button>
                </SheetTrigger>
                <SheetContent
                  title="Your cart"
                  description="2 items"
                  footer={
                    <Button block size="lg">
                      Checkout
                    </Button>
                  }
                >
                  <p className="p-5 text-fg-muted">Cart lines render here (Phase 2).</p>
                </SheetContent>
              </Sheet>
            </Sub>
          </Section>

          <Section
            id="commerce"
            title="Commerce"
            lead="Prices arrive formatted by the shop (currency, locale, tax mode). Product cards use a 4:5 image well; without a photo they show a calm placeholder of the same shape."
          >
            <Sub title="Prices">
              <div className="grid gap-3">
                <Price price={demoPrice(2500)} labels={labels} />
                <Price price={demoPrice(2500, 3000)} labels={labels} />
                <Price price={demoPrice(2500)} from labels={labels} />
                <Price price={demoPrice(12900, 15900)} size="lg" labels={labels} />
              </div>
            </Sub>
            <Sub title="Product cards">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
                <li>
                  <ProductCard
                    href="#commerce"
                    labels={labels}
                    product={{
                      id: '1',
                      name: 'Classic Tee',
                      type: 'CONFIGURABLE',
                      price: demoPrice(2500, 3000),
                      inStock: true,
                    }}
                  />
                </li>
                <li>
                  <ProductCard
                    href="#commerce"
                    labels={labels}
                    product={{
                      id: '2',
                      name: 'Everyday Socks (3-pack)',
                      price: demoPrice(1200),
                      inStock: true,
                    }}
                  />
                </li>
                <li>
                  <ProductCard
                    href="#commerce"
                    labels={labels}
                    product={{
                      id: '3',
                      name: 'Weekend Set — a long product name that wraps to two lines and stops',
                      type: 'BUNDLE',
                      price: demoPrice(4500),
                      inStock: false,
                    }}
                  />
                </li>
                <li>
                  <ProductCardSkeleton />
                </li>
              </ul>
            </Sub>
          </Section>

          <Section
            id="regions"
            title="Regions"
            lead="Page regions have their own role tokens so a buyer can, for example, make the footer light or the announcement bar the accent colour without touching components."
          >
            <div className="grid gap-3">
              {regionTokens.map((r) => (
                <div
                  key={r.region}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-5 py-4"
                  style={{ background: `var(--${r.bg})`, color: `var(--${r.fg})` }}
                >
                  <span className="font-semibold">{r.region}</span>
                  <span className="font-mono text-caption opacity-80">
                    --{r.fg} / --{r.bg}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="icons"
            title="Icons & motion"
            lead="Lucide icons, 1.75 stroke: 16 px in text, 20 px in buttons, 22–24 px in the header. Motion is 120–320 ms with an emphasised ease, and is switched off with reduced motion."
          >
            <div className="flex flex-wrap items-end gap-8">
              {[16, 20, 24].map((s) => (
                <div key={s} className="grid justify-items-center gap-2">
                  <div className="flex gap-3">
                    <Search style={{ width: s, height: s }} strokeWidth={1.75} aria-hidden />
                    <ShoppingBag style={{ width: s, height: s }} strokeWidth={1.75} aria-hidden />
                    <Heart style={{ width: s, height: s }} strokeWidth={1.75} aria-hidden />
                    <Truck style={{ width: s, height: s }} strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="text-caption text-fg-muted">{s} px</span>
                </div>
              ))}
              <div className="grid gap-1 text-small text-fg-muted">
                <span>
                  <code className="font-mono">--duration-fast</code> 120 ms — hovers, presses
                </span>
                <span>
                  <code className="font-mono">--duration-base</code> 200 ms — popovers, fades
                </span>
                <span>
                  <code className="font-mono">--duration-slow</code> 320 ms — drawers
                </span>
              </div>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
