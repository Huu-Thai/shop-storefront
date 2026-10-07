import { describe, expect, it } from 'vitest';
import { needsSearch, parseQuery, toApiSearch, toSearchParams } from './catalog-query';

describe('catalog query', () => {
  it('parses filters, price, stock, sort and page from the URL', () => {
    const q = parseQuery(
      {
        size: 'm',
        color: ['red,blue', 'red'],
        price: '10-49.5',
        stock: '1',
        sort: 'price_asc',
        page: '3',
        q: ' tee ',
      },
      'category',
    );
    expect(q).toEqual({
      q: 'tee',
      filters: { color: ['blue', 'red'], size: ['m'] },
      priceMin: 10,
      priceMax: 49.5,
      inStock: true,
      sort: 'price_asc',
      page: 3,
    });
  });

  it('ignores junk and falls back to defaults', () => {
    const q = parseQuery(
      {
        sort: 'drop table',
        page: '-4',
        price: 'abc-',
        'bad key!': 'x',
        color: '<script>',
        utm_source: '',
      },
      'search',
    );
    expect(q).toMatchObject({
      sort: 'relevance',
      page: 1,
      priceMin: undefined,
      priceMax: undefined,
      filters: {},
    });
  });

  it('round-trips to stable URLs with defaults omitted', () => {
    const q = parseQuery({ size: 'm', color: 'red,blue', page: '1', sort: 'featured' }, 'category');
    expect(toSearchParams(q, 'category').toString()).toBe('color=blue%2Cred&size=m');
    expect(toSearchParams({ ...q, priceMax: 50, page: 2 }, 'category').toString()).toBe(
      'color=blue%2Cred&size=m&price=-50&page=2',
    );
  });

  it('uses the merchandised order unless filtering, searching or sorting by price', () => {
    expect(needsSearch(parseQuery({}, 'category'))).toBe(false);
    expect(needsSearch(parseQuery({ sort: 'newest' }, 'category'))).toBe(false);
    expect(needsSearch(parseQuery({ sort: 'price_desc' }, 'category'))).toBe(true);
    expect(needsSearch(parseQuery({ color: 'red' }, 'category'))).toBe(true);
    expect(needsSearch(parseQuery({ stock: '1' }, 'category'))).toBe(true);
  });

  it('builds the shop search query in minor units', () => {
    const q = parseQuery(
      { color: 'red', price: '10-25.5', sort: 'featured', page: '2' },
      'category',
    );
    expect(toApiSearch(q, { category: 'c1', minorUnits: 2 })).toEqual({
      q: undefined,
      category: 'c1',
      filter: ['color:red'],
      priceMin: 1000,
      priceMax: 2550,
      inStock: undefined,
      sort: 'relevance',
      page: 2,
      limit: 24,
    });
    expect(
      toApiSearch(parseQuery({ price: '100000-' }, 'search'), { minorUnits: 0 }).priceMin,
    ).toBe(100000);
  });
});
