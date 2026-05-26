import { test, expect } from '@playwright/test';

test.describe('StumpScore Visual Regression tests', () => {
  test('Home Screen layout screenshot validation', async ({ page }) => {
    // 1. Visit App Home
    await page.goto('/');
    await expect(page.locator('span', { hasText: 'RunBook' }).first()).toBeVisible();

    // Take screenshot of Home page in Light Mode
    await expect(page).toHaveScreenshot('home-light.png');

    // Toggle Dark Mode in Settings
    await page.click('button[aria-label="Settings"]');
    await expect(page.locator('text=App Settings')).toBeVisible();
    await page.click('button:has-text("DARK")');
    await page.click('button:has-text("Save")');

    // Take screenshot of Home page in Dark Mode
    await expect(page).toHaveScreenshot('home-dark.png');
  });
});
