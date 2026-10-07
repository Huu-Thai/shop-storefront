'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type Translate, translator } from '.';

const I18n = createContext<{ locale: string; t: Translate }>({
  locale: 'en-US',
  t: translator('en-US'),
});

export function I18nProvider({ locale, children }: { locale: string; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: translator(locale) }), [locale]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
