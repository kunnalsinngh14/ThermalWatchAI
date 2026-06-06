import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFileEngineer = path.join(__dirname, '../.auth/engineer.json');
const authFileAdmin = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as engineer', async ({ page }) => {
  await page.goto('/');
  await page.click('.btn-quick-login');
  await page.fill('input[type="email"]', 'dummyengg@gmail.com');
  await page.fill('input[type="password"]', 'enggpass');
  await page.click('.submit-btn');
  
  await expect(page.locator('.user-profile')).toBeVisible();
  await expect(page.locator('.role-engineer')).toBeVisible();
  
  await page.context().storageState({ path: authFileEngineer });
});

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/');
  await page.click('.btn-quick-login');
  await page.fill('input[type="email"]', 'dummyadmin@gmail.com');
  await page.fill('input[type="password"]', 'adminpassword');
  await page.click('.submit-btn');
  
  await expect(page.locator('.user-profile')).toBeVisible();
  await expect(page.locator('.role-admin')).toBeVisible();
  
  await page.context().storageState({ path: authFileAdmin });
});
