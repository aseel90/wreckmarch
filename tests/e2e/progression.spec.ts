import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });
test.describe.configure({ timeout: 120_000 });

async function clearProgressionOnce(page: any, marker: string) {
  await page.addInitScript(({ marker }: { marker: string }) => {
    if (sessionStorage.getItem(marker)) return;
    localStorage.removeItem('wreckmarch.progression.v1');
    localStorage.removeItem('wreckmarch.progression.v2');
    localStorage.removeItem('wreckmarch.progression.v3');
    sessionStorage.setItem(marker, '1');
  }, { marker });
}

test('canonical Results persist debug run records without awarding Workshop Scrip', async ({ page }) => {
  await clearProgressionOnce(page, 'wreckmarch.test.progression-debug-cleared');
  await page.goto('/?autotest=1&debug=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 77.8;
    scene.scrap = 51;
    scene.level = 4;
    scene.endRun('SYSTEM FAILURE');
    return {
      progression: (window as any).__WM_PROGRESSION_SNAPSHOT__,
      reward: (window as any).__WM_LAST_WORKSHOP_REWARD__,
    };
  });
  expect(state.progression).toMatchObject({
    version: 3,
    totalRuns: 1,
    bestSurvivalSeconds: 77,
    highestLevel: 4,
    lifetimeScrapCollected: 51,
    workshopScrip: 0,
  });
  expect(state.reward).toMatchObject({ amount: 0, eligible: false, reason: 'autotest' });

  await expect(page.locator('.wm-results-screen')).toBeVisible();
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('—');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-results-action="main"]').click(),
  ]);
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 45_000 });

  const progressionButton = page.locator('[data-screen-id="shop"]');
  await expect(progressionButton).toHaveAttribute('data-enabled', 'true');
  await progressionButton.click();
  await expect(page.locator('.wm-progression-screen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'WORKSHOP' })).toBeVisible();
  await expect(page.locator('.wm-progression-stats')).toContainText('RUNS');
  await expect(page.locator('.wm-progression-stats')).toContainText('77s');
  await expect(page.locator('.wm-progression-stats')).toContainText('51');
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('0');
  await expect(page.locator('.wm-progression-note')).toContainText('SCRAP REMAINS AN IN-RUN STATISTIC');
  await expect(page.locator('.wm-progression-note')).toContainText('WORKSHOP SCRIP IS A SEPARATE PERMANENT CURRENCY');
  await expect(page.locator('.wm-progression-rank')).toContainText('SCAVENGER');
  await expect(page.locator('[data-milestone-id="first-deployment"]')).toHaveAttribute('data-complete', 'true');
  await expect(page.locator('[data-milestone-id="scrap-hand"]')).toHaveAttribute('data-complete', 'false');
  await expect(page.locator('[data-milestone-id="stay-moving"]')).toHaveAttribute('data-complete', 'false');
  await expect(page.locator('.wm-progression-roster')).toContainText('Runner');
  await expect(page.locator('.wm-progression-roster')).toContainText('Shotgun');
  await expect(page.locator('.wm-progression-roster')).toContainText('PRODUCTION LOCKED');
});

test('normal canonical run awards bounded Workshop Scrip once and persists it into Workshop', async ({ page }) => {
  await clearProgressionOnce(page, 'wreckmarch.test.progression-scrip-cleared');
  await page.goto('/');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-screen-id="character-select"]').click();
  await expect(page.locator('.wm-character-select')).toBeVisible();
  await page.locator('[data-character-id="runner"]').click();
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 45_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const scene = (window as any).__WM_GAME__?.scene?.getScene?.('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.runTime = 180;
    scene.scrap = 999;
    scene.level = 9;
    scene.endRun('SYSTEM FAILURE');
    return {
      result: (window as any).__WM_LAST_RUN_RESULT__,
      reward: (window as any).__WM_LAST_WORKSHOP_REWARD__,
      progression: (window as any).__WM_PROGRESSION_SNAPSHOT__,
    };
  });

  expect(state.result.runId).toEqual(expect.any(String));
  expect(state.reward).toMatchObject({ amount: 2, eligible: true, reason: 'survival', runId: state.result.runId });
  expect(state.progression).toMatchObject({ totalRuns: 1, lifetimeScrapCollected: 999, workshopScrip: 2 });
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('+2');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('[data-results-action="main"]').click(),
  ]);
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 45_000 });
  await page.locator('[data-screen-id="shop"]').click();
  await expect(page.locator('.wm-progression-screen')).toBeVisible();
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('2');
  await expect(page.locator('.wm-progression-roster')).toContainText('PRODUCTION LOCKED');

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('wreckmarch.progression.v3') || '{}'));
  expect(persisted.workshopScrip).toBe(2);
  expect(persisted.recordedRunIds).toEqual([state.result.runId]);
  expect(persisted.rewardedRunIds).toEqual([state.result.runId]);
});
