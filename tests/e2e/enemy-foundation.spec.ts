import { expect, test } from '@playwright/test';

test('spawns the live Scrap Rat through Enemy Foundation without changing balance', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const state = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.fireDelay = 999999;
    scene.bullets?.clear?.(true, true);
    scene.enemies.clear(true, true);
    const beforeSerial = scene.enemySerial;
    scene.spawnEnemy(false);
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    return enemy ? {
      foundationReady: scene.__enemyFoundationReady === true,
      factoryReady: Boolean(scene.enemyFactory),
      spawnSystemReady: Boolean(scene.spawnSystem),
      dataset: document.documentElement.dataset.wreckmarchEnemyFoundation,
      enemyId: enemy.enemyId,
      definitionId: enemy.enemyDefinition?.id,
      behaviorKey: enemy.behaviorKey,
      variantKey: enemy.variantKey,
      damage: enemy.damage,
      scrapDrop: enemy.scrapDrop,
      maxHpMatchesHp: enemy.maxHp === enemy.hp,
      speedInLegacyRange: enemy.speed >= 88 && enemy.speed <= 122,
      hpMatchesLegacyFormula: Math.abs(enemy.hp - (54 + scene.runTime * 1.25)) < .01,
      serialAdvanced: scene.enemySerial === beforeSerial + 1,
      productionVisual: enemy.__scrapRatVisual === true,
      hitRadius: enemy.hitRadius
    } : null;
  });

  expect(state).toMatchObject({
    foundationReady: true,
    factoryReady: true,
    spawnSystemReady: true,
    dataset: 'active',
    enemyId: 'scrap-rat',
    definitionId: 'scrap-rat',
    behaviorKey: 'chase',
    variantKey: 'normal',
    damage: 10,
    scrapDrop: 1,
    maxHpMatchesHp: true,
    speedInLegacyRange: true,
    hpMatchesLegacyFormula: true,
    serialAdvanced: true,
    productionVisual: true,
    hitRadius: 24
  });
});
