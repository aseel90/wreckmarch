import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_COMBAT_PROFILE, resolvePlayerContactHit } from '../../src/combat/player-damage-rules.js';

describe('player contact damage rules', () => {
  it('preserves the Runner baseline damage, invulnerability and knockback', () => {
    const result = resolvePlayerContactHit({
      currentHp: 100,
      lastHitAt: 0,
      now: 1000,
      enemyDamage: 10,
      heroX: 100,
      heroY: 50,
      enemyX: 80,
      enemyY: 50,
      profile: DEFAULT_PLAYER_COMBAT_PROFILE
    });

    expect(result).toMatchObject({
      ignored: false,
      appliedDamage: 10,
      nextHp: 90,
      killed: false,
      invulnerableUntil: 1450,
      knockbackX: 190,
      knockbackY: 0,
      knockbackUntil: 1140
    });
  });

  it('ignores contact during the 450ms Runner invulnerability window', () => {
    const result = resolvePlayerContactHit({
      currentHp: 90,
      lastHitAt: 1000,
      now: 1200,
      enemyDamage: 10,
      heroX: 0,
      heroY: 0,
      enemyX: -10,
      enemyY: 0,
      profile: DEFAULT_PLAYER_COMBAT_PROFILE
    });

    expect(result.ignored).toBe(true);
    expect(result.appliedDamage).toBe(0);
    expect(result.nextHp).toBe(90);
  });

  it('supports future tank-style damage and knockback resistance from data only', () => {
    const result = resolvePlayerContactHit({
      currentHp: 160,
      lastHitAt: 0,
      now: 1000,
      enemyDamage: 20,
      heroX: 10,
      heroY: 0,
      enemyX: 0,
      enemyY: 0,
      profile: {
        ...DEFAULT_PLAYER_COMBAT_PROFILE,
        incomingDamageMultiplier: .5,
        contactKnockbackMultiplier: .25
      }
    });

    expect(result.appliedDamage).toBe(10);
    expect(result.nextHp).toBe(150);
    expect(result.knockbackX).toBeCloseTo(47.5, 6);
    expect(result.knockbackY).toBeCloseTo(0, 6);
  });

  it('absorbs one valid hit with a shield charge before HP is reduced', () => {
    const result = resolvePlayerContactHit({ currentHp: 55, shieldCharges: 1, lastHitAt: 0, now: 1000, enemyDamage: 12, heroX: 0, heroY: 0, enemyX: -10, enemyY: 0, profile: DEFAULT_PLAYER_COMBAT_PROFILE });
    expect(result.shieldAbsorbed).toBe(true);
    expect(result.preventedDamage).toBe(12);
    expect(result.appliedDamage).toBe(0);
    expect(result.nextShieldCharges).toBe(0);
    expect(result.nextHp).toBe(55);
    expect(result.killed).toBe(false);
  });

  it('reports lethal contact without allowing negative HP', () => {
    const result = resolvePlayerContactHit({
      currentHp: 5,
      lastHitAt: -9999,
      now: 1000,
      enemyDamage: 10,
      heroX: 0,
      heroY: 0,
      enemyX: 0,
      enemyY: 0
    });

    expect(result.killed).toBe(true);
    expect(result.nextHp).toBe(0);
    expect(result.knockbackX).toBe(190);
  });
});
