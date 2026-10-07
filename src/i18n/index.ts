import { en, type MessageKey, type Messages } from './en';
import { vi } from './vi';

/**
 * UI string catalogues by language subtag. The store's locale (BCP 47, from the shop) picks one:
 * `vi-VN` → vi, anything without a catalogue → English. Add a language: create `<lang>.ts` typed as
 * `Messages` and list it here (docs/EXTENDING.md).
 */
export const catalogues: Record<string, Messages> = { en, vi };

export type { MessageKey, Messages };
export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function catalogueFor(locale: string): Messages {
  return catalogues[locale.split('-')[0].toLowerCase()] ?? en;
}

/**
 * `t('home.products', { n: 3 })` → "3 products"; unknown keys fall back to English, then the key.
 * Counted messages use `{n}` and "singular|plural" (languages without plural forms omit the `|`).
 */
export function translator(locale: string): Translate {
  const messages = catalogueFor(locale);
  return (key, vars) => {
    let text: string = messages[key] ?? en[key] ?? key;
    if (text.includes('|') && vars && typeof vars.n === 'number')
      text = text.split('|')[vars.n === 1 ? 0 : 1];
    return vars
      ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
      : text;
  };
}
