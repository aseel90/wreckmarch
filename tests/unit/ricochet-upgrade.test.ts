import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const runStatState = createRunStatState({ characterBase: { maxHp: 100, moveSpeed: 255 }, weaponBase: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0, ricochetCount: 0 } });
  return { runStatState, primaryWeapon: { damage: 24, fireDelay: 430, projectileSpeed: 780, range: 720, pierceCount: 0, ricochetCount: 0 }, damage: 24 };
}

describe('Upgrade System 2.0 Ricochet', () => {
  it('publishes a weapon-scoped rare Rivet projectile upgrade', () => {
    const definition = getUpgradeDefinition('ricochet');
    if (!definition) throw new Error('Ricochet definition is missing');
    expect(definition.name).toBe('RICOCHET');
    expect(definition.rarity).toBe('RARE');
    expect(definition.maxLevel).toBe(2);
    expect(definition.scope).toBe('WEAPON');
    expect(definition.tags).toEqual(expect.arrayContaining(['PROJECTILE', 'RICOCHET', 'RIVET']));
  });
  it('adds one ricochet per level and caps at two', () => {
    const definition = getUpgradeDefinition('ricochet');
    if (!definition) throw new Error('Ricochet definition is missing');
    const scene = makeScene();
    expect(applyUpgradeStatModifiers(scene, definition, 1).weapon.ricochetCount).toBe(1);
    expect(scene.primaryWeapon.ricochetCount).toBe(1);
    expect(applyUpgradeStatModifiers(scene, definition, 2).weapon.ricochetCount).toBe(2);
    expect(scene.primaryWeapon.ricochetCount).toBe(2);
  });
});
