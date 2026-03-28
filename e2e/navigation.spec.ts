import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing page has key sections', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.getByText(/everything happening/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/got a business/i)).toBeVisible();
  });

  test('landing about page loads', async ({ page }) => {
    await page.goto('/landing/about');
    await expect(page.getByText(/about/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('landing privacy page loads', async ({ page }) => {
    await page.goto('/landing/privacy');
    await expect(page.getByText(/privacy/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('landing contact page loads', async ({ page }) => {
    await page.goto('/landing/contact');
    await expect(page.getByText(/contact/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('demo page loads', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
