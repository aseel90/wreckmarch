import { describe, expect, it } from 'vitest';
import { RunTelemetry } from '../../src/telemetry/run-telemetry.js';

const group = (items: any[]) => ({ getChildren: () => items });
const baseScene = () => ({
  runTime: 1,
  level: 1,
  scrap: 0,
  heroHp: 100,
  heroMaxHp: 100,
  hero: { x: 0, y: 0 },
  lastShot: 0,
  enemies: group([]),
  bullets: group([]),
  __runDirectorState: {
    wave: 1,
    pressurePhase: 'lull',
    threatBudget: 15,
    activeCap: 26,
    spawnIntervalMs: 720,
    hpMultiplier: 1,
    damageMultiplier: 1,
    speedMultiplier: 1
  },
  upgradeLevels: {},
  upgradeRarityHistory: {},
  runStatState: { resolve: () => ({ weapon: { damage: 24 } }) }
}) as any;

describe('WS21 projectile performance telemetry', () => {
  it('records projectile spawn pressure and active projectile classes without owning combat behavior', () => {
    const scene = baseScene();
    const telemetry = new RunTelemetry(scene, {
      reportIdFactory: () => 'wm-ws21-pressure',
      now: () => 1000
    });

    const heroA: any = { active: true, isCritical: false, hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    const heroB: any = { active: true, isCritical: true, hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    const shrapnelA: any = { active: true, projectileKind: 'shrapnel', isSecondaryProjectile: true, hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    const supportA: any = { active: true, projectileKind: 'support', hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };

    scene.runTime = 1.1;
    scene.bullets = group([heroA, heroB, shrapnelA, supportA]);
    telemetry.update(16);

    const shrapnelB: any = { active: true, projectileKind: 'shrapnel', isSecondaryProjectile: true, hitEnemies: new Set(), pierceRemaining: 0, ricochetRemaining: 0 };
    scene.runTime = 1.8;
    scene.bullets = group([heroA, heroB, shrapnelA, shrapnelB, supportA]);
    telemetry.update(16);

    heroA.active = false;
    shrapnelA.active = false;
    scene.runTime = 2.2;
    scene.bullets = group([heroB, shrapnelB, supportA]);
    telemetry.update(40);

    const report: any = telemetry.finalize();

    expect(report.projectiles.spawned).toBe(5);
    expect(report.performance.peakActiveProjectiles).toBe(5);
    expect(report.performance.peakActiveHeroProjectiles).toBe(2);
    expect(report.performance.peakActiveShrapnel).toBe(2);
    expect(report.performance.peakActiveSupportProjectiles).toBe(1);
    expect(report.performance.peakProjectileSpawns1s).toBe(5);
    expect(report.performance.averageProjectileSpawnsPerSecond).toBeCloseTo(5 / 2.2, 2);
    expect(report.performance.longFrames).toBe(1);
  });
});
