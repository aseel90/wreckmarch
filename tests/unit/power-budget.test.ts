import { describe, expect, it } from 'vitest';
import {
  POWER_BUDGET,
  POWER_BUDGET_BASELINE_EVIDENCE,
  POWER_BUDGET_REFERENCE,
  estimateNominalDirectPower,
  evaluateRunPowerPressure,
  getSingleTargetEnvelopeForWave
} from '../../src/balance/power-budget.js';

describe('U4-B multi-axis power budget', () => {
  it('locks the Runner direct-power reference to the measured canonical weapon baseline', () => {
    expect(POWER_BUDGET_REFERENCE.runnerBaseDamage).toBe(24);
    expect(POWER_BUDGET_REFERENCE.runnerBaseFireDelayMs).toBe(390);
    expect(POWER_BUDGET_REFERENCE.runnerBaseNominalDirectDps).toBeCloseTo(61.5384615, 6);
  });

  it('defines monotonic early, mid and late single-target envelopes without allowing the current exponential ceiling', () => {
    expect(getSingleTargetEnvelopeForWave(2)).toMatchObject({ key: 'early', maxMultiplier: 1.6 });
    expect(getSingleTargetEnvelopeForWave(5)).toMatchObject({ key: 'mid', maxMultiplier: 2.8 });
    expect(getSingleTargetEnvelopeForWave(8)).toMatchObject({ key: 'late', maxMultiplier: 4.25 });
    expect(POWER_BUDGET.axes.singleTarget.lateBuildRedFlagMultiplier).toBe(4.75);
  });

  it('uses base-relative additive scalar stacking and a true two-projectile Twin volley budget', () => {
    expect(POWER_BUDGET.stacking.scalarRule).toBe('BASE_RELATIVE_ADDITIVE');
    expect(POWER_BUDGET.stacking.repeatedLevelsMayNotCompoundResolvedValue).toBe(true);
    expect(POWER_BUDGET.stacking.commonSingleAxisMaxMultiplier).toBe(1.6);
    expect(POWER_BUDGET.volley).toMatchObject({
      twinProjectileCount: 2,
      twinLevel1SingleTargetMultiplier: 1.2,
      twinLevel2SingleTargetMultiplier: 1.4,
      fullDamageDuplicateProjectilesAllowed: false
    });
  });

  it('red-flags the measured strong scalar build while keeping the measured crowd/utility build below the late-build direct ceiling', () => {
    const strong = POWER_BUDGET_BASELINE_EVIDENCE.strongScalarBuild;
    const utility = POWER_BUDGET_BASELINE_EVIDENCE.crowdUtilityBuild;
    const strongDirect = estimateNominalDirectPower({
      damage: Number(strong.finalDamage),
      fireDelayMs: Number(strong.finalFireDelayMs),
      projectileCount: strong.projectileCount,
      projectileDamageScale: strong.multiShotDamageScale,
      critChance: strong.critChance,
      critDamageMultiplier: strong.critDamageMultiplier
    });
    const utilityDirect = estimateNominalDirectPower({
      damage: Number(utility.finalDamage),
      fireDelayMs: Number(utility.finalFireDelayMs),
      projectileCount: utility.projectileCount,
      projectileDamageScale: utility.multiShotDamageScale,
      critChance: utility.critChance,
      critDamageMultiplier: utility.critDamageMultiplier
    });

    expect(strongDirect.multiplier).toBeGreaterThan(POWER_BUDGET.axes.singleTarget.lateBuildRedFlagMultiplier);
    expect(strongDirect.multiplier).toBeGreaterThan(11);
    expect(utilityDirect.multiplier).toBeLessThan(POWER_BUDGET.axes.singleTarget.lateBuildRedFlagMultiplier);
  });

  it('turns the two real baseline runs into pressure diagnostics that explain the manual review', () => {
    const strong = POWER_BUDGET_BASELINE_EVIDENCE.strongScalarBuild;
    const utility = POWER_BUDGET_BASELINE_EVIDENCE.crowdUtilityBuild;
    const strongPressure = evaluateRunPowerPressure({
      ...strong,
      spawned: 778
    });
    const utilityPressure = evaluateRunPowerPressure({
      ...utility,
      spawned: 318
    });

    expect(strongPressure.surgeActiveCapUtilization).toBeLessThan(POWER_BUDGET.axes.crowd.lateSurgeActiveCapUtilizationMin);
    expect(strongPressure.killToSpawnRatio).toBeGreaterThan(POWER_BUDGET.axes.crowd.lateKillToSpawnRedFlagRatio);
    expect(strongPressure.peakToAverageDpsRatio).toBeGreaterThan(POWER_BUDGET.axes.burst.redFlagPeak1sToAverageRatio);
    expect(strongPressure.secondsPerPlayerHit).toBeGreaterThan(POWER_BUDGET.axes.survivability.redFlagLateSecondsPerPlayerHit);

    expect(utilityPressure.surgeActiveCapUtilization).toBeGreaterThanOrEqual(POWER_BUDGET.axes.crowd.lateSurgeActiveCapUtilizationMin);
    expect(utilityPressure.sustainedProjectileSpawnsPerSecond).toBeLessThan(POWER_BUDGET.mobilePerformance.sustainedProjectileSpawnsPerSecondSoftMax);
    expect(strongPressure.peakActiveProjectiles).toBeLessThan(POWER_BUDGET.mobilePerformance.peakActiveProjectilesSoftMax);
  });

  it('caps chained crowd mechanics and keeps a mobile headroom budget above the measured clean runs', () => {
    expect(POWER_BUDGET.chainedMechanics.maxSecondaryProcDepth).toBe(1);
    expect(POWER_BUDGET.chainedMechanics.recursiveFullStrengthProcsAllowed).toBe(false);
    expect(POWER_BUDGET.chainedMechanics.combinedAddedDamageSoftCap).toBe(1.5);
    expect(POWER_BUDGET.chainedMechanics.profiles.pierce.standaloneAddedDamageByCount).toEqual([0, 0.30, 0.60, 0.90]);
    expect(POWER_BUDGET.chainedMechanics.profiles.ricochet).toMatchObject({
      maxBounces: 2,
      targetMode: 'RANDOM_ELIGIBLE'
    });
    expect(POWER_BUDGET.chainedMechanics.profiles.shrapnel).toMatchObject({
      maxFragments: 4,
      maxTriggersPerPrimaryProjectile: 1
    });
    expect(POWER_BUDGET.mobilePerformance.peakActiveProjectilesSoftMax).toBeGreaterThan(36);
    expect(POWER_BUDGET.mobilePerformance.sustainedProjectileSpawnsPerSecondSoftMax).toBeGreaterThan(14.3);
  });
});
