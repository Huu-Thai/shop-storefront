/**
 * Configurable products: picking a variant from option values (colour, size …). Pure; used by the
 * product page and tests.
 */

export interface VariantLike {
  id: string;
  sku: string;
  options: Record<string, string>;
  stock?: { inStock: boolean; managed?: boolean; salable?: number | null } | null;
}
export interface OptionLike {
  code: string;
  values: { code: string }[];
}
export type Selection = Record<string, string | undefined>;

/** The variant matching every option, or undefined while the selection is incomplete. */
export function matchVariant<V extends VariantLike>(
  variants: V[],
  options: OptionLike[],
  selection: Selection,
): V | undefined {
  if (options.some((o) => !selection[o.code])) return undefined;
  return variants.find((v) => options.every((o) => v.options[o.code] === selection[o.code]));
}

/**
 * State of one value given the other selected options: `missing` when no variant has that
 * combination, `soldOut` when every such variant is out of stock.
 */
export function valueState(
  variants: VariantLike[],
  options: OptionLike[],
  selection: Selection,
  code: string,
  value: string,
): 'available' | 'soldOut' | 'missing' {
  const others = options.filter((o) => o.code !== code && selection[o.code]);
  const candidates = variants.filter(
    (v) =>
      v.options[code] === value && others.every((o) => v.options[o.code] === selection[o.code]),
  );
  if (!candidates.length) return 'missing';
  return candidates.some((v) => v.stock?.inStock !== false) ? 'available' : 'soldOut';
}

/**
 * Starting selection: options with a single value are chosen; with several options, the first
 * (usually colour) starts on its first value in stock so the page shows real images and prices.
 * Sizes are left for the shopper.
 */
export function initialSelection(variants: VariantLike[], options: OptionLike[]): Selection {
  const sel: Selection = {};
  for (const o of options) if (o.values.length === 1) sel[o.code] = o.values[0].code;
  const lead = options[0];
  if (options.length > 1 && lead && !sel[lead.code]) {
    const value = lead.values.find(
      (v) => valueState(variants, options, sel, lead.code, v.code) === 'available',
    );
    if (value) sel[lead.code] = value.code;
  }
  return sel;
}

/** Stock wording: low stock shows the count (managed stock only). */
export function stockLevel(
  stock: VariantLike['stock'] | undefined,
  low = 5,
): { kind: 'in' | 'low' | 'out'; count?: number } {
  if (!stock) return { kind: 'in' };
  if (!stock.inStock) return { kind: 'out' };
  if (stock.managed && typeof stock.salable === 'number' && stock.salable <= low)
    return { kind: 'low', count: stock.salable };
  return { kind: 'in' };
}
