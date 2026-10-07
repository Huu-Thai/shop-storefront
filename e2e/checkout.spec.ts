import { expect, test, type Page } from '@playwright/test';
import { ADDRESS, hydrated } from './routes';

/**
 * Places a real order (cash on delivery) as a guest, so it only runs with E2E_ORDERS=1 — the order
 * and its stock reservation stay in the shop until you delete them (docs/TESTING.md).
 */
test.skip(process.env.E2E_ORDERS !== '1', 'set E2E_ORDERS=1 to place a test order');

async function fillAddress(page: Page, scope: ReturnType<Page['locator']>) {
  await scope.getByLabel('First name').fill(ADDRESS.firstName);
  await scope.getByLabel('Last name').fill(ADDRESS.lastName);
  await scope.getByLabel(/^Address/).fill(ADDRESS.line1);
  await scope.getByLabel('City').fill(ADDRESS.city);
  await scope.getByLabel('State / province').selectOption('CA');
  await scope.getByLabel('Postcode').fill(ADDRESS.postcode);
  await scope.getByLabel('Phone').fill(ADDRESS.phone);
}

test('a guest buys a tee with cash on delivery, and the order page opens', async ({ page }) => {
  await page.goto('/classic-tee');
  await hydrated(page);
  for (const group of await page.getByRole('radiogroup').all())
    await group.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await hydrated(page);

  await page.getByLabel('E-mail').fill(`e2e-guest-${Date.now()}@example.test`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await fillAddress(page, page.locator('main'));
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('radio', { name: /^Standard/ }).check();
  // The store's only payment method is chosen for the shopper.
  await expect(page.getByText('Cash on delivery').first()).toBeVisible();
  await page.getByRole('button', { name: /^Place order/ }).click();

  await expect(page).toHaveURL(/\/orders\/[A-Z0-9-]+/);
  await expect(page.getByText(/Thank you/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Payment' })).toBeVisible();
  await expect(page.getByText('Unpaid')).toBeVisible();
  // The cart became the order.
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty')).toBeVisible();
});
