import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene(baseFireDelay = 390) {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255 },
    weaponBase: { damage: 24, fireDelay: baseFireDelay, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: 24, fireDelay: baseFireDelay, projectileSpeed: 720, range: 570 },
    fireDelay: baseFireDelay
  };
}

describe('Upgrade System 2.0 Overclock migration', () => {
  it('publishes Overclock through the canonical registry', () => {
    const definition = getUpgradeDefinition('overclock');
    if (!definition) throw new Error('Overclock definition is missing');

    expect(definition.name).toBe('OVERCLOCK');
    expect(definition.description).toBe('12% faster fire rate.');
    expect(definition.maxLevel).toBe(5);
    expect(definition.weight).toBe(1.2);
    expect(definition.modifiers[0]).toMatchObject({ stat: 'fireDelay', value: -0.12, min: 145 });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('preserves the legacy x0.88 fire-delay result at every current level', () => {
    const definition = getUpgradeDefinition('overclock');
    if (!definition) throw new Error('Overclock definition is missing');
    const scene = makeScene(390);

    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      const expected = Math.max(145, 390 * (0.88 ** level));
      expect(resolved.weapon.fireDelay).toBeCloseTo(expected);
      expect(scene.primaryWeapon.fireDelay).toBeCloseTo(expected);
      expect(scene.fireDelay).toBeCloseTo(expected);
    }

    expect(scene.runStatState.state.base.weapon.fireDelay).toBe(390);
    expect(scene.runStatState.state.caps.weapon.fireDelay).toEqual({ min: 145 });
  });

  it('preserves the legacy 145ms minimum fire delay', () => {
    const definition = getUpgradeDefinition('overclock');
    if (!definition) throw new Error('Overclock definition is missing');
    const scene = makeScene(160);

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(scene.primaryWeapon.fireDelay).toBe(145);
    applyUpgradeStatModifiers(scene, definition, 2);
    expect(scene.primaryWeapon.fireDelay).toBe(145);
  });

  it('rejects accidental duplicate application of the same level', () => {
    const definition = getUpgradeDefinition('overclock');
    if (!definition) throw new Error('Overclock definition is missing');
    const scene = makeScene();

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(() => applyUpgradeStatModifiers(scene, definition, 1)).toThrow(/already applied/);
    expect(scene.runStatState.state.modifiers.weapon.fireDelay).toHaveLength(1);
  });
});
