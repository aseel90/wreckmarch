import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 844, height: 390 } });
test.describe.configure({ timeout: 90_000 });

const baseProfile = {
  version: 3,
  totalRuns: 1,
  bestSurvivalSeconds: 180,
  highestLevel: 4,
  lifetimeScrapCollected: 50,
  workshopScrip: 2,
  recordedRunIds: ['seed-run'],
  rewardedRunIds: ['seed-run'],
  ownedWorkshopItemIds: [],
  lastRunAt: '2026-09-03T10:00:00.000Z',
};

test('Workshop purchases Rustline once and exposes the owned cosmetic on Main', async ({ page }) => {
  await page.addInitScript(profile => {
    localStorage.removeItem('wreckmarch.progression.v1');
    localStorage.removeItem('wreckmarch.progression.v2');
    localStorage.setItem('wreckmarch.progression.v3', JSON.stringify(profile));
  }, baseProfile);

  await page.goto('/');
  await expect(page.locator('.wm-main-screen')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-screen-id="shop"]').click();
  await expect(page.locator('.wm-progression-screen')).toBeVisible();
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('2');

  const card = page.locator('[data-item-id="terminal-plate-rustline"]');
  await expect(card).toHaveAttribute('data-owned', 'false');
  const buy = page.locator('[data-purchase-item-id="terminal-plate-rustline"]');
  await expect(buy).toHaveText('BUY // 2 SCRIP');
  await expect(buy).toHaveCSS('min-height', '44px');
  await buy.click();

  await expect(card).toHaveAttribute('data-owned', 'true');
  await expect(buy).toHaveText('OWNED');
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('0');
  await expect(page.locator('.wm-workshop-purchase-status')).toContainText('FABRICATED');
  await expect(page.locator('.wm-progression-roster')).toContainText('Wrecker');
  await expect(page.locator('.wm-progression-roster')).toContainText('DEPLOYABLE');

  await page.locator('.wm-shell-back').click();
  await expect(page.locator('.wm-main-screen')).toBeVisible();
  await expect(page.locator('[data-workshop-item-id="terminal-plate-rustline"]')).toContainText('RUSTLINE // FIELD WORN');

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('wreckmarch.progression.v3') || '{}'));
  expect(persisted.workshopScrip).toBe(0);
  expect(persisted.ownedWorkshopItemIds).toEqual(['terminal-plate-rustline']);
});

test('Workshop does not allow a purchase when Scrip is insufficient', async ({ page }) => {
  await page.addInitScript(profile => {
    localStorage.setItem('wreckmarch.progression.v3', JSON.stringify({ ...profile, workshopScrip: 1 }));
  }, baseProfile);
  await page.goto('/');
  await page.locator('[data-screen-id="shop"]').click();
  const buy = page.locator('[data-purchase-item-id="terminal-plate-rustline"]');
  await expect(buy).toBeDisabled();
  await expect(buy).toHaveText('NEED 1 SCRIP');
  await expect(page.locator('[data-stat="workshop-scrip"]')).toContainText('1');
});
