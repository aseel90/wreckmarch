import { describe, expect, it } from 'vitest';
import { RUN_BALANCE, getEnemyDifficultyMultipliers, getPlayerMoveSpeed, getPressureStep, getWaveNumber } from '../../src/balance/run-balance.js';
import { RunDirector } from '../../src/balance/run-director.js';
import { getEnemyDefinition } from '../../src/enemies/enemy-registry.js';
import { resolveEnemySpawnStats } from '../../src/enemies/enemy-factory.js';

describe('Wreckmarch run balance', () => {
  it('uses 60-second waves with four 15-second pressure steps', () => {
    expect(RUN_BALANCE.waveDurationSeconds).toBe(60);
    expect(RUN_BALANCE.pressureStepSeconds).toBe(15);
    expect(getWaveNumber(0)).toBe(1);
    expect(getWaveNumber(59.9)).toBe(1);
    expect(getWaveNumber(60)).toBe(2);
    expect(getWaveNumber(599)).toBe(10);
    expect(getPressureStep(0)).toBe(0);
    expect(getPressureStep(15)).toBe(1);
    expect(getPressureStep(30)).toBe(2);
    expect(getPressureStep(45)).toBe(3);
  });

  it('caps Fleet Feet at three +6% levels and below the 310 hard cap', () => {
    expect(RUN_BALANCE.player.fleetFeetPercent).toBe(.06);
    expect(RUN_BALANCE.player.fleetFeetMaxLevel).toBe(3);
    expect(getPlayerMoveSpeed(255, 0)).toBe(255);
    expect(getPlayerMoveSpeed(255, 1)).toBeCloseTo(270.3, 5);
    expect(getPlayerMoveSpeed(255, 3)).toBeCloseTo(303.70908, 5);
    expect(getPlayerMoveSpeed(255, 99)).toBeCloseTo(303.70908, 5);
  });

  it('keeps global speed scaling restrained while HP/damage grow by wave', () => {
    expect(getEnemyDifficultyMultipliers(0)).toEqual({ hp: 1, damage: 1, speed: 1 });
    expect(getEnemyDifficultyMultipliers(599)).toEqual({ hp: 1.9, damage: 1.36, speed: 1.09 });
  });

  it('blocks spawns by threat budget as well as active count', () => {
    const active = [{ active: true, threatValue: 8 }, { active: true, threatValue: 7 }];
    const scene: any = {
      runTime: 0,
      gameOver: false,
      enemies: {
        children: { iterate: (fn: any) => active.forEach(fn) },
        countActive: () => active.length
      }
    };
    const director = new RunDirector(scene);
    expect(director.getState().threatBudget).toBe(16);
    expect(director.canSpawn(1)).toBe(true);
    expect(director.canSpawn(2)).toBe(false);
  });

  it('applies wave multipliers to enemy stats when run balance is enabled', () => {
    const rat = getEnemyDefinition('scrap-rat');
    const stats = resolveEnemySpawnStats(rat, {
      runTime: 599,
      useRunBalance: true,
      randomBetween: (min: number) => min
    });
    expect(stats.hp).toBeCloseTo(54 * 1.9, 5);
    expect(stats.speed).toBeCloseTo(88 * 1.09, 5);
    expect(stats.damage).toBeCloseTo(10 * 1.36, 5);
  });

  it('records two guaranteed Elite crate milestones', () => {
    expect(RUN_BALANCE.eliteRewards.guaranteedAtSeconds).toEqual([270, 450]);
    expect(RUN_BALANCE.eliteRewards.choices).toBe(3);
    expect(RUN_BALANCE.eliteRewards.minimumRarity).toBe('RARE');
  });
});
