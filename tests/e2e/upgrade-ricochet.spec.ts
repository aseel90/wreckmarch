import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Ricochet redirects a Hunter rivet to a nearby valid enemy after final impact', async ({ page }) => {
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
    scene.fireDelay = 999999;
    scene.enemies.clear(true, true);
    scene.bullets.clear(true, true);
    scene.scraps.clear(true, true);

    Object.assign(scene.upgradeLevels, {
      'heavy-rivets': 99,
      overclock: 99,
      'long-barrel': 99,
      'twin-riveter': 99,
      'fleet-feet': 99,
      'scrap-magnet': 99,
      'armor-plate': 99,
      'call-rig': 99,
      'piercing-rivets': 99,
      'shrapnel-impact': 99,
      'critical-rivet': 99,
      'field-repair': 3,
      'impact-shield': 2,
      'explosive-rivet': 3
    });

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
    const index = choiceIds.indexOf('ricochet');
    if (index < 0) throw new Error(`Ricochet missing from forced offer: ${choiceIds.join(',')}`);
    const artKey = upgradeScene.cards?.[index]?.art?.texture?.key || null;
    upgradeScene.choose(index);
    await new Promise(resolve => setTimeout(resolve, 150));

    scene.enemies.clear(true, true);
    scene.bullets.clear(true, true);
    scene.spawnEnemy(false);
    scene.spawnEnemy(false);
    const enemies = scene.enemies.getChildren().filter((enemy: any) => enemy?.active).slice(0, 2);
    if (enemies.length !== 2) throw new Error(`Expected 2 enemies, got ${enemies.length}`);

    scene.weaponAim = 0;
    scene.updateWeaponPose?.();
    const muzzle = scene.weaponSystem.getMuzzle(0);
    const first = enemies[0];
    const second = enemies[1];
    first.setPosition(muzzle.x + 100, muzzle.y - 1);
    second.setPosition(muzzle.x + 100, muzzle.y + 120);
    for (const enemy of enemies) {
      enemy.setVelocity(0, 0);
      enemy.speed = 0;
      enemy.hp = 100;
      enemy.maxHp = 100;
    }

    const shot = scene.weaponSystem.fireHeroProjectile(0, 1);
    if (!shot?.bullet) throw new Error('Hero projectile was not created');
    const bullet = shot.bullet;
    const initialRicochetRemaining = bullet.ricochetRemaining;

    bullet.setVelocity?.(0, 0);
    bullet.body.velocity.x = 800;
    bullet.body.velocity.y = 0;
    bullet.prevX = muzzle.x;
    bullet.prevY = muzzle.y - 1;
    bullet.x = muzzle.x + 170;
    bullet.y = muzzle.y - 1;
    scene.projectileSystem.update(16);

    const afterRedirect = {
      x: bullet.x,
      y: bullet.y,
      vx: bullet.body?.velocity?.x || 0,
      vy: bullet.body?.velocity?.y || 0,
      ricochetRemaining: bullet.ricochetRemaining,
      active: bullet.active ?? false,
      hitCount: bullet.hitEnemies?.size ?? 0
    };

    bullet.prevX = first.x;
    bullet.prevY = first.y;
    bullet.x = second.x;
    bullet.y = second.y;
    scene.projectileSystem.update(16);

    return {
      choiceIds,
      artKey,
      level: scene.upgradeLevels.ricochet,
      ricochetCount: scene.runStatState.resolve().weapon.ricochetCount,
      initialRicochetRemaining,
      iconExists: scene.textures.exists('upgrade-icon-ricochet'),
      cardArtReady: scene.__upgradeCardArtReady === true,
      afterRedirect,
      enemyHp: enemies.map((enemy: any) => enemy.hp),
      bulletActive: bullet.active ?? false,
      hitCount: bullet.hitEnemies?.size ?? 0
    };
  });

  expect(result.choiceIds).toEqual(['ricochet']);
  expect(result.artKey).toBe('upgrade-icon-ricochet');
  expect(result.iconExists).toBe(true);
  expect(result.cardArtReady).toBe(true);
  expect(result.level).toBe(1);
  expect(result.ricochetCount).toBe(1);
  expect(result.initialRicochetRemaining).toBe(1);
  expect(result.afterRedirect.active).toBe(true);
  expect(result.afterRedirect.ricochetRemaining).toBe(0);
  expect(result.afterRedirect.hitCount).toBe(1);
  expect(Math.abs(result.afterRedirect.vy)).toBeGreaterThan(1);
  expect(result.enemyHp[0]).toBeCloseTo(76, 4);
  expect(result.enemyHp[1]).toBeCloseTo(88, 4);
  expect(result.bulletActive).toBe(false);
  expect(result.hitCount).toBe(2);
});
