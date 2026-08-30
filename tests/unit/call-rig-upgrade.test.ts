import { describe, expect, it, vi } from 'vitest';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade, createRegisteredUpgradeChoice } from '../../src/upgrades/upgrade-runtime.js';

function makeScene(level = 2) {
  const summon = vi.fn(() => true);
  return { level, rigSummoned: false, upgradeLevels: {} as Record<string, number>, rigSystem: { summon } } as any;
}

describe('Upgrade System 2.0 Call the Rig migration', () => {
  it('publishes Call the Rig as a one-shot companion mechanical upgrade', () => {
    const definition = getUpgradeDefinition('call-rig');
    expect(definition).toMatchObject({ id: 'call-rig', maxLevel: 1, scope: 'COMPANION', weight: 0.7, offerRules: { minSceneLevel: 2, requireSceneFlagFalse: 'rigSummoned' }, mechanicalEffect: { id: 'CALL_RIG' } });
  });

  it('keeps the card unavailable before level 2 and after the rig is summoned', () => {
    const scene = makeScene(1);
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(false);
    scene.level = 2;
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(true);
    scene.rigSummoned = true;
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(false);
  });

  it('delegates summoning only to the canonical RigSystem entry point', () => {
    const scene = makeScene();
    const result = applyRegisteredUpgrade(scene, 'call-rig') as any;
    expect(scene.rigSystem.summon).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ effectId: 'CALL_RIG', level: 1, summoned: true });
    expect(scene.upgradeLevels['call-rig']).toBe(1);
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(false);
  });

  it('adapts to the same shared card contract used by Phase C/C1', () => {
    const scene = makeScene();
    const choice = createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' });
    expect(choice).toMatchObject({ id: 'call-rig', category: 'FORTRESS', title: 'CALL THE RIG', weight: 0.7 });
    expect(choice.available()).toBe(true);
    choice.apply();
    expect(scene.rigSystem.summon).toHaveBeenCalledTimes(1);
  });
});
