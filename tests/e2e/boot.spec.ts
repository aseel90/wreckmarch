import { expect, test } from '@playwright/test';

test('boots the current game and keeps final asphalt persistent', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');

  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchPhaseE0),
    { timeout: 20_000 }
  ).toBe('active');

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchE1SelfTest),
    { timeout: 20_000 }
  ).toBe('passed');

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchE1Persistence),
    { timeout: 25_000 }
  ).toBe('passed');
});
