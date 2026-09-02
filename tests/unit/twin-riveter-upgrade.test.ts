import { describe, expect, it } from 'vitest';
import { POWER_BUDGET } from '../../src/balance/power-budget.js';
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

describe('Upgrade System 2.0 Twin Riveter power-budget migration', () => {
  it('publishes Twin Riveter as a canonical two-projectile mechanical upgrade', () => {
    const definition = getUpgradeDefinition('twin-riveter');
    if (!definition) throw new Error('Twin Riveter definition is missing');

    expect(definition.name).toBe('TWIN RIVETER');
    expect(definition.description).toBe('Fire two rivets; repeated level strengthens their shared volley.');
    expect(definition.maxLevel).toBe(2);
    expect(definition.weight).toBe(0.72);
    expect(definition.modifiers).toEqual([]);
    expect(definition.mechanicalEffect).toMatchObject({
      id: 'TWIN_RIVETER',
      config: { projectileCount: 2, volleyDamageMultipliers: [1.2, 1.4] }
    });
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.mechanicalEffect)).toBe(true);
  });

  it('keeps both levels at two projectiles while strengthening only the shared volley budget', () => {
    const scene = makeScene();

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(true);
    const first = applyRegisteredUpgrade(scene, 'twin-riveter') as any;
    expect(first).toMatchObject({ level: 1, projectileCount: 2, volleyDamageMultiplier: 1.2, projectileDamageScale: 0.6 });
    expect(scene.upgradeLevels['twin-riveter']).toBe(1);
    expect(scene.twinShots).toBe(2);

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(true);
    const second = applyRegisteredUpgrade(scene, 'twin-riveter') as any;
    expect(second).toMatchObject({ level: 2, projectileCount: 2, volleyDamageMultiplier: 1.4, projectileDamageScale: 0.7 });
    expect(scene.upgradeLevels['twin-riveter']).toBe(2);
    expect(scene.twinShots).toBe(2);
    expect(scene.upgradeMechanicalState['twin-riveter']).toEqual(second);
    expect(second.volleyDamageMultiplier).toBe(POWER_BUDGET.volley.twinLevel2SingleTargetMultiplier);

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(false);
    expect(() => applyRegisteredUpgrade(scene, 'twin-riveter')).toThrow(/max level 2/);
  });

  it('adapts the mechanical definition into the same card contract used by Phase C/C1', () => {
    const scene = makeScene();
    const choice = createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' });

    expect(choice).toMatchObject({
      id: 'twin-riveter',
      category: 'HERO',
      title: 'TWIN RIVETER',
      desc: 'Fire two rivets; repeated level strengthens their shared volley.',
      weight: 0.72
    });
    expect(choice.available()).toBe(true);

    choice.apply();
    expect(scene.upgradeLevels['twin-riveter']).toBe(1);
    expect(scene.upgradeMechanicalState['twin-riveter'].projectileCount).toBe(2);
  });

  it('lets WeaponSystem consume canonical Twin state instead of the legacy twinShots mirror', () => {
    const scene: any = {
      twinShots: 1,
      upgradeMechanicalState: {
        'twin-riveter': { projectileCount: 2, projectileDamageScale: 0.7 }
      }
    };
    const weaponSystem = new WeaponSystem(scene, { projectileSystem: {} as any });

    expect(weaponSystem.heroSpreads()).toEqual([-0.055, 0.055]);
    expect((weaponSystem.heroProjectileDamageScale as any)(2)).toBeCloseTo(0.7);

    delete scene.upgradeMechanicalState['twin-riveter'];
    scene.twinShots = 2;
    expect(weaponSystem.heroSpreads()).toEqual([0]);
    expect(weaponSystem.heroProjectileDamageScale()).toBe(1);
  });
});
