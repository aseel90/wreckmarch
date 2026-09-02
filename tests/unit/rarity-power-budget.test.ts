import { describe, expect, it } from 'vitest';
import { RUN_BALANCE } from '../../src/balance/run-balance.js';
import { getUpgradeDefinition } from '../../src/upgrades/upgrade-catalog.js';
import {
  UPGRADE_RARITIES,
  UPGRADE_RARITY_RULES,
  getUpgradeRarityRule,
  scaleUpgradeModifierValue
} from '../../src/upgrades/upgrade-rarity.js';

const LATE_DIRECT_POWER_CEILING = 4.25;
const DIRECT_CARD_RARITY_UPLIFT_CEILING = 1.20;
const TWIN_L2_VOLLEY_MULTIPLIER = 1.40;
const CRIT_DAMAGE_MULTIPLIER = 1.50;

function definition(id: string) {
  const resolved = getUpgradeDefinition(id);
  if (!resolved) throw new Error(`Missing upgrade definition: ${id}`);
  return resolved as any;
}

function modifierValue(id: string, modifierIndex: number, rarity: string) {
  return scaleUpgradeModifierValue(definition(id).modifiers[modifierIndex], rarity);
}

function weightedExpectedRarityPower() {
  const tiers = Object.values(UPGRADE_RARITY_RULES);
  const totalWeight = tiers.reduce((sum, tier) => sum + tier.weight, 0);
  return tiers.reduce((sum, tier) => sum + tier.weight * tier.powerMultiplier, 0) / totalWeight;
}

function rarityPower(rarity: string) {
  return getUpgradeRarityRule(rarity).powerMultiplier;
}

function additiveFactor(basePerLevel: number, rarityHistory: string[]) {
  return 1 + rarityHistory.reduce((sum, rarity) => sum + basePerLevel * rarityPower(rarity), 0);
}

function expectedCritFactor(baseChancePerLevel: number, rarityHistory: string[]) {
  const chance = rarityHistory.reduce((sum, rarity) => sum + baseChancePerLevel * rarityPower(rarity), 0);
  return 1 + chance * (CRIT_DAMAGE_MULTIPLIER - 1);
}

describe('WS17 rarity identity and power budget', () => {
  it('keeps the natural rarity distribution at a 1.073x expected modifier delta', () => {
    expect(Object.values(UPGRADE_RARITY_RULES).reduce((sum, tier) => sum + tier.weight, 0)).toBe(100);
    expect(weightedExpectedRarityPower()).toBeCloseTo(1.073, 6);
  });

  it('keeps discrete projectile/proc mechanics fixed to Common rarity', () => {
    const fixedCommonIds = [
      'twin-riveter',
      'triple-riveter',
      'piercing-rivets',
      'ricochet',
      'shrapnel-impact',
      'explosive-rivet',
      'impact-shield',
      'call-rig'
    ];

    for (const id of fixedCommonIds) {
      expect(definition(id).rarity, id).toBe(UPGRADE_RARITIES.COMMON);
    }
  });

  it('keeps max Heavy and Overclock Legendary same-card uplift below 20 percent', () => {
    const heavy = definition('heavy-rivets');
    const overclock = definition('overclock');

    const heavyCommon = 1 + heavy.maxLevel * modifierValue('heavy-rivets', 0, 'COMMON');
    const heavyLegendary = 1 + heavy.maxLevel * modifierValue('heavy-rivets', 0, 'LEGENDARY');
    expect(heavyLegendary / heavyCommon).toBeCloseTo(1.1875, 6);
    expect(heavyLegendary / heavyCommon).toBeLessThanOrEqual(DIRECT_CARD_RARITY_UPLIFT_CEILING);

    const overclockCommonRateFactor = 1 + overclock.maxLevel * modifierValue('overclock', 0, 'COMMON');
    const overclockLegendaryRateFactor = 1 + overclock.maxLevel * modifierValue('overclock', 0, 'LEGENDARY');
    expect(overclockLegendaryRateFactor / overclockCommonRateFactor).toBeCloseTo(1.1875, 6);
    expect(overclockLegendaryRateFactor / overclockCommonRateFactor).toBeLessThanOrEqual(DIRECT_CARD_RARITY_UPLIFT_CEILING);
  });

  it('keeps max Critical Rivet Legendary same-card expected DPS uplift modest', () => {
    const crit = definition('critical-rivet');
    const commonChance = crit.maxLevel * modifierValue('critical-rivet', 0, 'COMMON');
    const legendaryChance = crit.maxLevel * modifierValue('critical-rivet', 0, 'LEGENDARY');
    const commonFactor = 1 + commonChance * (CRIT_DAMAGE_MULTIPLIER - 1);
    const legendaryFactor = 1 + legendaryChance * (CRIT_DAMAGE_MULTIPLIER - 1);

    expect(commonChance).toBeCloseTo(0.20, 6);
    expect(legendaryChance).toBeCloseTo(0.30, 6);
    expect(legendaryFactor / commonFactor).toBeCloseTo(1.045454545, 6);
    expect(legendaryFactor / commonFactor).toBeLessThanOrEqual(DIRECT_CARD_RARITY_UPLIFT_CEILING);
  });

  it('measures multiplicative utility rarity accumulation and preserves the Fleet Feet cap', () => {
    const expectedPower = weightedExpectedRarityPower();
    const longBarrel = definition('long-barrel');
    const magnet = definition('scrap-magnet');
    const fleet = definition('fleet-feet');

    const speedPerCommon = longBarrel.modifiers[0].value;
    const rangePerCommon = longBarrel.modifiers[1].value;
    const magnetPerCommon = magnet.modifiers[0].value;
    const fleetPerCommon = fleet.modifiers[0].value;

    const expectedLongSpeedRatio = Math.pow((1 + speedPerCommon * expectedPower) / (1 + speedPerCommon), longBarrel.maxLevel);
    const expectedLongRangeRatio = Math.pow((1 + rangePerCommon * expectedPower) / (1 + rangePerCommon), longBarrel.maxLevel);
    const expectedMagnetRatio = Math.pow((1 + magnetPerCommon * expectedPower) / (1 + magnetPerCommon), magnet.maxLevel);

    expect(expectedLongSpeedRatio).toBeLessThan(1.05);
    expect(expectedLongRangeRatio).toBeLessThan(1.03);
    expect(expectedMagnetRatio).toBeLessThan(1.07);

    const commonFleet = Math.min(
      RUN_BALANCE.player.moveSpeedHardCap,
      RUN_BALANCE.player.baseMoveSpeed * Math.pow(1 + fleetPerCommon, fleet.maxLevel)
    );
    const legendaryFleet = Math.min(
      RUN_BALANCE.player.moveSpeedHardCap,
      RUN_BALANCE.player.baseMoveSpeed * Math.pow(1 + fleetPerCommon * rarityPower('LEGENDARY'), fleet.maxLevel)
    );
    expect(legendaryFleet).toBe(RUN_BALANCE.player.moveSpeedHardCap);
    expect(legendaryFleet / commonFleet).toBeLessThan(1.01);
  });

  it('keeps survivability rarity bounded by current HP and healing semantics', () => {
    const armor = definition('armor-plate');
    const commonArmor = 100 + armor.maxLevel * modifierValue('armor-plate', 0, 'COMMON');
    const legendaryArmor = 100 + armor.maxLevel * modifierValue('armor-plate', 0, 'LEGENDARY');
    expect(commonArmor).toBe(160);
    expect(legendaryArmor).toBe(190);
    expect(legendaryArmor / commonArmor).toBeCloseTo(1.1875, 6);

    const fieldRepair = definition('field-repair');
    const baseHealFraction = fieldRepair.mechanicalEffect.config.percentMaxHp;
    const legendaryHealFraction = baseHealFraction * rarityPower('LEGENDARY');
    expect(baseHealFraction).toBe(0.25);
    expect(legendaryHealFraction).toBe(0.375);
  });

  it('keeps the weighted max direct scalar build inside the PB1 late envelope', () => {
    const expectedPower = weightedExpectedRarityPower();
    const heavy = definition('heavy-rivets');
    const overclock = definition('overclock');
    const crit = definition('critical-rivet');

    const heavyFactor = 1 + heavy.maxLevel * heavy.modifiers[0].value * expectedPower;
    const overclockRateFactor = 1 + overclock.maxLevel * overclock.modifiers[0].value * expectedPower;
    const critChance = crit.maxLevel * crit.modifiers[0].value * expectedPower;
    const critFactor = 1 + critChance * (CRIT_DAMAGE_MULTIPLIER - 1);
    const directPower = heavyFactor * overclockRateFactor * critFactor * TWIN_L2_VOLLEY_MULTIPLIER;

    expect(directPower).toBeCloseTo(4.188816, 5);
    expect(directPower).toBeLessThanOrEqual(LATE_DIRECT_POWER_CEILING);
  });

  it('keeps the strong RUN-0026 rarity mix bounded versus the same-level Common build', () => {
    const heavyPerLevel = definition('heavy-rivets').modifiers[0].value;
    const overclockPerLevel = definition('overclock').modifiers[0].value;
    const critPerLevel = definition('critical-rivet').modifiers[0].value;

    const runHeavy = additiveFactor(heavyPerLevel, ['EPIC', 'COMMON']);
    const runOverclock = additiveFactor(overclockPerLevel, ['LEGENDARY', 'LEGENDARY', 'RARE', 'RARE', 'EPIC']);
    const runCrit = expectedCritFactor(critPerLevel, ['COMMON', 'COMMON', 'RARE']);
    const runDirectPower = runHeavy * runOverclock * runCrit * TWIN_L2_VOLLEY_MULTIPLIER;

    const commonHeavy = additiveFactor(heavyPerLevel, ['COMMON', 'COMMON']);
    const commonOverclock = additiveFactor(overclockPerLevel, ['COMMON', 'COMMON', 'COMMON', 'COMMON', 'COMMON']);
    const commonCrit = expectedCritFactor(critPerLevel, ['COMMON', 'COMMON', 'COMMON']);
    const commonEquivalent = commonHeavy * commonOverclock * commonCrit * TWIN_L2_VOLLEY_MULTIPLIER;

    expect(runDirectPower).toBeCloseTo(3.453325568, 6);
    expect(commonEquivalent).toBeCloseTo(2.98592, 6);
    expect(runDirectPower / commonEquivalent).toBeCloseTo(1.156536534, 6);
    expect(runDirectPower / commonEquivalent).toBeLessThan(1.16);
    expect(runDirectPower).toBeLessThanOrEqual(LATE_DIRECT_POWER_CEILING);
  });
});
