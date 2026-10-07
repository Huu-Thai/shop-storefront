import { describe, expect, it } from 'vitest';
import { parseSitemapFile, sitemapFile, sitemapIndex, urlset } from './sitemap-xml';

describe('sitemap XML', () => {
  it('escapes, de-duplicates and dates URLs', () => {
    const xml = urlset([
      { loc: 'https://shop.test/a?x=1&y=2' },
      { loc: 'https://shop.test/a?x=1&y=2' },
      { loc: 'https://shop.test/b', lastmod: '2026-10-01T10:00:00Z' },
    ]);
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://shop.test/a?x=1&amp;y=2</loc>');
    expect(xml).toContain('<lastmod>2026-10-01T10:00:00.000Z</lastmod>');
  });
  it('indexes per-store files', () => {
    expect(sitemapIndex(['https://s/sitemaps/us-en.en-US.xml'])).toContain(
      '<sitemap><loc>https://s/sitemaps/us-en.en-US.xml</loc></sitemap>',
    );
    expect(parseSitemapFile(sitemapFile('vn-vi', 'vi-VN'))).toEqual({
      store: 'vn-vi',
      locale: 'vi-VN',
    });
    expect(parseSitemapFile('../etc/passwd')).toBeNull();
  });
});
