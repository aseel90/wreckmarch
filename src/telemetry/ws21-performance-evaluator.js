// WRECKMARCH — WS21 measurement-only performance evidence evaluator

export const WS21_PROVISIONAL_LIMITS = Object.freeze({
  averageProjectileSpawnsPerSecond: 20,
  peakProjectileSpawns1s: 40,
  peakActiveProjectiles: 48,
  longFrames: 0
});

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function evaluateWs21Performance(report, limits = WS21_PROVISIONAL_LIMITS) {
  const performance = report?.performance || {};
  const metrics = {
    averageProjectileSpawnsPerSecond: n(performance.averageProjectileSpawnsPerSecond),
    peakProjectileSpawns1s: n(performance.peakProjectileSpawns1s),
    peakActiveProjectiles: n(performance.peakActiveProjectiles),
    longFrames: Math.max(0, Math.floor(n(performance.longFrames))),
    peakActiveHeroProjectiles: Math.max(0, Math.floor(n(performance.peakActiveHeroProjectiles))),
    peakActiveShrapnel: Math.max(0, Math.floor(n(performance.peakActiveShrapnel))),
    peakActiveSupportProjectiles: Math.max(0, Math.floor(n(performance.peakActiveSupportProjectiles)))
  };

  const exceeded = {
    averageProjectileSpawnsPerSecond: metrics.averageProjectileSpawnsPerSecond > n(limits.averageProjectileSpawnsPerSecond, 20),
    peakProjectileSpawns1s: metrics.peakProjectileSpawns1s > n(limits.peakProjectileSpawns1s, 40),
    peakActiveProjectiles: metrics.peakActiveProjectiles > n(limits.peakActiveProjectiles, 48),
    longFrames: metrics.longFrames > n(limits.longFrames, 0)
  };

  const projectileCeilingExceeded = exceeded.averageProjectileSpawnsPerSecond || exceeded.peakProjectileSpawns1s || exceeded.peakActiveProjectiles;
  const hasLongFramePressure = exceeded.longFrames;

  let decision = 'within_provisional_budget';
  if (projectileCeilingExceeded && !hasLongFramePressure) decision = 'reconsider_provisional_ceiling_before_gameplay_change';
  else if (hasLongFramePressure) decision = 'investigate_correlated_pressure_owner_before_gameplay_change';

  const activePressure = [
    ['hero', metrics.peakActiveHeroProjectiles],
    ['shrapnel', metrics.peakActiveShrapnel],
    ['support', metrics.peakActiveSupportProjectiles]
  ].sort((a, b) => b[1] - a[1]);

  return {
    decision,
    metrics,
    exceeded,
    dominantActiveProjectileClass: activePressure[0][1] > 0 ? activePressure[0][0] : 'none',
    protectedGameplayChange: true
  };
}
