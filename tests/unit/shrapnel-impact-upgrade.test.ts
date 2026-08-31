import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255 },
    weaponBase: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0 },
    damage: 24
  };
}

describe('Upgrade System 2.0 Shrapnel Impact', () => {
  it('publishes a canonical bounded Hunter impact-fragment upgrade', () => {
    const definition = getUpgradeDefinition('shrapnel-impact');
    if (!definition) throw new Error('Shrapnel Impact definition is missing');

    expect(definition.name).toBe('SHRAPNEL IMPACT');
    expect(definition.description).toBe('Rivet impacts release +2 short-range damaging fragments.');
    expect(definition.rarity).toBe('COMMON');
    expect(definition.maxLevel).toBe(2);
    expect(definition.scope).toBe('WEAPON');
    expect(definition.tags).toEqual(expect.arrayContaining(['PROJECTILE', 'RIVET', 'SHRAPNEL']));
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('adds two fragments per level and mirrors the capped integer weapon state', () => {
    const definition = getUpgradeDefinition('shrapnel-impact');
    if (!definition) throw new Error('Shrapnel Impact definition is missing');
    const scene = makeScene();

    const level1 = applyUpgradeStatModifiers(scene, definition, 1);
    expect(level1.weapon.shrapnelCount).toBe(2);
    expect(scene.primaryWeapon.shrapnelCount).toBe(2);

    const level2 = applyUpgradeStatModifiers(scene, definition, 2);
    expect(level2.weapon.shrapnelCount).toBe(4);
    expect(scene.primaryWeapon.shrapnelCount).toBe(4);
    expect(scene.runStatState.state.caps.weapon.shrapnelCount).toEqual({ min: 0, max: 4 });
  });
});
