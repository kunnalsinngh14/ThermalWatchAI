import { test, expect } from '@playwright/test';

test.describe('Engineer Tests', () => {
  // Use engineer state
  test.use({ storageState: '.auth/engineer.json' });

  test('should show engineer role in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.user-profile')).toBeVisible();
    await expect(page.locator('.role-engineer')).toBeVisible();
  });
});

test.describe('Admin Tests', () => {
  // Use admin state
  test.use({ storageState: '.auth/admin.json' });

  test('should show admin role in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.user-profile')).toBeVisible();
    await expect(page.locator('.role-admin')).toBeVisible();
  });
});
