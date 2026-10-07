import { describe, expect, it } from 'vitest';
import { initialSelection, matchVariant, stockLevel, valueState } from './variants';

const options = [
  { code: 'color', values: [{ code: 'black' }, { code: 'red' }] },
  { code: 'size', values: [{ code: 's' }, { code: 'm' }] },
];
const v = (id: string, color: string, size: string, inStock = true) => ({
  id,
  sku: id,
  options: { color, size },
  stock: { inStock, managed: true, salable: inStock ? 10 : 0 },
});
const variants = [v('bs', 'black', 's', false), v('bm', 'black', 'm'), v('rm', 'red', 'm', false)];

describe('variant selection', () => {
  it('matches only complete selections', () => {
    expect(matchVariant(variants, options, { color: 'black' })).toBeUndefined();
    expect(matchVariant(variants, options, { color: 'black', size: 'm' })?.id).toBe('bm');
    expect(matchVariant(variants, options, { color: 'red', size: 's' })).toBeUndefined();
  });

  it('marks values missing or sold out against the other choices', () => {
    expect(valueState(variants, options, { color: 'black' }, 'size', 's')).toBe('soldOut');
    expect(valueState(variants, options, { color: 'black' }, 'size', 'm')).toBe('available');
    expect(valueState(variants, options, { color: 'red' }, 'size', 's')).toBe('missing');
    expect(valueState(variants, options, {}, 'color', 'red')).toBe('soldOut');
  });

  it('starts on the first colour in stock and leaves the size to the shopper', () => {
    expect(initialSelection(variants, options)).toEqual({ color: 'black' });
    expect(
      initialSelection([v('x', 'black', 's')], [{ code: 'size', values: [{ code: 's' }] }]),
    ).toEqual({ size: 's' });
  });

  it('describes stock', () => {
    expect(stockLevel({ inStock: false })).toEqual({ kind: 'out' });
    expect(stockLevel({ inStock: true, managed: true, salable: 3 })).toEqual({
      kind: 'low',
      count: 3,
    });
    expect(stockLevel({ inStock: true, managed: false, salable: null })).toEqual({ kind: 'in' });
  });
});
