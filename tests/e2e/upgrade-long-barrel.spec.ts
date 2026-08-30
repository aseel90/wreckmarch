import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Long Barrel uses both canonical weapon modifiers in the final upgrade scene', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  const result = await page.evaluate(async () => {
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
      'armor-plate': 4
    });
    scene.level = 1;
    scene.rigSummoned = false;

    const beforeProjectileSpeed = scene.primaryWeapon.projectileSpeed;
    const beforeRange = scene.primaryWeapon.range;
    const baseProjectileSpeed = scene.runStatState.state.base.weapon.projectileSpeed;
    const baseRange = scene.runStatState.state.base.weapon.range;

    scene.openUpgradeCards();
    await new Promise(resolve => setTimeout(resolve, 140));

    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const choiceIds = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const longBarrelIndex = choiceIds.indexOf('long-barrel');
    if (longBarrelIndex < 0) throw new Error(`Long Barrel missing from forced offer: ${choiceIds.join(',')}`);
    upgradeScene.choose(longBarrelIndex);
    await new Promise(resolve => setTimeout(resolve, 140));

    return {
      choiceIds,
      beforeProjectileSpeed,
      beforeRange,
      projectileSpeed: scene.primaryWeapon.projectileSpeed,
      range: scene.primaryWeapon.range,
      baseProjectileSpeed,
      baseRange,
      level: scene.upgradeLevels['long-barrel'],
      projectileModifierIds: (scene.runStatState.state.modifiers.weapon.projectileSpeed || []).map((modifier: any) => modifier.id),
      rangeModifierIds: (scene.runStatState.state.modifiers.weapon.range || []).map((modifier: any) => modifier.id)
    };
  });

  expect(result.choiceIds).toEqual(['long-barrel']);
  expect(result.level).toBe(1);
  expect(result.projectileSpeed).toBeCloseTo(result.beforeProjectileSpeed * 1.18);
  expect(result.range).toBeCloseTo(result.beforeRange * 1.10);
  expect(result.baseProjectileSpeed).toBe(result.beforeProjectileSpeed);
  expect(result.baseRange).toBe(result.beforeRange);
  expect(result.projectileModifierIds).toContain('long-barrel@1:0');
  expect(result.rangeModifierIds).toContain('long-barrel@1:1');
});
