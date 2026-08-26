import { describe, expect, it } from 'vitest';
import { SCRAP_RAT_DEFINITION } from '../../src/enemies/definitions/scrap-rat.js';
import { resolveEnemyProjectileHit, resolveEnemyScrapDropCount } from '../../src/combat/enemy-combat-rules.js';

const normalProfile = SCRAP_RAT_DEFINITION.combat;

describe('enemy combat foundation rules', () => {
  it('keeps current Scrap Rat projectile damage and knockback parity', () => {
    const result = resolveEnemyProjectileHit(
      { hp: 54, combatProfile: normalProfile },
      { damage: 24, velocityX: 690, velocityY: -120 }
    );
    expect(result.appliedDamage).toBe(24);
    expect(result.nextHp).toBe(30);
    expect(result.killed).toBe(false);
    expect(result.knockbackX).toBeCloseTo(34.5, 6);
    expect(result.knockbackY).toBeCloseTo(-6, 6);
  });

  it('reports lethal hits without mutating the enemy object', () => {
    const enemy = { hp: 20, combatProfile: normalProfile };
    const result = resolveEnemyProjectileHit(enemy, { damage: 24, velocityX: 0, velocityY: 0 });
    expect(result.killed).toBe(true);
    expect(result.nextHp).toBe(-4);
    expect(enemy.hp).toBe(20);
  });

  it('opens future per-enemy damage and knockback modifiers without changing Rat defaults', () => {
    const result = resolveEnemyProjectileHit(
      { hp: 100, combatProfile: { incomingDamageMultiplier: .5, projectileKnockbackMultiplier: .25 } },
      { damage: 40, velocityX: 400, velocityY: 0 }
    );
    expect(result.appliedDamage).toBe(20);
    expect(result.nextHp).toBe(80);
    expect(result.knockbackX).toBeCloseTo(5, 6);
  });

  it('uses canonical Scrap Rat drop counts with legacy fallback', () => {
    expect(resolveEnemyScrapDropCount({ scrapDrop: 1, elite: false })).toBe(1);
    expect(resolveEnemyScrapDropCount({ scrapDrop: 3, elite: true })).toBe(3);
    expect(resolveEnemyScrapDropCount({ elite: false })).toBe(1);
    expect(resolveEnemyScrapDropCount({ elite: true })).toBe(3);
  });

  it('keeps the current hit flash duration in the enemy definition', () => {
    expect(SCRAP_RAT_DEFINITION.combat).toEqual({
      incomingDamageMultiplier: 1,
      projectileKnockbackMultiplier: 1,
      hitFlashMs: 55
    });
  });
});
