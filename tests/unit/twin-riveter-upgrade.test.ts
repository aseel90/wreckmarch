import { describe, expect, it } from 'vitest';
import { WeaponSystem } from '../../src/combat/weapon-system.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import {
  applyRegisteredUpgrade,
  canApplyRegisteredUpgrade,
  createRegisteredUpgradeChoice
} from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  return {
    upgradeLevels: {} as Record<string, number>,
    twinShots: 1,
    upgradeMechanicalState: {} as Record<string, any>
  };
}

describe('Upgrade System 2.0 Twin Riveter migration', () => {
  it('publishes Twin Riveter as a canonical mechanical upgrade', () => {
    const definition = getUpgradeDefinition('twin-riveter');
    if (!definition) throw new Error('Twin Riveter definition is missing');

    expect(definition.name).toBe('TWIN RIVETER');
    expect(definition.description).toBe('Fire an extra rivet with slight spread.');
    expect(definition.maxLevel).toBe(2);
    expect(definition.weight).toBe(0.72);
    expect(definition.modifiers).toEqual([]);
    expect(definition.mechanicalEffect).toMatchObject({
      id: 'TWIN_RIVETER',
      config: { baseProjectileCount: 1, maxProjectileCount: 3 }
    });
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.mechanicalEffect)).toBe(true);
  });

  it('preserves final C1 parity: level one fires two rivets and level two fires three', () => {
    const scene = makeScene();

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(true);
    const first = applyRegisteredUpgrade(scene, 'twin-riveter') as any;
    expect(first).toMatchObject({ level: 1, projectileCount: 2 });
    expect(scene.upgradeLevels['twin-riveter']).toBe(1);
    expect(scene.twinShots).toBe(2);
    expect(scene.upgradeMechanicalState['twin-riveter']).toEqual(first);

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(true);
    const second = applyRegisteredUpgrade(scene, 'twin-riveter') as any;
    expect(second).toMatchObject({ level: 2, projectileCount: 3 });
    expect(scene.upgradeLevels['twin-riveter']).toBe(2);
    expect(scene.twinShots).toBe(3);
    expect(scene.upgradeMechanicalState['twin-riveter']).toEqual(second);

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(false);
    expect(() => applyRegisteredUpgrade(scene, 'twin-riveter')).toThrow(/max level 2/);
    expect(scene.upgradeLevels['twin-riveter']).toBe(2);
    expect(scene.twinShots).toBe(3);
  });

  it('adapts the mechanical definition into the same card contract used by Phase C/C1', () => {
    const scene = makeScene();
    const choice = createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' });

    expect(choice).toMatchObject({
      id: 'twin-riveter',
      category: 'HERO',
      title: 'TWIN RIVETER',
      desc: 'Fire an extra rivet with slight spread.',
      weight: 0.72
    });
    expect(choice.available()).toBe(true);

    choice.apply();
    expect(scene.upgradeLevels['twin-riveter']).toBe(1);
    expect(scene.upgradeMechanicalState['twin-riveter'].projectileCount).toBe(2);
  });

  it('lets WeaponSystem consume canonical mechanical state before the compatibility mirror', () => {
    const scene: any = {
      twinShots: 1,
      upgradeMechanicalState: {
        'twin-riveter': { projectileCount: 3 }
      }
    };
    const weaponSystem = new WeaponSystem(scene, { projectileSystem: {} as any });

    expect(weaponSystem.heroSpreads()).toEqual([-0.085, 0, 0.085]);

    delete scene.upgradeMechanicalState['twin-riveter'];
    scene.twinShots = 2;
    expect(weaponSystem.heroSpreads()).toEqual([-0.055, 0.055]);
  });
});
