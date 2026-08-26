/* WRECKMARCH — pure combat rules for enemy hits and drops */

const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/**
 * Resolve projectile damage and knockback without mutating Phaser objects.
 * @param {{ hp?: number, combatProfile?: { incomingDamageMultiplier?: number, projectileKnockbackMultiplier?: number } }} enemy
 * @param {{ damage?: number, velocityX?: number, velocityY?: number, fallbackDamage?: number, baseKnockbackScale?: number }} hit
 */
export function resolveEnemyProjectileHit(enemy, {
  damage,
  velocityX = 0,
  velocityY = 0,
  fallbackDamage = 0,
  baseKnockbackScale = .05
} = {}) {
  const profile = enemy?.combatProfile || {};
  const currentHp = numberOr(enemy?.hp, 0);
  const incomingDamage = numberOr(damage, numberOr(fallbackDamage, 0));
  const damageMultiplier = Math.max(0, numberOr(profile.incomingDamageMultiplier, 1));
  const knockbackMultiplier = Math.max(0, numberOr(profile.projectileKnockbackMultiplier, 1));
  const appliedDamage = incomingDamage * damageMultiplier;
  const nextHp = currentHp - appliedDamage;
  const knockbackScale = Math.max(0, numberOr(baseKnockbackScale, .05)) * knockbackMultiplier;

  return Object.freeze({
    currentHp,
    incomingDamage,
    appliedDamage,
    nextHp,
    killed: nextHp <= 0,
    knockbackX: numberOr(velocityX, 0) * knockbackScale,
    knockbackY: numberOr(velocityY, 0) * knockbackScale
  });
}

/** @param {{ scrapDrop?: number, elite?: boolean }} enemy */
export function resolveEnemyScrapDropCount(enemy) {
  const explicit = Number(enemy?.scrapDrop);
  if (Number.isFinite(explicit)) return Math.max(0, Math.floor(explicit));
  return enemy?.elite ? 3 : 1;
}
