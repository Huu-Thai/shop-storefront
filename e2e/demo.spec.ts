import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ADDRESS, hydrated } from './routes';

/** Needs a storefront started with DEMO_MODE=true: E2E_DEMO=1 E2E_BASE_URL=… */
test.skip(process.env.E2E_DEMO !== '1', 'set E2E_DEMO=1 against a DEMO_MODE=true storefront');

test('shows the demo banner and switches the accent colour', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const bar = page.getByRole('complementary', { name: 'Demo store' });
  await expect(bar).toBeVisible();
  const accent = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent'));
  const before = await accent();
  await bar.getByRole('button', { name: 'Cobalt' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cobalt');
  expect(await accent()).not.toBe(before);
  // The choice survives a reload (applied before first paint).
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cobalt');
});

test('registration and order changes are refused, the cart still works', async ({ page }) => {
  await page.goto('/account/register');
  await hydrated(page);
  await page.getByLabel('First name').fill('Demo');
  await page.getByLabel('Last name').fill('Visitor');
  await page.getByLabel('E-mail').fill(`demo-${Date.now()}@example.test`);
  await page.locator('#rg-password').fill('Demo-Visitor-123!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText(/demo store/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/account\/register/);

  await page.goto('/classic-tee');
  await hydrated(page);
  for (const group of await page.getByRole('radiogroup').all())
    await group.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'View cart' })).toBeVisible();
  const refused = await page.evaluate(async () => {
    const r = await fetch('/api/sf/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-storefront': '1',
        'x-sf-ctx': 'us-en.en-US.USD',
      },
      body: '{}',
    });
    return r.status;
  });
  expect(refused).toBe(403);
});

test('every accent preset passes the contrast checks on the home page, in both modes', async ({
  page,
}) => {
  await page.goto('/');
  await hydrated(page);
  const bar = page.getByRole('complementary', { name: 'Demo store' });
  const presets = await bar.getByRole('button').allTextContents();
  const names = await bar.getByRole('button').evaluateAll((els) => els.map((e) => e.ariaLabel));
  expect(presets.length + names.length).toBeGreaterThan(0);
  for (const mode of ['light', 'dark']) {
    await page.evaluate(
      (m) => document.documentElement.classList.toggle('dark', m === 'dark'),
      mode,
    );
    for (const name of names) {
      await bar.getByRole('button', { name: name ?? '' }).click();
      const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(
        result.violations.map((v) => `${name}/${mode}: ${v.nodes[0]?.target}`),
        'contrast',
      ).toEqual([]);
    }
  }
});

test('checkout shows a readable notice instead of placing the order', async ({ page }) => {
  await page.goto('/classic-tee');
  await hydrated(page);
  for (const group of await page.getByRole('radiogroup').all())
    await group.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Checkout' }).click();
  await hydrated(page);
  await page.getByLabel('E-mail').fill('demo-checkout@example.test');
  await page.getByRole('button', { name: 'Continue' }).click();
  const main = page.locator('main');
  await main.getByLabel('First name').fill(ADDRESS.firstName);
  await main.getByLabel('Last name').fill(ADDRESS.lastName);
  await main.getByLabel(/^Address/).fill(ADDRESS.line1);
  await main.getByLabel('City').fill(ADDRESS.city);
  await main.getByLabel('State / province').selectOption('CA');
  await main.getByLabel('Postcode').fill(ADDRESS.postcode);
  await main.getByLabel('Phone').fill(ADDRESS.phone);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /^Standard/ }).check();
  await page.getByRole('button', { name: /^Place order/ }).click();
  await expect(page.getByText(/demo store/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});

test('the refusal speaks Vietnamese in the Vietnamese store', async ({ page }) => {
  await page.goto('/vn-vi/account/register');
  await hydrated(page);
  await page.locator('#rg-first').fill('Demo');
  await page.locator('#rg-last').fill('Khách');
  await page.locator('#rg-email').fill(`demo-${Date.now()}@example.test`);
  await page.locator('#rg-password').fill('Demo-Visitor-123!');
  await page.getByRole('button', { name: /Tạo tài khoản/ }).click();
  await expect(page.getByText(/cửa hàng demo/i).first()).toBeVisible();
});
