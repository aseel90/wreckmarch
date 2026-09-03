import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Main is the canonical landing screen and future actions cannot bypass the shell', async ({ page }) => {
  await page.goto('/?debug=1');

  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#wm-main-title')).toHaveText('WRECKMARCH');
  await expect(page.locator('.wm-main-motto')).toHaveText('BUILD • ROLL • SURVIVE');

  for (const route of ['settings', 'shop', 'leaderboard']) {
    await page.locator(`[data-screen-id="${route}"]`).click();
    await expect.poll(
      () => page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null)
    ).toBe('main');
  }

  await page.locator('[data-screen-id="character-select"]').click();
  await expect(page.locator('.wm-character-select')).toBeVisible();
  await expect.poll(
    () => page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null)
  ).toBe('character-select');

  await page.locator('.wm-shell-back').click();
  await expect(page.locator('.wm-main-screen')).toBeVisible();
  await expect.poll(
    () => page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null)
  ).toBe('main');
  expect(await page.evaluate(() => Boolean((window as any).__WM_GAME__))).toBe(false);
});
