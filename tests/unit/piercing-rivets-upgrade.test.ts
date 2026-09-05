import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255 },
    weaponBase: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0 },
    damage: 24
  };
}

describe('Upgrade System 2.0 Piercing Rivets', () => {
  it('publishes a fixed-Common Rivet projectile upgrade through the canonical registry', () => {
    const definition = getUpgradeDefinition('piercing-rivets');
    if (!definition) throw new Error('Piercing Rivets definition is missing');

    expect(definition.name).toBe('PIERCING RIVETS');
    expect(definition.description).toBe('Projectiles pierce +1 additional enemy.');
    expect(definition.rarity).toBe('COMMON');
    expect(definition.maxLevel).toBe(3);
    expect(definition.scope).toBe('WEAPON');
    expect(definition.tags).toEqual(expect.arrayContaining(['PROJECTILE', 'PIERCE', 'RIVET']));
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('adds exactly one additional enemy of pierce per level and caps at three', () => {
    const definition = getUpgradeDefinition('piercing-rivets');
    if (!definition) throw new Error('Piercing Rivets definition is missing');
    const scene = makeScene();

    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      expect(resolved.weapon.pierceCount).toBe(level);
      expect(scene.primaryWeapon.pierceCount).toBe(level);
    }

    expect(scene.runStatState.state.base.weapon.pierceCount).toBe(0);
    expect(scene.runStatState.state.caps.weapon.pierceCount).toEqual({ min: 0, max: 3 });
  });

  it('rejects duplicate and out-of-range level application', () => {
    const definition = getUpgradeDefinition('piercing-rivets');
    if (!definition) throw new Error('Piercing Rivets definition is missing');
    const scene = makeScene();

    applyUpgradeStatModifiers(scene, definition, 1);
    expect(() => applyUpgradeStatModifiers(scene, definition, 1)).toThrow(/already applied/);
    expect(() => applyUpgradeStatModifiers(scene, definition, 0)).toThrow(/Invalid piercing-rivets level/);
    expect(() => applyUpgradeStatModifiers(scene, definition, 4)).toThrow(/Invalid piercing-rivets level/);
  });
});
