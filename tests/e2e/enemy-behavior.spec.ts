import { expect, test } from '@playwright/test';

test('dispatches the live Scrap Rat through the chase behavior', async ({ page }) => {
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
    scene.spawnEnemy(false);
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    if (!enemy) return null;
    scene.enemyBehaviorSystem.random = () => 1;
    enemy.setPosition(scene.hero.x - 100, scene.hero.y);
    enemy.speed = 100;
    enemy.setVelocity(0, 0);
    scene.updateEnemies();
    return {
      ready: scene.__enemyBehaviorFoundationReady === true,
      behaviorKey: enemy.behaviorKey,
      enemyId: enemy.enemyId,
      vx: enemy.body.velocity.x,
      vy: enemy.body.velocity.y,
      flipX: enemy.flipX,
      productionVisual: enemy.__scrapRatVisual === true
    };
  });

  expect(state).not.toBeNull();
  expect(state).toMatchObject({
    ready: true,
    behaviorKey: 'chase',
    enemyId: 'scrap-rat',
    flipX: false,
    productionVisual: true
  });
  expect(state!.vx).toBeCloseTo(100, 3);
  expect(state!.vy).toBeCloseTo(0, 3);
});
