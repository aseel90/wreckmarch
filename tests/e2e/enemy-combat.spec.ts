import { expect, test } from '@playwright/test';

test('routes the live Arcade bullet overlap through EnemyCombatSystem', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const setup = await page.evaluate(() => {
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

    enemy.setPosition(scene.hero.x + 170, scene.hero.y + 70);
    enemy.setVelocity(0, 0);
    enemy.speed = 0;
    enemy.hp = 54;
    enemy.maxHp = 54;

    const combat = scene.enemyCombatSystem;
    const baseHit = combat.hitByProjectile.bind(combat);
    scene.__combatTestLastHit = null;
    scene.__combatTestKill = null;
    combat.hitByProjectile = function(bullet: any, target: any) {
      const result = baseHit(bullet, target);
      scene.__combatTestLastHit = result;
      if (result?.killed) {
        scene.__combatTestKill = {
          bodyEnabled: target.body?.enable,
          drops: scene.scraps.getChildren().filter((object: any) => object?.active).length
        };
      }
      return result;
    };

    const colliders = scene.physics.world.colliders.getActive();
    const projectileColliders = colliders.filter((collider: any) =>
      (collider.object1 === scene.bullets && collider.object2 === scene.enemies) ||
      (collider.object1 === scene.enemies && collider.object2 === scene.bullets)
    );

    const bullet = scene.bullets.create(enemy.x, enemy.y, 'bullet');
    scene.__combatTestBullet = bullet;
    bullet.damage = 24;
    bullet.life = 1000;
    bullet.setVelocity(690, -120);

    return {
      ready: scene.__combatSystemReady === true,
      system: combat.constructor.name,
      projectileColliderCount: projectileColliders.length,
      colliderUsesLiveCallback: projectileColliders[0]?.collideCallback === scene.combatSystem.handleProjectileOverlap,
      enemyId: enemy.enemyId,
      productionVisual: enemy.__scrapRatVisual === true,
      profile: enemy.combatProfile
    };
  });

  expect(setup).toMatchObject({
    ready: true,
    system: 'EnemyCombatSystem',
    projectileColliderCount: 1,
    colliderUsesLiveCallback: true,
    enemyId: 'scrap-rat',
    productionVisual: true,
    profile: {
      incomingDamageMultiplier: 1,
      projectileKnockbackMultiplier: 1,
      hitFlashMs: 55
    }
  });

  await expect.poll(() => page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return scene.__combatTestLastHit?.appliedDamage ?? null;
  })).toBe(24);

  const nonLethal = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    return {
      hp: enemy?.hp,
      result: scene.__combatTestLastHit,
      testBulletActive: scene.__combatTestBullet?.active
    };
  });
  expect(nonLethal.hp).toBe(30);
  expect(nonLethal.testBulletActive).toBe(false);
  expect(nonLethal.result).toMatchObject({ appliedDamage: 24, killed: false, knockbackX: 34.5, knockbackY: -6 });

  await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    scene.scraps.clear(true, true);
    scene.__combatTestLastHit = null;
    enemy.hp = 10;
    enemy.setVelocity(0, 0);
    const bullet = scene.bullets.create(enemy.x, enemy.y, 'bullet');
    bullet.damage = 24;
    bullet.life = 1000;
    bullet.setVelocity(690, 0);
  });

  await expect.poll(() => page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return scene.__combatTestLastHit?.killed ?? false;
  })).toBe(true);

  const lethal = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return {
      ...scene.__combatTestKill,
      result: scene.__combatTestLastHit
    };
  });
  expect(lethal.result.killed).toBe(true);
  expect(lethal.bodyEnabled).toBe(false);
  expect(lethal.drops).toBe(1);
});
