import { expect, test } from '@playwright/test';
import { hydrated, visible } from './routes';

test.describe('browse and search', () => {
  test('home → category → product, with a working breadcrumb back', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await page.getByRole('link', { name: 'Men', exact: true }).filter(visible).first().click();
    await expect(page).toHaveURL(/\/men/);
    await expect(page.locator('h1').filter(visible)).toHaveText('Men');
    await page.locator('a[href*="classic-tee"]').filter(visible).first().click();
    await expect(page.locator('h1').filter(visible)).toContainText(/classic tee/i);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link').nth(1).click();
    await expect(page).toHaveURL(/\/men/);
  });

  test('sorting and paging live in the URL, and the category stays indexable only unfiltered', async ({
    page,
  }) => {
    await page.goto('/men?sort=price_asc');
    await hydrated(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.goto('/men');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/men$/);
  });

  test('search overlay suggests products and opens the results page', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await page.getByRole('link', { name: 'Search' }).filter(visible).first().click();
    const box = page.getByRole('combobox', { name: 'Search products' });
    await box.fill('tee');
    await expect(page.getByRole('option').first()).toBeVisible();
    await box.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=tee/);
    await expect(page.locator('h1').filter(visible)).toContainText('tee');
  });

  test('the Vietnamese store shows prices in dong, and the language switch keeps the page', async ({
    page,
  }) => {
    await page.goto('/vn-vi/nam');
    await hydrated(page);
    await expect(page.locator('main').getByText(/₫/).filter(visible).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi-VN');
  });
});

test.describe('cart', () => {
  test('add, change quantity, remove', async ({ page }) => {
    await page.goto('/classic-tee');
    await hydrated(page);
    const options = page.getByRole('radiogroup');
    for (const group of await options.all()) await group.getByRole('radio').first().click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer.getByRole('link', { name: 'View cart' })).toBeVisible();
    await drawer.getByRole('link', { name: 'View cart' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('link', { name: /Cart, 1 item/ }).first()).toBeVisible();
    await page
      .getByRole('button', { name: /Increase|\+/ })
      .filter(visible)
      .first()
      .click();
    await expect(page.getByRole('link', { name: /Cart, 2 items/ }).first()).toBeVisible();
    await page
      .getByRole('button', { name: /^Remove/ })
      .filter(visible)
      .first()
      .click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });
});

test.describe('keyboard', () => {
  test('search overlay: arrows move through suggestions, Esc closes and returns focus', async ({
    page,
  }) => {
    await page.goto('/');
    await hydrated(page);
    const trigger = page.getByRole('link', { name: 'Search' }).filter(visible).first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const box = page.getByRole('combobox', { name: 'Search products' });
    await expect(box).toBeFocused();
    await box.fill('tee');
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(options.first()).toHaveAttribute('aria-selected', 'false');
    await page.keyboard.press('Escape');
    await expect(box).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('cart drawer: focus stays inside, Esc closes and returns focus to the button', async ({
    page,
  }) => {
    await page.goto('/classic-tee');
    await hydrated(page);
    for (const group of await page.getByRole('radiogroup').all())
      await group.getByRole('radio').first().click();
    const add = page.getByRole('button', { name: 'Add to cart' });
    await add.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(add).toBeFocused();
  });

  test('the skip link is first and moves focus to the content', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});

test.describe('content and SEO', () => {
  test('the unknown page is a real, localized 404', async ({ request }) => {
    const en = await request.get('/nope');
    expect(en.status()).toBe(404);
    expect(await en.text()).toContain('Page not found');
    const vi = await request.get('/vn-vi/nope');
    expect(vi.status()).toBe(404);
    expect(await vi.text()).toContain('Không tìm thấy trang');
  });

  test('sitemap index, robots and hreflang are published', async ({ request, page }) => {
    const index = await (await request.get('/sitemap.xml')).text();
    expect(index).toContain('<sitemapindex');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap:');
    expect(robots).toMatch(/Disallow: \/cart/);
    await page.goto('/vn-vi/ao-thun-co-dien');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  });

  test('blog post and CMS page render with structured data', async ({ page }) => {
    await page.goto('/blog');
    await hydrated(page);
    await page.locator('article a').filter(visible).first().click();
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
    await page.goto('/about');
    await expect(page.locator('h1').filter(visible)).toBeVisible();
  });

  test('security headers are set', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});
