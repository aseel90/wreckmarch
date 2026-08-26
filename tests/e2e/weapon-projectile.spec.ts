import { expect, test } from '@playwright/test';

test('WeaponSystem and ProjectileSystem own the live firing path', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 20_000 }
  ).toBe(true);

  const result = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    scene.spawnEvent.paused = true;
    scene.enemies.clear(true, true);
    scene.bullets.clear(true, true);

    const shots = scene.weaponSystem.fireSupportVolley({
      originX: scene.hero.x,
      originY: scene.hero.y,
      angle: 0,
      spreads: [0],
      muzzleDistance: 20,
      speed: 680,
      damage: 7,
      lifeMs: 1100,
      scale: .66
    });
    const bullet = shots[0]?.bullet;
    const snapshot = {
      weaponSystem: scene.weaponSystem?.constructor?.name,
      projectileSystem: scene.projectileSystem?.constructor?.name,
      weaponReady: scene.__weaponSystemReady === true,
      projectileReady: scene.__projectileSystemReady === true,
      noLegacyMethods: ['autoFire', 'findNearestEnemy', 'getWeaponMuzzle', 'fireHeroBullet', 'updateBullets']
        .every(name => typeof scene[name] === 'undefined'),
      finalMuzzleResolver: typeof scene.weaponSystem?.muzzleResolver === 'function',
      projectile: bullet ? {
        damage: bullet.damage,
        life: bullet.life,
        prevX: bullet.prevX,
        prevY: bullet.prevY,
        velocityX: bullet.body?.velocity?.x
      } : null
    };
    bullet?.destroy?.();
    return snapshot;
  });

  expect(result).toMatchObject({
    weaponSystem: 'WeaponSystem',
    projectileSystem: 'ProjectileSystem',
    weaponReady: true,
    projectileReady: true,
    noLegacyMethods: true,
    finalMuzzleResolver: true,
    projectile: { damage: 7, life: 1100 }
  });
  expect(result.projectile?.velocityX).toBeCloseTo(680, 3);
  expect(result.projectile?.prevX).toBeGreaterThan(0);
  expect(result.projectile?.prevY).toBeGreaterThan(0);
});
