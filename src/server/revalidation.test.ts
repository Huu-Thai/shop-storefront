import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { invalidationFor, verifySignature } from './revalidation';

const sign = (secret: string, body: string, t: number) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;

describe('webhook signature', () => {
  const now = 1_800_000_000_000;
  const body = '{"type":"page.published"}';
  it('accepts the shop’s signature', () => {
    expect(verifySignature(sign('s3cret', body, now / 1000), body, 's3cret', now)).toBe(true);
  });
  it('refuses a wrong secret, a changed body, a replay or garbage', () => {
    expect(verifySignature(sign('other', body, now / 1000), body, 's3cret', now)).toBe(false);
    expect(verifySignature(sign('s3cret', body, now / 1000), body + ' ', 's3cret', now)).toBe(
      false,
    );
    expect(verifySignature(sign('s3cret', body, now / 1000 - 600), body, 's3cret', now)).toBe(
      false,
    );
    expect(verifySignature('nonsense', body, 's3cret', now)).toBe(false);
    expect(verifySignature(null, body, 's3cret', now)).toBe(false);
  });
});

describe('events → cache tags', () => {
  it('maps content publishing, with take-downs applied at once', () => {
    expect(invalidationFor({ type: 'page.published', data: { id: 'p1' } })).toEqual({
      tags: ['pages', 'page:p1', 'urls'],
      immediate: false,
      urls: true,
      stores: false,
    });
    expect(invalidationFor({ type: 'post.unpublished', data: { id: 'x' } }).immediate).toBe(true);
    expect(invalidationFor({ type: 'product.deleted', data: { entityId: 'pr' } })).toMatchObject({
      tags: ['products', 'listings', 'product:pr', 'urls'],
      immediate: true,
    });
  });
  it('maps navigation, merchandising, stock, prices and stores', () => {
    expect(invalidationFor({ type: 'menu-item.updated' }).tags).toEqual(['menus']);
    expect(invalidationFor({ type: 'slide.updated' }).tags).toEqual(['sliders']);
    expect(invalidationFor({ type: 'block-placement.created' }).tags).toEqual(['blocks']);
    expect(invalidationFor({ type: 'inventory.changed' }).tags).toEqual(['stock']);
    expect(invalidationFor({ type: 'price-book.entries-changed' }).tags).toEqual(['prices']);
    expect(invalidationFor({ type: 'store.updated' })).toMatchObject({
      tags: ['config'],
      stores: true,
    });
    expect(invalidationFor({ type: 'webhook.ping' }).tags).toEqual([]);
  });
});
