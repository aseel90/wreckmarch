import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Main is canonical, Settings returns to Main, and future routes cannot bypass the shell', async ({ page }) => {
  await page.goto('/?debug=1');

  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#wm-main-title')).toHaveText('WRECKMARCH');
  await expect(page.locator('.wm-main-motto')).toHaveText('BUILD • ROLL • SURVIVE');

  await page.locator('[data-screen-id="settings"]').click();
  await expect(page.locator('.wm-settings-screen')).toBeVisible();
  await expect.poll(
    () => page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null)
  ).toBe('settings');

  const audio = page.locator('[data-setting-key="audioEnabled"]');
  const beforeAudio = await audio.getAttribute('data-value');
  await audio.click();
  await expect(audio).not.toHaveAttribute('data-value', beforeAudio || '');
  await page.locator('.wm-settings-screen .wm-shell-back').click();
  await expect(page.locator('.wm-main-screen')).toBeVisible();
  await expect.poll(
    () => page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null)
  ).toBe('main');

  for (const route of ['shop', 'leaderboard']) {
    await page.locator(`[data-screen-id="${route}"]`).click();
    await expect.poll(
      () => page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null)
    ).toBe('main');
  }

  await page.locator('[data-screen-id="character-select"]').click();
  await expect(page.locator('.wm-character-select')).toBeVisible();
  await page.locator('.wm-shell-back').click();
  await expect(page.locator('.wm-main-screen')).toBeVisible();
  expect(await page.evaluate(() => Boolean((window as any).__WM_GAME__))).toBe(false);
});
