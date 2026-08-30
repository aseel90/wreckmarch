import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255 },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  };
}

describe('Upgrade System 2.0 Long Barrel migration', () => {
  it('publishes Long Barrel through the canonical registry', () => {
    const definition = getUpgradeDefinition('long-barrel');
    if (!definition) throw new Error('Long Barrel definition is missing');

    expect(definition.name).toBe('LONG BARREL');
    expect(definition.description).toBe('+18% projectile speed and +10% range.');
    expect(definition.maxLevel).toBe(4);
    expect(definition.weight).toBe(1);
    expect(definition.modifiers).toHaveLength(2);
    expect(definition.modifiers[0]).toMatchObject({ stat: 'projectileSpeed', value: 0.18 });
    expect(definition.modifiers[1]).toMatchObject({ stat: 'range', value: 0.10 });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('preserves both legacy multipliers at every current level', () => {
    const definition = getUpgradeDefinition('long-barrel');
    if (!definition) throw new Error('Long Barrel definition is missing');
    const scene = makeScene();

    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      expect(resolved.weapon.projectileSpeed).toBeCloseTo(720 * (1.18 ** level));
      expect(resolved.weapon.range).toBeCloseTo(570 * (1.10 ** level));
      expect(scene.primaryWeapon.projectileSpeed).toBeCloseTo(resolved.weapon.projectileSpeed);
      expect(scene.primaryWeapon.range).toBeCloseTo(resolved.weapon.range);
    }

    expect(scene.runStatState.state.base.weapon.projectileSpeed).toBe(720);
    expect(scene.runStatState.state.base.weapon.range).toBe(570);
    expect(scene.runStatState.state.modifiers.weapon.projectileSpeed).toHaveLength(4);
    expect(scene.runStatState.state.modifiers.weapon.range).toHaveLength(4);
  });

  it('rejects accidental duplicate application of the same level for either stat', () => {
    const definition = getUpgradeDefinition('long-barrel');
    if (!definition) throw new Error('Long Barrel definition is missing');
    const scene = makeScene();

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(() => applyUpgradeStatModifiers(scene, definition, 1)).toThrow(/already applied/);
    expect(scene.runStatState.state.modifiers.weapon.projectileSpeed).toHaveLength(1);
    expect(scene.runStatState.state.modifiers.weapon.range).toHaveLength(1);
  });
});
