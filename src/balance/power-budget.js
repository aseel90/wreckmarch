/* WRECKMARCH — U4-B canonical multi-axis power budget (measurement/design only) */

export const POWER_BUDGET_VERSION = 'U4-B-PB1';

const freeze = Object.freeze;

export const POWER_BUDGET_REFERENCE = freeze({
  runnerBaseDamage: 24,
  runnerBaseFireDelayMs: 390,
  runnerBaseNominalDirectDps: 24 * (1000 / 390),
  runnerBaseRange: 570,
  runnerBaseMoveSpeed: 255,
  runnerMoveSpeedHardCap: 280
});

export const POWER_BUDGET_BASELINE_EVIDENCE = freeze({
  strongScalarBuild: freeze({
    durationSeconds: 459.506,
    finalWave: 8,
    kills: 769,
    killsPerMinute: 100.412,
    averageDps: 143.19,
    peakDps1s: 679.373,
    playerHits: 10,
    peakActiveEnemies: 14,
    surgeActiveCap: 42,
    peakActiveProjectiles: 36,
    projectileSpawns: 6255,
    finalDamage: 49.7664,
    finalFireDelayMs: 193.35808487423998,
    projectileCount: 3,
    multiShotDamageScale: 0.9,
    critChance: 0.05,
    critDamageMultiplier: 1.5
  }),
  crowdUtilityBuild: freeze({
    durationSeconds: 242.157,
    finalWave: 5,
    kills: 309,
    killsPerMinute: 76.562,
    averageDps: 92.338,
    peakDps1s: 322.88,
    playerHits: 12,
    peakActiveEnemies: 18,
    surgeActiveCap: 36,
    peakActiveProjectiles: 31,
    projectileSpawns: 3453,
    finalDamage: 24,
    finalFireDelayMs: 343.2,
    projectileCount: 2,
    multiShotDamageScale: 0.9,
    critChance: 0.05,
    critDamageMultiplier: 1.5
  })
});

export const POWER_BUDGET = freeze({
  version: POWER_BUDGET_VERSION,
  rarityPowerMultipliers: freeze({ COMMON: 1, RARE: 1.15, EPIC: 1.3, LEGENDARY: 1.5 }),
  axes: freeze({
    singleTarget: freeze({
      commonDirectPickGain: freeze({ min: 0.08, target: 0.12, max: 0.15 }),
      stageEnvelopes: freeze([
        freeze({ key: 'early', minWave: 1, maxWave: 3, minMultiplier: 1.0, maxMultiplier: 1.6 }),
        freeze({ key: 'mid', minWave: 4, maxWave: 6, minMultiplier: 1.6, maxMultiplier: 2.8 }),
        freeze({ key: 'late', minWave: 7, maxWave: 10, minMultiplier: 2.8, maxMultiplier: 4.25 })
      ]),
      lateBuildSoftMaxMultiplier: 4.25,
      lateBuildRedFlagMultiplier: 4.75
    }),
    crowd: freeze({
      lateSurgeActiveCapUtilizationMin: 0.40,
      preferredSurgeActiveCapUtilization: freeze({ min: 0.45, max: 0.70 }),
      lateKillToSpawnRedFlagRatio: 0.985,
      combinedSecondaryDamageBudgetPerPrimaryVolley: 1.5
    }),
    burst: freeze({
      preferredPeak1sToAverageRatioMax: 3.25,
      redFlagPeak1sToAverageRatio: 4.0
    }),
    safety: freeze({
      runnerRangeMultiplierWithoutExplicitTradeoffMax: 1.35,
      runnerMoveSpeedHardCap: 280
    }),
    survivability: freeze({
      commonEffectiveHpGain: freeze({ min: 10, target: 15, max: 20 }),
      preferredLateSecondsPerPlayerHit: freeze({ min: 15, max: 30 }),
      redFlagLateSecondsPerPlayerHit: 40
    })
  }),
  stacking: freeze({
    scalarRule: 'BASE_RELATIVE_ADDITIVE',
    repeatedLevelsMayNotCompoundResolvedValue: true,
    commonSingleAxisMaxMultiplier: 1.6,
    commonDamageTimesFireRateMaxMultiplier: 2.5
  }),
  volley: freeze({
    rule: 'REDISTRIBUTE_TRIGGER_DAMAGE_BUDGET',
    twinProjectileCount: 2,
    twinLevel1SingleTargetMultiplier: 1.2,
    twinLevel2SingleTargetMultiplier: 1.4,
    twinMaxSingleTargetMultiplier: 1.4,
    fullDamageDuplicateProjectilesAllowed: false
  }),
  chainedMechanics: freeze({
    maxSecondaryProcDepth: 1,
    recursiveFullStrengthProcsAllowed: false,
    perMechanicAddedDamageSoftCaps: freeze({
      pierce: 0.90,
      ricochet: 0.75,
      shrapnel: 0.70,
      explosion: 1.32
    }),
    combinedAddedDamageSoftCap: 1.50,
    profiles: freeze({
      pierce: freeze({
        maxAdditionalTargets: 3,
        standaloneAddedDamageByCount: freeze([0, 0.30, 0.60, 0.90])
      }),
      ricochet: freeze({
        maxBounces: 2,
        targetMode: 'RANDOM_ELIGIBLE',
        standaloneAddedDamageByCount: freeze([0, 0.50, 0.75])
      }),
      shrapnel: freeze({
        maxFragments: 4,
        maxTriggersPerPrimaryProjectile: 1,
        standaloneAddedDamageByFragmentCount: freeze({ 0: 0, 2: 0.50, 4: 0.70 })
      }),
      explosion: freeze({
        maxTriggersPerPrimaryProjectile: 1,
        damageCoefficient: 0.33,
        targetCapByLevel: freeze([0, 3, 3, 4]),
        radiusByLevel: freeze([0, 90, 105, 120])
      })
    })
  }),
  buildDiversity: freeze({
    maxSingleCardShareOfFinalDirectPowerBudget: 0.35,
    minimumDistinctWave8CapableBuildArchetypes: 3,
    mandatoryAcrossUnrelatedBuildsAllowed: false
  }),
  mobilePerformance: freeze({
    sustainedProjectileSpawnsPerSecondSoftMax: 20,
    oneSecondProjectileSpawnBurstSoftMax: 40,
    peakActiveProjectilesSoftMax: 48,
    longFrameBudget: 0
  })
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function expectedCriticalDamageMultiplier(critChance = 0, critDamageMultiplier = 1.5) {
  const chance = Math.max(0, Math.min(1, finite(critChance)));
  const critMultiplier = Math.max(1, finite(critDamageMultiplier, 1));
  return 1 + chance * (critMultiplier - 1);
}

/**
 * @param {{
 *   damage?: number,
 *   fireDelayMs?: number,
 *   projectileCount?: number,
 *   projectileDamageScale?: number,
 *   critChance?: number,
 *   critDamageMultiplier?: number
 * }} [input]
 */
export function estimateNominalDirectPower({
  damage = POWER_BUDGET_REFERENCE.runnerBaseDamage,
  fireDelayMs = POWER_BUDGET_REFERENCE.runnerBaseFireDelayMs,
  projectileCount = 1,
  projectileDamageScale = 1,
  critChance = 0,
  critDamageMultiplier = 1.5
} = {}) {
  const safeDamage = Math.max(0, finite(damage));
  const safeDelay = Math.max(1, finite(fireDelayMs, POWER_BUDGET_REFERENCE.runnerBaseFireDelayMs));
  const safeCount = Math.max(1, Math.floor(finite(projectileCount, 1)));
  const safeProjectileScale = Math.max(0, finite(projectileDamageScale, 1));
  const crit = expectedCriticalDamageMultiplier(critChance, critDamageMultiplier);
  const volleyDamage = safeDamage * safeCount * safeProjectileScale;
  const dps = volleyDamage * (1000 / safeDelay) * crit;
  const multiplier = dps / POWER_BUDGET_REFERENCE.runnerBaseNominalDirectDps;
  return freeze({ volleyDamage, expectedCritMultiplier: crit, dps, multiplier });
}

export function getSingleTargetEnvelopeForWave(wave = 1) {
  const safeWave = Math.max(1, Math.min(10, Math.floor(finite(wave, 1))));
  return POWER_BUDGET.axes.singleTarget.stageEnvelopes.find(entry => safeWave >= entry.minWave && safeWave <= entry.maxWave)
    || POWER_BUDGET.axes.singleTarget.stageEnvelopes[POWER_BUDGET.axes.singleTarget.stageEnvelopes.length - 1];
}

export function evaluateRunPowerPressure({
  durationSeconds = 0,
  averageDps = 0,
  peakDps1s = 0,
  playerHits = 0,
  peakActiveEnemies = 0,
  surgeActiveCap = 1,
  kills = 0,
  spawned = 0,
  projectileSpawns = 0,
  peakActiveProjectiles = 0
} = {}) {
  const duration = Math.max(0, finite(durationSeconds));
  const average = Math.max(0, finite(averageDps));
  const peak = Math.max(0, finite(peakDps1s));
  const hits = Math.max(0, finite(playerHits));
  const cap = Math.max(1, finite(surgeActiveCap, 1));
  const spawnCount = Math.max(0, finite(spawned));
  return freeze({
    peakToAverageDpsRatio: average > 0 ? peak / average : 0,
    surgeActiveCapUtilization: Math.max(0, finite(peakActiveEnemies)) / cap,
    killToSpawnRatio: spawnCount > 0 ? Math.max(0, finite(kills)) / spawnCount : 0,
    secondsPerPlayerHit: hits > 0 ? duration / hits : Infinity,
    sustainedProjectileSpawnsPerSecond: duration > 0 ? Math.max(0, finite(projectileSpawns)) / duration : 0,
    peakActiveProjectiles: Math.max(0, finite(peakActiveProjectiles))
  });
}
