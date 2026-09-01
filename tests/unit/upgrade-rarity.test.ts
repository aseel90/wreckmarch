import { describe, expect, it } from 'vitest';
import { RUN_BALANCE } from '../../src/balance/run-balance.js';
import { createRunStatState } from '../../src/stats/run-stat-state.js';
import { getUpgradeDefinition, listUpgradeDefinitions } from '../../src/upgrades/upgrade-catalog.js';
import {
  UPGRADE_RARITIES,
  UPGRADE_RARITY_RULES,
  getUpgradeRarityRule,
  normalizeUpgradeRarity,
  rollUpgradeRarity,
  scaleUpgradeModifierValue
} from '../../src/upgrades/upgrade-rarity.js';
import { createSeededUpgradeRng } from '../../src/upgrades/upgrade-roll-service.js';
import { applyRegisteredUpgrade, canApplyRegisteredUpgrade, createRegisteredUpgradeChoice } from '../../src/upgrades/upgrade-runtime.js';

function makeScene(moveSpeed: number = RUN_BALANCE.player.baseMoveSpeed) {
  const runStatState = createRunStatState({
    characterBase: { maxHp: 100, moveSpeed },
    weaponBase: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 }
  });
  return {
    runStatState,
    upgradeLevels: {} as Record<string, number>,
    level: 5,
    heroHp: 50,
    heroMaxHp: 100,
    heroSpeed: moveSpeed,
    primaryWeapon: { damage: 24, fireDelay: 390, projectileSpeed: 720, range: 570 },
    damage: 24
  };
}

describe('Upgrade System 2.0 rarity model', () => {
  it('defines one data-driven four-tier weight and power model', () => {
    expect(Object.keys(UPGRADE_RARITY_RULES)).toEqual(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']);
    expect(Object.values(UPGRADE_RARITY_RULES).reduce((sum, tier) => sum + tier.weight, 0)).toBe(100);
    expect(getUpgradeRarityRule(UPGRADE_RARITIES.COMMON).powerMultiplier).toBe(1);
    expect(getUpgradeRarityRule(UPGRADE_RARITIES.RARE).powerMultiplier).toBe(1.15);
    expect(getUpgradeRarityRule(UPGRADE_RARITIES.EPIC).powerMultiplier).toBe(1.3);
    expect(getUpgradeRarityRule(UPGRADE_RARITIES.LEGENDARY).powerMultiplier).toBe(1.5);
    expect(() => normalizeUpgradeRarity('mythic')).toThrow(/Unknown upgrade rarity/);
  });

  it('rolls rarity deterministically with seeded RNG and stable boundaries', () => {
    const firstRng = createSeededUpgradeRng('rarity-run-42');
    const secondRng = createSeededUpgradeRng('rarity-run-42');
    const first = Array.from({ length: 12 }, () => rollUpgradeRarity(firstRng));
    const second = Array.from({ length: 12 }, () => rollUpgradeRarity(secondRng));
    expect(first).toEqual(second);

    expect(rollUpgradeRarity(() => 0.1)).toBe('COMMON');
    expect(rollUpgradeRarity(() => 0.7)).toBe('RARE');
    expect(rollUpgradeRarity(() => 0.93)).toBe('EPIC');
    expect(rollUpgradeRarity(() => 0.999)).toBe('LEGENDARY');
  });

  it('scales numeric modifier power without changing the source definition', () => {
    const definition = getUpgradeDefinition('heavy-rivets');
    if (!definition) throw new Error('Heavy Rivets definition is missing');
    expect(scaleUpgradeModifierValue(definition.modifiers[0], 'LEGENDARY')).toBeCloseTo(0.18);
    expect(definition.modifiers[0].value).toBe(0.12);
  });

  it('applies Legendary as one level, records rarity metadata and preserves hard caps', () => {
    const scene = makeScene();
    applyRegisteredUpgrade(scene, 'heavy-rivets', { rarity: 'LEGENDARY' });

    expect(scene.upgradeLevels['heavy-rivets']).toBe(1);
    expect((scene as any).upgradeRarityHistory['heavy-rivets']).toEqual(['LEGENDARY']);
    expect(scene.runStatState.state.modifiers.weapon.damage[0].value).toBeCloseTo(0.18);
    expect(scene.primaryWeapon.damage).toBeCloseTo(24 * 1.18);

    const capped = makeScene(279);
    applyRegisteredUpgrade(capped, 'fleet-feet', { rarity: 'LEGENDARY' });
    expect(capped.upgradeLevels['fleet-feet']).toBe(1);
    expect(capped.heroSpeed).toBe(RUN_BALANCE.player.moveSpeedHardCap);
  });

  it('scales Armor Plate stat and heal transaction together', () => {
    const scene = makeScene();
    const result = applyRegisteredUpgrade(scene, 'armor-plate', { rarity: 'LEGENDARY' }) as any;

    expect(scene.upgradeLevels['armor-plate']).toBe(1);
    expect((scene as any).upgradeRarityHistory['armor-plate']).toEqual(['LEGENDARY']);
    expect(scene.heroMaxHp).toBeCloseTo(122.5);
    expect(scene.heroHp).toBeCloseTo(72.5);
    expect(result.mechanicalEffect.amount).toBeCloseTo(22.5);
    expect(result.mechanicalEffect.rarity).toBe('LEGENDARY');
  });

  it('keeps discrete mechanical upgrades fixed to Common instead of inventing unsafe scaling', () => {
    const scene = makeScene();
    const twin = getUpgradeDefinition('twin-riveter');
    const rig = getUpgradeDefinition('call-rig');
    expect(twin?.rarity).toBe('COMMON');
    expect(rig?.rarity).toBe('COMMON');
    expect(createRegisteredUpgradeChoice(scene as any, 'twin-riveter').rarityConstraint).toBe('COMMON');

    expect(() => applyRegisteredUpgrade(scene as any, 'twin-riveter', { rarity: 'RARE' })).toThrow(/fixed to COMMON/);
    expect(scene.upgradeLevels['twin-riveter'] || 0).toBe(0);
    expect((scene as any).upgradeRarityHistory?.['twin-riveter']).toBeUndefined();
  });

  it('does not create rarity-suffixed duplicate upgrade definitions or bypass maxLevel', () => {
    const ids = listUpgradeDefinitions().map((definition: any) => definition.id);
    expect(ids.some((id: string) => /-(common|rare|epic|legendary)$/.test(id))).toBe(false);

    const scene = makeScene();
    const heavy = getUpgradeDefinition('heavy-rivets');
    if (!heavy) throw new Error('Heavy Rivets definition is missing');
    scene.upgradeLevels['heavy-rivets'] = heavy.maxLevel;
    expect(canApplyRegisteredUpgrade(scene as any, 'heavy-rivets')).toBe(false);
    expect(() => applyRegisteredUpgrade(scene as any, 'heavy-rivets', { rarity: 'LEGENDARY' })).toThrow(/already at max level/);
  });
});
