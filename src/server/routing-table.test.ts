import { describe, expect, it, vi } from 'vitest';
import { loadRoutingTable } from './routing-table';

const configs: Record<string, object> = {
  'us-en': {
    store: {
      code: 'us-en',
      name: 'US',
      baseUrl: null,
      defaultLocale: 'en-US',
      defaultCurrency: 'USD',
    },
    website: { code: 'us' },
    locales: [{ code: 'en-US' }],
    currencies: [{ code: 'USD' }],
    stores: [{ code: 'us-en' }, { code: 'us-es' }],
  },
  'us-es': {
    store: {
      code: 'us-es',
      name: 'US (ES)',
      baseUrl: null,
      defaultLocale: 'es-US',
      defaultCurrency: 'USD',
    },
    website: { code: 'us' },
    locales: [{ code: 'es-US' }],
    currencies: [{ code: 'USD' }],
    stores: [],
  },
  'vn-vi': {
    store: {
      code: 'vn-vi',
      name: 'Việt Nam',
      website: 'vn',
      baseUrl: 'https://shop.vn/',
      defaultLocale: 'vi-VN',
      defaultCurrency: 'VND',
    },
    website: { code: 'vn' },
    locales: [{ code: 'vi-VN' }, { code: 'en-US' }],
    currencies: [{ code: 'VND' }, { code: 'USD' }],
    stores: [],
  },
};

const fakeFetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
  const store = new Headers(init?.headers).get('x-store')!;
  return configs[store] ? Response.json(configs[store]) : new Response('{}', { status: 400 });
}) as unknown as typeof fetch;

describe('loadRoutingTable', () => {
  it('serves the default website’s stores plus extra stores', async () => {
    const t = await loadRoutingTable(
      { apiBase: 'http://api/api/v1', defaultStore: 'us-en', extraStores: ['vn-vi'] },
      fakeFetch,
    );
    expect(t.defaultStore).toBe('us-en');
    expect(t.stores.map((s) => s.code)).toEqual(['us-en', 'us-es', 'vn-vi']);
    expect(t.stores[2]).toEqual({
      code: 'vn-vi',
      name: 'Việt Nam',
      website: 'vn',
      baseUrl: 'https://shop.vn/',
      defaultLocale: 'vi-VN',
      locales: ['vi-VN', 'en-US'],
      defaultCurrency: 'VND',
      currencies: ['VND', 'USD'],
    });
  });

  it('skips an extra store the shop refuses, but not the default one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const t = await loadRoutingTable(
      { apiBase: 'http://api/api/v1', defaultStore: 'us-en', extraStores: ['nope'] },
      fakeFetch,
    );
    expect(t.stores.map((s) => s.code)).toEqual(['us-en', 'us-es']);
    await expect(
      loadRoutingTable(
        { apiBase: 'http://api/api/v1', defaultStore: 'nope', extraStores: [] },
        fakeFetch,
      ),
    ).rejects.toThrow(/nope/);
  });
});
