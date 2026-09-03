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

  const result = await page.evaluate(async () => {
    const w = window as typeof window & { __WM_GAME__?: any };
    const game = w.__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.openUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 250));
    const during = {
      upgradeOpen: scene.upgradeOpen,
      bodyClass: document.body.classList.contains('wm-upgrade-active'),
      titleVisible: scene.titleText?.visible,
      hudVisible: scene.timerText?.visible,
      overlayActive: game.scene.isActive('UpgradeSceneV4')
    };
    scene.closeUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 120));
    const after = {
      upgradeOpen: scene.upgradeOpen,
      bodyClass: document.body.classList.contains('wm-upgrade-active'),
      titleVisible: scene.titleText?.visible,
      hudVisible: scene.timerText?.visible,
      overlayActive: game.scene.isActive('UpgradeSceneV4')
    };
    return { during, after };
  });

  expect(result.during).toMatchObject({ upgradeOpen: true, bodyClass: true, overlayActive: true });
  expect(result.after).toMatchObject({ upgradeOpen: false, bodyClass: false, overlayActive: false });
});

test('canonical Results screen owns run end and covers the live landscape viewport', async ({ page }) => {
  await waitForGame(page);

  const result = await page.evaluate(async () => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_LAST_RESULT__?: any };
    const game = w.__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 125.9;
    scene.scrap = 87;
    scene.level = 6;
    scene.endRun('SYSTEM FAILURE');
    await new Promise(resolve => setTimeout(resolve, 180));
    return {
      gameOver: scene.gameOver,
      titleVisible: scene.titleText?.visible,
      legacyLayoutExists: Boolean(document.querySelector('#results')),
      result: w.__WM_LAST_RESULT__
    };
  });

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
