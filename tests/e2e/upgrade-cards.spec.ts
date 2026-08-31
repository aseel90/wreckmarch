import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('upgrade cards use compact gameplay icon art and expose all rarity treatments', async ({ page }) => {
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
    const choices = upgradeScene.choices || [];
    const cards = (upgradeScene.cards || []).map((card: any, index: number) => ({
      id: choices[index]?.id || null,
      texture: card.art?.texture?.key,
      frameWidth: card.art?.frame?.realWidth || 0,
      frameHeight: card.art?.frame?.realHeight || 0,
      rarity: card.rarity,
      badge: card.rarityText?.text || '',
      rank: card.style?.rank,
      frameColor: card.style?.frame,
      glowAlpha: card.glow?.alpha
    }));
    const choiceRarities = choices.map((choice: any) => choice.rarity);
    const rarityStyles = scene.__d1RarityStyles || [];
    const customArtReady = scene.__upgradeCardArtReady === true;
    scene.closeUpgradeCards();

    return {
      artSource: scene.__d1CardArtSource,
      premiumCards: scene.__d1PremiumCards,
      customArtReady,
      rarityStyles,
      choiceRarities,
      cards
    };
  });

  expect(result.artSource).toBe('c3-atlas-icons');
  expect(result.premiumCards).toBe(true);
  expect(result.customArtReady).toBe(true);
  expect(new Set(result.rarityStyles)).toEqual(new Set(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']));
  expect(result.cards.map((card: any) => card.rarity)).toEqual(result.choiceRarities);
  expect(result.cards).toHaveLength(3);
  for (const card of result.cards) {
    const expectedTexture = card.id === 'piercing-rivets'
      ? 'upgrade-icon-piercing-rivets'
      : card.id === 'ricochet'
        ? 'upgrade-icon-ricochet'
        : 'c3-atlas';
    expect(card.texture).toBe(expectedTexture);
    expect(card.frameWidth).toBeGreaterThanOrEqual(70);
    expect(card.frameHeight).toBeGreaterThanOrEqual(60);
    expect(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']).toContain(card.rarity);
    expect(card.badge).toContain(card.rarity);
    expect(card.badge).toContain('% POWER');
    expect(card.rank).toBeGreaterThanOrEqual(0);
    expect(card.rank).toBeLessThanOrEqual(3);
    expect(card.frameColor).toBeGreaterThan(0);
  }
});
