import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyUpgradeStatModifiers } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const runStatState = createRunStatState({
    characterBase: {
      maxHp: 100,
      moveSpeed: 255,
      armor: 0,
      critChance: 0,
      critDamageMultiplier: 1.5,
      pickupRadiusMultiplier: 1
    },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 },
    damage: 24
  } as any;
}

describe('Upgrade System 2.0 Critical Rivet', () => {
  it('publishes a canonical crit-chance upgrade in the character combat-stat domain', () => {
    const definition = getUpgradeDefinition('critical-rivet');
    if (!definition) throw new Error('Critical Rivet definition is missing');

    expect(definition.name).toBe('CRITICAL RIVET');
    expect(definition.description).toContain('+5% critical chance');
    expect(definition.rarity).toBeNull();
    expect(definition.maxLevel).toBe(4);
    expect(definition.scope).toBe('CHARACTER');
    expect(definition.tags).toEqual(expect.arrayContaining(['CRITICAL', 'PRECISION', 'RIVET']));
    expect(definition.modifiers[0]).toMatchObject({
      domain: 'character',
      stat: 'critChance',
      type: 'FLAT',
      value: 0.05,
      min: 0,
      max: 0.35
    });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('adds crit chance through canonical run stats while preserving the Runner x1.5 multiplier', () => {
    const definition = getUpgradeDefinition('critical-rivet');
    if (!definition) throw new Error('Critical Rivet definition is missing');
    const scene = makeScene();

    const level1 = applyUpgradeStatModifiers(scene, definition, 1, { rarity: 'COMMON' });
    expect(level1.character.critChance).toBeCloseTo(0.05);
    expect(level1.character.critDamageMultiplier).toBe(1.5);
    expect(scene.runCombatStats).toMatchObject({ critChance: 0.05, critDamageMultiplier: 1.5 });

    const level2 = applyUpgradeStatModifiers(scene, definition, 2, { rarity: 'COMMON' });
    expect(level2.character.critChance).toBeCloseTo(0.10);
    expect(scene.runStatState.state.caps.character.critChance).toEqual({ min: 0, max: 0.35 });
  });
});
