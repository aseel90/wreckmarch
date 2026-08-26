/* WRECKMARCH — canonical run balance foundation */
export const RUN_BALANCE = Object.freeze({
  runDurationSeconds: 600,
  waveDurationSeconds: 60,
  pressureStepSeconds: 15,
  pressureBudgetMultipliers: Object.freeze([1, 1.08, 1.16, 1.24]),
  pressureSpawnMultipliers: Object.freeze([1, .94, .88, .82]),
  player: Object.freeze({
    baseMoveSpeed: 255,
    fleetFeetPercent: .06,
    fleetFeetMaxLevel: 3,
    moveSpeedHardCap: 310
  }),
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
  eliteRewards: Object.freeze({
    guaranteedAtSeconds: Object.freeze([270, 450]),
    bonusWindowStartSeconds: 540,
    choices: 3,
    minimumRarity: 'RARE'
  })
});

export function getWaveNumber(runTimeSeconds = 0) {
  const elapsed = Math.max(0, Number(runTimeSeconds) || 0);
  return Math.min(RUN_BALANCE.waves.length, Math.floor(elapsed / RUN_BALANCE.waveDurationSeconds) + 1);
}

export function getPressureStep(runTimeSeconds = 0) {
  const elapsed = Math.max(0, Number(runTimeSeconds) || 0);
  const withinWave = elapsed % RUN_BALANCE.waveDurationSeconds;
  return Math.min(3, Math.floor(withinWave / RUN_BALANCE.pressureStepSeconds));
}

export function getWaveBalance(runTimeSeconds = 0) {
  return RUN_BALANCE.waves[getWaveNumber(runTimeSeconds) - 1];
}

export function getEnemyDifficultyMultipliers(runTimeSeconds = 0) {
  const wave = getWaveBalance(runTimeSeconds);
  return Object.freeze({
    hp: wave.hpMultiplier,
    damage: wave.damageMultiplier,
    speed: wave.speedMultiplier
  });
}

export function getPlayerMoveSpeed(baseSpeed = RUN_BALANCE.player.baseMoveSpeed, fleetFeetLevel = 0) {
  const levels = Math.max(0, Math.min(RUN_BALANCE.player.fleetFeetMaxLevel, Math.floor(Number(fleetFeetLevel) || 0)));
  const speed = Number(baseSpeed) * Math.pow(1 + RUN_BALANCE.player.fleetFeetPercent, levels);
  return Math.min(RUN_BALANCE.player.moveSpeedHardCap, speed);
}
