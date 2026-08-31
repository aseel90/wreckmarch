import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

async function waitForGame(page: any) {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('visual-ready')), { timeout: 20_000 }).toBe(true);
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
    return { upgradeOpen: scene.upgradeOpen, upgradeSceneActive: game.scene.isActive('UpgradeSceneV4'), titleVisible: scene.titleText.visible, xpVisible: scene.xpBg.visible, joystickVisible: scene.joyBase.visible, railVisible: rail?.visible, hudState: document.documentElement.dataset.wreckmarchGameplayHud };
  });
  expect(opened).toMatchObject({ upgradeOpen: true, upgradeSceneActive: true, titleVisible: false, xpVisible: false, joystickVisible: false, railVisible: false, hudState: 'suppressed' });
  const closed = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.closeUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 50));
    const rail = scene.children.list.find((object: any) => object?.name === 'mobile-hud-polish');
    return { upgradeOpen: scene.upgradeOpen, titleVisible: scene.titleText.visible, xpVisible: scene.xpBg.visible, joystickVisible: scene.joyBase.visible, railVisible: rail?.visible, hudState: document.documentElement.dataset.wreckmarchGameplayHud };
  });
  expect(closed).toMatchObject({ upgradeOpen: false, titleVisible: true, xpVisible: true, joystickVisible: true, railVisible: true, hudState: 'visible' });
});

test('end-run overlay uses the live landscape viewport instead of legacy portrait constants', async ({ page }) => {
  await waitForGame(page);
  const result = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.endRun('SYSTEM FAILURE');
    const layout = (window as typeof window & { __WM_END_RUN_LAYOUT__?: any }).__WM_END_RUN_LAYOUT__;
    const canvas = document.querySelector('canvas')!.getBoundingClientRect();
    return { scale: { width: scene.scale.width, height: scene.scale.height }, overlay: { x: layout.overlay.x, y: layout.overlay.y, width: layout.overlay.displayWidth, height: layout.overlay.displayHeight, scrollFactorX: layout.overlay.scrollFactorX, scrollFactorY: layout.overlay.scrollFactorY }, button: { x: layout.btn.x, y: layout.btn.y }, titleVisible: scene.titleText.visible, hudState: document.documentElement.dataset.wreckmarchGameplayHud, endRunVersion: document.documentElement.dataset.wreckmarchEndRunLayout, reportVisible: layout.reportBtn?.visible === true, canvas: { left: canvas.left, top: canvas.top, width: canvas.width, height: canvas.height } };
  });
  expect(result.scale).toEqual({ width: 960, height: 540 });
  expect(result.overlay).toMatchObject({ x: 480, y: 270, width: 960, height: 540, scrollFactorX: 0, scrollFactorY: 0 });
  expect(result.button.x).toBe(480);
  expect(result.button.y).toBeCloseTo(332, 1);
  expect(result.titleVisible).toBe(false);
  expect(result.endRunVersion).toBe('runtime-v5-test');
  expect(result.reportVisible).toBe(true);
  expect(result.canvas.width).toBeCloseTo(960, 1);
  expect(result.canvas.height).toBeCloseTo(540, 1);
});

test('end-run exposes the authoritative SEND REPORT control and sends successfully', async ({ page }) => {
  await waitForGame(page);
  const result = await page.evaluate(async () => {
    const w = window as typeof window & { __WM_GAME__?: any; __WM_END_RUN_LAYOUT__?: any; __WM_TELEMETRY_RUNTIME__?: any };
    const scene = w.__WM_GAME__.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    w.__WM_TELEMETRY_RUNTIME__.sendReport = async () => ({ ok: true, reportId: 'wm-e2e-manual', httpStatus: 202, bytes: 2048 });
    scene.endRun('SYSTEM FAILURE');
    const layout = w.__WM_END_RUN_LAYOUT__;
    const before = { buttonActive: layout.reportBtn?.active === true, buttonVisible: layout.reportBtn?.visible === true, label: layout.reportLabel?.text, status: layout.reportStatus?.text, endRunVersion: document.documentElement.dataset.wreckmarchEndRunLayout, ownerVersion: scene.__mobileHudEndRunOwnerVersion };
    layout.reportBtn.emit('pointerdown');
    await new Promise(resolve => setTimeout(resolve, 20));
    return { before, label: layout.reportLabel?.text, status: layout.reportStatus?.text, manualState: document.documentElement.dataset.wreckmarchManualReport };
  });
  expect(result.before).toMatchObject({ buttonActive: true, buttonVisible: true, label: 'SEND REPORT', status: 'Telemetry: ready • TEST UI v5', endRunVersion: 'runtime-v5-test', ownerVersion: 'runtime-v5-test' });
  expect(result.label).toBe('REPORT SENT');
  expect(result.status).toContain('SENT • wm-e2e-manual');
  expect(result.status).toContain('HTTP 202');
  expect(result.manualState).toBe('sent');
});
