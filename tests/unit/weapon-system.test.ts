import { describe, expect, it, vi } from 'vitest';
import { WeaponSystem } from '../../src/combat/weapon-system.js';

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
