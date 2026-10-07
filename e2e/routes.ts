import type { Page } from '@playwright/test';

/** Pages checked for layout, accessibility and key content, per store. */
export const SCREENS = [
  { name: 'home', path: '/' },
  { name: 'category', path: '/men' },
  { name: 'product', path: '/classic-tee' },
  { name: 'search', path: '/search?q=tee' },
  { name: 'blog', path: '/blog' },
  { name: 'cms page', path: '/about' },
  { name: 'cart', path: '/cart' },
  { name: 'sign in', path: '/account/sign-in' },
  { name: 'register', path: '/account/register' },
  { name: 'not found', path: '/no-such-page', status: 404 },
  { name: 'vietnamese home', path: '/vn-vi' },
  { name: 'vietnamese category', path: '/vn-vi/nam' },
  { name: 'vietnamese product', path: '/vn-vi/ao-thun-co-dien' },
] as const;

/** Next keeps earlier pages mounted but hidden: only look at what the shopper sees. */
export const visible = { visible: true } as const;

/** Waits until client code has attached (buttons respond), without relying on a spinner. */
export async function hydrated(page: Page) {
  await page.waitForLoadState('networkidle');
}

export const ADDRESS = {
  firstName: 'Test',
  lastName: 'Shopper',
  phone: '+1 213 555 0100',
  line1: '1 Main St',
  city: 'Los Angeles',
  postcode: '90001',
};
