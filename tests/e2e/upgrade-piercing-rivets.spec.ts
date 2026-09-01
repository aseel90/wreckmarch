import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Piercing Rivets upgrades the Rivet Gun and pierces two live enemies at level 1', async ({ page }) => {
  await page.goto('/?debug=1&autotest=1');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect.poll(
    () => page.evaluate(() => document.body.classList.contains('visual-ready')),
    { timeout: 30_000 }
  ).toBe(true);

  const setup = await page.evaluate(async () => {
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
      'ricochet': 99,
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
    const index = choiceIds.indexOf('piercing-rivets');
    if (index < 0) throw new Error(`Piercing Rivets missing from forced offer: ${choiceIds.join(',')}`);
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
    enemies.forEach((enemy: any, i: number) => {
      enemy.setPosition(muzzle.x + 90 + i * 90, muzzle.y - 1);
      enemy.setVelocity(0, 0);
      enemy.speed = 0;
      enemy.hp = 100;
      enemy.maxHp = 100;
    });

    const shot = scene.weaponSystem.fireHeroProjectile(0, 1);
    if (!shot?.bullet) throw new Error('Hero projectile was not created');
    const bullet = shot.bullet;
    const initialPierceRemaining = bullet.pierceRemaining;

    bullet.setVelocity?.(0, 0);
    bullet.prevX = muzzle.x;
    bullet.prevY = muzzle.y - 1;
    bullet.x = muzzle.x + 280;
    bullet.y = muzzle.y - 1;
    scene.projectileSystem.update(16);

    return {
      choiceIds,
      artKey,
      level: scene.upgradeLevels['piercing-rivets'],
      pierceCount: scene.runStatState.resolve().weapon.pierceCount,
      initialPierceRemaining,
      iconExists: scene.textures.exists('upgrade-icon-piercing-rivets'),
      cardArtReady: scene.__upgradeCardArtReady === true,
      enemyHp: enemies.map((enemy: any) => enemy.hp),
      bulletActive: bullet.active ?? false,
      hitCount: bullet.hitEnemies?.size ?? 0,
      pierceRemaining: bullet.pierceRemaining ?? null
    };
  });

  expect(setup.choiceIds).toEqual(['piercing-rivets']);
  expect(setup.artKey).toBe('upgrade-icon-piercing-rivets');
  expect(setup.iconExists).toBe(true);
  expect(setup.cardArtReady).toBe(true);
  expect(setup.level).toBe(1);
  expect(setup.pierceCount).toBe(1);
  expect(setup.initialPierceRemaining).toBe(1);
  expect(setup.enemyHp[0]).toBeCloseTo(76, 4);
  expect(setup.enemyHp[1]).toBeCloseTo(92.8, 4);
  expect(setup.bulletActive).toBe(false);
  expect(setup.hitCount).toBe(2);
  expect(setup.pierceRemaining).toBe(0);
});
