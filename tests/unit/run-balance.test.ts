import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  RUN_BALANCE,
  applyRunEnemyRoleProfile,
  getEnemyDifficultyMultipliers,
  getPlayerMoveSpeed,
  getRunDirectorState,
  getSpawnPressureSnapshot
} from '../../src/balance/run-balance.js';

describe('Run Balance v2', () => {
  it('uses the requested opening wave mix and pressure budget', () => {
    expect(RUN_BALANCE.runDirector.waveCount).toBe(6);
    expect(RUN_BALANCE.runDirector.openingBudget).toBe(13);
    expect(RUN_BALANCE.runDirector.openingActiveCap).toBe(24);
    expect(RUN_BALANCE.runDirector.openingWave).toEqual([
      { enemyId: 'scrap-rat', count: 7, elite: false },
      { enemyId: 'rust-hound', count: 1, elite: false },
      { enemyId: 'sawbug', count: 1, elite: false }
    ]);
  });

  it('keeps the run on a lull-build-surge-breather director loop', () => {
    expect(getRunDirectorState(0).phase).toBe('lull');
    expect(getRunDirectorState(20).phase).toBe('build');
    expect(getRunDirectorState(50).phase).toBe('surge');
    expect(getRunDirectorState(80).phase).toBe('breather');
    expect(getRunDirectorState(110).phase).toBe('lull');
  });

  it('keeps the live wave balance monotonic without runaway active caps', () => {
    const waves = [0, 1, 2, 3, 4, 5].map(wave => getSpawnPressureSnapshot(wave));
    expect(waves[0]).toMatchObject({ budget: 13, activeCap: 24, wave: 1 });
    for (let index = 1; index < waves.length; index++) {
      expect(waves[index].budget).toBeGreaterThanOrEqual(waves[index - 1].budget);
      expect(waves[index].activeCap).toBeGreaterThanOrEqual(waves[index - 1].activeCap);
    }
    expect(waves.at(-1)?.activeCap).toBeLessThanOrEqual(RUN_BALANCE.runDirector.maxActiveCap);
  });

  it('keeps Scrap Rat as the cheap common pressure unit', () => {
    const rat: any = {
      enemyId: 'scrap-rat',
      speed: 88,
      baseSpeed: 88,
      threatValue: 1,
      behaviorConfig: { chaseSharpness: 5.8 }
    };
    applyRunEnemyRoleProfile(rat, 'scrap-rat');
    expect(rat.__runRole).toBe('swarm');
    expect(rat.threatValue).toBe(1);
    expect(rat.speed).toBe(88);
    expect(rat.baseSpeed).toBe(88);
    expect(rat.behaviorConfig.chaseSharpness).toBe(5.8);
  });

  it('keeps Sawbug as ranged anti-camp pressure instead of a contact tank', () => {
    const sawbug: any = {
      enemyId: 'sawbug',
      speed: 72,
      baseSpeed: 72,
      threatValue: 2,
      behaviorConfig: {
        preferredRangeMin: 250,
        preferredRangeMax: 380,
        retreatDistance: 205,
        projectileSpeed: 275,
        cooldownMinMs: 420,
        cooldownMaxMs: 600,
        telegraphMs: 320
      }
    };
    applyRunEnemyRoleProfile(sawbug, 'sawbug');
    expect(sawbug.__runRole).toBe('ranged');
    expect(sawbug.threatValue).toBe(2);
    expect(sawbug.speed).toBe(72);
    expect(sawbug.baseSpeed).toBe(72);
    expect(sawbug.behaviorConfig.preferredRangeMin).toBe(230);
    expect(sawbug.behaviorConfig.preferredRangeMax).toBe(360);
    expect(sawbug.behaviorConfig.retreatDistance).toBe(185);
    expect(sawbug.behaviorConfig.projectileSpeed).toBe(275);
    expect(sawbug.behaviorConfig.cooldownMinMs).toBe(720);
    expect(sawbug.behaviorConfig.cooldownMaxMs).toBe(980);
    expect(sawbug.behaviorConfig.telegraphMs).toBe(360);
  });

  it('keeps Rust Hound as the hunter with committed telegraph windows', () => {
    const hound: any = {
      enemyId: 'rust-hound',
      speed: 168,
      baseSpeed: 168,
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
    const pressure = getSpawnPressureSnapshot(scene, 0);
    expect(pressure.currentThreat).toBe(11);
    expect(pressure.budget).toBe(13);
    expect(pressure.canSpawnThreat(1)).toBe(true);
    expect(pressure.canSpawnThreat(3)).toBe(false);
  });
});
