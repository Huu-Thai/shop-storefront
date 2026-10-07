import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../../globals.css';
import { ThemeScript } from '@/components/theme-script';
import { I18nProvider } from '@/i18n/client';
import { themeConfig } from '@/theme/config';
import { bodyFont } from '../../fonts';

export const metadata: Metadata = {
  title: `Style guide · ${themeConfig.name}`,
  description: 'The Ink Store design system: tokens, type, layout and components.',
  robots: { index: false },
};

/** Separate root layout: the style guide needs no store and no shop data. */
export default function StyleGuideLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={bodyFont.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <I18nProvider locale="en-US">{children}</I18nProvider>
      </body>
    </html>
  );
}
