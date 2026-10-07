import { JsonLd } from '@/components/json-ld';
import { Link } from '@/components/intent-link';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { StoreImage } from '@/components/ui/store-image';
import type { Translate } from '@/i18n';
import { cn } from '@/lib/cn';
import { breadcrumbJsonLd } from '@/lib/seo';
import { cleanContent, plainText } from '@/server/html';
import { absoluteUrl } from '@/server/site';
import type { CmsPage, Post, PostList, Region } from '@/server/storefront';

/** Rich text from the shop's editor (sanitised again here — defence in depth). */
export function RichContent({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const clean = cleanContent(html);
  if (!clean) return null;
  return (
    <div className={cn('prose-store', className)} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}

/**
 * Block regions by name (Shop Admin → Content → Blocks → placements). `top` / `before` /
 * `header` render above the content, `sidebar` beside it, everything else below.
 */
export function regionsFor(
  regions: Region[] | null | undefined,
  where: 'top' | 'sidebar' | 'bottom',
) {
  const group = (name: string) =>
    /^(top|before|header|above)/i.test(name)
      ? 'top'
      : /^(sidebar|aside|side)/i.test(name)
        ? 'sidebar'
        : 'bottom';
  return (regions ?? []).filter((r) => group(r.region) === where && r.blocks.length);
}

export function Regions({
  regions,
  where,
  className,
}: {
  regions: Region[] | null | undefined;
  where: 'top' | 'sidebar' | 'bottom';
  className?: string;
}) {
  const list = regionsFor(regions, where);
  if (!list.length) return null;
  return (
    <div className={cn('grid gap-6', className)}>
      {list.flatMap((r) =>
        r.blocks.map((b) => (
          <section
            key={`${r.region}-${b.identifier}`}
            aria-label={b.title || undefined}
            data-region={r.region}
            className="grid gap-3"
          >
            <RichContent html={b.content} />
          </section>
        )),
      )}
    </div>
  );
}

const date = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(iso));

/** CMS page: title, content, block regions; `full-width` layout drops the reading width. */
export function CmsPageView({
  page,
  t,
  locale,
  to,
}: {
  page: CmsPage;
  t: Translate;
  locale: string;
  to: (p: string) => string;
}) {
  const sidebar = regionsFor(page.regions, 'sidebar').length > 0;
  const wide = page.layout === 'full-width' || page.layout === 'wide';
  return (
    <article className="container-page pt-8 pb-[var(--section-y)] md:pt-12">
      <Breadcrumbs
        items={[{ label: t('nav.home'), href: to('/') }, { label: page.title }]}
        label={t('a11y.breadcrumbs')}
      />
      <header className={cn('mt-6 mb-8 grid gap-3', !wide && 'max-w-3xl')}>
        <h1 className="text-h1">{page.title}</h1>
        {page.updatedAt && (
          <p className="text-small text-fg-muted">
            {t('blog.updated', { date: date(locale, page.updatedAt) })}
          </p>
        )}
      </header>
      <Regions regions={page.regions} where="top" className="mb-8" />
      <div className={cn('grid gap-10', sidebar && 'lg:grid-cols-[minmax(0,1fr)_300px]')}>
        <RichContent
          html={page.content}
          className={cn('text-body-lg text-fg-muted', !wide && 'max-w-3xl')}
        />
        {sidebar && (
          <Regions
            regions={page.regions}
            where="sidebar"
            className="content-start rounded-card bg-surface-muted p-6"
          />
        )}
      </div>
      <Regions regions={page.regions} where="bottom" className="mt-12" />
    </article>
  );
}

const minutes = (html: string | null | undefined) =>
  Math.max(1, Math.round(plainText(html, 100_000).split(' ').length / 220));

/** Blog post: featured image, title, date, reading time, tags, content, regions. */
export function PostView({
  post,
  t,
  locale,
  to,
}: {
  post: Post;
  t: Translate;
  locale: string;
  to: (p: string) => string;
}) {
  const url = absoluteUrl(to(`/${post.urlPath}`));
  return (
    <article className="pt-8 pb-[var(--section-y)] md:pt-12">
      {url && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.publishedAt,
            url,
            ...(post.featuredImage ? { image: [post.featuredImage.url] } : {}),
            ...(post.excerpt ? { description: plainText(post.excerpt, 300) } : {}),
          }}
        />
      )}
      {url && absoluteUrl('/') && (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: t('blog.title'), url: absoluteUrl(to('/blog'))! },
            { name: post.title, url },
          ])}
        />
      )}
      <div className="container-page">
        <Breadcrumbs
          items={[
            { label: t('nav.home'), href: to('/') },
            { label: t('blog.title'), href: to('/blog') },
            { label: post.title },
          ]}
          label={t('a11y.breadcrumbs')}
        />
        <header className="mx-auto mt-8 grid max-w-3xl gap-4 text-center">
          <p className="text-overline font-semibold text-fg-muted uppercase">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{date(locale, post.publishedAt)}</time>
            )}{' '}
            · {t('blog.minutes', { n: minutes(post.content) })}
          </p>
          <h1 className="text-h1">{post.title}</h1>
          {post.excerpt && (
            <p className="text-body-lg text-fg-muted">{plainText(post.excerpt, 400)}</p>
          )}
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2" aria-label={t('blog.tags')}>
              {post.tags.map((tag) => (
                <li key={tag.code}>
                  <Link
                    href={`${to('/blog')}?tag=${encodeURIComponent(tag.code)}`}
                    className="focus-ring rounded-full"
                  >
                    <Badge tone="outline">{tag.name}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </header>
      </div>
      {post.featuredImage && (
        <div className="container-page mt-10">
          <StoreImage
            image={post.featuredImage}
            alt={post.featuredImage.alt ?? ''}
            priority
            sizes="(min-width: 1400px) 1320px, 100vw"
            className="aspect-[16/9] rounded-xl"
          />
        </div>
      )}
      <div className="container-page mt-10">
        <Regions regions={post.regions} where="top" className="mx-auto mb-8 max-w-3xl" />
        <RichContent html={post.content} className="mx-auto max-w-3xl text-body-lg text-fg-muted" />
        <Regions regions={post.regions} where="bottom" className="mx-auto mt-12 max-w-3xl" />
        <p className="mx-auto mt-12 max-w-3xl border-t border-border pt-6">
          <Link
            href={to('/blog')}
            className="focus-ring rounded-xs font-semibold underline underline-offset-4"
          >
            ← {t('blog.back')}
          </Link>
        </p>
      </div>
    </article>
  );
}

/** Blog card: 3:2 image (or ink panel), date, title, excerpt. */
export function PostCard({
  post,
  t,
  locale,
  to,
  priority,
}: {
  post: PostList['data'][number];
  t: Translate;
  locale: string;
  to: (p: string) => string;
  priority?: boolean;
}) {
  return (
    <article className="group relative grid content-start gap-4">
      {post.featuredImage ? (
        <StoreImage
          image={post.featuredImage}
          alt=""
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="aspect-[3/2] rounded-media"
        />
      ) : (
        <div aria-hidden className="flex aspect-[3/2] items-end rounded-media bg-hero-bg p-5">
          <span className="size-10 rounded-full bg-accent" />
        </div>
      )}
      <div className="grid gap-2">
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="text-caption font-medium text-fg-muted">
            {date(locale, post.publishedAt)}
          </time>
        )}
        <h2 className="text-h4">
          <Link
            href={to(`/${post.urlPath}`)}
            className="focus-ring rounded-xs group-hover:underline after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 text-small text-fg-muted">{plainText(post.excerpt, 240)}</p>
        )}
        <span aria-hidden className="text-small font-semibold">
          {t('blog.read')} →
        </span>
      </div>
    </article>
  );
}
