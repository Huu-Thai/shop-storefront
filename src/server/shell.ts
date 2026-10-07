import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { NavItem } from '@/components/shell/nav-types';
import { type Ctx, encodeCtx, href } from '@/lib/routing';
import { themeConfig } from '@/theme/config';
import { getStoreLinks } from './stores';
import {
  type CategoryNode,
  getCategoryTree,
  getConfig,
  getMenu,
  getPrefix,
  type MenuItem,
} from './storefront';

const isExternal = (url: string) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url);

export function menuToNav(items: MenuItem[], prefix: string): NavItem[] {
  return items.map((i) => ({
    id: i.id,
    label: i.label,
    href: href(i.url || '/', prefix),
    external: isExternal(i.url ?? ''),
    newTab: i.openInNewTab,
    children: menuToNav(i.children ?? [], prefix),
  }));
}

export function categoriesToNav(nodes: CategoryNode[], prefix: string, depth = 1): NavItem[] {
  return nodes
    .filter((c) => c.includeInMenu !== false)
    .map((c) => ({
      id: c.id,
      label: c.name,
      href: href(`/${c.urlPath}`, prefix),
      external: false,
      newTab: false,
      children: depth > 1 ? categoriesToNav(c.children ?? [], prefix, depth - 1) : [],
    }));
}

/**
 * Everything the layout needs, in one cached call per store / locale / currency: store info for
 * the client, header and footer navigation, switcher links. Falls back to the category tree when
 * the store has no "main" menu yet.
 */
export async function getShell(ctx: Ctx) {
  'use cache';
  cacheLife('hours');
  cacheTag(`store:${ctx.store}`, 'menus', 'categories', 'config');
  const [config, prefix, main, footer, tree, stores] = await Promise.all([
    getConfig(ctx),
    getPrefix(ctx),
    getMenu(ctx, themeConfig.menus.main),
    getMenu(ctx, themeConfig.menus.footer),
    getCategoryTree(ctx),
    getStoreLinks(),
  ]);
  if (!config) return null;
  const localeHrefs = await Promise.all(
    config.locales.map(async (l) => ({
      code: l.code,
      name: l.name,
      href: await getPrefix({ ...ctx, locale: l.code }),
    })),
  );
  return {
    config,
    prefix,
    nav: main?.items.length ? menuToNav(main.items, prefix) : categoriesToNav(tree, prefix, 2),
    shopLinks: categoriesToNav(tree, prefix),
    helpLinks: footer ? menuToNav(footer.items, prefix) : [],
    store: {
      ctx: encodeCtx(ctx),
      store: ctx.store,
      storeName: config.store.name,
      locale: ctx.locale,
      currency: ctx.currency,
      prefix,
      locales: localeHrefs,
      currencies: config.currencies.map((c) => ({ code: c.code, name: c.name, symbol: c.symbol })),
      stores,
    },
    year: new Date().getFullYear(),
  };
}
