import { Inter } from 'next/font/google';

/**
 * One variable family for text and headings (headings get tighter tracking from the type scale):
 * a second display family cost two more font files on the critical path for little visible gain.
 * Swap it in docs/THEMING.md → Typography. Self-hosted at build; latin + Vietnamese subsets.
 */
export const bodyFont = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
  display: 'swap',
});
