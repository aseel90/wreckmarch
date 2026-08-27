/* WRECKMARCH — enemy construction boundary */
import { getEnemyDefinition } from './enemy-registry.js?v=3';
import { getEnemyDifficultyMultipliers } from '../balance/run-balance.js?v=2';

function fallbackBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function resolveEnemySpawnStats(definition, { elite = false, runTime = 0, randomBetween = fallbackBetween, useRunBalance = false } = {}) {
  const variantKey = elite ? 'elite' : 'normal';
  const variant = definition.variants[variantKey];
  if (!variant) throw new Error(`Enemy ${definition.id} has no ${variantKey} variant`);
  const elapsed = Math.max(0, Number(runTime) || 0);
  const difficulty = useRunBalance ? getEnemyDifficultyMultipliers(elapsed) : null;
  const baseSpeed = randomBetween(variant.speedMin, variant.speedMax);
  return {
    variantKey,
    hp: useRunBalance ? variant.hpBase * difficulty.hp : variant.hpBase + elapsed * variant.hpPerSecond,
    speed: useRunBalance ? baseSpeed * difficulty.speed : baseSpeed,
    damage: useRunBalance ? variant.contactDamage * difficulty.damage : variant.contactDamage,
    scrapDrop: variant.scrapDrop
  };
}

export class EnemyFactory {
  /**
   * @param {any} scene
   * @param {{ randomBetween?: (min: number, max: number) => number }} [options]
   */
  constructor(scene, { randomBetween } = {}) {
    this.scene = scene;
    this.randomBetween = randomBetween || ((min, max) => globalThis.Phaser?.Math?.Between?.(min, max) ?? fallbackBetween(min, max));
  }

  /**
   * @param {string} enemyId
   * @param {{ elite?: boolean, x?: number, y?: number, runTime?: number }} [options]
   */
  create(enemyId, { elite = false, x, y, runTime = this.scene.runTime } = {}) {
    const definition = getEnemyDefinition(enemyId);
    const stats = resolveEnemySpawnStats(definition, {
      elite,
      runTime,
      randomBetween: this.randomBetween,
      useRunBalance: this.scene.__runBalanceEnabled === true
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
    enemy.behaviorConfig = definition.behaviorConfig || null;
    enemy.combatProfile = definition.combat;
    enemy.variantKey = stats.variantKey;
    enemy.hp = stats.hp;
    enemy.maxHp = stats.hp;
    enemy.speed = stats.speed;
    enemy.baseSpeed = stats.speed;
    enemy.damage = stats.damage;
    enemy.baseDamage = stats.damage;
    enemy.scrapDrop = stats.scrapDrop;
    enemy.threatValue = Number(definition.threatValue) || (elite ? 4 : 1);
    enemy.elite = elite;
    if (elite && bootstrap.eliteTint != null) enemy.setTint(bootstrap.eliteTint);
    return enemy;
  }
}
