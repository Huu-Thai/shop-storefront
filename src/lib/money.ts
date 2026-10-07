/**
 * Formats integer minor units (USD cents, VND dong) for the shopper's locale. Prices from the
 * shop arrive formatted; this is only for sums the storefront computes (bundle totals).
 */
export function formatMoney(minor: number, currency: string, locale: string): string {
  const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
  return fmt.format(minor / 10 ** digits);
}
