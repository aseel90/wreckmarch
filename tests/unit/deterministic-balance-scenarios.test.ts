import { describe, expect, it } from 'vitest';
import {
  BALANCE_SCENARIO_IDS,
  runAllDeterministicBalanceScenarios,
  runDeterministicBalanceScenario
} from '../../src/balance/deterministic-balance-scenarios.js';

describe('deterministic balance scenario suite', () => {
  it('locks the initial eight baseline scenarios in the approved execution set', () => {
    expect(BALANCE_SCENARIO_IDS).toEqual([
      'BASELINE_RUNNER_NO_UPGRADES',
      'TWIN_ONLY',
      'HEAVY_ONLY',
      'OVERCLOCK_ONLY',
      'HEAVY_OVERCLOCK',
      'TWIN_SHRAPNEL',
      'TWIN_PIERCE_RICOCHET',
      'CURRENT_MAX_POWER_BUILD'
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
});
