import 'server-only';
import { type Ctx, href } from '@/lib/routing';
import { absoluteUrl } from './site';
import { findCategory, getConfig, getPage, getPost, getPrefix, getProduct } from './storefront';

type Kind = 'PRODUCT' | 'CATEGORY' | 'CMS_PAGE' | 'CMS_POST';

/**
 * hreflang alternates: the same product / category / page / post in each language of the store
 * (slugs differ per language, so each locale's URL is looked up — all cached). Needs SITE_URL.
 */
export async function languageAlternates(
  ctx: Ctx,
  kind: Kind,
  id: string,
): Promise<Record<string, string> | undefined> {
  if (!absoluteUrl('/')) return undefined;
  const config = await getConfig(ctx);
  if (!config || config.locales.length < 2) return undefined;
  const entries = await Promise.all(
    config.locales.map(async (l) => {
      const lctx = { ...ctx, locale: l.code };
      const path =
        kind === 'PRODUCT'
          ? await getProduct(lctx, id).then((p) => p && (p.urlPath ?? p.slug))
          : kind === 'CATEGORY'
            ? await findCategory(lctx, id).then((c) => c?.node.urlPath)
            : kind === 'CMS_PAGE'
              ? await getPage(lctx, id).then((p) => p?.urlPath)
              : await getPost(lctx, id).then((p) => p?.urlPath);
      if (!path) return null;
      return [l.code, absoluteUrl(href(`/${path}`, await getPrefix(lctx)))!] as const;
    }),
  );
  const languages: Record<string, string> = Object.fromEntries(entries.filter((e) => !!e));
  const def = languages[config.store.defaultLocale];
  if (def) languages['x-default'] = def;
  return Object.keys(languages).length > 1 ? languages : undefined;
}
