import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Pause freezes gameplay; Settings preserves paused context; Resume restores gameplay', async ({ page }) => {
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const pauseButton = page.locator('#wm-pause-trigger');
  await expect(pauseButton).toBeVisible();
  await pauseButton.click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();

  await page.locator('[data-pause-action="settings"]').click();
  await expect(page.locator('.wm-settings-screen')).toBeVisible();

  const inSettings = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return {
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      scenePaused: scene?.scene?.isPaused?.() === true,
    };
  });
  expect(inSettings).toEqual({ shellScreen: 'settings', scenePaused: true });

  await page.locator('[data-setting-key="screenShakeEnabled"]').click();
  await page.locator('.wm-settings-screen .wm-shell-back').click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();

  const backInPause = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return {
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      scenePaused: scene?.scene?.isPaused?.() === true,
    };
  });
  expect(backInPause).toEqual({ shellScreen: 'pause', scenePaused: true });

  await page.locator('[data-pause-action="resume"]').click();
  await expect(page.locator('.wm-pause-screen')).toHaveCount(0);
  await expect(pauseButton).toBeVisible();

  const resumed = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return {
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      scenePaused: scene?.scene?.isPaused?.() === true,
    };
  });
  expect(resumed).toEqual({ shellScreen: 'gameplay', scenePaused: false });
});
