import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('canonical Results persist run records and Main Progression displays them without currency', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('wreckmarch.progression.v1'));
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const recorded = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 77.8;
    scene.scrap = 51;
    scene.level = 4;
    scene.endRun('SYSTEM FAILURE');
    return (window as any).__WM_PROGRESSION_SNAPSHOT__;
  });
  expect(recorded).toMatchObject({
    totalRuns: 1,
    bestSurvivalSeconds: 77,
    highestLevel: 4,
    lifetimeScrapCollected: 51,
  });

  await expect(page.locator('.wm-results-screen')).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-results-action="main"]').click(),
  ]);
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 45_000 });

  const progressionButton = page.locator('[data-screen-id="shop"]');
  await expect(progressionButton).toHaveAttribute('data-enabled', 'true');
  await progressionButton.click();
  await expect(page.locator('.wm-progression-screen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PROGRESSION' })).toBeVisible();
  await expect(page.locator('.wm-progression-stats')).toContainText('RUNS');
  await expect(page.locator('.wm-progression-stats')).toContainText('1');
  await expect(page.locator('.wm-progression-stats')).toContainText('77s');
  await expect(page.locator('.wm-progression-stats')).toContainText('51');
  await expect(page.locator('.wm-progression-note')).toContainText('NOT A SHOP CURRENCY');
  await expect(page.locator('.wm-progression-roster')).toContainText('Runner');
  await expect(page.locator('.wm-progression-roster')).toContainText('Shotgun');
  await expect(page.locator('.wm-progression-roster')).toContainText('PRODUCTION LOCKED');

  const shellScreen = await page.evaluate(() => (window as any).__WM_GAME_SHELL__?.currentScreenId || null);
  expect(shellScreen).toBe('shop');
});
