import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Call the Rig is offered at level 2 and delegates the summon to the canonical RigSystem', async ({ page }) => {
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
      'heavy-rivets': 5,
      'overclock': 5,
      'long-barrel': 4,
      'twin-riveter': 2,
      'fleet-feet': 3,
      'scrap-magnet': 4,
      'armor-plate': 4,
      'piercing-rivets': 3,
      'ricochet': 2,
      'shrapnel-impact': 2,
      'critical-rivet': 4,
      'field-repair': 3,
      'impact-shield': 2
    });
    scene.level = 2;
    scene.rigSummoned = false;
    scene.cart.setVisible(false).setActive(false);
    scene.openUpgradeCards();
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      if (!upgradeScene?.sys?.isActive?.()) return [];
      return (upgradeScene.choices || []).map((choice: any) => choice.id);
    }),
    { timeout: 10_000 }
  ).toEqual(['call-rig']);

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const index = (upgradeScene.choices || []).findIndex((choice: any) => choice.id === 'call-rig');
    if (index < 0) throw new Error('Call the Rig missing from forced offer');
    upgradeScene.choose(index);
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game.scene.getScene('Wreckmarch');
      return {
        upgradeLevel: scene.upgradeLevels['call-rig'] || 0,
        rigSummoned: Boolean(scene.rigSummoned),
        cartVisible: Boolean(scene.cart?.visible),
        fireDelay: scene.rigFireDelay,
        shots: scene.rigShots
      };
    }),
    { timeout: 10_000 }
  ).toEqual({ upgradeLevel: 1, rigSummoned: true, cartVisible: true, fireDelay: 920, shots: 1 });

  const availability = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const loadModule = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
    const runtime = await loadModule('/src/upgrades/upgrade-runtime.js?v=7');
    const choice = runtime.createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' });
    return choice.available();
  });
  expect(availability).toBe(false);
});
