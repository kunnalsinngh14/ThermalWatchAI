import { test, expect } from '@playwright/test';

test.describe('Daily Stats Submission (Engineer)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'engineer-tests', 'Engineer-only tests');
  });

  test('should fill and submit operating stats successfully', async ({ page }) => {
    await page.goto('/stats-submission');
    await expect(page.getByText('Daily Stats Submission')).toBeVisible();

    // Fill form fields
    await page.fill('input[name="powerGenerated"]', '19000');
    await page.fill('input[name="auxiliaryPower"]', '88.5');
    await page.fill('input[name="waterConsumption"]', '4100');
    await page.fill('input[name="coalConsumption"]', '310');
    await page.fill('input[name="co2Emissions"]', '880');
    await page.fill('input[name="flyAsh"]', '42');

    // Mock the POST submission endpoint
    await page.route('**/api/submissions', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Stats submitted successfully', id: 101 })
      });
    });

    // Submit and assert success toast
    await page.click('button:has-text("Submit Daily Stats")');
    await expect(page.getByText('Daily stats submitted successfully!')).toBeVisible();
  });

  test('should validate empty required inputs', async ({ page }) => {
    await page.goto('/stats-submission');
    await page.fill('input[name="powerGenerated"]', '');
    
    let apiCalled = false;
    await page.route('**/api/submissions', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.click('button:has-text("Submit Daily Stats")');
    await page.waitForTimeout(500);
    expect(apiCalled).toBe(false);
  });
});

test.describe('Operating Units View (Engineer)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'engineer-tests', 'Engineer-only tests');
  });

  test('should show read-only view for engineers', async ({ page }) => {
    // Mock units and plants API response
    await page.route('**/api/units', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, plantId: 1, plantName: 'Ahmedabad Power Plant', unitNumber: 1, status: 'running' }
        ])
      });
    });
    await page.route('**/api/plants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Ahmedabad Power Plant', capacity: '1000.00', units: 1, faults: 0 }
        ])
      });
    });

    await page.goto('/admin/units');
    await expect(page.getByText('Operating Units List')).toBeVisible();
    await expect(page.locator('button:has-text("Add Unit")')).not.toBeVisible();
    await expect(page.locator('table thead th:has-text("Change Status")')).not.toBeVisible();
    await expect(page.locator('table thead th:has-text("Actions")')).not.toBeVisible();
  });
});

test.describe('Operating Units View (Admin)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'admin-tests', 'Admin-only tests');
  });

  test('should show fully interactive CRUD view for admins', async ({ page }) => {
    // Mock units and plants API response
    await page.route('**/api/units', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, plantId: 1, plantName: 'Ahmedabad Power Plant', unitNumber: 1, status: 'running' }
        ])
      });
    });
    await page.route('**/api/plants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Ahmedabad Power Plant', capacity: '1000.00', units: 1, faults: 0 }
        ])
      });
    });

    await page.goto('/admin/units');
    await expect(page.getByText('Manage Operating Units')).toBeVisible();
    await expect(page.locator('button:has-text("Add Unit")')).toBeVisible();
    await expect(page.locator('table thead th:has-text("Change Status")')).toBeVisible();
    await expect(page.locator('table thead th:has-text("Actions")')).toBeVisible();
  });
});

test.describe('Under Maintenance Flow (Engineer)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'engineer-tests', 'Engineer-only tests');
  });

  test('should show maintenance list to engineers without action buttons', async ({ page }) => {
    await page.route('**/api/requests?status=under_maintenance', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 501,
          plantName: 'Ahmedabad Power Plant',
          unitId: 3,
          faultType: 'OVERHEATING',
          confidence: '88.5',
          priority: 'High',
          timestamp: Date.now(),
          engineerId: 2
        }])
      });
    });

    await page.goto('/maintenance');
    await expect(page.locator('h2:has-text("Under Maintenance")')).toBeVisible();
    await expect(page.getByText('Ahmedabad Power Plant - Unit 3')).toBeVisible();
    
    // Engineers should not see actions container
    await expect(page.locator('.rc-actions')).not.toBeVisible();
  });
});

test.describe('Under Maintenance Flow (Admin)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'admin-tests', 'Admin-only tests');
  });

  test('should show maintenance list to admins with actions', async ({ page }) => {
    await page.route('**/api/requests?status=under_maintenance', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 501,
          plantName: 'Ahmedabad Power Plant',
          unitId: 3,
          faultType: 'OVERHEATING',
          confidence: '88.5',
          priority: 'High',
          timestamp: Date.now(),
          engineerId: 2
        }])
      });
    });

    await page.goto('/maintenance');
    await expect(page.locator('h2:has-text("Under Maintenance")')).toBeVisible();
    await expect(page.getByText('Ahmedabad Power Plant - Unit 3')).toBeVisible();
    
    // Admins should see the action button container and the buttons inside it
    await expect(page.locator('.rc-actions')).toBeVisible();
    await expect(page.locator('button[title="Mark Fixed"]')).toBeVisible();
    await expect(page.locator('button[title="Drop Unit"]')).toBeVisible();
  });
});

test.describe('History Logs (Shared)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/history/faults', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          plantName: 'Ahmedabad Power Plant',
          unitNumber: 2,
          priority: 'High',
          faultType: 'Vibration Anomaly',
          confidence: '92.5',
          status: 'resolved',
          timestamp: Date.now()
        }])
      });
    });

    await page.route('**/api/history/maintenance', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          plantName: 'Ahmedabad Power Plant',
          unitNumber: 2,
          faultType: 'Vibration Anomaly',
          confidence: '92.5',
          timestamp: Date.now()
        }])
      });
    });

    await page.route('**/api/history/dropped', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 3,
          plantName: 'Ahmedabad Power Plant',
          unitNumber: 10,
          faultType: 'Boiler Tube Leakage',
          confidence: '95.0',
          timestamp: Date.now()
        }])
      });
    });
  });

  test('should render Fault History page with records', async ({ page }) => {
    await page.goto('/history/faults');
    await expect(page.locator('h2:has-text("Fault History Log")')).toBeVisible();
    await expect(page.getByText('Vibration Anomaly')).toBeVisible();
    await expect(page.getByText('Unit 2')).toBeVisible();
  });

  test('should render Maintenance History page with records', async ({ page }) => {
    await page.goto('/history/maintenance');
    await expect(page.locator('h2:has-text("Maintenance & Repair")')).toBeVisible();
    await expect(page.getByText('Vibration Anomaly')).toBeVisible();
    await expect(page.getByText('Unit 2')).toBeVisible();
  });

  test('should render Dropped History page with records', async ({ page }) => {
    await page.goto('/history/dropped');
    await expect(page.locator('h2:has-text("Dropped Units History Log")')).toBeVisible();
    await expect(page.getByText('Boiler Tube Leakage')).toBeVisible();
    await expect(page.getByText('Unit 10')).toBeVisible();
  });
});

test.describe('Dashboard Graph Submissions Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/submissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, date: '2026-06-01', plantId: 1, powerGenerated: 18000, auxiliaryPower: 80, waterConsumption: 4000, coalConsumption: 300, co2Emissions: 850, flyAsh: 40 }
        ])
      });
    });
    await page.route('**/api/plants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Ahmedabad Power Plant', capacity: '1200.00', units: 10, faults: 0 }])
      });
    });
    await page.route('**/api/units', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
  });

  test('should load dynamic stats from submissions on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Global Overview Dashboard')).toBeVisible();
    await expect(page.locator('h4:has-text("Power Generated Per Day")')).toBeVisible();
    await expect(page.locator('h4:has-text("Water Consumption")')).toBeVisible();
  });
});
