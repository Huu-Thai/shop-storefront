/** Sitemap XML (sitemaps.org). Pure; tested. */

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export interface SitemapUrl {
  loc: string;
  lastmod?: string | null;
}

export function urlset(urls: SitemapUrl[]): string {
  const seen = new Set<string>();
  const body = urls
    .filter((u) => (seen.has(u.loc) ? false : (seen.add(u.loc), true)))
    .map(
      (u) =>
        `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(new Date(u.lastmod).toISOString())}</lastmod>` : ''}</url>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndex(locs: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
    .map((l) => `<sitemap><loc>${esc(l)}</loc></sitemap>`)
    .join('')}</sitemapindex>`;
}

/** `us-en.en-US.xml` ↔ store + locale. */
export const sitemapFile = (store: string, locale: string) => `${store}.${locale}.xml`;
export function parseSitemapFile(file: string): { store: string; locale: string } | null {
  const m = /^([a-z][a-z0-9_-]{0,63})\.([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)\.xml$/.exec(file);
  return m ? { store: m[1], locale: m[2] } : null;
}
