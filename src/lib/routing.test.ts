import { describe, expect, it } from 'vitest';
import {
  decodeCtx,
  encodeCtx,
  href,
  isCatalogPath,
  prefixFor,
  resolve,
  type RoutingTable,
} from './routing';

const table: RoutingTable = {
  defaultStore: 'us-en',
  stores: [
    {
      code: 'us-en',
      name: 'US-EN',
      website: 'us',
      baseUrl: null,
      defaultLocale: 'en-US',
      locales: ['en-US'],
      defaultCurrency: 'USD',
      currencies: ['USD'],
    },
    {
      code: 'vn-vi',
      name: 'VN-VI',
      website: 'vn',
      baseUrl: null,
      defaultLocale: 'vi-VN',
      locales: ['vi-VN', 'en-US'],
      defaultCurrency: 'VND',
      currencies: ['VND', 'USD'],
    },
    {
      code: 'uk',
      name: 'UK',
      website: 'us',
      baseUrl: 'https://shop.example.co.uk/',
      defaultLocale: 'en-GB',
      locales: ['en-GB'],
      defaultCurrency: 'GBP',
      currencies: ['GBP'],
    },
    {
      code: 'de',
      name: 'DE',
      website: 'us',
      baseUrl: 'https://shop.example.com/de/',
      defaultLocale: 'de-DE',
      locales: ['de-DE'],
      defaultCurrency: 'EUR',
      currencies: ['EUR'],
    },
  ],
};

describe('ctx segment', () => {
  it('round-trips', () => {
    const c = { store: 'vn-vi', locale: 'en-US', currency: 'USD' };
    expect(encodeCtx(c)).toBe('vn-vi.en-US.USD');
    expect(decodeCtx('vn-vi.en-US.USD')).toEqual(c);
  });
  it.each([
    '',
    'x',
    'us-en.en-US',
    'US.en-US.USD',
    'us-en.en_US.USD',
    'us-en.en-US.usd',
    'a.b.c.d',
  ])('refuses %j', (v) => expect(decodeCtx(v)).toBeNull());
});

describe('resolve', () => {
  it('serves the default store at the root', () => {
    expect(resolve(table, 'shop.example.com', '/men/t-shirts')).toEqual({
      ctx: { store: 'us-en', locale: 'en-US', currency: 'USD' },
      prefix: '',
      rest: '/men/t-shirts',
    });
    expect(resolve(table, 'localhost:3002', '/')?.rest).toBe('/');
  });

  it('serves other stores under their code, with a locale segment when not the default', () => {
    expect(resolve(table, 'localhost:3002', '/vn-vi')).toMatchObject({
      ctx: { store: 'vn-vi', locale: 'vi-VN', currency: 'VND' },
      prefix: '/vn-vi',
      rest: '/',
    });
    expect(resolve(table, 'localhost:3002', '/vn-vi/en-us/men')).toMatchObject({
      ctx: { store: 'vn-vi', locale: 'en-US' },
      prefix: '/vn-vi/en-us',
      rest: '/men',
    });
  });

  it('does not treat a lookalike prefix as a store', () => {
    expect(resolve(table, 'localhost', '/vn-vintage')?.ctx.store).toBe('us-en');
  });

  it('does not take the default locale as a segment (one URL per page)', () => {
    expect(resolve(table, 'localhost', '/vn-vi/vi-vn/men')).toMatchObject({
      ctx: { locale: 'vi-VN' },
      rest: '/vi-vn/men',
    });
  });

  it('matches stores by baseUrl host and path, longest first', () => {
    expect(resolve(table, 'shop.example.co.uk', '/sale')).toMatchObject({
      ctx: { store: 'uk', currency: 'GBP' },
      prefix: '',
      rest: '/sale',
    });
    expect(resolve(table, 'shop.example.com', '/de/sale')).toMatchObject({
      ctx: { store: 'de' },
      prefix: '/de',
      rest: '/sale',
    });
    // de's base is on shop.example.com only
    expect(resolve(table, 'localhost', '/de/sale')?.ctx.store).toBe('us-en');
  });

  it('takes the currency from the cookie only when the store sells in it', () => {
    expect(resolve(table, 'localhost', '/vn-vi', 'USD')?.ctx.currency).toBe('USD');
    expect(resolve(table, 'localhost', '/vn-vi', 'EUR')?.ctx.currency).toBe('VND');
    expect(resolve(table, 'localhost', '/', 'VND')?.ctx.currency).toBe('USD');
  });

  it('returns null when the default store is unknown', () => {
    expect(resolve({ defaultStore: 'x', stores: [] }, 'localhost', '/')).toBeNull();
  });
});

describe('links', () => {
  it('builds public prefixes', () => {
    expect(prefixFor(table, { store: 'us-en', locale: 'en-US', currency: 'USD' })).toBe('');
    expect(prefixFor(table, { store: 'vn-vi', locale: 'en-US', currency: 'USD' })).toBe(
      '/vn-vi/en-us',
    );
    expect(
      prefixFor(table, { store: 'uk', locale: 'en-GB', currency: 'GBP' }, 'localhost:3002'),
    ).toBe('https://shop.example.co.uk');
    expect(
      prefixFor(table, { store: 'de', locale: 'de-DE', currency: 'EUR' }, 'shop.example.com'),
    ).toBe('/de');
  });

  it('prefixes storefront paths and leaves external links alone', () => {
    expect(href('/men', '/vn-vi')).toBe('/vn-vi/men');
    expect(href('men', '')).toBe('/men');
    expect(href('/', '/vn-vi')).toBe('/vn-vi');
    expect(href('/', '')).toBe('/');
    expect(href('https://x.example/a', '/vn-vi')).toBe('https://x.example/a');
    expect(href('//cdn.example/a', '/vn-vi')).toBe('//cdn.example/a');
    expect(href('mailto:a@b.c', '/vn-vi')).toBe('mailto:a@b.c');
  });

  it('lets the shop resolve posts under /blog but not the index itself', () => {
    expect(isCatalogPath('/blog')).toBe(false);
    expect(isCatalogPath('/blog/welcome')).toBe(true);
    expect(isCatalogPath('/cart')).toBe(false);
    expect(isCatalogPath('/men/t-shirts')).toBe(true);
  });
});
