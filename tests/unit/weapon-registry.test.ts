import { describe, expect, it } from 'vitest';
import { RUNNER_CHARACTER } from '../../src/characters/definitions/runner.js';
import { RIVET_GUN_WEAPON } from '../../src/combat/definitions/rivet-gun.js';
import { SHOTGUN_WEAPON } from '../../src/combat/definitions/shotgun.js';
import {
  createWeaponRegistry,
  createWeaponRuntimeState,
  getWeaponDefinition,
  listWeaponDefinitions,
  resolveCharacterSignatureWeapon
} from '../../src/combat/weapon-registry.js';

describe('canonical weapon registry', () => {
  it('owns the Runner Rivet Gun base stats and intrinsic single-shot volley under one canonical id', () => {
    expect(listWeaponDefinitions().map(weapon => weapon.id)).toEqual(['rivet-gun', 'shotgun']);
    expect(getWeaponDefinition('rivet-gun')).toStrictEqual(RIVET_GUN_WEAPON);
    expect(RIVET_GUN_WEAPON.stats).toEqual({
      damage: 24,
      fireDelay: 390,
      projectileSpeed: 760,
      range: 570,
      pierceCount: 0,
      ricochetCount: 0,
      shrapnelCount: 0
    });
    expect(RIVET_GUN_WEAPON.fireProfile).toEqual({ projectileCount: 1, halfSpreadRadians: 0, volleyDamageMultiplier: 1 });
    expect(resolveCharacterSignatureWeapon(RUNNER_CHARACTER)).toStrictEqual(RIVET_GUN_WEAPON);
    expect(getWeaponDefinition('shotgun')).toStrictEqual(SHOTGUN_WEAPON);
    expect(() => getWeaponDefinition('scrap-rivet-gun')).toThrow('Unknown weapon: scrap-rivet-gun');
    expect(() => createWeaponRuntimeState({ id: 'unregistered-weapon' } as any)).toThrow('Unknown weapon: unregistered-weapon');
  });

  it('creates mutable runtime state without mutating the frozen definition', () => {
    const runtime = createWeaponRuntimeState('rivet-gun');
    expect(runtime).toMatchObject({
      id: 'rivet-gun', damage: 24, fireDelay: 390, projectileSpeed: 760, range: 570, muzzleDistance: 38,
      fireProfile: { projectileCount: 1, halfSpreadRadians: 0, volleyDamageMultiplier: 1 }
    });
    runtime.damage = 99;
    runtime.fireProfile.projectileCount = 9;
    expect(RIVET_GUN_WEAPON.stats.damage).toBe(24);
    expect(RIVET_GUN_WEAPON.fireProfile.projectileCount).toBe(1);
  });

  it('supports an additional test-only spread weapon definition without changing the canonical weapons', () => {
    const mockSpreadWeapon = Object.freeze({
      id: 'spread-test-weapon',
      displayName: 'Spread Test Weapon',
      stats: Object.freeze({ damage: 10, fireDelay: 700, projectileSpeed: 620, range: 260, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0 }),
      fireProfile: Object.freeze({ projectileCount: 5, halfSpreadRadians: .3, volleyDamageMultiplier: 1.15 }),
      runtime: Object.freeze({ muzzleDistance: 30 })
    });
    const registry = createWeaponRegistry([RIVET_GUN_WEAPON, SHOTGUN_WEAPON, mockSpreadWeapon]);
    expect(registry.list().map(weapon => weapon.id)).toEqual(['rivet-gun', 'shotgun', 'spread-test-weapon']);
    expect(registry.get('rivet-gun')).toBe(RIVET_GUN_WEAPON);
    expect(registry.get('shotgun')).toBe(SHOTGUN_WEAPON);
    expect(registry.get('spread-test-weapon')).toBe(mockSpreadWeapon);
  });

  it('rejects malformed intrinsic volley profiles', () => {
    const bad = {
      id: 'bad-volley',
      displayName: 'Bad Volley',
      stats: { damage: 10, fireDelay: 500, projectileSpeed: 500, range: 300, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0 },
      fireProfile: { projectileCount: 0, halfSpreadRadians: -.1, volleyDamageMultiplier: 0 },
      runtime: { muzzleDistance: 20 }
    } as any;
    expect(() => createWeaponRegistry([bad])).toThrow(/projectileCount must be a positive integer/);
  });
});
