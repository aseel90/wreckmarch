import { describe, expect, it } from 'vitest';
import { RIVET_GUN_WEAPON } from '../../src/combat/definitions/rivet-gun.js';
import { SHOTGUN_WEAPON } from '../../src/combat/definitions/shotgun.js';
import { createWeaponRuntimeState } from '../../src/combat/weapon-registry.js';
import { WeaponSystem, buildSymmetricSpreadOffsets } from '../../src/combat/weapon-system.js';

function group(children: any[]) {
  return { children: { iterate: (fn: (item: any) => void) => children.forEach(fn) } };
}

describe('WS14-B Shotgun candidate A1', () => {
  it('locks the coherent close-range burst package without changing Runner', () => {
    expect(SHOTGUN_WEAPON.stats).toEqual({
      damage: 24,
      fireDelay: 720,
      projectileSpeed: 760,
      range: 330,
      pierceCount: 0,
      ricochetCount: 0,
      shrapnelCount: 0
    });
    expect(SHOTGUN_WEAPON.fireProfile).toEqual({
      projectileCount: 5,
      halfSpreadRadians: 0.24,
      volleyDamageMultiplier: 1.75
    });
    expect(RIVET_GUN_WEAPON.stats).toMatchObject({ damage: 24, fireDelay: 390, range: 570 });
    expect(RIVET_GUN_WEAPON.fireProfile).toEqual({ projectileCount: 1, halfSpreadRadians: 0, volleyDamageMultiplier: 1 });
  });

  it('uses a deterministic compact symmetric five-pellet cone', () => {
    const spreads = buildSymmetricSpreadOffsets(
      SHOTGUN_WEAPON.fireProfile.projectileCount,
      SHOTGUN_WEAPON.fireProfile.halfSpreadRadians
    );
    expect(spreads).toHaveLength(5);
    expect(spreads[0]).toBeCloseTo(-0.24, 8);
    expect(spreads[1]).toBeCloseTo(-0.12, 8);
    expect(spreads[2]).toBeCloseTo(0, 8);
    expect(spreads[3]).toBeCloseTo(0.12, 8);
    expect(spreads[4]).toBeCloseTo(0.24, 8);
    expect((SHOTGUN_WEAPON.fireProfile.halfSpreadRadians * 2 * 180) / Math.PI).toBeCloseTo(27.5, 1);
  });

  it('flows the canonical Shotgun definition through WeaponSystem without a parallel volley owner', () => {
    const scene = {
      enemies: group([]),
      primaryWeapon: createWeaponRuntimeState('shotgun')
    } as any;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });
    const profile = system.heroVolleyProfile();
    expect(profile.source).toBe('weapon');
    expect(profile.projectileCount).toBe(5);
    expect(profile.volleyDamageMultiplier).toBeCloseTo(1.75, 8);
    expect(profile.projectileDamageScale).toBeCloseTo(0.35, 8);
    expect(profile.spreads[0]).toBeCloseTo(-0.24, 8);
    expect(profile.spreads[4]).toBeCloseTo(0.24, 8);
  });

  it('redistributes one bounded 1.75x volley instead of giving every pellet full damage', () => {
    const perPelletScale = SHOTGUN_WEAPON.fireProfile.volleyDamageMultiplier / SHOTGUN_WEAPON.fireProfile.projectileCount;
    const perPelletDamage = SHOTGUN_WEAPON.stats.damage * perPelletScale;
    const fullVolleyDamage = perPelletDamage * SHOTGUN_WEAPON.fireProfile.projectileCount;
    expect(perPelletScale).toBeCloseTo(0.35, 8);
    expect(perPelletDamage).toBeCloseTo(8.4, 8);
    expect(fullVolleyDamage).toBeCloseTo(42, 8);
  });

  it('trades sustained DPS and safety for burst rather than becoming a Runner upgrade', () => {
    const runnerDps = RIVET_GUN_WEAPON.stats.damage * 1000 / RIVET_GUN_WEAPON.stats.fireDelay;
    const shotgunDps = SHOTGUN_WEAPON.stats.damage * SHOTGUN_WEAPON.fireProfile.volleyDamageMultiplier * 1000 / SHOTGUN_WEAPON.stats.fireDelay;
    expect(runnerDps).toBeCloseTo(61.538, 3);
    expect(shotgunDps).toBeCloseTo(58.333, 3);
    expect(shotgunDps).toBeLessThan(runnerDps);
    expect(SHOTGUN_WEAPON.stats.damage * SHOTGUN_WEAPON.fireProfile.volleyDamageMultiplier).toBeGreaterThan(RIVET_GUN_WEAPON.stats.damage);
    expect(SHOTGUN_WEAPON.stats.range / RIVET_GUN_WEAPON.stats.range).toBeLessThan(0.6);
  });

  it('keeps base and max-Overclock pellet volume below the existing mobile projectile budget', () => {
    const baseSpawnsPerSecond = SHOTGUN_WEAPON.fireProfile.projectileCount * 1000 / SHOTGUN_WEAPON.stats.fireDelay;
    const maxOverclockFireDelay = SHOTGUN_WEAPON.stats.fireDelay / 1.6;
    const maxOverclockSpawnsPerSecond = SHOTGUN_WEAPON.fireProfile.projectileCount * 1000 / maxOverclockFireDelay;
    const conservativeOneSecondBurst = Math.ceil(1000 / maxOverclockFireDelay) * SHOTGUN_WEAPON.fireProfile.projectileCount;
    expect(baseSpawnsPerSecond).toBeCloseTo(6.944, 3);
    expect(maxOverclockSpawnsPerSecond).toBeCloseTo(11.111, 3);
    expect(maxOverclockSpawnsPerSecond).toBeLessThanOrEqual(20);
    expect(conservativeOneSecondBurst).toBeLessThanOrEqual(40);
  });

  it('uses the approved effective range as an actual target-acquisition boundary', () => {
    const near = { active: true, hp: 10, x: 300, y: 0 };
    const far = { active: true, hp: 10, x: 340, y: 0 };
    const scene = { enemies: group([far, near]) } as any;
    const system = new WeaponSystem(scene, { projectileSystem: {} as any });
    expect(system.acquireTarget(0, 0, SHOTGUN_WEAPON.stats.range)).toBe(near);
    near.active = false;
    expect(system.acquireTarget(0, 0, SHOTGUN_WEAPON.stats.range)).toBeNull();
  });
});
