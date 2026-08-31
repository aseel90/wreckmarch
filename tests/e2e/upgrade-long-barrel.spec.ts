import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Long Barrel uses both canonical weapon modifiers in the final upgrade scene', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  const before = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);

    Object.assign(scene.upgradeLevels, {
      'heavy-rivets': 5,
      'overclock': 5,
      'twin-riveter': 2,
      'fleet-feet': 4,
      'scrap-magnet': 4,
      'armor-plate': 4,
      'piercing-rivets': 3,
      'ricochet': 2
    });
    scene.level = 1;
    scene.rigSummoned = false;

    const snapshot = {
      projectileSpeed: scene.primaryWeapon.projectileSpeed,
      range: scene.primaryWeapon.range,
      baseProjectileSpeed: scene.runStatState.state.base.weapon.projectileSpeed,
      baseRange: scene.runStatState.state.base.weapon.range
    };

    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      scene.openUpgradeCards();
    } finally {
      Math.random = originalRandom;
    }
    return snapshot;
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      if (!upgradeScene?.sys?.isActive?.()) return [];
      return (upgradeScene.choices || []).map((choice: any) => choice.id);
    }),
    { timeout: 10_000 }
  ).toEqual(['long-barrel']);

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const choiceIds = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const index = choiceIds.indexOf('long-barrel');
    if (index < 0) throw new Error(`Long Barrel missing from forced offer: ${choiceIds.join(',')}`);
    upgradeScene.choose(index);
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      return game.scene.getScene('Wreckmarch').upgradeLevels['long-barrel'] || 0;
    }),
    { timeout: 10_000 }
  ).toBe(1);

  const result = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      projectileSpeed: scene.primaryWeapon.projectileSpeed,
      range: scene.primaryWeapon.range,
      mirrorProjectileSpeed: scene.projectileSpeed,
      baseProjectileSpeed: scene.runStatState.state.base.weapon.projectileSpeed,
      baseRange: scene.runStatState.state.base.weapon.range,
      level: scene.upgradeLevels['long-barrel'],
      projectileModifierIds: (scene.runStatState.state.modifiers.weapon.projectileSpeed || []).map((modifier: any) => modifier.id),
      rangeModifierIds: (scene.runStatState.state.modifiers.weapon.range || []).map((modifier: any) => modifier.id)
    };
  });

  expect(result.level).toBe(1);
  expect(result.projectileSpeed).toBeCloseTo(before.projectileSpeed * 1.18);
  expect(result.range).toBeCloseTo(before.range * 1.10);
  expect(result.baseProjectileSpeed).toBe(before.baseProjectileSpeed);
  expect(result.baseRange).toBe(before.baseRange);
  expect(result.baseProjectileSpeed).toBe(before.projectileSpeed);
  expect(result.baseRange).toBe(before.range);
  expect(result.projectileModifierIds).toContain('long-barrel@1:0');
  expect(result.rangeModifierIds).toContain('long-barrel@1:1');
});
