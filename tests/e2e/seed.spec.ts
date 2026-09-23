import { test as setup } from '@playwright/test';

export const AUTH_STATE_PATH = 'playwright/.auth/user.json';

// Shared seed: logs in as the pre-seeded demo user (tpg@example.com / password, both
// pre-filled as the Login form's defaults), lands on the Billing page, and saves the
// resulting auth state (the app stores its session token in localStorage) so every other
// spec's own fresh browser context can reuse it via playwright.config.ts's storageState.
// Extended over time, never duplicated per story.
setup('seed', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/billing');
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
