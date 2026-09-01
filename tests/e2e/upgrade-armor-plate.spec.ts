import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

const BASE_MAX_HP = 100;

function expectedMaxHp(level: number) {
  return BASE_MAX_HP + 15 * level;
}

test('Armor Plate applies canonical max HP and restore HP in the final upgrade scene', async ({ page }) => {
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
      'scrap-magnet': 4,
      'piercing-rivets': 3,
      'ricochet': 2,
      'shrapnel-impact': 2,
      'critical-rivet': 4,
      'field-repair': 3,
      'impact-shield': 2,
      'explosive-rivet': 3
    });
    scene.level = 1;
    scene.rigSummoned = false;
    scene.heroHp = 50;
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      scene.openUpgradeCards();
    } finally {
      Math.random = originalRandom;
    }

    return {
      heroHp: scene.heroHp,
      heroMaxHp: scene.heroMaxHp,
      baseMaxHp: scene.runStatState.state.base.character.maxHp
    };
  });

  expect(before).toEqual({ heroHp: 50, heroMaxHp: BASE_MAX_HP, baseMaxHp: BASE_MAX_HP });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      const upgradeScene = game.scene.getScene('UpgradeSceneV4');
      if (!upgradeScene?.sys?.isActive?.()) return [];
      return (upgradeScene.choices || []).map((choice: any) => choice.id);
    }),
    { timeout: 10_000 }
  ).toEqual(['armor-plate']);

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const upgradeScene = game.scene.getScene('UpgradeSceneV4');
    const ids = (upgradeScene.choices || []).map((choice: any) => choice.id);
    const index = ids.indexOf('armor-plate');
    if (index < 0) throw new Error(`Armor Plate missing from forced offer: ${ids.join(',')}`);
    upgradeScene.choose(index);
  });

  await expect.poll(
    () => page.evaluate(() => {
      const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
      return game.scene.getScene('Wreckmarch').upgradeLevels['armor-plate'] || 0;
    }),
    { timeout: 10_000 }
  ).toBe(1);

  const levelOne = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      heroHp: scene.heroHp,
      heroMaxHp: scene.heroMaxHp,
      baseMaxHp: scene.runStatState.state.base.character.maxHp,
      modifierIds: (scene.runStatState.state.modifiers.character.maxHp || []).map((modifier: any) => modifier.id)
    };
  });

  expect(levelOne.heroMaxHp).toBe(expectedMaxHp(1));
  expect(levelOne.heroHp).toBe(65);
  expect(levelOne.baseMaxHp).toBe(BASE_MAX_HP);
  expect(levelOne.modifierIds).toEqual(['armor-plate@1:0']);

  const final = await page.evaluate(async () => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const loadModule = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
    const runtime = await loadModule('/src/upgrades/upgrade-runtime.js?v=6');
    const choice = runtime.createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' });
    const availableAtOne = choice.available();
    choice.apply();
    const levelTwo = { heroHp: scene.heroHp, heroMaxHp: scene.heroMaxHp };
    choice.apply();
    choice.apply();
    return {
      availableAtOne,
      availableAtMax: choice.available(),
      level: scene.upgradeLevels['armor-plate'],
      levelTwo,
      heroHp: scene.heroHp,
      heroMaxHp: scene.heroMaxHp,
      baseMaxHp: scene.runStatState.state.base.character.maxHp,
      modifierIds: (scene.runStatState.state.modifiers.character.maxHp || []).map((modifier: any) => modifier.id)
    };
  });

  expect(final.availableAtOne).toBe(true);
  expect(final.availableAtMax).toBe(false);
  expect(final.level).toBe(4);
  expect(final.levelTwo).toEqual({ heroHp: 80, heroMaxHp: expectedMaxHp(2) });
  expect(final.heroHp).toBe(110);
  expect(final.heroMaxHp).toBe(expectedMaxHp(4));
  expect(final.baseMaxHp).toBe(BASE_MAX_HP);
  expect(final.modifierIds).toEqual(['armor-plate@1:0', 'armor-plate@2:0', 'armor-plate@3:0', 'armor-plate@4:0']);
});
