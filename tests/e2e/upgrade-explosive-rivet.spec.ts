import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Explosive Rivet is offered by the final live upgrade pool and applies its canonical mechanical state', async ({ page }) => {
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
      overclock: 5,
      'long-barrel': 4,
      'twin-riveter': 2,
      'triple-riveter': 1,
      'fleet-feet': 4,
      'scrap-magnet': 4,
      'armor-plate': 4,
      'call-rig': 1,
      'piercing-rivets': 3,
      ricochet: 2,
      'shrapnel-impact': 2,
      'critical-rivet': 4,
      'field-repair': 3,
      'impact-shield': 2
    });
    scene.level = 2;
    scene.rigSummoned = true;

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
    const index = choiceIds.indexOf('explosive-rivet');
    if (index < 0) throw new Error(`Explosive Rivet missing from forced offer: ${choiceIds.join(',')}`);
    const artKey = upgradeScene.cards?.[index]?.art?.texture?.key || null;
    const iconExists = scene.textures.exists('upgrade-icon-explosive-rivet');
    const cardArtReady = scene.__upgradeCardArtReady === true;
    upgradeScene.choose(index);
    await new Promise(resolve => setTimeout(resolve, 140));

    return {
      choiceIds,
      artKey,
      iconExists,
      cardArtReady,
      level: scene.upgradeLevels['explosive-rivet'] || 0,
      state: scene.upgradeMechanicalState?.['explosive-rivet'] || null
    };
  });

  expect(result.choiceIds).toEqual(['explosive-rivet']);
  expect(result.artKey).toBe('upgrade-icon-explosive-rivet');
  expect(result.iconExists).toBe(true);
  expect(result.cardArtReady).toBe(true);
  expect(result.level).toBe(1);
  expect(result.state).toMatchObject({
    id: 'explosive-rivet',
    effectId: 'EXPLOSIVE_RIVET',
    level: 1,
    cadenceMs: 5000,
    damageCoefficient: 0.33,
    radius: 90,
    targetCap: 3
  });
});
