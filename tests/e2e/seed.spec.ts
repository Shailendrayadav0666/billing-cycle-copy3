import { test, expect } from '@playwright/test';

// Shared seed for every story's Planner/Generator run: sign in as the seeded
// demo subscriber (Standard plan, in-memory backend data) and land on /billing.
// The login form's labels are not associated with their inputs, so the fields
// are located by input type.
test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText('Plan & Billing')).toBeVisible();
  });
});
