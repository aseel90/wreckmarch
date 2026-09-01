import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 540 } });

test('Critical Rivet rolls Hero-projectile crits through canonical combat stats without affecting support fire', async ({ page }) => {
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
      'triple-riveter': 1,
      'fleet-feet': 99,
      'scrap-magnet': 99,
      'armor-plate': 99,
      'call-rig': 99,
      'piercing-rivets': 99,
      ricochet: 99,
      'shrapnel-impact': 99,
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
    const index = choiceIds.indexOf('critical-rivet');
    if (index < 0) throw new Error(`Critical Rivet missing from forced offer: ${choiceIds.join(',')}`);
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
    enemies[0].setPosition(muzzle.x + 105, muzzle.y - 1);
    enemies[1].setPosition(muzzle.x + 300, muzzle.y + 120);
    for (const enemy of enemies) {
      enemy.setVelocity(0, 0);
      enemy.speed = 0;
      enemy.hp = 100;
      enemy.maxHp = 100;
    }

    scene.weaponSystem.setRandomSource(() => 0.01);
    const critShot = scene.weaponSystem.fireHeroProjectile(0, 1);
    if (!critShot?.bullet) throw new Error('Critical Hero projectile was not created');
    const critical = critShot.bullet;
    critical.setVelocity?.(0, 0);
    critical.body.velocity.x = 800;
    critical.body.velocity.y = 0;
    critical.prevX = muzzle.x;
    critical.prevY = muzzle.y - 1;
    critical.x = muzzle.x + 170;
    critical.y = muzzle.y - 1;
    scene.projectileSystem.update(16);

    scene.weaponSystem.setRandomSource(() => 0.99);
    enemies[0].setPosition(muzzle.x + 300, muzzle.y - 120);
    enemies[1].setPosition(muzzle.x + 105, muzzle.y - 1);
    const normalShot = scene.weaponSystem.fireHeroProjectile(0, 1);
    if (!normalShot?.bullet) throw new Error('Normal Hero projectile was not created');
    const normal = normalShot.bullet;
    normal.setVelocity?.(0, 0);
    normal.body.velocity.x = 800;
    normal.body.velocity.y = 0;
    normal.prevX = muzzle.x;
    normal.prevY = muzzle.y - 1;
    normal.x = muzzle.x + 170;
    normal.y = muzzle.y - 1;
    scene.projectileSystem.update(16);

    const support = scene.weaponSystem.fireSupportVolley({
      originX: muzzle.x,
      originY: muzzle.y,
      angle: 0,
      damage: 24,
      spreads: [0]
    })[0].bullet;
    scene.weaponSystem.setRandomSource(Math.random);

    return {
      choiceIds,
      artKey,
      level: scene.upgradeLevels['critical-rivet'],
      critChance: scene.runCombatStats.critChance,
      critDamageMultiplier: scene.runCombatStats.critDamageMultiplier,
      iconExists: scene.textures.exists('upgrade-icon-critical-rivet'),
      cardArtReady: scene.__upgradeCardArtReady === true,
      critical: {
        isCritical: critical.isCritical,
        baseDamage: critical.baseDamage,
        damage: critical.damage,
        roll: critical.criticalRoll,
        active: critical.active ?? false
      },
      normal: {
        isCritical: normal.isCritical,
        baseDamage: normal.baseDamage,
        damage: normal.damage,
        roll: normal.criticalRoll,
        active: normal.active ?? false
      },
      support: {
        isCritical: support.isCritical ?? null,
        damage: support.damage
      },
      enemyHp: enemies.map((enemy: any) => enemy.hp)
    };
  });

  expect(result.choiceIds).toEqual(['critical-rivet']);
  expect(result.artKey).toBe('upgrade-icon-critical-rivet');
  expect(result.iconExists).toBe(true);
  expect(result.cardArtReady).toBe(true);
  expect(result.level).toBe(1);
  expect(result.critChance).toBeCloseTo(0.05);
  expect(result.critDamageMultiplier).toBeCloseTo(1.5);
  expect(result.critical).toMatchObject({ isCritical: true, baseDamage: 24, damage: 36, roll: 0.01, active: false });
  expect(result.normal).toMatchObject({ isCritical: false, baseDamage: 24, damage: 24, roll: 0.99, active: false });
  expect(result.support).toEqual({ isCritical: null, damage: 24 });
  expect(result.enemyHp[0]).toBe(64);
  expect(result.enemyHp[1]).toBe(76);
});
