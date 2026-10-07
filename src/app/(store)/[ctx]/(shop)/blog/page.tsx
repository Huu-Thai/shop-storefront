import type { Metadata } from 'next';
import { PostCard } from '@/components/content/content';
import { Link } from '@/components/intent-link';
import { Pagination } from '@/components/ui/pagination';
import { translator } from '@/i18n';
import { cn } from '@/lib/cn';
import { href } from '@/lib/routing';
import { requireCtx } from '@/server/ctx';
import { absoluteUrl } from '@/server/site';
import { getPrefix, listPosts } from '@/server/storefront';

/** Reads the page and tag from the query string. */
export const instant = false;

const PER_PAGE = 12;
type Search = Promise<{ page?: string; tag?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const { tag, page } = await searchParams;
  const prefix = await getPrefix(ctx);
  const base = href('/blog', prefix);
  return {
    title: t('blog.title'),
    description: t('blog.body'),
    alternates: { canonical: absoluteUrl(base) ?? base },
    // Tag filters and later pages are variations of the index.
    robots: tag || (page && page !== '1') ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogPage({ searchParams }: { searchParams: Search }) {
  const ctx = await requireCtx();
  const t = translator(ctx.locale);
  const { tag, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const prefix = await getPrefix(ctx);
  const to = (p: string) => href(p, prefix);
  const list = await listPosts(ctx, { page, limit: PER_PAGE, tag: tag || undefined });
  const posts = list?.data ?? [];
  const pages = Math.max(1, Math.ceil((list?.total ?? 0) / PER_PAGE));
  const tags = [...new Map(posts.flatMap((p) => p.tags).map((x) => [x.code, x])).values()];
  const tagName = tag ? (tags.find((x) => x.code === tag)?.name ?? tag) : null;
  return (
    <div className="container-page pt-8 pb-[var(--section-y)] md:pt-12">
      <header className="grid max-w-2xl gap-3">
        <h1 className="text-h1">
          {tagName ? t('blog.tagged', { tag: tagName }) : t('blog.title')}
        </h1>
        <p className="text-body-lg text-fg-muted">{t('blog.body')}</p>
      </header>
      {(tags.length > 0 || tag) && (
        <nav
          aria-label={t('blog.tags')}
          className="-mx-[var(--gutter)] mt-6 scrollbar-none overflow-x-auto px-[var(--gutter)]"
        >
          <ul className="flex gap-2">
            <li>
              <Link
                href={to('/blog')}
                aria-current={!tag ? 'page' : undefined}
                className={cn(
                  'focus-ring inline-flex h-10 items-center rounded-full border px-4 text-small font-medium whitespace-nowrap',
                  !tag
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-border-strong hover:border-fg',
                )}
              >
                {t('blog.all')}
              </Link>
            </li>
            {tags.map((x) => (
              <li key={x.code}>
                <Link
                  href={`${to('/blog')}?tag=${encodeURIComponent(x.code)}`}
                  aria-current={tag === x.code ? 'page' : undefined}
                  className={cn(
                    'focus-ring inline-flex h-10 items-center rounded-full border px-4 text-small font-medium whitespace-nowrap',
                    tag === x.code
                      ? 'border-primary bg-primary text-primary-fg'
                      : 'border-border-strong hover:border-fg',
                  )}
                >
                  {x.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {posts.length ? (
        <ul className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <li key={p.id}>
              <PostCard post={p} t={t} locale={ctx.locale} to={to} priority={i === 0} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 grid justify-items-center gap-2 rounded-card bg-surface-muted px-6 py-16 text-center">
          <h2 className="text-h3">{t('blog.empty')}</h2>
          <p className="text-fg-muted">{t('blog.emptyBody')}</p>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination
            page={page}
            pages={pages}
            hrefFor={(n) =>
              `${to('/blog')}?${new URLSearchParams({ ...(tag ? { tag } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`
            }
            labels={{
              nav: t('pager.nav'),
              previous: t('pager.previous'),
              next: t('pager.next'),
              page: (n) => t('pager.page', { n }),
            }}
          />
        </div>
      )}
    </div>
  );
}
