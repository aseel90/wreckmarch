/* WRECKMARCH — enemy behavior dispatch boundary */
import { getEnemyBehavior } from './enemy-behavior-registry.js';

export class EnemyBehaviorSystem {
  /**
   * @param {any} scene
   * @param {{ random?: () => number }} [options]
   */
  constructor(scene, { random = Math.random } = {}) {
    this.scene = scene;
    this.random = random;
  }

  updateEnemy(enemy, target = this.scene.hero) {
    if (!enemy?.active) return;
    const behaviorKey = enemy.behaviorKey || enemy.enemyDefinition?.behavior || 'chase';
    const behavior = getEnemyBehavior(behaviorKey);
    behavior({ scene: this.scene, enemy, target, random: this.random });
  }

  updateAll(group = this.scene.enemies, target = this.scene.hero) {
    group.children.iterate(enemy => this.updateEnemy(enemy, target));
  }
}
