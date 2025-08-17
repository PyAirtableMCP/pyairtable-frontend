import { test, expect } from '@playwright/test';

test.describe('Route Accessibility Test', () => {
  test('should access auth/login route', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/.*auth\/login/);
    // Should not get ERR_ABORTED
    expect(page.url()).toContain('auth/login');
  });

  test('should access auth/register route', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/.*auth\/register/);
    // Should not get ERR_ABORTED
    expect(page.url()).toContain('auth/register');
  });

  test('should redirect settings/integrations route', async ({ page }) => {
    await page.goto('/settings/integrations');
    // Should redirect to login (due to middleware protection)
    await expect(page).toHaveURL(/.*auth\/login/);
    // Should not get ERR_ABORTED
  });
});