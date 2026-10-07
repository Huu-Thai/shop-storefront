import { expect, test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Creates a customer through the registration form and saves the signed-in session for the
 * account specs. Set E2E_EMAIL and E2E_PASSWORD to sign in as an existing customer instead (no
 * data is created then). The generated customer stays in the shop: delete it afterwards
 * (docs/TESTING.md).
 */
const file = 'e2e/.auth/customer.json';

setup('customer session', async ({ page }) => {
  mkdirSync('e2e/.auth', { recursive: true });
  const existing = process.env.E2E_EMAIL && process.env.E2E_PASSWORD;
  const email = process.env.E2E_EMAIL ?? `e2e-${Date.now()}@example.test`;
  const password = process.env.E2E_PASSWORD ?? `Sf-${Date.now()}-Aa1!`;
  if (existing) {
    await page.goto('/account/sign-in');
    await page.getByLabel('E-mail').fill(email);
    await page.locator('#si-password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  } else {
    await page.goto('/account/register');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('First name').fill('E2E');
    await page.getByLabel('Last name').fill('Customer');
    await page.getByLabel('E-mail').fill(email);
    await page.locator('#rg-password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
  }
  await expect(page).toHaveURL(/\/account$/);
  await page.context().storageState({ path: file });
  // Kept beside the session so the sign-out spec can sign in on its own (sign-out revokes it).
  writeFileSync('e2e/.auth/customer.txt', `${email}\n${password}\n`);
});
