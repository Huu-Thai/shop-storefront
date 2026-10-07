import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, productJsonLd, serializeJsonLd } from './seo';

describe('JSON-LD', () => {
  it('describes a product with one offer, in major units', () => {
    const ld = productJsonLd({
      name: 'Socks',
      sku: 'SOCKS',
      url: 'https://shop/socks',
      images: [],
      offers: [{ sku: 'SOCKS', price: 1200, currency: 'USD', minorUnits: 2, inStock: true }],
    });
    expect((ld as Record<string, unknown>).offers).toMatchObject({
      price: '12.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
    expect(ld).not.toHaveProperty('image');
  });

  it('aggregates variant offers', () => {
    const ld = productJsonLd({
      name: 'Tee',
      sku: 'TEE',
      url: 'u',
      images: ['i'],
      offers: [
        { sku: 'A', price: 399000, currency: 'VND', minorUnits: 0, inStock: true },
        { sku: 'B', price: 429000, currency: 'VND', minorUnits: 0, inStock: false },
      ],
    });
    expect((ld as Record<string, unknown>).offers).toMatchObject({
      '@type': 'AggregateOffer',
      lowPrice: '399000',
      highPrice: '429000',
      offerCount: 2,
    });
  });

  it('numbers breadcrumbs and escapes script breakers', () => {
    expect(breadcrumbJsonLd([{ name: 'Men', url: '/men' }]).itemListElement[0].position).toBe(1);
    expect(serializeJsonLd({ name: '</script><script>x' })).not.toContain('</script>');
  });
});
