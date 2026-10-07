import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { hydrated, SCREENS, visible } from './routes';

/** Every key screen: right status, one h1, no horizontal scroll, no WCAG 2.2 AA violations. */
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`screens, ${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const s of SCREENS) {
      test(s.name, async ({ page }) => {
        const status = 'status' in s ? s.status : 200;
        await page.addInitScript((m) => localStorage.setItem('sf_mode', m), scheme);
        const res = await page.goto(s.path);
        expect(res?.status()).toBe(status);
        await hydrated(page);
        await expect(page.locator('h1').filter(visible)).toHaveCount(1);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, 'horizontal scroll').toBeLessThanOrEqual(0);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          result.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`),
          'accessibility violations',
        ).toEqual([]);
      });
    }
  });
}

test('no console errors on the main pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of ['/', '/men', '/classic-tee', '/blog', '/cart']) {
    await page.goto(p);
    await hydrated(page);
  }
  expect(errors).toEqual([]);
});
