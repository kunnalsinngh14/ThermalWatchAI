import { test, expect } from '@playwright/test';

test.describe('Fault Detection & Raise Request (Engineer)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'engineer-tests', 'Engineer-only tests');
    await page.goto('/fault-detection');
  });

  test.describe('F1 - Fault Detection Diagnostics', () => {
    
    test('should execute normal diagnostics successfully', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'Normal',
            confidence_score: '95.5',
            telemetry: { plantId: '1', unitId: '1' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByText('DETECTED STATUS')).toBeVisible();
      await expect(page.getByText('NORMAL')).toBeVisible();
      await expect(page.getByText('95.5%')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Raise Request' })).not.toBeVisible();
    });

    test('should execute faulty diagnostics successfully', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'Vibration Anomaly',
            confidence_score: '85.0',
            telemetry: { plantId: '1', unitId: '1' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByText('VIBRATION ANOMALY')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Raise Request' })).toBeVisible();
    });

    test('should display confidence gauge properly', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'Normal',
            confidence_score: '99.9',
            telemetry: { plantId: '1', unitId: '1' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.locator('.confidence-gauge')).toBeVisible();
    });

    test('should show critical alerts when confidence >= 90 and not Normal', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'High Temperature',
            confidence_score: '92.0',
            telemetry: { plantId: '1', unitId: '1' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByText('CRITICAL: Faulty count auto-incremented globally.')).toBeVisible();
    });
    
    test('should not show critical alerts when confidence >= 90 but Normal', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'Normal',
            confidence_score: '92.0',
            telemetry: { plantId: '1', unitId: '1' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByText('CRITICAL: Faulty count auto-incremented globally.')).not.toBeVisible();
    });

    test('should accept minimum unit boundary (1)', async ({ page }) => {
      await page.fill('input[name="unitId"]', '1');
      await expect(page.locator('input[name="unitId"]')).toHaveValue('1');
    });

    test('should accept maximum unit boundary (20)', async ({ page }) => {
      await page.fill('input[name="unitId"]', '20');
      await expect(page.locator('input[name="unitId"]')).toHaveValue('20');
    });

    test('should reject empty inputs for required fields', async ({ page }) => {
      await page.fill('input[name="rpm"]', '');
      await page.click('button:has-text("Execute Diagnostics")');
      let apiCalled = false;
      await page.route('**/api/predict', async (route) => {
        apiCalled = true;
        await route.continue();
      });
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(false);
    });

    test('should handle 500 API errors gracefully', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByText('Internal Server Error')).toBeVisible();
    });

    test('F1-T2-A: should handle invalid text input safely', async ({ page }) => {
      await page.evaluate(() => {
        const el = document.querySelector('input[name="rpm"]');
        if (el) {
          el.setAttribute('type', 'text');
          el.removeAttribute('required');
        }
        const form = document.querySelector('form');
        if (form) {
          form.setAttribute('novalidate', 'true');
        }
      });
      await page.fill('input[name="rpm"]', 'invalid_text');
      
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid numeric value' })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      
      await expect(page.getByText('Invalid numeric value')).toBeVisible();
    });
  });

  test.describe('F2 - Raise Request Pipeline', () => {

    test.beforeEach(async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'Overpressure',
            confidence_score: '88.5',
            telemetry: { plantId: '1', unitId: '2' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByRole('button', { name: 'Raise Request' })).toBeVisible();
    });

    test('should absent Raise Request button on Normal status', async ({ page }) => {
      await page.route('**/api/predict', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problem_class: 'Normal',
            confidence_score: '99.0',
            telemetry: { plantId: '1', unitId: '1' }
          })
        });
      });
      await page.click('button:has-text("Execute Diagnostics")');
      await expect(page.getByRole('button', { name: 'Raise Request' })).not.toBeVisible();
    });

    test('should render Raise Request modal correctly on Faulty status', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await expect(page.getByText('Raise Maintenance Request')).toBeVisible();
      await expect(page.getByText('Target Asset:')).toBeVisible();
    });

    test('should display target asset correctly in modal', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await expect(page.getByText('Plant 1 - Unit 2')).toBeVisible();
    });

    test('should display detected fault and confidence correctly in modal', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await expect(page.getByText('Overpressure (88.5%)')).toBeVisible();
    });

    test('should cancel Raise Request modal', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await page.click('button:has-text("Cancel")');
      await expect(page.getByText('Raise Maintenance Request')).not.toBeVisible();
    });

    test('should submit High priority request successfully', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await page.locator('.raise-request-form select').selectOption('High');
      await page.route('**/api/requests', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 101, message: 'Request created' })
        });
      });
      await page.click('button:has-text("Submit Request")');
      await expect(page.getByText('Raise Maintenance Request')).not.toBeVisible();
    });

    test('should submit Medium priority request successfully', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await page.locator('.raise-request-form select').selectOption('Medium');
      await page.route('**/api/requests', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 102, message: 'Request created' })
        });
      });
      await page.click('button:has-text("Submit Request")');
      await expect(page.getByText('Raise Maintenance Request')).not.toBeVisible();
    });

    test('should submit Low priority request successfully', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await page.locator('.raise-request-form select').selectOption('Low');
      await page.route('**/api/requests', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 103, message: 'Request created' })
        });
      });
      await page.click('button:has-text("Submit Request")');
      await expect(page.getByText('Raise Maintenance Request')).not.toBeVisible();
    });

    test('should handle Raise Request API failure gracefully', async ({ page }) => {
      await page.click('button:has-text("Raise Request")');
      await page.route('**/api/requests', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Failed to save request' })
        });
      });
      await page.click('button:has-text("Submit Request")');
      await expect(page.getByText('Failed to save request')).toBeVisible();
    });

  });
});
