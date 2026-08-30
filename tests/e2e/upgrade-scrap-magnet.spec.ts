import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

const BASE_MAGNET_RADIUS = 135;
const LEVEL_PERCENT = .25;

function expectedMultiplier(level: number) {
  return (1 + LEVEL_PERCENT) ** level;
}

test('Scrap Magnet uses canonical pickup radius stats in the final upgrade scene', async ({ page }) => {
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
      'long-barrel': 4,
      'twin-riveter': 2,
      'fleet-feet': 3,
      'armor-plate': 4
    });
    scene.level = 1;
    scene.rigSummoned = false;

    scene.scraps.clear(true, true);
    const probe = scene.scraps.create(scene.hero.x + 150, scene.hero.y, 'scrap');
    probe.setVelocity(0, 0);
    scene.updateScrapMagnet();

    const snapshot = {
      magnetRadius: scene.magnetRadius,
      baseMultiplier: scene.runStatState.state.base.character.pickupRadiusMultiplier,
      resolvedMultiplier: scene.runCombatStats.pickupRadiusMultiplier,
      probeSpeed: Math.hypot(probe.body.velocity.x, probe.body.velocity.y)
    };
    scene.__scrapMagnetProbe = probe;
    scene.openUpgradeCards();
    return snapshot;
  });

  expect(before.magnetRadius).toBe(BASE_MAGNET_RADIUS);
  expect(before.baseMultiplier).toBe(1);
  expect(before.resolvedMultiplier).toBe(1);
  expect(before.probeSpeed).toBe(0);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      if (!upgradeScene?.sys?.isActive?.()) return [];
      return (upgradeScene.choices || []).map((choice: any) => choice.id);
    }),
    { timeout: 10_000 }
  ).toEqual(['scrap-magnet']);

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const ids = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const index = ids.indexOf('scrap-magnet');
    if (index < 0) throw new Error(`Scrap Magnet missing from forced offer: ${ids.join(',')}`);
    upgradeScene.choose(index);
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game.scene.getScene('Wreckmarch');
      return scene.upgradeLevels['scrap-magnet'] || 0;
    }),
    { timeout: 10_000 }
  ).toBe(1);

  const levelOne = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const probe = scene.__scrapMagnetProbe;
    probe.setPosition(scene.hero.x + 150, scene.hero.y);
    probe.setVelocity(0, 0);
    scene.updateScrapMagnet();
    return {
      magnetRadius: scene.magnetRadius,
      multiplier: scene.runCombatStats.pickupRadiusMultiplier,
      effectiveRadius: scene.magnetRadius * scene.runCombatStats.pickupRadiusMultiplier,
      probeSpeed: Math.hypot(probe.body.velocity.x, probe.body.velocity.y),
      baseMultiplier: scene.runStatState.state.base.character.pickupRadiusMultiplier,
      modifiers: (scene.runStatState.state.modifiers.character.pickupRadiusMultiplier || []).map((modifier: any) => modifier.id)
    };
  });

  expect(levelOne.magnetRadius).toBe(BASE_MAGNET_RADIUS);
  expect(levelOne.multiplier).toBeCloseTo(expectedMultiplier(1));
  expect(levelOne.effectiveRadius).toBeCloseTo(BASE_MAGNET_RADIUS * expectedMultiplier(1));
  expect(levelOne.probeSpeed).toBeGreaterThan(0);
  expect(levelOne.baseMultiplier).toBe(1);
  expect(levelOne.modifiers).toContain('scrap-magnet@1:0');

  const final = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const loadModule = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
    const runtime = await loadModule('/src/upgrades/upgrade-runtime.js?v=6');
    const choice = runtime.createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' });
    const availableAtOne = choice.available();
    choice.apply();
    const multiplierAtTwo = scene.runCombatStats.pickupRadiusMultiplier;
    choice.apply();
    choice.apply();
    return {
      availableAtOne,
      availableAtMax: choice.available(),
      level: scene.upgradeLevels['scrap-magnet'],
      multiplierAtTwo,
      multiplier: scene.runCombatStats.pickupRadiusMultiplier,
      magnetRadius: scene.magnetRadius,
      baseMultiplier: scene.runStatState.state.base.character.pickupRadiusMultiplier,
      modifierIds: (scene.runStatState.state.modifiers.character.pickupRadiusMultiplier || []).map((modifier: any) => modifier.id)
    };
  });

  expect(final.availableAtOne).toBe(true);
  expect(final.availableAtMax).toBe(false);
  expect(final.level).toBe(4);
  expect(final.multiplierAtTwo).toBeCloseTo(expectedMultiplier(2));
  expect(final.multiplier).toBeCloseTo(expectedMultiplier(4));
  expect(final.magnetRadius).toBe(BASE_MAGNET_RADIUS);
  expect(final.baseMultiplier).toBe(1);
  expect(final.modifierIds).toEqual(['scrap-magnet@1:0', 'scrap-magnet@2:0', 'scrap-magnet@3:0', 'scrap-magnet@4:0']);
});
