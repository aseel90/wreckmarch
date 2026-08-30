import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, createRegisteredUpgradeChoice } from '../../src/upgrades/upgrade-runtime.js';

const BASE_MAX_HP = 100;
const LEVEL_MAX_HP = 15;
const LEVEL_HEAL = 15;

function makeScene(heroHp = 50): any {
  const runStatState = createRunStatState({
    characterBase: { maxHp: BASE_MAX_HP, moveSpeed: 255, pickupRadiusMultiplier: 1 },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    heroHp,
    heroMaxHp: BASE_MAX_HP,
    upgradeLevels: {},
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  };
}

describe('Upgrade System 2.0 Armor Plate migration', () => {
  it('publishes Armor Plate as a mixed max-HP stat plus restore-HP effect', () => {
    const definition = getUpgradeDefinition('armor-plate');
    if (!definition) throw new Error('Armor Plate definition is missing');

    expect(definition.name).toBe('ARMOR PLATE');
    expect(definition.description).toBe('+15 max HP and restore 15 HP.');
    expect(definition.maxLevel).toBe(4);
    expect(definition.weight).toBe(.95);
    expect(definition.scope).toBe('CHARACTER');
    expect(definition.modifiers).toEqual([{
      domain: 'character',
      stat: 'maxHp',
      type: 'FLAT',
      value: LEVEL_MAX_HP
    }]);
    expect(definition.mechanicalEffect).toEqual({ id: 'RESTORE_HP', config: { amount: LEVEL_HEAL } });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('adds 15 max HP and restores exactly 15 HP per level while keeping base max HP immutable', () => {
    const scene = makeScene(50);
    const choice = createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' });

    for (let level = 1; level <= 4; level++) {
      expect(choice.available()).toBe(true);
      choice.apply();
      expect(scene.upgradeLevels['armor-plate']).toBe(level);
      expect(scene.heroMaxHp).toBe(BASE_MAX_HP + LEVEL_MAX_HP * level);
      expect(scene.heroHp).toBe(50 + LEVEL_HEAL * level);
      expect(scene.runStatState.state.base.character.maxHp).toBe(BASE_MAX_HP);
    }

    expect(choice.available()).toBe(false);
    expect(scene.runStatState.state.modifiers.character.maxHp.map((modifier: any) => modifier.id)).toEqual([
      'armor-plate@1:0',
      'armor-plate@2:0',
      'armor-plate@3:0',
      'armor-plate@4:0'
    ]);
    expect(() => choice.apply()).toThrow(/already at max level 4/);
  });

  it('caps the restore at the newly resolved max HP', () => {
    const scene = makeScene(BASE_MAX_HP);
    applyRegisteredUpgrade(scene, 'armor-plate');
    expect(scene.heroMaxHp).toBe(115);
    expect(scene.heroHp).toBe(115);
  });

  it('rolls back the max-HP modifier and level when the post-stat heal cannot commit', () => {
    const scene = makeScene(50);
    let hp = 50;
    let writes = 0;
    Object.defineProperty(scene, 'heroHp', {
      configurable: true,
      get: () => hp,
      set: (value: number) => {
        writes += 1;
        if (writes === 1) throw new Error('forced heal write failure');
        hp = value;
      }
    });

    expect(() => applyRegisteredUpgrade(scene, 'armor-plate')).toThrow(/forced heal write failure/);
    expect(scene.upgradeLevels['armor-plate'] || 0).toBe(0);
    expect(scene.heroMaxHp).toBe(BASE_MAX_HP);
    expect(scene.heroHp).toBe(50);
    expect(scene.runStatState.state.modifiers.character.maxHp || []).toHaveLength(0);
    expect(scene.runStatState.state.base.character.maxHp).toBe(BASE_MAX_HP);
  });

  it('removes both legacy Phase C/C1 max-HP mutation implementations', () => {
    const phaseC = fs.readFileSync(new URL('../../src/phase-c-runtime.js', import.meta.url), 'utf8');
    const phaseC1 = fs.readFileSync(new URL('../../src/phase-c1-runtime.js', import.meta.url), 'utf8');

    expect(phaseC).toContain("createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' })");
    expect(phaseC1).toContain("createRegisteredUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' })");
    expect(phaseC).not.toContain('scene.heroMaxHp += 15');
    expect(phaseC1).not.toContain('scene.heroMaxHp+=15');
  });
});
