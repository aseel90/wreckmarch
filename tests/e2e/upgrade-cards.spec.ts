import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('upgrade cards use HD vector art and expose all rarity treatments', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const result = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.openUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 100));

    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const cards = (upgradeScene.cards || []).map((card: any) => ({
      texture: card.art?.texture?.key,
      frameWidth: card.art?.frame?.realWidth || 0,
      frameHeight: card.art?.frame?.realHeight || 0,
      rarity: card.rarity,
      rank: card.style?.rank,
      frameColor: card.style?.frame,
      glowAlpha: card.glow?.alpha
    }));
    const rarityValues = Object.values(scene.__d1CardRarity || {});
    scene.closeUpgradeCards();

    return {
      artSource: scene.__d1CardArtSource,
      premiumCards: scene.__d1PremiumCards,
      rarityValues,
      cards
    };
  });

  expect(result.artSource).toBe('c5-upgrade-sheet');
  expect(result.premiumCards).toBe(true);
  expect(new Set(result.rarityValues)).toEqual(new Set(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']));
  expect(result.cards).toHaveLength(3);
  for (const card of result.cards) {
    expect(card.texture).toBe('c5-upgrade-sheet');
    expect(card.frameWidth).toBeGreaterThanOrEqual(480);
    expect(card.frameHeight).toBeGreaterThanOrEqual(320);
    expect(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']).toContain(card.rarity);
    expect(card.rank).toBeGreaterThanOrEqual(0);
    expect(card.rank).toBeLessThanOrEqual(3);
    expect(card.frameColor).toBeGreaterThan(0);
  }
});
