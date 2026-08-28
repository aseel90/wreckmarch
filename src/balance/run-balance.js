/* WRECKMARCH — canonical run balance foundation */

const pool = (wave, ratWeight, houndWeight = 0, sawbugWeight = 0) => Object.freeze({
  wave,
  entries: Object.freeze([
    Object.freeze({ id: 'scrap-rat', weight: ratWeight, threat: 1 }),
    ...(houndWeight > 0 ? [Object.freeze({ id: 'rust-hound', weight: houndWeight, threat: 3 })] : []),
    ...(sawbugWeight > 0 ? [Object.freeze({ id: 'sawbug', weight: sawbugWeight, threat: 2 })] : [])
  ])
});

export const PRESSURE_PHASES = Object.freeze([
  Object.freeze({ key: 'lull', label: 'LULL', threatBudgetMultiplier: .82, spawnIntervalMultiplier: 1.18, activeCapDelta: -4, houndWeightMultiplier: .55, sawbugWeightMultiplier: .65 }),
  Object.freeze({ key: 'build', label: 'BUILD', threatBudgetMultiplier: 1.00, spawnIntervalMultiplier: 1.00, activeCapDelta: -1, houndWeightMultiplier: .85, sawbugWeightMultiplier: .95 }),
  Object.freeze({ key: 'surge', label: 'SURGE', threatBudgetMultiplier: 1.22, spawnIntervalMultiplier: .80, activeCapDelta: 2, houndWeightMultiplier: 1.30, sawbugWeightMultiplier: 1.15 }),
  Object.freeze({ key: 'breather', label: 'BREATHER', threatBudgetMultiplier: .88, spawnIntervalMultiplier: 1.14, activeCapDelta: -5, houndWeightMultiplier: .60, sawbugWeightMultiplier: .55 })
]);

export const RUN_BALANCE = Object.freeze({
  runDurationSeconds: 600,
  waveDurationSeconds: 60,
  pressureStepSeconds: 15,
  pressurePhases: PRESSURE_PHASES,
  enemyRoles: Object.freeze({
    'rust-hound': Object.freeze({
      role: 'hunter',
      threat: 3,
      chaseSpeedMultiplier: .72,
      behaviorConfig: Object.freeze({
        slideRangeMin: 100,
        slideRangeMax: 270,
        holdRange: 130,
        initialCooldownMinMs: 350,
        initialCooldownMaxMs: 550,
        cooldownMinMs: 1450,
        cooldownMaxMs: 1850,
        telegraphMs: 300,
        recoverMs: 360,
        chaseSharpness: 7.2
      })
    }),
    'sawbug': Object.freeze({
      role: 'ranged-spitter',
      threat: 2,
      chaseSpeedMultiplier: 1,
      behaviorConfig: Object.freeze({
        preferredRangeMin: 250,
        preferredRangeMax: 380,
        retreatRange: 205,
        cooldownMinMs: 1550,
        cooldownMaxMs: 1950,
        telegraphMs: 320,
        projectileSpeed: 275,
        projectileDamage: 11,
        stationaryTargetSpeedThreshold: 24,
        stationaryFireRangeMax: 430,
        stationaryCooldownMultiplier: .78
      })
    })
  }),
  player: Object.freeze({ baseMoveSpeed: 255, fleetFeetPercent: .06, fleetFeetMaxLevel: 3, moveSpeedHardCap: 310 }),
  waves: Object.freeze([
    Object.freeze({ wave: 1, threatBudget: 16, activeCap: 28, spawnIntervalMs: 690, hpMultiplier: 1.00, damageMultiplier: 1.00, speedMultiplier: 1.00 }),
    Object.freeze({ wave: 2, threatBudget: 19, activeCap: 30, spawnIntervalMs: 650, hpMultiplier: 1.10, damageMultiplier: 1.04, speedMultiplier: 1.01 }),
    Object.freeze({ wave: 3, threatBudget: 22, activeCap: 32, spawnIntervalMs: 610, hpMultiplier: 1.20, damageMultiplier: 1.08, speedMultiplier: 1.02 }),
    Object.freeze({ wave: 4, threatBudget: 25, activeCap: 34, spawnIntervalMs: 575, hpMultiplier: 1.30, damageMultiplier: 1.12, speedMultiplier: 1.03 }),
    Object.freeze({ wave: 5, threatBudget: 29, activeCap: 36, spawnIntervalMs: 540, hpMultiplier: 1.40, damageMultiplier: 1.16, speedMultiplier: 1.04 }),
    Object.freeze({ wave: 6, threatBudget: 33, activeCap: 39, spawnIntervalMs: 505, hpMultiplier: 1.50, damageMultiplier: 1.20, speedMultiplier: 1.05 }),
    Object.freeze({ wave: 7, threatBudget: 37, activeCap: 42, spawnIntervalMs: 475, hpMultiplier: 1.60, damageMultiplier: 1.24, speedMultiplier: 1.06 }),
    Object.freeze({ wave: 8, threatBudget: 41, activeCap: 45, spawnIntervalMs: 445, hpMultiplier: 1.70, damageMultiplier: 1.28, speedMultiplier: 1.07 }),
    Object.freeze({ wave: 9, threatBudget: 46, activeCap: 48, spawnIntervalMs: 415, hpMultiplier: 1.80, damageMultiplier: 1.32, speedMultiplier: 1.08 }),
    Object.freeze({ wave: 10, threatBudget: 51, activeCap: 50, spawnIntervalMs: 390, hpMultiplier: 1.90, damageMultiplier: 1.36, speedMultiplier: 1.09 })
  ]),
  enemyPools: Object.freeze([
    pool(1, 1.00),
    pool(2, .78, .22),
    pool(3, .62, .22, .16),
    pool(4, .58, .24, .18),
    pool(5, .56, .24, .20),
    pool(6, .54, .25, .21),
    pool(7, .52, .26, .22),
    pool(8, .50, .27, .23),
    pool(9, .48, .28, .24),
    pool(10, .46, .29, .25)
  ]),
  eliteRewards: Object.freeze({ guaranteedAtSeconds: Object.freeze([270, 450]), bonusWindowStartSeconds: 540, choices: 3, minimumRarity: 'RARE' })
});

export function getWaveNumber(runTimeSeconds = 0) {
  const elapsed = Math.max(0, Number(runTimeSeconds) || 0);
  return Math.min(RUN_BALANCE.waves.length, Math.floor(elapsed / RUN_BALANCE.waveDurationSeconds) + 1);
}

export function getPressureStep(runTimeSeconds = 0) {
  const elapsed = Math.max(0, Number(runTimeSeconds) || 0);
  const withinWave = elapsed % RUN_BALANCE.waveDurationSeconds;
  return Math.min(PRESSURE_PHASES.length - 1, Math.floor(withinWave / RUN_BALANCE.pressureStepSeconds));
}

export function getPressurePhase(runTimeSeconds = 0) {
  return PRESSURE_PHASES[getPressureStep(runTimeSeconds)];
}

export function getWaveBalance(runTimeSeconds = 0) { return RUN_BALANCE.waves[getWaveNumber(runTimeSeconds) - 1]; }
export function getEnemyPool(runTimeSeconds = 0) { return RUN_BALANCE.enemyPools[getWaveNumber(runTimeSeconds) - 1]; }

export function pickEnemyForRun(runTimeSeconds = 0, random = Math.random) {
  const phase = getPressurePhase(runTimeSeconds);
  const entries = getEnemyPool(runTimeSeconds).entries.map(entry => ({
    ...entry,
    weight: entry.id === 'rust-hound'
      ? entry.weight * phase.houndWeightMultiplier
      : entry.id === 'sawbug'
        ? entry.weight * phase.sawbugWeightMultiplier
        : entry.weight
  }));
  const roll = Math.max(0, Math.min(.999999, Number(random?.()) || 0));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;
  let cursor = roll * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor < 0) return Object.freeze(entry);
  }
  return Object.freeze(entries[entries.length - 1]);
}

export function getEnemyDifficultyMultipliers(runTimeSeconds = 0) {
  const wave = getWaveBalance(runTimeSeconds);
  return Object.freeze({ hp: wave.hpMultiplier, damage: wave.damageMultiplier, speed: wave.speedMultiplier });
}

export function getPlayerMoveSpeed(baseSpeed = RUN_BALANCE.player.baseMoveSpeed, fleetFeetLevel = 0) {
  const levels = Math.max(0, Math.min(RUN_BALANCE.player.fleetFeetMaxLevel, Math.floor(Number(fleetFeetLevel) || 0)));
  const speed = Number(baseSpeed) * Math.pow(1 + RUN_BALANCE.player.fleetFeetPercent, levels);
  return Math.min(RUN_BALANCE.player.moveSpeedHardCap, speed);
}
