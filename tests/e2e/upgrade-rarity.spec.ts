import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Legendary rarity is shown by UpgradeSceneV4 and applies one scaled canonical level', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    Object.assign(scene.upgradeLevels, {
      'overclock': 5,
      'long-barrel': 4,
      'twin-riveter': 2,
      'fleet-feet': 4,
      'scrap-magnet': 4,
      'armor-plate': 4,
      'piercing-rivets': 3,
      'ricochet': 2,
      'shrapnel-impact': 2,
      'critical-rivet': 4
    });
    scene.level = 1;

    const originalRandom = Math.random;
    const values = [0, 0.999];
    Math.random = () => values.shift() ?? 0;
    try {
      scene.openUpgradeCards();
    } finally {
      Math.random = originalRandom;
    }
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      if (!upgradeScene?.sys?.isActive?.()) return null;
      const choice = upgradeScene.choices?.[0];
      const card = upgradeScene.cards?.[0];
      return {
        ids: (upgradeScene.choices || []).map((item: any) => item.id),
        rarity: choice?.rarity,
        power: choice?.rarityPowerMultiplier,
        badge: card?.rarityText?.text || ''
      };
    }),
    { timeout: 10_000 }
  ).toEqual({
    ids: ['heavy-rivets'],
    rarity: 'LEGENDARY',
    power: 1.5,
    badge: 'LEGENDARY • 150% POWER'
  });

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    game.scene.getScene('UpgradeSceneV4').choose(0);
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game.scene.getScene('Wreckmarch');
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      return {
        upgradeOpen: Boolean(scene.upgradeOpen),
        upgradeSceneActive: Boolean(upgradeScene?.sys?.isActive?.())
      };
    }),
    { timeout: 10_000 }
  ).toEqual({ upgradeOpen: false, upgradeSceneActive: false });

  const result = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const baseDamage = scene.runStatState.state.base.weapon.damage;
    return {
      level: scene.upgradeLevels['heavy-rivets'],
      rarityHistory: scene.upgradeRarityHistory?.['heavy-rivets'] || [],
      modifierValue: scene.runStatState.state.modifiers.weapon.damage?.[0]?.value,
      baseDamage,
      damage: scene.primaryWeapon.damage
    };
  });

  expect(result.level).toBe(1);
  expect(result.rarityHistory).toEqual(['LEGENDARY']);
  expect(result.modifierValue).toBeCloseTo(0.3);
  expect(result.damage).toBeCloseTo(result.baseDamage * 1.3);
});
