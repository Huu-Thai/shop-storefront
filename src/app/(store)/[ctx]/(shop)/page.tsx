import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HeroSlider } from '@/components/home/hero-slider';
import { CategoryTiles, Perks, ProductRail, PromoBanners } from '@/components/home/sections';
import { translator } from '@/i18n';
import { href } from '@/lib/routing';
import { requireCtx } from '@/server/ctx';
import {
  getBanners,
  getCategoryProducts,
  getCategoryTree,
  getConfig,
  getPrefix,
  getSlider,
} from '@/server/storefront';
import { themeConfig } from '@/theme/config';

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await requireCtx();
  const config = await getConfig(ctx);
  const tagline = translator(ctx.locale)('brand.tagline');
  return {
    title: { absolute: `${themeConfig.name} — ${tagline}` },
    description: tagline,
    openGraph: { siteName: themeConfig.name, title: themeConfig.name, locale: config?.locale },
  };
}

/**
 * Home: hero slider, promotional banners, categories, a product rail, service promises. All data
 * is cached per store / locale / currency, so the page is served from the static shell.
 */
export default async function HomePage() {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const [prefix, slider, banners, tree] = await Promise.all([
    getPrefix(ctx),
    getSlider(ctx, themeConfig.home.slider),
    getBanners(ctx, themeConfig.home.heroBanner),
    getCategoryTree(ctx),
  ]);
  const to = (path: string) => href(path, prefix);
  const top = tree.filter((c) => c.includeInMenu !== false);
  const featured = top[0];
  const rail = featured
    ? await getCategoryProducts(ctx, featured.id, {
        limit: themeConfig.home.productRailLimit,
        includeSubcategories: true,
      })
    : null;

  const slides = slider?.slides.length
    ? slider.slides.map((s) => ({
        id: s.id,
        title: s.title ?? themeConfig.name,
        caption: s.caption,
        ctaLabel: s.ctaLabel ?? t('home.shopNow'),
        href: s.linkUrl ? to(s.linkUrl) : null,
        image: s.image,
      }))
    : [
        {
          id: 'brand',
          title: t('brand.tagline'),
          ctaLabel: t('home.shopNow'),
          href: featured ? to(`/${featured.urlPath}`) : null,
        },
      ];

  return (
    <>
      {/* Separate hydration boundaries keep main-thread tasks short (see layout). */}
      <Suspense>
        <HeroSlider slides={slides} autoplayMs={slider?.autoplayMs ?? 6000} />
      </Suspense>
      <PromoBanners
        t={t}
        promos={banners
          .filter((b) => b.title)
          .map((b) => ({
            id: b.id,
            title: b.title!,
            subtitle: b.subtitle,
            ctaLabel: b.ctaLabel,
            href: b.linkUrl ? to(b.linkUrl) : null,
            image: b.image,
          }))}
      />
      <CategoryTiles
        t={t}
        categories={top.map((c) => ({
          id: c.id,
          name: c.name,
          href: to(`/${c.urlPath}`),
          image: c.image,
        }))}
      />
      {featured && rail && (
        <ProductRail
          t={t}
          title={t('home.newIn')}
          description={t('home.newInBody', { category: featured.name })}
          viewAll={{ label: t('home.viewAll'), href: to(`/${featured.urlPath}`) }}
          products={rail.data}
          hrefFor={(p) => to(`/${p.urlPath ?? p.slug}`)}
        />
      )}
      <Perks t={t} />
    </>
  );
}
