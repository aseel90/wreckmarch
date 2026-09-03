import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Pause uses GameShell ownership and freezes/resumes the gameplay scene', async ({ page }) => {
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const pauseButton = page.locator('#wm-pause-trigger');
  await expect(pauseButton).toBeVisible();
  await pauseButton.click();

  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  const paused = await page.evaluate(() => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    return {
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      scenePaused: scene?.scene?.isPaused?.() === true,
    };
  });
  expect(paused).toEqual({ shellScreen: 'pause', scenePaused: true });

  await page.locator('[data-pause-action="resume"]').click();
  await expect(page.locator('.wm-pause-screen')).toHaveCount(0);
  await expect(pauseButton).toBeVisible();

  const resumed = await page.evaluate(() => {
    const game = (window as any).__WM_GAME__;
    const scene = game?.scene?.getScene?.('Wreckmarch');
    return {
      shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      scenePaused: scene?.scene?.isPaused?.() === true,
    };
  });
  expect(resumed).toEqual({ shellScreen: 'gameplay', scenePaused: false });
});
