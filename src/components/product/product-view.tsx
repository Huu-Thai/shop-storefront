import { Regions } from '@/components/content/content';
import { ProductRail } from '@/components/home/sections';
import { JsonLd } from '@/components/json-ld';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { translator } from '@/i18n';
import { type Ctx, href } from '@/lib/routing';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo';
import { cleanHtml, plainText } from '@/server/html';
import { absoluteUrl } from '@/server/site';
import { getPlacements, type Product, type StoreConfig } from '@/server/storefront';
import { Purchase, type PurchaseProduct } from './purchase';

/** Product page: purchase area, then description and specifications, then related products. */
export async function ProductView({
  ctx,
  config,
  product,
  prefix,
}: {
  ctx: Ctx;
  config: StoreConfig;
  product: Product;
  prefix: string;
}) {
  const t = translator(ctx.locale);
  const to = (path: string) => href(path, prefix);
  const regions = await getPlacements(ctx, 'PRODUCT', product.id);
  const description = cleanHtml(product.description);
  const specs = product.attributes.filter((a) => a.valueLabel || a.value);
  const purchase: PurchaseProduct = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    type: product.type,
    inStock: product.inStock,
    price: product.price,
    images: product.images,
    options: product.configurableOptions,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      options: v.options as Record<string, string>,
      images: v.images,
      price: v.price,
      stock: v.stock,
    })),
    bundle: product.bundle
      ? {
          priceType: product.bundle.priceType,
          options: product.bundle.options.map((o) => ({
            code: o.code,
            title: o.title,
            inputType: o.inputType,
            isRequired: o.isRequired,
            selections: o.selections.map((s) => ({
              sku: s.sku,
              name: s.name,
              qty: s.qty,
              isDefault: s.isDefault,
              inStock: s.inStock,
              price: s.price,
            })),
          })),
        }
      : null,
    giftCard: product.giftCard
      ? {
          cardType: product.giftCard.cardType,
          amounts: product.giftCard.amounts,
          lifetimeDays: product.giftCard.lifetimeDays,
        }
      : null,
  };

  const crumbs = [
    { label: t('nav.home'), href: to('/') },
    ...product.breadcrumbs.map((b) => ({ label: b.name, href: to(`/${b.urlPath}`) })),
    { label: product.name },
  ];
  const url = absoluteUrl(to(`/${product.urlPath ?? product.slug}`));
  const units = config.currencies.find((c) => c.code === ctx.currency)?.minorUnits ?? 2;
  const offers = (
    product.variants.length > 1
      ? product.variants
      : [{ sku: product.sku, price: product.price, stock: { inStock: product.inStock } }]
  )
    .filter((v) => v.price)
    .map((v) => ({
      sku: v.sku,
      price: v.price!.amount,
      currency: v.price!.currency,
      minorUnits: units,
      inStock: v.stock?.inStock !== false,
    }));
  const related = [...product.related, ...product.upsell].filter(
    (p, i, all) => all.findIndex((x) => x.id === p.id) === i,
  );

  return (
    <>
      {url && (
        <>
          <JsonLd
            data={productJsonLd({
              name: product.name,
              sku: product.sku,
              url,
              description:
                plainText(product.shortDescription || product.description, 500) || undefined,
              images: product.images.map((i) => i.url),
              offers,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd(
              product.breadcrumbs.map((b) => ({
                name: b.name,
                url: absoluteUrl(to(`/${b.urlPath}`))!,
              })),
            )}
          />
        </>
      )}
      <div className="container-page pt-6 md:pt-8">
        <Breadcrumbs items={crumbs} label={t('a11y.breadcrumbs')} className="mb-6" />
        <Purchase
          product={purchase}
          pricesIncludeTax={config.store.pricesIncludeTax}
          shortDescription={product.shortDescription}
        />
      </div>

      {(description || specs.length > 0) && (
        <section className="container-page pt-[var(--section-y)]">
          <div className="grid gap-12 border-t border-border pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
            {description && (
              <div className="grid content-start gap-4">
                <h2 className="text-h3">{t('product.description')}</h2>
                <div
                  className="prose-store max-w-2xl text-body text-fg-muted"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            )}
            {specs.length > 0 && (
              <div className="grid content-start gap-4">
                <h2 className="text-h3">{t('product.specs')}</h2>
                <dl className="divide-y divide-border border-y border-border">
                  {specs.map((a) => (
                    <div
                      key={a.code}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3 text-small"
                    >
                      <dt className="text-fg-muted">{a.label}</dt>
                      <dd className="text-fg">{a.valueLabel ?? String(a.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      <Regions regions={regions} where="top" className="container-page pt-[var(--section-y)]" />
      <Regions regions={regions} where="bottom" className="container-page pt-[var(--section-y)]" />
      {related.length > 0 && (
        <ProductRail
          t={t}
          title={t('product.related')}
          products={related}
          hrefFor={(p) => to(`/${p.urlPath ?? p.slug}`)}
        />
      )}
      {product.crossSell.length > 0 && (
        <ProductRail
          t={t}
          title={t('product.crossSell')}
          products={product.crossSell}
          hrefFor={(p) => to(`/${p.urlPath ?? p.slug}`)}
        />
      )}
      <div className="pb-[var(--section-y)]" />
    </>
  );
}
