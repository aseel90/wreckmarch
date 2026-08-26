import { expect, test } from '@playwright/test';

test('routes live projectile damage, knockback, death and drops through EnemyCombatSystem', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const nonLethal = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.fireDelay = 999999;
    scene.bullets.clear(true, true);
    scene.enemies.clear(true, true);
    scene.scraps.clear(true, true);
    scene.spawnEnemy(false);
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    if (!enemy) return null;

    enemy.setPosition(scene.hero.x + 180, scene.hero.y + 80);
    enemy.setVelocity(0, 0);
    enemy.hp = 54;
    enemy.maxHp = 54;
    const bullet = scene.bullets.create(enemy.x - 30, enemy.y, 'bullet');
    bullet.damage = 24;
    bullet.setVelocity(690, -120);
    const result = scene.onBulletHit(bullet, enemy);

    return {
      system: scene.enemyCombatSystem?.constructor?.name,
      enemyId: enemy.enemyId,
      profile: enemy.combatProfile,
      hp: enemy.hp,
      result,
      bulletActive: bullet.active,
      velocityX: enemy.body.velocity.x,
      velocityY: enemy.body.velocity.y,
      tinted: enemy.isTinted === true,
      productionVisual: enemy.__scrapRatVisual === true
    };
  });

  expect(nonLethal).not.toBeNull();
  expect(nonLethal).toMatchObject({
    system: 'EnemyCombatSystem',
    enemyId: 'scrap-rat',
    profile: {
      incomingDamageMultiplier: 1,
      projectileKnockbackMultiplier: 1,
      hitFlashMs: 55
    },
    hp: 30,
    bulletActive: false,
    tinted: true,
    productionVisual: true
  });
  expect(nonLethal!.result.appliedDamage).toBe(24);
  expect(nonLethal!.result.killed).toBe(false);
  expect(nonLethal!.velocityX).toBeCloseTo(34.5, 3);
  expect(nonLethal!.velocityY).toBeCloseTo(-6, 3);

  await page.waitForTimeout(90);
  const tintCleared = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    return enemy ? { tinted: enemy.isTinted === true, alpha: enemy.alpha, hp: enemy.hp } : null;
  });
  expect(tintCleared).toMatchObject({ tinted: false, alpha: 1, hp: 30 });

  const lethal = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    if (!enemy) return null;
    scene.scraps.clear(true, true);
    enemy.hp = 10;
    enemy.setVelocity(0, 0);
    const bullet = scene.bullets.create(enemy.x - 20, enemy.y, 'bullet');
    bullet.damage = 24;
    bullet.setVelocity(690, 0);
    const result = scene.onBulletHit(bullet, enemy);
    return {
      result,
      bodyEnabled: enemy.body.enable,
      drops: scene.scraps.getChildren().filter((object: any) => object?.active).length,
      enemyActive: enemy.active
    };
  });

  expect(lethal).not.toBeNull();
  expect(lethal!.result.killed).toBe(true);
  expect(lethal).toMatchObject({ bodyEnabled: false, drops: 1, enemyActive: true });

  await page.waitForTimeout(230);
  const aliveAfterDeathTween = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return scene.enemies.getChildren().some((object: any) => object?.active && object.hp <= 0);
  });
  expect(aliveAfterDeathTween).toBe(false);
});
