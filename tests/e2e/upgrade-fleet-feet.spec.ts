import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

const BASE_MOVE_SPEED = 255;
const FLEET_PERCENT = 0.03;
const MOVE_SPEED_CAP = 280;

function expectedSpeed(level: number) {
  return Math.min(MOVE_SPEED_CAP, BASE_MOVE_SPEED * ((1 + FLEET_PERCENT) ** level));
}

test('Fleet Feet uses canonical character stats in the final upgrade scene', async ({ page }) => {
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
      'scrap-magnet': 4,
      'armor-plate': 4,
      'piercing-rivets': 3,
      'ricochet': 2,
      'shrapnel-impact': 2,
      'critical-rivet': 4
    });
    scene.level = 1;
    scene.rigSummoned = false;

    const snapshot = {
      heroSpeed: scene.heroSpeed,
      baseMoveSpeed: scene.runStatState.state.base.character.moveSpeed
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

  expect(before.heroSpeed).toBe(BASE_MOVE_SPEED);
  expect(before.baseMoveSpeed).toBe(BASE_MOVE_SPEED);

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      if (!upgradeScene?.sys?.isActive?.()) return [];
      return (upgradeScene.choices || []).map((choice: any) => choice.id);
    }),
    { timeout: 10_000 }
  ).toEqual(['fleet-feet']);

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const ids = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const index = ids.indexOf('fleet-feet');
    if (index < 0) throw new Error(`Fleet Feet missing from forced offer: ${ids.join(',')}`);
    upgradeScene.choose(index);
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const scene = game.scene.getScene('Wreckmarch');
      return scene.upgradeLevels['fleet-feet'] || 0;
    }),
    { timeout: 10_000 }
  ).toBe(1);

  const levelOne = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      heroSpeed: scene.heroSpeed,
      baseMoveSpeed: scene.runStatState.state.base.character.moveSpeed,
      modifiers: (scene.runStatState.state.modifiers.character.moveSpeed || []).map((modifier: any) => modifier.id),
      cap: scene.runStatState.state.caps.character.moveSpeed?.max
    };
  });

  expect(levelOne.heroSpeed).toBeCloseTo(expectedSpeed(1));
  expect(levelOne.baseMoveSpeed).toBe(BASE_MOVE_SPEED);
  expect(levelOne.modifiers).toContain('fleet-feet@1:0');
  expect(levelOne.cap).toBe(MOVE_SPEED_CAP);

  const final = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const loadModule = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
    const runtime = await loadModule('/src/upgrades/upgrade-runtime.js?v=6');
    const choice = runtime.createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' });
    const availableAtOne = choice.available();
    choice.apply();
    const speedAtTwo = scene.heroSpeed;
    choice.apply();
    return {
      availableAtOne,
      availableAtMax: choice.available(),
      level: scene.upgradeLevels['fleet-feet'],
      speedAtTwo,
      heroSpeed: scene.heroSpeed,
      baseMoveSpeed: scene.runStatState.state.base.character.moveSpeed,
      modifierIds: (scene.runStatState.state.modifiers.character.moveSpeed || []).map((modifier: any) => modifier.id),
      cap: scene.runStatState.state.caps.character.moveSpeed?.max
    };
  });

  expect(final.availableAtOne).toBe(true);
  expect(final.availableAtMax).toBe(false);
  expect(final.level).toBe(3);
  expect(final.speedAtTwo).toBeCloseTo(expectedSpeed(2));
  expect(final.heroSpeed).toBeCloseTo(expectedSpeed(3));
  expect(final.baseMoveSpeed).toBe(BASE_MOVE_SPEED);
  expect(final.modifierIds).toEqual(['fleet-feet@1:0', 'fleet-feet@2:0', 'fleet-feet@3:0']);
  expect(final.cap).toBe(MOVE_SPEED_CAP);
});
