import { expect, test } from '@playwright/test';

const TARGET_VIEWPORT = { width: 844, height: 390 };
const EPSILON = 2;

test.use({ viewport: TARGET_VIEWPORT });
test.describe.configure({ timeout: 180_000 });

async function expectScreenFits(page: any, selector: string, { allowVerticalScroll = false } = {}) {
  const screen = page.locator(selector);
  await expect(screen).toBeVisible();
  const metrics = await screen.evaluate((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });

  expect(metrics.x).toBeGreaterThanOrEqual(-EPSILON);
  expect(metrics.y).toBeGreaterThanOrEqual(-EPSILON);
  expect(metrics.right).toBeLessThanOrEqual(metrics.innerWidth + EPSILON);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.innerHeight + EPSILON);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + EPSILON);
  if (!allowVerticalScroll) expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + EPSILON);
}

async function expectFullyInViewport(page: any, locator: any) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-EPSILON);
  expect(box!.y).toBeGreaterThanOrEqual(-EPSILON);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + EPSILON);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + EPSILON);
}

async function expectTouchTarget(locator: any, minimum = 44) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(minimum);
  expect(box!.height).toBeGreaterThanOrEqual(minimum);
}

async function waitForGameplay(page: any) {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);
}

test('core frontend flow stays usable across the canonical 844x390 mobile landscape viewport', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

  await page.goto('/?debug=1');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await expectScreenFits(page, '.wm-main-screen');
  await expectFullyInViewport(page, page.locator('[data-screen-id="character-select"]'));
  await expectFullyInViewport(page, page.locator('[data-screen-id="settings"]'));
  await expectFullyInViewport(page, page.locator('[data-screen-id="shop"]'));
  await expectTouchTarget(page.locator('[data-screen-id="character-select"]'));
  await expectTouchTarget(page.locator('[data-screen-id="settings"]'));
  await expectTouchTarget(page.locator('[data-screen-id="shop"]'));

  await page.locator('[data-screen-id="settings"]').click();
  await expectScreenFits(page, '.wm-settings-screen');
  await expectFullyInViewport(page, page.locator('.wm-settings-screen .wm-shell-back'));
  await expectFullyInViewport(page, page.locator('[data-setting-key="audioEnabled"]'));
  await expectFullyInViewport(page, page.locator('[data-setting-key="screenShakeEnabled"]'));
  await expectTouchTarget(page.locator('.wm-settings-screen .wm-shell-back'));
  await expectTouchTarget(page.locator('[data-setting-key="audioEnabled"]'));
  await expectTouchTarget(page.locator('[data-setting-key="screenShakeEnabled"]'));
  await expectTouchTarget(page.locator('.wm-settings-reset'));
  await page.locator('.wm-settings-screen .wm-shell-back').click();
  await expect(page.locator('.wm-main-screen')).toBeVisible();

  await page.locator('[data-screen-id="shop"]').click();
  await expectScreenFits(page, '.wm-progression-screen', { allowVerticalScroll: true });
  await expectFullyInViewport(page, page.locator('.wm-progression-screen .wm-shell-back'));
  await expectFullyInViewport(page, page.locator('.wm-progression-rank'));
  await expectTouchTarget(page.locator('.wm-progression-screen .wm-shell-back'));
  await page.locator('.wm-progression-screen').evaluate((element: HTMLElement) => {
    element.scrollTop = element.scrollHeight;
  });
  await expectFullyInViewport(page, page.locator('.wm-progression-footer'));
  await expectFullyInViewport(page, page.locator('.wm-progression-roster'));
  await page.locator('.wm-progression-screen .wm-shell-back').click();
  await expect(page.locator('.wm-main-screen')).toBeVisible();

  await page.locator('[data-screen-id="character-select"]').click();
  await expectScreenFits(page, '.wm-character-select');
  await expectFullyInViewport(page, page.locator('.wm-character-select .wm-shell-back'));
  await expectFullyInViewport(page, page.locator('[data-character-id="runner"]'));
  await expectTouchTarget(page.locator('.wm-character-select .wm-shell-back'));
  await expectTouchTarget(page.locator('[data-character-id="runner"]'));
  await expectFullyInViewport(page, page.locator('[data-character-id="shotgun"]'));
  await expect(page.locator('[data-character-id="shotgun"]')).toHaveAttribute('data-availability', 'locked');
  await expect(page.locator('[data-character-id="shotgun"] .wm-character-composition')).toBeVisible();
  const shotgunPreviewLayout = await page.locator('[data-character-id="shotgun"]').evaluate((card: HTMLElement) => {
    const stage = card.querySelector<HTMLElement>('.wm-character-composition');
    const weapon = card.querySelector<HTMLElement>('.wm-character-weapon');
    return {
      stageAspectRatio: stage?.style.aspectRatio || '',
      weaponLeft: weapon?.style.left || '',
      weaponTop: weapon?.style.top || '',
      weaponWidth: weapon?.style.width || '',
      weaponHeight: weapon?.style.height || '',
    };
  });
  expect(shotgunPreviewLayout.stageAspectRatio).toBe('128 / 148');
  for (const value of [shotgunPreviewLayout.weaponLeft, shotgunPreviewLayout.weaponTop, shotgunPreviewLayout.weaponWidth, shotgunPreviewLayout.weaponHeight]) {
    expect(value).toMatch(/^-?\d+(?:\.\d+)?%$/);
  }

  await page.locator('[data-character-id="runner"]').click();
  await waitForGameplay(page);
  await expectFullyInViewport(page, page.locator('#wm-pause-trigger'));
  await expectTouchTarget(page.locator('#wm-pause-trigger'));

  await page.locator('#wm-pause-trigger').click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  await expectFullyInViewport(page, page.locator('.wm-pause-panel'));
  await expectFullyInViewport(page, page.locator('[data-pause-action="resume"]'));
  await expectFullyInViewport(page, page.locator('[data-pause-action="settings"]'));
  await expectFullyInViewport(page, page.locator('[data-pause-action="restart"]'));
  await expectFullyInViewport(page, page.locator('[data-pause-action="exit"]'));
  await expectTouchTarget(page.locator('[data-pause-action="resume"]'));
  await expectTouchTarget(page.locator('[data-pause-action="settings"]'));
  await expectTouchTarget(page.locator('[data-pause-action="restart"]'));
  await expectTouchTarget(page.locator('[data-pause-action="exit"]'));

  await page.locator('[data-pause-action="settings"]').click();
  await expectScreenFits(page, '.wm-settings-screen');
  const pausedSettingsState = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    return {
      screen: (window as any).__WM_GAME_SHELL__?.currentScreenId || null,
      paused: scene?.scene?.isPaused?.() === true,
    };
  });
  expect(pausedSettingsState).toEqual({ screen: 'settings', paused: true });
  await page.locator('.wm-settings-screen .wm-shell-back').click();
  await expect(page.locator('.wm-pause-screen')).toBeVisible();
  await page.locator('[data-pause-action="resume"]').click();
  await expect(page.locator('.wm-pause-screen')).toHaveCount(0);

  await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 95.4;
    scene.scrap = 63;
    scene.level = 5;
    scene.endRun('SYSTEM FAILURE');
  });

  await expectScreenFits(page, '.wm-results-screen');
  await expectFullyInViewport(page, page.locator('.wm-results-stats'));
  await expectFullyInViewport(page, page.locator('[data-results-action="play-again"]'));
  await expectFullyInViewport(page, page.locator('[data-results-action="main"]'));
  await expectFullyInViewport(page, page.locator('.wm-results-report-button'));
  await expectTouchTarget(page.locator('[data-results-action="play-again"]'));
  await expectTouchTarget(page.locator('[data-results-action="main"]'));
  await expectTouchTarget(page.locator('.wm-results-report-button'));

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-results-action="main"]').click(),
  ]);
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 45_000 });
  await expectScreenFits(page, '.wm-main-screen');

  await page.locator('[data-screen-id="shop"]').click();
  await expectScreenFits(page, '.wm-progression-screen', { allowVerticalScroll: true });
  await expect(page.locator('.wm-progression-stats')).toContainText('95s');
  await expect(page.locator('.wm-progression-stats')).toContainText('63');
  await expect(page.locator('.wm-progression-roster')).toContainText('PRODUCTION LOCKED');

  expect(pageErrors).toEqual([]);
});
