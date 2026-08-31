import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Heavy Rivets uses the canonical registry path in the final upgrade scene', async ({ page }) => {
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
      overclock: 5,
      'long-barrel': 4,
      'twin-riveter': 2,
      'fleet-feet': 4,
      'scrap-magnet': 4,
      'armor-plate': 4,
      'piercing-rivets': 3,
      'ricochet': 2
    });
    scene.level = 1;
    scene.rigSummoned = false;

    const beforeDamage = scene.primaryWeapon.damage;
    const baseDamage = scene.runStatState.state.base.weapon.damage;
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      scene.openUpgradeCards();
    } finally {
      Math.random = originalRandom;
    }
    await new Promise(resolve => setTimeout(resolve, 140));

    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const choiceIds = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const heavyIndex = choiceIds.indexOf('heavy-rivets');
    if (heavyIndex < 0) throw new Error(`Heavy Rivets missing from forced offer: ${choiceIds.join(',')}`);
    upgradeScene.choose(heavyIndex);
    await new Promise(resolve => setTimeout(resolve, 140));

    return {
      choiceIds,
      beforeDamage,
      damage: scene.primaryWeapon.damage,
      mirrorDamage: scene.damage,
      baseDamage,
      level: scene.upgradeLevels['heavy-rivets'],
      modifierIds: (scene.runStatState.state.modifiers.weapon.damage || []).map((modifier: any) => modifier.id)
    };
  });

  expect(result.choiceIds).toEqual(['heavy-rivets']);
  expect(result.level).toBe(1);
  expect(result.damage).toBeCloseTo(result.beforeDamage * 1.2);
  expect(result.mirrorDamage).toBeCloseTo(result.damage);
  expect(result.baseDamage).toBe(result.beforeDamage);
  expect(result.modifierIds).toContain('heavy-rivets@1:0');
});
