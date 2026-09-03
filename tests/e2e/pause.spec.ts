import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });
test.describe.configure({ timeout: 90_000 });

async function waitForGame(page: any) {
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);
}

test('Pause freezes gameplay; Settings preserves paused context; Resume restores gameplay', async ({ page }) => {
  await waitForGame(page);
  const pauseButton = page.locator('#wm-pause-trigger');
  await expect(pauseButton).toBeVisible();
  await pauseButton.click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  await page.locator('[data-pause-action="settings"]').click();
  await expect(page.locator('.wm-settings-screen')).toBeVisible();

  const inSettings = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return { shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null, scenePaused: scene?.scene?.isPaused?.() === true };
  });
  expect(inSettings).toEqual({ shellScreen: 'settings', scenePaused: true });

  await page.locator('[data-setting-key="screenShakeEnabled"]').click();
  await page.locator('.wm-settings-screen .wm-shell-back').click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  await page.locator('[data-pause-action="resume"]').click();
  await expect(page.locator('.wm-pause-screen')).toHaveCount(0);
  await expect(pauseButton).toBeVisible();

  const resumed = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return { shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null, scenePaused: scene?.scene?.isPaused?.() === true };
  });
  expect(resumed).toEqual({ shellScreen: 'gameplay', scenePaused: false });
});

test('Restart Run uses shared confirmation and clean canonical restart intent', async ({ page }) => {
  await waitForGame(page);
  await page.locator('#wm-pause-trigger').click();
  await page.locator('[data-pause-action="restart"]').click();
  await expect(page.locator('.wm-confirm-dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RESTART RUN?' })).toBeVisible();

  await page.locator('[data-confirm-action="cancel"]').click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch')?.scene?.isPaused?.() === true)).toBe(true);

  await page.locator('[data-pause-action="restart"]').click();
  await expect(page.locator('.wm-confirm-dialog')).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-confirm-action="confirm"]').click(),
  ]);
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const restarted = await page.evaluate(() => ({
    shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
    selectedCharacter: (window as any).__WM_SELECTED_CHARACTER__ || null,
    sceneCharacter: (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch')?.characterId || null,
  }));
  expect(restarted).toEqual({ shellScreen: 'gameplay', selectedCharacter: 'runner', sceneCharacter: 'runner' });
});

test('Exit to Main uses shared confirmation and returns to canonical Main boot target', async ({ page }) => {
  await waitForGame(page);
  await page.locator('#wm-pause-trigger').click();
  await page.locator('[data-pause-action="exit"]').click();
  await expect(page.locator('.wm-confirm-dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EXIT TO MAIN?' })).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-confirm-action="confirm"]').click(),
  ]);

  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'WRECKMARCH' })).toBeVisible();
  const state = await page.evaluate(() => ({
    shellScreen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
    hasCanvas: Boolean(document.querySelector('canvas')),
  }));
  expect(state.shellScreen).toBe('main');
  expect(state.hasCanvas).toBe(false);
});
