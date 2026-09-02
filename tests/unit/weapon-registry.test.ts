import { describe, expect, it } from 'vitest';
import { RUNNER_CHARACTER } from '../../src/characters/definitions/runner.js';
import { RIVET_GUN_WEAPON } from '../../src/combat/definitions/rivet-gun.js';
import {
  createWeaponRegistry,
  createWeaponRuntimeState,
  getWeaponDefinition,
  listWeaponDefinitions,
  resolveCharacterSignatureWeapon
} from '../../src/combat/weapon-registry.js';

describe('canonical weapon registry', () => {
  it('owns the Runner Rivet Gun base stats under one canonical id', () => {
    expect(listWeaponDefinitions().map(weapon => weapon.id)).toEqual(['rivet-gun']);
    expect(getWeaponDefinition('rivet-gun')).toBe(RIVET_GUN_WEAPON);
    expect(RIVET_GUN_WEAPON.stats).toEqual({
      damage: 24,
      fireDelay: 390,
      projectileSpeed: 760,
      range: 570,
      pierceCount: 0,
      ricochetCount: 0,
      shrapnelCount: 0
    });
    expect(resolveCharacterSignatureWeapon(RUNNER_CHARACTER)).toBe(RIVET_GUN_WEAPON);
    expect(() => getWeaponDefinition('scrap-rivet-gun')).toThrow('Unknown weapon: scrap-rivet-gun');
  });

  it('creates mutable runtime state without mutating the frozen definition', () => {
    const runtime = createWeaponRuntimeState('rivet-gun');
    expect(runtime).toMatchObject({ id: 'rivet-gun', damage: 24, fireDelay: 390, projectileSpeed: 760, range: 570, muzzleDistance: 38 });
    runtime.damage = 99;
    expect(RIVET_GUN_WEAPON.stats.damage).toBe(24);
  });

  it('supports deterministic future weapon registration without changing Runner', () => {
    const mockShotgun = Object.freeze({
      id: 'shotgun',
      displayName: 'Shotgun',
      stats: Object.freeze({ damage: 10, fireDelay: 700, projectileSpeed: 620, range: 260, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0 }),
      runtime: Object.freeze({ muzzleDistance: 30 })
    });
    const registry = createWeaponRegistry([RIVET_GUN_WEAPON, mockShotgun]);
    expect(registry.list().map(weapon => weapon.id)).toEqual(['rivet-gun', 'shotgun']);
    expect(registry.get('rivet-gun')).toBe(RIVET_GUN_WEAPON);
    expect(registry.get('shotgun')).toBe(mockShotgun);
  });
});
