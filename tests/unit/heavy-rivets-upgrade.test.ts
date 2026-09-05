import { describe, expect, it } from 'vitest';
import { POWER_BUDGET } from '../../src/balance/power-budget.js';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene(baseDamage = 24) {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255 },
    weaponBase: { damage: baseDamage, fireDelay: 430, projectileSpeed: 780, range: 720 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: baseDamage, fireDelay: 430, projectileSpeed: 780, range: 720 },
    damage: baseDamage
  };
}

describe('Upgrade System 2.0 Heavy Rivets power-budget migration', () => {
  it('publishes Heavy Rivets through the canonical registry', () => {
    const definition = getUpgradeDefinition('heavy-rivets');
    if (!definition) throw new Error('Heavy Rivets definition is missing');

    expect(definition.name).toBe('HEAVY RIVETS');
    expect(definition.description).toBe('+12% active weapon damage.');
    expect(definition.maxLevel).toBe(5);
    expect(definition.weight).toBe(1.25);
    expect(definition.modifiers[0]).toMatchObject({ type: 'ADDITIVE_PERCENT', value: 0.12 });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('uses base-relative additive damage growth instead of compounding the resolved value', () => {
    const definition = getUpgradeDefinition('heavy-rivets');
    if (!definition) throw new Error('Heavy Rivets definition is missing');
    const scene = makeScene(24);

    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      const expected = 24 * (1 + 0.12 * level);
      expect(resolved.weapon.damage).toBeCloseTo(expected);
      expect(scene.primaryWeapon.damage).toBeCloseTo(expected);
      expect(scene.damage).toBeCloseTo(expected);
    }

    expect(scene.primaryWeapon.damage / 24).toBeCloseTo(POWER_BUDGET.stacking.commonSingleAxisMaxMultiplier);
    expect(scene.runStatState.state.base.weapon.damage).toBe(24);
  });

  it('rejects accidental duplicate application of the same level', () => {
    const definition = getUpgradeDefinition('heavy-rivets');
    if (!definition) throw new Error('Heavy Rivets definition is missing');
    const scene = makeScene();

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(() => applyUpgradeStatModifiers(scene, definition, 1)).toThrow(/already applied/);
    expect(scene.runStatState.state.modifiers.weapon.damage).toHaveLength(1);
  });

  it('rejects levels outside the schema maxLevel contract', () => {
    const definition = getUpgradeDefinition('heavy-rivets');
    if (!definition) throw new Error('Heavy Rivets definition is missing');
    const scene = makeScene();

    expect(() => applyUpgradeStatModifiers(scene, definition, 0)).toThrow(/Invalid heavy-rivets level/);
    expect(() => applyUpgradeStatModifiers(scene, definition, 6)).toThrow(/Invalid heavy-rivets level/);
  });
});
