import { Page } from '@playwright/test';

export async function loginAsEngineer(page: Page) {
  await page.goto('/');
  await page.click('.btn-quick-login');
  await page.fill('input[type="email"]', 'dummyengg@gmail.com');
  await page.fill('input[type="password"]', 'enggpass');
  await page.click('.submit-btn');
  await page.waitForSelector('.user-profile');
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.click('.btn-quick-login');
  await page.fill('input[type="email"]', 'dummyadmin@gmail.com');
  await page.fill('input[type="password"]', 'adminpassword');
  await page.click('.submit-btn');
  await page.waitForSelector('.user-profile');
}
