import { describe, expect, it } from 'vitest';
import {
  BALANCE_SCENARIO_IDS,
  runAllDeterministicBalanceScenarios,
  runDeterministicBalanceScenario
} from '../../src/balance/deterministic-balance-scenarios.js';

describe('deterministic balance scenario suite', () => {
  it('locks the original baselines plus the three WS20 build-identity candidates in the approved execution set', () => {
    expect(BALANCE_SCENARIO_IDS).toEqual([
      'BASELINE_RUNNER_NO_UPGRADES',
      'TWIN_ONLY',
      'HEAVY_ONLY',
      'OVERCLOCK_ONLY',
      'HEAVY_OVERCLOCK',
      'TWIN_SHRAPNEL',
      'TWIN_PIERCE_RICOCHET',
      'CURRENT_MAX_POWER_BUILD',
      'WS20_SCALAR_PRECISION',
      'WS20_CROWD_CHAIN',
      'WS20_SURVIVAL_SUPPORT'
    ]);
  });

  it('replays the full suite byte-for-byte deterministically from fixed seeds and explicit Common upgrade acquisition', () => {
    expect(runAllDeterministicBalanceScenarios()).toEqual(runAllDeterministicBalanceScenarios());
    for (const snapshot of runAllDeterministicBalanceScenarios()) {
      if (snapshot.id === 'BASELINE_RUNNER_NO_UPGRADES') expect(snapshot.upgrades).toHaveLength(0);
      else expect(snapshot.upgrades.every((entry: { levels: number }) => entry.levels >= 1)).toBe(true);
      expect(Object.values(snapshot.rarityHistory).flat().every(rarity => rarity === 'COMMON')).toBe(true);
      expect(snapshot.derived.criticalRollSample.sampleSize).toBe(128);
      expect(snapshot.derived.criticalRollSample.firstRolls).toHaveLength(8);
    }
  });

  it('captures canonical resolved weapon and projectile-mechanic differences without inventing a second combat owner', () => {
    const baseline = runDeterministicBalanceScenario('BASELINE_RUNNER_NO_UPGRADES');
    const twin = runDeterministicBalanceScenario('TWIN_ONLY');
    const heavy = runDeterministicBalanceScenario('HEAVY_ONLY');
    const overclock = runDeterministicBalanceScenario('OVERCLOCK_ONLY');
    const chain = runDeterministicBalanceScenario('TWIN_PIERCE_RICOCHET');
    const max = runDeterministicBalanceScenario('CURRENT_MAX_POWER_BUILD');

    expect(baseline.resolvedStats.weapon).toMatchObject({ damage: 24, fireDelay: 390, pierceCount: 0, ricochetCount: 0, shrapnelCount: 0 });
    expect(baseline.mechanics.projectileCount).toBe(1);
    expect(twin.mechanics).toMatchObject({ projectileCount: 2, projectileDamageScale: 0.7, volleyDamageMultiplier: 1.4 });
    expect(heavy.resolvedStats.weapon.damage).toBeGreaterThan(baseline.resolvedStats.weapon.damage);
    expect(overclock.resolvedStats.weapon.fireDelay).toBeLessThan(baseline.resolvedStats.weapon.fireDelay);
    expect(chain.mechanics).toMatchObject({ projectileCount: 2, projectileDamageScale: 0.7, volleyDamageMultiplier: 1.4, pierceCount: 3, ricochetCount: 2 });
    expect(max.mechanics.projectileCount).toBe(2);
    expect(max.mechanics.shrapnelCount).toBeGreaterThan(0);
    expect(max.resolvedStats.character.critChance).toBeGreaterThan(0);
    expect(max.derived.nominalTriggerDps).toBeGreaterThan(baseline.derived.nominalTriggerDps);
  });

  it('locks three mechanically distinct WS20 archetype candidates without a universal mandatory card', () => {
    const scalar = runDeterministicBalanceScenario('WS20_SCALAR_PRECISION');
    const crowd = runDeterministicBalanceScenario('WS20_CROWD_CHAIN');
    const survival = runDeterministicBalanceScenario('WS20_SURVIVAL_SUPPORT');

    const ids = (snapshot: any) => new Set(snapshot.upgrades.map((entry: { id: string }) => entry.id));
    const scalarIds = ids(scalar);
    const crowdIds = ids(crowd);
    const survivalIds = ids(survival);
    const universal = [...scalarIds].filter(id => crowdIds.has(id) && survivalIds.has(id));

    expect(universal).toEqual([]);

    expect(scalar.mechanics).toMatchObject({
      projectileCount: 2,
      pierceCount: 0,
      ricochetCount: 0,
      shrapnelCount: 0
    });
    expect(scalar.resolvedStats.character.critChance).toBeGreaterThan(0);

    expect(crowd.mechanics.projectileCount).toBe(2);
    expect(crowd.mechanics.pierceCount).toBe(3);
    expect(crowd.mechanics.ricochetCount).toBe(2);
    expect(crowd.mechanics.shrapnelCount).toBeGreaterThan(0);
    expect(crowd.upgradeLevels['explosive-rivet']).toBe(3);

    expect(survival.mechanics.projectileCount).toBe(1);
    expect(survival.resolvedStats.character.maxHp).toBeGreaterThan(100);
    expect(survival.upgradeLevels['armor-plate']).toBe(4);
    expect(survival.upgradeLevels['field-repair']).toBe(3);
    expect(survival.upgradeLevels['impact-shield']).toBe(2);
    expect(survival.upgradeLevels['call-rig']).toBe(1);
  });

  it('keeps the WS20 scalar candidate inside the PB1 late direct-power ceiling before Production viability testing', async () => {
    const { POWER_BUDGET, POWER_BUDGET_REFERENCE } = await import('../../src/balance/power-budget.js');
    const scalar = runDeterministicBalanceScenario('WS20_SCALAR_PRECISION');
    const multiplier = scalar.derived.nominalTriggerDps / POWER_BUDGET_REFERENCE.runnerBaseNominalDirectDps;

    expect(multiplier).toBeGreaterThanOrEqual(POWER_BUDGET.axes.singleTarget.stageEnvelopes[2].minMultiplier);
    expect(multiplier).toBeLessThanOrEqual(POWER_BUDGET.axes.singleTarget.lateBuildSoftMaxMultiplier);
  });
});
