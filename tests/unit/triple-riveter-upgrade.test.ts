import { describe, expect, it } from 'vitest';
import { POWER_BUDGET } from '../../src/balance/power-budget.js';
import { WeaponSystem } from '../../src/combat/weapon-system.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade, createRegisteredUpgradeChoice } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  return {
    upgradeLevels: {} as Record<string, number>,
    twinShots: 1,
    upgradeMechanicalState: {} as Record<string, any>
  } as any;
}

describe('Triple Riveter advanced multishot', () => {
  it('publishes a one-level Twin L2 evolution with a bounded 1.60x volley budget', () => {
    const definition = getUpgradeDefinition('triple-riveter');
    if (!definition) throw new Error('Triple Riveter definition missing');
    expect(definition).toMatchObject({
      id: 'triple-riveter',
      name: 'TRIPLE RIVETER',
      rarity: 'RARE',
      maxLevel: 1,
      weight: 0.38,
      requirements: [{ type: 'upgrade-level', id: 'twin-riveter', level: 2 }]
    });
    expect(definition.mechanicalEffect).toMatchObject({
      id: 'TRIPLE_RIVETER',
      config: { projectileCount: 3, volleyDamageMultiplier: 1.6 }
    });
    expect(POWER_BUDGET.volley.tripleSingleTargetMultiplier).toBe(1.6);
    expect(POWER_BUDGET.volley.triplePerProjectileDamageScale).toBeCloseTo(1.6 / 3);
  });

  it('cannot be applied before Twin L2 and then installs exactly three budgeted projectiles', () => {
    const scene = makeScene();
    const choice = createRegisteredUpgradeChoice(scene, 'triple-riveter', { category: 'EVOLUTION' });
    expect(choice.available()).toBe(false);

    applyRegisteredUpgrade(scene, 'twin-riveter');
    expect(choice.available()).toBe(false);
    applyRegisteredUpgrade(scene, 'twin-riveter');
    expect(choice.available()).toBe(true);

    const triple = applyRegisteredUpgrade(scene, 'triple-riveter', { rarity: 'RARE' }) as any;
    expect(triple).toMatchObject({ projectileCount: 3, volleyDamageMultiplier: 1.6, rarity: 'RARE' });
    expect(triple.projectileDamageScale).toBeCloseTo(1.6 / 3);
    expect(scene.upgradeLevels['triple-riveter']).toBe(1);
    expect(canApplyRegisteredUpgrade(scene, 'triple-riveter')).toBe(false);
  });

  it('lets WeaponSystem prefer Triple over the retained Twin state', () => {
    const scene = makeScene();
    scene.twinShots = 2;
    scene.upgradeMechanicalState['twin-riveter'] = { projectileCount: 2, projectileDamageScale: .7 };
    scene.upgradeMechanicalState['triple-riveter'] = { projectileCount: 3, projectileDamageScale: 1.6 / 3 };
    const weapon = new WeaponSystem(scene, { projectileSystem: {} as any });
    expect(weapon.heroSpreads()).toEqual([-0.085, 0, 0.085]);
    expect((weapon.heroProjectileDamageScale as any)(3)).toBeCloseTo(1.6 / 3);
  });
});
