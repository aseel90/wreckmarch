import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { RUN_BALANCE, getEnemyDifficultyMultipliers, getPlayerMoveSpeed, getPressurePhase, getPressureStep, getWaveNumber, pickEnemyForRun } from '../../src/balance/run-balance.js';
import { applyRunEnemyRoleProfile, RunDirector } from '../../src/balance/run-director.js';
import { getEnemyDefinition } from '../../src/enemies/enemy-registry.js';
import { resolveEnemySpawnStats } from '../../src/enemies/enemy-factory.js';

describe('Wreckmarch run balance', () => {
  it('uses 60-second waves with four readable 15-second pressure phases', () => {
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
    expect([0, 15, 30, 45].map(getPressurePhase).map(phase => phase.key)).toEqual(['lull', 'build', 'surge', 'breather']);
  });

  it('creates a real surge followed by a breather instead of monotonic spawn pressure', () => {
    const scene: any = {
      runTime: 0,
      gameOver: false,
      enemies: { children: { iterate() {} }, countActive: () => 0 }
    };
    const director = new RunDirector(scene);
    const lull = director.getState(0);
    const build = director.getState(15);
    const surge = director.getState(30);
    const breather = director.getState(45);

    expect(lull.pressurePhase).toBe('lull');
    expect(surge.pressurePhase).toBe('surge');
    expect(breather.pressurePhase).toBe('breather');
    expect(lull.threatBudget).toBeLessThan(build.threatBudget);
    expect(surge.threatBudget).toBeGreaterThan(build.threatBudget);
    expect(surge.spawnIntervalMs).toBeLessThan(build.spawnIntervalMs);
    expect(breather.threatBudget).toBeLessThan(surge.threatBudget);
    expect(breather.spawnIntervalMs).toBeGreaterThan(surge.spawnIntervalMs);
  });

  it('weights Rust Hounds toward surge windows and away from lull windows', () => {
    expect(pickEnemyForRun(60, () => .85).id).toBe('scrap-rat');
    expect(pickEnemyForRun(90, () => .85)).toMatchObject({ id: 'rust-hound', threat: 3 });
    expect(pickEnemyForRun(105, () => .85).id).toBe('scrap-rat');
  });

  it('introduces Sawbug in wave 3 as a threat-2 ranged spitter', () => {
    expect(RUN_BALANCE.enemyPools[0].entries.map(entry => entry.id)).toEqual(['scrap-rat']);
    expect(RUN_BALANCE.enemyPools[1].entries.map(entry => entry.id)).toEqual(['scrap-rat', 'rust-hound']);
    expect(RUN_BALANCE.enemyPools[2].entries.map(entry => entry.id)).toEqual(['scrap-rat', 'rust-hound', 'sawbug']);
    const sawbug = RUN_BALANCE.enemyPools[2].entries.find(entry => entry.id === 'sawbug');
    expect(sawbug).toMatchObject({ id: 'sawbug', threat: 2 });
    expect(RUN_BALANCE.enemyRoles.sawbug).toMatchObject({
      role: 'ranged-spitter',
      threat: 2,
      behaviorConfig: { preferredRangeMax: 380, stationaryFireRangeMax: 430, projectileSpeed: 275, projectileDamage: 11, telegraphMs: 320 }
    });
  });

  it('keeps Rat as the roster backbone while phasing Hound and Sawbug in gradually', () => {
    expect(RUN_BALANCE.enemyPools[1].entries).toMatchObject([
      { id: 'scrap-rat', weight: .84 },
      { id: 'rust-hound', weight: .16 }
    ]);
    expect(RUN_BALANCE.enemyPools[2].entries).toMatchObject([
      { id: 'scrap-rat', weight: .70 },
      { id: 'rust-hound', weight: .18 },
      { id: 'sawbug', weight: .12 }
    ]);
    expect(RUN_BALANCE.enemyPools[9].entries).toMatchObject([
      { id: 'scrap-rat', weight: .52 },
      { id: 'rust-hound', weight: .25 },
      { id: 'sawbug', weight: .23 }
    ]);
    expect(RUN_BALANCE.waves[0]).toMatchObject({ threatBudget: 15, activeCap: 26, spawnIntervalMs: 720 });
    expect(RUN_BALANCE.waves[9]).toMatchObject({ threatBudget: 46, activeCap: 44, spawnIntervalMs: 425 });
  });

  it('turns a run Rust Hound into a readable hunter instead of a constant-speed chaser', () => {
    const hound: any = {
      active: true,
      speed: 210,
      baseSpeed: 210,
      threatValue: 2,
      behaviorConfig: { slideSpeed: 360, telegraphMs: 220, cooldownMinMs: 1050 }
    };
    applyRunEnemyRoleProfile(hound, 'rust-hound');
    expect(hound.__runRole).toBe('hunter');
    expect(hound.threatValue).toBe(3);
    expect(hound.speed).toBeCloseTo(151.2, 6);
    expect(hound.baseSpeed).toBeCloseTo(151.2, 6);
    expect(hound.behaviorConfig.slideSpeed).toBe(360);
    expect(hound.behaviorConfig.telegraphMs).toBe(300);
    expect(hound.behaviorConfig.cooldownMinMs).toBe(1450);
  });

  it('keeps Fleet Feet meaningful but capped to roughly nine percent above base speed', () => {
    expect(RUN_BALANCE.player.fleetFeetPercent).toBe(.03);
    expect(RUN_BALANCE.player.fleetFeetMaxLevel).toBe(3);
    expect(RUN_BALANCE.player.moveSpeedHardCap).toBe(280);
    expect(getPlayerMoveSpeed(255, 0)).toBe(255);
    expect(getPlayerMoveSpeed(255, 1)).toBeCloseTo(262.65, 5);
    expect(getPlayerMoveSpeed(255, 3)).toBeCloseTo(278.645385, 5);
    expect(getPlayerMoveSpeed(255, 99)).toBeCloseTo(278.645385, 5);
  });

  it('routes the live Fleet Feet card through canonical Upgrade System stat ownership', async () => {
    const phaseC = await readFile(new URL('../../src/phase-c-runtime.js', import.meta.url), 'utf8');
    expect(phaseC).toContain("createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' })");
    expect(phaseC).toContain('RUN_BALANCE.player.moveSpeedHardCap');
    expect(phaseC).not.toContain('getPlayerMoveSpeed');
    expect(phaseC).not.toContain('__baseHeroMoveSpeed');
    expect(phaseC).not.toContain('Math.min(310, scene.heroSpeed * 1.06)');
  });

  it('keeps global speed scaling restrained while HP/damage grow by wave', () => {
    expect(getEnemyDifficultyMultipliers(0)).toEqual({ hp: 1, damage: 1, speed: 1 });
    expect(getEnemyDifficultyMultipliers(599)).toEqual({ hp: 1.9, damage: 1.36, speed: 1.09 });
  });

  it('blocks spawns by the current pressure budget as well as active count', () => {
    const active = [{ active: true, threatValue: 6 }, { active: true, threatValue: 5 }];
    const scene: any = {
      runTime: 0,
      gameOver: false,
      enemies: {
        children: { iterate: (fn: any) => active.forEach(fn) },
        countActive: () => active.length
      }
    };
    const director = new RunDirector(scene);
    expect(director.getState().threatBudget).toBe(12);
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
