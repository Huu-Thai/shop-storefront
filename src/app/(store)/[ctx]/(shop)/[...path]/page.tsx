import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { CategoryView, loadListing } from '@/components/catalog/category-view';
import { CmsPageView, PostView } from '@/components/content/content';
import { ProductView } from '@/components/product/product-view';
import { translator } from '@/i18n';
import { hasRefinements, parseQuery, SORTS } from '@/lib/catalog-query';
import { type Ctx, href } from '@/lib/routing';
import { languageAlternates } from '@/server/alternates';
import { requireCtx } from '@/server/ctx';
import { plainText } from '@/server/html';
import { absoluteUrl } from '@/server/site';
import {
  findCategory,
  getConfig,
  getPage,
  getPost,
  getPrefix,
  getProduct,
  resolvePath,
} from '@/server/storefront';
import { themeConfig } from '@/theme/config';

/**
 * Every catalog URL (`/men`, `/men/t-shirts`, `/classic-tee`) resolves through the shop's URL
 * rewrites. The route blocks until it knows what the path is, so unknown paths answer a real 404
 * and shop redirects a real 301 / 302 — what search engines need — instead of streaming a shell.
 * The data underneath is cached, so resolving is fast.
 */
export const instant = false;

type Params = { path: string[] };
type Search = Record<string, string | string[] | undefined>;

async function load(ctx: Ctx, segments: string[]) {
  const path = `/${segments.map((s) => decodeURIComponent(s)).join('/')}`;
  const [target, prefix] = await Promise.all([resolvePath(ctx, path), getPrefix(ctx)]);
  if (!target) notFound();
  if (target.redirectStatus && target.location) {
    const location = href(target.location, prefix);
    if (target.redirectStatus === 301) permanentRedirect(location);
    redirect(location);
  }
  // One URL per page: old or differently cased paths go to the canonical one.
  if (target.canonicalPath && target.canonicalPath !== path.slice(1))
    permanentRedirect(href(`/${target.canonicalPath}`, prefix));
  if (!target.id) notFound();
  return {
    target: { type: target.type, id: target.id },
    prefix,
    canonicalPath: target.canonicalPath ?? path.slice(1),
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const ctx = await requireCtx();
  const { target, prefix, canonicalPath } = await load(ctx, (await params).path);
  const canonical =
    absoluteUrl(href(`/${canonicalPath}`, prefix)) ?? href(`/${canonicalPath}`, prefix);
  const languages = await languageAlternates(ctx, target.type as never, target.id);
  if (target.type === 'PRODUCT') {
    const p = await getProduct(ctx, target.id);
    if (!p) return {};
    const description = p.metaDescription || plainText(p.shortDescription || p.description, 160);
    return {
      title: p.metaTitle || p.name,
      description,
      alternates: { canonical, languages },
      openGraph: {
        type: 'website',
        title: p.metaTitle || p.name,
        description,
        url: canonical,
        images: p.images
          .slice(0, 1)
          .map((i) => ({ url: i.url, width: i.width, height: i.height, alt: i.alt ?? p.name })),
      },
    };
  }
  if (target.type === 'CATEGORY') {
    const match = await findCategory(ctx, target.id);
    if (!match) return {};
    const query = parseQuery(await searchParams, 'category');
    const { node } = match;
    const config = await getConfig(ctx);
    const listing = config ? await loadListing(ctx, config, node.id, query) : null;
    const pastEnd = !!listing && query.page > listing.pages;
    const t = translator(ctx.locale);
    return {
      title: node.metaTitle || (query.page > 1 ? `${node.name} · ${query.page}` : node.name),
      description:
        node.metaDescription ||
        plainText(node.description, 160) ||
        t('catalog.metaDescription', {
          name: node.name,
          store: themeConfig.name,
          n: listing?.total ?? 0,
        }),
      alternates: {
        canonical:
          query.page > 1 && !hasRefinements(query) ? `${canonical}?page=${query.page}` : canonical,
      },
      // Filtered / sorted variants and pages past the end aren't pages for search engines.
      robots:
        hasRefinements(query) || query.q || query.sort !== SORTS.category[0] || pastEnd
          ? { index: false, follow: true }
          : undefined,
    };
  }
  if (target.type === 'CMS_PAGE' || target.type === 'CMS_POST') {
    const doc =
      target.type === 'CMS_PAGE' ? await getPage(ctx, target.id) : await getPost(ctx, target.id);
    if (!doc) return {};
    const description =
      doc.metaDescription ||
      plainText('excerpt' in doc && doc.excerpt ? doc.excerpt : doc.content, 160);
    const image = 'featuredImage' in doc ? doc.featuredImage : null;
    return {
      title: doc.metaTitle || doc.title,
      description,
      alternates: { canonical, languages },
      openGraph: {
        type: target.type === 'CMS_POST' ? 'article' : 'website',
        title: doc.metaTitle || doc.title,
        description,
        url: canonical,
        ...(image
          ? { images: [{ url: image.url, width: image.width, height: image.height }] }
          : {}),
        ...('publishedAt' in doc && doc.publishedAt ? { publishedTime: doc.publishedAt } : {}),
      },
    };
  }
  return {};
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const ctx = await requireCtx();
  const [{ target, prefix, canonicalPath }, config] = await Promise.all([
    load(ctx, (await params).path),
    getConfig(ctx),
  ]);
  if (!config) notFound();

  if (target.type === 'PRODUCT') {
    const product = await getProduct(ctx, target.id);
    if (!product) notFound();
    return <ProductView ctx={ctx} config={config} product={product} prefix={prefix} />;
  }
  if (target.type === 'CATEGORY') {
    const match = await findCategory(ctx, target.id);
    if (!match) notFound();
    return (
      <CategoryView
        ctx={ctx}
        config={config}
        match={match}
        prefix={prefix}
        query={parseQuery(await searchParams, 'category')}
        canonicalPath={canonicalPath}
      />
    );
  }
  if (target.type === 'CMS_PAGE' || target.type === 'CMS_POST') {
    const t = translator(ctx.locale);
    const to = (p: string) => href(p, prefix);
    if (target.type === 'CMS_PAGE') {
      const page = await getPage(ctx, target.id);
      if (!page) notFound();
      return <CmsPageView page={page} t={t} locale={ctx.locale} to={to} />;
    }
    const post = await getPost(ctx, target.id);
    if (!post) notFound();
    return <PostView post={post} t={t} locale={ctx.locale} to={to} />;
  }
  notFound();
}
