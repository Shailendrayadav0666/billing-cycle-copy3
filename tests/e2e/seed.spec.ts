import { test, expect, type Page } from '@playwright/test';

// Shared login helper, reused across every story's generated specs. Logs in as the seeded
// Standard-plan user (tpg@example.com / password) and lands on the protected /billing route.
export async function loginAsStandardUser(page: Page) {
  await page.goto('/');
  await page.locator('input[type="email"]').fill('tpg@example.com');
  await page.locator('input[type="password"]').fill('password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/billing');
}

test.describe('Seed — Standard user login', () => {
  test('seed: logs in as tpg@example.com and reaches the Billing page', async ({ page }) => {
    await loginAsStandardUser(page);
    await expect(page).toHaveURL(/\/billing$/);
  });
});
