import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

async function waitForGame(page: any) {
  const browserEvents: string[] = [];
  page.on('console', (msg: any) => { if (msg.type() === 'error') browserEvents.push(`console:error: ${msg.text()}`); });
  page.on('pageerror', (error: any) => browserEvents.push(`pageerror: ${error?.stack || error}`));
  page.on('requestfailed', (request: any) => browserEvents.push(`requestfailed: ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));
  try {
    await page.goto('/?debug=1&autotest=1');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('visual-ready')), { timeout: 20_000 }).toBe(true);
  } catch (error: any) {
    const state = await page.evaluate(() => ({
      visualReady: document.body.classList.contains('visual-ready'),
      bootError: document.body.classList.contains('boot-error'),
      bootStatus: document.querySelector('#boot-status')?.textContent || null,
      phaseC1: document.documentElement.dataset.wreckmarchPhaseC1 || null,
      phaseC2: document.documentElement.dataset.wreckmarchPhaseC2 || null,
      phaseC3: document.documentElement.dataset.wreckmarchPhaseC3 || null,
      phaseC5: document.documentElement.dataset.wreckmarchPhaseC5 || null,
      phaseD1: document.documentElement.dataset.wreckmarchPhaseD1 || null,
      phaseE1: document.documentElement.dataset.wreckmarchPhaseE1 || null,
      debugTail: document.querySelector('#log')?.textContent?.slice(-6000) || ''
    }));
    throw new Error(`waitForGame boot diagnostics: ${JSON.stringify({ state, browserEvents: browserEvents.slice(-30) })}\n${error?.stack || error}`);
  }
}

test('upgrade overlay suppresses gameplay HUD and restores it after selection UI closes', async ({ page }) => {
  await waitForGame(page);
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
  const closed = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.closeUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 50));
    const rail = scene.children.list.find((object: any) => object?.name === 'mobile-hud-polish');
    return { upgradeOpen: scene.upgradeOpen, titleVisible: scene.titleText.visible, xpVisible: scene.xpBg.visible, joystickVisible: scene.joyBase.visible, railVisible: rail?.visible };
  });
  expect(closed).toMatchObject({ upgradeOpen: false, titleVisible: true, xpVisible: true, joystickVisible: true, railVisible: true });
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
  expect(result.result).toMatchObject({ reason: 'SYSTEM FAILURE', runTimeSeconds: 125.9, scrap: 87, level: 6 });
});

test('normal live URL Results SEND REPORT uses isolated manual transport without enabling automatic telemetry', async ({ page }) => {
  await page.route('**/v1/report', async route => {
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true, accepted: true, submitted: true }) });
  });
  await waitForGame(page);
  await page.evaluate(() => {
    const w = window as typeof window & { __WM_GAME__?: any };
    const scene = w.__WM_GAME__.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.endRun('SYSTEM FAILURE');
  });
  const reportButton = page.locator('.wm-results-report-button');
  await expect(reportButton).toBeVisible();
  await expect(reportButton).toBeEnabled();
  await expect(reportButton).toHaveText('SEND REPORT');
  await reportButton.click();
  await expect(reportButton).toHaveText('REPORT SENT');
  const state = await page.evaluate(() => ({
    manual: document.documentElement.dataset.wreckmarchManualReport || null,
    automaticTelemetry: document.documentElement.dataset.wreckmarchTelemetry || null
  }));
  expect(state.manual).toBe('sent');
  expect(state.automaticTelemetry).not.toBe('enabled');
});
