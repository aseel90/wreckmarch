/* WRECKMARCH — authoritative live combat boundary */
import { EnemyCombatSystem } from './enemy-combat-system.js?v=7';
import { PlayerDamageSystem } from './player-damage-system.js?v=3';

export class CombatSystem {
  /** @param {any} scene */
  constructor(scene) {
    this.scene = scene;
    this.enemy = new EnemyCombatSystem(scene);
    this.player = new PlayerDamageSystem(scene);

    this.handleProjectileOverlap = (bullet, enemy) => this.hitEnemyByProjectile(bullet, enemy);
    this.handlePlayerContact = (hero, enemy) => this.damagePlayerByContact(hero, enemy);
  }

  installOverlaps() {
    const scene = this.scene;
    if (scene.__combatOverlapsInstalled) return;

    const activeColliders = scene.physics?.world?.colliders?.getActive?.() || [];
    for (const collider of activeColliders) {
      const projectilePair =
        (collider.object1 === scene.bullets && collider.object2 === scene.enemies) ||
        (collider.object1 === scene.enemies && collider.object2 === scene.bullets);
      const playerPair =
        (collider.object1 === scene.hero && collider.object2 === scene.enemies) ||
        (collider.object1 === scene.enemies && collider.object2 === scene.hero);
      if (projectilePair || playerPair) collider.destroy();
    }

    scene.__enemyProjectileOverlap = scene.physics.add.overlap(
      scene.bullets,
      scene.enemies,
      this.handleProjectileOverlap,
      undefined,
      this
    );
    scene.__playerEnemyOverlap = scene.physics.add.overlap(
      scene.hero,
      scene.enemies,
      this.handlePlayerContact,
      undefined,
      this
    );
    scene.__combatOverlapsInstalled = true;
  }

  hitEnemyByProjectile(bullet, enemy) {
    const hadPierce = Math.max(0, Math.floor(Number(bullet?.pierceRemaining) || 0)) > 0;
    const shrapnelCount = bullet?.isSecondaryProjectile || bullet?.shrapnelTriggered
      ? 0
      : Math.max(0, Math.floor(Number(bullet?.shrapnelCount) || 0));
    const velocityX = Number(bullet?.body?.velocity?.x) || 0;
    const velocityY = Number(bullet?.body?.velocity?.y) || 0;
    const shrapnelContext = shrapnelCount > 0 ? {
      x: Number(enemy?.x) || 0,
      y: Number(enemy?.y) || 0,
      angle: Math.atan2(velocityY, velocityX),
      speed: Math.hypot(velocityX, velocityY),
      damage: Number(bullet?.primaryDamage ?? bullet?.damage) || Number(this.scene.damage) || 0,
      count: shrapnelCount,
      damageScale: Number.isFinite(Number(bullet?.shrapnelDamageScale)) && Number(bullet?.shrapnelDamageScale) > 0
        ? Number(bullet.shrapnelDamageScale)
        : null,
      texture: bullet?.texture?.key || 'bullet'
    } : null;

    const result = this.enemy.hitByProjectile(bullet, enemy);
    if (result && hadPierce && bullet?.active) {
      const primaryDamage = Math.max(0, Number(bullet.primaryDamage ?? bullet.damage) || 0);
      const pierceDamageScale = Number(bullet.pierceDamageScale);
      if (Number.isFinite(pierceDamageScale) && pierceDamageScale >= 0) {
        bullet.damage = primaryDamage * pierceDamageScale;
        bullet.projectilePath = 'pierce';
      }
    }
    if (result && shrapnelContext) {
      bullet.shrapnelTriggered = true;
      this.scene.projectileSystem?.spawnImpactShrapnel?.({
        ...shrapnelContext,
        excludedEnemies: bullet?.hitEnemies instanceof Set ? bullet.hitEnemies : []
      });
    }
    const canRicochet = !hadPierce && result && bullet?.active && Math.max(0, Math.floor(Number(bullet.ricochetRemaining) || 0)) > 0;
    if (canRicochet) bullet.ricochetPending = { x: Number(enemy?.x) || 0, y: Number(enemy?.y) || 0 };
    return result;
  }

  killEnemy(enemy) {
    return this.enemy.killEnemy(enemy);
  }

  damagePlayerByContact(hero, enemy) {
    return this.player.hitByContact(hero, enemy);
  }
}
