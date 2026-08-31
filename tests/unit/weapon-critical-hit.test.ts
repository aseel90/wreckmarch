import { describe, expect, it, vi } from 'vitest';
import { WeaponSystem, resolveHeroCriticalHit } from '../../src/combat/weapon-system.js';

describe('Hero critical hit combat support', () => {
  it('resolves deterministic bounded crit rolls from combat stats', () => {
    expect(resolveHeroCriticalHit({ critChance: 0, critDamageMultiplier: 1.5 }, () => 0)).toMatchObject({
      isCritical: false,
      critChance: 0,
      critDamageMultiplier: 1.5,
      roll: null,
      damageMultiplier: 1
    });
    expect(resolveHeroCriticalHit({ critChance: 0.05, critDamageMultiplier: 1.5 }, () => 0.049)).toMatchObject({
      isCritical: true,
      damageMultiplier: 1.5
    });
    expect(resolveHeroCriticalHit({ critChance: 0.05, critDamageMultiplier: 1.5 }, () => 0.05)).toMatchObject({
      isCritical: false,
      damageMultiplier: 1
    });
    expect(resolveHeroCriticalHit({ critChance: 9, critDamageMultiplier: 0.5 }, () => 0.9)).toMatchObject({
      isCritical: true,
      critChance: 1,
      critDamageMultiplier: 1
    });
    expect(() => resolveHeroCriticalHit({ critChance: 0.1 }, () => 1)).toThrow(/\[0, 1\)/);
  });

  it('rolls once per Hero projectile, annotates the projectile, and leaves support volleys non-critical', () => {
    const spawned: any[] = [];
    const projectileSystem = {
      spawn: vi.fn((config: any) => {
        const bullet: any = { ...config };
        spawned.push(bullet);
        return bullet;
      })
    };
    const scene: any = {
      hero: { x: 10, y: 20 },
      weaponAim: 0,
      primaryWeapon: { damage: 24, projectileSpeed: 720, muzzleDistance: 38 },
      runCombatStats: { critChance: 0.05, critDamageMultiplier: 1.5 },
      runStatState: { resolve: () => ({ weapon: {} }) }
    };
    const weaponSystem = new WeaponSystem(scene, { projectileSystem: projectileSystem as any });
    const rolls = [0.01, 0.9];
    weaponSystem.setRandomSource(() => rolls.shift() ?? 0.9);
    weaponSystem.getMuzzle = () => ({ x: 40, y: 20 } as any);

    const critical = weaponSystem.fireHeroProjectile(0, 1)?.bullet as any;
    const normal = weaponSystem.fireHeroProjectile(0, 1)?.bullet as any;
    const support = weaponSystem.fireSupportVolley({ originX: 0, originY: 0, angle: 0, damage: 24 })[0].bullet as any;

    expect(critical.damage).toBe(36);
    expect(critical.baseDamage).toBe(24);
    expect(critical.isCritical).toBe(true);
    expect(critical.criticalDamageMultiplier).toBe(1.5);
    expect(critical.criticalRoll).toBe(0.01);
    expect(normal.damage).toBe(24);
    expect(normal.isCritical).toBe(false);
    expect(normal.criticalRoll).toBe(0.9);
    expect(support.damage).toBe(24);
    expect(support.isCritical).toBeUndefined();
    expect(projectileSystem.spawn).toHaveBeenCalledTimes(3);
  });
});
