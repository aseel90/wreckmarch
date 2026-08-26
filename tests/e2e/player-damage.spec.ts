import { expect, test } from '@playwright/test';

test('routes live hero contact through PlayerDamageSystem and preserves Runner invulnerability', async ({ page }) => {
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
    scene.heroHp = 100;
    scene.lastHeroHit = -99999;
    scene.heroKnockback.set(0, 0);
    scene.heroKnockbackUntil = 0;

    const system = scene.playerDamageSystem;
    const baseHit = system.hitByContact.bind(system);
    scene.__playerDamageTestHits = [];
    scene.__playerDamageFirstSnapshot = null;
    system.hitByContact = function(hero: any, enemy: any) {
      const result = baseHit(hero, enemy);
      scene.__playerDamageTestHits.push(result);
      if (result && !result.ignored && !scene.__playerDamageFirstSnapshot) {
        const immediateRepeat = baseHit(hero, enemy);
        scene.__playerDamageFirstSnapshot = {
          hp: scene.heroHp,
          result,
          immediateRepeat,
          repeatHp: scene.heroHp,
          knockbackX: scene.heroKnockback.x,
          knockbackY: scene.heroKnockback.y
        };
        enemy.setPosition(hero.x - 300, hero.y);
      }
      return result;
    };

    scene.spawnEnemy(false);
    const enemy = scene.enemies.getChildren().find((object: any) => object?.active);
    if (!enemy) return null;
    enemy.speed = 0;
    enemy.damage = 10;
    enemy.setVelocity(0, 0);
    enemy.setPosition(scene.hero.x - 18, scene.hero.y);

    const colliders = scene.physics.world.colliders.getActive();
    const contactColliders = colliders.filter((collider: any) =>
      (collider.object1 === scene.hero && collider.object2 === scene.enemies) ||
      (collider.object1 === scene.enemies && collider.object2 === scene.hero)
    );

    return {
      ready: scene.__combatSystemReady === true,
      system: system.constructor.name,
      contactColliderCount: contactColliders.length,
      colliderUsesLiveCallback: contactColliders[0]?.collideCallback === scene.combatSystem.handlePlayerContact,
      characterId: scene.characterId,
      profile: scene.playerCombatProfile
    };
  });

  expect(setup).toMatchObject({
    ready: true,
    system: 'PlayerDamageSystem',
    contactColliderCount: 1,
    colliderUsesLiveCallback: true,
    characterId: 'runner',
    profile: {
      incomingDamageMultiplier: 1,
      contactKnockbackMultiplier: 1,
      invulnerabilityMs: 450,
      contactKnockbackStrength: 190,
      contactKnockbackDurationMs: 140
    }
  });

  await expect.poll(() => page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return scene.__playerDamageTestHits.find((result: any) => result && !result.ignored)?.appliedDamage ?? null;
  })).toBe(10);

  const firstHit = await page.evaluate(() => {
    const game = (window as typeof window & { __WM_GAME__?: any }).__WM_GAME__;
    const scene = game.scene.getScene('Wreckmarch');
    return scene.__playerDamageFirstSnapshot;
  });

  expect(firstHit.hp).toBe(90);
  expect(firstHit.result).toMatchObject({ appliedDamage: 10, nextHp: 90, killed: false });
  expect(firstHit.result.knockbackX).toBeCloseTo(190, 2);
  expect(firstHit.result.knockbackY).toBeCloseTo(0, 2);
  expect(firstHit.knockbackX).toBeCloseTo(190, 2);
  expect(firstHit.repeatHp).toBe(90);
  expect(firstHit.immediateRepeat).toMatchObject({ ignored: true, appliedDamage: 0, nextHp: 90 });
});
