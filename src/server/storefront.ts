import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { ApiSearchQuery } from '@/lib/catalog-query';
import type { Ctx } from '@/lib/routing';
import { call, type Schemas, storeApi } from './api';
import { env } from './env';

/**
 * Cached catalog and content reads (Cache Components). Everything here is anonymous and keyed by
 * its arguments — the ctx (store, locale, currency) included — so one shopper's request warms the
 * page for everyone in that store. Tags let the shop's webhooks invalidate precisely
 * (src/server/revalidation.ts maps events to them):
 *   store:<code> config urls menus sliders banners categories category:<id> listings
 *   products product:<id> prices stock pages page:<id> posts post:<id> blocks
 */

export type StoreConfig = Schemas['StorefrontConfigDto'];
export type Menu = Schemas['StorefrontMenuDto'];
export type MenuItem = Schemas['StorefrontMenuItemDto'];
export type Slider = Schemas['StorefrontSliderDto'];
export type Banner = Schemas['StorefrontBannerDto'];
export type CategoryNode = Schemas['StorefrontCategoryNodeDto'];
export type ProductList = Schemas['StorefrontProductListDto'];
export type ProductCard = Schemas['StorefrontProductCardDto'];

export async function getConfig(ctx: Ctx): Promise<StoreConfig | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'config');
  return call(storeApi(ctx).GET('/api/v1/store/config'));
}

/** Public prefix of this store + locale on its own host (src/lib/routing.ts). */
export async function getPrefix(ctx: Ctx): Promise<string> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'config');
  const config = await getConfig(ctx);
  if (!config) return '';
  let base = '';
  if (config.store.baseUrl) {
    try {
      const p = new URL(config.store.baseUrl).pathname.replace(/^\/+|\/+$/g, '');
      base = p ? `/${p}` : '';
    } catch {
      base = '';
    }
  } else if (ctx.store !== env().DEFAULT_STORE) base = `/${ctx.store}`;
  const loc = ctx.locale === config.store.defaultLocale ? '' : `/${ctx.locale.toLowerCase()}`;
  return `${base}${loc}`;
}

export async function getMenu(ctx: Ctx, code: string): Promise<Menu | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'menus', `menu:${code}`);
  return call(storeApi(ctx).GET('/api/v1/store/menus/{code}', { params: { path: { code } } }));
}

export async function getSlider(ctx: Ctx, code: string): Promise<Slider | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'sliders', `slider:${code}`);
  return call(storeApi(ctx).GET('/api/v1/store/sliders/{code}', { params: { path: { code } } }));
}

export async function getBanners(ctx: Ctx, placement: string): Promise<Banner[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'banners', `banners:${placement}`);
  return (
    (await call(
      storeApi(ctx).GET('/api/v1/store/banners', { params: { query: { placement } } }),
    )) ?? []
  );
}

export async function getCategoryTree(ctx: Ctx): Promise<CategoryNode[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'categories');
  return (await call(storeApi(ctx).GET('/api/v1/store/categories'))) ?? [];
}

export async function getCategoryProducts(
  ctx: Ctx,
  id: string,
  opts: { limit?: number; page?: number; sort?: string; includeSubcategories?: boolean } = {},
): Promise<ProductList | null> {
  'use cache';
  // Prices and stock move during the day: a short life, refreshed in the background.
  cacheLife('minutes');
  cacheTag(`store:${ctx.store}`, 'listings', 'prices', 'stock', `category:${id}`);
  return call(
    storeApi(ctx).GET('/api/v1/store/categories/{id}/products', {
      params: {
        path: { id },
        query: {
          limit: opts.limit,
          page: opts.page,
          sort: opts.sort as never,
          includeSubcategories: opts.includeSubcategories,
        },
      },
    }),
  );
}

export type Product = Schemas['StorefrontProductDto'];
export type Variant = Schemas['StorefrontVariantDto'];
export type SearchResult = Schemas['StorefrontSearchResultDto'];
export type UrlResolution = Schemas['StorefrontUrlResolutionDto'];

/** What a storefront path is (category, product, page, redirect …); null when nothing is there. */
export async function resolvePath(ctx: Ctx, path: string): Promise<UrlResolution | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'urls');
  return call(storeApi(ctx).GET('/api/v1/store/url-resolver', { params: { query: { path } } }));
}

export async function getProduct(ctx: Ctx, id: string): Promise<Product | null> {
  'use cache';
  // Price and stock: short life, refreshed in the background.
  cacheLife('minutes');
  cacheTag(`store:${ctx.store}`, 'products', 'prices', 'stock', `product:${id}`);
  return call(storeApi(ctx).GET('/api/v1/store/products/{id}', { params: { path: { id } } }));
}

/**
 * Search and filtered listings. The query object is part of the cache key, so callers pass it
 * normalised (src/lib/catalog-query.ts) — the same filters in another order hit the same entry.
 */
export async function searchCatalog(ctx: Ctx, query: ApiSearchQuery): Promise<SearchResult | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag(
    `store:${ctx.store}`,
    'listings',
    'prices',
    'stock',
    ...(query.category ? [`category:${query.category}`] : []),
  );
  return call(storeApi(ctx).GET('/api/v1/store/search', { params: { query } }));
}

export interface CategoryMatch {
  node: CategoryNode;
  /** Root first, parent last. */
  ancestors: CategoryNode[];
}

/** A category node and the path of ancestors to it, from the cached tree. */
export async function findCategory(ctx: Ctx, id: string): Promise<CategoryMatch | null> {
  const walk = (nodes: CategoryNode[], trail: CategoryNode[]): CategoryMatch | null => {
    for (const n of nodes) {
      if (n.id === id) return { node: n, ancestors: trail };
      const hit = walk(n.children ?? [], [...trail, n]);
      if (hit) return hit;
    }
    return null;
  };
  return walk(await getCategoryTree(ctx), []);
}

export type CmsPage = Schemas['StorefrontPageDto'];
export type Post = Schemas['StorefrontPostDto'];
export type PostList = Schemas['StorefrontPostListDto'];
export type Region = Schemas['StorefrontRegionDto'];

export async function getPage(ctx: Ctx, id: string): Promise<CmsPage | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'pages', 'blocks', `page:${id}`);
  return call(storeApi(ctx).GET('/api/v1/store/pages/{id}', { params: { path: { id } } }));
}

export async function getPost(ctx: Ctx, id: string): Promise<Post | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'posts', 'blocks', `post:${id}`);
  return call(storeApi(ctx).GET('/api/v1/store/posts/{id}', { params: { path: { id } } }));
}

export async function listPosts(
  ctx: Ctx,
  opts: { page?: number; limit?: number; tag?: string } = {},
): Promise<PostList | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'posts');
  return call(
    storeApi(ctx).GET('/api/v1/store/posts', {
      params: { query: { page: opts.page, limit: opts.limit, tag: opts.tag, order: 'desc' } },
    }),
  );
}

/** Blocks placed on a category or product (Shop Admin → Content → Blocks → placements). */
export async function getPlacements(
  ctx: Ctx,
  targetType: 'CATEGORY' | 'PRODUCT' | 'PAGE' | 'POST',
  targetId: string,
): Promise<Region[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'blocks', `placements:${targetType}:${targetId}`);
  return (
    (await call(
      storeApi(ctx).GET('/api/v1/store/blocks/placements', {
        params: { query: { targetType, targetId } },
      }),
    )) ?? []
  );
}
