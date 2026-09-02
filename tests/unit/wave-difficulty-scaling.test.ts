import { describe, expect, it } from 'vitest';
import { RUN_BALANCE } from '../../src/balance/run-balance.js';
import {
  POWER_BUDGET,
  estimateNominalDirectPower,
  evaluateRunPowerPressure,
  getSingleTargetEnvelopeForWave
} from '../../src/balance/power-budget.js';

const RUN_0026 = Object.freeze({
  durationSeconds: 572.977,
  averageDps: 147.426,
  peakDps1s: 499.897,
  playerHits: 13,
  peakActiveEnemies: 31,
  wave10SurgeActiveCap: 46,
  kills: 906,
  spawned: 644 + 148 + 137,
  projectileSpawns: 10959,
  peakActiveProjectiles: 24,
  finalWeapon: Object.freeze({
    damage: 30.624,
    fireDelayMs: 217.63392857142856,
    projectileCount: 2,
    projectileDamageScale: 0.7,
    critChance: 0.1575,
    critDamageMultiplier: 1.5
  })
});

describe('WS16 wave / difficulty scaling baseline', () => {
  it('keeps base wave pressure monotonic without relying on HP inflation alone', () => {
    const waves = RUN_BALANCE.waves;
    expect(waves).toHaveLength(10);

    for (let index = 1; index < waves.length; index += 1) {
      const previous = waves[index - 1];
      const current = waves[index];
      expect(current.threatBudget).toBeGreaterThan(previous.threatBudget);
      expect(current.activeCap).toBeGreaterThan(previous.activeCap);
      expect(current.spawnIntervalMs).toBeLessThan(previous.spawnIntervalMs);
      expect(current.hpMultiplier).toBeGreaterThan(previous.hpMultiplier);
      expect(current.damageMultiplier).toBeGreaterThan(previous.damageMultiplier);
      expect(current.speedMultiplier).toBeGreaterThan(previous.speedMultiplier);
    }
  });

  it('scales density/cadence pressure materially faster than durability and speed', () => {
    const first = RUN_BALANCE.waves[0];
    const last = RUN_BALANCE.waves[9];
    const threatGrowth = last.threatBudget / first.threatBudget;
    const activeCapGrowth = last.activeCap / first.activeCap;
    const spawnRateGrowth = (1000 / last.spawnIntervalMs) / (1000 / first.spawnIntervalMs);
    const threatThroughputGrowth = (last.threatBudget / last.spawnIntervalMs) / (first.threatBudget / first.spawnIntervalMs);

    expect(first).toMatchObject({ hpMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1 });
    expect(last).toMatchObject({ hpMultiplier: 1.9, damageMultiplier: 1.36, speedMultiplier: 1.09 });
    expect(last.hpMultiplier).toBeLessThanOrEqual(2);
    expect(last.speedMultiplier).toBeLessThanOrEqual(1.10);
    expect(threatGrowth).toBeGreaterThan(last.hpMultiplier);
    expect(activeCapGrowth).toBeGreaterThan(1.6);
    expect(spawnRateGrowth).toBeGreaterThan(1.6);
    expect(threatThroughputGrowth).toBeGreaterThan(5);
  });

  it('keeps RUN-0026 final direct power inside the approved late-game envelope', () => {
    const power = estimateNominalDirectPower(RUN_0026.finalWeapon);
    const late = getSingleTargetEnvelopeForWave(10);

    expect(power.multiplier).toBeCloseTo(3.453325568, 6);
    expect(power.multiplier).toBeGreaterThanOrEqual(late.minMultiplier);
    expect(power.multiplier).toBeLessThanOrEqual(late.maxMultiplier);
    expect(late).toMatchObject({ key: 'late', minMultiplier: 2.8, maxMultiplier: 4.25 });
  });

  it('keeps RUN-0026 crowd pressure below screen-delete failure signals', () => {
    const pressure = evaluateRunPowerPressure({
      durationSeconds: RUN_0026.durationSeconds,
      averageDps: RUN_0026.averageDps,
      peakDps1s: RUN_0026.peakDps1s,
      playerHits: RUN_0026.playerHits,
      peakActiveEnemies: RUN_0026.peakActiveEnemies,
      surgeActiveCap: RUN_0026.wave10SurgeActiveCap,
      kills: RUN_0026.kills,
      spawned: RUN_0026.spawned,
      projectileSpawns: RUN_0026.projectileSpawns,
      peakActiveProjectiles: RUN_0026.peakActiveProjectiles
    });

    expect(pressure.surgeActiveCapUtilization).toBeCloseTo(31 / 46, 6);
    expect(pressure.surgeActiveCapUtilization).toBeGreaterThanOrEqual(POWER_BUDGET.axes.crowd.preferredSurgeActiveCapUtilization.min);
    expect(pressure.surgeActiveCapUtilization).toBeLessThanOrEqual(POWER_BUDGET.axes.crowd.preferredSurgeActiveCapUtilization.max);
    expect(pressure.killToSpawnRatio).toBeCloseTo(906 / 929, 6);
    expect(pressure.killToSpawnRatio).toBeLessThan(POWER_BUDGET.axes.crowd.lateKillToSpawnRedFlagRatio);
    expect(pressure.peakToAverageDpsRatio).toBeLessThan(POWER_BUDGET.axes.burst.redFlagPeak1sToAverageRatio);
  });

  it('records but does not hide the WS21 mobile-pressure observation', () => {
    const pressure = evaluateRunPowerPressure({
      durationSeconds: RUN_0026.durationSeconds,
      projectileSpawns: RUN_0026.projectileSpawns,
      peakActiveProjectiles: RUN_0026.peakActiveProjectiles
    });

    expect(pressure.sustainedProjectileSpawnsPerSecond).toBeCloseTo(19.126422, 5);
    expect(pressure.sustainedProjectileSpawnsPerSecond).toBeLessThanOrEqual(POWER_BUDGET.mobilePerformance.sustainedProjectileSpawnsPerSecondSoftMax);
    expect(pressure.peakActiveProjectiles).toBeLessThanOrEqual(POWER_BUDGET.mobilePerformance.peakActiveProjectilesSoftMax);
  });
});
