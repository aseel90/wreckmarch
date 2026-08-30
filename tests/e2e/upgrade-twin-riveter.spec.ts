import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

async function forceOnlyTwinRiveter(page: any) {
  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);

    Object.assign(scene.upgradeLevels, {
      'heavy-rivets': 5,
      'overclock': 5,
      'long-barrel': 4,
      'fleet-feet': 4,
      'scrap-magnet': 4,
      'armor-plate': 4
    });
    scene.level = 1;
    scene.rigSummoned = false;
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
  ).toEqual(['twin-riveter']);
}

async function chooseTwinRiveter(page: any) {
  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const choiceIds = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const index = choiceIds.indexOf('twin-riveter');
    if (index < 0) throw new Error(`Twin Riveter missing from forced offer: ${choiceIds.join(',')}`);
    upgradeScene.choose(index);
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
}

test('Twin Riveter uses the canonical mechanical upgrade path through both levels', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  // Prove the final UpgradeSceneV4 offers and applies the registered mechanical card.
  await forceOnlyTwinRiveter(page);
  await chooseTwinRiveter(page);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game.scene.getScene('Wreckmarch');
      return {
        level: scene.upgradeLevels['twin-riveter'] || 0,
        projectileCount: scene.upgradeMechanicalState?.['twin-riveter']?.projectileCount || 0,
        twinShots: scene.twinShots,
        spreads: scene.weaponSystem?.heroSpreads?.() || []
      };
    }),
    { timeout: 10_000 }
  ).toEqual({
    level: 1,
    projectileCount: 2,
    twinShots: 2,
    spreads: [-0.055, 0.055]
  });

  // The final card UI is wrapped by several legacy presentation phases. Reopening it
  // manually in the same synthetic level-up is not a real gameplay contract. Verify
  // level two through the same canonical registry adapter that the live card owns.
  const secondLevel = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const loadModule = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
    const runtime = await loadModule('/src/upgrades/upgrade-runtime.js?v=5');
    const choice = runtime.createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' });
    const availableBefore = choice.available();
    choice.apply();
    return {
      availableBefore,
      availableAfter: choice.available(),
      level: scene.upgradeLevels['twin-riveter'] || 0,
      projectileCount: scene.upgradeMechanicalState?.['twin-riveter']?.projectileCount || 0,
      twinShots: scene.twinShots,
      spreads: scene.weaponSystem?.heroSpreads?.() || []
    };
  });

  expect(secondLevel).toEqual({
    availableBefore: true,
    availableAfter: false,
    level: 2,
    projectileCount: 3,
    twinShots: 3,
    spreads: [-0.085, 0, 0.085]
  });
});
