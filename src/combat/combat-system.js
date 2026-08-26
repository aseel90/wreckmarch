/* WRECKMARCH — authoritative live combat boundary */
import { EnemyCombatSystem } from './enemy-combat-system.js?v=1';
import { PlayerDamageSystem } from './player-damage-system.js?v=1';

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
    return this.enemy.hitByProjectile(bullet, enemy);
  }

  killEnemy(enemy) {
    return this.enemy.killEnemy(enemy);
  }

  damagePlayerByContact(hero, enemy) {
    return this.player.hitByContact(hero, enemy);
  }
}
