import { describe, expect, it } from 'vitest';
import { createRunStatState, mirrorResolvedRunStats } from '../../src/stats/run-stat-state.js';
import { STAT_MODIFIER_TYPES } from '../../src/stats/stat-resolver.js';

type ResolvedRunStats = {
  character: Record<string, number>;
  weapon: Record<string, number>;
};

describe('run stat state', () => {
  it('keeps character and weapon stat ownership separate', () => {
    const run = createRunStatState({
      characterBase: { maxHp: 100, moveSpeed: 255, critChance: 0 },
      weaponBase: { damage: 24, fireDelay: 390 }
    });
    run.state.modifiers.character.moveSpeed = [{ id: 'fleet', type: STAT_MODIFIER_TYPES.ADDITIVE_PERCENT, value: .03 }];
    run.state.modifiers.weapon.damage = [{ id: 'heavy', type: STAT_MODIFIER_TYPES.MULTIPLICATIVE_PERCENT, value: .2 }];
    const resolved = run.resolve() as ResolvedRunStats;
    expect(resolved.character.moveSpeed).toBeCloseTo(262.65);
    expect(resolved.weapon.damage).toBeCloseTo(28.8);
    expect(resolved.character).not.toHaveProperty('damage');
    expect(resolved.weapon).not.toHaveProperty('moveSpeed');
  });

  it('mirrors resolved values to legacy scene fields without changing ownership', () => {
    const scene: any = { damage: 24, fireDelay: 390, primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 } };
    const run = createRunStatState({
      characterBase: { maxHp: 100, moveSpeed: 255, armor: 0, critChance: 0, critDamageMultiplier: 1.5, pickupRadiusMultiplier: 1 },
      weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
    });
    const resolved = run.resolve() as ResolvedRunStats;
    mirrorResolvedRunStats(scene, resolved);
    expect(scene.heroMaxHp).toBe(100);
    expect(scene.heroSpeed).toBe(255);
    expect(scene.damage).toBe(24);
    expect(scene.fireDelay).toBe(390);
    expect(scene.resolvedRunStats).toBe(resolved);
    expect(scene.runCombatStats.critChance).toBe(0);
  });
});
