/* WRECKMARCH — enemy construction boundary */
import { getEnemyDefinition } from './enemy-registry.js';

function fallbackBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function resolveEnemySpawnStats(definition, { elite = false, runTime = 0, randomBetween = fallbackBetween } = {}) {
  const variantKey = elite ? 'elite' : 'normal';
  const variant = definition.variants[variantKey];
  if (!variant) throw new Error(`Enemy ${definition.id} has no ${variantKey} variant`);
  const elapsed = Math.max(0, Number(runTime) || 0);
  return {
    variantKey,
    hp: variant.hpBase + elapsed * variant.hpPerSecond,
    speed: randomBetween(variant.speedMin, variant.speedMax),
    damage: variant.contactDamage,
    scrapDrop: variant.scrapDrop
  };
}

export class EnemyFactory {
  constructor(scene, { randomBetween } = {}) {
    this.scene = scene;
    this.randomBetween = randomBetween || ((min, max) => globalThis.Phaser?.Math?.Between?.(min, max) ?? fallbackBetween(min, max));
  }

  create(enemyId, { elite = false, x, y, runTime = this.scene.runTime } = {}) {
    const definition = getEnemyDefinition(enemyId);
    const stats = resolveEnemySpawnStats(definition, {
      elite,
      runTime,
      randomBetween: this.randomBetween
    });
    const bootstrap = definition.bootstrap;
    const enemy = this.scene.enemies.create(x, y, bootstrap.texture)
      .setDepth(bootstrap.depth)
      .setScale(elite ? bootstrap.scale.elite : bootstrap.scale.normal);

    enemy.play(bootstrap.animation);
    enemy.name = `${definition.naming.prefix}-${this.scene.enemySerial++}`;
    enemy.setCircle(bootstrap.physics.radius, bootstrap.physics.offsetX, bootstrap.physics.offsetY);
    enemy.enemyId = definition.id;
    enemy.enemyDefinition = definition;
    enemy.behaviorKey = definition.behavior;
    enemy.variantKey = stats.variantKey;
    enemy.hp = stats.hp;
    enemy.maxHp = stats.hp;
    enemy.speed = stats.speed;
    enemy.damage = stats.damage;
    enemy.scrapDrop = stats.scrapDrop;
    enemy.elite = elite;
    if (elite && bootstrap.eliteTint != null) enemy.setTint(bootstrap.eliteTint);
    return enemy;
  }
}
