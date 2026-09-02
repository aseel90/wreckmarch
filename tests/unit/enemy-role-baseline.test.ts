import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { RUNNER_CHARACTER } from '../../src/characters/definitions/runner.js';
import { RUST_HOUND_DEFINITION } from '../../src/enemies/definitions/rust-hound.js';
import { SAWBUG_DEFINITION } from '../../src/enemies/definitions/sawbug.js';
import { SCRAP_RAT_DEFINITION } from '../../src/enemies/definitions/scrap-rat.js';
import { RUN_BALANCE, getPlayerMoveSpeed } from '../../src/balance/run-balance.js';

const wave10SpeedMultiplier = RUN_BALANCE.waves[9].speedMultiplier;

describe('WS15 Runner enemy-role baseline', () => {
  it('keeps run pacing separate from canonical enemy combat tuning', async () => {
    const balanceSource = await readFile(new URL('../../src/balance/run-balance.js', import.meta.url), 'utf8');
    const directorSource = await readFile(new URL('../../src/balance/run-director.js', import.meta.url), 'utf8');
    const houndSource = await readFile(new URL('../../src/enemies/behaviors/hound-pounce.js', import.meta.url), 'utf8');

    expect(balanceSource).toContain("getEnemyDefinition('rust-hound')");
    expect(balanceSource).toContain("getEnemyDefinition('sawbug')");
    expect(balanceSource).toContain('behaviorConfig: RUST_HOUND_DEFINITION.behaviorConfig');
    expect(balanceSource).toContain('behaviorConfig: SAWBUG_DEFINITION.behaviorConfig');
    expect(balanceSource).not.toContain('slideRangeMin: 100');
    expect(balanceSource).not.toContain('preferredRangeMin: 250');
    expect(balanceSource).not.toContain('chaseSpeedMultiplier: .72');
    expect(directorSource).not.toContain('currentSpeed * speedMultiplier');
    expect(directorSource).not.toContain('currentBaseSpeed * speedMultiplier');
    expect(houndSource).toContain('const chaseMultiplier = Number(cfg.chaseSpeedMultiplier) || 1');

    expect(RUN_BALANCE.enemyRoles['rust-hound'].behaviorConfig).toMatchObject(RUST_HOUND_DEFINITION.behaviorConfig);
    expect(RUN_BALANCE.enemyRoles.sawbug.behaviorConfig).toMatchObject(SAWBUG_DEFINITION.behaviorConfig);
  });

  it('keeps Scrap Rat as swarm pressure rather than an unavoidable solo chaser', () => {
    const runnerSpeed = RUNNER_CHARACTER.stats.moveSpeed;
    const ratLateMaxSpeed = SCRAP_RAT_DEFINITION.variants.normal.speedMax * wave10SpeedMultiplier;
    const wave10Pool = RUN_BALANCE.enemyPools[9].entries;
    const rat = wave10Pool.find(entry => entry.id === 'scrap-rat');
    const hound = wave10Pool.find(entry => entry.id === 'rust-hound');
    const sawbug = wave10Pool.find(entry => entry.id === 'sawbug');

    expect(SCRAP_RAT_DEFINITION.behavior).toBe('chase');
    expect(SCRAP_RAT_DEFINITION.threatValue).toBe(1);
    expect(ratLateMaxSpeed).toBeLessThan(runnerSpeed);
    expect(rat).toBeTruthy();
    expect(hound).toBeTruthy();
    expect(sawbug).toBeTruthy();
    expect(rat!.weight).toBeGreaterThan(hound!.weight);
    expect(rat!.weight).toBeGreaterThan(sawbug!.weight);
  });

  it('keeps Rust Hound as a readable hunter: slower chase, faster committed slide', () => {
    const runnerSpeed = RUNNER_CHARACTER.stats.moveSpeed;
    const cfg = RUST_HOUND_DEFINITION.behaviorConfig;
    const lateChaseMax = RUST_HOUND_DEFINITION.variants.normal.speedMax
      * wave10SpeedMultiplier
      * cfg.chaseSpeedMultiplier;
    const slideTravel = cfg.slideSpeed * (cfg.slideMs / 1000);
    const runnerResponseTravel = runnerSpeed * ((cfg.telegraphMs + cfg.slideMs) / 1000);

    expect(RUN_BALANCE.enemyRoles['rust-hound']).toMatchObject({ role: 'hunter', threat: 3 });
    expect(cfg).toMatchObject({
      chaseSpeedMultiplier: .72,
      slideRangeMin: 100,
      slideRangeMax: 270,
      holdRange: 130,
      telegraphMs: 300,
      cooldownMinMs: 1450,
      cooldownMaxMs: 1850,
      slideSpeed: 360
    });
    expect(lateChaseMax).toBeLessThan(runnerSpeed);
    expect(cfg.slideSpeed).toBeGreaterThan(getPlayerMoveSpeed(runnerSpeed, 3));
    expect(runnerResponseTravel).toBeGreaterThan(slideTravel);
  });

  it('keeps Sawbug as ranged anti-camp pressure with a reachable projectile envelope', () => {
    const runnerSpeed = RUNNER_CHARACTER.stats.moveSpeed;
    const cfg = SAWBUG_DEFINITION.behaviorConfig;
    const projectileReach = cfg.projectileSpeed * (cfg.projectileLifeMs / 1000);
    const nearReactionSeconds = (cfg.telegraphMs / 1000) + (cfg.preferredRangeMin / cfg.projectileSpeed);
    const runnerNearReactionTravel = runnerSpeed * nearReactionSeconds;

    expect(RUN_BALANCE.enemyRoles.sawbug).toMatchObject({ role: 'ranged-spitter', threat: 2 });
    expect(cfg.retreatRange).toBeLessThan(cfg.preferredRangeMin);
    expect(cfg.preferredRangeMin).toBeLessThan(cfg.preferredRangeMax);
    expect(cfg.stationaryFireRangeMax).toBeGreaterThan(cfg.preferredRangeMax);
    expect(cfg.stationaryCooldownMultiplier).toBeLessThan(1);
    expect(projectileReach).toBeGreaterThan(cfg.stationaryFireRangeMax);
    expect(runnerNearReactionTravel).toBeGreaterThan(cfg.projectileRadius * 4);
  });
});
