'use client';

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Link } from '@/components/intent-link';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { type ImageData, StoreImage } from '@/components/ui/store-image';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

export interface HeroSlide {
  id: string;
  eyebrow?: string | null;
  title: string;
  caption?: string | null;
  ctaLabel: string;
  href?: string | null;
  image?: ImageData | null;
}

/**
 * Home hero (docs/STYLE-GUIDE.md §8): a carousel of the shop's "home" slider. Accessible carousel
 * pattern — pause control (WCAG 2.2.2), slide labels, arrows and dots, no autoplay with reduced
 * motion, pauses while hovered or focused. Slides without an image get the ink panel treatment.
 */
export function HeroSlider({
  slides,
  autoplayMs = 6000,
}: {
  slides: HeroSlide[];
  autoplayMs?: number;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  // The shopper's own pause / play choice; reduced motion pauses by default (and before hydration).
  const [choice, setChoice] = useState<boolean | null>(null);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => matchMedia(REDUCED).matches,
    () => true,
  );
  const playing = choice ?? !reduced;
  const setPlaying = (f: (p: boolean) => boolean) => setChoice(f(playing));
  const [held, setHeld] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  useEffect(() => {
    if (!playing || held || count < 2 || !autoplayMs) return;
    const id = setTimeout(() => go(index + 1), autoplayMs);
    return () => clearTimeout(id);
  }, [playing, held, index, count, autoplayMs, go]);

  if (!count) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label={slides[0].title}
      className="container-page pt-4 md:pt-6"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
    >
      <div className="relative isolate overflow-hidden rounded-xl bg-hero-bg text-hero-fg">
        <div aria-live={playing && !held ? 'off' : 'polite'}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={t('a11y.slide', { n: i + 1, total: count })}
              hidden={i !== index}
              className="relative grid min-h-[min(78svh,620px)] items-end md:min-h-[min(70svh,640px)]"
            >
              {s.image ? (
                <>
                  <StoreImage
                    image={s.image}
                    alt=""
                    priority={i === 0}
                    sizes="(min-width: 1400px) 1320px, 100vw"
                    className="absolute inset-0 -z-10"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/25 to-transparent md:bg-gradient-to-r md:from-black/65 md:via-black/25"
                  />
                </>
              ) : (
                <InkBackdrop seed={i} />
              )}
              <div className="grid max-w-3xl gap-5 p-6 pb-20 sm:p-10 sm:pb-24 lg:p-16 lg:pb-24">
                {s.eyebrow && (
                  <p className="text-overline font-semibold text-hero-muted uppercase">
                    {s.eyebrow}
                  </p>
                )}
                {i === 0 ? (
                  <h1 className="text-display">{s.title}</h1>
                ) : (
                  <h2 className="text-display">{s.title}</h2>
                )}
                {s.caption && <p className="max-w-xl text-body-lg text-hero-muted">{s.caption}</p>}
                {s.href && (
                  <div>
                    <Link
                      href={s.href}
                      tabIndex={i === index ? undefined : -1}
                      className={cn(buttonVariants({ variant: 'inverse', size: 'lg' }))}
                    >
                      {s.ctaLabel}
                      <ArrowRight aria-hidden />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {count > 1 && (
          <div className="absolute right-4 bottom-4 left-6 flex items-center justify-between gap-4 sm:right-6 sm:left-10 lg:left-16">
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={t('a11y.slide', { n: i + 1, total: count })}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => go(i)}
                  className="focus-ring group flex h-11 items-center"
                >
                  <span
                    className={cn(
                      'block h-1 rounded-full transition-all duration-300',
                      i === index
                        ? 'w-8 bg-hero-fg'
                        : 'w-4 bg-hero-fg/35 group-hover:bg-hero-fg/60',
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? t('a11y.pause') : t('a11y.play')}
                className="focus-ring flex size-11 items-center justify-center rounded-full hover:bg-white/10"
              >
                {playing ? (
                  <Pause aria-hidden className="size-4" />
                ) : (
                  <Play aria-hidden className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label={t('a11y.prevSlide')}
                className="focus-ring flex size-11 items-center justify-center rounded-full border border-hero-fg/25 hover:border-hero-fg"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label={t('a11y.nextSlide')}
                className="focus-ring flex size-11 items-center justify-center rounded-full border border-hero-fg/25 hover:border-hero-fg"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Decorative backdrop for image-less slides: accent glow and a fine grid, on the hero ink. */
function InkBackdrop({ seed }: { seed: number }) {
  const right = seed % 2 === 0;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className={cn(
          // A radial gradient, not a blurred circle: the same soft glow without a costly paint filter.
          'absolute -top-1/3 size-[min(110vw,900px)] bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-25',
          right ? '-right-1/4' : '-left-1/4',
        )}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 70% 30%, black, transparent 70%)',
        }}
      />
      {/* Top right, clear of the bottom-aligned text and controls (white on the accent would fail
          contrast). */}
      <div
        className={cn(
          'absolute top-0 hidden size-[min(36vw,400px)] -translate-y-1/3 rounded-full border-[36px] border-accent/85 md:block',
          right ? 'right-[6%]' : 'right-[18%]',
        )}
      />
    </div>
  );
}
