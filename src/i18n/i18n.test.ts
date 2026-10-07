import { describe, expect, it } from 'vitest';
import { catalogues, catalogueFor, translator } from '.';
import { en } from './en';

describe('i18n', () => {
  it('every catalogue has every key, none empty, same placeholders', () => {
    for (const [lang, messages] of Object.entries(catalogues)) {
      expect(Object.keys(messages).sort(), lang).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(messages)) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('');
        const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
        expect([...new Set(vars(value))], `${lang}:${key}`).toEqual([
          ...new Set(vars(en[key as keyof typeof en])),
        ]);
      }
    }
  });

  it('picks the catalogue by language subtag', () => {
    expect(catalogueFor('vi-VN')).toBe(catalogues.vi);
    expect(catalogueFor('en-GB')).toBe(catalogues.en);
    expect(catalogueFor('de-DE')).toBe(catalogues.en);
  });

  it('interpolates and plurals', () => {
    const t = translator('en-US');
    expect(t('home.products', { n: 1 })).toBe('1 product');
    expect(t('home.products', { n: 3 })).toBe('3 products');
    expect(translator('vi-VN')('home.products', { n: 3 })).toBe('3 sản phẩm');
    expect(t('footer.rights', { year: 2026, name: 'Ink' })).toContain('2026 Ink');
  });
});
