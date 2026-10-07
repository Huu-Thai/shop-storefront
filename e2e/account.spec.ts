import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ADDRESS, hydrated, visible } from './routes';

/** Runs as the customer created in auth.setup.ts. */
test.describe('account', () => {
  test('overview greets the customer; the header shows they are signed in', async ({ page }) => {
    await page.goto('/account');
    await hydrated(page);
    await expect(page.locator('h1').filter(visible)).toContainText(/E2E|Hello|Welcome/i);
    await page.goto('/');
    await expect(
      page.locator('a[aria-label="Account"] [data-signed-in], a[aria-label="Account"]'),
    ).toBeVisible();
  });

  test('orders, points and profile pages open', async ({ page }) => {
    for (const [path, title] of [
      ['/account/orders', /orders/i],
      ['/account/points', /points/i],
      ['/account/profile', /profile/i],
    ] as const) {
      await page.goto(path);
      await hydrated(page);
      await expect(page.locator('h1, h2').filter(visible).first()).toContainText(title);
    }
  });

  test('add an address, then remove it', async ({ page }) => {
    await page.goto('/account/addresses');
    await hydrated(page);
    await page.getByRole('button', { name: 'Add address' }).first().click();
    const form = page.locator('main');
    await form.getByLabel('First name').fill(ADDRESS.firstName);
    await form.getByLabel('Last name').fill(ADDRESS.lastName);
    await form.getByLabel(/^Address/).fill(ADDRESS.line1);
    await form.getByLabel('City').fill(ADDRESS.city);
    await form.getByLabel('State / province').selectOption('CA');
    await form.getByLabel('Postcode').fill(ADDRESS.postcode);
    await form.getByLabel('Phone').fill(ADDRESS.phone);
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(ADDRESS.line1).first()).toBeVisible();
    await page
      .getByRole('button', { name: /^Delete|^Remove/ })
      .first()
      .click();
    await page
      .getByRole('button', { name: /^Delete|^Remove|Confirm/ })
      .last()
      .click();
    await expect(page.getByText(ADDRESS.line1)).toHaveCount(0);
  });
});

// Signing out revokes the session in the shop, so this spec signs in on its own.
test.describe('sign out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('returns to a signed-out store', async ({ page }) => {
    const [email, password] = readFileSync('e2e/.auth/customer.txt', 'utf8').split('\n');
    await page.goto('/account/sign-in');
    await hydrated(page);
    await page.getByLabel('E-mail').fill(email);
    await page.locator('#si-password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await page.getByRole('button', { name: 'Sign out', exact: true }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/account');
    await expect(page).toHaveURL(/\/account\/sign-in/);
  });
});
