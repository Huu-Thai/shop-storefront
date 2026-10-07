/**
 * Structured data (schema.org JSON-LD) builders. Pure; rendered by <JsonLd>. Only facts the shop
 * provides — no invented ratings or brands.
 */

export interface ProductLd {
  name: string;
  sku: string;
  url: string;
  description?: string;
  images: string[];
  /** Offers per purchasable variant (or one for the product). */
  offers: { sku: string; price: number; currency: string; minorUnits: number; inStock: boolean }[];
}

const amount = (minor: number, units: number) => (minor / 10 ** units).toFixed(units);

export function productJsonLd(p: ProductLd) {
  const offers = p.offers.map((o) => ({
    '@type': 'Offer',
    sku: o.sku,
    url: p.url,
    price: amount(o.price, o.minorUnits),
    priceCurrency: o.currency,
    availability: `https://schema.org/${o.inStock ? 'InStock' : 'OutOfStock'}`,
    itemCondition: 'https://schema.org/NewCondition',
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    url: p.url,
    ...(p.description ? { description: p.description } : {}),
    ...(p.images.length ? { image: p.images } : {}),
    ...(offers.length === 1
      ? { offers: offers[0] }
      : offers.length > 1
        ? {
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: p.offers[0].currency,
              lowPrice: amount(Math.min(...p.offers.map((o) => o.price)), p.offers[0].minorUnits),
              highPrice: amount(Math.max(...p.offers.map((o) => o.price)), p.offers[0].minorUnits),
              offerCount: offers.length,
              offers,
            },
          }
        : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/** JSON for a <script type="application/ld+json">, safe against `</script>` in shop text. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
