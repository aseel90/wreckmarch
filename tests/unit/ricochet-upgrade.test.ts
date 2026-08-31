import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed: 255 },
    weaponBase: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0, ricochetCount: 0 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0, ricochetCount: 0 },
    damage: 24
  };
}

describe('Upgrade System 2.0 Ricochet', () => {
  it('publishes a canonical Rivet ricochet stat upgrade', () => {
    const definition = getUpgradeDefinition('ricochet');
    if (!definition) throw new Error('Ricochet definition is missing');
    expect(definition.name).toBe('RICOCHET');
    expect(definition.rarity).toBe('COMMON');
    expect(definition.scope).toBe('WEAPON');
    expect(definition.tags).toEqual(expect.arrayContaining(['PROJECTILE', 'RICOCHET', 'RIVET']));
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('adds one ricochet per level through canonical weapon stats', () => {
    const definition = getUpgradeDefinition('ricochet');
    if (!definition) throw new Error('Ricochet definition is missing');
    const scene = makeScene();
    for (let level = 1; level <= definition.maxLevel; level++) {
      const resolved = applyUpgradeStatModifiers(scene, definition, level);
      expect(resolved.weapon.ricochetCount).toBe(level);
      expect(scene.primaryWeapon.ricochetCount).toBe(level);
    }
    expect(scene.runStatState.state.base.weapon.ricochetCount).toBe(0);
  });
});
