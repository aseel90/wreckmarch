import { describe, expect, it, vi } from 'vitest';
import { CombatSystem } from '../../src/combat/combat-system.js';
import { resolveProjectileSecondaryDamageBudget } from '../../src/combat/projectile-system.js';

describe('Projectile secondary damage budget', () => {
  it('keeps each standalone crowd mechanic inside its Power Budget v1 soft cap', () => {
    const pierce = resolveProjectileSecondaryDamageBudget({ pierceCount: 3 });
    expect(pierce.pierceAddedDamage).toBeCloseTo(.9, 8);
    expect(pierce.piercePerHitDamageScale).toBeCloseTo(.3, 8);

    const ricochet = resolveProjectileSecondaryDamageBudget({ ricochetCount: 2 });
    expect(ricochet.ricochetAddedDamage).toBeCloseTo(.75, 8);
    expect(ricochet.ricochetPerHitDamageScale).toBeCloseTo(.375, 8);

    const shrapnel = resolveProjectileSecondaryDamageBudget({ shrapnelCount: 4 });
    expect(shrapnel.shrapnelAddedDamage).toBeCloseTo(.7, 8);
    expect(shrapnel.shrapnelPerFragmentDamageScale).toBeCloseTo(.175, 8);
  });

  it('shares one 1.50x added-damage budget when Pierce, Ricochet and Shrapnel are combined', () => {
    const budget = resolveProjectileSecondaryDamageBudget({ pierceCount: 3, ricochetCount: 2, shrapnelCount: 4 });
    expect(budget.requestedCombinedAddedDamage).toBeCloseTo(2.35, 8);
    expect(budget.combinedAddedDamage).toBeCloseTo(1.5, 8);
    expect(budget.combinedScale).toBeCloseTo(1.5 / 2.35, 8);
    expect(budget.pierceAddedDamage + budget.ricochetAddedDamage + budget.shrapnelAddedDamage).toBeCloseTo(1.5, 8);
  });

  it('switches a surviving pierced projectile to its reduced secondary damage after the first hit', () => {
    const scene: any = { damage: 24, projectileSystem: { spawnImpactShrapnel: vi.fn() } };
    const combat = new CombatSystem(scene);
    combat.enemy.hitByProjectile = vi.fn((bullet: any, enemy: any) => {
      bullet.hitEnemies.add(enemy);
      bullet.pierceRemaining -= 1;
      return { nextHp: 76, killed: false };
    });
    const bullet: any = {
      active: true,
      damage: 24,
      primaryDamage: 24,
      pierceRemaining: 2,
      pierceDamageScale: .3,
      ricochetRemaining: 0,
      shrapnelCount: 0,
      hitEnemies: new Set(),
      body: { velocity: { x: 760, y: 0 } }
    };

    combat.hitEnemyByProjectile(bullet, { active: true, x: 40, y: 0 });
    expect(bullet.damage).toBeCloseTo(7.2, 8);
    expect(bullet.projectilePath).toBe('pierce');
  });
});
