import { describe, expect, it } from 'vitest';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { assertUpgradeRequirements, meetsUpgradeRequirements, resolveUpgradeRequirements } from '../../src/upgrades/upgrade-requirements.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade } from '../../src/upgrades/upgrade-runtime.js';

const makeScene = () => ({ upgradeLevels: {}, twinShots: 1, upgradeMechanicalState: {} }) as any;

describe('canonical upgrade prerequisite resolver', () => {
  it('keeps Triple Riveter locked until Twin Riveter reaches level 2', () => {
    const scene = makeScene();
    const triple = getUpgradeDefinition('triple-riveter');
    if (!triple) throw new Error('Triple Riveter definition missing');

    expect(resolveUpgradeRequirements(scene, triple)).toMatchObject([{ id: 'twin-riveter', level: 2, currentLevel: 0, met: false }]);
    expect(meetsUpgradeRequirements(scene, triple)).toBe(false);
    expect(canApplyRegisteredUpgrade(scene, 'triple-riveter')).toBe(false);
    expect(() => applyRegisteredUpgrade(scene, 'triple-riveter')).toThrow(/twin-riveter LV2/);

    applyRegisteredUpgrade(scene, 'twin-riveter');
    expect(canApplyRegisteredUpgrade(scene, 'triple-riveter')).toBe(false);
    applyRegisteredUpgrade(scene, 'twin-riveter');
    expect(meetsUpgradeRequirements(scene, triple)).toBe(true);
    expect(assertUpgradeRequirements(scene, triple)).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'triple-riveter')).toBe(true);
  });

  it('fails loudly for unsupported requirement types instead of silently exposing an invalid card', () => {
    const scene = makeScene();
    expect(() => meetsUpgradeRequirements(scene, { id: 'bad', requirements: [{ type: 'weapon-owner', id: 'runner' }] } as any))
      .toThrow(/Unsupported upgrade requirement type/);
  });
});
