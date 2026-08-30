import { describe, expect, it, vi } from 'vitest';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade, createRegisteredUpgradeChoice } from '../../src/upgrades/upgrade-runtime.js';

function makeScene() {
  const scene: any = {
    level: 1,
    upgradeLevels: {},
    rigSummoned: false,
    hero: { x: 100, y: 100 },
    cart: {},
    rigSystem: {
      summon: vi.fn(() => { scene.rigSummoned = true; return true; })
    }
  };
  return scene;
}

describe('Upgrade System 2.0 Call the Rig migration', () => {
  it('publishes Call the Rig as a one-level companion mechanical upgrade', () => {
    const definition = getUpgradeDefinition('call-rig');
    if (!definition) throw new Error('Call the Rig definition is missing');

    expect(definition).toMatchObject({
      id: 'call-rig',
      name: 'CALL THE RIG',
      description: 'Summon the moving Fortress companion.',
      maxLevel: 1,
      scope: 'COMPANION',
      weight: 0.7,
      offerRules: { minRunLevel: 2 },
      mechanicalEffect: { id: 'SUMMON_RIG', config: {} }
    });
    expect(definition.modifiers).toEqual([]);
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it('keeps the card unavailable before run level 2 and after the companion already exists', () => {
    const scene = makeScene();
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(false);

    scene.level = 2;
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(true);

    scene.rigSummoned = true;
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(false);
  });

  it('delegates summon ownership to RigSystem and consumes the single upgrade level only on success', () => {
    const scene = makeScene();
    scene.level = 2;

    const result = applyRegisteredUpgrade(scene, 'call-rig') as any;

    expect(scene.rigSystem.summon).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ effectId: 'SUMMON_RIG', level: 1, summoned: true });
    expect(scene.upgradeLevels['call-rig']).toBe(1);
    expect(scene.rigSummoned).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'call-rig')).toBe(false);
  });

  it('uses the same registered card adapter consumed by Phase C and C1', () => {
    const scene = makeScene();
    scene.level = 2;
    const choice = createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' });

    expect(choice).toMatchObject({
      id: 'call-rig',
      category: 'FORTRESS',
      title: 'CALL THE RIG',
      desc: 'Summon the moving Fortress companion.',
      weight: 0.7
    });
    expect(choice.available()).toBe(true);
    choice.apply();
    expect(choice.available()).toBe(false);
  });

  it('does not consume a level when the canonical RigSystem refuses the summon', () => {
    const scene = makeScene();
    scene.level = 2;
    scene.rigSystem.summon.mockImplementation(() => false);

    expect(() => applyRegisteredUpgrade(scene, 'call-rig')).toThrow(/could not summon/);
    expect(scene.upgradeLevels['call-rig']).toBeUndefined();
    expect(scene.rigSummoned).toBe(false);
  });
});
