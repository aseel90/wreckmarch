import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Shrapnel Impact emits bounded secondary rivet fragments that damage a nearby new enemy', async ({ page }) => {
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
      ricochet: 99,
      'critical-rivet': 99
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
    const index = choiceIds.indexOf('shrapnel-impact');
    if (index < 0) throw new Error(`Shrapnel Impact missing from forced offer: ${choiceIds.join(',')}`);
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
    const impactX = muzzle.x + 100;
    const impactY = muzzle.y - 1;
    first.setPosition(impactX, impactY);
    second.setPosition(impactX + 320, impactY + 260);
    for (const enemy of enemies) {
      enemy.setVelocity(0, 0);
      enemy.speed = 0;
      enemy.hp = 100;
      enemy.maxHp = 100;
    }

    const shot = scene.weaponSystem.fireHeroProjectile(0, 1);
    if (!shot?.bullet) throw new Error('Hero projectile was not created');
    const bullet = shot.bullet;
    const initialShrapnelCount = bullet.shrapnelCount;

    bullet.setVelocity?.(0, 0);
    bullet.body.velocity.x = 800;
    bullet.body.velocity.y = 0;
    bullet.prevX = muzzle.x;
    bullet.prevY = impactY;
    bullet.x = muzzle.x + 170;
    bullet.y = impactY;
    scene.projectileSystem.update(16);

    const fragments = scene.bullets.getChildren().filter((candidate: any) => candidate?.active && candidate.projectileKind === 'shrapnel');
    const fragmentSnapshot = fragments.map((fragment: any) => ({
      damage: fragment.damage,
      life: fragment.life,
      pierceRemaining: fragment.pierceRemaining,
      ricochetRemaining: fragment.ricochetRemaining,
      shrapnelCount: fragment.shrapnelCount,
      secondary: fragment.isSecondaryProjectile === true,
      excludesFirst: fragment.hitEnemies?.has?.(first) === true,
      vx: fragment.body?.velocity?.x || 0,
      vy: fragment.body?.velocity?.y || 0
    }));

    const positive = fragments.find((fragment: any) => (fragment.body?.velocity?.y || 0) > 0);
    if (!positive) throw new Error('Expected a positive-angle shrapnel fragment');
    const shrapnelSpeed = Math.hypot(positive.body?.velocity?.x || 0, positive.body?.velocity?.y || 0) || 1;
    const shrapnelDirX = (positive.body?.velocity?.x || 0) / shrapnelSpeed;
    const shrapnelDirY = (positive.body?.velocity?.y || 0) / shrapnelSpeed;
    second.setPosition(positive.x + shrapnelDirX * 105, positive.y + shrapnelDirY * 105);
    positive.prevX = positive.x;
    positive.prevY = positive.y;
    positive.x = second.x;
    positive.y = second.y;
    scene.projectileSystem.update(16);

    return {
      choiceIds,
      artKey,
      level: scene.upgradeLevels['shrapnel-impact'],
      shrapnelCount: scene.runStatState.resolve().weapon.shrapnelCount,
      initialShrapnelCount,
      iconExists: scene.textures.exists('upgrade-icon-shrapnel-impact'),
      cardArtReady: scene.__upgradeCardArtReady === true,
      sourceActive: bullet.active ?? false,
      fragmentSnapshot,
      enemyHp: enemies.map((enemy: any) => enemy.hp),
      positiveActive: positive.active ?? false
    };
  });

  expect(result.choiceIds).toEqual(['shrapnel-impact']);
  expect(result.artKey).toBe('upgrade-icon-shrapnel-impact');
  expect(result.iconExists).toBe(true);
  expect(result.cardArtReady).toBe(true);
  expect(result.level).toBe(1);
  expect(result.shrapnelCount).toBe(2);
  expect(result.initialShrapnelCount).toBe(2);
  expect(result.sourceActive).toBe(false);
  expect(result.fragmentSnapshot).toHaveLength(2);
  expect(result.fragmentSnapshot.every((fragment: any) => fragment.secondary)).toBe(true);
  expect(result.fragmentSnapshot.every((fragment: any) => fragment.excludesFirst)).toBe(true);
  expect(result.fragmentSnapshot.every((fragment: any) => fragment.pierceRemaining === 0)).toBe(true);
  expect(result.fragmentSnapshot.every((fragment: any) => fragment.ricochetRemaining === 0)).toBe(true);
  expect(result.fragmentSnapshot.every((fragment: any) => fragment.shrapnelCount === 0)).toBe(true);
  expect(result.fragmentSnapshot.every((fragment: any) => Math.abs(fragment.damage - 8.4) < .001)).toBe(true);
  expect(result.enemyHp[0]).toBe(76);
  expect(result.enemyHp[1]).toBeCloseTo(91.6, 4);
  expect(result.positiveActive).toBe(false);
});
