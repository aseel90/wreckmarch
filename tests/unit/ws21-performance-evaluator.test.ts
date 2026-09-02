import { describe, expect, it } from 'vitest';
import { evaluateWs21Performance, WS21_PROVISIONAL_LIMITS } from '../../src/telemetry/ws21-performance-evaluator.js';

describe('WS21 performance evidence evaluator', () => {
  it('accepts a run inside all provisional measurement targets', () => {
    const result = evaluateWs21Performance({ performance: {
      averageProjectileSpawnsPerSecond: 19.13,
      peakProjectileSpawns1s: 34,
      peakActiveProjectiles: 42,
      longFrames: 0,
      peakActiveHeroProjectiles: 18,
      peakActiveShrapnel: 20,
      peakActiveSupportProjectiles: 4
    } });

    expect(result.decision).toBe('within_provisional_budget');
    expect(result.dominantActiveProjectileClass).toBe('shrapnel');
    expect(result.protectedGameplayChange).toBe(true);
  });

  it('does not recommend a gameplay nerf when a provisional projectile ceiling is exceeded without long frames', () => {
    const result = evaluateWs21Performance({ performance: {
      averageProjectileSpawnsPerSecond: 24.5,
      peakProjectileSpawns1s: 46,
      peakActiveProjectiles: 52,
      longFrames: 0,
      peakActiveHeroProjectiles: 30,
      peakActiveShrapnel: 18,
      peakActiveSupportProjectiles: 4
    } });

    expect(result.exceeded.averageProjectileSpawnsPerSecond).toBe(true);
    expect(result.exceeded.peakProjectileSpawns1s).toBe(true);
    expect(result.exceeded.peakActiveProjectiles).toBe(true);
    expect(result.decision).toBe('reconsider_provisional_ceiling_before_gameplay_change');
    expect(result.protectedGameplayChange).toBe(true);
  });

  it('routes long-frame evidence to pressure-owner investigation before any gameplay change', () => {
    const result = evaluateWs21Performance({ performance: {
      averageProjectileSpawnsPerSecond: 18,
      peakProjectileSpawns1s: 32,
      peakActiveProjectiles: 44,
      longFrames: 7,
      peakActiveHeroProjectiles: 12,
      peakActiveShrapnel: 28,
      peakActiveSupportProjectiles: 4
    } });

    expect(result.exceeded.longFrames).toBe(true);
    expect(result.decision).toBe('investigate_correlated_pressure_owner_before_gameplay_change');
    expect(result.dominantActiveProjectileClass).toBe('shrapnel');
  });

  it('keeps the frozen WS21 provisional limits explicit and regression-locked', () => {
    expect(WS21_PROVISIONAL_LIMITS).toEqual({
      averageProjectileSpawnsPerSecond: 20,
      peakProjectileSpawns1s: 40,
      peakActiveProjectiles: 48,
      longFrames: 0
    });
  });
});
