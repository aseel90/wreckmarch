import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

async function waitForGame(page: any) {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('visual-ready')), { timeout: 20_000 }).toBe(true);
}

test('upgrade overlay suppresses gameplay HUD and restores it after selection UI closes', async ({ page }) => {
  await waitForGame(page);
  await expect(page.locator('#fs-btn')).toBeVisible();
  const opened = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.openUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 80));
    const rail = scene.children.list.find((object: any) => object?.name === 'mobile-hud-polish');
    return { upgradeOpen: scene.upgradeOpen, upgradeSceneActive: game.scene.isActive('UpgradeSceneV4'), titleVisible: scene.titleText.visible, xpVisible: scene.xpBg.visible, joystickVisible: scene.joyBase.visible, railVisible: rail?.visible };
  });
  expect(opened).toMatchObject({ upgradeOpen: true, upgradeSceneActive: true, titleVisible: false, xpVisible: false, joystickVisible: false, railVisible: false });
  await expect(page.locator('#fs-btn')).toBeHidden();
  const closed = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.closeUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 50));
    const rail = scene.children.list.find((object: any) => object?.name === 'mobile-hud-polish');
    return { upgradeOpen: scene.upgradeOpen, titleVisible: scene.titleText.visible, xpVisible: scene.xpBg.visible, joystickVisible: scene.joyBase.visible, railVisible: rail?.visible };
  });
  expect(closed).toMatchObject({ upgradeOpen: false, titleVisible: true, xpVisible: true, joystickVisible: true, railVisible: true });
  await expect(page.locator('#fs-btn')).toBeVisible();
});

test('canonical Results screen owns run end and covers the live landscape viewport', async ({ page }) => {
  await waitForGame(page);
  const result = await page.evaluate(() => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_GAME_SHELL__?: any; __WM_LAST_RUN_RESULT__?: any; __WM_END_RUN_LAYOUT__?: any };
    const game = w.__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 125.9;
    scene.scrap = 87;
    scene.level = 6;
    scene.endRun('SYSTEM FAILURE');
    return {
      shellScreen: w.__WM_GAME_SHELL__?.currentScreenId,
      gameOver: scene.gameOver,
      titleVisible: scene.titleText.visible,
      legacyLayoutExists: Boolean(w.__WM_END_RUN_LAYOUT__),
      result: w.__WM_LAST_RUN_RESULT__
    };
  });

  const screen = page.locator('.wm-results-screen');
  await expect(screen).toBeVisible();
  await expect(screen.getByRole('heading', { name: 'SYSTEM FAILURE' })).toBeVisible();
  await expect(screen.getByRole('button', { name: /PLAY AGAIN/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /MAIN MENU/i })).toBeVisible();

  const box = await screen.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeCloseTo(0, 1);
  expect(box!.y).toBeCloseTo(0, 1);
  expect(box!.width).toBeCloseTo(960, 1);
  expect(box!.height).toBeCloseTo(540, 1);
  expect(result.shellScreen).toBe('results');
  expect(result.gameOver).toBe(true);
  expect(result.titleVisible).toBe(false);
  expect(result.legacyLayoutExists).toBe(false);
  expect(result.result).toMatchObject({
    reason: 'SYSTEM FAILURE',
    survivedSeconds: 125,
    scrap: 87,
    level: 6,
    characterId: 'runner'
  });
});

test('normal live URL Results SEND REPORT uses isolated manual transport without enabling automatic telemetry', async ({ page }) => {
  let reportRequests = 0;
  await page.route('https://wreckmarch-run-reports.salahaseel82.workers.dev/report', async route => {
    reportRequests += 1;
    await route.fulfill({
      status: 202,
      headers: {
        'access-control-allow-origin': '*',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ queued: true })
    });
  });

  await waitForGame(page);
  const before = await page.evaluate(() => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_TELEMETRY_REMOTE_ENABLED__?: boolean };
    const game = w.__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.endRun('SYSTEM FAILURE');
    return {
      automaticRemoteEnabled: w.__WM_TELEMETRY_REMOTE_ENABLED__ === true,
      hasPersistentProvider: Boolean(game.__wreckmarchRunReportProvider)
    };
  });

  const reportButton = page.locator('.wm-results-report-button');
  await expect(reportButton).toHaveText('SEND REPORT');
  await expect(reportButton).toBeEnabled();
  expect(before).toMatchObject({
    automaticRemoteEnabled: false,
    hasPersistentProvider: false
  });

  await reportButton.click();

  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.wreckmarchManualReport),
    { timeout: 5_000 }
  ).toBe('sent');

  await expect(reportButton).toHaveText('REPORT SENT');
  await expect(page.locator('.wm-results-report span')).toContainText('HTTP 202');

  const after = await page.evaluate(() => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_TELEMETRY_REMOTE_ENABLED__?: boolean };
    return {
      automaticRemoteEnabled: w.__WM_TELEMETRY_REMOTE_ENABLED__ === true,
      hasPersistentProvider: Boolean(w.__WM_GAME__?.__wreckmarchRunReportProvider)
    };
  });

  expect(reportRequests).toBe(1);
  expect(after.automaticRemoteEnabled).toBe(false);
  expect(after.hasPersistentProvider).toBe(false);
});
