'use client';

import { useState } from 'react';
import { type ImageData, StoreImage } from '@/components/ui/store-image';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/cn';

/**
 * Product gallery. Phones: a full-width swipe carousel (scroll snap) with a counter. Desktop: the
 * large image with a thumbnail strip. The first image is the page's LCP and loads with priority.
 */
export function Gallery({ images, name }: { images: ImageData[]; name: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  if (!images.length)
    return (
      <StoreImage
        image={null}
        alt={name}
        priority
        className="aspect-[4/5] rounded-media"
        placeholderLabel={name}
      />
    );

  return (
    <section aria-label={t('product.images')}>
      {/* Phones and tablets: swipe */}
      <div className="relative lg:hidden">
        <ul
          className="-mx-[var(--gutter)] flex snap-x snap-mandatory scrollbar-none overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((img, i) => (
            <li key={img.url} className="w-full shrink-0 snap-center px-[var(--gutter)]">
              <StoreImage
                image={img}
                alt={
                  img.alt || `${name} — ${t('product.image', { n: i + 1, total: images.length })}`
                }
                priority={i === 0}
                sizes="100vw"
                className="aspect-[4/5] rounded-media"
              />
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <span className="tabular absolute right-[calc(var(--gutter)+12px)] bottom-3 rounded-full bg-surface/90 px-2.5 py-1 text-caption font-semibold">
            {mobileIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Desktop: large image + thumbnails */}
      <div className="hidden gap-4 lg:grid">
        <StoreImage
          image={current}
          alt={current.alt || name}
          priority={active === 0}
          sizes="(min-width: 1440px) 760px, 55vw"
          className="aspect-[4/5] rounded-media"
        />
        {images.length > 1 && (
          <ul className="grid grid-cols-6 gap-3">
            {images.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={t('product.image', { n: i + 1, total: images.length })}
                  aria-current={i === active ? 'true' : undefined}
                  className={cn(
                    'focus-ring block w-full overflow-hidden rounded-md ring-offset-2 ring-offset-bg',
                    i === active ? 'ring-2 ring-fg' : 'opacity-80 hover:opacity-100',
                  )}
                >
                  <StoreImage image={img} alt="" sizes="120px" className="aspect-[4/5]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
