import { describe, expect, it, vi } from 'vitest';
import { WeaponSystem, buildSymmetricSpreadOffsets } from '../../src/combat/weapon-system.js';

function group(children: any[]) {
  return { children: { iterate: (fn: (item: any) => void) => children.forEach(fn) } };
}

describe('WeaponSystem', () => {
  it('owns nearest-enemy target acquisition', () => {
    const near = { active: true, hp: 10, x: 10, y: 0 };
    const far = { active: true, hp: 10, x: 80, y: 0 };
    const dead = { active: true, hp: 0, x: 1, y: 0 };
    const scene = { enemies: group([far, dead, near]) } as any;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });
    expect(system.acquireTarget(0, 0, 100)).toBe(near);
    expect(system.acquireTarget(0, 0, 5)).toBeNull();
  });

  it('resolves symmetric intrinsic spread volleys without inventing full damage per projectile', () => {
    expect(buildSymmetricSpreadOffsets(5, .3)).toEqual([-.3, -.15, 0, .14999999999999997, .3]);
    const scene = {
      enemies: group([]),
      primaryWeapon: {
        fireProfile: { projectileCount: 5, halfSpreadRadians: .3, volleyDamageMultiplier: 1.15 }
      }
    } as any;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });
    const profile = system.heroVolleyProfile();
    expect(profile.source).toBe('weapon');
    expect(profile.projectileCount).toBe(5);
    expect(profile.volleyDamageMultiplier).toBeCloseTo(1.15, 8);
    expect(profile.projectileDamageScale).toBeCloseTo(.23, 8);
    expect(profile.spreads).toHaveLength(5);
    expect(profile.spreads[0]).toBeCloseTo(-.3, 8);
    expect(profile.spreads[2]).toBeCloseTo(0, 8);
    expect(profile.spreads[4]).toBeCloseTo(.3, 8);
  });

  it('keeps Rivet multishot mechanical state as the authoritative override', () => {
    const scene = {
      enemies: group([]),
      primaryWeapon: {
        fireProfile: { projectileCount: 5, halfSpreadRadians: .3, volleyDamageMultiplier: 1.15 }
      },
      upgradeMechanicalState: {
        'twin-riveter': { projectileCount: 2, projectileDamageScale: .7 }
      }
    } as any;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });
    const profile = system.heroVolleyProfile();
    expect(profile.source).toBe('upgrade');
    expect(profile.projectileCount).toBe(2);
    expect(profile.volleyDamageMultiplier).toBeCloseTo(1.4, 8);
    expect(profile.projectileDamageScale).toBeCloseTo(.7, 8);
    expect(profile.spreads).toEqual([-.055, .055]);
  });

  it('routes support volleys through ProjectileSystem only', () => {
    const spawn = vi.fn((options: any) => ({ options }));
    const scene = { enemies: group([]) } as any;
    const system = new WeaponSystem(scene, { projectileSystem: { spawn } as any });
    const shots = system.fireSupportVolley({
      originX: 100,
      originY: 200,
      angle: 0,
      spreads: [-.05, .05],
      muzzleDistance: 60,
      speed: 680,
      damage: 14,
      lifeMs: 1100,
      scale: .66
    });
    expect(shots).toHaveLength(2);
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(spawn.mock.calls[0][0]).toMatchObject({ speed: 680, damage: 14, lifeMs: 1100, scale: .66 });
  });
});
