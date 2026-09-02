import { describe, expect, it } from 'vitest';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import {
  assertUpgradeCompatibility,
  meetsUpgradeCompatibility,
  resolveUpgradeCompatibility
} from '../../src/upgrades/upgrade-compatibility.js';
import {
  applyRegisteredUpgrade,
  canApplyRegisteredUpgrade,
  createRegisteredStatUpgradeChoice,
  createRegisteredUpgradeChoice
} from '../../src/upgrades/upgrade-runtime.js';
import { createSeededUpgradeRng, rollUpgradeChoices } from '../../src/upgrades/upgrade-roll-service.js';

function sceneFor(weaponId: string, characterId = 'runner') {
  return {
    characterId,
    startingWeaponId: weaponId,
    upgradeLevels: {},
    twinShots: 1,
    upgradeMechanicalState: {}
  } as any;
}

describe('canonical upgrade compatibility filtering', () => {
  it('keeps Rivet-only mechanics available to the Runner Rivet Gun', () => {
    const scene = sceneFor('rivet-gun');
    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'explosive-rivet')).toBe(true);

    const twin = getUpgradeDefinition('twin-riveter');
    expect(twin?.compatibility).toEqual({ weaponIds: ['rivet-gun'] });
    expect(Object.isFrozen(twin?.compatibility)).toBe(true);
    expect(Object.isFrozen(twin?.compatibility.weaponIds)).toBe(true);
  });

  it('filters only explicitly incompatible weapon cards instead of curating the build', () => {
    const scene = sceneFor('shotgun', 'shotgunner');

    expect(canApplyRegisteredUpgrade(scene, 'twin-riveter')).toBe(false);
    expect(canApplyRegisteredUpgrade(scene, 'explosive-rivet')).toBe(false);
    expect(canApplyRegisteredUpgrade(scene, 'triple-riveter')).toBe(false);
    expect(canApplyRegisteredUpgrade(scene, 'heavy-rivets')).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'overclock')).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'piercing-rivets')).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'ricochet')).toBe(true);
    expect(canApplyRegisteredUpgrade(scene, 'shrapnel-impact')).toBe(true);
    expect(() => applyRegisteredUpgrade(scene, 'twin-riveter')).toThrow(/twin-riveter incompatible: weapon shotgun/);

    const choices = [
      createRegisteredUpgradeChoice(scene, 'twin-riveter'),
      createRegisteredStatUpgradeChoice(scene, 'heavy-rivets')
    ];
    const rolled = rollUpgradeChoices(choices, { count: 2, rng: createSeededUpgradeRng('compatibility-filter') });
    expect(rolled.map(choice => choice.id)).toEqual(['heavy-rivets']);
  });

  it('supports character-specific compatibility independently from weapon compatibility', () => {
    const definition = {
      id: 'runner-only-test',
      compatibility: { characterIds: ['runner'] }
    } as any;

    expect(meetsUpgradeCompatibility(sceneFor('rivet-gun', 'runner'), definition)).toBe(true);
    expect(meetsUpgradeCompatibility(sceneFor('rivet-gun', 'shotgunner'), definition)).toBe(false);
    expect(resolveUpgradeCompatibility(sceneFor('rivet-gun', 'shotgunner'), definition)).toMatchObject({
      characterId: 'shotgunner',
      characterIds: ['runner'],
      characterMet: false,
      weaponMet: true,
      met: false
    });
    expect(() => assertUpgradeCompatibility(sceneFor('rivet-gun', 'shotgunner'), definition))
      .toThrow(/character shotgunner not in \[runner\]/);
  });

  it('fails loudly on malformed compatibility metadata', () => {
    expect(() => resolveUpgradeCompatibility(sceneFor('rivet-gun'), {
      id: 'bad-compat',
      compatibility: { weaponIds: 'rivet-gun' }
    } as any)).toThrow(/weaponIds must be an array/);
  });
});
