import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Overclock uses the canonical registry path in the final upgrade scene', async ({ page }) => {
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
      'long-barrel': 4,
      'twin-riveter': 2,
      'fleet-feet': 4,
      'scrap-magnet': 4,
      'armor-plate': 4,
      'piercing-rivets': 3,
      'ricochet': 2,
      'shrapnel-impact': 2,
      'critical-rivet': 4,
      'field-repair': 3,
      'impact-shield': 2
    });
    scene.level = 1;
    scene.rigSummoned = false;

    const beforeDelay = scene.primaryWeapon.fireDelay;
    const baseDelay = scene.runStatState.state.base.weapon.fireDelay;
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
    const overclockIndex = choiceIds.indexOf('overclock');
    if (overclockIndex < 0) throw new Error(`Overclock missing from forced offer: ${choiceIds.join(',')}`);
    upgradeScene.choose(overclockIndex);
    await new Promise(resolve => setTimeout(resolve, 140));

    return {
      choiceIds,
      beforeDelay,
      fireDelay: scene.primaryWeapon.fireDelay,
      mirrorFireDelay: scene.fireDelay,
      baseDelay,
      level: scene.upgradeLevels.overclock,
      cap: scene.runStatState.state.caps.weapon.fireDelay,
      modifierIds: (scene.runStatState.state.modifiers.weapon.fireDelay || []).map((modifier: any) => modifier.id)
    };
  });

  expect(result.choiceIds).toEqual(['overclock']);
  expect(result.level).toBe(1);
  expect(result.fireDelay).toBeCloseTo(Math.max(145, result.beforeDelay / 1.12));
  expect(result.mirrorFireDelay).toBeCloseTo(result.fireDelay);
  expect(result.baseDelay).toBe(result.beforeDelay);
  expect(result.cap).toEqual({ min: 145 });
  expect(result.modifierIds).toContain('overclock@1:0');
});
